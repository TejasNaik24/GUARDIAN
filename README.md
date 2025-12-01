# Guardian AI - Emergency Medical Assistant

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-production--ready-success)

> **Guardian** is an advanced, multi-agent AI system designed to provide real-time, voice-activated emergency medical triage and first aid guidance. It combines the power of Google Gemini, RAG (Retrieval-Augmented Generation), and computer vision to assist users in critical situations.

**[Watch the Demo Video](#)** *(Link placeholder)*

---

## 📸 Architecture & Design

![System Architecture](docs/system_architecture_overview.png)
*System Architecture Overview*

![Sub-Agent Architecture](docs/sub_agent_architecture_diagram.png)
*Multi-Agent Reasoning Flow*

> **Note:** High-resolution diagrams are available in the `/docs` folder.

---

## 📚 Table of Contents

- [Problem Statement](#-problem-statement)
- [Why Agents?](#-why-agents)
- [Key Features](#-key-features-what-i-built)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Docker & Deployment](#-docker--deployment)
- [Supabase Setup](#-supabase-setup--migrations)
- [API Reference](#-api-reference)
- [Ingestion & RAG](#-ingestion--rag)
- [Authentication](#-authentication--session-management)
- [Agents & Routing](#-agents--routing)
- [Testing & Troubleshooting](#-testing--troubleshooting)
- [Security & Compliance](#-security--compliance)
- [Kaggle Submission](#-kaggle-submission-checklist)
- [License](#-license)

---

## 🚨 Problem Statement

In medical emergencies, every second counts. Panic, lack of knowledge, and delay in professional help can lead to severe outcomes. Existing AI chatbots often hallucinate, lack real-time voice interaction, or cannot process visual cues (like a wound image).

**Guardian solves this by providing:**
1.  **Instant Voice Triage:** Hands-free interaction for emergencies.
2.  **Visual Analysis:** "Eyes" to see injuries via computer vision.
3.  **Grounded Knowledge:** RAG system backed by authoritative medical manuals.
4.  **Safety First:** Strict guardrails to prevent harmful advice.

---

## 🤖 Why Agents?

A single LLM prompt is insufficient for complex medical reasoning. Guardian uses a **Multi-Agent System** where specialized agents collaborate:

- **Router Agent:** The "dispatcher" that understands intent.
- **Triage Agent:** Assesses urgency (Red/Yellow/Green).
- **Vision Agent:** Analyzes uploaded images.
- **RAG Agent:** Fetches verified medical protocols.
- **Safety Agent:** The "supervisor" ensuring no harmful output.

This architecture ensures **accuracy, safety, and specialized expertise** that a generic model cannot match.

---

## ✨ Key Features (What I Built)

- **🗣️ Real-Time Voice Mode:** Full-duplex voice conversation with auto-silence detection and interruptibility.
- **👁️ Computer Vision:** Upload images (X-rays, wounds, medication) for instant analysis.
- **🧠 Multi-Agent Orchestration:** 7+ specialized sub-agents working in parallel.
- **📚 RAG (Retrieval-Augmented Generation):** Ingests PDFs/text into Supabase pgvector for grounded answers.
- **🔐 Robust Authentication:** Full login/signup system with Guest Mode for instant access.
- **💾 Conversation Memory:** Persistent chat history stored in Supabase.
- **⚡ Hybrid AI Engine:** Uses **Google Gemini 1.5 Pro** for reasoning and **Flash** for speed.
- **🐳 Dockerized:** Full container support for easy deployment.

---

## 🏗️ Architecture

Guardian follows a **Micro-Agent Architecture**:

1.  **Frontend (Next.js):** Handles voice processing (Web Speech API), UI state, and real-time streaming.
2.  **Backend (FastAPI):** Orchestrates the agent workflow.
3.  **Router:** Classifies the query (e.g., "I cut my finger" -> First Aid Agent).
4.  **Sub-Agents:** Execute specific tasks (Lookup RAG, Analyze Image, Check Safety).
5.  **Reasoner:** Synthesizes all agent outputs into a final, empathetic response.
6.  **Database (Supabase):** Stores user profiles, chat history, and vector embeddings.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | Python, FastAPI, Uvicorn |
| **AI Models** | Google Gemini 1.5 Pro (Reasoning), Gemini 1.5 Flash (Speed) |
| **Vector DB** | Supabase (PostgreSQL + pgvector) |
| **Auth** | Supabase Auth (Email/Password + Google OAuth) |
| **Voice** | Web Speech API (STT), SpeechSynthesis (TTS) |
| **Infrastructure** | Docker, Docker Compose |
| **Deployment** | Render (Backend), Vercel (Frontend), Supabase (DB/Auth) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker (optional)
- Supabase Account
- Google AI Studio Key

### 1. Clone the Repository
```bash
git clone https://github.com/TejasNaik24/GUARDIAN.git
cd GUARDIAN
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your API keys (see Environment Variables section)

# Run Server
uvicorn app.main:app --reload
```
*Backend runs on `http://localhost:8000`*

### 3. Frontend Setup
```bash
cd frontend
npm install

# Create .env.local file
cp .env.local.example .env.local
# Edit .env.local with Supabase keys

# Run Client
npm run dev
```
*Frontend runs on `http://localhost:3000`*

---

## 🐳 Docker & Deployment

### Live Deployment
- **Frontend:** Deployed on **Vercel** (Global CDN, Edge Functions)
- **Backend:** Deployed on **Render** (Auto-scaling Python Service)
- **Database:** Managed by **Supabase** (PostgreSQL + pgvector)

### Local Docker
Run the entire stack with one command:

```bash
docker-compose up --build
```

This starts:
- **Frontend:** `http://localhost:3000`
- **Backend:** `http://localhost:8000`

### Build Individual Containers
```bash
# Backend
docker build -t guardian-backend ./backend
docker run -p 8000:8000 --env-file ./backend/.env guardian-backend

# Frontend
docker build -t guardian-frontend ./frontend
docker run -p 3000:3000 --env-file ./frontend/.env.local guardian-frontend
```

---

## ⚡ Supabase Setup & Migrations

1.  **Create Project:** Go to [Supabase](https://supabase.com) and create a new project.
2.  **Get Credentials:** Copy `Project URL` and `anon/public` key from Settings > API.
3.  **Enable Vector Support:**
    Run this in Supabase SQL Editor:
    ```sql
    create extension if not exists vector;
    ```
4.  **Run Migrations:**
    Copy the content of `frontend/lib/database/conversations.sql` and run it in the SQL Editor. This creates:
    - `profiles` table
    - `conversations` table
    - `messages` table
    - `documents` table (for RAG)
    - RLS Policies

### Verify Setup
Check that the `documents` table exists and has a `embedding` column of type `vector(768)`.

---

## 🔑 Environment Variables

### Frontend (`frontend/.env.local`)
```ini
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (`backend/.env`)
```ini
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key  # MUST be Service Role key for ingestion
SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini
GOOGLE_API_KEY=your_gemini_api_key

# Optional
PORT=8000
```

> ⚠️ **SECURITY WARNING:** Never commit `.env` files. The backend requires the **Service Role Key** to perform vector ingestion (write access). The frontend should only use the **Anon Key**.

---

## 📡 API Reference

### Chat Query
**POST** `/api/agents/query`
```json
{
  "query": "My child has a fever of 102",
  "conversation_id": "optional-uuid",
  "image_data": "base64-string-optional"
}
```

### Ingest PDF (RAG)
**POST** `/api/ingest/pdf`
```bash
curl -X POST -F "file=@manual.pdf" \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     http://localhost:8000/api/ingest/pdf
```

---

## 🧠 Ingestion & RAG

Guardian uses a **RAG Lookup Agent** to ground answers in reality.
1.  **Ingestion:** PDFs are chunked, embedded (Gemini Embeddings), and stored in Supabase.
2.  **Retrieval:** The agent searches for semantically similar chunks using `pgvector`.
3.  **Synthesis:** The LLM generates an answer using the retrieved context.

**Test RAG:**
Upload a specific medical protocol PDF and ask a question about a unique detail in it. Guardian will cite the document.

---

## 🔐 Authentication & Session Management

- **Supabase Auth:** Handles secure user management.
- **Guest Mode:** Allows immediate access without signup (stored in `localStorage`).
- **Session Persistence:** Users stay logged in; chat history is saved to the database.
- **Google OAuth:** One-click login supported.

---

## 🤖 Agents & Routing

The brain of Guardian is the **Agent Router**. It analyzes every query and activates the right team:

| Agent | Role |
| :--- | :--- |
| **SafetyAgent** | 🛡️ Checks for self-harm, violence, or illegal content. |
| **TriageAgent** | 🚑 Determines urgency (Red/Yellow/Green). |
| **SymptomsAgent** | 📋 Extracts structured symptom data. |
| **FirstAidAgent** | 🩹 Provides step-by-step care instructions. |
| **PediatricAgent** | 👶 Specialized logic for children (dosages, red flags). |
| **ImageAnalysisAgent** | 👁️ Analyzes uploaded medical images. |
| **RAGLookupAgent** | 📚 Searches medical database for protocols. |

---

## 🧪 Testing & Troubleshooting

### Running Tests
```bash
cd backend
pytest tests/
```

### Common Issues
- **"Relation 'conversations' does not exist"**: Run the SQL migration in Supabase.
- **Microphone not working**: Allow permission in browser. Safari requires a click to start audio context.
- **Docker build fails**: Ensure `.env` files are present before building.

---

## 🛡️ Security & Compliance

- **Data Privacy:** Chat history is RLS-protected (users only see their own data).
- **Safety Guardrails:** The Safety Agent intercepts harmful queries *before* processing.
- **Disclaimer:** The UI prominently displays that this is an AI assistant, not a doctor.

---

## 🏆 Kaggle Submission Checklist

- [x] **Pitch:** "Guardian: Your AI-powered emergency medical assistant."
- [x] **Implementation:** Fully functional multi-agent system with Voice & Vision.
- [x] **Bonus:** Used Gemini 1.5 Pro, RAG, and Agentic Workflow.
- [x] **Video:** Demo video included.
- [x] **Code:** Clean, documented, and Dockerized.

**Course Concepts Applied:**
1.  **Multi-Agent Systems:** Router + specialized sub-agents.
2.  **Tool Use:** Agents use RAG and Vision tools.
3.  **Context Engineering:** Managing conversation history and medical context.

---

## 📄 License

MIT License - Created by **Tejas Naik** for the Google AI Agents Hackathon.

---
