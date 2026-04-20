import pandas as pd
import numpy as np
import os
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

def main():
    print("--- Phase 3: ML-Based Anomaly Detection ---")
    data_dir = r"d:\idp_project\datasets"
    
    normal_path = os.path.join(data_dir, "normal_dataset.csv")
    fdia_path = os.path.join(data_dir, "fdia_dataset.csv")
    stress_path = os.path.join(data_dir, "stress_fdia_dataset.csv")

    print("[1/5] Loading datasets from d:/idp_project/datasets...")
    df_normal = pd.read_csv(normal_path)
    df_fdia = pd.read_csv(fdia_path)
    df_stress = pd.read_csv(stress_path)
    
    # ---------------------------------------------------------
    # SEMI-SUPERVISED (NORMAL-ONLY) TRAINING LOGIC
    # ---------------------------------------------------------
    print("\n[2/5] Preparing Semi-Supervised Data Splits...")
    
    # Split Normal data into 80% Train / 20% Test
    normal_train, normal_test = train_test_split(df_normal, test_size=0.2, random_state=42)
    
    # Training Set: Only Normal Data (M9 requirement)
    X_train = normal_train.drop(columns=['label'])
    
    # Testing Set: 20% Normal + All Attacks
    test_mix = pd.concat([normal_test, df_fdia, df_stress], ignore_index=True)
    X_test = test_mix.drop(columns=['label'])
    
    # Map Labels for Evaluation (In IF: 1=Normal, -1=Anomaly)
    # 0 = Normal, Anything else = Anomaly
    y_test_if = test_mix['label'].apply(lambda x: 1 if x == 0 else -1)

    print(f"Training Samples (Normal Only): {len(X_train)}")
    print(f"Testing Samples (Mixed):        {len(X_test)}")
    print(f"  - Normal in Test:  {(y_test_if == 1).sum()}")
    print(f"  - Attacks in Test: {(y_test_if == -1).sum()}")

    print("\n[3/5] Scaling features (StandardScaler)...")
    scaler = StandardScaler()
    # Fit scaler ONLY on training data to prevent leakage
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # For Semi-supervised, we assume the normal training data is "mostly" clean.
    # We set a small contamination (e.g. 2%) to represent natural noise/outliers in stable grid physics.
    CONTAMINATION = 0.02 
    
    print(f"\n[4/5] Training Isolation Forest (M9) on Normal Profile...")
    model = IsolationForest(
        n_estimators=150, 
        max_samples='auto', 
        contamination=CONTAMINATION, 
        random_state=42
    )
    model.fit(X_train_scaled)

    print("\n[5/5] Evaluating Offline Baseline Metrics (M10)...")
    y_pred = model.predict(X_test_scaled)

    # Metrics (Targeting -1 as the positive class for attack detection)
    acc = accuracy_score(y_test_if, y_pred)
    prec = precision_score(y_test_if, y_pred, pos_label=-1)
    rec = recall_score(y_test_if, y_pred, pos_label=-1)
    f1 = f1_score(y_test_if, y_pred, pos_label=-1)

    print("-" * 40)
    print("=== Isolation Forest Results ===")
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    print("-" * 40)
    print("\nDetailed Classification Report:")
    print(classification_report(y_test_if, y_pred, target_names=["Anomaly (-1)", "Normal (1)"]))

    # Save model and scaler
    model_path = r"d:\idp_project\smart-grid-fdi-analysis\isolation_forest_model.pkl"
    scaler_path = r"d:\idp_project\smart-grid-fdi-analysis\scaler.pkl"
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    print(f"\nModel saved to {model_path}")
    print(f"Scaler saved to {scaler_path}")

if __name__ == '__main__':
    main()
