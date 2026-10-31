# VARUNASETU

[![Live Deployment](https://img.shields.io/badge/Render-Live%20Deployment-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://varunasetu-af1-0.onrender.com/)
[![Render Production Deployment](https://github.com/rajkaran126/VARUNASETU_AF1.0/actions/workflows/deploy.yml/badge.svg)](https://github.com/rajkaran126/VARUNASETU_AF1.0/actions/workflows/deploy.yml)
![Next.js 15](https://img.shields.io/badge/Next.js-15.5.28-black)
![License](https://img.shields.io/badge/License-Proprietary-blue)

**Live Production URL**: [https://varunasetu-af1-0.onrender.com/](https://varunasetu-af1-0.onrender.com/)

**An AI-Powered Submarine Cable Digital Twin for Network Resilience, Failure Simulation & Intelligent Recovery.**

VARUNASETU is an infrastructure intelligence platform designed to explore global submarine telecommunications cable networks, simulate physical disruptions, evaluate network resilience, and engineer intelligent recovery planning.

---

## Capabilities & Architecture
- **Global Cable Explorer**: Navigate 400+ international submarine cable systems, landing stations, and physical routing.
- **Underwater Digital Twin**: High-fidelity virtual model reflecting segment topology, optical carrier dispersion, burial depths, and oceanographic vulnerabilities.
- **Network Simulation & Failure Injection**: Stress-test multi-point disruptions and observe dynamic routing under severe packet load.
- **Ghost Simulation**: Complete operational replay from optical rupture to deep-sea ROV inspection, vessel dispatch, fusion splicing, and full traffic cutover.
- **LangGraph Multi-Agent Swarm**: 5 specialist AI agents (Chief Orchestrator, Network Analyst, Risk & Scenario Agent, Logistics & Repair Agent, Policy & Impact Agent) collaborating to deliver recovery directives.
- **Editorial Glassmorphic Design**: Frosted glass HUD with continuous full-viewport subsea background video and classical editorial typography.

---

## Tech Stack
- **Framework**: Next.js 15 (App Router, Server-Side Rendering & Streaming)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Typography**: Times New Roman / Newsreader / Playfair Display (Display), Manrope (Body), IBM Plex Mono (Telemetry)

---

## Getting Started

### Prerequisites
- Node.js 18+ (tested with Node 20 / 22 / 26)
- npm or pnpm

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm run start
```

---

## Cloud Deployment (Render)

VARUNASETU is deployed on **Render**:
- **Live URL**: [https://varunasetu-af1-0.onrender.com/](https://varunasetu-af1-0.onrender.com/)
- **Infrastructure Blueprint**: Configured via [`render.yaml`](./render.yaml)
- **CI/CD Pipeline**: Automated through [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)

### Auto-Deploy Configuration
1. In the **Render Dashboard** ([dashboard.render.com](https://dashboard.render.com)), navigate to `varunasetu-af1-0`.
2. Under **Settings > Build & Deploy**, ensure **Auto-Deploy** is enabled for the `main` branch.
3. To trigger instant zero-delay builds from GitHub Actions, copy the **Deploy Hook URL** from Render and add it as a repository secret named `RENDER_DEPLOY_HOOK` in GitHub (**Settings > Secrets and variables > Actions**).
