#**Bus Localization Post Attack Detection**

Once an anomaly is detected, a bus-level localization layer is activated to identify which specific buses are likely compromised. For each bus, key electrical parameters—active power demand (Pd), reactive power demand (Qd), voltage magnitude (Vm), and voltage angle (Va)—are compared against statistically derived baseline profiles from the normal dataset. Z-score analysis is used individually for each parameter to measure deviation from expected operational norms, with parameter-specific thresholds applied to determine abnormality. Buses exceeding threshold conditions across one or more critical parameters are flagged as suspicious, generating an initial list of potentially attacked nodes.

##**Threshold setting:**
each bus is individually analyzed using its four critical operational parameters: active power demand (Pd), reactive power demand (Qd), voltage magnitude (Vm), and voltage angle (Va). Since each parameter follows a distinct statistical distribution under normal IEEE 14-bus operation, separate baseline profiles are established for every parameter at every bus using the normal dataset. For each feature, the mean (μ) and standard deviation (σ) are calculated across all baseline samples. The Z-score for a real-time measurement is then computed as:
Z = (Current Value - Baseline Mean) / Baseline Standard Deviation

This score quantifies how many standard deviations the current measurement deviates from expected normal behavior, allowing anomaly severity to be standardized despite differences in parameter units or natural variation.

Because voltage, power demand, and phase angle each behave differently, a universal threshold is not physically meaningful. Instead, parameter-specific upper and lower thresholds are defined independently for every feature, typically using statistical confidence intervals such as:

Upper Threshold = μ + 3σ  
Lower Threshold = μ - 3σ

This creates customized anomaly boundaries for each parameter, ensuring that naturally volatile features are not over-flagged while tightly regulated parameters remain sensitive to suspicious deviations. For example, voltage magnitude may have narrow acceptable deviations, while power demand may tolerate larger fluctuations. A bus is flagged when one or more of its parameters exceed their individual thresholds, and the severity can be ranked based on the number and magnitude of threshold violations.

Once threshold violations are identified, bus-level anomaly scores are aggregated to prioritize the most suspicious nodes. Rather than assuming every deviation is dangerous, suspicious buses are further validated by reinserting their modified values into the IEEE 14-bus simulation and analyzing actual physical system impact. This includes evaluating voltage collapse, branch overload, power imbalance, and generator instability. Through this layered approach, Z-score analysis provides statistically rigorous localization, parameter-specific thresholds preserve physical realism, and simulation-based validation ensures that the final flagged buses represent genuinely impactful FDIA threats rather than isolated statistical noise.

#**Multi-Distribution Statistical Verification Framework for Precise Bus-Level FDIA Localization**

To improve precision and reduce false positives, bus anomaly detection should not rely solely on deviation from normal operating behavior. Instead, each parameter (Pd, Qd, Vm, Va) is evaluated across multiple reference distributions: the baseline normal dataset, the Gaussian perturbation dataset, and the stress/time-based FDIA dataset. The first verification layer uses the normal operational profile, where a Z-score is computed for each parameter relative to the normal mean and standard deviation. If the parameter remains within the statistically accepted normal range:

-3 ≤ Z_normal ≤ 3

then the value is considered operationally plausible and not immediately suspicious. Values outside this range indicate statistically significant deviation from healthy grid behavior and trigger deeper validation.

The second verification layer cross-checks suspicious values against attack-oriented distributions to determine whether the deviation aligns with known adversarial or stressed system patterns. Separate Z-scores are calculated relative to the Gaussian and stress scenario baselines. Here, stricter thresholds are used because these datasets represent narrower malicious or vulnerable operational envelopes. For example:

-1 ≤ Z_attack ≤ 1
or equivalently values falling within approximately the top 90% confidence region of attack-state distributions. If a parameter strongly aligns with these attack distributions while simultaneously deviating from normal behavior, it becomes a much stronger indicator of realistic FDIA rather than random noise or benign fluctuation.

A bus is ultimately reported only if it satisfies this dual-condition framework: significant abnormality relative to normal operation, combined with strong statistical consistency with known malicious or stressed operational states. This creates a layered confidence model where isolated anomalies are filtered out, while coordinated deviations matching realistic attack signatures are prioritized. By validating bus parameters across normal, Gaussian, and stress distributions before final reporting, the localization system becomes substantially more precise, explainable, and resistant to false alarms, making it highly suitable for research-grade cyber-physical intrusion detection.
