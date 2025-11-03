require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 8080;

// Supabase Configuration
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Movie API Base URL
const MOVIE_API_BASE = 'https://movieapi.giftedtech.co.ke/api';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve main HTML with enhanced Beraflix design
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Beraflix - Stream & Download HD Movies & TV Shows</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@300;400;500;600;700;800;900&family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --bera-red: #e50914;
            --bera-dark-red: #b2070f;
            --bera-gold: #ffd700;
            --bera-blue: #00a8ff;
            --bera-green: #00ff88;
            --bera-purple: #8a2be2;
            --bera-black: #0a0a0a;
            --bera-dark: #141414;
            --bera-gray: #2a2a2a;
            --bera-light: #8c8c8c;
            --bera-white: #ffffff;
            --bera-gradient: linear-gradient(135deg, #e50914 0%, #b2070f 50%, #8b0000 100%);
            --bera-premium: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
            --bera-glow: 0 0 20px rgba(229, 9, 20, 0.5);
        }

        body {
            background: var(--bera-black);
            color: var(--bera-white);
            font-family: 'Montserrat', 'Roboto', sans-serif;
            overflow-x: hidden;
            line-height: 1.6;
        }

        /* Splash Screen */
        .splash-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--bera-black);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }

        .splash-logo {
            font-family: 'Bebas Neue', cursive;
            font-size: 8rem;
            font-weight: bold;
            background: var(--bera-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: splashPulse 2s infinite;
            letter-spacing: 6px;
            text-shadow: var(--bera-glow);
            margin-bottom: 2rem;
        }

        .splash-tagline {
            font-size: 1.5rem;
            color: var(--bera-white);
            opacity: 0.8;
            font-weight: 300;
            letter-spacing: 2px;
        }

        @keyframes splashPulse {
            0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
            25% { transform: scale(1.05) rotate(1deg); }
            50% { transform: scale(1.08) rotate(-1deg); opacity: 0.9; }
            75% { transform: scale(1.05) rotate(1deg); }
        }

        .hidden {
            display: none !important;
        }

        /* Navigation */
        .navbar {
            position: fixed;
            top: 0;
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 4%;
            z-index: 1000;
            background: rgba(10,10,10,0.95);
            backdrop-filter: blur(10px);
        }

        .nav-logo {
            font-family: 'Bebas Neue', cursive;
            font-size: 2.8rem;
            font-weight: bold;
            color: transparent;
            background: var(--bera-gradient);
            -webkit-background-clip: text;
            background-clip: text;
            letter-spacing: 3px;
            text-decoration: none;
        }

        .nav-links {
            display: flex;
            gap: 2.5rem;
            list-style: none;
        }

        .nav-links a {
            color: var(--bera-white);
            text-decoration: none;
            font-size: 1rem;
            font-weight: 600;
            transition: all 0.3s;
            padding: 0.5rem 1rem;
            border-radius: 25px;
        }

        .nav-links a:hover, .nav-links a.active {
            color: var(--bera-red);
            background: rgba(229, 9, 20, 0.1);
        }

        .search-container {
            display: flex;
            align-items: center;
        }

        .search-input {
            background: rgba(255,255,255,0.1);
            border: 2px solid transparent;
            color: var(--bera-white);
            padding: 0.8rem 1.5rem;
            border-radius: 30px;
            width: 300px;
            font-size: 1rem;
        }

        .search-input:focus {
            border-color: var(--bera-red);
        }

        .search-btn {
            background: var(--bera-gradient);
            border: none;
            color: var(--bera-white);
            cursor: pointer;
            padding: 0.8rem 1.2rem;
            border-radius: 30px;
            margin-left: 0.8rem;
            font-weight: 600;
        }

        /* Hero Banner */
        .hero-banner {
            position: relative;
            height: 80vh;
            background: linear-gradient(77deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.4) 60%, transparent 100%);
            display: flex;
            align-items: center;
            padding: 0 4%;
            margin-top: 80px;
        }

        .hero-content {
            max-width: 50%;
            z-index: 2;
        }

        .hero-title {
            font-size: 3.5rem;
            font-weight: 900;
            margin-bottom: 1rem;
            font-family: 'Bebas Neue', cursive;
        }

        .hero-description {
            font-size: 1.2rem;
            margin-bottom: 2rem;
        }

        .hero-buttons {
            display: flex;
            gap: 1rem;
        }

        .play-btn, .download-hero-btn {
            padding: 1rem 2rem;
            border: none;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .play-btn {
            background: var(--bera-red);
            color: var(--bera-white);
        }

        .download-hero-btn {
            background: var(--bera-gold);
            color: #000;
        }

        /* Content Rows */
        .content-rows {
            padding: 2rem 4%;
        }

        .row {
            margin-bottom: 3rem;
        }

        .row-title {
            font-size: 1.8rem;
            font-weight: 800;
            margin-bottom: 1rem;
            font-family: 'Bebas Neue', cursive;
        }

        .movies-container {
            display: flex;
            gap: 1rem;
            overflow-x: auto;
            padding: 1rem 0;
        }

        .movie-card {
            flex: 0 0 auto;
            width: 300px;
            border-radius: 8px;
            overflow: hidden;
            background: var(--bera-dark);
            transition: transform 0.3s;
        }

        .movie-card:hover {
            transform: scale(1.05);
        }

        .movie-poster {
            width: 100%;
            height: 200px;
            object-fit: cover;
        }

        .movie-info {
            padding: 1rem;
        }

        .movie-title {
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }

        .movie-actions {
            display: flex;
            gap: 0.5rem;
            margin-top: 1rem;
        }

        .movie-action-btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 4px;
            font-size: 0.9rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }

        .watch-btn {
            background: var(--bera-red);
            color: var(--bera-white);
        }

        .download-btn {
            background: var(--bera-gold);
            color: #000;
        }

        /* Loading States */
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2rem;
            color: var(--bera-light);
        }

        .loading-spinner {
            border: 4px solid var(--bera-gray);
            border-top: 4px solid var(--bera-red);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-right: 1rem;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .nav-links { display: none; }
            .search-input { width: 200px; }
            .hero-content { max-width: 80%; }
            .hero-title { font-size: 2.5rem; }
            .movie-card { width: 250px; }
        }
    </style>
