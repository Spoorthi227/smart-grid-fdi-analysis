import os
import joblib
import numpy as np
from flask import Flask, request, jsonify

app = Flask(__name__)

MODEL_PATH = r"D:\smart-grid-fdi\backend\model_proper_multilevel.pkl"

# ================= LOAD MODEL =================
if os.path.exists(MODEL_PATH):
    bundle = joblib.load(MODEL_PATH)
    model = bundle['model']
    scaler = bundle['scaler']
    t1_normal = bundle['t1_normal']
    t2_stress = bundle['t2_stress']

    print("\n================ MODEL LOADED ================")
    print(f"Model: {type(model)}")
    print(f"Scaler: {type(scaler)}")
    print(f"Threshold Normal (T1): {t1_normal}")
    print(f"Threshold Stress (T2): {t2_stress}")
    print("=============================================\n")

else:
    print("ERROR: Model not found at", MODEL_PATH)
    model = None


# ================= API =================
@app.route('/predict', methods=['POST'])
def predict():

    print("\n---------------- NEW REQUEST ----------------")

    if model is None:
        print("MODEL NOT LOADED")
        return jsonify({'error': 'Model not loaded'}), 500

    try:
        data = request.json

        print("Raw request received:", data)

        if not data or 'features' not in data:
            print("Missing 'features' key")
            return jsonify({'error': 'Missing features'}), 400

        features = data['features']

        print("Feature length received:", len(features))

        if len(features) != 56:
            print("INVALID FEATURE SIZE ERROR")
            return jsonify({'error': f'Expected 56 features, got {len(features)}'}), 400

        # ================= CONVERT =================
        X = np.array(features, dtype=np.float64).reshape(1, -1)

        print("Input shape:", X.shape)
        print("Sample values (first 5):", X[0][:5])

        # ================= SANITIZE =================
        if not np.isfinite(X).all():
            print("WARNING: NaN or Inf detected → cleaning data")
            X = np.nan_to_num(X, nan=0.0, posinf=1e6, neginf=-1e6)

        # ================= SCALING =================
        print("Applying scaler...")

        X_scaled = scaler.transform(X)

        print("Scaling done")

        # ================= MODEL =================
        score = model.decision_function(X_scaled)[0]

        print("Anomaly score:", score)

        # ================= DECISION =================
        if score <= t2_stress:
            label = -2
            print("CLASS: STRESS ATTACK")
        elif score <= t1_normal:
            label = -1
            print("CLASS: FDIA ATTACK")
        else:
            label = 1
            print("CLASS: NORMAL")

        is_attack = 1 if label < 0 else 0

        print("Final label:", label, "Attack flag:", is_attack)
        print("---------------- END REQUEST ----------------\n")

        return jsonify({
            'attack': is_attack,
            'label': label,
            'score': float(score)
        })

    except Exception as e:
        print("\n!!!!!!!! PIPELINE CRASH !!!!!!!!")
        print("Error:", str(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")

        return jsonify({'error': str(e)}), 500


# ================= RUN =================
if __name__ == '__main__':
    print("Starting ML inference service on port 5000...")
    app.run(host='127.0.0.1', port=5000, debug=True)