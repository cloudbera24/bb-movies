require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Serve the complete HTML application
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BB Movies - Stream HD Movies</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary: #e50914;
            --primary-dark: #b20710;
            --black: #000000;
            --dark: #141414;
            --gray: #2f2f2f;
            --light-gray: #8c8c8c;
            --white: #ffffff;
            --silver: #e6e6e6;
            --glass: rgba(255, 255, 255, 0.1);
            --glass-dark: rgba(0, 0, 0, 0.7);
            --neon-glow: 0 0 10px var(--primary), 0 0 20px var(--primary), 0 0 40px var(--primary);
        }

        [data-theme="light"] {
            --black: #ffffff;
            --dark: #f5f5f5;
            --gray: #e0e0e0;
            --light-gray: #666666;
            --white: #000000;
            --silver: #333333;
            --glass: rgba(0, 0, 0, 0.1);
            --glass-dark: rgba(255, 255, 255, 0.7);
        }

        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, var(--black) 0%, var(--dark) 50%, #1a1a1a 100%);
            color: var(--white);
            min-height: 100vh;
            overflow-x: hidden;
            transition: all 0.3s ease;
        }

        .splash-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, var(--black) 0%, var(--primary-dark) 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            animation: fadeOut 0.5s ease 2s forwards;
        }

        .splash-logo {
            font-size: 4rem;
            font-weight: bold;
            background: linear-gradient(45deg, var(--white), var(--primary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: var(--neon-glow);
            margin-bottom: 1rem;
            animation: pulse 2s infinite;
        }

        .splash-subtitle {
            color: var(--silver);
            font-size: 1.2rem;
            opacity: 0;
            animation: fadeIn 0.5s ease 1s forwards;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }

        @keyframes fadeIn {
            to { opacity: 1; }
        }

        @keyframes fadeOut {
            to { opacity: 0; visibility: hidden; }
        }

        .header {
            position: fixed;
            top: 0;
            width: 100%;
            padding: 1rem 2rem;
            background: linear-gradient(to bottom, rgba(0,0,0,0.9), transparent);
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 1000;
            backdrop-filter: blur(10px);
        }

        .logo {
            font-size: 2rem;
            font-weight: bold;
            color: var(--primary);
            text-shadow: var(--neon-glow);
        }

        .nav-links {
            display: flex;
            gap: 2rem;
            align-items: center;
        }

        .nav-link {
            color: var(--white);
            text-decoration: none;
            transition: color 0.3s ease;
            cursor: pointer;
        }

        .nav-link:hover {
            color: var(--primary);
        }

        .search-container {
            position: relative;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .search-input {
            background: var(--glass);
            border: 1px solid var(--gray);
            border-radius: 25px;
            padding: 0.5rem 1rem;
            color: var(--white);
            width: 300px;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        }

        .search-input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: var(--neon-glow);
        }

        .voice-search {
            background: var(--primary);
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            color: var(--white);
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .voice-search:hover {
            transform: scale(1.1);
            box-shadow: var(--neon-glow);
        }

        .voice-search.listening {
            animation: pulse 1s infinite;
            background: var(--primary-dark);
        }

        .main-content {
            margin-top: 80px;
            padding: 2rem;
        }

        .section {
            margin-bottom: 3rem;
        }

        .section-title {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: var(--white);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .movies-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
        }

        .movie-card {
            position: relative;
            border-radius: 10px;
            overflow: hidden;
            transition: all 0.3s ease;
            cursor: pointer;
            background: var(--glass);
            backdrop-filter: blur(10px);
            border: 1px solid transparent;
        }

        .movie-card:hover {
            transform: translateY(-10px) scale(1.05);
            border-color: var(--primary);
            box-shadow: var(--neon-glow);
        }

        .movie-poster {
            width: 100%;
            height: 300px;
            object-fit: cover;
        }

        .movie-info {
            padding: 1rem;
            background: linear-gradient(transparent, var(--glass-dark));
            position: absolute;
            bottom: 0;
            width: 100%;
        }

        .movie-title {
            font-weight: bold;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
        }

        .movie-year {
            color: var(--light-gray);
            font-size: 0.8rem;
        }

        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--glass-dark);
            backdrop-filter: blur(10px);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            padding: 2rem;
        }

        .modal.active {
            display: flex;
        }

        .modal-content {
            background: linear-gradient(135deg, var(--dark) 0%, var(--black) 100%);
            border-radius: 15px;
            max-width: 900px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            border: 1px solid var(--primary);
            box-shadow: var(--neon-glow);
        }

        .modal-header {
            padding: 2rem;
            border-bottom: 1px solid var(--gray);
            display: flex;
            justify-content: between;
            align-items: start;
            gap: 2rem;
        }

        .modal-poster {
            width: 200px;
            height: 300px;
            object-fit: cover;
            border-radius: 10px;
        }

        .modal-details {
            flex: 1;
        }

        .modal-title {
            font-size: 2rem;
            margin-bottom: 1rem;
            color: var(--white);
        }

        .modal-meta {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
            color: var(--light-gray);
        }

        .modal-description {
            line-height: 1.6;
            margin-bottom: 1rem;
        }

        .modal-actions {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .btn-primary {
            background: var(--primary);
            color: var(--white);
        }

        .btn-primary:hover {
            background: var(--primary-dark);
            box-shadow: var(--neon-glow);
        }

        .btn-secondary {
            background: var(--glass);
            color: var(--white);
            border: 1px solid var(--gray);
        }

        .btn-secondary:hover {
            border-color: var(--primary);
            box-shadow: var(--neon-glow);
        }

        .modal-body {
            padding: 2rem;
        }

        .quality-selector {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
            flex-wrap: wrap;
        }

        .quality-btn {
            padding: 0.5rem 1rem;
            border: 1px solid var(--gray);
            background: transparent;
            color: var(--white);
            border-radius: 15px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .quality-btn:hover, .quality-btn.active {
            border-color: var(--primary);
            background: var(--primary);
            box-shadow: var(--neon-glow);
        }

        .video-container {
            position: relative;
            width: 100%;
            margin-top: 1rem;
        }

        #moviePlayer {
            width: 100%;
            border-radius: 10px;
            background: var(--black);
        }

        .cinema-mode #moviePlayer {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 3000;
            border-radius: 0;
        }

        .cinema-mode .cinema-exit {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 3001;
            background: var(--glass);
            color: var(--white);
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 1.5rem;
            cursor: pointer;
            backdrop-filter: blur(10px);
        }

        .profile-panel {
            position: fixed;
            top: 0;
            right: -400px;
            width: 400px;
            height: 100vh;
            background: linear-gradient(135deg, var(--dark) 0%, var(--black) 100%);
            border-left: 1px solid var(--primary);
            transition: right 0.3s ease;
            z-index: 1500;
            padding: 2rem;
            overflow-y: auto;
        }

        .profile-panel.active {
            right: 0;
        }

        .profile-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid var(--primary);
            cursor: pointer;
        }

        .avatar-upload {
            display: none;
        }

        .profile-section {
            margin-bottom: 2rem;
        }

        .profile-section h3 {
            margin-bottom: 1rem;
            color: var(--primary);
        }

        .theme-toggle {
            display: flex;
            gap: 1rem;
        }

        .theme-btn {
            flex: 1;
            padding: 1rem;
            border: 1px solid var(--gray);
            background: transparent;
            color: var(--white);
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .theme-btn.active {
            border-color: var(--primary);
            background: var(--primary);
        }

        .install-prompt {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--primary);
            color: var(--white);
            border: none;
            border-radius: 25px;
            padding: 1rem 1.5rem;
            cursor: pointer;
            z-index: 1000;
            box-shadow: var(--neon-glow);
            display: none;
        }

        .install-prompt.show {
            display: block;
        }

        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2rem;
        }

        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--gray);
            border-top: 4px solid var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
            .search-input {
                width: 200px;
            }
            .nav-links {
                gap: 1rem;
            }
            .modal-header {
                flex-direction: column;
            }
            .modal-poster {
                width: 150px;
                height: 225px;
            }
            .profile-panel {
                width: 100%;
                right: -100%;
            }
            .movies-grid {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            }
        }

        @media (max-width: 480px) {
            .header {
                padding: 1rem;
            }
            .search-input {
                width: 150px;
            }
            .logo {
                font-size: 1.5rem;
            }
            .main-content {
                padding: 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="splash-screen">
        <div class="splash-logo">BB MOVIES</div>
        <div class="splash-subtitle">A BERA TECH CREATION</div>
    </div>

    <header class="header">
        <div class="logo">BB</div>
        <nav class="nav-links">
            <a class="nav-link" onclick="showSection('trending')">🔥 Trending</a>
            <a class="nav-link" onclick="showSection('watchlist')">❤️ Watchlist</a>
            <a class="nav-link" onclick="showSection('downloads')">💾 Downloads</a>
            <a class="nav-link" onclick="showSection('continue')">🎥 Continue</a>
            <div class="search-container">
                <input type="text" class="search-input" placeholder="Search movies..." id="searchInput">
                <button class="voice-search" onclick="toggleVoiceSearch()">🎤</button>
            </div>
            <a class="nav-link" onclick="toggleProfile()">👤 Profile</a>
        </nav>
    </header>

    <main class="main-content">
        <section id="trending" class="section">
            <h2 class="section-title">🔥 Trending Now</h2>
            <div class="movies-grid" id="trendingGrid">
                <div class="loading"><div class="spinner"></div></div>
            </div>
        </section>

        <section id="watchlist" class="section" style="display: none;">
            <h2 class="section-title">❤️ My Watchlist</h2>
            <div class="movies-grid" id="watchlistGrid">
                <div class="loading">No movies in watchlist yet</div>
            </div>
        </section>

        <section id="downloads" class="section" style="display: none;">
            <h2 class="section-title">💾 My Downloads</h2>
            <div class="movies-grid" id="downloadsGrid">
                <div class="loading">No downloads yet</div>
            </div>
        </section>

        <section id="continue" class="section" style="display: none;">
            <h2 class="section-title">🎥 Continue Watching</h2>
            <div class="movies-grid" id="continueGrid">
                <div class="loading">No recent watches</div>
            </div>
        </section>

        <section id="searchResults" class="section" style="display: none;">
            <h2 class="section-title">🔍 Search Results</h2>
            <div class="movies-grid" id="searchResultsGrid"></div>
        </section>
    </main>

    <div class="modal" id="movieModal">
        <div class="modal-content">
            <div class="modal-header">
                <img class="modal-poster" id="modalPoster" src="" alt="Movie Poster">
                <div class="modal-details">
                    <h1 class="modal-title" id="modalTitle">Movie Title</h1>
                    <div class="modal-meta">
                        <span id="modalYear">2023</span>
                        <span id="modalRating">⭐ 8.5</span>
                        <span id="modalGenre">Action</span>
                    </div>
                    <p class="modal-description" id="modalDescription">Movie description goes here...</p>
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="playMovie()">▶️ Stream Now</button>
                        <button class="btn btn-secondary" onclick="downloadMovie()">💾 Download</button>
                        <button class="btn btn-secondary" onclick="toggleWatchlist()">❤️ Add to Watchlist</button>
                    </div>
                </div>
            </div>
            <div class="modal-body">
                <div class="quality-selector" id="qualitySelector" style="display: none;"></div>
                <div class="video-container" id="videoContainer" style="display: none;">
                    <video id="moviePlayer" controls>Your browser does not support the video tag.</video>
                    <button class="cinema-exit" onclick="exitCinemaMode()" style="display: none;">✕</button>
                </div>
            </div>
        </div>
    </div>

    <div class="profile-panel" id="profilePanel">
        <div class="profile-header">
            <img class="avatar" id="profileAvatar" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1MDkxNCIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjM1ZW0iIGZpbGw9IiNmZmYiPlVzZXI8L3RleHQ+PC9zdmc+" alt="Avatar">
            <input type="file" class="avatar-upload" id="avatarUpload" accept="image/*">
            <div>
                <h3>User Profile</h3>
                <p>Customize your experience</p>
            </div>
        </div>

        <div class="profile-section">
            <h3>Theme Preferences</h3>
            <div class="theme-toggle">
                <button class="theme-btn active" onclick="setTheme('dark')">🌙 Dark</button>
                <button class="theme-btn" onclick="setTheme('light')">☀️ Light</button>
            </div>
        </div>

        <div class="profile-section">
            <h3>Playback Settings</h3>
            <select id="playbackSpeed" class="search-input">
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1" selected>Normal</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
            </select>
        </div>

        <div class="profile-section">
            <h3>Favorite Genres</h3>
            <div id="genrePreferences"></div>
        </div>

        <div class="profile-section">
            <h3>Data Management</h3>
            <button class="btn btn-secondary" onclick="clearAllData()">Clear All Data</button>
        </div>
    </div>

    <button class="install-prompt" id="installPrompt">📱 Install App</button>

    <script>
        class BBMovies {
            constructor() {
                this.currentMovie = null;
                this.watchlist = this.getStoredData('watchlist') || [];
                this.downloads = this.getStoredData('downloads') || [];
                this.continueWatching = this.getStoredData('continueWatching') || [];
                this.userPreferences = this.getStoredData('userPreferences') || {
                    theme: 'dark',
                    playbackSpeed: 1,
                    favoriteGenres: []
                };
                this.isListening = false;
                this.recognition = null;
                this.init();
            }

            init() {
                this.setupEventListeners();
                this.loadTrendingMovies();
                this.setupServiceWorker();
                this.setupProfile();
                this.showInstallPrompt();
                this.setTheme(this.userPreferences.theme);
            }

            setupEventListeners() {
                const searchInput = document.getElementById('searchInput');
                let searchTimeout;
                
                searchInput.addEventListener('input', (e) => {
                    clearTimeout(searchTimeout);
                    const query = e.target.value.trim();
                    if (query.length > 2) {
                        searchTimeout = setTimeout(() => this.searchMovies(query), 500);
                    } else if (query.length === 0) {
                        this.hideSearchResults();
                    }
                });

                document.getElementById('avatarUpload').addEventListener('change', (e) => {
                    this.handleAvatarUpload(e.target.files[0]);
                });

                document.getElementById('profileAvatar').addEventListener('click', () => {
                    document.getElementById('avatarUpload').click();
                });

                document.getElementById('playbackSpeed').addEventListener('change', (e) => {
                    this.userPreferences.playbackSpeed = parseFloat(e.target.value);
                    this.saveUserPreferences();
                });

                const videoPlayer = document.getElementById('moviePlayer');
                videoPlayer.addEventListener('timeupdate', () => {
                    this.savePlaybackProgress();
                });

                videoPlayer.addEventListener('dblclick', () => {
                    this.toggleCinemaMode();
                });

                document.getElementById('movieModal').addEventListener('click', (e) => {
                    if (e.target === document.getElementById('movieModal')) {
                        this.closeModal();
                    }
                });
            }

            async loadTrendingMovies() {
                try {
                    const demoMovies = [
                        {
                            id: 'demo1',
                            title: 'Avengers: Endgame',
                            description: 'Superhero Action',
                            image: 'https://via.placeholder.com/300x450/333333/FFFFFF?text=Avengers',
                            releaseDate: '2019'
                        },
                        {
                            id: 'demo2', 
                            title: 'Spider-Man: No Way Home',
                            description: 'Superhero Adventure',
                            image: 'https://via.placeholder.com/300x450/333333/FFFFFF?text=Spider-Man',
                            releaseDate: '2021'
                        },
                        {
                            id: 'demo3',
                            title: 'The Batman',
                            description: 'Action Crime',
                            image: 'https://via.placeholder.com/300x450/333333/FFFFFF?text=Batman',
                            releaseDate: '2022'
                        }
                    ];

                    try {
                        const response = await fetch('/api/search/avengers');
                        if (response.ok) {
                            const data = await response.json();
                            if (data && data.results) {
                                this.displayMovies(data.results.slice(0, 12), 'trendingGrid');
                                return;
                            }
                        }
                    } catch (apiError) {
                        console.log('API failed, using demo data');
                    }

                    this.displayMovies(demoMovies, 'trendingGrid');
                    
                } catch (error) {
                    console.error('Error loading trending movies:', error);
                    document.getElementById('trendingGrid').innerHTML = '<div class="loading">Failed to load trending movies</div>';
                }
            }

            async searchMovies(query) {
                try {
                    document.getElementById('searchResultsGrid').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
                    this.showSearchResults();
                    
                    const response = await fetch('/api/search/' + encodeURIComponent(query));
                    
                    if (!response.ok) {
                        throw new Error('API responded with status: ' + response.status);
                    }
                    
                    const data = await response.json();
                    
                    if (data && data.results) {
                        this.displayMovies(data.results, 'searchResultsGrid');
                    } else {
                        document.getElementById('searchResultsGrid').innerHTML = '<div class="loading">No movies found</div>';
                    }
                } catch (error) {
                    console.error('Error searching movies:', error);
                    document.getElementById('searchResultsGrid').innerHTML = '<div class="loading">Search failed - API not available</div>';
                }
            }

            displayMovies(movies, containerId) {
                const container = document.getElementById(containerId);
                
                if (!movies || movies.length === 0) {
                    container.innerHTML = '<div class="loading">No movies found</div>';
                    return;
                }

                container.innerHTML = movies.map(movie => {
                    return '<div class="movie-card" onclick="app.showMovieInfo(\\'' + movie.id + '\\')">' +
                           '<img class="movie-poster" src="' + (movie.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzJmMmYyZiIvPjx0ZXh0IHg9IjEwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM4YzhjOGMiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==') + '" alt="' + movie.title + '">' +
                           '<div class="movie-info">' +
                           '<div class="movie-title">' + movie.title + '</div>' +
                           '<div class="movie-year">' + (movie.description || 'Movie') + '</div>' +
                           '</div></div>';
                }).join('');
            }

            async showMovieInfo(movieId) {
                try {
                    document.getElementById('movieModal').classList.add('active');
                    
                    const demoMovie = {
                        id: movieId,
                        title: movieId.startsWith('demo') ? 'Demo Movie ' + movieId.replace('demo', '') : 'Movie Title',
                        image: 'https://via.placeholder.com/300x450/333333/FFFFFF?text=Movie+Poster',
                        releaseDate: '2023',
                        rating: '8.5',
                        genres: ['Action', 'Adventure'],
                        description: 'This is a demo movie description. In a real app, this would be fetched from the movie API.'
                    };

                    try {
                        const response = await fetch('/api/info/' + movieId);
                        if (response.ok) {
                            const movie = await response.json();
                            this.currentMovie = movie;
                        } else {
                            this.currentMovie = demoMovie;
                        }
                    } catch (apiError) {
                        console.log('API failed, using demo data');
                        this.currentMovie = demoMovie;
                    }
                    
                    document.getElementById('modalPoster').src = this.currentMovie.image || '';
                    document.getElementById('modalTitle').textContent = this.currentMovie.title;
                    document.getElementById('modalYear').textContent = this.currentMovie.releaseDate || 'N/A';
                    document.getElementById('modalRating').textContent = '⭐ ' + (this.currentMovie.rating || 'N/A');
                    document.getElementById('modalGenre').textContent = this.currentMovie.genres ? this.currentMovie.genres.join(', ') : 'Unknown';
                    document.getElementById('modalDescription').textContent = this.currentMovie.description || 'No description available.';
                    
                    const isInWatchlist = this.watchlist.some(m => m.id === movieId);
                    const watchlistBtn = document.querySelector('.btn-secondary:nth-child(3)');
                    watchlistBtn.innerHTML = isInWatchlist ? '❤️ Remove from Watchlist' : '❤️ Add to Watchlist';
                    
                } catch (error) {
                    console.error('Error loading movie info:', error);
                    alert('Failed to load movie information - API not available');
                }
            }

            async playMovie() {
                if (!this.currentMovie) return;
                
                try {
                    const demoSources = {
                        sources: [
                            {
                                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                                quality: '720p'
                            }
                        ]
                    };

                    let sources = demoSources;
                    
                    try {
                        const response = await fetch('/api/sources/' + this.currentMovie.id);
                        if (response.ok) {
                            const apiSources = await response.json();
                            if (apiSources && apiSources.sources) {
                                sources = apiSources;
                            }
                        }
                    } catch (apiError) {
                        console.log('API failed, using demo video');
                    }
                    
                    if (sources && sources.sources && sources.sources.length > 0) {
                        const videoPlayer = document.getElementById('moviePlayer');
                        const videoContainer = document.getElementById('videoContainer');
                        const qualitySelector = document.getElementById('qualitySelector');
                        
                        videoContainer.style.display = 'block';
                        videoPlayer.src = sources.sources[0].url;
                        videoPlayer.load();
                        videoPlayer.playbackRate = this.userPreferences.playbackSpeed;
                        
                        const progress = this.getPlaybackProgress(this.currentMovie.id);
                        if (progress > 0) {
                            videoPlayer.currentTime = progress;
                        }
                        
                        if (sources.sources.length > 1) {
                            this.showQualitySelector(sources.sources);
                        }
                        
                    } else {
                        alert('No video sources available for this movie');
                    }
                } catch (error) {
                    console.error('Error playing movie:', error);
                    alert('Failed to play movie - using demo video');
                }
            }

            showQualitySelector(sources) {
                const container = document.getElementById('qualitySelector');
                container.innerHTML = sources.map((source, index) => {
                    return '<button class="quality-btn ' + (index === 0 ? 'active' : '') + '" onclick="app.changeQuality(\\'' + source.url + '\\', this)">' + (source.quality || 'Unknown') + '</button>';
                }).join('');
                container.style.display = 'flex';
            }

            changeQuality(url, button) {
                const videoPlayer = document.getElementById('moviePlayer');
                const currentTime = videoPlayer.currentTime;
                
                document.querySelectorAll('.quality-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                videoPlayer.src = url;
                videoPlayer.currentTime = currentTime;
                videoPlayer.play();
            }

            async downloadMovie() {
                if (!this.currentMovie) return;
                
                try {
                    const downloadInfo = {
                        ...this.currentMovie,
                        downloadDate: new Date().toISOString(),
                        source: 'demo-source'
                    };
                    
                    this.downloads.push(downloadInfo);
                    this.saveDownloads();
                    
                    alert('Movie added to downloads! (Demo mode)');
                    this.updateDownloadsDisplay();
                    
                } catch (error) {
                    console.error('Error downloading movie:', error);
                    alert('Failed to download movie');
                }
            }

            toggleWatchlist() {
                if (!this.currentMovie) return;
                
                const index = this.watchlist.findIndex(m => m.id === this.currentMovie.id);
                
                if (index > -1) {
                    this.watchlist.splice(index, 1);
                } else {
                    this.watchlist.push(this.currentMovie);
                }
                
                this.saveWatchlist();
                this.showMovieInfo(this.currentMovie.id);
                this.updateWatchlistDisplay();
            }

            savePlaybackProgress() {
                if (!this.currentMovie) return;
                
                const videoPlayer = document.getElementById('moviePlayer');
                const progress = {
                    movieId: this.currentMovie.id,
                    progress: videoPlayer.currentTime,
                    duration: videoPlayer.duration,
                    timestamp: new Date().toISOString()
                };
                
                const index = this.continueWatching.findIndex(item => item.movieId === this.currentMovie.id);
                if (index > -1) {
                    this.continueWatching[index] = progress;
                } else {
                    this.continueWatching.push(progress);
                }
                
                this.saveContinueWatching();
            }

            getPlaybackProgress(movieId) {
                const progress = this.continueWatching.find(item => item.movieId === movieId);
                return progress ? progress.progress : 0;
            }

            toggleCinemaMode() {
                document.body.classList.toggle('cinema-mode');
                const exitBtn = document.querySelector('.cinema-exit');
                exitBtn.style.display = document.body.classList.contains('cinema-mode') ? 'block' : 'none';
            }

            exitCinemaMode() {
                document.body.classList.remove('cinema-mode');
                document.querySelector('.cinema-exit').style.display = 'none';
            }

            toggleVoiceSearch() {
                if (!this.recognition) {
                    this.initVoiceRecognition();
                }
                
                if (this.isListening) {
                    this.stopVoiceSearch();
                } else {
                    this.startVoiceSearch();
                }
            }

            initVoiceRecognition() {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                
                if (!SpeechRecognition) {
                    alert('Voice search not supported in this browser');
                    return;
                }
                
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = false;
                this.recognition.interimResults = false;
                
                this.recognition.onstart = () => {
                    this.isListening = true;
                    document.querySelector('.voice-search').classList.add('listening');
                };
                
                this.recognition.onend = () => {
                    this.isListening = false;
                    document.querySelector('.voice-search').classList.remove('listening');
                };
                
                this.recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    document.getElementById('searchInput').value = transcript;
                    this.searchMovies(transcript);
                };
                
                this.recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    this.isListening = false;
                    document.querySelector('.voice-search').classList.remove('listening');
                };
            }

            startVoiceSearch() {
                if (this.recognition) {
                    this.recognition.start();
                }
            }

            stopVoiceSearch() {
                if (this.recognition) {
                    this.recognition.stop();
                }
            }

            setupProfile() {
                this.setTheme(this.userPreferences.theme);
                document.getElementById('playbackSpeed').value = this.userPreferences.playbackSpeed;
                this.setupGenrePreferences();
            }

            setTheme(theme) {
                this.userPreferences.theme = theme;
                document.body.setAttribute('data-theme', theme);
                
                document.querySelectorAll('.theme-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.textContent.includes(theme === 'dark' ? 'Dark' : 'Light')) {
                        btn.classList.add('active');
                    }
                });
                
                this.saveUserPreferences();
            }

            setupGenrePreferences() {
                const commonGenres = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Adventure'];
                const container = document.getElementById('genrePreferences');
                
                container.innerHTML = commonGenres.map(genre => {
                    return '<label style="display: block; margin: 0.5rem 0;">' +
                           '<input type="checkbox" value="' + genre + '" ' +
                           (this.userPreferences.favoriteGenres.includes(genre) ? 'checked' : '') +
                           ' onchange="app.toggleGenre(\\'' + genre + '\\')"> ' + genre +
                           '</label>';
                }).join('');
            }

            toggleGenre(genre) {
                const index = this.userPreferences.favoriteGenres.indexOf(genre);
                
                if (index > -1) {
                    this.userPreferences.favoriteGenres.splice(index, 1);
                } else {
                    this.userPreferences.favoriteGenres.push(genre);
                }
                
                this.saveUserPreferences();
            }

            handleAvatarUpload(file) {
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        document.getElementById('profileAvatar').src = e.target.result;
                        this.userPreferences.avatar = e.target.result;
                        this.saveUserPreferences();
                    };
                    reader.readAsDataURL(file);
                }
            }

            getStoredData(key) {
                try {
                    return JSON.parse(localStorage.getItem(key));
                } catch {
                    return null;
                }
            }

            setStoredData(key, data) {
                localStorage.setItem(key, JSON.stringify(data));
            }

            saveWatchlist() { this.setStoredData('watchlist', this.watchlist); }
            saveDownloads() { this.setStoredData('downloads', this.downloads); }
            saveContinueWatching() { this.setStoredData('continueWatching', this.continueWatching); }
            saveUserPreferences() { this.setStoredData('userPreferences', this.userPreferences); }

            clearAllData() {
                if (confirm('Are you sure you want to clear all data?')) {
                    localStorage.clear();
                    this.watchlist = [];
                    this.downloads = [];
                    this.continueWatching = [];
                    this.userPreferences = {
                        theme: 'dark',
                        playbackSpeed: 1,
                        favoriteGenres: []
                    };
                    this.setupProfile();
                    this.updateAllDisplays();
                    alert('All data cleared!');
                }
            }

            updateWatchlistDisplay() {
                this.displayMovies(this.watchlist, 'watchlistGrid');
            }

            updateDownloadsDisplay() {
                this.displayMovies(this.downloads, 'downloadsGrid');
            }

            updateContinueWatchingDisplay() {
                const continueMovies = this.continueWatching.map(progress => {
                    return this.watchlist.find(m => m.id === progress.movieId) || 
                           this.downloads.find(m => m.id === progress.movieId);
                }).filter(Boolean);
                
                this.displayMovies(continueMovies, 'continueGrid');
            }

            updateAllDisplays() {
                this.updateWatchlistDisplay();
                this.updateDownloadsDisplay();
                this.updateContinueWatchingDisplay();
            }

            showSection(sectionId) {
                document.querySelectorAll('.section').forEach(section => {
                    section.style.display = 'none';
                });
                
                document.getElementById(sectionId).style.display = 'block';
                
                if (sectionId === 'watchlist') this.updateWatchlistDisplay();
                if (sectionId === 'downloads') this.updateDownloadsDisplay();
                if (sectionId === 'continue') this.updateContinueWatchingDisplay();
            }

            showSearchResults() {
                this.hideAllSections();
                document.getElementById('searchResults').style.display = 'block';
            }

            hideSearchResults() {
                document.getElementById('searchResults').style.display = 'none';
                document.getElementById('trending').style.display = 'block';
            }

            hideAllSections() {
                document.querySelectorAll('.section').forEach(section => {
                    section.style.display = 'none';
                });
            }

            closeModal() {
                document.getElementById('movieModal').classList.remove('active');
                document.getElementById('videoContainer').style.display = 'none';
                document.getElementById('qualitySelector').style.display = 'none';
                
                const videoPlayer = document.getElementById('moviePlayer');
                videoPlayer.pause();
                videoPlayer.src = '';
                
                this.exitCinemaMode();
            }

            showInstallPrompt() {
                let deferredPrompt;
                
                window.addEventListener('beforeinstallprompt', (e) => {
                    e.preventDefault();
                    deferredPrompt = e;
                    document.getElementById('installPrompt').classList.add('show');
                });
                
                document.getElementById('installPrompt').addEventListener('click', async () => {
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                        const { outcome } = await deferredPrompt.userChoice;
                        if (outcome === 'accepted') {
                            document.getElementById('installPrompt').classList.remove('show');
                        }
                        deferredPrompt = null;
                    }
                });
            }

            setupServiceWorker() {
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('/service-worker.js')
                        .then(() => console.log('✅ Service Worker Registered'))
                        .catch(err => console.log('❌ Service Worker registration failed:', err));
                }
            }
        }

        function showSection(section) { app.showSection(section); }
        function toggleProfile() { document.getElementById('profilePanel').classList.toggle('active'); }
        function setTheme(theme) { app.setTheme(theme); }
        function toggleVoiceSearch() { app.toggleVoiceSearch(); }
        function playMovie() { app.playMovie(); }
        function downloadMovie() { app.downloadMovie(); }
        function toggleWatchlist() { app.toggleWatchlist(); }
        function exitCinemaMode() { app.exitCinemaMode(); }
        function clearAllData() { app.clearAllData(); }

        let app;
        document.addEventListener('DOMContentLoaded', () => {
            app = new BBMovies();
        });
    </script>
