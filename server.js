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
const MOVIE_API_BASE = process.env.MOVIE_API_BASE;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve main HTML with Netflix-style design
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BB Movies - Netflix-Style Streaming</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --netflix-red: #e50914;
            --netflix-black: #141414;
            --netflix-dark: #181818;
            --netflix-gray: #2F2F2F;
            --netflix-light: #808080;
            --netflix-white: #FFFFFF;
        }

        body {
            background: var(--netflix-black);
            color: var(--netflix-white);
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            overflow-x: hidden;
        }

        /* Splash Screen */
        .splash-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--netflix-black);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }

        .splash-logo {
            font-size: 4rem;
            font-weight: bold;
            color: var(--netflix-red);
            animation: splashPulse 2s infinite;
        }

        @keyframes splashPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }

        .hidden {
            display: none !important;
        }

        /* Netflix Navigation */
        .navbar {
            position: fixed;
            top: 0;
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 4%;
            z-index: 1000;
            transition: background 0.3s;
            background: linear-gradient(180deg, rgba(0,0,0,0.7) 10%, transparent 100%);
        }

        .navbar.scrolled {
            background: var(--netflix-black);
        }

        .nav-logo {
            font-size: 1.8rem;
            font-weight: bold;
            color: var(--netflix-red);
        }

        .nav-links {
            display: flex;
            gap: 1.5rem;
            list-style: none;
        }

        .nav-links a {
            color: var(--netflix-white);
            text-decoration: none;
            font-size: 0.9rem;
            transition: color 0.3s;
        }

        .nav-links a:hover {
            color: var(--netflix-light);
        }

        .nav-search {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .search-container {
            position: relative;
            display: flex;
            align-items: center;
        }

        .search-input {
            background: rgba(0,0,0,0.75);
            border: 1px solid var(--netflix-white);
            color: var(--netflix-white);
            padding: 0.5rem 1rem;
            border-radius: 4px;
            width: 250px;
            opacity: 1;
        }

        .search-btn {
            background: none;
            border: none;
            color: var(--netflix-white);
            cursor: pointer;
            font-size: 1.2rem;
            margin-left: 0.5rem;
        }

        /* Netflix Hero Banner */
        .hero-banner {
            position: relative;
            height: 80vh;
            background: linear-gradient(77deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 85%);
            display: flex;
            align-items: center;
            padding: 0 4%;
            margin-bottom: 2rem;
        }

        .hero-background {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: -1;
        }

        .hero-content {
            max-width: 40%;
            z-index: 2;
        }

        .hero-title {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }

        .hero-description {
            font-size: 1.1rem;
            line-height: 1.4;
            margin-bottom: 1.5rem;
            color: var(--netflix-white);
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        }

        .hero-buttons {
            display: flex;
            gap: 1rem;
        }

        .play-btn, .info-btn {
            padding: 0.7rem 1.5rem;
            border: none;
            border-radius: 4px;
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s;
        }

        .play-btn {
            background: var(--netflix-white);
            color: var(--netflix-black);
        }

        .play-btn:hover {
            background: rgba(255,255,255,0.75);
        }

        .info-btn {
            background: rgba(109, 109, 110, 0.7);
            color: var(--netflix-white);
        }

        .info-btn:hover {
            background: rgba(109, 109, 110, 0.4);
        }

        /* Netflix Rows */
        .content-rows {
            padding: 0 4% 2rem;
        }

        .row {
            margin-bottom: 3rem;
        }

        .row-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }

        .row-title {
            font-size: 1.4rem;
            font-weight: bold;
            color: var(--netflix-white);
        }

        .row-content {
            position: relative;
        }

        .movies-container {
            display: flex;
            gap: 0.5rem;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            padding: 0.5rem 0;
        }

        .movies-container::-webkit-scrollbar {
            display: none;
        }

        /* Netflix Movie Cards */
        .movie-card {
            flex: 0 0 auto;
            width: 300px;
            border-radius: 4px;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.3s ease;
            position: relative;
        }

        .movie-card:hover {
            transform: scale(1.05);
            z-index: 10;
        }

        .movie-poster {
            width: 100%;
            height: 169px;
            object-fit: cover;
            border-radius: 4px;
        }

        .movie-info {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0,0,0,0.9));
            padding: 1rem;
            opacity: 0;
            transition: opacity 0.3s;
        }

        .movie-card:hover .movie-info {
            opacity: 1;
        }

        .movie-title {
            font-size: 1rem;
            font-weight: bold;
            margin-bottom: 0.25rem;
        }

        .movie-year {
            font-size: 0.8rem;
            color: var(--netflix-light);
        }

        /* Video Player */
        .video-player {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--netflix-black);
            z-index: 2000;
            display: flex;
            flex-direction: column;
        }

        .player-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 2rem;
            background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%);
        }

        .player-title {
            font-size: 1.2rem;
            font-weight: bold;
            color: var(--netflix-white);
        }

        .close-player {
            background: none;
            border: none;
            color: var(--netflix-white);
            font-size: 2rem;
            cursor: pointer;
        }

        .video-element {
            flex: 1;
            width: 100%;
        }

        /* Loading States */
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2rem;
            color: var(--netflix-light);
        }

        .loading-spinner {
            border: 2px solid var(--netflix-gray);
            border-top: 2px solid var(--netflix-red);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            .navbar {
                padding: 1rem;
            }

            .nav-links {
                display: none;
            }

            .hero-content {
                max-width: 80%;
            }

            .hero-title {
                font-size: 2rem;
            }

            .movie-card {
                width: 200px;
            }

            .search-input {
                width: 150px;
            }
        }
    </style>
