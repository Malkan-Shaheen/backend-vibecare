from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model as tf_load_model
from tensorflow.keras.losses import MeanSquaredError
import os

app = Flask(__name__)
CORS(app)

print("🔄 Loading models and scalers...")

# Base directory for models
BASE_DIR = os.path.dirname(os.path.abspath(__file__))   # backend/
MODEL_DIR = os.path.join(BASE_DIR, "Models_App")        # backend/Models_App

# -------------------------- Recomendations rough --------------------
suggestion_model = None
label_encoder = None

def load_suggestion_models():
    global suggestion_model, label_encoder
    try:
        import sys, numpy
        sys.modules["numpy._core"] = numpy.core
        
        suggestion_model = joblib.load(os.path.join(MODEL_DIR, "model_suggest.joblib"))
        label_encoder = joblib.load(os.path.join(MODEL_DIR, "label_encoder_suggest.joblib"))
        print("✅ Suggestion model and label encoder loaded successfully")
    except Exception as e:
        print(f"❌ Error loading suggestion model files: {str(e)}")
        raise

# ---------------------- STRESS MODULE ----------------------
stress_model = None
stress_scaler = None

def load_stress_model():
    global stress_model, stress_scaler
    try:
        stress_model = tf_load_model(os.path.join(MODEL_DIR, "stress_model.h5"))
        stress_scaler = joblib.load(os.path.join(MODEL_DIR, "scaler3.pkl"))
        print("✅ Stress model and scaler loaded.")
    except Exception as e:
        print(f"❌ Error loading stress model: {e}")

# ---------------------- SUGGESTION MODULE ----------------------
suggestion_model_v2 = None
suggestion_label_encoder = None

def load_suggestion_model_v2():
    global suggestion_model_v2, suggestion_label_encoder
    try:
        suggestion_model_v2 = joblib.load(os.path.join(MODEL_DIR, "suggestion_model.pkl"))
        print("✅ Suggestion model v2 loaded.")
    except Exception as e:
        print("❌ Error loading suggestion model v2:", e)

    try:
        suggestion_label_encoder = joblib.load(os.path.join(MODEL_DIR, "depression_scaler.pkl"))
        print("✅ Suggestion label encoder loaded.")
    except Exception as e:
        print("❌ Error loading suggestion label encoder:", e)

# ---------------------- DEPRESSION MODULE ----------------------
depression_model = None

def load_depression_model():
    global depression_model
    try:
        depression_model = tf_load_model(os.path.join(MODEL_DIR, "depression_model.h5"), compile=False)
        depression_model.compile(optimizer='adam', loss=MeanSquaredError(), metrics=['mse'])
        print("✅ Depression model loaded.")
    except Exception as e:
        print(f"❌ Error loading depression model: {e}")

# ---------------------- ANXIETY MODULE ----------------------
anxiety_model = None

def load_anxiety_model():
    global anxiety_model
    try:
        anxiety_model = joblib.load(os.path.join(MODEL_DIR, "anxiety_model.pkl"))
        print("✅ Anxiety model loaded.")
    except Exception as e:
        print("❌ Error loading anxiety model:", e)

# Load all models when starting the server
load_suggestion_models()
load_stress_model()
load_suggestion_model_v2()
load_depression_model()
load_anxiety_model()

# ---------------------- ROUTES ----------------------
@app.route('/')
def home():
    return "✅ Flask backend is running."


@app.route('/features', methods=['GET'])
def get_model_features():
    try:
        features_info = {}

        # Stress Model
        features_info['stress_features'] = [
            'anxiety_level', 'self_esteem', 'mental_health_history', 'depression', 
            'headache', 'blood_pressure', 'sleep_quality', 'breathing_problem', 
            'noise_level', 'living_conditions', 'safety', 'basic_needs', 
            'academic_performance', 'study_load', 'teacher_student_relationship', 
            'future_career_concerns', 'social_support', 'peer_pressure', 
            'extracurricular_activities', 'bullying'
        ]

        # Suggestion Model
        features_info['suggestion_features'] = [
            'depression_level', 'stress_level', 'anxiety_level',
            'age', 'gender', 'relationship', 'living_situation'
        ]

        # Anxiety Model
        features_info['anxiety_features'] = [
            "Gender", "Age", "numbness", "wobbliness", "afraidofworsthappening",
            "heartpounding", "unsteadyorunstable", "terrified", "handstrembling",
            "shakystate", "difficultyinbreathing", "scared", "hotorcoldsweats", "faceflushed"
        ]

        # Depression Model
        features_info['depression_features'] = "21 BDI questionnaire responses"

        return jsonify(features_info)

    except Exception as e:
        return jsonify({'error': str(e)})

