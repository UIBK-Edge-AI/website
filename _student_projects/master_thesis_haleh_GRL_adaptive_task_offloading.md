---
title: "Graph-based Reinforcement Learning for Adaptive Task Offloading in Dynamic Edge Networks"
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

Edge computing enables low-latency and energy-efficient processing by bringing computation closer to data sources. However, deciding when and where to offload computational tasks among heterogeneous and resource-constrained edge nodes remains a major challenge. Static or heuristic-based offloading strategies fail under dynamic network conditions, where device load, connectivity, and bandwidth fluctuate continuously. 

To address this, this thesis proposes a Graph-based Reinforcement Learning (GRL) framework for adaptive task offloading in dynamic edge networks. In the proposed approach, the edge environment is modeled as a graph, where nodes represent devices and edges encode communication costs and connectivity. A Graph Neural Network (GNN) encodes the current network state, capturing node resource availability, queue lengths, and link conditions, into compact structural embeddings. These representations are used by a reinforcement learning agent to select optimal offloading actions that balance latency, energy consumption, and task success rate. The RL policy continuously adapts to time-varying conditions through feedback-driven learning, enabling autonomous decision-making without explicit network modeling.