</head>
<body>
    <!-- Splash Screen -->
    <div id="splashScreen" class="splash-screen">
        <div class="splash-logo">BERAFLIX</div>
        <div class="splash-tagline">PREMIUM STREAMING EXPERIENCE</div>
    </div>

    <!-- Main App -->
    <div id="app" class="hidden">
        <!-- Navigation -->
        <nav class="navbar">
            <div class="nav-left">
                <a href="#" class="nav-logo">BERAFLIX</a>
            </div>
            <div class="nav-links">
                <li><a href="#" class="nav-link active" data-category="all">Home</a></li>
                <li><a href="#" class="nav-link" data-category="movies">Movies</a></li>
                <li><a href="#" class="nav-link" data-category="series">TV Series</a></li>
                <li><a href="#" class="nav-link" data-category="new">New Releases</a></li>
                <li><a href="#" class="nav-link" data-category="mylist">My List</a></li>
            </div>
            <div class="search-container">
                <input type="text" class="search-input" id="searchInput" placeholder="Search movies...">
                <button class="search-btn" id="searchBtn">
                    <i class="fas fa-search"></i> Search
                </button>
            </div>
        </nav>

        <!-- Hero Banner -->
        <section class="hero-banner">
            <div class="hero-content">
                <h1 class="hero-title">Welcome to Beraflix</h1>
                <p class="hero-description">Stream and download your favorite movies and TV shows in HD quality.</p>
                <div class="hero-buttons">
                    <button class="play-btn" id="exploreBtn">
                        <i class="fas fa-play"></i> Explore Now
                    </button>
                    <button class="download-hero-btn" id="downloadsBtn">
                        <i class="fas fa-download"></i> My Downloads
                    </button>
                </div>
            </div>
        </section>

        <!-- Main Content -->
        <main class="content-rows">
            <!-- Trending Now -->
            <section class="row">
                <h2 class="row-title">Trending Now</h2>
                <div class="movies-container" id="trendingContainer">
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        Loading trending movies...
                    </div>
                </div>
            </section>

            <!-- Popular Movies -->
            <section class="row">
                <h2 class="row-title">Popular Movies</h2>
                <div class="movies-container" id="popularContainer">
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        Loading popular movies...
                    </div>
                </div>
            </section>

            <!-- Action Movies -->
            <section class="row">
                <h2 class="row-title">Action & Adventure</h2>
                <div class="movies-container" id="actionContainer">
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        Loading action movies...
                    </div>
                </div>
            </section>
        </main>
    </div>

    <script>
        // Simple initialization
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM loaded');
            
            // Hide splash screen after 3 seconds
            setTimeout(function() {
                var splashScreen = document.getElementById('splashScreen');
                var app = document.getElementById('app');
                
                if (splashScreen) {
                    splashScreen.style.display = 'none';
                }
                if (app) {
                    app.classList.remove('hidden');
                }
                
                // Load initial content
                loadInitialContent();
            }, 3000);
        });

        // Load initial content
        function loadInitialContent() {
            console.log('Loading initial content...');
            
            // Load trending movies
            loadTrendingMovies();
            
            // Load popular movies
            loadPopularMovies();
            
            // Load action movies
            loadActionMovies();
            
            // Setup event listeners
            setupEventListeners();
        }

        // Setup event listeners
        function setupEventListeners() {
            var searchBtn = document.getElementById('searchBtn');
            var exploreBtn = document.getElementById('exploreBtn');
            var downloadsBtn = document.getElementById('downloadsBtn');
            
            if (searchBtn) {
                searchBtn.addEventListener('click', handleSearch);
            }
            
            if (exploreBtn) {
                exploreBtn.addEventListener('click', function() {
                    alert('Explore feature coming soon!');
                });
            }
            
            if (downloadsBtn) {
                downloadsBtn.addEventListener('click', function() {
                    alert('Downloads feature coming soon!');
                });
            }
            
            // Navigation links
            var navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(function(link) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    var category = this.getAttribute('data-category');
                    switchCategory(category);
                });
            });
        }

        // Switch category
        function switchCategory(category) {
            console.log('Switching to category:', category);
            alert('Switching to ' + category + ' category');
        }

        // Handle search
        function handleSearch() {
            var searchInput = document.getElementById('searchInput');
            var query = searchInput ? searchInput.value.trim() : '';
            
            if (query) {
                console.log('Searching for:', query);
                searchMovies(query);
            } else {
                alert('Please enter a search term');
            }
        }

        // Load trending movies
        async function loadTrendingMovies() {
            try {
                var container = document.getElementById('trendingContainer');
                if (!container) return;
                
                var response = await fetch('/api/search/avengers');
                var data = await response.json();
                
                if (data.success && data.results && data.results.items) {
                    displayMovies(data.results.items.slice(0, 8), container);
                } else {
                    container.innerHTML = '<div class="loading">No trending movies found</div>';
                }
            } catch (error) {
                console.error('Error loading trending movies:', error);
                var container = document.getElementById('trendingContainer');
                if (container) {
                    container.innerHTML = '<div class="loading">Error loading movies</div>';
                }
            }
        }

        // Load popular movies
        async function loadPopularMovies() {
            try {
                var container = document.getElementById('popularContainer');
                if (!container) return;
                
                var response = await fetch('/api/search/movie');
                var data = await response.json();
                
                if (data.success && data.results && data.results.items) {
                    displayMovies(data.results.items.slice(0, 8), container);
                } else {
                    container.innerHTML = '<div class="loading">No popular movies found</div>';
                }
            } catch (error) {
                console.error('Error loading popular movies:', error);
                var container = document.getElementById('popularContainer');
                if (container) {
                    container.innerHTML = '<div class="loading">Error loading movies</div>';
                }
            }
        }

        // Load action movies
        async function loadActionMovies() {
            try {
                var container = document.getElementById('actionContainer');
                if (!container) return;
                
                var response = await fetch('/api/search/action');
                var data = await response.json();
                
                if (data.success && data.results && data.results.items) {
                    displayMovies(data.results.items.slice(0, 8), container);
                } else {
                    // Fallback to general search
                    var fallbackResponse = await fetch('/api/search/adventure');
                    var fallbackData = await fallbackResponse.json();
                    
                    if (fallbackData.success && fallbackData.results && fallbackData.results.items) {
                        displayMovies(fallbackData.results.items.slice(0, 8), container);
                    } else {
                        container.innerHTML = '<div class="loading">No action movies found</div>';
                    }
                }
            } catch (error) {
                console.error('Error loading action movies:', error);
                var container = document.getElementById('actionContainer');
                if (container) {
                    container.innerHTML = '<div class="loading">Error loading movies</div>';
                }
            }
        }

        // Search movies
        async function searchMovies(query) {
            try {
                alert('Searching for: ' + query);
                
                var response = await fetch('/api/search/' + encodeURIComponent(query));
                var data = await response.json();
                
                if (data.success && data.results && data.results.items) {
                    // For now, just show an alert with results count
                    alert('Found ' + data.results.items.length + ' results for "' + query + '"');
                } else {
                    alert('No results found for "' + query + '"');
                }
            } catch (error) {
                console.error('Error searching movies:', error);
                alert('Error searching movies');
            }
        }

        // Display movies
        function displayMovies(movies, container) {
            if (!movies || !container) return;
            
            if (movies.length === 0) {
                container.innerHTML = '<div class="loading">No movies found</div>';
                return;
            }
            
            var moviesHTML = '';
            
            for (var i = 0; i < movies.length; i++) {
                var movie = movies[i];
                
                var poster = movie.cover && movie.cover.url ? 
                    '<img src="' + movie.cover.url + '" alt="' + (movie.title || 'Movie') + '" class="movie-poster">' :
                    '<div style="background: #333; height: 200px; display: flex; align-items: center; justify-content: center; color: white;">No Image</div>';
                
                var title = movie.title || 'Unknown Title';
                var year = movie.releaseDate ? movie.releaseDate.split('-')[0] : 'N/A';
                
                moviesHTML += '<div class="movie-card">' +
                    poster +
                    '<div class="movie-info">' +
                        '<div class="movie-title">' + title + '</div>' +
                        '<div class="movie-meta">Year: ' + year + '</div>' +
                        '<div class="movie-actions">' +
                            '<button class="movie-action-btn watch-btn" onclick="playMovie(\'' + movie.subjectId + '\')">' +
                                '<i class="fas fa-play"></i> Watch' +
                            '</button>' +
                            '<button class="movie-action-btn download-btn" onclick="downloadMovie(\'' + movie.subjectId + '\', \'' + title + '\')">' +
                                '<i class="fas fa-download"></i> Download' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            }
            
            container.innerHTML = moviesHTML;
        }

        // Play movie
        function playMovie(movieId) {
            alert('Playing movie with ID: ' + movieId);
            // In a real app, this would open the video player
        }

        // Download movie
        function downloadMovie(movieId, title) {
            alert('Downloading: ' + title + ' (ID: ' + movieId + ') with BeraTech');
            // In a real app, this would start the download process
        }

        // Make functions available globally
        window.playMovie = playMovie;
        window.downloadMovie = downloadMovie;
        window.handleSearch = handleSearch;
    </script>