</head>
<body>
    <!-- Splash Screen -->
    <div id="splashScreen" class="splash-screen">
        <div class="splash-logo">BB</div>
    </div>

    <!-- Main App -->
    <div id="app" class="hidden">
        <!-- Netflix-style Navigation -->
        <nav class="navbar" id="navbar">
            <div class="nav-left">
                <div class="nav-logo">BB MOVIES</div>
                <ul class="nav-links">
                    <li><a href="#" class="nav-link active">Home</a></li>
                    <li><a href="#" class="nav-link">TV Shows</a></li>
                    <li><a href="#" class="nav-link">Movies</a></li>
                    <li><a href="#" class="nav-link">New & Popular</a></li>
                    <li><a href="#" class="nav-link">My List</a></li>
                </ul>
            </div>
            <div class="nav-search">
                <div class="search-container">
                    <input type="text" class="search-input" id="searchInput" placeholder="Search movies...">
                    <button class="search-btn" id="searchBtn">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            </div>
        </nav>

        <!-- Netflix Hero Banner -->
        <section class="hero-banner" id="heroBanner">
            <img class="hero-background" id="heroBackground" alt="Hero Background">
            <div class="hero-content">
                <h1 class="hero-title" id="heroTitle">Welcome to BB Movies</h1>
                <p class="hero-description" id="heroDescription">Stream unlimited movies and TV shows. Anytime, anywhere.</p>
                <div class="hero-buttons">
                    <button class="play-btn" id="heroPlayBtn">
                        <i class="fas fa-play"></i> Play
                    </button>
                    <button class="info-btn" id="heroInfoBtn">
                        <i class="fas fa-info-circle"></i> More Info
                    </button>
                </div>
            </div>
        </section>

        <!-- Main Content Rows -->
        <main class="content-rows">
            <!-- Trending Now -->
            <section class="row" id="trendingRow">
                <div class="row-header">
                    <h2 class="row-title">Trending Now</h2>
                </div>
                <div class="row-content">
                    <div class="movies-container" id="trendingContainer">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Popular Movies -->
            <section class="row" id="popularRow">
                <div class="row-header">
                    <h2 class="row-title">Popular Movies</h2>
                </div>
                <div class="row-content">
                    <div class="movies-container" id="popularContainer">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Action Movies -->
            <section class="row" id="actionRow">
                <div class="row-header">
                    <h2 class="row-title">Action Movies</h2>
                </div>
                <div class="row-content">
                    <div class="movies-container" id="actionContainer">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Search Results -->
            <section class="row" id="searchResultsRow" style="display: none;">
                <div class="row-header">
                    <h2 class="row-title">Search Results</h2>
                </div>
                <div class="row-content">
                    <div class="movies-container" id="searchResultsContainer"></div>
                </div>
            </section>
        </main>

        <!-- Video Player -->
        <div id="videoPlayer" class="video-player hidden">
            <div class="player-header">
                <div class="player-title" id="playerTitle">Now Playing</div>
                <button class="close-player" id="closePlayer">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <video class="video-element" id="videoElement" controls>
                Your browser does not support the video tag.
            </video>
        </div>
    </div>

    <script>
        // Global State
        let currentMovies = [];
        let trendingMovies = [];
        let popularMovies = [];
        let actionMovies = [];
        let currentHeroMovie = null;

        // DOM Elements
        const splashScreen = document.getElementById('splashScreen');
        const app = document.getElementById('app');
        const navbar = document.getElementById('navbar');
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const heroBanner = document.getElementById('heroBanner');
        const heroBackground = document.getElementById('heroBackground');
        const heroTitle = document.getElementById('heroTitle');
        const heroDescription = document.getElementById('heroDescription');
        const heroPlayBtn = document.getElementById('heroPlayBtn');
        const heroInfoBtn = document.getElementById('heroInfoBtn');
        const trendingContainer = document.getElementById('trendingContainer');
        const popularContainer = document.getElementById('popularContainer');
        const actionContainer = document.getElementById('actionContainer');
        const searchResultsRow = document.getElementById('searchResultsRow');
        const searchResultsContainer = document.getElementById('searchResultsContainer');
        const videoPlayer = document.getElementById('videoPlayer');
        const videoElement = document.getElementById('videoElement');
        const closePlayer = document.getElementById('closePlayer');
        const playerTitle = document.getElementById('playerTitle');

        // Initialize App
        document.addEventListener('DOMContentLoaded', async () => {
            setTimeout(() => {
                splashScreen.style.display = 'none';
                app.classList.remove('hidden');
                initializeApp();
            }, 2000);
        });

        function initializeApp() {
            setupEventListeners();
            loadAllContent();
        }

        function setupEventListeners() {
            searchBtn.addEventListener('click', handleSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSearch();
            });

            closePlayer.addEventListener('click', () => {
                videoPlayer.classList.add('hidden');
                videoElement.pause();
            });

            window.addEventListener('scroll', () => {
                if (window.scrollY > 100) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            });

            heroPlayBtn.addEventListener('click', () => {
                if (currentHeroMovie) {
                    playMovie(currentHeroMovie.id);
                }
            });

            heroInfoBtn.addEventListener('click', () => {
                if (currentHeroMovie) {
                    showMovieInfo(currentHeroMovie.id);
                }
            });
        }

        // Load all content
        async function loadAllContent() {
            await loadTrendingMovies();
            await loadPopularMovies();
            await loadActionMovies();
        }

        // Load trending movies from /api/trending
        async function loadTrendingMovies() {
            try {
                trendingContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
                
                const response = await fetch('/api/trending');
                const data = await response.json();
                
                if (data.success && data.movies.length > 0) {
                    trendingMovies = data.movies;
                    displayMovies(trendingMovies, trendingContainer);
                    
                    // Set first movie as hero
                    currentHeroMovie = trendingMovies[0];
                    setHeroMovie(currentHeroMovie);
                } else {
                    trendingContainer.innerHTML = '<div class="loading">No trending movies found</div>';
                }
            } catch (error) {
                console.error('Error loading trending movies:', error);
                trendingContainer.innerHTML = '<div class="loading">Error loading trending movies</div>';
            }
        }

        // Load popular movies from /api/info
        async function loadPopularMovies() {
            try {
                popularContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
                
                const response = await fetch('/api/info');
                const data = await response.json();
                
                if (data.success && data.movies.length > 0) {
                    popularMovies = data.movies.slice(0, 10);
                    displayMovies(popularMovies, popularContainer);
                } else {
                    popularContainer.innerHTML = '<div class="loading">No popular movies found</div>';
                }
            } catch (error) {
                console.error('Error loading popular movies:', error);
                popularContainer.innerHTML = '<div class="loading">Error loading popular movies</div>';
            }
        }

        // Load action movies from /api/search/spider
        async function loadActionMovies() {
            try {
                actionContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
                
                const response = await fetch('/api/search/spider');
                const data = await response.json();
                
                if (data.success && data.movies.length > 0) {
                    actionMovies = data.movies;
                    displayMovies(actionMovies, actionContainer);
                } else {
                    actionContainer.innerHTML = '<div class="loading">No action movies found</div>';
                }
            } catch (error) {
                console.error('Error loading action movies:', error);
                actionContainer.innerHTML = '<div class="loading">Error loading action movies</div>';
            }
        }

        // Search movies
        async function searchMovies(query) {
            try {
                searchResultsContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
                searchResultsRow.style.display = 'block';
                
                document.getElementById('trendingRow').style.display = 'none';
                document.getElementById('popularRow').style.display = 'none';
                document.getElementById('actionRow').style.display = 'none';
                
                const response = await fetch('/api/search/' + encodeURIComponent(query));
                const data = await response.json();
                
                if (data.success && data.movies.length > 0) {
                    currentMovies = data.movies;
                    displayMovies(currentMovies, searchResultsContainer);
                } else {
                    searchResultsContainer.innerHTML = '<div class="loading">No movies found for "' + query + '"</div>';
                }
            } catch (error) {
                console.error('Error searching movies:', error);
                searchResultsContainer.innerHTML = '<div class="loading">Error searching movies</div>';
            }
        }

        // Display movies in Netflix-style rows
        function displayMovies(movies, container) {
            if (!movies || movies.length === 0) {
                container.innerHTML = '<div class="loading">No movies to display</div>';
                return;
            }

            container.innerHTML = movies.map(movie => \`
                <div class="movie-card" onclick="showMovieInfo('\${movie.id}')">
                    <img src="\${movie.poster || 'https://via.placeholder.com/300x169/2F2F2F/FFFFFF?text=No+Image'}" 
                         alt="\${movie.title || 'Movie'}" 
                         class="movie-poster"
                         onerror="this.src='https://via.placeholder.com/300x169/2F2F2F/FFFFFF?text=No+Image'">
                    <div class="movie-info">
                        <div class="movie-title">\${movie.title || 'Unknown Title'}</div>
                        <div class="movie-year">\${movie.year || ''}</div>
                    </div>
                </div>
            \`).join('');
        }

        // Set hero movie
        function setHeroMovie(movie) {
            if (movie.poster) {
                heroBackground.src = movie.poster;
            }
            heroTitle.textContent = movie.title || 'BB Movies';
            heroDescription.textContent = movie.description || 'Stream unlimited movies and TV shows on any device.';
        }

        // Show movie info and play options
        async function showMovieInfo(movieId) {
            try {
                const response = await fetch('/api/info/' + movieId);
                const data = await response.json();
                
                if (data.success && data.movie) {
                    const movie = data.movie;
                    const play = confirm(\`\${movie.title || 'Movie'}\\n\\n\${movie.description || 'No description available'}\\n\\nClick OK to play or Cancel for more options.\`);
                    
                    if (play) {
                        playMovie(movieId);
                    } else {
                        // Show download option
                        const download = confirm('Would you like to download this movie instead?');
                        if (download) {
                            downloadMovie(movieId);
                        }
                    }
                } else {
                    // If info not available, try to play directly
                    playMovie(movieId);
                }
            } catch (error) {
                console.error('Error getting movie info:', error);
                // If info fails, try to play directly
                playMovie(movieId);
            }
        }

        // Play movie using /api/sources/{id}
        async function playMovie(movieId) {
            try {
                const response = await fetch('/api/sources/' + movieId);
                const data = await response.json();
                
                if (data.success && data.sources && data.sources.length > 0) {
                    const videoSource = data.sources[0].url;
                    
                    // Find movie title for display
                    const allMovies = [...trendingMovies, ...popularMovies, ...actionMovies, ...currentMovies];
                    const movie = allMovies.find(m => m.id === movieId);
                    
                    videoElement.src = videoSource;
                    playerTitle.textContent = movie ? movie.title : 'Now Playing';
                    videoPlayer.classList.remove('hidden');
                    videoElement.play().catch(e => {
                        console.log('Autoplay prevented:', e);
                        // Show custom controls message
                        alert('Click play in the video player to start watching.');
                    });
                } else {
                    alert('No video source available for this movie');
                }
            } catch (error) {
                console.error('Error playing movie:', error);
                alert('Error loading movie. Please try again.');
            }
        }

        // Download movie using /api/download/{id}
        async function downloadMovie(movieId) {
            try {
                const response = await fetch('/api/download/' + movieId);
                const data = await response.json();
                
                if (data.success && data.downloadUrl) {
                    // Create download link
                    const link = document.createElement('a');
                    link.href = data.downloadUrl;
                    link.download = 'movie.mp4';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    alert('Download started!');
                } else {
                    alert('No download available for this movie');
                }
            } catch (error) {
                console.error('Error downloading movie:', error);
                alert('Error downloading movie. Please try again.');
            }
        }

        // Handle search
        function handleSearch() {
            const query = searchInput.value.trim();
            if (query) {
                searchMovies(query);
            } else {
                searchResultsRow.style.display = 'none';
                document.getElementById('trendingRow').style.display = 'block';
                document.getElementById('popularRow').style.display = 'block';
                document.getElementById('actionRow').style.display = 'block';
            }
        }

        // Make functions global
        window.showMovieInfo = showMovieInfo;
        window.playMovie = playMovie;
        window.handleSearch = handleSearch;
    </script>
</body>
</html>
  `);
});

