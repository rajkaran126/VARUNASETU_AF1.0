# VARUNASETU

[![Production CI & Deployment](https://github.com/rajkaran126/VARUNASETU_AF1.0/actions/workflows/deploy.yml/badge.svg)](https://github.com/rajkaran126/VARUNASETU_AF1.0/actions/workflows/deploy.yml)
![Deployment Status](https://img.shields.io/badge/Deployment-Production%20Active-10b981)
![Next.js 15](https://img.shields.io/badge/Next.js-15.5.28-black)
![License](https://img.shields.io/badge/License-Proprietary-blue)

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

## Cloud Deployment Guide

### Deploying on Vercel
1. Navigate to [vercel.com/new](https://vercel.com/new).
2. Import repository **`rajkaran126/VARUNASETU_AF1.0`**.
3. Framework Preset: **Next.js** (configured automatically via `vercel.json`).
4. Set Environment Variables from `.env.local` (`GROQ_API_KEY_1`, `NEXT_PUBLIC_SUPABASE_URL`, etc.).
5. Click **Deploy**. Vercel will automatically post deployment status updates and preview URLs directly to your GitHub commits and pull requests.

### Deploying on Render
1. Navigate to [dashboard.render.com](https://dashboard.render.com).
2. Create a new **Web Service** or **Blueprint** from `render.yaml`.
3. Link **`rajkaran126/VARUNASETU_AF1.0`**.
4. Set the Groq API keys under Environment Variables.
5. Click **Create Web Service**.
