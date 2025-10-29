<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BB Movies - Real Movie Streaming</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: #000;
            color: #fff;
            font-family: 'Arial', sans-serif;
            overflow-x: hidden;
        }

        /* Splash Screen */
        .splash-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, #000, #8B0000);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }

        .splash-content {
            text-align: center;
        }

        .splash-title {
            font-size: 4rem;
            font-weight: bold;
            background: linear-gradient(45deg, #fff, #8B0000);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 1rem;
        }

        .splash-subtitle {
            font-size: 1.2rem;
            color: #ccc;
        }

        .hidden {
            display: none !important;
        }

        /* Navigation */
        .navbar {
            position: fixed;
            top: 0;
            width: 100%;
            background: linear-gradient(180deg, rgba(0,0,0,0.9) 0%, transparent 100%);
            padding: 1rem 2rem;
            z-index: 1000;
            transition: background 0.3s;
        }

        .navbar.scrolled {
            background: rgba(0,0,0,0.95);
        }

        .nav-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1200px;
            margin: 0 auto;
        }

        .nav-logo h1 {
            color: #8B0000;
            font-size: 2rem;
            font-weight: bold;
        }

        .nav-search {
            display: flex;
            gap: 0.5rem;
            flex: 0 1 400px;
        }

        .nav-search input {
            flex: 1;
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 25px;
            background: rgba(255,255,255,0.1);
            color: white;
            outline: none;
        }

        .nav-search button {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 25px;
            background: #8B0000;
            color: white;
            cursor: pointer;
        }

        /* Hero Section */
        .hero-section {
            position: relative;
            height: 80vh;
            display: flex;
            align-items: center;
            padding: 0 2rem;
            margin-bottom: 2rem;
        }

        .hero-background {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            filter: brightness(0.4);
            z-index: -1;
        }

        .hero-content {
            max-width: 600px;
            z-index: 1;
        }

        .hero-title {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }

        .hero-description {
            font-size: 1.1rem;
            margin-bottom: 2rem;
            color: #ccc;
        }

        .play-btn {
            padding: 0.8rem 2rem;
            border: none;
            border-radius: 5px;
            background: #8B0000;
            color: white;
            font-size: 1.1rem;
            cursor: pointer;
        }

        /* Movie Sections */
        .movie-sections {
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }

        .section {
            margin-bottom: 3rem;
        }

        .section h2 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #fff;
        }

        .movie-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
        }

        .movie-card {
            border-radius: 10px;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.3s;
            background: #1a1a1a;
        }

        .movie-card:hover {
            transform: scale(1.05);
        }

        .movie-poster {
            width: 100%;
            height: 300px;
            object-fit: cover;
        }

        .movie-info {
            padding: 1rem;
        }

        .movie-title {
            font-size: 1rem;
            margin-bottom: 0.5rem;
            color: #fff;
        }

        .movie-year {
            color: #ccc;
            font-size: 0.9rem;
        }

        /* Video Player */
        .video-player {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            z-index: 2000;
        }

        .video-player video {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .close-player {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: rgba(0,0,0,0.7);
            color: white;
            border: none;
            font-size: 2rem;
            cursor: pointer;
            z-index: 2001;
        }

        /* Loading */
        .loading {
            text-align: center;
            padding: 2rem;
            color: #ccc;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .nav-container {
                flex-direction: column;
                gap: 1rem;
            }

            .hero-title {
                font-size: 2rem;
            }

            .movie-grid {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            }
        }
    </style>
