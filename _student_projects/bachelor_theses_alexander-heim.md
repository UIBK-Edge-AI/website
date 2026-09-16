---
title: "Deterministic Replay by Construction"
collection: _student_projects
authors: "Alexander Heim"
supervisor: "Radu Prodan"
permalink:
status: ongoing
degree: 'bachelor'
layout: single
---
**Supervisor:** Univ.-Prof. Dr. Radu Prodan  
**Author:** Alexander Heim

## Abstract 

This thesis explores whether deterministic replay of concurrent programs can be simplified by restricting nondeterminism at the programming-language level. The proposed language is a small imperative concurrent language in which shared-memory access is permitted only through explicit synchronization constructs, while external effects such as input, randomness, and time are treated as identifiable sources of nondeterminism.

The central idea is that, if all observable nondeterministic behavior is confined to a well-defined set of operations, the runtime can record only the outcomes and ordering of these operations rather than the complete execution. During replay, the recorded event sequence is used to reproduce the original program behavior.

The thesis will design and implement a prototype language and runtime supporting concurrent execution, execution recording, and deterministic replay. The proposed model will be evaluated in terms of replay correctness, runtime and recording overhead, trace size, and the restrictions it imposes on concurrent program design.

The central research question is:
To what extent can a programming language confine observable nondeterminism to explicit synchronization and external-effect operations in order to provide practical and reproducible concurrent execution through deterministic replay?

The resulting system is intended to investigate the trade-off between language-level restrictions and reproducibility, and to assess whether such a model can provide a suitable foundation for debugging techniques such as time-travel debugging.