// API Routes - Using the correct endpoints
app.get('/api/trending', async (req, res) => {
  try {
    console.log('Fetching trending movies from API...');
    const response = await fetch(`${MOVIE_API_BASE}/trending`);
    const data = await response.json();
    
    console.log('Trending API response:', data);
    
    if (data.movies && data.movies.length > 0) {
      res.json({ 
        success: true, 
        movies: data.movies.slice(0, 20) 
      });
    } else {
      // Fallback to search if trending endpoint doesn't work
      const fallbackResponse = await fetch(`${MOVIE_API_BASE}/search/?q=2024`);
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.movies && fallbackData.movies.length > 0) {
        res.json({ 
          success: true, 
          movies: fallbackData.movies.slice(0, 20) 
        });
      } else {
        res.json({ 
          success: false, 
          message: 'No trending movies found',
          movies: []
        });
      }
    }
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch trending movies' 
    });
  }
});

app.get('/api/info', async (req, res) => {
  try {
    console.log('Fetching popular movies from info API...');
    const response = await fetch(`${MOVIE_API_BASE}/info/`);
    const data = await response.json();
    
    console.log('Info API response:', data);
    
    if (data.movies && data.movies.length > 0) {
      res.json({ 
        success: true, 
        movies: data.movies.slice(0, 15) 
      });
    } else {
      // Fallback to search
      const fallbackResponse = await fetch(`${MOVIE_API_BASE}/search/?q=popular`);
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.movies && fallbackData.movies.length > 0) {
        res.json({ 
          success: true, 
          movies: fallbackData.movies.slice(0, 15) 
        });
      } else {
        res.json({ 
          success: false, 
          message: 'No popular movies found',
          movies: []
        });
      }
    }
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch popular movies' 
    });
  }
});

