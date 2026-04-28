# Bus Localization Post Attack Detection

Once an anomaly is detected, a bus-level localization layer is activated to identify which specific buses are likely compromised. For each bus, key electrical parameters—active power demand (Pd), reactive power demand (Qd), voltage magnitude (Vm), and voltage angle (Va)—are compared against statistically derived baseline profiles from the normal dataset. Z-score analysis is used individually for each parameter to measure deviation from expected operational norms, with parameter-specific thresholds applied to determine abnormality. Buses exceeding threshold conditions across one or more critical parameters are flagged as suspicious, generating an initial list of potentially attacked nodes.

## Threshold Setting

Each bus is individually analyzed using its four critical operational parameters:

- Active power demand (Pd)
- Reactive power demand (Qd)
- Voltage magnitude (Vm)
- Voltage angle (Va)

Since each parameter follows a distinct statistical distribution under normal IEEE 14-bus operation, separate baseline profiles are established for every parameter at every bus using the normal dataset.

For each feature:

- Mean (μ)
- Standard deviation (σ)

are calculated across all baseline samples.

### Z-Score Formula

```text
Z = (Current Value - Baseline Mean) / Baseline Standard Deviation
```
This score quantifies how many standard deviations the current measurement deviates from expected normal behavior, allowing anomaly severity to be standardized despite differences in parameter units or natural variation.

Because voltage, power demand, and phase angle each behave differently, a universal threshold is not physically meaningful.

## Parameter-Specific Thresholds

```text
Upper Threshold = μ + 3σ
Lower Threshold = μ - 3σ
```
This creates customized anomaly boundaries for each parameter, ensuring that:

Naturally volatile features are not over-flagged
Tightly regulated parameters remain sensitive to suspicious deviations

## Bus Flagging Logic
A bus is flagged when one or more of its parameters exceed their individual thresholds.

Severity can be ranked based on:

Number of violated parameters
Magnitude of deviation

Once threshold violations are identified, bus-level anomaly scores are aggregated to prioritize the most suspicious nodes.

## Physics-Based Validation
Rather than assuming every deviation is dangerous, suspicious buses are further validated by reinserting their modified values into the IEEE 14-bus simulation and analyzing actual physical system impact.

Validation includes:
Voltage collapse
Branch overload
Power imbalance
Generator instability
Convergence failure

Through this layered approach:

Z-score analysis provides statistically rigorous localization
Parameter-specific thresholds preserve physical realism
Simulation-based validation ensures final flagged buses represent impactful FDIA threats rather than isolated statistical noise

# Multi-Distribution Statistical Verification Framework for Precise Bus-Level FDIA Localization

To improve precision and reduce false positives, bus anomaly detection does not rely solely on deviation from normal operating behavior.

Instead, each parameter (Pd, Qd, Vm, Va) is evaluated across multiple reference distributions:

Normal baseline dataset
Gaussian perturbation dataset
Stress/time-based FDIA dataset

## Layer 1: Normal Distribution Verification

For each parameter:
```
-3 ≤ Z_normal ≤ 3
```
If the value remains within this range:

Operationally plausible
Not immediately suspicious

If outside:

Statistically significant deviation
Deeper validation required

## Layer 2: Attack Distribution Verification

Suspicious values are then cross-checked against Gaussian and stress-based attack distributions.

Attack-state threshold:
```
-1 ≤ Z_attack ≤ 1
```

This stricter threshold verifies whether the anomaly aligns with known attack-like operational patterns.

Interpretation:
Within attack range → stronger FDIA likelihood
Outside attack range → may be random fluctuation
Final Bus Reporting Criteria

A bus is reported only if:

### Condition 1:

Significant deviation from normal baseline

### Condition 2:

Strong statistical consistency with Gaussian or stress-based attack distributions

# Final Benefits

This dual-verification framework provides:

Reduced false positives
Higher localization precision
Improved explainability
Better alignment with realistic attack behavior
Stronger cyber-physical validation