</body>
</html>
  `);
});

// API Proxy endpoints
app.get('/api/search/:query', async (req, res) => {
  try {
    console.log('Searching for:', req.params.query);
    const apiUrl = 'https://movieapi.giftedtech.co.ke/api/search/' + encodeURIComponent(req.params.query);
    
    console.log('Calling API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error('API responded with status: ' + response.status);
    }
    
    const data = await response.json();
    console.log('Search successful, found:', data.results ? data.results.length : 0, 'results');
    res.json(data);
    
  } catch (error) {
    console.error('Search error:', error.message);
    
    const demoData = {
      results: [
        {
          id: 'demo-search-1',
          title: 'Search: ' + req.params.query,
          description: 'Demo search result 1',
          image: 'https://via.placeholder.com/300x450/333333/FFFFFF?text=Search+1',
          releaseDate: '2023'
        },
        {
          id: 'demo-search-2',
          title: 'Movie about ' + req.params.query,
          description: 'Demo search result 2', 
          image: 'https://via.placeholder.com/300x450/333333/FFFFFF?text=Search+2',
          releaseDate: '2023'
        }
      ]
    };
    
    res.json(demoData);
  }
});

app.get('/api/info/:id', async (req, res) => {
  try {
    console.log('Fetching info for ID:', req.params.id);
    const apiUrl = 'https://movieapi.giftedtech.co.ke/api/info/' + req.params.id;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error('API responded with status: ' + response.status);
    }
    
    const data = await response.json();
    console.log('Info fetched for:', data.title);
    res.json(data);
    
  } catch (error) {
    console.error('Info error:', error.message);
    
    const demoInfo = {
      id: req.params.id,
      title: 'Movie ' + req.params.id,
      description: 'This is a demo movie description. The actual movie API appears to be unavailable.',
      image: 'https://via.placeholder.com/300x450/333333/FFFFFF?text=Movie+Poster',
      releaseDate: '2023',
      rating: '7.5',
      genres: ['Action', 'Adventure']
    };
    
    res.json(demoInfo);
  }
});

app.get('/api/sources/:id', async (req, res) => {
  try {
    console.log('Fetching sources for ID:', req.params.id);
    const apiUrl = 'https://movieapi.giftedtech.co.ke/api/sources/' + req.params.id;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error('API responded with status: ' + response.status);
    }
    
    const data = await response.json();
    console.log('Sources fetched, available qualities:', data.sources ? data.sources.length : 0);
    res.json(data);
    
  } catch (error) {
    console.error('Sources error:', error.message);
    
    const demoSources = {
      sources: [
        {
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          quality: '720p',
          type: 'video/mp4'
        }
      ]
    };
    
    res.json(demoSources);
  }
});

// Service Worker route
app.get('/service-worker.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.send(`
const CACHE_NAME = "bbmovies-v1";
const ASSETS = [
  "/",
  "/index.html", 
  "/style.css",
  "/script.js",
  "/manifest.json",
  "/service-worker.js"
];

