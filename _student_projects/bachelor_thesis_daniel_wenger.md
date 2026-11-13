---
title: "Device-Adaptive and Uncertainty-Aware Embedded Condition Monitoring of Electromechanical Actuators in Household Appliances Using Healthy-Behavior Models"
collection: _student_projects
authors: "Daniel Wenger "
supervisor: "Radu Prodan"
permalink:
status: ongoing
degree: 'bachelor'
layout: single
---
**Supervisor:** Univ.-Prof. Dr. Radu Prodan  
**Author:** Daniel Wenger

## Abstract 

Contemporary household appliances often come with integrated embedded systems containing various sensors to monitor electromechanical actuators. These actuators are subject to degradation that regularly remain undetected until a functional failure occurs. However, the existing sensor signals provide opportunities for early detection of progressing maintenance-relevant degradation, before functional failure. 

A general approach is to use machine learning to model the expected behavior of healthy actuators and detect deviations in sensor signals that may indicate degradation. However, even identical actuators may show systematic differences due to manufacturing tolerances, sensor offsets or normal mechanical variability. Furthermore, deterministic regression models do not inherently quantify prediction uncertainty, which may lead to undesirable false positives. Another major challenge is implementing such machine learning approaches on resource-constrained embedded systems. 

This thesis investigates a device-adaptive and uncertainty-aware embedded approach for condition monitoring based on healthy-behavior models. The objective is to investigate how prediction uncertainty and device-specific variations can be incorporated into the evaluation of deviations from healthy behavior, and whether these considerations can improve the reliability of early maintenance-relevant degradation detection while remaining computationally feasible on embedded systems.