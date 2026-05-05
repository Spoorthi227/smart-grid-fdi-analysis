function bus_localisation()
clc;
clear;
close all;

%% ============================================================
% 0. REAL-TIME STATE GENERATOR (NORMAL / FDIA ALTERNATING)
%% ============================================================

persistent toggle;
if isempty(toggle)
    toggle = 0;
end
toggle = toggle + 1;

is_attack = mod(toggle,2)==0;

mpc = loadcase('case14');

basePd = mpc.bus(:,3);
baseQd = mpc.bus(:,4);

% ---- NORMAL LOAD VARIATION ----
mpc.bus(:,3) = basePd .* (0.9 + 0.2*rand(14,1));
mpc.bus(:,4) = baseQd .* (0.9 + 0.2*rand(14,1));

results = runpf(mpc, mpoption('out.all',0));

Pd = mpc.bus(:,3)';
Qd = mpc.bus(:,4)';
Vm = results.bus(:,8)';
Va = results.bus(:,9)';

%% ================= FDIA INJECTION =================
if is_attack
    
    k = randi([2,4]);              % localized attack
    idx = randperm(14, k);
    
    sigma_v = 0.01 + 0.005*toggle; % increasing severity
    sigma_a = 0.2  + 0.05*toggle;
    
    Vm(idx) = Vm(idx) + sigma_v * randn(1,k);
    Va(idx) = Va(idx) + sigma_a * randn(1,k);
    
    attack_flag = 1;
else
    attack_flag = 0;
end

%% ================= SEND STATE TO BACKEND =================

payload = struct();

for i=1:14
    payload.(sprintf('Pd_bus%d',i)) = Pd(i);
end
for i=1:14
    payload.(sprintf('Qd_bus%d',i)) = Qd(i);
end
for i=1:14
    payload.(sprintf('Vm_bus%d',i)) = Vm(i);
end
for i=1:14
    payload.(sprintf('Va_bus%d',i)) = Va(i);
end

payload.attack_flag = attack_flag;

options = weboptions('MediaType','application/json','Timeout',10);

try
    webwrite('http://localhost:3001/api/get-state', payload, options);
    disp("STATE SENT");
catch
    disp("FAILED TO SEND STATE");
end

%% ================= CHECK MODEL RESULT =================

run_forensic = false;

try
    res = webread('http://localhost:3001/api/model-result');
    
    if res.attack == 1
        run_forensic = true;
        disp("MODEL DETECTED ATTACK → RUNNING FORENSIC");
    end
catch
    disp("MODEL RESULT FETCH FAILED");
end

%% ================= IF NORMAL → STOP HERE =================
if ~run_forensic
    disp("NORMAL STATE → NO FORENSIC");
    return;
end

%% ============================================================
% IEEE 14-BUS FDIA FORENSIC LOCALIZATION FRAMEWORK
% (YOUR CODE — 100% SAME)
%% ============================================================


%% ------------------------------------------------------------
% 1. LOAD DATASETS
%% ------------------------------------------------------------

normal_data = readmatrix('normal_dataset.csv');
gaussian_data = readmatrix('fdia_dataset.csv');
stress_data = readmatrix('stress_fdia_dataset.csv');

attack_rows = stress_data(stress_data(:,end)==1 | stress_data(:,end)==2,:);

attack_sample = attack_rows(11,:);


%% ------------------------------------------------------------
% 2. FEATURE COLUMN MAPPING
%% ------------------------------------------------------------

Vm_idx = 1:14;
Va_idx = 15:28;
Pd_idx = 29:42;
Qd_idx = 43:56;


%% ------------------------------------------------------------
% 3. BUILD BASELINE STATISTICS
%% ------------------------------------------------------------

features = {Vm_idx, Va_idx, Pd_idx, Qd_idx};

for f = 1:length(features)

    idx = features{f};

    baseline.mean{f} = mean(normal_data(:,idx),1);
    baseline.std{f}  = std(normal_data(:,idx),0,1);

    gaussian.mean{f} = mean(gaussian_data(:,idx),1);
    gaussian.std{f}  = std(gaussian_data(:,idx),0,1);

    stress.mean{f} = mean(stress_data(:,idx),1);
    stress.std{f}  = std(stress_data(:,idx),0,1);

end


%% ------------------------------------------------------------
% 4. MULTI-DISTRIBUTION BUS VERIFICATION
%% ------------------------------------------------------------

num_buses = 14;
bus_scores = zeros(num_buses,1);
violations = zeros(num_buses,4);

