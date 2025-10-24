---
title: "Federated Hypergraph Learning for Inter-Client Missed Hyperedges"
collection: _student_projects
authors: "N/A"
supervisor: "Sareh Maleki"
permalink:
status: open
degree: 'bachelor'
layout: single
---
**Supervisor:** Sareh Maleki
  
**Author:** N/A

## Abstract 

Traditional graph learning frameworks represent relationships as pairwise connections between two nodes. However, in many real-world systems, interactions often involve multiple entities simultaneously, forming higher-order relationships that cannot be adequately represented by simple edges. Such complex interactions are more effectively modeled using hypergraphs, where each hyperedge captures a relation among an arbitrary number of nodes participating in a common context. In practice, hypergraph-structured data are often distributed across multiple organizations, each maintaining records of its local entities and relationships. For example, in academic environments, research institutions hold their own collaboration data involving authors and publications.

However, because organizations cannot share raw data due to privacy regulations, data ownership policies, and intellectual property constraints, the hyperedges that connect nodes across different organizations (inter-client hyperedges) remain unobserved in local datasets. This structural incompleteness prevents any single organization from accurately capturing the global relational topology, limiting performance in downstream learning tasks. To address this challenge, we will investigate Federated Hypergraph Learning for Inter-Client Missed Hyperedges. The proposed framework enables multiple organizations to jointly learn a global hypergraph model without exchanging sensitive data, while also inferring or reconstructing the missing inter-client hyperedges that are invisible in individual datasets. This approach aims to bridge the gap between data privacy and comprehensive higher-order relational modeling in decentralized environments.

### Keywords: 

Federated Learning, Knowledge Transfer, Stock Market Forecasting, Financial
Prediction, Investment Decision-Making