# ---------------- Stress Prediction ----------------
@app.route('/predict_stress', methods=['POST'])
def predict_stress():
    try:
        if stress_model is None or stress_scaler is None:
            return jsonify({'error': 'Stress model not loaded'}), 500

        data = request.get_json()
        
        features = [
            'anxiety_level', 'self_esteem', 'mental_health_history', 'depression', 
            'headache', 'blood_pressure', 'sleep_quality', 'breathing_problem', 
            'noise_level', 'living_conditions', 'safety', 'basic_needs', 
            'academic_performance', 'study_load', 'teacher_student_relationship', 
            'future_career_concerns', 'social_support', 'peer_pressure', 
            'extracurricular_activities', 'bullying'
        ]
        
        input_data = [float(data[feature]) for feature in features]
        input_df = pd.DataFrame([input_data], columns=features)
        input_scaled = stress_scaler.transform(input_df)
        
        prediction = stress_model.predict(input_scaled)
        predicted_class = int(np.argmax(prediction, axis=1)[0])
        confidence = float(np.max(prediction)) * 100
        
        stress_levels = {
            0: 'Low Stress',
            1: 'Medium Stress',
            2: 'High Stress'
        }
        
        result = {
            'stress_level': stress_levels[predicted_class],
            'confidence': float(round(confidence, 2)),
            'details': {
                'Low Stress': float(round(prediction[0][0] * 100, 2)),
                'Medium Stress': float(round(prediction[0][1] * 100, 2)),
                'High Stress': float(round(prediction[0][2] * 100, 2))
            }
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ---------------- Suggestion Prediction ----------------
@app.route('/predict_suggestion', methods=['POST'])
def predict_suggestion():
    try:
        if suggestion_model is None or label_encoder is None:
            return jsonify({'error': 'Suggestion model not loaded'}), 500

        data = request.get_json()
        
        required_fields = [
            'depression_level', 'stress_level', 'anxiety_level',
            'age', 'gender', 'relationship', 'living_situation'
        ]
        
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'message': f'Missing required field: {field}'
                }), 400

        # Create DataFrame with proper feature names
        input_data = pd.DataFrame([[
            int(data['depression_level']),
            int(data['stress_level']),
            int(data['anxiety_level']),
            int(data['age']),
            int(data['gender']),
            int(data['relationship']),
            int(data['living_situation'])
        ]], columns=[
            'depression_level', 'stress_level', 'anxiety_level',
            'age', 'gender', 'relationship', 'living_situation'
        ])
        
        encoded_prediction = suggestion_model.predict(input_data)
        suggestion = label_encoder.inverse_transform(encoded_prediction)[0]
        
        return jsonify({
            'status': 'success',
            'recommendation': suggestion
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# ---------------- Depression Prediction ----------------
def interpret_depression_score(score):
    if score < 11:
        return "Normal Ups and Downs"
    elif score < 17:
        return "Mild Mood Disturbance"
    elif score < 21:
        return "Borderline clinical depression"
    elif score < 31:
        return "Moderate depression"
    elif score < 41:
        return "Severe depression"
    else:
        return "Extreme depression"

@app.route('/predict_depression', methods=['POST'])
def predict_depression():
    try:
        if depression_model is None:
            return jsonify({'error': 'Depression model not loaded'}), 500

        data = request.json.get("responses")
        if not data or len(data) != 21:
            return jsonify({"error": "Expected 21 responses."}), 400

        input_array = np.array([data])
        prediction = depression_model.predict(input_array)[0][0]

        bdi_score = sum(data)
        depression_level = interpret_depression_score(bdi_score)

        return jsonify({
            "depression_level": depression_level,
            "bdi_score": bdi_score
        })

    except Exception as e:
        print("❌ ERROR in depression prediction:", str(e))
        return jsonify({"error": str(e)}), 500

# ---------------- Anxiety Prediction ----------------
@app.route('/predict_anxiety', methods=['POST'])
def predict_anxiety():
    try:
        if anxiety_model is None:
            return jsonify({'error': 'Anxiety model not loaded'}), 500

        data = request.get_json()

        features = [
            data['Gender'],
            data['Age'],
            data['numbness'],
            data['wobbliness'],
            data['afraidofworsthappening'],
            data['heartpounding'],
            data['unsteadyorunstable'],
            data['terrified'],
            data['handstrembling'],
            data['shakystate'],
            data['difficultyinbreathing'],
            data['scared'],
            data['hotorcoldsweats'],
            data['faceflushed']
        ]

        prediction = anxiety_model.predict([features])[0]

        return jsonify({'predicted_anxiety_level': int(prediction)})

    except Exception as e:
        print("❌ ERROR in anxiety prediction:", str(e))
        return jsonify({"error": str(e)}), 500

# ---------------------- SERVER START ----------------------
if __name__ == '__main__':
    print("🚀 Starting Flask server on 0.0.0.0:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)