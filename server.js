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

// Serve main HTML with Beraflix Netflix-style design
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Beraflix - Stream Movies & TV Shows</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --bera-red: #e50914;
            --bera-dark-red: #b2070f;
            --bera-black: #141414;
            --bera-dark: #181818;
            --bera-gray: #2F2F2F;
            --bera-light: #808080;
            --bera-white: #FFFFFF;
            --bera-gradient: linear-gradient(135deg, #e50914 0%, #b2070f 100%);
        }

        body {
            background: var(--bera-black);
            color: var(--bera-white);
            font-family: 'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            overflow-x: hidden;
            line-height: 1.4;
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
            letter-spacing: 4px;
        }

        @keyframes splashPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.9; }
        }

        .hidden {
            display: none !important;
        }

        /* Beraflix Navigation */
        .navbar {
            position: fixed;
            top: 0;
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 4%;
            z-index: 1000;
            transition: all 0.3s ease;
            background: linear-gradient(180deg, rgba(20,20,20,0.9) 0%, transparent 100%);
        }

        .navbar.scrolled {
            background: var(--bera-black);
            box-shadow: 0 2px 20px rgba(0,0,0,0.5);
        }

        .nav-logo {
            font-family: 'Bebas Neue', cursive;
            font-size: 2.5rem;
            font-weight: bold;
            color: var(--bera-red);
            letter-spacing: 2px;
            text-decoration: none;
        }

        .nav-logo span:first-child {
            color: var(--bera-white);
        }

        .nav-logo span:last-child {
            color: var(--bera-red);
        }

        .nav-links {
            display: flex;
            gap: 2rem;
            list-style: none;
            margin-left: 3rem;
        }

        .nav-links a {
            color: var(--bera-white);
            text-decoration: none;
            font-size: 0.95rem;
            font-weight: 500;
            transition: color 0.3s;
            position: relative;
        }

        .nav-links a:hover {
            color: var(--bera-light);
        }

        .nav-links a.active::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 0;
            width: 100%;
            height: 2px;
            background: var(--bera-red);
        }

        .nav-search {
            display: flex;
            align-items: center;
            gap: 1.5rem;
        }

        .search-container {
            position: relative;
            display: flex;
            align-items: center;
        }

        .search-input {
            background: rgba(0,0,0,0.75);
            border: 1px solid var(--bera-gray);
            color: var(--bera-white);
            padding: 0.6rem 1.2rem;
            border-radius: 4px;
            width: 280px;
            font-size: 0.9rem;
            transition: all 0.3s ease;
        }

        .search-input:focus {
            border-color: var(--bera-white);
            background: rgba(0,0,0,0.9);
        }

        .search-btn {
            background: var(--bera-red);
            border: none;
            color: var(--bera-white);
            cursor: pointer;
            font-size: 1rem;
            padding: 0.6rem 1rem;
            border-radius: 4px;
            margin-left: 0.5rem;
            transition: background 0.3s;
        }

        .search-btn:hover {
            background: var(--bera-dark-red);
        }

        .user-avatar {
            width: 36px;
            height: 36px;
            border-radius: 4px;
            background: var(--bera-gradient);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            cursor: pointer;
        }

        /* Beraflix Hero Banner */
        .hero-banner {
            position: relative;
            height: 85vh;
            background: linear-gradient(77deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 85%);
            display: flex;
            align-items: center;
            padding: 0 4%;
            margin-bottom: 3rem;
            overflow: hidden;
        }

        .hero-background {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: -2;
            filter: brightness(0.6);
        }

        .hero-gradient {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                77deg,
                rgba(20,20,20,0.9) 0%,
                rgba(20,20,20,0.7) 30%,
                rgba(20,20,20,0.4) 60%,
                transparent 100%
            );
            z-index: -1;
        }

        .hero-content {
            max-width: 40%;
            z-index: 2;
            margin-top: 4rem;
        }

        .hero-title {
            font-size: 4rem;
            font-weight: 900;
            margin-bottom: 1.5rem;
            text-shadow: 2px 2px 8px rgba(0,0,0,0.8);
            line-height: 1.1;
            font-family: 'Bebas Neue', cursive;
            letter-spacing: 1px;
        }

        .hero-description {
            font-size: 1.3rem;
            line-height: 1.5;
            margin-bottom: 2rem;
            color: var(--bera-white);
            text-shadow: 1px 1px 4px rgba(0,0,0,0.6);
            font-weight: 400;
        }

        .hero-meta {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            font-size: 1rem;
            color: var(--bera-light);
        }

        .hero-meta span {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .hero-buttons {
            display: flex;
            gap: 1rem;
        }

        .play-btn, .info-btn {
            padding: 0.8rem 2rem;
            border: none;
            border-radius: 4px;
            font-size: 1.2rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.8rem;
            transition: all 0.3s ease;
            font-family: 'Roboto', sans-serif;
        }

        .play-btn {
            background: var(--bera-white);
            color: var(--bera-black);
        }

        .play-btn:hover {
            background: rgba(255,255,255,0.85);
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }

        .info-btn {
            background: rgba(109, 109, 110, 0.7);
            color: var(--bera-white);
        }

        .info-btn:hover {
            background: rgba(109, 109, 110, 0.9);
            transform: translateY(-2px);
        }

        /* Beraflix Content Rows */
        .content-rows {
            padding: 0 4% 4rem;
        }

        .row {
            margin-bottom: 4rem;
        }

        .row-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }

        .row-title {
            font-size: 1.8rem;
            font-weight: 700;
            color: var(--bera-white);
            font-family: 'Bebas Neue', cursive;
            letter-spacing: 1px;
        }

        .row-content {
            position: relative;
        }

        .movies-container {
            display: flex;
            gap: 0.8rem;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            padding: 1rem 0;
            scroll-behavior: smooth;
        }

        .movies-container::-webkit-scrollbar {
            display: none;
        }

        /* Beraflix Movie Cards */
        .movie-card {
            flex: 0 0 auto;
            width: 320px;
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.4s ease;
            position: relative;
            background: var(--bera-dark);
        }

        .movie-card:hover {
            transform: scale(1.08);
            z-index: 10;
            box-shadow: 0 10px 30px rgba(229, 9, 20, 0.3);
        }

        .movie-poster {
            width: 100%;
            height: 180px;
            object-fit: cover;
            transition: transform 0.4s ease;
        }

        .movie-card:hover .movie-poster {
            transform: scale(1.1);
        }

        .movie-info {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(20,20,20,0.95));
            padding: 1.5rem;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .movie-card:hover .movie-info {
            opacity: 1;
        }

        .movie-title {
            font-size: 1.2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: var(--bera-white);
        }

        .movie-meta {
            display: flex;
            gap: 1rem;
            font-size: 0.85rem;
            color: var(--bera-light);
            margin-bottom: 0.8rem;
        }

        .movie-description {
            font-size: 0.9rem;
            line-height: 1.4;
            color: var(--bera-white);
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .movie-rating {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: rgba(20,20,20,0.8);
            color: var(--bera-white);
            padding: 0.3rem 0.6rem;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 600;
        }

        /* Video Player */
        .video-player {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--bera-black);
            z-index: 2000;
            display: flex;
            flex-direction: column;
        }

        .player-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 3rem;
            background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%);
        }

        .player-title {
            font-size: 1.4rem;
            font-weight: 700;
            color: var(--bera-white);
            font-family: 'Bebas Neue', cursive;
            letter-spacing: 1px;
        }

        .close-player {
            background: none;
            border: none;
            color: var(--bera-white);
            font-size: 2rem;
            cursor: pointer;
            transition: color 0.3s;
        }

        .close-player:hover {
            color: var(--bera-red);
        }

        .video-element {
            flex: 1;
            width: 100%;
            background: #000;
        }

        /* Loading States */
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 3rem;
            color: var(--bera-light);
            font-size: 1.1rem;
        }

        .loading-spinner {
            border: 3px solid var(--bera-gray);
            border-top: 3px solid var(--bera-red);
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin-right: 1rem;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Quality Selector */
        .quality-selector {
            position: absolute;
            bottom: 100px;
            right: 30px;
            background: rgba(20,20,20,0.9);
            border: 1px solid var(--bera-gray);
            border-radius: 8px;
            padding: 1rem;
            z-index: 2001;
            display: none;
        }

        .quality-option {
            padding: 0.8rem 1.2rem;
            color: var(--bera-white);
            cursor: pointer;
            transition: background 0.3s;
            border-radius: 4px;
        }

        .quality-option:hover {
            background: var(--bera-red);
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
            .hero-content {
                max-width: 50%;
            }
            
            .hero-title {
                font-size: 3.5rem;
            }
        }

        @media (max-width: 968px) {
            .nav-links {
                display: none;
            }
            
            .hero-content {
                max-width: 70%;
            }
            
            .hero-title {
                font-size: 3rem;
            }
            
            .movie-card {
                width: 280px;
            }
        }

        @media (max-width: 768px) {
            .navbar {
                padding: 1rem;
            }
            
            .search-input {
                width: 200px;
            }
            
            .hero-content {
                max-width: 85%;
            }
            
            .hero-title {
                font-size: 2.5rem;
            }
            
            .hero-description {
                font-size: 1.1rem;
            }
            
            .movie-card {
                width: 240px;
            }
            
            .splash-logo {
                font-size: 5rem;
            }
        }

        @media (max-width: 480px) {
            .search-input {
                width: 150px;
            }
            
            .hero-title {
                font-size: 2rem;
            }
            
            .hero-buttons {
                flex-direction: column;
            }
            
            .movie-card {
                width: 200px;
            }
        }

        /* Scroll Buttons */
        .scroll-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(20,20,20,0.7);
            border: none;
            color: var(--bera-white);
            padding: 1.5rem 0.8rem;
            cursor: pointer;
            z-index: 5;
            opacity: 0;
            transition: all 0.3s ease;
            font-size: 1.5rem;
        }

        .scroll-left {
            left: 0;
            border-radius: 0 8px 8px 0;
        }

        .scroll-right {
            right: 0;
            border-radius: 8px 0 0 8px;
        }

        .row-content:hover .scroll-btn {
            opacity: 1;
        }

        .scroll-btn:hover {
            background: var(--bera-red);
        }

        /* Error States */
        .error-message {
            text-align: center;
            padding: 2rem;
            color: var(--bera-light);
            font-size: 1.1rem;
        }

        .retry-btn {
            background: var(--bera-red);
            color: var(--bera-white);
            border: none;
            padding: 0.8rem 1.5rem;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 1rem;
            font-weight: 600;
            transition: background 0.3s;
        }

        .retry-btn:hover {
            background: var(--bera-dark-red);
        }
    </style>
