---
title: "Hierarchical Graph Reinforcement Learning for Adaptive Federated Edge Intelligence"
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

Edge intelligence enables real-time learning close to data sources, but federated learning (FL) in such distributed and resource-constrained environments faces severe challenges. Traditional FL assumes homogeneous nodes and static communication topologies, which breaks down in realistic edge networks where devices differ in data distribution, computing power, and connectivity. To address this, we propose a Hierarchical Graph Reinforcement Learning (H-GRL) framework that optimizes federated learning dynamics through graph-structured coordination across multiple levels of decision-making.

In the proposed approach, the edge network is modeled as a dynamic graph, where nodes represent edge devices and edges capture communication costs and data affinities. At the micro level, each node employs a reinforcement learning agent to decide local training intensity, participation frequency, and communication strategies. At the macro level, a global meta-controller uses graph neural networks to aggregate structural information and guide global policies such as client selection, aggregation frequency, and clustering. This hierarchical decomposition enables scalable optimization of both local efficiency and global convergence