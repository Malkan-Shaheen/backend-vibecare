from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model as tf_load_model
from tensorflow.keras.losses import MeanSquaredError
from tensorflow.keras.preprocessing.image import img_to_array
import os
import cv2
import base64
from io import BytesIO
from PIL import Image
import traceback

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

# ---------------------- FACE EXPRESSION MODULE ----------------------
face_expression_model = None
face_cascade = None

def load_face_expression_model():
    global face_expression_model, face_cascade
    try:
        # Load model from Models_App folder
        model_path = os.path.join(MODEL_DIR, "model.h5")
        
        # Try to find cascade classifier in multiple locations
        cascade_path = None
        
        # 1. Check in Models_App folder
        cascade_path_models = os.path.join(MODEL_DIR, "HaarcascadeclassifierCascadeClassifier.xml")
        if os.path.exists(cascade_path_models):
            cascade_path = cascade_path_models
        
        # 2. Check in face-expression folder (if it exists)
        if not cascade_path:
            face_expr_dir = os.path.join(BASE_DIR, "..", "face-expression")
            cascade_path_face_expr = os.path.join(face_expr_dir, "HaarcascadeclassifierCascadeClassifier.xml")
            if os.path.exists(cascade_path_face_expr):
                cascade_path = cascade_path_face_expr
        
        # 3. Check in current directory
        if not cascade_path:
            cascade_path_base = os.path.join(BASE_DIR, "HaarcascadeclassifierCascadeClassifier.xml")
            if os.path.exists(cascade_path_base):
                cascade_path = cascade_path_base
        
        # 4. Use OpenCV's default cascade classifier as fallback
        if not cascade_path:
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            print("   ⚠️  Using OpenCV default cascade classifier")
        
        if os.path.exists(model_path):
            face_cascade = cv2.CascadeClassifier(cascade_path)
            face_expression_model = tf_load_model(model_path, compile=False)
            face_expression_model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
            print(f"✅ Face expression model loaded from: {model_path}")
            print(f"✅ Cascade classifier loaded from: {cascade_path}")
        else:
            print(f"⚠️  Face expression model not found at: {model_path}")
            print("   Feature will be disabled.")
    except Exception as e:
        print(f"❌ Error loading face expression model: {e}")
        import traceback
        print(traceback.format_exc())

# Load all models when starting the server
print("🔍 STARTING MODEL LOADING PROCESS...")
load_suggestion_models()
load_stress_model()
load_suggestion_model_v2()
load_depression_model()
load_anxiety_model()
load_face_expression_model()
print("🎯 ALL MODELS LOADING COMPLETED")

# ---------------------- ROUTES ----------------------
@app.route('/')
def home():
    print("\n" + "="*50)
    print("🏠 ROOT ENDPOINT CALLED")
    print("="*50)
    response = "✅ Flask backend is running."
    print(f"📤 Returning: {response}")
    return response