</head>
<body>
    <!-- Splash Screen -->
    <div id="splashScreen" class="splash-screen">
        <div class="splash-logo">BERAFLIX</div>
    </div>

    <!-- Main App -->
    <div id="app" class="hidden">
        <!-- Beraflix Navigation -->
        <nav class="navbar" id="navbar">
            <div class="nav-left">
                <a href="#" class="nav-logo">
                    <span>BERA</span><span>FLIX</span>
                </a>
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
                    <input type="text" class="search-input" id="searchInput" placeholder="Search movies and TV shows...">
                    <button class="search-btn" id="searchBtn">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
                <div class="user-avatar">
                    <i class="fas fa-user"></i>
                </div>
            </div>
        </nav>

        <!-- Beraflix Hero Banner -->
        <section class="hero-banner" id="heroBanner">
            <img class="hero-background" id="heroBackground" alt="Hero Background">
            <div class="hero-gradient"></div>
            <div class="hero-content">
                <h1 class="hero-title" id="heroTitle">Welcome to Beraflix</h1>
                <p class="hero-description" id="heroDescription">Unlimited movies, TV shows, and more. Watch anywhere. Cancel anytime.</p>
                <div class="hero-meta" id="heroMeta">
                    <span><i class="fas fa-star"></i> <span id="heroRating">8.5/10</span></span>
                    <span><i class="fas fa-clock"></i> <span id="heroYear">2024</span></span>
                    <span><i class="fas fa-film"></i> <span id="heroGenre">Action</span></span>
                </div>
                <div class="hero-buttons">
                    <button class="play-btn" id="heroPlayBtn">
                        <i class="fas fa-play"></i> Play Now
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
                    <button class="scroll-btn scroll-left" onclick="scrollRow('trendingContainer', -300)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="movies-container" id="trendingContainer">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            Loading trending content...
                        </div>
                    </div>
                    <button class="scroll-btn scroll-right" onclick="scrollRow('trendingContainer', 300)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </section>

            <!-- Popular Movies -->
            <section class="row" id="popularRow">
                <div class="row-header">
                    <h2 class="row-title">Popular on Beraflix</h2>
                </div>
                <div class="row-content">
                    <button class="scroll-btn scroll-left" onclick="scrollRow('popularContainer', -300)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="movies-container" id="popularContainer">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            Loading popular movies...
                        </div>
                    </div>
                    <button class="scroll-btn scroll-right" onclick="scrollRow('popularContainer', 300)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </section>

            <!-- Action Movies -->
            <section class="row" id="actionRow">
                <div class="row-header">
                    <h2 class="row-title">Action & Adventure</h2>
                </div>
                <div class="row-content">
                    <button class="scroll-btn scroll-left" onclick="scrollRow('actionContainer', -300)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="movies-container" id="actionContainer">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            Loading action movies...
                        </div>
                    </div>
                    <button class="scroll-btn scroll-right" onclick="scrollRow('actionContainer', 300)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
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
                <div class="player-title" id="playerTitle">Now Playing on Beraflix</div>
                <button class="close-player" id="closePlayer">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <video class="video-element" id="videoElement" controls>
                Your browser does not support the video tag.
            </video>
        </div>

        <!-- Quality Selector -->
        <div class="quality-selector" id="qualitySelector">
            <div class="quality-option" data-quality="360p">360p</div>
            <div class="quality-option" data-quality="480p">480p</div>
            <div class="quality-option" data-quality="720p">720p</div>
        </div>
    </div>

    <script>
        // Global State
        let currentMovies = [];
        let trendingMovies = [];
        let popularMovies = [];
        let actionMovies = [];
        let currentHeroMovie = null;
        let currentMovieSources = [];

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
        const heroRating = document.getElementById('heroRating');
        const heroYear = document.getElementById('heroYear');
        const heroGenre = document.getElementById('heroGenre');
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
        const qualitySelector = document.getElementById('qualitySelector');

        // Initialize App
        document.addEventListener('DOMContentLoaded', async () => {
            setTimeout(() => {
                splashScreen.style.display = 'none';
                app.classList.remove('hidden');
                initializeApp();
            }, 2500);
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
                qualitySelector.style.display = 'none';
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
                    playMovie(currentHeroMovie.subjectId);
                }
            });

            heroInfoBtn.addEventListener('click', () => {
                if (currentHeroMovie) {
                    showMovieDetails(currentHeroMovie.subjectId);
                }
            });

            // Quality selector
            document.querySelectorAll('.quality-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    const quality = e.target.getAttribute('data-quality');
                    selectQuality(quality);
                });
            });
        }

        // Scroll functionality for rows
        function scrollRow(containerId, amount) {
            const container = document.getElementById(containerId);
            container.scrollBy({ left: amount, behavior: 'smooth' });
        }

        // Load all content
        async function loadAllContent() {
            await loadTrendingMovies();
            await loadPopularMovies();
            await loadActionMovies();
        }

        // Load trending movies
        async function loadTrendingMovies() {
            try {
                trendingContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading trending content...</div>';
                
                const response = await fetch('/api/search/avengers');
                const data = await response.json();
                
                if (data.success && data.results && data.results.items.length > 0) {
                    trendingMovies = data.results.items.slice(0, 12);
                    displayMovies(trendingMovies, trendingContainer);
                    
                    // Set first movie as hero if not already set
                    if (!currentHeroMovie) {
                        currentHeroMovie = trendingMovies[0];
                        setHeroMovie(currentHeroMovie);
                    }
                } else {
                    trendingContainer.innerHTML = '<div class="error-message">No trending movies found. <button class="retry-btn" onclick="loadTrendingMovies()">Try Again</button></div>';
                }
            } catch (error) {
                console.error('Error loading trending movies:', error);
                trendingContainer.innerHTML = '<div class="error-message">Error loading trending movies. <button class="retry-btn" onclick="loadTrendingMovies()">Try Again</button></div>';
            }
        }

        // Load popular movies
        async function loadPopularMovies() {
            try {
                popularContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading popular movies...</div>';
                
                const response = await fetch('/api/search/popular');
                const data = await response.json();
                
                if (data.success && data.results && data.results.items.length > 0) {
                    popularMovies = data.results.items.slice(0, 12);
                    displayMovies(popularMovies, popularContainer);
                } else {
                    // Fallback to different search
                    const fallbackResponse = await fetch('/api/search/movie');
                    const fallbackData = await fallbackResponse.json();
                    
                    if (fallbackData.success && fallbackData.results && fallbackData.results.items.length > 0) {
                        popularMovies = fallbackData.results.items.slice(0, 12);
                        displayMovies(popularMovies, popularContainer);
                    } else {
                        popularContainer.innerHTML = '<div class="error-message">No popular movies found.</div>';
                    }
                }
            } catch (error) {
                console.error('Error loading popular movies:', error);
                popularContainer.innerHTML = '<div class="error-message">Error loading popular movies.</div>';
            }
        }

        // Load action movies
        async function loadActionMovies() {
            try {
                actionContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading action movies...</div>';
                
                const response = await fetch('/api/search/action');
                const data = await response.json();
                
                if (data.success && data.results && data.results.items.length > 0) {
                    actionMovies = data.results.items.slice(0, 12);
                    displayMovies(actionMovies, actionContainer);
                } else {
                    actionContainer.innerHTML = '<div class="error-message">No action movies found.</div>';
                }
            } catch (error) {
                console.error('Error loading action movies:', error);
                actionContainer.innerHTML = '<div class="error-message">Error loading action movies.</div>';
            }
        }

        // Search movies
        async function searchMovies(query) {
            try {
                searchResultsContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Searching for "' + query + '"...</div>';
                searchResultsRow.style.display = 'block';
                
                // Hide other rows during search
                document.getElementById('trendingRow').style.display = 'none';
                document.getElementById('popularRow').style.display = 'none';
                document.getElementById('actionRow').style.display = 'none';
                
                const response = await fetch('/api/search/' + encodeURIComponent(query));
                const data = await response.json();
                
                if (data.success && data.results && data.results.items.length > 0) {
                    currentMovies = data.results.items;
                    displayMovies(currentMovies, searchResultsContainer);
                } else {
                    searchResultsContainer.innerHTML = '<div class="error-message">No results found for "' + query + '"</div>';
                }
            } catch (error) {
                console.error('Error searching movies:', error);
                searchResultsContainer.innerHTML = '<div class="error-message">Error searching movies.</div>';
            }
        }

        // Display movies in Beraflix-style rows
        function displayMovies(movies, container) {
            if (!movies || movies.length === 0) {
                container.innerHTML = '<div class="error-message">No movies to display</div>';
                return;
            }

            container.innerHTML = movies.map(movie => \`
                <div class="movie-card" onclick="showMovieDetails('\${movie.subjectId}')">
                    \${movie.cover && movie.cover.url ? 
                        \`<img src="\${movie.cover.url}" alt="\${movie.title}" class="movie-poster">\` :
                        \`<div style="background: var(--bera-gradient); height: 180px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">No Image</div>\`
                    }
                    \${movie.imdbRatingValue ? \`<div class="movie-rating">\${movie.imdbRatingValue}/10</div>\` : ''}
                    <div class="movie-info">
                        <div class="movie-title">\${movie.title || 'Unknown Title'}</div>
                        <div class="movie-meta">
                            \${movie.releaseDate ? \`<span>\${movie.releaseDate.split('-')[0]}</span>\` : ''}
                            \${movie.genre ? \`<span>\${movie.genre.split(',')[0]}</span>\` : ''}
                        </div>
                        <div class="movie-description">\${movie.description || 'No description available'}</div>
                    </div>
                </div>
            \`).join('');
        }

        // Set hero movie
        function setHeroMovie(movie) {
            if (movie.cover && movie.cover.url) {
                heroBackground.src = movie.cover.url;
            }
            heroTitle.textContent = movie.title || 'Beraflix';
            heroDescription.textContent = movie.description || 'Unlimited movies, TV shows, and more. Watch anywhere. Cancel anytime.';
            
            if (movie.imdbRatingValue) {
                heroRating.textContent = movie.imdbRatingValue + '/10';
            }
            
            if (movie.releaseDate) {
                heroYear.textContent = movie.releaseDate.split('-')[0];
            }
            
            if (movie.genre) {
                heroGenre.textContent = movie.genre.split(',')[0];
            }
        }

        // Show movie details and play options
        async function showMovieDetails(movieId) {
            try {
                const response = await fetch('/api/info/' + movieId);
                const data = await response.json();
                
                if (data.success && data.results && data.results.subject) {
                    const movie = data.results.subject;
                    const play = confirm(\`\${movie.title || 'Movie'}\\n\\n\${movie.description || 'No description available'}\\n\\nRating: \${movie.imdbRatingValue || 'N/A'}/10\\n\\nClick OK to play or Cancel for download options.\`);
                    
                    if (play) {
                        playMovie(movieId);
                    } else {
                        showDownloadOptions(movieId);
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

        // Play movie using sources endpoint
        async function playMovie(movieId) {
            try {
                const response = await fetch('/api/sources/' + movieId);
                const data = await response.json();
                
                if (data.success && data.results && data.results.length > 0) {
                    currentMovieSources = data.results;
                    
                    // Auto-select the highest quality (720p if available)
                    let selectedSource = data.results.find(source => source.quality === '720p') ||
                                       data.results.find(source => source.quality === '480p') ||
                                       data.results[0];
                    
                    const videoSource = selectedSource.download_url;
                    
                    // Find movie title for display
                    const allMovies = [...trendingMovies, ...popularMovies, ...actionMovies, ...currentMovies];
                    const movie = allMovies.find(m => m.subjectId === movieId);
                    
                    videoElement.src = videoSource;
                    playerTitle.textContent = movie ? movie.title : 'Now Playing on Beraflix';
                    videoPlayer.classList.remove('hidden');
                    
                    // Show quality selector
                    qualitySelector.style.display = 'block';
                    
                    videoElement.play().catch(e => {
                        console.log('Autoplay prevented:', e);
                    });
                } else {
                    alert('No video source available for this movie');
                }
            } catch (error) {
                console.error('Error playing movie:', error);
                alert('Error loading movie. Please try again.');
            }
        }

        // Show download options
        async function showDownloadOptions(movieId) {
            try {
                const response = await fetch('/api/sources/' + movieId);
                const data = await response.json();
                
                if (data.success && data.results && data.results.length > 0) {
                    let message = 'Available download qualities:\\n\\n';
                    data.results.forEach(source => {
                        message += \`\${source.quality} - \${formatFileSize(source.size)}\\n\`;
                    });
                    message += '\\nClick OK to download the highest quality.';
                    
                    if (confirm(message)) {
                        const bestQuality = data.results[0];
                        window.open(bestQuality.download_url, '_blank');
                    }
                } else {
                    alert('No download available for this movie');
                }
            } catch (error) {
                console.error('Error getting download options:', error);
                alert('Error getting download options.');
            }
        }

        // Select video quality
        function selectQuality(quality) {
            const source = currentMovieSources.find(s => s.quality === quality);
            if (source) {
                videoElement.src = source.download_url;
                videoElement.play();
                qualitySelector.style.display = 'none';
            }
        }

        // Format file size
        function formatFileSize(bytes) {
            if (!bytes) return 'Unknown size';
            const mb = Math.round(bytes / (1024 * 1024));
            return mb + ' MB';
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
        window.showMovieDetails = showMovieDetails;
        window.playMovie = playMovie;
        window.handleSearch = handleSearch;
        window.scrollRow = scrollRow;
        window.loadTrendingMovies = loadTrendingMovies;
    </script>
</body>
</html>
  `);
});

