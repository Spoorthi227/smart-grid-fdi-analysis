import pandas as pd
import numpy as np
import os
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

def main():
    print("--- Approach 1: Mixed Training Anomaly Detection ---")
    data_dir = r"d:\idp_project\datasets"
    
    # Load all 3 CSVs
    df_normal = pd.read_csv(os.path.join(data_dir, "normal_dataset.csv"))
    df_fdia = pd.read_csv(os.path.join(data_dir, "fdia_dataset.csv"))
    df_stress = pd.read_csv(os.path.join(data_dir, "stress_fdia_dataset.csv"))

    # Merge everything for Mixed Training
    df_full = pd.concat([df_normal, df_fdia, df_stress], ignore_index=True)
    
    # Map Labels: 0 -> 1 (Normal), non-zero -> -1 (Anomaly)
    X = df_full.drop(columns=['label'])
    y = df_full['label'].apply(lambda x: 1 if x == 0 else -1)
    
    print(f"Total Combined Samples: {len(df_full)}")
    print(f"Normal Samples: {(y == 1).sum()}")
    print(f"Attack Samples: {(y == -1).sum()}")

    # 80/20 Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    contamination_ratio = (y_train == -1).sum() / len(y_train)
    print(f"\nTarget Contamination Ratio: {contamination_ratio:.4f}")

    # Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train
    # Scikit-learn limits contamination to (0.0, 0.5]. 
    # For higher contamination, we train with 'auto' and threshold manually.
    model = IsolationForest(
        n_estimators=100, 
        contamination='auto', 
        random_state=42
    )
    model.fit(X_train_scaled)

    # Manual Thresholding for high contamination
    scores_train = model.decision_function(X_train_scaled)
    # The threshold should be the (contamination_ratio) percentile of scores
    threshold = np.percentile(scores_train, contamination_ratio * 100)
    print(f"Calculated Score Threshold for {contamination_ratio:.2%} contamination: {threshold:.4f}")

    # Evaluate
    scores_test = model.decision_function(X_test_scaled)
    y_pred = np.where(scores_test > threshold, 1, -1)
    
    # Ground Truth breakdown
    # Check if we are detecting label 1 vs label 2 in the test set
    test_indices = X_test.index
    y_true_orig = df_full.iloc[test_indices]['label'].values
    
    fdia_samples = (y_true_orig == 1)
    stress_samples = (y_true_orig == 2)
    
    fdia_det_rate = (y_pred[fdia_samples] == -1).mean()
    stress_det_rate = (y_pred[stress_samples] == -1).mean()

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, pos_label=-1)
    rec = recall_score(y_test, y_pred, pos_label=-1)
    f1 = f1_score(y_test, y_pred, pos_label=-1)

    print("-" * 40)
    print("=== Approach 1: Mixed Metrics ===")
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    print(f"\nFDIA Detection:   {fdia_det_rate:.2%}")
    print(f"Stress Detection: {stress_det_rate:.2%}")
    print("-" * 40)

    # Save
    model_path = r"d:\idp_project\smart-grid-fdi-analysis\model_mixed.pkl"
    scaler_path = r"d:\idp_project\smart-grid-fdi-analysis\scaler_mixed.pkl"
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    print(f"Saved: {model_path}")

if __name__ == '__main__':
    main()
