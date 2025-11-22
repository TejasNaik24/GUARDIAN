<p align="center">
  <img src="https://placehold.co/200x60?text=Guardian+Logo" alt="Guardian Logo" height="60" />
</p>

# Guardian

> **Kaggle × Google AI Intensive 2025 Capstone Project**

---

## 🩺 Overview

**Guardian** is an advanced AI-powered medical triage agent designed for emergency scenarios. Leveraging a two-layer LLM RAG architecture, Guardian accepts text, images, and videos as input, retrieves relevant information from trusted medical sources, and provides realistic triage recommendations. The system is built for rapid, reliable, and multimodal decision support in critical situations.

---

## 🚀 Features

- **Multimodal Input:** Accepts text, images, and video for comprehensive triage.
- **Realistic Emergency Triage:** Provides actionable, context-aware recommendations for medical emergencies.
- **RAG-Powered Retrieval:** Uses ChromaDB to search and retrieve information from vetted medical sources.
- **Trusted Medical Sources:** Integrates with Supabase to store and manage medical documents and logs.
- **Full-Stack Deployment:** Seamless integration between frontend (Vercel) and backend (Render).
- **User-Friendly Interface:** Modern, responsive UI for fast and intuitive triage submissions.

---

## 🏗️ Architecture

Guardian is composed of several tightly integrated components:

- **Frontend (Next.js):**
  - Built with React, TypeScript, Tailwind CSS, and Framer Motion for a modern, animated user experience.
  - Handles user authentication, triage form submission, and media uploads.
- **Backend (FastAPI):**
  - Python-based API using FastAPI and Uvicorn for high performance.
  - Integrates Google ADK LLM for advanced language and vision capabilities.
  - Implements RAG (Retrieval-Augmented Generation) using ChromaDB for vector search.
  - Supabase for storing medical sources and logging triage events.
- **RAG Engine:**
  - Vectorizes queries and medical documents for semantic search.
  - Retrieves contextually relevant information to support LLM responses.
- **Google ADK Integration:**
  - Multimodal LLM for text, image, and video analysis.
  - Provides robust reasoning and medical knowledge.
- **Multimodal Input Pipeline:**
  - Accepts and preprocesses text, images, and video.
  - Extracts frames and features for analysis.

---

## 🧑‍💻 Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Python, FastAPI, Uvicorn, Supabase, Google ADK, ChromaDB
- **AI:** Google ADK LLM (multimodal), RAG (ChromaDB)
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel (frontend), Render (backend)

---

## ⚡ Getting Started / Installation

### Prerequisites

- Node.js & npm (for frontend)
- Python 3.10+ (for backend)
- Supabase account & API keys
- Google ADK API key

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 📝 Usage

1. **Access the Guardian UI** via the frontend (Next.js app).
2. **Submit a triage request**:
   - Fill out the form with patient symptoms (text).
   - Optionally upload images (e.g., wounds, scans) or video (e.g., accident footage).
3. **Receive recommendations**:
   - Guardian analyzes the input using LLM and RAG.
   - Returns triage suggestions and relevant medical information.

---

## 📁 Project Structure

- `frontend/` – Next.js app for user interface
- `backend/` – FastAPI backend with ADK and RAG
- `README.md` – Project documentation

**Backend Structure:**

- `app/` – FastAPI app, routes, models, services
- `tests/` – Unit and integration tests
- `requirements.txt` – Python dependencies
- `Dockerfile` – Containerization for deployment

**Frontend Structure:**

- `pages/` – Main UI pages
- `components/` – Reusable React components
- `styles/` – Tailwind CSS setup

---

## 🏥 Data Sources

Guardian retrieves medical information from:

- **Supabase:** Stores curated medical documents, guidelines, and logs.
- **Trusted Medical Datasets:** WHO, CDC, PubMed, and other vetted sources.
- **Custom Uploads:** Allows admins to add new medical resources.

---

## 🚢 Deployment

- **Frontend:** Deployed on Vercel for global scalability and performance.
- **Backend:** Deployed on Render with Docker for reliability and easy scaling.
- **Environment Variables:** Store API keys and secrets securely in Vercel/Render dashboards.

---

## ⚠️ Disclaimer

Guardian is an AI-powered tool for educational and research purposes only. It does **not** replace professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical emergencies.

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
