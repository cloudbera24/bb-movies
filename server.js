// server.js - Complete BB Movies Platform
require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 8080;

// Supabase Configuration
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Movie API Base URL
const MOVIE_API_BASE = 'https://movieapi.giftedtech.co.ke/api';

// Serve the main application
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BB Movies - Premium Streaming</title>
    <link rel="stylesheet" href="/styles">
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#000000">
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
    <div id="app" class="app hidden">
        <!-- Navigation -->
        <nav class="navbar">
            <div class="nav-container">
                <div class="nav-logo">
                    <h1>BB MOVIES</h1>
                </div>
                <div class="nav-search">
                    <input type="text" id="searchInput" placeholder="Search movies...">
                    <button id="voiceSearch" class="voice-btn">🎤</button>
                    <button id="searchBtn">Search</button>
                </div>
                <div class="nav-auth">
                    <button id="authBtn" class="auth-btn">Sign In</button>
                    <div id="userMenu" class="user-menu hidden">
                        <img id="userAvatar" class="user-avatar" src="" alt="Avatar">
                        <div class="user-dropdown">
                            <button id="profileBtn">Profile</button>
                            <button id="logoutBtn">Logout</button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Hero Section -->
            <section class="hero-section">
                <div class="hero-background" id="heroBackground"></div>
                <div class="hero-content">
                    <h1 id="heroTitle" class="hero-title"></h1>
                    <p id="heroDescription" class="hero-description"></p>
                    <div class="hero-actions">
                        <button class="play-btn" id="heroPlayBtn">▶ Play</button>
                        <button class="info-btn" id="heroInfoBtn">ℹ More Info</button>
                    </div>
                </div>
            </section>

            <!-- Movie Sections -->
            <section class="movie-sections">
                <div class="section" id="trendingSection">
                    <h2>Trending Now</h2>
                    <div class="movie-grid" id="trendingGrid"></div>
                </div>

                <div class="section" id="continueWatchingSection">
                    <h2>Continue Watching</h2>
                    <div class="movie-grid" id="continueGrid"></div>
                </div>

                <div class="section" id="downloadsSection">
                    <h2>My Downloads</h2>
                    <div class="movie-grid" id="downloadsGrid"></div>
                </div>

                <div class="section" id="watchlistSection">
                    <h2>My Watchlist</h2>
                    <div class="movie-grid" id="watchlistGrid"></div>
                </div>
            </section>
        </main>

        <!-- Movie Modal -->
        <div id="movieModal" class="modal hidden">
            <div class="modal-content">
                <span class="close-btn">&times;</span>
                <div id="modalContent"></div>
            </div>
        </div>

        <!-- Video Player -->
        <div id="videoPlayer" class="video-player hidden">
            <div class="player-header">
                <button id="closePlayer" class="close-player">&times;</button>
                <div class="player-controls">
                    <button id="qualityBtn" class="control-btn">Quality</button>
                    <button id="downloadBtn" class="control-btn">Download</button>
                    <button id="cinemaBtn" class="control-btn">Cinema Mode</button>
                </div>
            </div>
            <video id="videoElement" controls>
                Your browser does not support the video tag.
            </video>
            <div class="player-info">
                <h3 id="playerTitle"></h3>
                <div class="progress-container">
                    <div class="progress-bar" id="progressBar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Auth Modal -->
        <div id="authModal" class="modal hidden">
            <div class="auth-content">
                <span class="close-auth">&times;</span>
                <h2>Welcome to BB Movies</h2>
                <form id="authForm">
                    <input type="email" id="authEmail" placeholder="Email" required>
                    <input type="password" id="authPassword" placeholder="Password" required>
                    <button type="submit" id="authSubmit">Sign In</button>
                </form>
                <p id="authToggle">Don't have an account? <a href="#" id="toggleAuth">Sign Up</a></p>
            </div>
        </div>
    </div>

    <script src="/script"></script>
</body>
</html>
  `);
});

// Serve CSS
app.get('/styles', (req, res) => {
  res.setHeader('Content-Type', 'text/css');
  res.send(`
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
    animation: splashFade 2s ease-in-out;
}

