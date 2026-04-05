# Antigravity Diagram Generator

A full-stack, AI-powered web application that automatically reads any public GitHub repository and generates highly structured architecture flowcharts, Entity-Relationship (ER) models, deployment diagrams, and sequence flows.

## Features at a Glance

- **Intelligent Repository Parsing:** Directly reads your provided GitHub repository via zero-install HTTP requests, bypassing large blob binaries to map out the pure architecture (e.g., config maps, database schemas).
- **AI Rule-Set Generation:** Connects directly with the lightning-fast `gemini-2.5-flash` model, explicitly trained on syntax constraints to emit valid `mermaid.js` relationships natively.
- **Glassmorphism UI:** Features an incredibly modern dark-themed aesthetics with animated blur spots, dynamically positioned overlay components, and sleek gradients.
- **Interactive Visualization:** The generated mathematical diagram is mounted directly onto the screen. Features dragging/panning alongside 4x zoom levels natively inside a bounding box!
- **Zero Configuration Fallback:** Contains a fully simulated backend mode if an API key is not present during development.

---

## 🛠 Tech Stack

- **Framework:** [Next.js (App Router)](https://nextjs.org/)
- **Styling:** Custom Vanilla CSS with hardware-accelerated animations 
- **AI Processing:** `@google/genai` (Gemini Flash Model)
- **Diagram Engine:** [Mermaid.js](https://mermaid.js.org/)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## ⚙️ How It Works (System Architecture)

### 1. The Frontend (Client)
The application uses stateful React forms under the `app/page.js` umbrella. The user inputs their GitHub URL and selects one of 6 architectural mapping types. While loading, background asynchronous HTTP calls are securely sent to the Next.js API `/api/generate-diagram`.

The diagrams themselves are physically drawn by the `DiagramViewer.jsx` engine. To prevent racing conditions during high-speed compilation, `.render()` requests to Mermaid encapsulate strict `isMounted` hook safeties and dynamic inline SVG parsing. Drag events (`onMouseDown`, `onMouseMove`...) intercept the SVG's container coordinates to facilitate infinite map panning.

### 2. The Backend Engine (Server)
When the application queries `/api/generate-diagram`, our engine triggers the `lib/github.js` module. It performs the following mapping logic implicitly bypassing typical rate-heavy Git Clones:
1. Validates the username and repo.
2. Resolves the branch head properties.
3. Retrieves a fully unrolled Git Tree structure, aggressively masking out ignored branches (like deep `/node_modules`, `dist/`, or `.git/`).
4. Performs a targeted shallow-scan of "Vital Files" (e.g. `schema.prisma`, `package.json`).

### 3. Artificial Intelligence Pipeline
The parsed lightweight topology is handed to the Google Gemini model. A strictly guarded multi-stage prompt forces the AI to output zero conversational text—it behaves entirely as a syntax translator, returning mathematically correct relations directly back to the active client.

---

## 🚀 Quick Setup Guide

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Supply your API Key**
   At the root of the project, edit the `.env.local` file by popping in your active Gemini Token:
   ```env
   GEMINI_API_KEY="your_actual_key_here"
   ```

3. **Fire Up The Engine**
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:3000` (or whichever port Next.js automatically assigns you, often `3001` if running concurrent projects).

---

## 🔒 Limitations & Rules Applied
- Mermaid does not naturally parse string declarations (like "The user logs in") within Entity Relation structures (`erDiagram`). Our AI prompt specifically blocks description hallucination to secure compile safety.
- The default model enforces `gemini-2.5-flash` natively to bypass the extremely strict Rate Limit quotas (RPM) imposed upon pro-tier Free API usage structures.