</body>
</html>
  `);
});

// API Routes
app.get('/api/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    console.log('Searching for:', query);
    
    const response = await fetch(`${MOVIE_API_BASE}/search/${encodeURIComponent(query)}`);
    const data = await response.json();
    
    console.log('API Response:', data.status, 'Results:', data.results ? data.results.items.length : 0);
    
    if (data.status === 200 && data.results && data.results.items.length > 0) {
      res.json({ 
        success: true, 
        results: data.results 
      });
    } else {
      res.json({ 
        success: false, 
        message: 'No movies found',
        results: { items: [] }
      });
    }
  } catch (error) {
    console.error('Error searching movies:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search movies' 
    });
  }
});

app.get('/api/info/:id', async (req, res) => {
  try {
    const movieId = req.params.id;
    const response = await fetch(`${MOVIE_API_BASE}/info/${movieId}`);
    const data = await response.json();
    
    if (data.status === 200 && data.results) {
      res.json({ success: true, results: data.results });
    } else {
      res.json({ success: false, message: 'Movie not found' });
    }
  } catch (error) {
    console.error('Error fetching movie info:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch movie info' });
  }
});

app.get('/api/sources/:id', async (req, res) => {
  try {
    const movieId = req.params.id;
    const response = await fetch(`${MOVIE_API_BASE}/sources/${movieId}`);
    const data = await response.json();
    
    if (data.status === 200 && data.results) {
      res.json({ success: true, results: data.results });
    } else {
      res.json({ success: false, message: 'No sources found' });
    }
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sources' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Beraflix Streaming',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎬 Beraflix Server running on port ${PORT}`);
  console.log(`📍 Visit: http://localhost:${PORT}`);
  console.log(`🎯 Movie API: ${MOVIE_API_BASE}`);
});

module.exports = app;
