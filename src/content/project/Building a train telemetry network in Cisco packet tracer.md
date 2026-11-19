---
title: Simulating A Train Network(CBTC)  with Cisco packet tracer
description: "Using Cisco Packet Tracer to configure and simulate a CBTC train network"
image: ~/assets/images/train.png
skills:
  - Cisco Packet Tracer
  - Cisco commands
  - Router/Switch configuration
  - VLAN configuration
  - ACL (Acess Control list)
publishDate: 2026-11-19
---

**Executive Summary:**
	I did this project because I learnt not long ago that trains use telemetry to deliver important information to the station. I wanted to simulate it myself as a fun exercise to discover more than the basic projects of Cisco Packet Tracer. I designed a network that connects a moving train to a station control center, ensuring the data is routed correctly and secured from unauthorized access by public passengers.

**Project Impact:**
- **End-to-End Connectivity:** Successfully linked a mobile wireless endpoint (the train) to a distant local network over a simulated fiber-optic backbone.
- **Threat Mitigation:** dentified and patched a default routing vulnerability, securing critical train infrastructure from public Wi-Fi users.

# Network Architecture : 
![Train Network](~/assets/images/full_train_network.png)

# Technical Summary
- [1. Setting up the physical network and VLANs](#1)
- [2. Connecting the train and station with OSPF](#2)
- [3. Testing the default vulnerability](#3)
- [4. Patching the vulnerability with ACLs](#4)
<a id="1"></a>
-----

### 1. Connecting the train and station with OSPF

At the station level, I used a Cisco switch to create three separate Virtual Local Area Networks (VLANs): one for Train Data, one for Station Equipment (like ticket machines), and one for Public Wi-Fi. This logical separation ensures that traffic from these three different environments does not mix on the local switch level.
<a id="2"></a>
___
### 2. Connecting the train and station with OSPF

**What is OSPF?**   OSPF (Open Shortest Path First) is a smart, self-updating GPS for network traffic.
In standard networking, I have to manually draw the map and tell the routers exactly how data should travel from point A to point B. OSPF allows the station and tunnel routers could automatically discover each other. It allows them to instantly calculate the best and fastest route for the train's data to travel across the fiber cable, completely hands-free.

> **In short :** It is an automatic GPS for internet data that figures out the fastest delivery route all by itself, without needing a human to draw the map.
 
To simulate the physical distance between the station and the tunnel, I connected two routers using a fiber optic cable. I configured the OSPF routing protocol so the routers could dynamically learn paths to each other. The train connects wirelessly to an access point in the tunnel, receives an IP address automatically via DHCP, and routes its telemetry data back to the station.

To prove the core infrastructure works, I successfully pinged the station from the moving train. Additionally, checking the router's CLI shows the "O" (OSPF) route, proving it dynamically learned how to reach the Train's Wi-Fi network.

![Train successfully pinging the station](~/assets/images/train_pinging_Router1.png) ![OSPF Routing Table Proof](~/assets/images/R1_CLI_show_ip_route.png)

<a id="3"></a>
___
### 3. Testing the default vulnerability

By default, a router's primary job is to connect different networks together. Even though I used VLANs to separate the traffic at the switch level, the main station router automatically allows traffic to pass between all known networks. To prove this vulnerability, I connected a smartphone to the Public Wi-Fi and successfully pinged the Train Data network.

as seen below, the user smartphone connected to the train station's wifi can ping the train : 

![Vulnerability](~/assets/images/train_vuln.png)
<a id="4"></a>
___
### 4. Patching the vulnerability with ACLs

To secure the network, I wrote an Access Control List (ACL) on the station router. This acts as a firewall rule. It explicitly denies any network packets originating from the Public Wi-Fi network that are trying to reach the Train Data network. After applying this rule, the exact same ping test from the smartphone failed, returning a "Destination host unreachable" message.

=> Now, if a passenger tries to access the train's private network, the router drops their connection entirely.

proof : 
![Vulnerability patched through ACLs](~/assets/images/train_vuln_patched.png)