// API Routes - Using the exact Gifted Movies API endpoints
app.get('/api/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    console.log('Searching movies for:', query);
    
    const response = await fetch(`${MOVIE_API_BASE}/search/${encodeURIComponent(query)}`);
    const data = await response.json();
    
    console.log('Search API response:', data.results ? data.results.items.length : 0, 'movies found');
    
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
    console.log('Fetching movie info for:', movieId);
    
    const response = await fetch(`${MOVIE_API_BASE}/info/${movieId}`);
    const data = await response.json();
    
    console.log('Movie info response:', data.results ? 'Found' : 'Not found');
    
    if (data.status === 200 && data.results) {
      res.json({ 
        success: true, 
        results: data.results 
      });
    } else {
      res.json({ 
        success: false, 
        message: 'No movie info found',
        results: null
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

app.get('/api/sources/:id', async (req, res) => {
  try {
    const movieId = req.params.id;
    console.log('Fetching sources for movie:', movieId);
    
    const response = await fetch(`${MOVIE_API_BASE}/sources/${movieId}`);
    const data = await response.json();
    
    console.log('Sources API response:', data.results ? data.results.length : 0, 'sources found');
    
    if (data.status === 200 && data.results && data.results.length > 0) {
      res.json({ 
        success: true, 
        results: data.results 
      });
    } else {
      res.json({ 
        success: false, 
        message: 'No sources available for this movie',
        results: []
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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Beraflix - Netflix Clone',
    movie_api: MOVIE_API_BASE,
    endpoints: {
      search: '/api/search/:query',
      info: '/api/info/:id',
      sources: '/api/sources/:id'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎬 Beraflix Server running on port ${PORT}`);
  console.log(`📍 Visit: http://localhost:${PORT}`);
  console.log(`🎯 Movie API: ${MOVIE_API_BASE}`);
  console.log(`✨ Brand: BERAFLIX - Premium Streaming Experience`);
});

module.exports = app;
