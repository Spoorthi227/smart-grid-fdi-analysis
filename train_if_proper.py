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
    
    # 2. Validation (Mixed) - To find best thresholds
    val_set = pd.concat([norm_val, fdia_val, stress_val], ignore_index=True)
    X_val = val_set.drop(columns=['label', 'lbl_if'])
    # Map for multi-level validation: 0->1 (Normal), 1->-1 (FDIA), 2->-2 (Stress)
    y_val_raw = val_set['label'].map({0: 1, 1: -1, 2: -1}) # First find anomaly threshold
    
    # 3. Final Test (Mixed)
    test_set = pd.concat([norm_test, fdia_test, stress_test], ignore_index=True)
    X_test = test_set.drop(columns=['label', 'lbl_if'])
    y_test_raw = test_set['label'] # Keep 0, 1, 2 for final breakdown

    # Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    # Train IF (Semi-supervised)
    model = IsolationForest(n_estimators=200, contamination=0.05, random_state=42)
    model.fit(X_train_scaled)

    # --- Threshold 1: Normal vs Anomaly ---
    print("\nOptimizing Threshold 1 (Normal vs Anomaly)...")
    scores_val = model.decision_function(X_val_scaled)
    thresholds = np.linspace(np.min(scores_val), np.max(scores_val), 100)
    
    best_f1 = 0
    t1_normal = 0
    for t in thresholds:
        y_pred_val = np.where(scores_val > t, 1, -1)
        f = f1_score(y_val_raw, y_pred_val, pos_label=-1)
        if f > best_f1:
            best_f1 = f
            t1_normal = t

    # --- Threshold 2: FDIA vs Stress ---
    # We look at the score distribution of anomalies to find a cutoff for Stress (-2)
    print("Optimizing Threshold 2 (FDIA vs Stress)...")
    scores_test_raw = model.decision_function(X_test_scaled)
    
    # Logic: Score > T1 (Normal), T2 < Score < T1 (FDIA -1), Score < T2 (Stress -2)
    # We'll set T2 based on the mean score of stress attacks in the val set
    val_stress_scores = scores_val[val_set['label'] == 2]
    t2_stress = np.percentile(val_stress_scores, 70) # Set T2 at 70th percentile of stress scores

    print(f"Thresholds -> T1 (Normal): {t1_normal:.4f}, T2 (Stress): {t2_stress:.4f}")

    # --- Final Classification Logic ---
    final_scores = model.decision_function(X_test_scaled)
    y_pred_final = []
    for s in final_scores:
        if s > t1_normal:
            y_pred_final.append(1)  # Predicted Normal
        elif s > t2_stress:
            y_pred_final.append(-1) # Predicted FDIA
        else:
            y_pred_final.append(-2) # Predicted Stress Attack

    y_pred_final = np.array(y_pred_final)
    
    # Map Ground Truth for 3-class comparison: 0->1, 1->-1, 2->-2
    y_test_mapped = []
    for val in y_test_raw:
        if val == 0: y_test_mapped.append(1)
        elif val == 1: y_test_mapped.append(-1)
        elif val == 2: y_test_mapped.append(-2)
    y_test_mapped = np.array(y_test_mapped)

    # --- Reporting ---
    print("-" * 40)
    print("=== Approach 2: Multi-Level Detection Metrics ===")
    
    # Individual Detection Rates
    fdia_samples = y_test_mapped == -1
    stress_samples = y_test_mapped == -2
    
    fdia_det_rate = (y_pred_final[fdia_samples] != 1).mean()
    stress_det_rate = (y_pred_final[stress_samples] != 1).mean()
    
    # Classification Accuracy (Correct -1 vs -2)
    correct_class = (y_pred_final == y_test_mapped).mean()

    print(f"FDIA Detection Rate:   {fdia_det_rate:.2%}")
    print(f"Stress Detection Rate: {stress_det_rate:.2%}")
    print(f"Overall Class Accuracy: {correct_class:.2%}")
    print("-" * 40)

    # Multi-class F1 (weighted)
    final_f1 = f1_score(y_test_mapped, y_pred_final, average='weighted')
    print(f"Weighted F1-Score: {final_f1:.4f}")

    # Save Bundle
    data_to_save = {
        'model': model,
        'scaler': scaler,
        't1_normal': t1_normal,
        't2_stress': t2_stress
    }
    dump_path = r"d:\idp_project\smart-grid-fdi-analysis\model_proper_multilevel.pkl"
    joblib.dump(data_to_save, dump_path)
    print(f"Saved: {dump_path}")

if __name__ == '__main__':
    main()
