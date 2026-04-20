import pandas as pd
import numpy as np
import os
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, precision_recall_curve

def main():
    print("--- Approach 2: Proper Semi-Supervised Anomaly Detection ---")
    data_dir = r"d:\idp_project\datasets"
    
    # Load
    df_normal = pd.read_csv(os.path.join(data_dir, "normal_dataset.csv"))
    df_fdia = pd.read_csv(os.path.join(data_dir, "fdia_dataset.csv"))
    df_stress = pd.read_csv(os.path.join(data_dir, "stress_fdia_dataset.csv"))

    # Mapping
    df_normal['lbl_if'] = 1  # Normal
    df_fdia['lbl_if'] = -1  # Anomaly
    df_stress['lbl_if'] = -1 # Anomaly

    # Split Normal into Train / Val / Test
    norm_train, norm_rest = train_test_split(df_normal, test_size=0.3, random_state=42)
    norm_val, norm_test = train_test_split(norm_rest, test_size=0.5, random_state=42)

    # Split Attacks into Val / Test
    fdia_val, fdia_test = train_test_split(df_fdia, test_size=0.5, random_state=42)
    stress_val, stress_test = train_test_split(df_stress, test_size=0.5, random_state=42)

    # 1. Training (Normal Only)
    X_train = norm_train.drop(columns=['label', 'lbl_if'])
    
    # 2. Validation (Mixed) - To find best threshold for any anomaly
    val_set = pd.concat([norm_val, fdia_val, stress_val], ignore_index=True)
    X_val = val_set.drop(columns=['label', 'lbl_if'])
    # Normal -> 1, Any Attack -> -1
    y_val = val_set['label'].apply(lambda x: 1 if x == 0 else -1)
    
    # 3. Final Test (Mixed)
    test_set = pd.concat([norm_test, fdia_test, stress_test], ignore_index=True)
    X_test = test_set.drop(columns=['label', 'lbl_if'])
    y_test = test_set['label'].apply(lambda x: 1 if x == 0 else -1)

    # Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    # Train IF (Semi-supervised)
    model = IsolationForest(n_estimators=200, contamination=0.05, random_state=42)
    model.fit(X_train_scaled)

    # Threshold Optimization on Validation Set
    print("\nOptimizing Detection Threshold...")
    scores_val = model.decision_function(X_val_scaled)
    thresholds = np.linspace(np.min(scores_val), np.max(scores_val), 100)
    
    best_f1 = 0
    best_threshold = 0
    for t in thresholds:
        y_pred_val = np.where(scores_val > t, 1, -1)
        f = f1_score(y_val, y_pred_val, pos_label=-1)
        if f > best_f1:
            best_f1 = f
            best_threshold = t

    print(f"Optimal Detection Threshold: {best_threshold:.4f} (Val F1: {best_f1:.4f})")

    # Final Classification Logic
    scores_test = model.decision_function(X_test_scaled)
    y_pred_test = np.where(scores_test > best_threshold, 1, -1)

    # --- Reporting ---
    print("-" * 40)
    print("=== Approach 2: Binary Anomaly Detection Metrics ===")
    
    acc = accuracy_score(y_test, y_pred_test)
    prec = precision_score(y_test, y_pred_test, pos_label=-1)
    rec = recall_score(y_test, y_pred_test, pos_label=-1)
    f1 = f1_score(y_test, y_pred_test, pos_label=-1)

    print(f"Overall Accuracy:  {acc:.4f}")
    print(f"Precision:         {prec:.4f}")
    print(f"Recall (Det Rate): {rec:.4f}")
    print(f"F1-Score:          {f1:.4f}")
    print("-" * 40)
    print("\nDetailed Classification Report:")
    from sklearn.metrics import classification_report
    print(classification_report(y_test, y_pred_test, target_names=["Anomaly (-1)", "Normal (1)"]))

    # Save Bundle
    data_to_save = {
        'model': model,
        'scaler': scaler,
        'threshold': best_threshold
    }
    dump_path = r"d:\idp_project\smart-grid-fdi-analysis\model_proper.pkl"
    joblib.dump(data_to_save, dump_path)
    print(f"Saved binary model to: {dump_path}")

if __name__ == '__main__':
    main()
