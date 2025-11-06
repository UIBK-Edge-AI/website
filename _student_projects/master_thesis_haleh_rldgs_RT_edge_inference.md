---
title: "Reinforcement Learning–Driven Dynamic Graph Sampling for Real-Time Edge Inference"
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

Graph Neural Networks (GNNs) have become fundamental tools for learning over structured data but remain computationally prohibitive for deployment on resource-constrained edge devices. Traditional graph sampling methods such as uniform, layer-wise, or cluster-based approaches apply fixed heuristics that fail to adapt to varying latency, energy, and accuracy constraints typical of real-time edge scenarios. 

To address this limitation, this thesis proposes a Reinforcement Learning–Driven Dynamic Graph Sampling (RLDGS) framework that learns adaptive sampling policies for efficient GNN inference on the edge. In RLDGS, an RL agent observes structural and contextual features of the input graph, such as node degrees, embeddings, and system resource states and dynamically selects the optimal subset of nodes and edges to process. The reward function jointly optimizes prediction accuracy and computational efficiency, enabling real-time adaptation to fluctuating workloads and energy budgets. The GNN operates on these sampled subgraphs to produce predictions while maintaining high representational fidelity.