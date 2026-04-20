# Approach 1 Results: Mixed Training Anomaly Detection

## Overview
This approach uses a "Blind Mix" of both normal and attack data during the training phase. It assumes that the contamination ratio of the grid is known beforehand.

## Dataset Split
- **Training**: 80% of combined (Normal + FDIA + Stress) data.
- **Testing**: 20% of combined data.
- **Contamination Parameter**: 54.66% (Manually thresholded).

## Performance Metrics
| Metric | Value |
| :--- | :--- |
| **Accuracy** | 81.37% |
| **Precision** | 82.75% |
| **Recall** | 83.31% |
| **F1-Score** | **83.03%** |

## Conclusion
While effective, this approach missed the **>85% F1 requirement**. It lacks the "physics-awareness" of a purely nominal training and is less realistic for a live deployment where the attack ratio is unknown.

## Artifacts
- **Training Script**: `train_if_mixed.py`
- **Model**: `model_mixed.pkl`
- **Scaler**: `scaler_mixed.pkl`
