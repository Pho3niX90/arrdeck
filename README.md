# ArrDeck

A modern, consolidated media dashboard for your *Arr suite (Sonarr, Radarr) featuring intelligent, conversational AI recommendations and library management.

## Why ArrDeck?

Managing a media home lab often involves jumping between tabs: Sonarr for TV, Radarr for movies, Plex/Jellyfin for watching, and Trakt for discovery. **ArrDeck consolidates this chaos.**

Unlike static dashboards that just link to services, ArrDeck is **deeply integrated**:
*   **It knows what you have:** The AI doesn't just suggest movies; it checks if you already own them.
*   **It takes action:** Don't just read about a show—tell specific cards to add it, or ask the AI to "Get that for me."
*   **It's unified:** View your entire upcoming release schedule and download queue in one place.

## Features

### 🧩 Unified Dashboard Cards
ArrDeck centralizes your critical data into bite-sized, interactive widgets:

*   **📅 Upcoming Schedule**: A unified calendar view combining Sonarr and Radarr releases. Know exactly what's premiering tonight without checking two different apps.
*   **📥 Active Queue**: Real-time monitoring of your downloads. Pause, resume, or cancel downloads directly from the dashboard.
*   **📀 Recent Downloads**: A visual feed of the latest content added to your library.
*   **🎬 Trakt Trending**: See what's popular worldwide right now. Items already in your library are clearly marked, saving you from accidental double-downloads.
*   **📊 Library Stats**: Beautiful visualizations of your collection size, quality profiles, and disk usage.
*   **🎨 Customizable Layout**: Rearrange widgets to suit your workflow. Enter "Edit Mode" to access the widget store, which pushes your dashboard aside for a focused editing experience.

### 🧠 Context-Aware AI Assistant
Powered by **Google Gemini** or **Ollama**, the built-in AI isn't just a chatbot—it's a library admin.

*   **"What should I watch?"**: Get recommendations based on your actual library content.
*   **"Add Inception"**: The AI leverages function calling to search Radarr and add movies securely via their API.
*   **"Do I have The Office?"**: Instantly queries Sonarr inventory to prevent duplicates.
*   **Smart Context**: It acts as a bridge between your desire and your database, filtering out things you've already seen or own.

### 📱 Modern User Experience
*   **Glassmorphism Design**: A premium, modern UI that looks great on any screen.
*   **Mobile-First**: Fully responsive with a dedicated mobile drawer and touch-optimized controls. Manage your server from the couch.
*   **Lazy Loading**: Optimized performance ensures the dashboard loads instantly, even with large libraries.

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
    *   **Pro Tip**: Select `gemini-2.5-flash` for fast, cost-effective responses.

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
