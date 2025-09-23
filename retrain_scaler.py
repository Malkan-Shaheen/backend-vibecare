import pandas as pd
import joblib
from sklearn.preprocessing import MinMaxScaler

# Load dataset
df = pd.read_csv("Filtered_Dataset.csv")

# Select only feature columns
feature_columns = [f"B{i}" for i in range(1, 22)]
features = df[feature_columns]

# Apply MinMaxScaler (Normalize between 0 and 1)
scaler = MinMaxScaler(feature_range=(0, 1))
scaler.fit(features)

# Save the updated scaler
joblib.dump(scaler, "scaler.pkl")

print("\n✅ Using MinMaxScaler Instead!")
print("✅ Min Value (After Scaling):", scaler.data_min_)
print("✅ Max Value (After Scaling):", scaler.data_max_)
