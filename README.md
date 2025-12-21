# ArrDeck

A modern, consolidated media dashboard for your *Arr suite (Sonarr, Radarr) featuring intelligent, conversational AI recommendations and library management.

![ArrDeck Banner](https://placeholder-banner-link.com) <!-- Replace with actual banner if available -->

## Features

### 🚀 Centralized Dashboard
*   **Upcoming Schedule**: View your TV show and movie releases in a unified **Calendar**.
*   **Recent Downloads**: Track your latest media acquisitions from both Sonarr and Radarr.
*   **Trakt Trending**: See what's popular globally with "In Library" indicators.
*   **Statistics**: Visualize your library growth, disk space usage, and quality profiles.

### 🧠 Intelligent AI Chat
ArrDeck features a context-aware AI assistant (powered by Google Gemini or Ollama) that knows your library.
*   **Conversational Recommendations**: Ask "What should I watch?" and get suggestions based on your existing collection.
*   **Tool Calling**: Simply say **"Add Inception to my library"** and the AI will search and add it to Radarr/Sonarr for you.
*   **Deep Context**: The AI avoids recommending things you already own.
*   **Interactive Cards**: Click on AI-suggested movies to view details or add them immediately.

### 📱 Modern & Responsive
*   **Mobile First**: Fully responsive layout with a polished mobile drawer and touch-friendly controls.
*   **Smooth Animations**: Enjoy fluid transitions and a glassmorphism UI design.
*   **Lazy Loading**: Optimized for performance with fast load times.

## 🛠️ Setup & Configuration

### Prerequisites
*   Docker & Docker Compose
*   *Optional*: Node.js (v20+) for manual development

### Quick Start (Docker)

1.  **Clone the repository** (or download the docker-compose file).
2.  **Configure Environment**:
    Create a `.env` file or modify `docker-compose.prod.yml`:
    ```env
    DB_HOST=postgres
    DB_PASSWORD=arrdeck
    # ... other vars
    ```
3.  **Run**:
    ```bash
    docker compose -f docker-compose.prod.yml up -d
    ```
4.  **Access**: Open `http://localhost:3000`

### ⚙️ Configuration
Once running, navigate to the **Settings** page:

1.  **Integrations**:
    *   **Sonarr/Radarr**: Enter your URL (e.g., `http://192.168.1.10:8989`) and API Key.
2.  **AI Service**:
    *   Choose **Google Gemini** (Cloud) or **Ollama** (Local).
    *   Enter your API Key or Ollama URL.
    *   **Pro Tip**: Select `gemini-1.5-flash` for fast, cost-effective responses.

## 🤖 AI Capabilities

The AI isn't just a chatbot; it's a library manager.
*   **"Find me 90s action movies"**: Returns a list of curated hits.
*   **"Add the first one"**: Contextually adds the movie from the previous turn.
*   **"Do I have The Office?"**: Checks your Sonarr library instantly.

## 🏗️ Development

ArrDeck is a monorepo (NestJS Backend + Angular Frontend).

### Manual Setup

1.  **Backend**:
    ```bash
    cd backend
    npm install
    npm run start:dev
    ```

2.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm start
    ```

## 🤝 Contributing

We welcome issues and pull requests!
*   **Bug Reports**: Use the template to report issues.
*   **Feature Requests**: Have an idea? Let us know.

## License

[MIT](LICENSE)

