# Project Milestones: Cyber Physical Attack Detection and Digital Forensics in Smart Power Grid Systems Using FPGA Based Edge Signal Intelligence

This document outlines the phased development milestones for the 4-person team (2 CS, 2 ECE), translating your methodology flowchart into concrete, trackable objectives.

## Team Division of Labor
- **Computer Science (CS) Team (2 Members)**: Focus on Python backend, Isolation Forest anomaly detection, database schema for forensic logging, attack reconstruction, and the front-end visualization dashboard.
- **Electronics & Communication (ECE) Team (2 Members)**: Focus on MATLAB Simulink (IEEE 14-Bus) generation, FDIA attack injection, UART streaming, Xilinx Vivado FPGA (Artix-7) programming, and hardware-based FFT/feature extraction.

---

### Phase 1 — Smart Grid Simulation & Data Generation
**Tech Stack**: MATLAB Simulink, IEEE-14 Bus System, Python (for data manipulation)
**Primary Assignees**: 1 ECE, 1 CS (Collaborative Dataset Creation)

| Milestone | What You Build | Gate |
|---|---|---|
| **M1** | IEEE-14 Bus System configured in MATLAB Simulink to generate nominal operational data (Voltage/Current traces). | Grid simulation runs without divergence/errors. |
| **M2** | Smart Grid Signal Generation: Introduce load dynamics, harmonics, and collect a robust baseline dataset of *normal* operations. | Nominal dataset exported (CSV/MAT) correctly. |
| **M3** | FDIA Attack Injection: Implement scripts to systematically inject False Data Injection Attacks and signal manipulations. | Attack signatures successfully generated and stored. |

**Demo checkpoint: Present waveform graphs comparing Normal vs. Injected Attack signals. Show mentors here.**

---

### Phase 2 — FPGA Edge Signal Processing (Hardware Layer)
**Tech Stack**: Xilinx Vivado, Verilog/VHDL, Xilinx Artix-7 FPGA, UART Protocol
**Primary Assignees**: 2 ECE (Hardware Focus)

| Milestone | What You Build | Gate |
|---|---|---|
| **M4** | Signal Streaming to FPGA: Establish UART interface to stream MATLAB simulated data real-time to the Artix-7 board. | Verified bit-accurate transmission at target baud rate. |
| **M5** | FPGA Signal Processing: Implement hardware FIFO buffer and FFT (Fast Fourier Transform) IP core on the FPGA. | Synthesis successful; FPGA FFT output matches MATLAB FFT. |
| **M6** | Feature Extraction: Build hardware logic to calculate Harmonics and Total Harmonic Distortion (THD) from the FFT. | THD values calculated in real-time match theoretical values. |
| **M7** | Edge Anomaly Flagging: Implement basic threshold-based flagging directly on the FPGA to catch obvious signal anomalies early. | Simple attacks flagged at edge; latency < 10ms. |

**Hardware Checkpoint: Real-time LED indication or terminal output of FPGA calculations and threshold flags.**

---

### Phase 3 — ML-Based Anomaly Detection (Software Layer)
**Tech Stack**: Python, scikit-learn (Isolation Forest), Pandas, PySerial
**Primary Assignees**: 2 CS (Model & Inference Design)

| Milestone | What You Build | Gate |
|---|---|---|
| **M8** | Live Data Ingestion: Python pipeline via PySerial to ingest the streaming feature data (Harmonics, THD, Edge Flags) outputted from the FPGA. | Data successfully parsed in Python without frame drops. |
| **M9** | Isolation Forest Training: Train the AI model using Phase 1 offline datasets (using features like THD, Voltage variations). | Model trained; Contamination threshold optimized. |
| **M10** | Offline Baseline Metrics: Evaluate model computing Accuracy, Precision, Recall, and F1-Score on a test split. | F1-Score > 85% on simulated data. |
| **M11** | Real-Time Live Inference: Integrate the trained Isolation Forest model into the live FPGA data ingestion script. | Live predictions generated without lagging the incoming stream. |

**These are your software metrics—every system tweak hereafter should ideally improve or maintain this F1-Score.**

---

### Phase 4 — Digital Forensics & Visualization Dashboard
**Tech Stack**: Python (FastAPI/Flask), Database (SQLite/PostgreSQL), Frontend (React/Dash/Streamlit)
**Primary Assignees**: 2 CS (Full Stack Development)

| Milestone | What You Build | Gate |
|---|---|---|
| **M12** | Forensic Logging DB: Schema capturing active cyber-physical events (Timestamp, Bus/Node ID, Extracted Features, IF Score, Edge Flag). | DB initializes and successfully logs simulated attack runs. |
| **M13** | Active Attack Reconstruction: SQL/Python module to trace and sequence multiple compromised nodes over a time window. | Correctly outputs the timeline of an injected multi-node FDIA. |
| **M14** | Visualization Dashboard (Live View): Real-time UI plotting node signals, FFT features, and live Isolation Forest anomaly scores. | UI updates smoothly at <1 sec intervals. |
| **M15** | Forensics Dashboard (Audit View): Historical table logs of flagged anomalies, attack playbacks, and exportable forensic reports. | UI successfully queries the DB to show past attack events. |

**Demo Checkpoint: Dashboard actively alarming during a live injection and demonstrating the forensic logs.**

---

### Phase 5 — Full System Integration & Benchmarking
**Tech Stack**: End-to-End Tools (MATLAB → FPGA → Python → Web)
**Primary Assignees**: All Members (System Unification)

| Milestone | What You Build | Gate |
|---|---|---|
| **M16** | End-to-End Pipeline: Complete flow from MATLAB streaming out to FPGA, processed/flagged, read by Python, evaluated by Isolation Forest, logged to DB, and rendered on Dashboard. | System runs continuously for 30 minutes seamlessly. |
| **M17** | Latency Benchmarking: Map out latency for each module. Target overall latency from MATLAB signal dispatch to Dashboard alert. | End-to-end latency < 1.0 seconds. |
| **M18** | Edge Efficiency Proof: Compare processing on software alone vs. offloading FFT and initial flagging to the FPGA. | Metrics prove FPGA reduces backend compute load/bandwidth. |
| **M19** | Final Validation: Test the complete system against various attack intensities (e.g., subtle vs. massive data injection). | Detection rates logged and ready for final presentation. |

---

### Summary

```
Phase 1 (M1–M3):   Grid Simulation & Threats     ← Valid Dataset (ECE + CS)
Phase 2 (M4–M7):   FPGA Processing (Edge)        ← Hardware Acceleration (ECE)
Phase 3 (M8–M11):  Isolation Forest ML Model     ← AI Detection Capability (CS)
Phase 4 (M12–M15): Forensics & Dashboard         ← Web/DB Tools (CS)
Phase 5 (M16–M19): E2E Validation & Benchmarking ← Final Deliverable (Team)
```
