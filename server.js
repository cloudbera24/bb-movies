/**
 * BB Movies - A Bera Tech Creation
 * Netflix-inspired movie streaming platform
 * 
 * To run locally:
 * 1. npm install express cors dotenv axios
 * 2. node server.js
 * 
 * To deploy on Render.com:
 * 1. Upload this file to your repository
 * 2. Set build command: npm install
 * 3. Set start command: node server.js
 * 4. Environment variables (optional): PORT=3000
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const https = require('https');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Movie genres for browsing 
const MOVIE_GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", 
  "Documentary", "Drama", "Fantasy", "Horror", "Mystery",
  "Romance", "Sci-Fi", "Thriller", "Western", "Family"
];

// Enhanced proxy middleware with better error handling
async function proxyRequest(url, res) {
  try {
    const response = await axios.get(url, { timeout: 8000 });
    res.json(response.data);
  } catch (error) {
    console.log('API error:', error.message);
    res.status(500).json({ 
      status: 500, 
      success: false, 
      error: 'API temporarily unavailable',
      message: 'Please try again later'
    });
  }
}

// API Proxy routes
app.get('/api/search/:query', async (req, res) => {
  const query = encodeURIComponent(req.params.query);
  const url = `https://movieapi.giftedtech.co.ke/api/search/${query}`;
  await proxyRequest(url, res);
});

app.get('/api/info/:id', async (req, res) => {
  const id = req.params.id;
  const url = `https://movieapi.giftedtech.co.ke/api/info/${id}`;
  await proxyRequest(url, res);
});

app.get('/api/sources/:id', async (req, res) => {
  const id = req.params.id;
  const url = `https://movieapi.giftedtech.co.ke/api/sources/${id}`;
  await proxyRequest(url, res);
});

// Genre-based browsing endpoints
app.get('/api/trending', async (req, res) => {
  const url = `https://movieapi.giftedtech.co.ke/api/search/movie`;
  await proxyRequest(url, res);
});

app.get('/api/genre/:genre', async (req, res) => {
  const genre = encodeURIComponent(req.params.genre);
  const url = `https://movieapi.giftedtech.co.ke/api/search/${genre}`;
  await proxyRequest(url, res);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Service Worker
app.get('/service-worker.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    const CACHE_NAME = 'bb-movies-v2';
    const urlsToCache = ['/', '/manifest.json'];

    self.addEventListener('install', (event) => {
      event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
    });

    self.addEventListener('fetch', (event) => {
      if (event.request.url.includes('/api/')) {
        event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
      } else {
        event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
      }
    });
  `);
});

// Manifest
app.get('/manifest.json', (req, res) => {
  res.json({
    name: "BB Movies",
    short_name: "BBMovies",
    description: "Stream your favorite movies - A Bera Tech Creation",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#e50914",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ]
  });
});

// Serve icon placeholder
app.get('/icons/icon-:size.png', (req, res) => {
  const size = req.params.size;
  const svg = \`<svg width="\${size}" height="\${size}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#e50914"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="\${size/8}">BB</text></svg>\`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

// Main App - Embedded Frontend
const HTML = \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BB Movies - A Bera Tech Creation</title>
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#e50914">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --primary: #e50914; --primary-dark: #b2070f; --dark: #000000; 
            --dark-gray: #141414; --medium-gray: #2d2d2d; --light-gray: #8c8c8c;
            --text: #ffffff; --text-secondary: #e5e5e5; --glass: rgba(255, 255, 255, 0.1);
            --neon-glow: 0 0 10px rgba(229, 9, 20, 0.7);
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        body { font-family: 'Arial', sans-serif; background: var(--dark); color: var(--text); overflow-x: hidden; }

        /* Splash Screen */
        #splash { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: var(--dark); display: flex; justify-content: center; align-items: center; z-index: 9999; animation: fadeOut 0.5s ease 2s forwards; }
        .splash-content { text-align: center; animation: pulse 2s infinite; }
        .splash-title { font-size: 3rem; color: var(--primary); margin-bottom: 1rem; text-shadow: var(--neon-glow); }
        .splash-subtitle { font-size: 1.2rem; color: var(--text-secondary); }

        /* Navigation */
        .navbar { position: fixed; top: 0; width: 100%; padding: 1rem 2rem; background: linear-gradient(to bottom, rgba(0,0,0,0.9), transparent); display: flex; justify-content: space-between; align-items: center; z-index: 1000; backdrop-filter: blur(10px); transition: var(--transition); }
        .navbar.scrolled { background: rgba(0,0,0,0.95); }
        .logo { font-size: 1.8rem; font-weight: bold; color: var(--primary); text-decoration: none; }
        .search-container { position: relative; flex: 0 1 400px; }
        .search-input { width: 100%; padding: 0.8rem 1rem; background: var(--glass); border: 1px solid var(--medium-gray); border-radius: 25px; color: var(--text); font-size: 1rem; backdrop-filter: blur(10px); transition: var(--transition); }
        .search-input:focus { outline: none; border-color: var(--primary); box-shadow: var(--neon-glow); }
        .voice-search { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text); cursor: pointer; padding: 0.5rem; }

        /* Hero Section */
        .hero { position: relative; height: 80vh; background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.8)); display: flex; align-items: center; padding: 0 2rem; margin-bottom: 2rem; overflow: hidden; }
        .hero-background { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: -1; opacity: 0.6; }
        .hero-content { max-width: 600px; z-index: 1; animation: slideUp 1s ease; }
        .hero-title { font-size: 3rem; margin-bottom: 1rem; background: linear-gradient(45deg, var(--primary), #ff6b6b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: glow 2s ease-in-out infinite alternate; }
        .hero-description { font-size: 1.2rem; margin-bottom: 2rem; color: var(--text-secondary); }

        /* Main Content */
        .main-content { padding: 2rem; }
        .section { margin-bottom: 3rem; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .section-title { font-size: 1.5rem; color: var(--text); }

        /* Movie Rows */
        .movies-row { display: flex; gap: 1rem; overflow-x: auto; padding: 1rem 0; scrollbar-width: none; }
        .movies-row::-webkit-scrollbar { display: none; }
        .movie-card { flex: 0 0 auto; width: 200px; background: var(--dark-gray); border-radius: 10px; overflow: hidden; transition: var(--transition); cursor: pointer; position: relative; animation: fadeInUp 0.6s ease; }
        .movie-card:hover { transform: translateY(-10px) scale(1.05); box-shadow: var(--neon-glow); z-index: 100; }
        .movie-poster { width: 100%; height: 300px; object-fit: cover; transition: var(--transition); }
        .movie-card:hover .movie-poster { transform: scale(1.1); }

        /* Genre Navigation */
        .genre-nav { display: flex; gap: 1rem; margin-bottom: 2rem; overflow-x: auto; padding: 1rem 0; }
        .genre-btn { background: var(--glass); border: 1px solid var(--medium-gray); color: var(--text); padding: 0.5rem 1.5rem; border-radius: 25px; cursor: pointer; transition: var(--transition); white-space: nowrap; }
        .genre-btn.active, .genre-btn:hover { background: var(--primary); border-color: var(--primary); }

        /* Modal */
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 2000; animation: fadeIn 0.3s ease; }
        .modal-content { background: var(--dark-gray); margin: 2rem auto; max-width: 1200px; border-radius: 15px; overflow: hidden; position: relative; animation: slideUp 0.4s ease; }
        .modal-close { position: absolute; top: 1rem; right: 1rem; background: var(--glass); border: none; color: var(--text); font-size: 1.5rem; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; z-index: 1; }

        /* Player */
        .player { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: var(--dark); z-index: 3000; }
        .player video { width: 100%; height: 100%; object-fit: contain; }

        /* Animations */
        @keyframes fadeOut { to { opacity: 0; visibility: hidden; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes glow { from { text-shadow: 0 0 10px var(--primary); } to { text-shadow: 0 0 20px var(--primary), 0 0 30px var(--primary); } }

        /* Mobile */
        @media (max-width: 768px) {
            .navbar { padding: 1rem; }
            .search-container { flex: 1; margin: 0 1rem; }
            .hero { height: 60vh; padding: 0 1rem; }
            .hero-title { font-size: 2rem; }
            .movie-card { width: 150px; }
            .movie-poster { height: 225px; }
        }
    </style>
</head>
<body>
    <div id="splash">
        <div class="splash-content">
            <div class="splash-title">BB MOVIES</div>
            <div class="splash-subtitle">A BERA TECH CREATION</div>
        </div>
    </div>

    <div id="app">
        <nav class="navbar">
            <a href="#" class="logo">BB Movies</a>
            <div class="search-container">
                <input type="text" class="search-input" placeholder="Search movies..." id="searchInput">
                <button class="voice-search" id="voiceSearch">🎤</button>
                <div class="search-results" id="searchResults"></div>
            </div>
        </nav>

        <section class="hero" id="heroSection">
            <div class="hero-content">
                <h1 class="hero-title">Welcome to BB Movies</h1>
                <p class="hero-description">Stream thousands of movies from the GiftedTech API</p>
            </div>
        </section>

        <main class="main-content">
            <div class="genre-nav" id="genreNav"></div>

            <section class="section" id="trendingSection">
                <div class="section-header">
                    <h2 class="section-title">Trending Now</h2>
                </div>
                <div class="movies-row" id="trendingRow"></div>
            </section>

            <div id="genreSections"></div>
        </main>

        <div class="modal" id="movieModal">
            <div class="modal-content">
                <button class="modal-close" id="modalClose">×</button>
                <div class="modal-body">
                    <h1 class="modal-title" id="modalTitle"></h1>
                    <p class="modal-description" id="modalDescription"></p>
                    <div class="modal-actions">
                        <button class="btn btn-primary" id="playBtn">▶ Play Movie</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="player" id="videoPlayer">
            <video id="videoElement" controls></video>
        </div>
    </div>

    <script>
        class BBMoviesApp {
            constructor() {
                this.genres = ${JSON.stringify(MOVIE_GENRES)};
                this.init();
            }

            init() {
                this.registerServiceWorker();
                this.setupEventListeners();
                this.loadHomeContent();
                this.generateGenreNav();
            }

            registerServiceWorker() {
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('/service-worker.js');
                }
            }

            setupEventListeners() {
                document.getElementById('searchInput').addEventListener('input', 
                    this.debounce(this.handleSearch.bind(this), 300));
                document.getElementById('voiceSearch').addEventListener('click', 
                    this.startVoiceSearch.bind(this));
                document.getElementById('modalClose').addEventListener('click', 
                    this.closeModal.bind(this));
                window.addEventListener('scroll', this.handleScroll.bind(this));
            }

            async loadHomeContent() {
                try {
                    const response = await fetch('/api/trending');
                    const data = await response.json();
                    
                    if (data.success && data.results.items) {
                        this.displayMoviesRow(data.results.items.slice(0, 10), 'trendingRow');
                    }
                } catch (error) {
                    console.error('Error loading home content:', error);
                }
            }

            generateGenreNav() {
                const genreNav = document.getElementById('genreNav');
                genreNav.innerHTML = this.genres.map(genre => \`
                    <button class="genre-btn" onclick="app.loadGenreContent('\${genre}')">
                        \${genre}
                    </button>
                \`).join('');
            }

            async loadGenreContent(genre) {
                const sectionId = \`\${genre.toLowerCase()}Section\`;
                let section = document.getElementById(sectionId);
                
                if (!section) {
                    section = this.createGenreSection(genre, sectionId);
                    document.getElementById('genreSections').appendChild(section);
                }

                const rowId = \`\${genre.toLowerCase()}Row\`;

                try {
                    const response = await fetch(\`/api/genre/\${genre}\`);
                    const data = await response.json();
                    
                    if (data.success && data.results.items) {
                        this.displayMoviesRow(data.results.items.slice(0, 10), rowId);
                    }
                } catch (error) {
                    console.error(\`Error loading \${genre} content:\`, error);
                }
            }

            createGenreSection(genre, sectionId) {
                const section = document.createElement('section');
                section.className = 'section';
                section.id = sectionId;
                section.innerHTML = \`
                    <div class="section-header">
                        <h2 class="section-title">\${genre} Movies</h2>
                    </div>
                    <div class="movies-row" id="\${sectionId.replace('Section', 'Row')}"></div>
                \`;
                return section;
            }

            displayMoviesRow(movies, containerId) {
                const container = document.getElementById(containerId);
                if (!container) return;

                container.innerHTML = movies.map(movie => \`
                    <div class="movie-card" onclick="app.openMovieModal('\${movie.subjectId}')">
                        <img class="movie-poster" src="\${movie.cover?.url || ''}" 
                             alt="\${movie.title}" 
                             onerror="this.style.display='none'">
                        <div class="movie-info">
                            <h3 class="movie-title">\${movie.title}</h3>
                            <div class="movie-meta">
                                <span>\${movie.releaseDate?.split('-')[0] || ''}</span>
                                <span>⭐ \${movie.rating || ''}</span>
                            </div>
                        </div>
                    </div>
                \`).join('');
            }

            async openMovieModal(movieId) {
                try {
                    const response = await fetch(\`/api/info/\${movieId}\`);
                    const data = await response.json();
                    
                    if (data.success) {
                        this.currentMovie = data.results;
                        this.showMovieModal();
                    }
                } catch (error) {
                    console.error('Error loading movie info:', error);
                }
            }

            showMovieModal() {
                const movie = this.currentMovie.subject;
                document.getElementById('modalTitle').textContent = movie.title;
                document.getElementById('modalDescription').textContent = movie.description || 'No description available.';
                document.getElementById('movieModal').style.display = 'block';
            }

            closeModal() {
                document.getElementById('movieModal').style.display = 'none';
            }

            async handleSearch(event) {
                const query = event.target.value.trim();
                if (query.length < 2) {
                    document.getElementById('searchResults').style.display = 'none';
                    return;
                }

                try {
                    const response = await fetch(\`/api/search/\${encodeURIComponent(query)}\`);
                    const data = await response.json();
                    this.displaySearchResults(data.results.items || []);
                } catch (error) {
                    console.error('Search failed:', error);
                }
            }

            displaySearchResults(results) {
                const container = document.getElementById('searchResults');
                container.innerHTML = results.slice(0, 5).map(movie => \`
                    <div class="search-result-item" onclick="app.openMovieModal('\${movie.subjectId}')">
                        <strong>\${movie.title}</strong>
                        <div>\${movie.releaseDate?.split('-')[0] || ''} • \${movie.genre}</div>
                    </div>
                \`).join('');
                container.style.display = results.length > 0 ? 'block' : 'none';
            }

            startVoiceSearch() {
                if (!('webkitSpeechRecognition' in window)) {
                    alert('Voice search not supported');
                    return;
                }

                const recognition = new webkitSpeechRecognition();
                recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    document.getElementById('searchInput').value = transcript;
                    this.handleSearch({ target: document.getElementById('searchInput') });
                };
                recognition.start();
            }

            handleScroll() {
                const navbar = document.querySelector('.navbar');
                if (window.scrollY > 100) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            }

            debounce(func, wait) {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            window.app = new BBMoviesApp();
        });
    </script>
</body>
</html>\`;

// Serve the main app
app.get('/', (req, res) => {
  res.send(HTML);
});

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 BB Movies server running on port \${PORT}\`);
  console.log(\`📱 App available at http://localhost:\${PORT}\`);
});

module.exports = app;
