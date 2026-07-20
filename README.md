# LexAnime 🎬

A modern, fast, and feature-rich local Anime Backup & Streaming Web Application. Built using a Python Flask backend for database management/crawling integration, and a React + Vite frontend with premium dark-themed UI aesthetics.

---

## ✨ Features
* **Elegant Dark UI:** Styled with sleek modern CSS, smooth hover interactions, glassmorphism card layouts, and fully responsive grid design.
* **Smart Search & Filters:** Filter anime by genres, status, type, and sort them by ratings, title, or latest updates.
* **Local Cover Image Caching:** Automatically serves local anime cover images to save bandwidth and ensure offline compatibility.
* **Episode Lists & Embed Player:** View lists of available episodes for each anime and stream directly using the integrated mirror quality embeds.
* **Robust Database Integration:** Power-backed by an optimized SQLite database (`db_anime.db`) with full search indexes.

---

## 🛠️ Tech Stack
* **Frontend:** React, Vite, Vanilla CSS
* **Backend:** Python Flask, Flask-CORS
* **Database:** SQLite3
* **Scraper/Crawler:** Python Custom BeautifulSoup Scraper with connection pooling.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Python 3.x and Node.js installed on your system.

### 1. Running the Backend (Flask)
1. Open your terminal in the `web_anime/` root folder.
2. Activate your Python virtual environment (if using one):
   ```bash
   ..\venv\Scripts\activate
   ```
3. Run the Flask application:
   ```bash
   python app.py
   ```
   The backend will start running at `http://localhost:5000`.

### 2. Running the Frontend (React + Vite)
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install npm dependencies (first time only):
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

---

## 🗄️ Folder Structure
```text
web_anime/
├── app.py                 # Flask server & REST API
├── db_anime.db            # SQLite database containing anime & episodes metadata
├── images/                # Local cache directory for cover art images
├── .gitignore             # Git ignore rules for database, images, and cache
├── README.md              # Project documentation
└── frontend/              # React + Vite frontend source code
    ├── src/
    │   ├── App.jsx        # Main application component & layout
    │   ├── index.css      # Core design system & custom CSS variables
    │   └── main.jsx       # React DOM mount point
    ├── package.json
    └── vite.config.js
```
