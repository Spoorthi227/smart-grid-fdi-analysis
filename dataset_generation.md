# IEEE 14-Bus FDIA Dataset Generation (MATPOWER-Based)

## Overview

This document describes a **complete, research-oriented pipeline** for generating a dataset for **False Data Injection Analysis (FDIA)** using the IEEE 14-bus system in MATLAB (MATPOWER).

The dataset is designed to:

* Reflect **realistic power system behavior**
* Include **normal and perturbed states**
* Use **physics-based validation** for labeling
* Support **anomaly detection models** (e.g., Isolation Forest)

---

# Core Idea

Instead of blindly labeling injected data as anomalies:

> **We generate system states → simulate power flow → evaluate grid health → assign labels**

This ensures:

* Realism
* Physical correctness
* Strong research contribution

---

# Dataset Structure

Each row contains:

```
[ Pd(14) | Qd(14) | Vm(14) | Va(14) | label ]
```

### 🔹 Features:

* **Pd (14):** Active power demand at each bus
* **Qd (14):** Reactive power demand
* **Vm (14):** Voltage magnitude (p.u.)
* **Va (14):** Voltage angle (degrees)

👉 Total features: **56**

### 🔹 Label:

* `0` → Normal / Safe
* `1` → Anomalous / Unsafe
* *(Optional)* `2` → Critical state

---

# Dataset Composition

| Scenario    | Type                      | Count |
| ----------- | ------------------------- | ----- |
| Normal      | No perturbation           | 3000  |
| FDIA Type 1 | Gaussian perturbation     | 3000  |
| FDIA Type 2 | Stress-based perturbation | 2000  |

👉 Total: **8000 samples**

---

# Scenario Design

## Scenario 1: Normal Operation

* Load varies randomly within ±10%
* No perturbation applied
* Represents natural system variability

---

## Scenario 2: Gaussian Perturbation

* Small noise added to selected buses
* Simulates:

  * sensor errors
  * subtle anomalies

### Injection:

```
Vm = Vm + N(0, σ²)
Va = Va + small noise
```

* Random buses affected (2–4)
* σ ≈ 0.01 (tunable)

---

## Scenario 3: Stress-Based Perturbation

* System pushed to **high load condition**
* Perturbation applied only when system is stressed

### Stress condition:

```
min(Vm) < 1.0
```

* Models realistic vulnerability scenarios

---

# Physics-Based Verification Layer

Instead of labeling based only on injection, we validate using **grid health indicators** to verify that the data point generated for that scenario fits it well before assigning it a label. Ex: A gauusian pertubation may not be an attack for the real grid when simulated or a normal scenario may be fatal for grid when run.

---

## A. Voltage Stability

* **Limits:**

  ```
  Vm < 0.95 or Vm > 1.1
  ```
* **Deviation:**

  ```
  max(|Vm - 1.0|) > 0.05
  ```
* **Minimum Voltage:**

  ```
  min(Vm) < 0.97
  ```

---

## B. Angle Stability

* Voltage angle spread:

  ```
  max(Va) - min(Va) > 30°
  ```

---

## C. Line Loading

* Thermal overload condition:

  ```
  |Pf| > 0.9 × rating
  ```

---

## D. Power Loss

* Increased losses indicate stress
* Threshold derived from normal data

---

## E. Power Balance

```
|Total Generation - Total Load| > tolerance
```

---

## F. Generator Limits

```
Pg > Pmax OR Pg < Pmin
```

---

## G. Convergence Check

```
Power flow fails → system unstable
```

---

# Danger Score Computation

All indicators are combined:

```
danger_score =
    voltage_flags +
    angle_flag +
    line_flag +
    loss_flag +
    balance_flag +
    generator_flag +
    convergence_flag
```

---

# Labeling Strategy


## Multi-Level Classification

```
0 → Normal
1 → Mild anomaly
2 → Critical state
```

---

# Full Pipeline

```
Load IEEE 14 system
        ↓
Randomize loads
        ↓
Run power flow (MATPOWER)
        ↓
Extract Vm, Va
        ↓
Inject perturbation (if applicable)
        ↓
Run validation checks
        ↓
Compute danger score
        ↓
Assign label
        ↓
Store dataset
```

---

# Output

* `fdia_dataset.mat` → MATLAB format
* `fdia_dataset.csv` → for ML models

Shape:

```
8000 × 57
(56 features + 1 label)
```

---

# Key Insights

### Statistical ≠ Physical

* Gaussian noise may look normal
* But can still destabilize the grid

---

### Timing Matters

* Same perturbation:

  * Safe at low load
  * Dangerous at high load

---

### Hybrid Intelligence

This approach combines:

* **Statistical modeling (ML)**
* **Physical system validation**

---

# Research Contribution

This dataset enables:

* Realistic anomaly detection studies
* Evaluation under varying system stress
* Comparison of ML models
* Study of detection limits

---

# Suggested Next Steps

1. Train:

   * Isolation Forest
   * Autoencoder

2. Evaluate:

   * Accuracy
   * Precision
   * Recall
   * F1-score

3. Analyze:

   * Effect of perturbation magnitude
   * Detection under stress conditions

---

# Final Note

> This is not just dataset generation 
> it is a **controlled simulation of power system behavior under perturbations**, grounded in both **data science and electrical system physics**.

---