self.addEventListener("install", e => {
  console.log("Service Worker Installing...");
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("Caching app shell");
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  console.log("Service Worker Activated");
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request)
      .then(response => {
        return response || fetch(e.request)
          .then(fetchResponse => {
            if (!fetchResponse || fetchResponse.status !== 200) {
              return fetchResponse;
            }

            const responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(e.request, responseToCache);
              });

            return fetchResponse;
          })
          .catch(error => {
            console.log("Fetch failed:", error);
            return caches.match('/');
          });
      })
  );
});
  `);
});

// Manifest route
app.get('/manifest.json', (req, res) => {
  res.json({
    "name": "BB Movies",
    "short_name": "BBMovies", 
    "start_url": "/",
    "display": "standalone",
    "background_color": "#000000",
    "theme_color": "#e50914",
    "description": "Stream and download HD movies — powered by Bera Tech",
    "icons": [
      {
        "src": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE5MiIgaGVpZ2h0PSIxOTIiIGZpbGw9IiMwMDAiLz48cmVjdCB4PSI0MCIgeT0iNDAiIHdpZHRoPSIxMTIiIGhlaWdodD0iMTEyIiBmaWxsPSIjZTUwOTE0Ii8+PHN2Zz48dGV4dCB4PSI5NiIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmZmYiPkJCPC90ZXh0Pjwvc3ZnPjwvc3ZnPg==",
        "sizes": "192x192",
        "type": "image/svg+xml"
      },
      {
        "src": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiIGZpbGw9IiMwMDAiLz48cmVjdCB4PSIxMDAiIHk9IjEwMCIgd2lkdGg9IjMxMiIgaGVpZ2h0PSIzMTIiIGZpbGw9IiNlNTA5MTQiLz48c3ZnPjx0ZXh0IHg9IjI1NiIgeT0iMjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmZmYiPkJCPC90ZXh0Pjwvc3ZnPjwvc3ZnPg==",
        "sizes": "512x512", 
        "type": "image/svg+xml"
      }
    ]
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'BB Movies API is running',
    timestamp: new Date().toISOString()
  });
});

// API status endpoint
app.get('/api/status', async (req, res) => {
  try {
    const testResponse = await fetch('https://movieapi.giftedtech.co.ke/api/search/test');
    const apiStatus = testResponse.ok ? 'online' : 'offline';
    
    res.json({
      apiStatus,
      server: 'running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      apiStatus: 'offline',
      server: 'running',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Fallback for all other routes
app.get('*', (req, res) => {
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log('BB Movies Server running on port ' + PORT);
  console.log('Powered by Bera Tech');
  console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
});