app.get('/api/info/:id', async (req, res) => {
  try {
    const movieId = req.params.id;
    console.log('Fetching movie info for:', movieId);
    
    const response = await fetch(`${MOVIE_API_BASE}/info/${movieId}`);
    const data = await response.json();
    
    console.log('Movie info response:', data);
    
    if (data.movie) {
      res.json({ 
        success: true, 
        movie: data.movie 
      });
    } else {
      res.json({ 
        success: false, 
        message: 'No movie info found',
        movie: null
      });
    }
  } catch (error) {
    console.error('Error fetching movie info:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch movie info' 
    });
  }
});

app.get('/api/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    console.log('Searching movies for:', query);
    
    const response = await fetch(`${MOVIE_API_BASE}/search/${query}`);
    const data = await response.json();
    
    console.log('Search API response:', data.movies ? data.movies.length : 0, 'movies found');
    
    if (data.movies && data.movies.length > 0) {
      res.json({ 
        success: true, 
        movies: data.movies 
      });
    } else {
      res.json({ 
        success: false, 
        message: 'No movies found',
        movies: []
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

app.get('/api/sources/:id', async (req, res) => {
  try {
    const movieId = req.params.id;
    console.log('Fetching sources for movie:', movieId);
    
    const response = await fetch(`${MOVIE_API_BASE}/sources/${movieId}`);
    const data = await response.json();
    
    console.log('Sources API response:', data);
    
    if (data.sources && data.sources.length > 0) {
      res.json({ 
        success: true, 
        sources: data.sources 
      });
    } else {
      res.json({ 
        success: false, 
        message: 'No sources available for this movie',
        sources: []
      });
    }
  } catch (error) {
    console.error('Error fetching movie sources:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch movie sources' 
    });
  }
});

app.get('/api/download/:id', async (req, res) => {
  try {
    const movieId = req.params.id;
    console.log('Fetching download for movie:', movieId);
    
    const response = await fetch(`${MOVIE_API_BASE}/download/${movieId}`);
    const data = await response.json();
    
    console.log('Download API response:', data);
    
    if (data.downloadUrl) {
      res.json({ 
        success: true, 
        downloadUrl: data.downloadUrl 
      });
    } else {
      res.json({ 
        success: false, 
        message: 'No download available for this movie',
        downloadUrl: null
      });
    }
  } catch (error) {
    console.error('Error fetching movie download:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch movie download' 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'BB Movies - Netflix Style',
    movie_api: MOVIE_API_BASE,
    endpoints: {
      trending: '/api/trending',
      info: '/api/info',
      search: '/api/search/:query',
      sources: '/api/sources/:id',
      download: '/api/download/:id'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎬 BB Movies Netflix-Style Server running on port ${PORT}`);
  console.log(`📍 Visit: http://localhost:${PORT}`);
  console.log(`🎯 Movie API: ${MOVIE_API_BASE}`);
});

module.exports = app;
