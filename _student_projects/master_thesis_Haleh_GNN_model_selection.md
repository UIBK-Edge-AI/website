---
title: "Graph Neural Network Model Selection and Compression for Edge Deployment"
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

Graph Neural Networks (GNNs) have achieved state-of-the-art performance on numerous graph-based learning tasks, yet their computational and memory demands make them poorly suited for deployment on edge devices with constrained resources. This thesis proposes a meta-learning framework for adaptive GNN model selection and compression, tailored to the capabilities of heterogeneous edge hardware.

The framework consists of two key components. First, a meta-model is trained to predict the most suitable GNN architecture (e.g., GCN, GraphSAGE, GAT, or GIN) for a given graph dataset and hardware profile, based on task complexity, structural statistics, and available resources. Second, a compression module applies model-specific optimization techniques, including layer pruning, quantization, and knowledge distillation, to reduce computational and memory costs while preserving predictive accuracy. Third, an evaluation module benchmarks the adapted models on real-world edge devices (e.g., NVIDIA Jetson Nano, Raspberry Pi) using standard graph datasets.

This work aims to develop a system that automatically selects and optimizes GNNs for efficient inference under edge constraints, balancing accuracy and latency. The research contributes to the emerging area of edge intelligence for graph data, bridging the gap between theoretical GNN design and practical on-device deployment.