</head>
<body>
    <!-- Splash Screen -->
    <div id="splashScreen" class="splash-screen">
        <div class="splash-content">
            <h1 class="splash-title">BB MOVIES</h1>
            <p class="splash-subtitle">A BERA TECH CREATION</p>
        </div>
    </div>

    <!-- Main App -->
    <div id="app" class="hidden">
        <!-- Navigation -->
        <nav class="navbar">
            <div class="nav-container">
                <div class="nav-logo">
                    <h1>BB MOVIES</h1>
                </div>
                <div class="nav-search">
                    <input type="text" id="searchInput" placeholder="Search real movies...">
                    <button id="searchBtn">Search</button>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Hero Section -->
            <section class="hero-section">
                <div class="hero-background" id="heroBackground"></div>
                <div class="hero-content">
                    <h1 id="heroTitle" class="hero-title">BB Movies</h1>
                    <p id="heroDescription" class="hero-description">Stream real movies in HD quality</p>
                    <button class="play-btn" id="heroPlayBtn">Explore Movies</button>
                </div>
            </section>

            <!-- Movie Sections -->
            <section class="movie-sections">
                <div class="section" id="trendingSection">
                    <h2>Trending Now - Real Movies</h2>
                    <div class="movie-grid" id="trendingGrid">
                        <div class="loading">Loading real movies from API...</div>
                    </div>
                </div>

                <div class="section" id="searchResultsSection" style="display: none;">
                    <h2>Search Results</h2>
                    <div class="movie-grid" id="searchResultsGrid"></div>
                </div>
            </section>
        </main>

        <!-- Video Player -->
        <div id="videoPlayer" class="video-player hidden">
            <button class="close-player" id="closePlayer">&times;</button>
            <video id="videoElement" controls>
                Your browser does not support the video tag.
            </video>
        </div>
    </div>

    <script>
        // Global State
        let currentMovies = [];
        let trendingMovies = [];

        // DOM Elements
        const splashScreen = document.getElementById('splashScreen');
        const app = document.getElementById('app');
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const trendingGrid = document.getElementById('trendingGrid');
        const searchResultsSection = document.getElementById('searchResultsSection');
        const searchResultsGrid = document.getElementById('searchResultsGrid');
        const videoPlayer = document.getElementById('videoPlayer');
        const videoElement = document.getElementById('videoElement');
        const closePlayer = document.getElementById('closePlayer');
        const heroBackground = document.getElementById('heroBackground');
        const heroTitle = document.getElementById('heroTitle');
        const heroDescription = document.getElementById('heroDescription');
        const heroPlayBtn = document.getElementById('heroPlayBtn');

        // Initialize App
        document.addEventListener('DOMContentLoaded', async () => {
            // Show splash screen for 2 seconds
            setTimeout(() => {
                splashScreen.style.display = 'none';
                app.classList.remove('hidden');
                initializeApp();
            }, 2000);
        });

        function initializeApp() {
            setupEventListeners();
            loadTrendingMovies();
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
            
            // Close video player when clicking outside
            videoPlayer.addEventListener('click', (e) => {
                if (e.target === videoPlayer) {
                    videoPlayer.classList.add('hidden');
                    videoElement.pause();
                }
            });

            // Navbar scroll effect
            window.addEventListener('scroll', () => {
                const navbar = document.querySelector('.navbar');
                if (window.scrollY > 100) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            });
        }

        // Load real trending movies from API
        async function loadTrendingMovies() {
            try {
                trendingGrid.innerHTML = '<div class="loading">Loading real movies from API...</div>';
                
                const response = await fetch('/api/movies/trending');
                const data = await response.json();
                
                if (data.success && data.movies.length > 0) {
                    trendingMovies = data.movies;
                    displayMovies(trendingMovies, trendingGrid);
                    
                    // Set first movie as hero
                    const heroMovie = trendingMovies[0];
                    setHeroMovie(heroMovie);
                } else {
                    trendingGrid.innerHTML = '<div class="loading">No trending movies found. Try searching above.</div>';
                }
            } catch (error) {
                console.error('Error loading trending movies:', error);
                trendingGrid.innerHTML = '<div class="loading">Error loading movies. Please try again.</div>';
            }
        }

        // Search real movies from API
        async function searchMovies(query) {
            try {
                searchResultsGrid.innerHTML = '<div class="loading">Searching for real movies...</div>';
                searchResultsSection.style.display = 'block';
                
                const response = await fetch('/api/movies/search?q=' + encodeURIComponent(query));
                const data = await response.json();
                
                if (data.success && data.movies.length > 0) {
                    currentMovies = data.movies;
                    displayMovies(currentMovies, searchResultsGrid);
                } else {
                    searchResultsGrid.innerHTML = '<div class="loading">No movies found for "' + query + '"</div>';
                }
            } catch (error) {
                console.error('Error searching movies:', error);
                searchResultsGrid.innerHTML = '<div class="loading">Error searching movies. Please try again.</div>';
            }
        }

        // Display movies in grid
        function displayMovies(movies, container) {
            if (!movies || movies.length === 0) {
                container.innerHTML = '<div class="loading">No movies to display</div>';
                return;
            }

            container.innerHTML = movies.map(movie => `
                <div class="movie-card" onclick="showMovieDetails('${movie.id}')">
                    <img src="${movie.poster || '/placeholder.jpg'}" 
                         alt="${movie.title || 'Movie'}" 
                         class="movie-poster"
                         onerror="this.src='/placeholder.jpg'">
                    <div class="movie-info">
                        <h3 class="movie-title">${movie.title || 'Unknown Title'}</h3>
                        <p class="movie-year">${movie.year || ''}</p>
                    </div>
                </div>
            `).join('');
        }

        // Set hero movie
        function setHeroMovie(movie) {
            if (movie.poster) {
                heroBackground.style.backgroundImage = `url(${movie.poster})`;
            }
            heroTitle.textContent = movie.title || 'BB Movies';
            heroDescription.textContent = movie.description || 'Stream the latest movies in HD';
            heroPlayBtn.onclick = () => showMovieDetails(movie.id);
        }

        // Show movie details and play
        async function showMovieDetails(movieId) {
            try {
                const response = await fetch('/api/movies/sources/' + movieId);
                const data = await response.json();
                
                if (data.success && data.sources.length > 0) {
                    const videoSource = data.sources[0].url;
                    videoElement.src = videoSource;
                    videoPlayer.classList.remove('hidden');
                    videoElement.play().catch(e => console.log('Autoplay prevented:', e));
                } else {
                    alert('No video source available for this movie');
                }
            } catch (error) {
                console.error('Error playing movie:', error);
                alert('Error loading movie. Please try again.');
            }
        }

        // Handle search
        function handleSearch() {
            const query = searchInput.value.trim();
            if (query) {
                searchMovies(query);
            }
        }

        // Make functions global
        window.showMovieDetails = showMovieDetails;
        window.handleSearch = handleSearch;
    </script>
</body>
</html>
