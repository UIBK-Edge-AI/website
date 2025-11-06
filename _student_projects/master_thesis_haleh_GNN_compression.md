---
title: "Reinforcement Learning–Based Graph Neural Network Compression for Efficient Edge Deployment"
collection: _student_projects
authors: "N/A"
supervisor: "Haleh Dizaji"
permalink:
status: open
degree: 'master'
layout: single
---
**Supervisor:** Haleh Dizaji
**Author:** N/A

## Abstract 

Graph Neural Networks (GNNs) have achieved state-of-the-art performance in learning from relational data but remain prohibitively expensive for real-time deployment on resource-constrained edge devices. The high computational and memory demands of GNNs stem from their deep message-passing architectures and large parameter footprints, making direct inference infeasible in latency-critical or low-power environments. Existing compression techniques such as pruning, quantization, and distillation rely on manually tuned heuristics that fail to adapt to diverse graph structures and hardware constraints. 

This thesis proposes a Reinforcement Learning–Based Graph Neural Network Compression (RL-GNNComp) framework that automatically learns optimal compression policies tailored for edge deployment. The framework formulates the compression process as a sequential decision-making problem, where an RL agent iteratively selects compression actions, such as layer pruning ratios or quantization levels, based on feedback from model performance and resource usage. A multi-objective reward function jointly optimizes model accuracy, inference latency, and energy consumption, guiding the agent toward efficient yet high-performing compressed architectures.