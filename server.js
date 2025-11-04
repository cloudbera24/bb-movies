require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Supabase Configuration
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://hfczrryqocgnmbkwemmu.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmY3pycnlxb2Nnbm1ia3dlbW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MjAxMDQsImV4cCI6MjA3NzI5NjEwNH0.L7mltOW-QysNLyQ7vru87dntXqZCjdFRCEEL-Zwpwvw'
);

// API Base URLs
const MOVIE_API_BASE = 'https://movieapi.giftedtech.co.ke/api';
const GIFTED_API_BASE = 'https://api.giftedtech.co.ke/api';
const API_KEY = 'gifted';

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'beraflix_super_secret_key_2024';

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// PWA Manifest
app.get('/manifest.json', (req, res) => {
  res.json({
    "name": "Beraflix - Ultimate Entertainment Hub",
    "short_name": "Beraflix",
    "description": "Stream movies, download YouTube videos, listen to music, and more",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#0a0a0a",
    "theme_color": "#e50914",
    "orientation": "any",
    "icons": [
      {
        "src": "/icon-192.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any maskable"
      },
      {
        "src": "/icon-512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any maskable"
      }
    ],
    "categories": ["entertainment", "movies", "video", "music"],
    "lang": "en",
    "scope": "/"
  });
});

// Service Worker
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    const CACHE_NAME = 'beraflix-ultimate-v1';
    const urlsToCache = [
      '/',
      '/manifest.json',
      '/api/trending',
      '/api/search/popular'
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
          })
      );
    });
  `);
});

// Serve main HTML with all features
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Beraflix - Movies, YouTube & Music</title>
    <meta name="description" content="Stream HD movies, download YouTube videos, search music, and enjoy unlimited entertainment">
    <meta name="theme-color" content="#e50914">
    <link rel="manifest" href="/manifest.json">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="apple-touch-icon" href="/icon-192.png">
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
            --bera-green: #1db954;
            --bera-purple: #8a2be2;
            --bera-black: #0a0a0a;
            --bera-dark: #141414;
            --bera-gray: #2a2a2a;
            --bera-light: #8c8c8c;
            --bera-white: #ffffff;
            --bera-gradient: linear-gradient(135deg, #e50914 0%, #b2070f 50%, #8b0000 100%);
            --bera-premium: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
            --youtube-red: #ff0000;
            --spotify-green: #1db954;
            --torrent-purple: #8a2be2;
        }

        body {
            background: var(--bera-black);
            color: var(--bera-white);
            font-family: 'Montserrat', 'Roboto', sans-serif;
            overflow-x: hidden;
            line-height: 1.6;
        }

        /* Enhanced Install Prompt */
        .install-prompt {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--bera-dark);
            border: 2px solid var(--bera-red);
            border-radius: 15px;
            padding: 1.5rem;
            z-index: 10000;
            display: none;
            max-width: 350px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.7);
            backdrop-filter: blur(10px);
            animation: slideInUp 0.5s ease;
        }

        @keyframes slideInUp {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .install-prompt-content {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .install-buttons {
            display: flex;
            gap: 0.8rem;
            justify-content: flex-end;
        }

        .install-btn {
            background: var(--bera-red);
            color: white;
            border: none;
            padding: 0.8rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
            flex: 1;
        }

        /* Mobile Navigation */
        .mobile-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: var(--bera-dark);
            border-top: 1px solid var(--bera-gray);
            display: none;
            z-index: 1000;
            padding: 0.5rem 0;
        }

        .mobile-nav-items {
            display: flex;
            justify-content: space-around;
            align-items: center;
        }

        .mobile-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-decoration: none;
            color: var(--bera-light);
            font-size: 0.8rem;
            padding: 0.5rem;
            transition: all 0.3s;
            flex: 1;
        }

        .mobile-nav-item.active {
            color: var(--bera-red);
        }

        /* Section Badges */
        .section-badge {
            padding: 0.5rem 1.5rem;
            border-radius: 25px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: inline-block;
            margin-bottom: 1.5rem;
            font-size: 0.9rem;
        }

        .youtube-badge {
            background: linear-gradient(135deg, #ff0000, #cc0000);
            color: white;
        }

        .spotify-badge {
            background: linear-gradient(135deg, #1db954, #1ed760);
            color: white;
        }

        .torrent-badge {
            background: linear-gradient(135deg, #8a2be2, #6a0dad);
            color: white;
        }

        .music-badge {
            background: linear-gradient(135deg, #ff6b6b, #ee5a24);
            color: white;
        }

        /* Search Containers */
        .search-container {
            background: rgba(255,255,255,0.05);
            border-radius: 15px;
            padding: 2rem;
            margin: 2rem 0;
            border: 2px solid var(--bera-gray);
        }

        .search-input-group {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .search-input {
            flex: 1;
            background: rgba(255,255,255,0.1);
            border: 2px solid transparent;
            color: var(--bera-white);
            padding: 1rem 1.5rem;
            border-radius: 10px;
            font-size: 1rem;
            transition: all 0.3s;
        }

        .search-input:focus {
            border-color: var(--bera-red);
            background: rgba(255,255,255,0.15);
        }

        .search-btn {
            background: var(--bera-red);
            color: var(--bera-white);
            border: none;
            padding: 1rem 2rem;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
        }

        .search-btn:hover {
            background: var(--bera-dark-red);
            transform: translateY(-2px);
        }

        /* Content Grids */
        .content-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.5rem;
            margin-top: 1.5rem;
        }

        .content-card {
            background: var(--bera-dark);
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.3s;
            border: 1px solid rgba(255,255,255,0.1);
        }

        .content-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(229, 9, 20, 0.3);
            border-color: var(--bera-red);
        }

        .card-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
        }

        .card-content {
            padding: 1.5rem;
        }

        .card-title {
            font-size: 1.2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: var(--bera-white);
        }

        .card-description {
            color: var(--bera-light);
            font-size: 0.9rem;
            line-height: 1.5;
            margin-bottom: 1rem;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .card-actions {
            display: flex;
            gap: 0.8rem;
            flex-wrap: wrap;
        }

        .action-btn {
            padding: 0.6rem 1.2rem;
            border: none;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .watch-btn {
            background: var(--bera-red);
            color: var(--bera-white);
        }

        .download-btn {
            background: var(--bera-gold);
            color: #000;
        }

        .music-btn {
            background: var(--spotify-green);
            color: white;
        }

        .torrent-btn {
            background: var(--torrent-purple);
            color: white;
        }

        /* Navigation */
        .navbar {
            position: fixed;
            top: 0;
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 4%;
            z-index: 1000;
            background: rgba(10,10,10,0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid var(--bera-red);
        }

        .nav-logo {
            font-family: 'Bebas Neue', cursive;
            font-size: 2.2rem;
            font-weight: bold;
            color: transparent;
            background: var(--bera-gradient);
            -webkit-background-clip: text;
            background-clip: text;
            letter-spacing: 2px;
            text-decoration: none;
        }

        .nav-tabs {
            display: flex;
            gap: 2rem;
            list-style: none;
        }

        .nav-tab {
            color: var(--bera-white);
            text-decoration: none;
            font-weight: 600;
            padding: 0.5rem 1rem;
            border-radius: 25px;
            transition: all 0.3s;
            cursor: pointer;
        }

        .nav-tab.active {
            background: var(--bera-red);
            color: white;
        }

        .nav-tab:hover {
            background: var(--bera-dark-red);
        }

        /* Main Content */
        .main-content {
            margin-top: 80px;
            padding: 2rem 4%;
        }

        .section {
            margin-bottom: 4rem;
            display: none;
        }

        .section.active {
            display: block;
        }

        .section-title {
            font-size: 2.5rem;
            font-weight: 800;
            margin-bottom: 2rem;
            color: var(--bera-white);
            font-family: 'Bebas Neue', cursive;
            letter-spacing: 2px;
        }

        /* Hero Section */
        .hero-section {
            background: linear-gradient(135deg, rgba(229,9,20,0.9), rgba(178,7,15,0.8));
            border-radius: 20px;
            padding: 4rem;
            text-align: center;
            margin-bottom: 3rem;
        }

        .hero-title {
            font-size: 4rem;
            font-weight: 900;
            margin-bottom: 1rem;
            font-family: 'Bebas Neue', cursive;
            letter-spacing: 3px;
        }

        .hero-subtitle {
            font-size: 1.5rem;
            color: var(--bera-white);
            opacity: 0.9;
            margin-bottom: 2rem;
        }

        /* Loading States */
        .loading {
            text-align: center;
            padding: 3rem;
            color: var(--bera-light);
        }

        .loading-spinner {
            border: 4px solid var(--bera-gray);
            border-top: 4px solid var(--bera-red);
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
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

            .nav-tabs {
                display: none;
            }

            .mobile-nav {
                display: block;
            }

            .main-content {
                margin-top: 70px;
                padding: 1rem;
            }

            .hero-title {
                font-size: 2.5rem;
            }

            .content-grid {
                grid-template-columns: 1fr;
            }

            .search-input-group {
                flex-direction: column;
            }

            .install-prompt {
                left: 10px;
                right: 10px;
                max-width: none;
                bottom: 80px;
            }
        }

        /* Quick Actions */
        .quick-actions {
            position: fixed;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            display: flex;
            flex-direction: column;
            gap: 1rem;
            z-index: 999;
        }

        .quick-action-btn {
            background: var(--bera-red);
            color: white;
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(229, 9, 20, 0.4);
        }

        /* Download Modal */
        .download-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 3000;
            display: none;
            justify-content: center;
            align-items: center;
        }

        .download-content {
            background: var(--bera-dark);
            border-radius: 15px;
            padding: 3rem;
            max-width: 500px;
            width: 90%;
            border: 2px solid var(--bera-gold);
            text-align: center;
        }

        .quality-options {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin: 2rem 0;
        }

        .quality-option {
            background: rgba(255,255,255,0.1);
            padding: 1.2rem;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .quality-option:hover {
            background: var(--bera-gold);
            color: #000;
        }
    </style>
</head>
<body>
    <!-- Install Prompt -->
    <div id="installPrompt" class="install-prompt">
        <div class="install-prompt-content">
            <div class="install-icon">
                <i class="fas fa-download"></i>
            </div>
            <div class="install-text">
                <h3>Install Beraflix</h3>
                <p>Get the ultimate entertainment experience</p>
            </div>
        </div>
        <div class="install-buttons">
            <button class="install-btn" id="installBtn">Install</button>
            <button class="install-btn cancel-install" id="cancelInstall">Later</button>
        </div>
    </div>

    <!-- Mobile Navigation -->
    <nav class="mobile-nav">
        <div class="mobile-nav-items">
            <a href="#" class="mobile-nav-item active" data-tab="movies">
                <i class="fas fa-film"></i>
                <span>Movies</span>
            </a>
            <a href="#" class="mobile-nav-item" data-tab="youtube">
                <i class="fab fa-youtube"></i>
                <span>YouTube</span>
            </a>
            <a href="#" class="mobile-nav-item" data-tab="music">
                <i class="fas fa-music"></i>
                <span>Music</span>
            </a>
            <a href="#" class="mobile-nav-item" data-tab="torrents">
                <i class="fas fa-download"></i>
                <span>Torrents</span>
            </a>
        </div>
    </nav>

    <!-- Quick Actions -->
    <div class="quick-actions">
        <button class="quick-action-btn" id="quickSearch" title="Search">
            <i class="fas fa-search"></i>
        </button>
        <button class="quick-action-btn" id="quickDownload" title="Downloads">
            <i class="fas fa-download"></i>
        </button>
        <button class="quick-action-btn" id="quickInstall" title="Install">
            <i class="fas fa-download"></i>
        </button>
    </div>

    <!-- Navigation -->
    <nav class="navbar">
        <a href="#" class="nav-logo">BERAFLIX</a>
        <ul class="nav-tabs">
            <li><a class="nav-tab active" data-tab="movies">Movies</a></li>
            <li><a class="nav-tab" data-tab="youtube">YouTube</a></li>
            <li><a class="nav-tab" data-tab="music">Music</a></li>
            <li><a class="nav-tab" data-tab="torrents">Torrents</a></li>
            <li><a class="nav-tab" data-tab="downloads">Downloads</a></li>
        </ul>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
        <!-- Hero Section -->
        <section class="hero-section">
            <h1 class="hero-title">BERAFLIX ULTIMATE</h1>
            <p class="hero-subtitle">Movies, YouTube Downloads, Music & More - All in One Place</p>
        </section>

        <!-- Movies Section -->
        <section id="moviesSection" class="section active">
            <h2 class="section-title">🎬 Movies & TV Shows</h2>
            
            <div class="search-container">
                <h3>Search Movies</h3>
                <div class="search-input-group">
                    <input type="text" class="search-input" id="movieSearchInput" placeholder="Search for movies...">
                    <button class="search-btn" id="movieSearchBtn">
                        <i class="fas fa-search"></i> Search
                    </button>
                </div>
                <div class="content-grid" id="moviesResults">
                    <!-- Movies will be loaded here -->
                </div>
            </div>

            <div class="row">
                <h3>Trending Movies</h3>
                <div class="content-grid" id="trendingMovies">
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        Loading trending movies...
                    </div>
                </div>
            </div>
        </section>

        <!-- YouTube Section -->
        <section id="youtubeSection" class="section">
            <h2 class="section-title">
                <i class="fab fa-youtube"></i> YouTube Tools
                <span class="section-badge youtube-badge">Downloader</span>
            </h2>

            <div class="search-container">
                <h3>YouTube Search</h3>
                <div class="search-input-group">
                    <input type="text" class="search-input" id="youtubeSearchInput" placeholder="Search YouTube...">
                    <button class="search-btn" id="youtubeSearchBtn">
                        <i class="fab fa-youtube"></i> Search YouTube
                    </button>
                </div>
                <div class="content-grid" id="youtubeResults">
                    <!-- YouTube results will be loaded here -->
                </div>
            </div>

            <div class="search-container">
                <h3>YouTube Downloader</h3>
                <div class="search-input-group">
                    <input type="text" class="search-input" id="youtubeUrlInput" placeholder="Paste YouTube URL here...">
                    <button class="search-btn" id="youtubeDownloadBtn">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
                <div id="youtubeDownloadOptions">
                    <!-- Download options will appear here -->
                </div>
            </div>
        </section>

        <!-- Music Section -->
        <section id="musicSection" class="section">
            <h2 class="section-title">
                <i class="fas fa-music"></i> Music Search
                <span class="section-badge spotify-badge">Spotify</span>
            </h2>

            <div class="search-container">
                <h3>Search Music</h3>
                <div class="search-input-group">
                    <input type="text" class="search-input" id="musicSearchInput" placeholder="Search for songs, artists...">
                    <button class="search-btn" id="musicSearchBtn">
                        <i class="fas fa-search"></i> Search Music
                    </button>
                </div>
                <div class="content-grid" id="musicResults">
                    <!-- Music results will be loaded here -->
                </div>
            </div>
        </section>

        <!-- Torrents Section -->
        <section id="torrentsSection" class="section">
            <h2 class="section-title">
                <i class="fas fa-download"></i> Torrent Search
                <span class="section-badge torrent-badge">YTS</span>
            </h2>

            <div class="search-container">
                <h3>Search Torrents</h3>
                <div class="search-input-group">
                    <input type="text" class="search-input" id="torrentSearchInput" placeholder="Search for torrents...">
                    <button class="search-btn" id="torrentSearchBtn">
                        <i class="fas fa-search"></i> Search Torrents
                    </button>
                </div>
                <div class="content-grid" id="torrentResults">
                    <!-- Torrent results will be loaded here -->
                </div>
            </div>
        </section>

        <!-- Downloads Section -->
        <section id="downloadsSection" class="section">
            <h2 class="section-title">📥 My Downloads</h2>
            <div class="content-grid" id="downloadsList">
                <!-- Downloads will be listed here -->
            </div>
        </section>
    </main>

    <!-- Download Modal -->
    <div class="download-modal" id="downloadModal">
        <div class="download-content">
            <div class="download-icon">
                <i class="fas fa-download"></i>
            </div>
            <h3 id="downloadModalTitle">Download Options</h3>
            <p id="downloadModalDescription">Select your preferred quality:</p>
            <div class="quality-options" id="downloadQualityOptions">
                <!-- Quality options will be populated here -->
            </div>
            <button class="search-btn" id="closeDownloadModal">Cancel</button>
        </div>
    </div>

    <script>
        // Global State
        let currentTab = 'movies';
        let userDownloads = JSON.parse(localStorage.getItem('beraflix_downloads')) || [];
        let deferredPrompt = null;

        // DOM Elements
        const installPrompt = document.getElementById('installPrompt');
        const installBtn = document.getElementById('installBtn');
        const cancelInstall = document.getElementById('cancelInstall');
        const sections = document.querySelectorAll('.section');
        const navTabs = document.querySelectorAll('.nav-tab');
        const mobileNavItems = document.querySelectorAll('.mobile-nav-item');

        // Initialize App
        document.addEventListener('DOMContentLoaded', function() {
            initializeApp();
            setupEventListeners();
            loadInitialContent();
        });

        function initializeApp() {
            // Check if app is installed
            if (localStorage.getItem('beraflix_installed')) {
                document.querySelectorAll('.install-prompt, .quick-install').forEach(el => {
                    el.style.display = 'none';
                });
            }

            // Register service worker
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => console.log('SW registered'))
                    .catch(error => console.log('SW registration failed'));
            }

            // PWA install prompt
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                installPrompt.style.display = 'block';
            });
        }

        function setupEventListeners() {
            // Tab navigation
            navTabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    e.preventDefault();
                    const tabName = tab.getAttribute('data-tab');
                    switchTab(tabName);
                });
            });

            mobileNavItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const tabName = item.getAttribute('data-tab');
                    switchTab(tabName);
                    
                    // Update mobile nav active state
                    mobileNavItems.forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                });
            });

            // Install prompt
            installBtn.addEventListener('click', installApp);
            cancelInstall.addEventListener('click', () => installPrompt.style.display = 'none');

            // Search functionality
            setupSearchHandlers();
        }

        function switchTab(tabName) {
            currentTab = tabName;
            
            // Update sections
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(tabName + 'Section').classList.add('active');
            
            // Update nav tabs
            navTabs.forEach(tab => tab.classList.remove('active'));
            document.querySelector(`.nav-tab[data-tab="${tabName}"]`).classList.add('active');
            
            // Load content for the tab if needed
            loadTabContent(tabName);
        }

        function setupSearchHandlers() {
            // Movie search
            document.getElementById('movieSearchBtn').addEventListener('click', searchMovies);
            document.getElementById('movieSearchInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') searchMovies();
            });

            // YouTube search
            document.getElementById('youtubeSearchBtn').addEventListener('click', searchYouTube);
            document.getElementById('youtubeSearchInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') searchYouTube();
            });

            // YouTube download
            document.getElementById('youtubeDownloadBtn').addEventListener('click', handleYouTubeDownload);

            // Music search
            document.getElementById('musicSearchBtn').addEventListener('click', searchMusic);
            document.getElementById('musicSearchInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') searchMusic();
            });

            // Torrent search
            document.getElementById('torrentSearchBtn').addEventListener('click', searchTorrents);
            document.getElementById('torrentSearchInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') searchTorrents();
            });
        }

        async function loadInitialContent() {
            await loadTrendingMovies();
            updateDownloadsList();
        }

        function loadTabContent(tabName) {
            switch(tabName) {
                case 'downloads':
                    updateDownloadsList();
                    break;
                case 'movies':
                    if (!document.getElementById('trendingMovies').children.length) {
                        loadTrendingMovies();
                    }
                    break;
            }
        }

        // API Functions
        async function searchMovies() {
            const query = document.getElementById('movieSearchInput').value.trim();
            if (!query) return;

            const resultsContainer = document.getElementById('moviesResults');
            resultsContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Searching movies...</div>';

            try {
                const response = await fetch(`/api/search/movies?query=${encodeURIComponent(query)}`);
                const data = await response.json();
                
                if (data.success && data.results.length > 0) {
                    displayMovies(data.results, resultsContainer);
                } else {
                    resultsContainer.innerHTML = '<div class="loading">No movies found</div>';
                }
            } catch (error) {
                console.error('Movie search error:', error);
                resultsContainer.innerHTML = '<div class="loading">Search failed</div>';
            }
        }

        async function searchYouTube() {
            const query = document.getElementById('youtubeSearchInput').value.trim();
            if (!query) return;

            const resultsContainer = document.getElementById('youtubeResults');
            resultsContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Searching YouTube...</div>';

            try {
                const response = await fetch(`/api/search/youtube?query=${encodeURIComponent(query)}`);
                const data = await response.json();
                
                if (data.success && data.results.length > 0) {
                    displayYouTubeResults(data.results, resultsContainer);
                } else {
                    resultsContainer.innerHTML = '<div class="loading">No videos found</div>';
                }
            } catch (error) {
                console.error('YouTube search error:', error);
                resultsContainer.innerHTML = '<div class="loading">Search failed</div>';
            }
        }

        async function handleYouTubeDownload() {
            const url = document.getElementById('youtubeUrlInput').value.trim();
            if (!url) return alert('Please enter a YouTube URL');

            const optionsContainer = document.getElementById('youtubeDownloadOptions');
            optionsContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Getting download options...</div>';

            try {
                const response = await fetch(`/api/download/youtube?url=${encodeURIComponent(url)}`);
                const data = await response.json();
                
                if (data.success) {
                    displayYouTubeDownloadOptions(data);
                } else {
                    optionsContainer.innerHTML = '<div class="loading">Download failed</div>';
                }
            } catch (error) {
                console.error('YouTube download error:', error);
                optionsContainer.innerHTML = '<div class="loading">Download failed</div>';
            }
        }

        async function searchMusic() {
            const query = document.getElementById('musicSearchInput').value.trim();
            if (!query) return;

            const resultsContainer = document.getElementById('musicResults');
            resultsContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Searching music...</div>';

            try {
                const response = await fetch(`/api/search/music?query=${encodeURIComponent(query)}`);
                const data = await response.json();
                
                if (data.success && data.results.length > 0) {
                    displayMusicResults(data.results, resultsContainer);
                } else {
                    resultsContainer.innerHTML = '<div class="loading">No music found</div>';
                }
            } catch (error) {
                console.error('Music search error:', error);
                resultsContainer.innerHTML = '<div class="loading">Search failed</div>';
            }
        }

        async function searchTorrents() {
            const query = document.getElementById('torrentSearchInput').value.trim();
            if (!query) return;

            const resultsContainer = document.getElementById('torrentResults');
            resultsContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Searching torrents...</div>';

            try {
                const response = await fetch(`/api/search/torrents?query=${encodeURIComponent(query)}`);
                const data = await response.json();
                
                if (data.success && data.results.length > 0) {
                    displayTorrentResults(data.results, resultsContainer);
                } else {
                    resultsContainer.innerHTML = '<div class="loading">No torrents found</div>';
                }
            } catch (error) {
                console.error('Torrent search error:', error);
                resultsContainer.innerHTML = '<div class="loading">Search failed</div>';
            }
        }

        async function loadTrendingMovies() {
            const container = document.getElementById('trendingMovies');
            
            try {
                const response = await fetch('/api/trending/movies');
                const data = await response.json();
                
                if (data.success && data.results.length > 0) {
                    displayMovies(data.results, container);
                }
            } catch (error) {
                console.error('Error loading trending movies:', error);
            }
        }

        // Display Functions
        function displayMovies(movies, container) {
            container.innerHTML = movies.map(movie => `
                <div class="content-card">
                    <img src="${movie.cover?.url || ''}" alt="${movie.title}" class="card-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTA5MTE0Ii8+PC9zdmc+'">
                    <div class="card-content">
                        <h3 class="card-title">${movie.title || 'Unknown Title'}</h3>
                        <p class="card-description">${movie.description || 'No description available'}</p>
                        <div class="card-actions">
                            <button class="action-btn watch-btn" onclick="playMovie('${movie.subjectId}')">
                                <i class="fas fa-play"></i> Watch
                            </button>
                            <button class="action-btn download-btn" onclick="showDownloadModal('${movie.subjectId}', '${movie.title}')">
                                <i class="fas fa-download"></i> Download
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function displayYouTubeResults(videos, container) {
            container.innerHTML = videos.map(video => `
                <div class="content-card">
                    <img src="${video.thumbnail}" alt="${video.title}" class="card-image">
                    <div class="card-content">
                        <h3 class="card-title">${video.title}</h3>
                        <div class="card-actions">
                            <button class="action-btn watch-btn" onclick="playYouTubeVideo('${video.videoId}')">
                                <i class="fas fa-play"></i> Watch
                            </button>
                            <button class="action-btn download-btn" onclick="downloadYouTubeVideo('${video.videoId}', '${video.title}')">
                                <i class="fas fa-download"></i> Download
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function displayMusicResults(tracks, container) {
            container.innerHTML = tracks.map(track => `
                <div class="content-card">
                    <img src="${track.thumbnail}" alt="${track.title}" class="card-image">
                    <div class="card-content">
                        <h3 class="card-title">${track.title}</h3>
                        <p class="card-description">${track.artist || 'Unknown Artist'}</p>
                        <div class="card-actions">
                            <button class="action-btn music-btn" onclick="playMusic('${track.id}')">
                                <i class="fas fa-play"></i> Play
                            </button>
                            <button class="action-btn download-btn" onclick="downloadMusic('${track.id}', '${track.title}')">
                                <i class="fas fa-download"></i> Download
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function displayTorrentResults(torrents, container) {
            container.innerHTML = torrents.map(torrent => `
                <div class="content-card">
                    <div class="card-content">
                        <h3 class="card-title">${torrent.title}</h3>
                        <p class="card-description">Size: ${torrent.size} | Seeds: ${torrent.seeds}</p>
                        <div class="card-actions">
                            <button class="action-btn torrent-btn" onclick="downloadTorrent('${torrent.magnet}')">
                                <i class="fas fa-magnet"></i> Magnet
                            </button>
                            <button class="action-btn download-btn" onclick="downloadTorrentFile('${torrent.url}')">
                                <i class="fas fa-download"></i> Torrent
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function displayYouTubeDownloadOptions(data) {
            const container = document.getElementById('youtubeDownloadOptions');
            container.innerHTML = `
                <div class="content-card">
                    <div class="card-content">
                        <h3 class="card-title">${data.title}</h3>
                        <div class="card-actions">
                            <button class="action-btn download-btn" onclick="downloadFile('${data.mp3_url}', '${data.title}.mp3')">
                                <i class="fas fa-music"></i> Download MP3
                            </button>
                            <button class="action-btn download-btn" onclick="downloadFile('${data.mp4_url}', '${data.title}.mp4')">
                                <i class="fas fa-video"></i> Download MP4
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        function updateDownloadsList() {
            const container = document.getElementById('downloadsList');
            if (userDownloads.length === 0) {
                container.innerHTML = '<div class="loading">No downloads yet</div>';
                return;
            }

            container.innerHTML = userDownloads.map(download => `
                <div class="content-card">
                    <div class="card-content">
                        <h3 class="card-title">${download.title}</h3>
                        <p class="card-description">Type: ${download.type} | Date: ${new Date(download.timestamp).toLocaleDateString()}</p>
                        <div class="card-actions">
                            <button class="action-btn watch-btn" onclick="openDownload('${download.url}')">
                                <i class="fas fa-play"></i> Open
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Utility Functions
        function downloadFile(url, filename) {
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            
            // Add to downloads history
            userDownloads.unshift({
                title: filename,
                type: filename.endsWith('.mp3') ? 'Audio' : 'Video',
                url: url,
                timestamp: Date.now()
            });
            localStorage.setItem('beraflix_downloads', JSON.stringify(userDownloads));
            updateDownloadsList();
        }

        function openDownload(url) {
            window.open(url, '_blank');
        }

        async function installApp() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    localStorage.setItem('beraflix_installed', 'true');
                    installPrompt.style.display = 'none';
                }
                deferredPrompt = null;
            }
        }

        // Make functions available globally
        window.playMovie = async function(movieId) {
            alert('Playing movie: ' + movieId);
            // Implement movie playback
        };

        window.showDownloadModal = async function(movieId, title) {
            const modal = document.getElementById('downloadModal');
            const titleEl = document.getElementById('downloadModalTitle');
            const optionsEl = document.getElementById('downloadQualityOptions');
            
            titleEl.textContent = `Download "${title}"`;
            optionsEl.innerHTML = `
                <div class="quality-option" onclick="downloadMovieQuality('${movieId}', '480p')">
                    <span>480p - Good Quality</span>
                    <span>~500MB</span>
                </div>
                <div class="quality-option" onclick="downloadMovieQuality('${movieId}', '720p')">
                    <span>720p - HD Quality</span>
                    <span>~1GB</span>
                </div>
                <div class="quality-option" onclick="downloadMovieQuality('${movieId}', '1080p')">
                    <span>1080p - Full HD</span>
                    <span>~2GB</span>
                </div>
            `;
            
            modal.style.display = 'flex';
        };

        window.downloadMovieQuality = async function(movieId, quality) {
            alert(`Downloading movie ${movieId} in ${quality}`);
            document.getElementById('downloadModal').style.display = 'none';
        };

        window.playYouTubeVideo = function(videoId) {
            window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
        };

        window.downloadYouTubeVideo = async function(videoId, title) {
            const url = `https://www.youtube.com/watch?v=${videoId}`;
            const response = await fetch(`/api/download/youtube?url=${encodeURIComponent(url)}`);
            const data = await response.json();
            
            if (data.success) {
                downloadFile(data.mp4_url, `${title}.mp4`);
            }
        };

        window.playMusic = function(trackId) {
            alert('Playing music track: ' + trackId);
        };

        window.downloadMusic = async function(trackId, title) {
            // Implement music download
            alert(`Downloading music: ${title}`);
        };

        window.downloadTorrent = function(magnetUrl) {
            window.open(magnetUrl, '_blank');
        };

        window.downloadTorrentFile = function(torrentUrl) {
            downloadFile(torrentUrl, 'download.torrent');
        };

        // Close download modal
        document.getElementById('closeDownloadModal').addEventListener('click', function() {
            document.getElementById('downloadModal').style.display = 'none';
        });
    </script>
</body>
</html>
  `);
});

// API Routes for All Services

// Movie Search
app.get('/api/search/movies', async (req, res) => {
  try {
    const query = req.query.query;
    const response = await fetch(`${MOVIE_API_BASE}/search/${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (data.status === 200 && data.results?.items?.length > 0) {
      res.json({ 
        success: true, 
        results: data.results.items.slice(0, 20) 
      });
    } else {
      res.json({ 
        success: false, 
        results: [] 
      });
    }
  } catch (error) {
    console.error('Movie search error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search movies' 
    });
  }
});

// Trending Movies
app.get('/api/trending/movies', async (req, res) => {
  try {
    const response = await fetch(`${MOVIE_API_BASE}/search/avengers`);
    const data = await response.json();
    
    if (data.status === 200 && data.results?.items?.length > 0) {
      res.json({ 
        success: true, 
        results: data.results.items.slice(0, 12) 
      });
    } else {
      res.json({ 
        success: false, 
        results: [] 
      });
    }
  } catch (error) {
    console.error('Trending movies error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load trending movies' 
    });
  }
});

// YouTube Search
app.get('/api/search/youtube', async (req, res) => {
  try {
    const query = req.query.query;
    const response = await fetch(`${GIFTED_API_BASE}/youtube-search?apikey=${API_KEY}&q=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (data.results?.length > 0) {
      res.json({ 
        success: true, 
        results: data.results.slice(0, 20) 
      });
    } else {
      res.json({ 
        success: false, 
        results: [] 
      });
    }
  } catch (error) {
    console.error('YouTube search error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search YouTube' 
    });
  }
});

// YouTube Download
app.get('/api/download/youtube', async (req, res) => {
  try {
    const url = req.query.url;
    
    // Get MP3
    const mp3Response = await fetch(`${GIFTED_API_BASE}/download/ytmp3?apikey=${API_KEY}&url=${encodeURIComponent(url)}`);
    const mp3Data = await mp3Response.json();
    
    // Get MP4
    const mp4Response = await fetch(`${GIFTED_API_BASE}/download/ytmp4?apikey=${API_KEY}&url=${encodeURIComponent(url)}`);
    const mp4Data = await mp4Response.json();
    
    if (mp3Data.status && mp4Data.status) {
      res.json({ 
        success: true,
        title: mp3Data.title || 'YouTube Video',
        mp3_url: mp3Data.download_url,
        mp4_url: mp4Data.download_url
      });
    } else {
      res.json({ 
        success: false,
        error: 'Download failed' 
      });
    }
  } catch (error) {
    console.error('YouTube download error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process YouTube download' 
    });
  }
});

// Music Search (Spotify)
app.get('/api/search/music', async (req, res) => {
  try {
    const query = req.query.query;
    const response = await fetch(`${GIFTED_API_BASE}/search/spotifysearch?apikey=${API_KEY}&query=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (data.results?.length > 0) {
      res.json({ 
        success: true, 
        results: data.results.slice(0, 20) 
      });
    } else {
      res.json({ 
        success: false, 
        results: [] 
      });
    }
  } catch (error) {
    console.error('Music search error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search music' 
    });
  }
});

// Torrent Search (YTS)
app.get('/api/search/torrents', async (req, res) => {
  try {
    const query = req.query.query;
    const response = await fetch(`${GIFTED_API_BASE}/search/yts?apikey=${API_KEY}&query=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (data.results?.length > 0) {
      res.json({ 
        success: true, 
        results: data.results.slice(0, 20) 
      });
    } else {
      res.json({ 
        success: false, 
        results: [] 
      });
    }
  } catch (error) {
    console.error('Torrent search error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search torrents' 
    });
  }
});

// Advanced YouTube Download
app.get('/api/download/advanced-youtube', async (req, res) => {
  try {
    const url = req.query.url;
    const response = await fetch(`${GIFTED_API_BASE}/download/ytdlv3?apikey=${API_KEY}&url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    if (data.success) {
      res.json({ 
        success: true,
        data: data 
      });
    } else {
      res.json({ 
        success: false,
        error: 'Advanced download failed' 
      });
    }
  } catch (error) {
    console.error('Advanced YouTube download error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process advanced download' 
    });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Beraflix Ultimate - All-in-One Entertainment',
    features: [
      'Movie Streaming',
      'YouTube Search & Download',
      'Music Search',
      'Torrent Search', 
      'PWA Support',
      'Mobile Optimized'
    ],
    apis: {
      movies: MOVIE_API_BASE,
      gifted: GIFTED_API_BASE
    }
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Beraflix Ultimate Server running on port ${PORT}`);
  console.log(`📍 Visit: http://localhost:${PORT}`);
  console.log(`🎯 Features: Movies • YouTube • Music • Torrents`);
  console.log(`📱 PWA: Installable App • Mobile Friendly`);
  console.log(`🔧 APIs: Movie API • Gifted Tech API`);
});

module.exports = app;