@app.route('/test_json', methods=['GET'])
def test_json():
    print("\n" + "="*50)
    print("🧪 TEST_JSON ENDPOINT CALLED")
    print("="*50)
    try:
        response_data = {
            "status": "success", 
            "message": "JSON test successful",
            "timestamp": "test"
        }
        print(f"📤 Returning JSON: {response_data}")
        return jsonify(response_data)
    except Exception as e:
        print(f"❌ ERROR in test_json: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/features', methods=['GET'])
def get_model_features():
    print("\n" + "="*50)
    print("📋 FEATURES ENDPOINT CALLED")
    print("="*50)
    try:
        print("🔧 Building features info...")
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

        print(f"📤 Returning features info with {len(features_info)} categories")
        return jsonify(features_info)

    except Exception as e:
        print(f"❌ ERROR in features endpoint: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)})

# ---------------- Stress Prediction ----------------
@app.route('/predict_stress', methods=['POST'])
def predict_stress():
    print("\n" + "="*50)
    print("😰 STRESS PREDICTION ENDPOINT CALLED")
    print("="*50)
    try:
        print("🔍 Checking stress model availability...")
        if stress_model is None or stress_scaler is None:
            print("❌ Stress model not loaded")
            return jsonify({'error': 'Stress model not loaded'}), 500

        print("📥 Getting request data...")
        data = request.get_json()
        print(f"📦 Received data: {data}")
        
        if not data:
            print("❌ No JSON data received")
            return jsonify({'error': 'No JSON data received'}), 400

        features = [
            'anxiety_level', 'self_esteem', 'mental_health_history', 'depression', 
            'headache', 'blood_pressure', 'sleep_quality', 'breathing_problem', 
            'noise_level', 'living_conditions', 'safety', 'basic_needs', 
            'academic_performance', 'study_load', 'teacher_student_relationship', 
            'future_career_concerns', 'social_support', 'peer_pressure', 
            'extracurricular_activities', 'bullying'
        ]
        
        print(f"🔧 Processing {len(features)} features...")
        input_data = [float(data[feature]) for feature in features]
        print(f"📊 Input data prepared: {input_data}")
        
        input_df = pd.DataFrame([input_data], columns=features)
        print("📈 Dataframe created")
        
        input_scaled = stress_scaler.transform(input_df)
        print("⚖️ Data scaled")
        
        print("🤖 Making prediction...")
        prediction = stress_model.predict(input_scaled)
        print(f"🎯 Raw prediction: {prediction}")
        
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
        
        print(f"📤 Returning result: {result}")
        return jsonify(result)
    
    except Exception as e:
        print(f"❌ ERROR in stress prediction: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

# ---------------- Suggestion Prediction ----------------
@app.route('/predict_suggestion', methods=['POST'])
def predict_suggestion():
    print("\n" + "="*50)
    print("💡 SUGGESTION PREDICTION ENDPOINT CALLED")
    print("="*50)
    try:
        print("🔍 Checking suggestion model availability...")
        if suggestion_model is None or label_encoder is None:
            print("❌ Suggestion model not loaded")
            return jsonify({'error': 'Suggestion model not loaded'}), 500

        print("📥 Getting request data...")
        data = request.get_json()
        print(f"📦 Received data: {data}")
        
        if not data:
            print("❌ No JSON data received")
            return jsonify({'error': 'No JSON data received'}), 400

        required_fields = [
            'depression_level', 'stress_level', 'anxiety_level',
            'age', 'gender', 'relationship', 'living_situation'
        ]
        
        print(f"🔍 Checking required fields: {required_fields}")
        for field in required_fields:
            if field not in data:
                print(f"❌ Missing field: {field}")
                return jsonify({
                    'status': 'error',
                    'message': f'Missing required field: {field}'
                }), 400

        print("✅ All required fields present")
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
        
        print(f"📊 Input dataframe: {input_data.values.tolist()}")
        
        print("🤖 Making prediction...")
        encoded_prediction = suggestion_model.predict(input_data)
        print(f"🎯 Encoded prediction: {encoded_prediction}")
        
        suggestion = label_encoder.inverse_transform(encoded_prediction)[0]
        print(f"💡 Decoded suggestion: {suggestion}")
        
        response = {
            'status': 'success',
            'recommendation': suggestion
        }
        
        print(f"📤 Returning response: {response}")
        return jsonify(response)
    
    except Exception as e:
        print(f"❌ ERROR in suggestion prediction: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# ---------------- Depression Prediction ----------------
def interpret_depression_score(score):
    print(f"🔍 Interpreting depression score: {score}")
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
    print("\n" + "="*50)
    print("😔 DEPRESSION PREDICTION ENDPOINT CALLED")
    print("="*50)
    try:
        print("🔍 Checking depression model availability...")
        if depression_model is None:
            print("❌ Depression model not loaded")
            return jsonify({'error': 'Depression model not loaded'}), 500

        print("📥 Getting request data...")
        data = request.get_json()
        print(f"📦 Received data: {data}")
        
        if not data:
            print("❌ No JSON data received")
            return jsonify({"error": "No JSON data received"}), 400

        responses = data.get("responses")
        print(f"📋 Responses received: {responses}")
        
        if not responses or len(responses) != 21:
            print(f"❌ Invalid responses length: {len(responses) if responses else 0}")
            return jsonify({"error": "Expected 21 responses."}), 400

        print("🔧 Preparing input data...")
        input_array = np.array([responses])
        print(f"📊 Input array shape: {input_array.shape}")
        
        print("🤖 Making prediction...")
        prediction = depression_model.predict(input_array)[0][0]
        print(f"🎯 Raw prediction: {prediction}")

        bdi_score = sum(responses)
        print(f"📊 BDI Score calculated: {bdi_score}")
        
        depression_level = interpret_depression_score(bdi_score)
        print(f"🔍 Depression level: {depression_level}")

        response = {
            "depression_level": depression_level,
            "bdi_score": bdi_score
        }
        
        print(f"📤 Returning response: {response}")
        return jsonify(response)

    except Exception as e:
        print(f"❌ ERROR in depression prediction: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

# ---------------- Anxiety Prediction ----------------
@app.route('/predict_anxiety', methods=['POST'])
def predict_anxiety():
    print("\n" + "="*50)
    print("😰 ANXIETY PREDICTION ENDPOINT CALLED")
    print("="*50)
    try:
        print("🔍 Checking anxiety model availability...")
        if anxiety_model is None:
            print("❌ Anxiety model not loaded")
            return jsonify({'error': 'Anxiety model not loaded'}), 500

        print("📥 Getting request data...")
        data = request.get_json()
        print(f"📦 Received data: {data}")
        
        if not data:
            print("❌ No JSON data received")
            return jsonify({"error": "No JSON data received"}), 400

        features = [
            'Gender', 'Age', 'numbness', 'wobbliness', 'afraidofworsthappening',
            'heartpounding', 'unsteadyorunstable', 'terrified', 'handstrembling',
            'shakystate', 'difficultyinbreathing', 'scared', 'hotorcoldsweats', 'faceflushed'
        ]
        
        print(f"🔍 Extracting {len(features)} features...")
        feature_values = []
        for feature in features:
            if feature not in data:
                print(f"❌ Missing feature: {feature}")
                return jsonify({"error": f"Missing feature: {feature}"}), 400
            feature_values.append(data[feature])
        
        print(f"📊 Feature values: {feature_values}")

        print("🤖 Making prediction...")
        prediction = anxiety_model.predict([feature_values])[0]
        print(f"🎯 Raw prediction: {prediction}")

        response = {'predicted_anxiety_level': int(prediction)}
        print(f"📤 Returning response: {response}")
        return jsonify(response)

    except Exception as e:
        print(f"❌ ERROR in anxiety prediction: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

# ---------------- Face Expression Prediction ----------------
@app.route('/predict_face_expression', methods=['POST'])
def predict_face_expression():
    try:
        print("\n" + "="*60)
        print("🔍 FACE EXPRESSION DETECTION REQUEST RECEIVED")
        print("="*60)
        
        if face_expression_model is None or face_cascade is None:
            print("❌ ERROR: Face expression model not loaded")
            return jsonify({'error': 'Face expression model not loaded'}), 500

        # Get image from request
        if 'image' not in request.files and 'image' not in request.json:
            print("❌ ERROR: No image provided in request")
            return jsonify({'error': 'No image provided'}), 400
        
        print("📷 Processing image...")
        
        # Handle base64 encoded image (from React Native)
        if 'image' in request.json:
            image_data = request.json['image']
            print("   - Image format: Base64 (from React Native)")
            # Remove data URL prefix if present
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Decode base64 image
            image_bytes = base64.b64decode(image_data)
            nparr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        else:
            # Handle file upload
            print("   - Image format: File upload")
            file = request.files['image']
            image_bytes = file.read()
            nparr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            print("❌ ERROR: Could not decode image")
            return jsonify({'error': 'Could not decode image'}), 400
        
        print(f"   ✅ Image decoded successfully")
        print(f"   📐 Image dimensions: {frame.shape[1]}x{frame.shape[0]} pixels")
        
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        print("   🔄 Converted to grayscale")
        
        # Detect faces
        print("   🔍 Detecting faces...")
        faces = face_cascade.detectMultiScale(gray)
        print(f"   👤 Total faces detected: {len(faces)}")
        
        if len(faces) == 0:
            print("   ⚠️  No faces found in the image")
            print("="*60 + "\n")
            return jsonify({
                'faces_detected': 0,
                'predictions': [],
                'message': 'No faces detected in the image'
            })
        
        emotion_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise']
        
        # Process ONLY the first face (single image processing)
        if len(faces) > 0:
            x, y, w, h = faces[0]
            print(f"\n   📍 Processing FIRST face only:")
            print(f"      - Location: ({x}, {y})")
            print(f"      - Size: {w}x{h} pixels")
            
            # Extract face ROI
            roi_gray = gray[y:y+h, x:x+w]
            roi_gray = cv2.resize(roi_gray, (48, 48), interpolation=cv2.INTER_AREA)
            print(f"      - Resized to: 48x48 pixels (model input size)")
            
            if np.sum([roi_gray]) != 0:
                # Preprocess for model
                roi = roi_gray.astype('float') / 255.0
                roi = img_to_array(roi)
                roi = np.expand_dims(roi, axis=0)
                
                # Predict emotion
                print("      🤖 Running emotion prediction model...")
                prediction = face_expression_model.predict(roi, verbose=0)[0]
                emotion_index = prediction.argmax()
                emotion_label = emotion_labels[emotion_index]
                confidence = float(prediction[emotion_index]) * 100
                
                print(f"\n   📊 PREDICTION RESULTS:")
                print(f"      🎯 Predicted Emotion: {emotion_label}")
                print(f"      📈 Confidence: {confidence:.2f}%")
                print(f"\n   📋 All Emotion Probabilities:")
                
                # Get all emotion probabilities
                emotion_probs = {}
                for j in range(len(emotion_labels)):
                    prob = float(prediction[j]) * 100
                    emotion_probs[emotion_labels[j]] = prob
                    print(f"      - {emotion_labels[j]:12s}: {prob:6.2f}%")
                
                result = {
                    'face_number': 1,
                    'bounding_box': {
                        'x': int(x),
                        'y': int(y),
                        'width': int(w),
                        'height': int(h)
                    },
                    'predicted_emotion': emotion_label,
                    'confidence': round(confidence, 2),
                    'all_emotions': emotion_probs
                }
                
                print(f"\n   ✅ Processing complete!")
                print(f"   📤 Returning result: {emotion_label} ({confidence:.2f}% confidence)")
                print("="*60 + "\n")
                
                return jsonify({
                    'faces_detected': 1,
                    'predictions': [result]
                })
            else:
                print("   ❌ ERROR: Could not process face region (empty ROI)")
                print("="*60 + "\n")
                return jsonify({
                    'faces_detected': 0,
                    'predictions': [],
                    'message': 'Could not process face region'
                })
        
    except Exception as e:
        print(f"\n❌ ERROR in face expression prediction: {str(e)}")
        import traceback
        print(traceback.format_exc())
        print("="*60 + "\n")
        return jsonify({"error": str(e)}), 500

# Add global error handler
@app.errorhandler(Exception)
def handle_exception(e):
    print(f"\n❌ GLOBAL ERROR HANDLER TRIGGERED: {str(e)}")
    print(traceback.format_exc())
    return jsonify({
        'status': 'error',
        'message': 'Internal server error',
        'error': str(e)
    }), 500

# Add after_request handler to log responses
@app.after_request
def after_request(response):
    print(f"📤 Response status: {response.status_code}")
    print(f"📤 Response content-type: {response.content_type}")
    return response

# ---------------------- SERVER START ----------------------
if __name__ == '__main__':
    print("🚀 Starting Flask server on 0.0.0.0:5000")
    print("🔧 Debug mode: ON")
    print("📡 Server will be available at:")
    print("   - http://10.110.10.86:5000")
    print("   - http://10.110.10.86:5000")
    print("🎯 Test endpoint available at: /test_json")
    app.run(debug=True, host='0.0.0.0', port=5000)