.splash-content {
    text-align: center;
    animation: splashText 2s ease-in-out;
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

@keyframes splashFade {
    0% { opacity: 1; }
    70% { opacity: 1; }
    100% { opacity: 0; visibility: hidden; }
}

@keyframes splashText {
    0% { transform: scale(0.8); opacity: 0; }
    50% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
}

.hidden {
    display: none !important;
}

/* Navigation */
.navbar {
    position: fixed;
    top: 0;
    width: 100%;
    background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%);
    padding: 1rem 2rem;
    z-index: 1000;
    transition: background 0.3s;
}

.navbar.scrolled {
    background: rgba(0,0,0,0.9);
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

.nav-search input::placeholder {
    color: #ccc;
}

.voice-btn, .nav-search button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 25px;
    background: #8B0000;
    color: white;
    cursor: pointer;
    transition: background 0.3s;
}

.voice-btn:hover, .nav-search button:hover {
    background: #A00000;
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
    line-height: 1.6;
}

.hero-actions {
    display: flex;
    gap: 1rem;
}

.play-btn, .info-btn {
    padding: 0.8rem 2rem;
    border: none;
    border-radius: 5px;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.3s;
}

.play-btn {
    background: #8B0000;
    color: white;
}

.play-btn:hover {
    background: #A00000;
    transform: scale(1.05);
}

.info-btn {
    background: rgba(255,255,255,0.2);
    color: white;
}

.info-btn:hover {
    background: rgba(255,255,255,0.3);
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
    position: relative;
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s;
    background: #1a1a1a;
}

.movie-card:hover {
    transform: scale(1.05);
    box-shadow: 0 10px 30px rgba(139, 0, 0, 0.3);
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

/* Modal */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
}

.modal-content, .auth-content {
    background: #1a1a1a;
    padding: 2rem;
    border-radius: 10px;
    max-width: 800px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
}

.close-btn, .close-auth {
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 2rem;
    cursor: pointer;
    color: #fff;
}

/* Video Player */
.video-player {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #000;
    z-index: 3000;
}

.video-player video {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.player-header {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    padding: 1rem;
    background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%);
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 1;
}

.player-controls {
    display: flex;
    gap: 1rem;
}

.control-btn {
    padding: 0.5rem 1rem;
    background: rgba(255,255,255,0.2);
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.player-info {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 1rem;
    background: linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%);
}

.progress-container {
    width: 100%;
    height: 4px;
    background: rgba(255,255,255,0.3);
    border-radius: 2px;
    margin-top: 0.5rem;
}

.progress-bar {
    width: 100%;
    height: 100%;
    position: relative;
}

.progress-fill {
    height: 100%;
    background: #8B0000;
    border-radius: 2px;
    transition: width 0.1s;
}

/* Responsive Design */
@media (max-width: 768px) {
    .nav-container {
        flex-direction: column;
        gap: 1rem;
    }

    .nav-search {
        flex: 1;
        width: 100%;
    }

    .hero-title {
        font-size: 2rem;
    }

    .movie-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }

    .hero-actions {
        flex-direction: column;
    }
}

/* Auth Styles */
.auth-content {
    max-width: 400px;
}

.auth-content input {
    width: 100%;
    padding: 1rem;
    margin-bottom: 1rem;
    border: none;
    border-radius: 5px;
    background: rgba(255,255,255,0.1);
    color: white;
}

.auth-content button {
    width: 100%;
    padding: 1rem;
    background: #8B0000;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.user-menu {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
}

.user-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    background: #1a1a1a;
    border-radius: 5px;
    padding: 0.5rem;
    display: none;
}

.user-menu:hover .user-dropdown {
    display: block;
}

.user-dropdown button {
    display: block;
    width: 100%;
    padding: 0.5rem 1rem;
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    text-align: left;
}

