---
title: "Retiring IPv4 from the Peering LAN: A Case Study of RFC 8950 Deployment at an Internet Exchange"
collection: _student_projects
authors: "Emma Danko"
supervisor: "Radu Prodan"
permalink:
status: ongoing
degree: 'bachelor'
layout: single
---
**Supervisor:** Univ.-Prof. Dr. Radu Prodan  
**Author:** Emma Danko

## Research Question
How can RFC 8950 be deployed at an Internet Exchange Point such as Rheintal-IX and how can its configuration be automated through an IXP Manager template?


## Abstract 

Internet Exchange Points (IXPs) are critical Internet infrastructure, providing a Layer-2 switching fabric, the peering LAN, over which members exchange routes and traffic via BGP. Operating an IPv6-only peering LAN simplifies operations and conserves scarce IPv4 addresses, but members must still exchange IPv4 routes. RFC 8950 addresses this by allowing IPv4 prefixes to be advertised with IPv6 next hops, which requires support from both the route servers and member routers. For members without RFC 8950 support, a Translator acts as a proxy BGP speaker between them and supporting members. This thesis documents the configuration of RFC 8950 on the route servers and the testing and deployment of Translators at Rheintal-IX, an IXP with Points of Presence in Austria, Germany, Liechtenstein, and Switzerland. It further analyzes operational issues such as path hiding and the effects on troubleshooting tools like traceroute. Finally, it automates the Translator configuration through a template for IXP Manager, a management platform widely used by IXPs. 