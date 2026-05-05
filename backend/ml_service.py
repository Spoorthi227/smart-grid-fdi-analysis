import os
import joblib
import numpy as np
from flask import Flask, request, jsonify

app = Flask(__name__)

# Load the multi-level Isolation Forest bundle
MODEL_PATH = r"d:\idp_project\smart-grid-fdi-analysis\model_proper_multilevel.pkl"

if os.path.exists(MODEL_PATH):
    bundle = joblib.load(MODEL_PATH)
    model = bundle['model']
    scaler = bundle['scaler']
    t1_normal = bundle['t1_normal']
    t2_stress = bundle['t2_stress']
    print(f"Model loaded successfully.")
    print(f"Thresholds -> Normal(T1): {t1_normal:.4f}, Stress(T2): {t2_stress:.4f}")
else:
    print(f"ERROR: Model not found at {MODEL_PATH}")
    model = None

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500

    try:
        data = request.json
        if not data or 'features' not in data:
            return jsonify({'error': 'Missing features'}), 400
        
        # Extract features and convert to 2D numpy array
        features = data['features']
        
        if len(features) != 56:
            return jsonify({'error': f'Expected 56 features, got {len(features)}'}), 400
            
        X = np.array(features).reshape(1, -1)
        
        # Scale the features
        X_scaled = scaler.transform(X)
        
        # Get anomaly score
        score = model.decision_function(X_scaled)[0]
        
        # Apply Double Thresholding Logic
        if score <= t2_stress:
            label = -2  # Stress attack
        elif score <= t1_normal:
            label = -1  # FDIA
        else:
            label = 1   # Normal
            
        # If label is < 0, it's an attack
        is_attack = 1 if label < 0 else 0
        
        return jsonify({
            'attack': is_attack,
            'label': label,
            'score': float(score)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Run on port 5000
    print("Starting ML inference service on port 5000...")
    app.run(host='127.0.0.1', port=5000)
