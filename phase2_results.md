# Phase 3 Results: ML-Based Anomaly Detection

## Overview
This document summarizes the final performance benchmarks of the smart grid anomaly detection system using the Isolation Forest algorithm. We transitioned from binary detection to **Multi-Level Classification** to distinguish between Standard FDIA (-1) and Stress Attacks (-2).

## Final Leaderboard
| Performance Metric | Approach 1: Mixed | Approach 2: Proper |
| :--- | :--- | :--- |
| **Logic Basis** | Blind dataset mix | **Pure Physics (Normal Only)** |
| **FDIA Detection Rate (-1)** | 70.35% | **96.99%** |
| **Stress Detection Rate (-2)** | 97.82% | **97.97%** |
| **Overall F1-Score** | 0.8303 | **0.9174** (Detection Mode) |
| **Status** | Missed Req | ✅ **PASSED (>85%)** |

## Implementation Details

### Approach 1 (Mixed Baseline)
- **Script**: `train_if_mixed.py`
- **Result**: Showed high accuracy for obvious "Stress" attacks but struggled with subtle FDIA manipulations (70% detection).

### Approach 2 (Proper Semi-Supervised)
- **Script**: `train_if_proper.py`
- **Highlights**: 
    - Trained strictly on `normal_dataset.csv` to learn nominal grid harmonics.
    - Implemented **Double-Thresholding**:
        - **$T_1$ (Normal vs Anomaly)**: Optimized for 97% grid coverage.
        - **$T_2$ (FDIA vs Stress)**: Tuned to distinguish intensity based on anomaly score depth.
    - **Result**: Successfully caught nearly 97% of all cyber-physical threats.

## Artifacts
The final trained model is exported as `model_proper_multilevel.pkl` and is ready for the Phase 4 Forensic Dashboard integration.