for bus = 1:num_buses

    total_score = 0;

    for f = 1:length(features)

        idx = features{f}(bus);
        value = attack_sample(idx);

        z_normal   = (value - baseline.mean{f}(bus)) / baseline.std{f}(bus);
        z_gaussian = (value - gaussian.mean{f}(bus)) / gaussian.std{f}(bus);
        z_stress   = (value - stress.mean{f}(bus)) / stress.std{f}(bus);

        abnormal_normal = abs(z_normal) > 3;
        attack_match    = abs(z_gaussian) <= 1 || abs(z_stress) <= 1;

        if abnormal_normal && attack_match

            violations(bus,f) = 1;

            severity = abs(z_normal) + ...
                       (1/(abs(z_gaussian)+0.1)) + ...
                       (1/(abs(z_stress)+0.1));

            total_score = total_score + severity;

        end

    end

    bus_scores(bus) = total_score;

end


%% ------------------------------------------------------------
% 5. RANK SUSPICIOUS BUSES
%% ------------------------------------------------------------

[~, ranked_buses] = sort(bus_scores,'descend');
sus_buses = ranked_buses(bus_scores(ranked_buses) > 0);


%% ------------------------------------------------------------
% 6. LOAD IEEE 14-BUS BASE CASE
%% ------------------------------------------------------------

base_case = loadcase('case14');
base = runpf(base_case);


%% ------------------------------------------------------------
% 7. REINJECT ATTACK INTO GRID
%% ------------------------------------------------------------

attack_case = loadcase('case14');

for i = 1:length(sus_buses)

    b = sus_buses(i);

    attack_case.bus(b,3) = ...
        attack_case.bus(b,3) * ...
        (attack_sample(Pd_idx(b)) / baseline.mean{3}(b));

    attack_case.bus(b,4) = ...
        attack_case.bus(b,4) * ...
        (attack_sample(Qd_idx(b)) / baseline.mean{4}(b));

end


%% ------------------------------------------------------------
% 8. RUN POWER FLOW
%% ------------------------------------------------------------

attack_result = runpf(attack_case);


%% ------------------------------------------------------------
% 9. PHYSICAL IMPACT ANALYSIS
%% ------------------------------------------------------------

voltage_dev = abs(attack_result.bus(:,8) - base.bus(:,8));
angle_dev   = abs(attack_result.bus(:,9) - base.bus(:,9));
Pd_dev      = abs(attack_result.bus(:,3) - base.bus(:,3));
Qd_dev      = abs(attack_result.bus(:,4) - base.bus(:,4));

impact_score = ...
      voltage_dev * 30 ...
    + angle_dev   * 5 ...
    + Pd_dev      * 2 ...
    + Qd_dev      * 2;


%% ------------------------------------------------------------
% 10. PROPAGATION SEQUENCE ANALYSIS
%% ------------------------------------------------------------

[~, propagation_order] = sort(impact_score,'descend');


%% ------------------------------------------------------------
% 11. TRANSMISSION LINE IMPACT
%% ------------------------------------------------------------

line_flow_dev = abs(attack_result.branch(:,14) - base.branch(:,14));
affected_lines = find(line_flow_dev > 0.05);


%% ------------------------------------------------------------
% 12. FORENSIC ATTACK ORIGIN RECONSTRUCTION
%% ------------------------------------------------------------

[root_bus, timeline, root_score, attack_paths, propagation_stage] = ...
    forensic_reconstruction( ...
        bus_scores, ...
        impact_score, ...
        loadcase('case14') ...
    );


%% ------------------------------------------------------------
% 13. SEND RESULTS TO NEXT.JS BACKEND API
%% ------------------------------------------------------------

dashboard_payload = struct();

dashboard_payload.attack_label = attack_flag;
dashboard_payload.primary_compromised_buses = sus_buses';
dashboard_payload.bus_scores = bus_scores';
dashboard_payload.impact_scores = impact_score';
dashboard_payload.propagation_order = propagation_order';
dashboard_payload.root_bus = root_bus;
dashboard_payload.timeline = timeline;
dashboard_payload.attack_paths = attack_paths;
dashboard_payload.propagation_stage = propagation_stage';
dashboard_payload.affected_lines = affected_lines';

try
    webwrite('http://localhost:3001/api/update-grid', dashboard_payload, options);
    disp("FORENSIC SENT");
catch
    disp("FAILED TO SEND FORENSIC");
end