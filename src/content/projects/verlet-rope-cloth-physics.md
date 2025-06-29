---
order: 9
title: Verlet Rope & Cloth Physics
description: Adds bonded ropes and cloth plus grid-based collision to the Molecular Physics Engine.
longDescription: |
  This update to my **Molecular Physics Engine** chains individual particles
  into *ropes* and *cloth sheets* using spring-like bonds.  
  To keep performance high, the simulation now uses **uniform-grid spatial
  partitioning**: each particle is assigned to a grid cell, and collision checks
  are limited to neighbouring cells instead of an O(n²) global pass.

  The refactor unlocks larger, more complex soft-body scenes while maintaining
  real-time framerates.
start: 2021-05-01         # ← replace or refine
highlight: ./placeholder.webp
images: []
links:
  - label: GitHub
    href: https://github.com/nlannon27/Verlet-Integration
    icon: tabler:brand-github
---