.user-dropdown button:hover {
    background: #8B0000;
}
  `);
});

// Serve JavaScript
app.get('/script', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
// Global State
let currentUser = null;
let movies = [];
let trendingMovies = [];
let watchHistory = [];
let downloads = [];
let watchlist = [];

// DOM Elements
const splashScreen = document.getElementById('splashScreen');
const app = document.getElementById('app');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const voiceSearch = document.getElementById('voiceSearch');
const authBtn = document.getElementById('authBtn');
const userMenu = document.getElementById('userMenu');
const movieModal = document.getElementById('movieModal');
const videoPlayer = document.getElementById('videoPlayer');
const authModal = document.getElementById('authModal');
const videoElement = document.getElementById('videoElement');

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    // Show splash screen for 2 seconds
    setTimeout(() => {
        splashScreen.style.display = 'none';
        app.classList.remove('hidden');
        initializeApp();
    }, 2000);

    // Load initial data
    await loadTrendingMovies();
    await checkAuthState();
    loadFromLocalStorage();
});

// Initialize App Functions
function initializeApp() {
    setupEventListeners();
    setupServiceWorker();
}

function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    voiceSearch.addEventListener('click', startVoiceSearch);
    authBtn.addEventListener('click', showAuthModal);
    window.addEventListener('scroll', handleScroll);
}

// Service Worker Registration
async function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered');
        } catch (error) {
            console.log('Service Worker registration failed:', error);
        }
    }
}

// Authentication Functions
async function checkAuthState() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        currentUser = user;
        updateAuthUI();
        await loadUserData();
    }
}

function updateAuthUI() {
    if (currentUser) {
        authBtn.classList.add('hidden');
        userMenu.classList.remove('hidden');
        document.getElementById('userAvatar').src = currentUser.user_metadata?.avatar_url || '/default-avatar.png';
    } else {
        authBtn.classList.remove('hidden');
        userMenu.classList.add('hidden');
    }
}

function showAuthModal() {
    authModal.classList.remove('hidden');
}

// Movie API Functions
async function loadTrendingMovies() {
    try {
        const response = await fetch('/api/movies/trending');
        const data = await response.json();
        
        if (data.movies && data.movies.length > 0) {
            trendingMovies = data.movies;
            displayMovies(trendingMovies, 'trendingGrid');
            
            // Set hero movie
            const heroMovie = trendingMovies[0];
            setHeroMovie(heroMovie);
        }
    } catch (error) {
        console.error('Error loading trending movies:', error);
    }
}

async function searchMovies(query) {
    try {
        const response = await fetch('/api/movies/search?q=' + encodeURIComponent(query));
        const data = await response.json();
        
        if (data.movies) {
            movies = data.movies;
            // Clear existing sections and show search results
            clearMovieSections();
            displaySearchResults(movies);
        }
    } catch (error) {
        console.error('Error searching movies:', error);
    }
}

function setHeroMovie(movie) {
    const heroBackground = document.getElementById('heroBackground');
    const heroTitle = document.getElementById('heroTitle');
    const heroDescription = document.getElementById('heroDescription');
    const heroPlayBtn = document.getElementById('heroPlayBtn');
    
    if (movie.background || movie.poster) {
        heroBackground.style.backgroundImage = 'url(' + (movie.background || movie.poster) + ')';
    }
    
    heroTitle.textContent = movie.title || 'BB Movies';
    heroDescription.textContent = movie.description || 'Premium streaming experience';
    
    heroPlayBtn.onclick = () => playMovie(movie);
}

function displayMovies(movies, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = movies.map(movie => 
        '<div class="movie-card" onclick="showMovieDetails(' + JSON.stringify(movie).replace(/"/g, '&quot;') + ')">' +
        '<img src="' + (movie.poster || '/placeholder.jpg') + '" alt="' + movie.title + '" class="movie-poster" onerror="this.src=\\'/placeholder.jpg\\'">' +
        '<div class="movie-info">' +
        '<h3 class="movie-title">' + movie.title + '</h3>' +
        '<p class="movie-year">' + (movie.year || '') + '</p>' +
        '</div>' +
        '</div>'
    ).join('');
}

function clearMovieSections() {
    const sections = ['trendingGrid', 'continueGrid', 'downloadsGrid', 'watchlistGrid'];
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) element.innerHTML = '';
    });
}

function displaySearchResults(movies) {
    const mainContent = document.querySelector('.main-content');
    const existingResults = document.getElementById('searchResults');
    
    if (existingResults) {
        existingResults.remove();
    }
    
    const searchResults = document.createElement('section');
    searchResults.id = 'searchResults';
    searchResults.className = 'section';
    searchResults.innerHTML = '<h2>Search Results</h2><div class="movie-grid" id="searchResultsGrid"></div>';
    
    mainContent.appendChild(searchResults);
    displayMovies(movies, 'searchResultsGrid');
}

// Movie Details and Playback
function showMovieDetails(movie) {
    const modalContent = document.getElementById('modalContent');
    
    modalContent.innerHTML = '
        <div class="movie-details">
            <div class="details-header">
                <img src="' + (movie.poster || '/placeholder.jpg') + '" alt="' + movie.title + '" class="details-poster">
                <div class="details-info">
                    <h2>' + movie.title + '</h2>
                    <p class="details-year">' + (movie.year || '') + '</p>
                    <p class="details-description">' + (movie.description || 'No description available') + '</p>
                    <div class="details-actions">
                        <button class="play-btn" onclick="playMovie(' + JSON.stringify(movie).replace(/"/g, '&quot;') + ')">▶ Play</button>
                        <button class="download-btn" onclick="downloadMovie(' + JSON.stringify(movie).replace(/"/g, '&quot;') + ')">⬇ Download</button>
                        <button class="favorite-btn" onclick="addToWatchlist(' + JSON.stringify(movie).replace(/"/g, '&quot;') + ')">❤ Add to Watchlist</button>
                    </div>
                </div>
            </div>
        </div>
    ';
    
    movieModal.classList.remove('hidden');
}

async function playMovie(movie) {
    try {
        const response = await fetch('/api/movies/sources/' + movie.id);
        const data = await response.json();
        
        if (data.sources && data.sources.length > 0) {
            const videoSource = data.sources[0].url;
            videoElement.src = videoSource;
            document.getElementById('playerTitle').textContent = movie.title;
            videoPlayer.classList.remove('hidden');
            movieModal.classList.add('hidden');
            
            // Load resume position
            const resumePosition = getResumePosition(movie.id);
            if (resumePosition > 0) {
                videoElement.currentTime = resumePosition;
            }
            
            // Set up progress tracking
            videoElement.ontimeupdate = () => {
                updateProgressBar(movie.id, videoElement.currentTime, videoElement.duration);
            };
            
            videoElement.play();
        }
    } catch (error) {
        console.error('Error playing movie:', error);
        alert('Error loading movie. Please try again.');
    }
}

async function downloadMovie(movie) {
    try {
        const response = await fetch('/api/movies/sources/' + movie.id);
        const data = await response.json();
        
        if (data.sources && data.sources.length > 0) {
            const downloadUrl = data.sources[0].url;
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = movie.title + '.mp4';
            link.click();
            
            // Save download record
            saveDownload(movie);
        }
    } catch (error) {
        console.error('Error downloading movie:', error);
    }
}

// Voice Search
function startVoiceSearch() {
    if (!('webkitSpeechRecognition' in window)) {
        alert('Voice search not supported in this browser');
        return;
    }
    
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => {
        voiceSearch.style.background = '#A00000';
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        searchInput.value = transcript;
        handleSearch();
    };
    
    recognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
    };
    
    recognition.onend = () => {
        voiceSearch.style.background = '#8B0000';
    };
    
    recognition.start();
}

// Local Storage Management
function loadFromLocalStorage() {
    try {
        watchHistory = JSON.parse(localStorage.getItem('watchHistory')) || [];
        downloads = JSON.parse(localStorage.getItem('downloads')) || [];
        watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
        
        updateContinueWatching();
        updateDownloadsSection();
        updateWatchlistSection();
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('watchHistory', JSON.stringify(watchHistory));
        localStorage.setItem('downloads', JSON.stringify(downloads));
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function getResumePosition(movieId) {
    const record = watchHistory.find(item => item.movieId === movieId);
    return record ? record.position : 0;
}

function updateProgressBar(movieId, currentTime, duration) {
    const progressFill = document.getElementById('progressFill');
    const progress = (currentTime / duration) * 100;
    progressFill.style.width = progress + '%';
    
    // Update watch history
    const existingIndex = watchHistory.findIndex(item => item.movieId === movieId);
    if (existingIndex > -1) {
        watchHistory[existingIndex].position = currentTime;
        watchHistory[existingIndex].timestamp = Date.now();
    } else {
        watchHistory.push({
            movieId: movieId,
            position: currentTime,
            timestamp: Date.now()
        });
    }
    
    // Keep only last 50 items
    if (watchHistory.length > 50) {
        watchHistory = watchHistory.slice(-50);
    }
    
    saveToLocalStorage();
}

function saveDownload(movie) {
    downloads.push({
        ...movie,
        downloadDate: Date.now()
    });
    
    // Keep only last 20 downloads
    if (downloads.length > 20) {
        downloads = downloads.slice(-20);
    }
    
    saveToLocalStorage();
    updateDownloadsSection();
}

function addToWatchlist(movie) {
    if (!watchlist.find(item => item.id === movie.id)) {
        watchlist.push(movie);
        saveToLocalStorage();
        updateWatchlistSection();
        alert('Added to watchlist!');
    } else {
        alert('Already in watchlist!');
    }
}

function updateContinueWatching() {
    const recentHistory = watchHistory
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);
    
    // You would need to fetch movie details for each history item
    // For now, we'll just show a message
    const continueGrid = document.getElementById('continueGrid');
    if (recentHistory.length > 0) {
        continueGrid.innerHTML = '<p>Continue watching feature loaded</p>';
    }
}

function updateDownloadsSection() {
    const downloadsGrid = document.getElementById('downloadsGrid');
    if (downloads.length > 0) {
        displayMovies(downloads, 'downloadsGrid');
    }
}

function updateWatchlistSection() {
    const watchlistGrid = document.getElementById('watchlistGrid');
    if (watchlist.length > 0) {
        displayMovies(watchlist, 'watchlistGrid');
    }
}

// Event Handlers
function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
        searchMovies(query);
    }
}

function handleScroll() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}

// Close modals when clicking outside
window.onclick = (event) => {
    if (event.target === movieModal) {
        movieModal.classList.add('hidden');
    }
    if (event.target === authModal) {
        authModal.classList.add('hidden');
    }
    if (event.target === videoPlayer) {
        videoPlayer.classList.add('hidden');
        videoElement.pause();
    }
};

// Close buttons
document.querySelector('.close-btn').onclick = () => movieModal.classList.add('hidden');
document.querySelector('.close-auth').onclick = () => authModal.classList.add('hidden');
document.getElementById('closePlayer').onclick = () => {
    videoPlayer.classList.add('hidden');
    videoElement.pause();
};

// Export functions to global scope
window.showMovieDetails = showMovieDetails;
window.playMovie = playMovie;
window.downloadMovie = downloadMovie;
window.addToWatchlist = addToWatchlist;
  `);
});

