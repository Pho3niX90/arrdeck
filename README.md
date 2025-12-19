# ArrDeck

A modern, consolidated media dashboard for your *Arr suite (Sonarr, Radarr) with intelligent AI-powered recommendations.

# Warning: This project is in early development.

## Features

### 🚀 Centralized Dashboard
*   **Upcoming Schedule**: View your TV show calendar at a glance.
*   **Recent Downloads**: Track your latest media acquisitions from both Sonarr and Radarr.
*   **Trakt Trending**: See what's popular in the world right now.
*   **Library Overview**: Quick stats and access to your movie and show libraries.

### 🧠 AI Recommendations
ArrDeck analyzes your existing library (top-rated and recent items) and uses Generative AI (Google Gemini or Ollama) to suggest what to watch next.
*   **Context-Aware**: Suggestions are based on what you *actually* like.
*   **Auto-Trigger**: Recommendations are fetched automatically on load.
*   **Metadata Enrichment**: Posters, years, and actionable "Add" buttons are automatically fetched.
*   **In-Library Detection**: See instantly if a recommendation is already in your collection (Green Checkmark).

### ⚡ Performance
*   **Backend Caching**: Library scans for Sonarr and Radarr are cached for 5 minutes, ensuring the dashboard loads instantly.

## Configuration

Navigate to the **Settings** page to configure your integrations:

1.  **Sonarr**: Enter your instance URL (e.g., `http://localhost:8989`) and API Key.
2.  **Radarr**: Enter your instance URL (e.g., `http://localhost:7878`) and API Key.
3.  **AI Service**: 
    *   **Provider**: Choose between **Google Gemini** (Cloud) or **Ollama** (Local).
    *   **API Key/URL**: Enter your Gemini API Key or local Ollama URL.
    *   **Model**: Dynamically fetch and select available models (e.g., `gemini-2.5-flash`, `llama3.2`).

## Details View

Click on any movie or show card to view rich details, including cast, overview, and ratings.

## Development Setup

ArrDeck is a monorepo consisting of a NestJS backend and Angular frontend.

### Prerequisites
*   Node.js (v18+)
*   Docker & Docker Compose (optional, for full stack)

### Quick Start (Docker)
The easiest way to run ArrDeck is with Docker Compose, which spins up the app and a Postgres database.

```bash
docker-compose up --build
```

Access the app at `http://localhost:3000`.

### Manual Setup

#### Backend
```bash
cd backend
npm install
# Set up .env with DB credentials (see .env.example)
npm run start:dev
```

#### Frontend
```bash
cd frontend
npm install
npm start
```