// Serve Service Worker
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
const CACHE_NAME = 'bb-movies-v1';
const urlsToCache = [
    '/',
    '/styles',
    '/script',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});
  `);
});

// Serve Manifest
app.get('/manifest.json', (req, res) => {
  res.json({
    name: "BB Movies",
    short_name: "BB Movies",
    description: "Premium Movie Streaming Platform",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#8B0000",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  });
});

// API Routes
app.get('/api/movies/trending', async (req, res) => {
  try {
    const response = await fetch(`${MOVIE_API_BASE}/search/?q=action`);
    const data = await response.json();
    res.json({ movies: data.movies || [] });
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    res.status(500).json({ error: 'Failed to fetch trending movies' });
  }
});

app.get('/api/movies/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    const response = await fetch(`${MOVIE_API_BASE}/search/?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    res.json({ movies: data.movies || [] });
  } catch (error) {
    console.error('Error searching movies:', error);
    res.status(500).json({ error: 'Failed to search movies' });
  }
});

app.get('/api/movies/sources/:id', async (req, res) => {
  try {
    const movieId = req.params.id;
    const response = await fetch(`${MOVIE_API_BASE}/sources/${movieId}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching movie sources:', error);
    res.status(500).json({ error: 'Failed to fetch movie sources' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`BB Movies server running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
});

module.exports = app;
