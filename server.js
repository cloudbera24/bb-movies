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

// Movie API Base URL
const MOVIE_API_BASE = 'https://movieapi.giftedtech.co.ke/api';

// YouTube API Base URL
const YOUTUBE_API_BASE = 'https://api.giftedtech.co.ke/api';

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'beraflix_super_secret_key_2024';

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Enhanced PWA Manifest
app.get('/manifest.json', (req, res) => {
  res.json({
    "name": "Beraflix - Stream & Download Movies",
    "short_name": "Beraflix",
    "description": "Stream and download HD movies, TV shows from Hollywood, Nollywood, Anime and more",
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
    "categories": ["entertainment", "movies", "video"],
    "lang": "en",
    "scope": "/",
    "prefer_related_applications": false
  });
});

// Enhanced Service Worker
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    const CACHE_NAME = 'beraflix-v3';
    const urlsToCache = [
      '/',
      '/manifest.json',
      '/api/search/popular',
      '/api/search/trending'
    ];

    self.addEventListener('install', (event) => {
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then((cache) => {
            return cache.addAll(urlsToCache);
          })
      );
    });

    self.addEventListener('fetch', (event) => {
      if (event.request.url.includes('/api/')) {
        // Network first for API calls
        event.respondWith(
          fetch(event.request)
            .then((response) => {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
              return response;
            })
            .catch(() => {
              return caches.match(event.request);
            })
        );
      } else {
        // Cache first for static assets
        event.respondWith(
          caches.match(event.request)
            .then((response) => {
              if (response) {
                return response;
              }
              return fetch(event.request)
                .then((response) => {
                  if(!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                  }
                  const responseToCache = response.clone();
                  caches.open(CACHE_NAME)
                    .then((cache) => {
                      cache.put(event.request, responseToCache);
                    });
                  return response;
                });
            })
        );
      }
    });

    self.addEventListener('activate', (event) => {
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName !== CACHE_NAME) {
                return caches.delete(cacheName);
              }
            })
          );
        })
      );
    });

    self.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
      }
    });
  `);
});

// Serve main HTML with enhanced mobile features
app.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Beraflix - Stream & Download HD Movies</title>
    <meta name="description" content="Stream and download HD movies, TV shows from Hollywood, Nollywood, Anime, Romance and more. Watch anywhere. Download offline.">
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

        .hidden {
            display: none !important;
        }

        /* Mobile Bottom Navigation */
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

        .mobile-nav-item i {
            font-size: 1.2rem;
            margin-bottom: 0.3rem;
        }

        .mobile-nav-item.active {
            color: var(--bera-red);
        }

        /* Enhanced Mobile Navigation */
        .navbar {
            position: fixed;
            top: 0;
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 4%;
            z-index: 1000;
            transition: all 0.4s ease;
            background: linear-gradient(180deg, rgba(10,10,10,0.95) 0%, transparent 100%);
            backdrop-filter: blur(10px);
        }

        .navbar.scrolled {
            background: rgba(10,10,10,0.98);
            box-shadow: 0 5px 30px rgba(0,0,0,0.5);
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
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .nav-logo::before {
            content: "🎬";
            font-size: 1.5rem;
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
            background: rgba(255,255,255,0.1);
            border: 2px solid transparent;
            color: var(--bera-white);
            padding: 0.8rem 1.5rem;
            border-radius: 30px;
            width: 300px;
            font-size: 1rem;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }

        /* Premium Badge */
        .premium-badge {
            background: var(--bera-premium);
            color: #000;
            padding: 0.3rem 1rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            animation: glow 2s infinite;
        }

        @keyframes glow {
            0%, 100% { box-shadow: 0 0 10px gold; }
            50% { box-shadow: 0 0 20px gold; }
        }

        /* Hero Banner */
        .hero-banner {
            position: relative;
            height: 90vh;
            background: linear-gradient(77deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.4) 60%, transparent 100%);
            display: flex;
            align-items: center;
            padding: 0 4%;
            margin-bottom: 4rem;
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
            filter: brightness(0.5) contrast(1.1);
        }

        .hero-gradient {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                77deg,
                rgba(10,10,10,0.95) 0%,
                rgba(10,10,10,0.8) 30%,
                rgba(10,10,10,0.5) 60%,
                transparent 100%
            );
            z-index: -1;
        }

        .hero-content {
            max-width: 45%;
            z-index: 2;
            margin-top: 5rem;
        }

        .hero-badge {
            background: var(--bera-premium);
            color: #000;
            padding: 0.5rem 1.5rem;
            border-radius: 25px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            display: inline-block;
            margin-bottom: 1.5rem;
            animation: glow 2s infinite;
            font-size: 0.9rem;
        }

        .hero-title {
            font-size: 4.5rem;
            font-weight: 900;
            margin-bottom: 1.5rem;
            text-shadow: 3px 3px 15px rgba(0,0,0,0.8);
            line-height: 1.1;
            font-family: 'Bebas Neue', cursive;
            letter-spacing: 2px;
            background: linear-gradient(45deg, #fff, #ffd700, #fff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-size: 200% 200%;
            animation: shimmer 3s ease-in-out infinite;
        }

        @keyframes shimmer {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }

        .hero-description {
            font-size: 1.4rem;
            line-height: 1.6;
            margin-bottom: 2rem;
            color: var(--bera-white);
            text-shadow: 1px 1px 5px rgba(0,0,0,0.6);
            font-weight: 400;
        }

        .hero-meta {
            display: flex;
            gap: 2rem;
            margin-bottom: 2.5rem;
            font-size: 1.1rem;
            color: var(--bera-white);
        }

        .hero-meta span {
            display: flex;
            align-items: center;
            gap: 0.8rem;
            background: rgba(255,255,255,0.1);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }

        .hero-buttons {
            display: flex;
            gap: 1.5rem;
        }

        .play-btn, .info-btn, .download-hero-btn {
            padding: 1rem 2.5rem;
            border: none;
            border-radius: 8px;
            font-size: 1.3rem;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 1rem;
            transition: all 0.4s ease;
            font-family: 'Montserrat', sans-serif;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .play-btn {
            background: var(--bera-red);
            color: var(--bera-white);
            box-shadow: 0 4px 20px rgba(229, 9, 20, 0.4);
        }

        .play-btn:hover {
            background: var(--bera-dark-red);
            transform: translateY(-3px) scale(1.05);
            box-shadow: 0 8px 30px rgba(229, 9, 20, 0.6);
        }

        .info-btn {
            background: rgba(255,255,255,0.15);
            color: var(--bera-white);
            border: 2px solid rgba(255,255,255,0.3);
            backdrop-filter: blur(10px);
        }

        .info-btn:hover {
            background: rgba(255,255,255,0.25);
            transform: translateY(-3px);
            border-color: var(--bera-white);
        }

        .download-hero-btn {
            background: var(--bera-gold);
            color: #000;
            font-weight: 800;
        }

        .download-hero-btn:hover {
            background: #ffed4e;
            transform: translateY(-3px) scale(1.05);
            box-shadow: 0 8px 30px rgba(255, 215, 0, 0.6);
        }

        /* Content Rows */
        .content-rows {
            padding: 0 4% 5rem;
        }

        .row {
            margin-bottom: 5rem;
        }

        .row-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }

        .row-title {
            font-size: 2.2rem;
            font-weight: 800;
            color: var(--bera-white);
            font-family: 'Bebas Neue', cursive;
            letter-spacing: 2px;
            position: relative;
        }

        .row-title::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 0;
            width: 80px;
            height: 4px;
            background: var(--bera-gradient);
            border-radius: 2px;
        }

        .row-content {
            position: relative;
        }

        .movies-container {
            display: flex;
            gap: 1rem;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            padding: 1.5rem 0;
            scroll-behavior: smooth;
        }

        .movies-container::-webkit-scrollbar {
            display: none;
        }

        /* Movie Cards */
        .movie-card {
            flex: 0 0 auto;
            width: 350px;
            border-radius: 12px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.5s ease;
            position: relative;
            background: var(--bera-dark);
            border: 1px solid rgba(255,255,255,0.1);
        }

        .movie-card:hover {
            transform: scale(1.1) translateY(-10px);
            z-index: 10;
            box-shadow: 0 20px 50px rgba(229, 9, 20, 0.4);
            border-color: var(--bera-red);
        }

        .movie-poster {
            width: 100%;
            height: 200px;
            object-fit: cover;
            transition: transform 0.5s ease;
        }

        .movie-card:hover .movie-poster {
            transform: scale(1.15);
        }

        .movie-info {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(10,10,10,0.98));
            padding: 2rem;
            opacity: 0;
            transition: all 0.4s ease;
            transform: translateY(20px);
        }

        .movie-card:hover .movie-info {
            opacity: 1;
            transform: translateY(0);
        }

        .movie-title {
            font-size: 1.4rem;
            font-weight: 700;
            margin-bottom: 0.8rem;
            color: var(--bera-white);
            line-height: 1.2;
        }

        .movie-meta {
            display: flex;
            gap: 1.5rem;
            font-size: 0.9rem;
            color: var(--bera-light);
            margin-bottom: 1rem;
            flex-wrap: wrap;
        }

        .movie-description {
            font-size: 0.95rem;
            line-height: 1.5;
            color: var(--bera-white);
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            margin-bottom: 1.5rem;
        }

        .movie-actions {
            display: flex;
            gap: 1rem;
        }

        .movie-action-btn {
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

        .movie-rating {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: rgba(10,10,10,0.9);
            color: var(--bera-gold);
            padding: 0.4rem 0.8rem;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 700;
            border: 1px solid var(--bera-gold);
        }

        /* YouTube Download Section */
        .youtube-section {
            background: rgba(20,20,20,0.8);
            border-radius: 15px;
            padding: 2rem;
            margin: 2rem 0;
            border: 1px solid rgba(255,0,0,0.3);
        }

        .youtube-input-container {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .youtube-input {
            flex: 1;
            background: rgba(255,255,255,0.1);
            border: 2px solid rgba(255,0,0,0.3);
            color: var(--bera-white);
            padding: 1rem;
            border-radius: 8px;
            font-size: 1rem;
        }

        .youtube-search-btn {
            background: var(--bera-red);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
        }

        .youtube-search-btn:hover {
            background: var(--bera-dark-red);
            transform: translateY(-2px);
        }

        .youtube-results {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 1.5rem;
        }

        .youtube-result {
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            padding: 1.5rem;
            border: 1px solid rgba(255,0,0,0.2);
            transition: all 0.3s;
        }

        .youtube-result:hover {
            background: rgba(255,255,255,0.1);
            border-color: var(--bera-red);
            transform: translateY(-5px);
        }

        .youtube-thumbnail {
            width: 100%;
            height: 180px;
            object-fit: cover;
            border-radius: 8px;
            margin-bottom: 1rem;
        }

        .youtube-title {
            font-weight: 700;
            color: var(--bera-white);
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
        }

        .youtube-channel {
            color: var(--bera-light);
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }

        .youtube-actions {
            display: flex;
            gap: 1rem;
        }

        .youtube-download-btn {
            background: var(--bera-red);
            color: white;
            border: none;
            padding: 0.8rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }

        .youtube-download-btn:hover {
            background: var(--bera-dark-red);
            transform: translateY(-2px);
        }

        .youtube-mp3-btn {
            background: var(--bera-gold);
            color: #000;
        }

        .youtube-mp3-btn:hover {
            background: #ffed4e;
        }

        /* Mobile Optimizations */
        @media (max-width: 768px) {
            .navbar {
                padding: 1rem;
            }

            .nav-links {
                display: none;
            }

            .search-input {
                display: none;
            }

            .mobile-search-btn {
                display: block;
            }

            .user-section .install-app-btn,
            .user-section .downloads-btn {
                display: none;
            }

            .mobile-nav {
                display: block;
            }

            .nav-logo {
                font-size: 1.8rem;
            }

            .hero-content {
                max-width: 90%;
                text-align: center;
            }

            .hero-title {
                font-size: 2.5rem;
            }

            .hero-description {
                font-size: 1.1rem;
            }

            .hero-meta {
                flex-wrap: wrap;
                justify-content: center;
                gap: 1rem;
            }

            .hero-buttons {
                flex-direction: column;
                gap: 1rem;
            }

            .play-btn, .info-btn, .download-hero-btn {
                padding: 1rem 1.5rem;
                font-size: 1.1rem;
            }

            .movie-card {
                width: 280px;
            }

            .content-rows {
                padding-bottom: 80px;
            }

            .scroll-btn {
                padding: 1rem 0.5rem;
                font-size: 1.2rem;
            }
        }

        @media (max-width: 480px) {
            .hero-title {
                font-size: 2rem;
            }

            .movie-card {
                width: 240px;
            }

            .row-title {
                font-size: 1.5rem;
            }

            .youtube-input-container {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <!-- Mobile Bottom Navigation -->
    <nav class="mobile-nav">
        <div class="mobile-nav-items">
            <a href="#" class="mobile-nav-item active">
                <i class="fas fa-home"></i>
                <span>Home</span>
            </a>
            <a href="#" class="mobile-nav-item" id="mobileSearchBtn">
                <i class="fas fa-search"></i>
                <span>Search</span>
            </a>
            <a href="#" class="mobile-nav-item" id="mobileDownloadsBtn">
                <i class="fas fa-download"></i>
                <span>Downloads</span>
            </a>
            <a href="#" class="mobile-nav-item" id="mobileInstallBtn">
                <i class="fas fa-plus"></i>
                <span>Install</span>
            </a>
        </div>
    </nav>

    <!-- Splash Screen -->
    <div id="splashScreen" class="splash-screen">
        <div class="splash-logo">BERAFLIX</div>
        <div class="splash-tagline">PREMIUM STREAMING EXPERIENCE</div>
    </div>

    <!-- Main App -->
    <div id="app" class="hidden">
        <!-- Enhanced Beraflix Navigation -->
        <nav class="navbar" id="navbar">
            <div class="nav-left">
                <a href="#" class="nav-logo">BERAFLIX</a>
            </div>
            <div class="nav-search">
                <div class="search-container">
                    <input type="text" class="search-input" id="searchInput" placeholder="Search movies and TV shows...">
                    <button class="search-btn" id="searchBtn">
                        <i class="fas fa-search"></i> Search
                    </button>
                </div>
                <div class="user-section">
                    <button class="downloads-btn" id="downloadsBtn">
                        <i class="fas fa-download"></i> My Downloads
                    </button>
                </div>
            </div>
        </nav>

        <!-- Enhanced Hero Banner -->
        <section class="hero-banner" id="heroBanner">
            <img class="hero-background" id="heroBackground" alt="Hero Background">
            <div class="hero-gradient"></div>
            <div class="hero-content">
                <div class="hero-badge">🔥 TRENDING NOW</div>
                <h1 class="hero-title" id="heroTitle">Welcome to Beraflix</h1>
                <p class="hero-description" id="heroDescription">Unlimited HD movies, TV shows, and exclusive content. Watch anywhere. Download offline.</p>
                <div class="hero-meta" id="heroMeta">
                    <span><i class="fas fa-star"></i> <span id="heroRating">8.5/10</span></span>
                    <span><i class="fas fa-clock"></i> <span id="heroYear">2024</span></span>
                    <span><i class="fas fa-film"></i> <span id="heroGenre">Action</span></span>
                    <span class="premium-badge">4K Available</span>
                </div>
                <div class="hero-buttons">
                    <button class="play-btn" id="heroPlayBtn">
                        <i class="fas fa-play"></i> Watch Now
                    </button>
                    <button class="info-btn" id="heroInfoBtn">
                        <i class="fas fa-info-circle"></i> More Info
                    </button>
                    <button class="download-hero-btn" id="heroDownloadBtn">
                        <i class="fas fa-download"></i> Download HD
                    </button>
                </div>
            </div>
        </section>

        <!-- YouTube Download Section -->
        <section class="youtube-section" id="youtubeSection">
            <div class="row-header">
                <h2 class="row-title">🎬 YouTube Downloader</h2>
                <span class="premium-badge" style="background: var(--bera-red);">Free</span>
            </div>
            <div class="youtube-input-container">
                <input type="text" class="youtube-input" id="youtubeUrlInput" placeholder="Enter YouTube URL or search term...">
                <button class="youtube-search-btn" id="youtubeSearchBtn">
                    <i class="fas fa-search"></i> Search & Download
                </button>
            </div>
            <div class="youtube-results" id="youtubeResults">
                <!-- YouTube results will appear here -->
            </div>
        </section>

        <!-- Main Content Rows -->
        <main class="content-rows">
            <!-- Trending Now -->
            <section class="row" id="trendingRow">
                <div class="row-header">
                    <h2 class="row-title">🔥 Trending Now</h2>
                    <span class="premium-badge">Hot</span>
                </div>
                <div class="row-content">
                    <div class="movies-container" id="trendingContainer">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            Loading trending content...
                        </div>
                    </div>
                </div>
            </section>

            <!-- Popular Movies -->
            <section class="row" id="popularRow">
                <div class="row-header">
                    <h2 class="row-title">🎬 Popular on Beraflix</h2>
                    <span class="premium-badge">HD</span>
                </div>
                <div class="row-content">
                    <div class="movies-container" id="popularContainer">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            Loading popular movies...
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
    </div>

    <script>
        // Global State
        let currentMovies = [];
        let trendingMovies = [];
        let popularMovies = [];
        let currentHeroMovie = null;
        let userDownloads = JSON.parse(localStorage.getItem('beraflix_downloads')) || [];

        // DOM Elements
        const splashScreen = document.getElementById('splashScreen');
        const app = document.getElementById('app');
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const downloadsBtn = document.getElementById('downloadsBtn');
        const heroBanner = document.getElementById('heroBanner');
        const heroBackground = document.getElementById('heroBackground');
        const heroTitle = document.getElementById('heroTitle');
        const heroDescription = document.getElementById('heroDescription');
        const heroRating = document.getElementById('heroRating');
        const heroYear = document.getElementById('heroYear');
        const heroGenre = document.getElementById('heroGenre');
        const heroPlayBtn = document.getElementById('heroPlayBtn');
        const heroInfoBtn = document.getElementById('heroInfoBtn');
        const heroDownloadBtn = document.getElementById('heroDownloadBtn');
        const trendingContainer = document.getElementById('trendingContainer');
        const popularContainer = document.getElementById('popularContainer');
        const searchResultsRow = document.getElementById('searchResultsRow');
        const searchResultsContainer = document.getElementById('searchResultsContainer');
        
        // YouTube DOM Elements
        const youtubeUrlInput = document.getElementById('youtubeUrlInput');
        const youtubeSearchBtn = document.getElementById('youtubeSearchBtn');
        const youtubeResults = document.getElementById('youtubeResults');

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
            // Search functionality
            searchBtn.addEventListener('click', handleSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSearch();
            });

            // YouTube functionality
            youtubeSearchBtn.addEventListener('click', handleYouTubeSearch);
            youtubeUrlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleYouTubeSearch();
            });

            // Hero buttons
            heroPlayBtn.addEventListener('click', () => {
                if (currentHeroMovie) {
                    playMovie(currentHeroMovie.subjectId);
                }
            });

            heroDownloadBtn.addEventListener('click', () => {
                if (currentHeroMovie) {
                    showDownloadModal(currentHeroMovie);
                }
            });
        }

        // Load all content
        async function loadAllContent() {
            await loadTrendingMovies();
            await loadPopularMovies();
        }

        // Load trending movies
        async function loadTrendingMovies() {
            try {
                trendingContainer.innerHTML = '<div class="loading">Loading trending content...</div>';
                
                const response = await fetch('/api/search/avengers');
                const data = await response.json();
                
                if (data.success && data.results && data.results.items.length > 0) {
                    trendingMovies = data.results.items.slice(0, 12);
                    displayMovies(trendingMovies, trendingContainer);
                    
                    if (!currentHeroMovie) {
                        currentHeroMovie = trendingMovies[0];
                        setHeroMovie(currentHeroMovie);
                    }
                } else {
                    trendingContainer.innerHTML = '<div class="error-message">No trending movies found.</div>';
                }
            } catch (error) {
                console.error('Error loading trending movies:', error);
                trendingContainer.innerHTML = '<div class="error-message">Error loading trending movies.</div>';
            }
        }

        // Load popular movies
        async function loadPopularMovies() {
            try {
                popularContainer.innerHTML = '<div class="loading">Loading popular movies...</div>';
                
                const response = await fetch('/api/search/popular');
                const data = await response.json();
                
                if (data.success && data.results && data.results.items.length > 0) {
                    popularMovies = data.results.items.slice(0, 12);
                    displayMovies(popularMovies, popularContainer);
                } else {
                    popularContainer.innerHTML = '<div class="error-message">No popular movies found.</div>';
                }
            } catch (error) {
                console.error('Error loading popular movies:', error);
                popularContainer.innerHTML = '<div class="error-message">Error loading popular movies.</div>';
            }
        }

        // YouTube Search Handler
        async function handleYouTubeSearch() {
            try {
                const input = youtubeUrlInput.value.trim();
                if (!input) {
                    alert('Please enter a YouTube URL or search term');
                    return;
                }

                youtubeResults.innerHTML = '<div class="loading">Searching YouTube...</div>';

                let searchResults;
                
                // Check if input is a URL
                if (input.includes('youtube.com') || input.includes('youtu.be')) {
                    // It's a URL, we'll just show download options
                    const videoId = extractYouTubeId(input);
                    if (videoId) {
                        searchResults = [{
                            id: videoId,
                            title: 'YouTube Video',
                            channel: 'YouTube',
                            thumbnail: 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg'
                        }];
                    } else {
                        throw new Error('Invalid YouTube URL');
                    }
                } else {
                    // It's a search query
                    const response = await fetch('/api/youtube/search?query=' + encodeURIComponent(input));
                    const data = await response.json();
                    
                    if (data.success && data.results && data.results.length > 0) {
                        searchResults = data.results;
                    } else {
                        throw new Error('No YouTube results found');
                    }
                }

                displayYouTubeResults(searchResults);
            } catch (error) {
                console.error('YouTube search error:', error);
                youtubeResults.innerHTML = '<div class="error-message">Error searching YouTube: ' + error.message + '</div>';
            }
        }

        function extractYouTubeId(url) {
            const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
            const match = url.match(regExp);
            return (match && match[7].length === 11) ? match[7] : false;
        }

        function displayYouTubeResults(results) {
            youtubeResults.innerHTML = results.map(video => 
                '<div class="youtube-result">' +
                    '<img src="' + video.thumbnail + '" alt="' + video.title + '" class="youtube-thumbnail">' +
                    '<div class="youtube-title">' + video.title + '</div>' +
                    '<div class="youtube-channel">' + video.channel + '</div>' +
                    '<div class="youtube-actions">' +
                        '<button class="youtube-download-btn" onclick="downloadYouTubeVideo(\\'' + video.id + '\\', \\'' + video.title + '\\', \\'mp4\\')">' +
                            '<i class="fas fa-download"></i> MP4' +
                        '</button>' +
                        '<button class="youtube-download-btn youtube-mp3-btn" onclick="downloadYouTubeVideo(\\'' + video.id + '\\', \\'' + video.title + '\\', \\'mp3\\')">' +
                            '<i class="fas fa-music"></i> MP3' +
                        '</button>' +
                    '</div>' +
                '</div>'
            ).join('');
        }

        async function downloadYouTubeVideo(videoId, title, format) {
            try {
                // Construct download URL based on format
                const baseUrl = format === 'mp3' ? 
                    'https://api.giftedtech.co.ke/api/download/ytmp3?apikey=gifted&url=' :
                    'https://api.giftedtech.co.ke/api/download/ytmp4?apikey=gifted&url=';
                
                const youtubeUrl = 'https://www.youtube.com/watch?v=' + videoId;
                const downloadUrl = baseUrl + encodeURIComponent(youtubeUrl);

                // Create download link
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = 'Beraflix_' + title.replace(/[^a-z0-9]/gi, '_') + '.' + format;
                link.style.display = 'none';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Add to downloads history
                const download = {
                    movieId: videoId,
                    title: title,
                    quality: format.toUpperCase(),
                    url: downloadUrl,
                    size: 'Unknown',
                    timestamp: Date.now()
                };
                
                userDownloads.unshift(download);
                userDownloads = userDownloads.slice(0, 20);
                localStorage.setItem('beraflix_downloads', JSON.stringify(userDownloads));

                alert('Download started for: ' + title);
                
            } catch (error) {
                console.error('YouTube download error:', error);
                alert('Download failed: ' + error.message);
            }
        }

        // Search movies
        async function searchMovies(query) {
            try {
                searchResultsContainer.innerHTML = '<div class="loading">Searching for "' + query + '"...</div>';
                searchResultsRow.style.display = 'block';
                
                // Hide all category rows when searching
                document.querySelectorAll('.row').forEach(row => {
                    if (!row.id.includes('Results')) {
                        row.style.display = 'none';
                    }
                });
                
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

        // Display movies
        function displayMovies(movies, container) {
            if (!movies || movies.length === 0) {
                container.innerHTML = '<div class="error-message">No movies to display</div>';
                return;
            }

            container.innerHTML = movies.map(movie => {
                const poster = movie.cover && movie.cover.url ? 
                    '<img src="' + movie.cover.url + '" alt="' + movie.title + '" class="movie-poster">' :
                    '<div style="background: var(--bera-gradient); height: 200px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.2rem;">BERAFLIX</div>';
                
                const rating = movie.imdbRatingValue ? '<div class="movie-rating">⭐ ' + movie.imdbRatingValue + '</div>' : '';
                
                return '<div class="movie-card">' +
                    poster +
                    rating +
                    '<div class="movie-info">' +
                        '<div class="movie-title">' + (movie.title || 'Unknown Title') + '</div>' +
                        '<div class="movie-meta">' +
                            (movie.releaseDate ? '<span>' + movie.releaseDate.split('-')[0] + '</span>' : '') +
                            (movie.genre ? '<span>' + movie.genre.split(',')[0] + '</span>' : '') +
                        '</div>' +
                        '<div class="movie-description">' + (movie.description || 'Experience premium streaming with Beraflix') + '</div>' +
                        '<div class="movie-actions">' +
                            '<button class="movie-action-btn watch-btn" onclick="playMovie(\\'' + movie.subjectId + '\\')">' +
                                '<i class="fas fa-play"></i> Watch' +
                            '</button>' +
                            '<button class="movie-action-btn download-btn" onclick="showDownloadModal(' + JSON.stringify(movie).replace(/"/g, '&quot;') + ')">' +
                                '<i class="fas fa-download"></i> Download' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            }).join('');
        }

        // Set hero movie
        function setHeroMovie(movie) {
            if (movie.cover && movie.cover.url) {
                heroBackground.src = movie.cover.url;
            }
            heroTitle.textContent = movie.title || 'Beraflix Premium';
            heroDescription.textContent = movie.description || 'Unlimited HD movies, TV shows, and exclusive content. Watch anywhere. Download offline.';
            
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

        // Show download modal
        async function showDownloadModal(movie) {
            try {
                const response = await fetch('/api/sources/' + movie.subjectId);
                const data = await response.json();
                
                if (data.success && data.results && data.results.length > 0) {
                    const source = data.results[0];
                    downloadMovie(movie.subjectId, movie.title, source.quality, source.download_url, source.size);
                } else {
                    alert('No download sources available for this movie');
                }
            } catch (error) {
                console.error('Error getting download sources:', error);
                alert('Error getting download options');
            }
        }

        // Download movie
        async function downloadMovie(movieId, title, quality, url, size) {
            try {
                // Create download link
                const link = document.createElement('a');
                link.href = url;
                link.download = 'Beraflix_' + title.replace(/[^a-z0-9]/gi, '_') + '_' + quality + '.mp4';
                link.style.display = 'none';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Add to downloads history
                const download = {
                    movieId: movieId,
                    title: title,
                    quality: quality,
                    url: url,
                    size: size,
                    timestamp: Date.now()
                };
                
                userDownloads.unshift(download);
                userDownloads = userDownloads.slice(0, 20);
                localStorage.setItem('beraflix_downloads', JSON.stringify(userDownloads));

                alert('Download started for: ' + title);
                
            } catch (error) {
                console.error('Download error:', error);
                alert('Download failed');
            }
        }

        // Play movie
        async function playMovie(movieId) {
            try {
                const response = await fetch('/api/sources/' + movieId);
                const data = await response.json();
                
                if (data.success && data.results && data.results.length > 0) {
                    const source = data.results[0];
                    const videoSource = source.download_url;
                    
                    // Open in new tab or play in embedded player
                    window.open(videoSource, '_blank');
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
            } else {
                searchResultsRow.style.display = 'none';
                // Show all category rows
                document.querySelectorAll('.row').forEach(row => {
                    if (!row.id.includes('Results')) {
                        row.style.display = 'block';
                    }
                });
            }
        }

        // Make functions global
        window.playMovie = playMovie;
        window.showDownloadModal = showDownloadModal;
        window.downloadMovie = downloadMovie;
        window.handleSearch = handleSearch;
        window.handleYouTubeSearch = handleYouTubeSearch;
        window.downloadYouTubeVideo = downloadYouTubeVideo;
    </script>
</body>
</html>`;
  
  res.send(html);
});

// API Routes
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

// YouTube API Routes
app.get('/api/youtube/search', async (req, res) => {
  try {
    const query = req.query.query;
    console.log('Searching YouTube for:', query);
    
    const response = await fetch(`${YOUTUBE_API_BASE}/search/yts?apikey=gifted&query=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    console.log('YouTube search response:', data);
    
    if (data && data.length > 0) {
      res.json({ 
        success: true, 
        results: data.map(item => ({
          id: item.id,
          title: item.title,
          channel: item.channel,
          thumbnail: item.thumbnail
        }))
      });
    } else {
      res.json({ 
        success: false, 
        message: 'No YouTube results found',
        results: []
      });
    }
  } catch (error) {
    console.error('Error searching YouTube:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search YouTube' 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Beraflix - Premium Streaming Platform',
    movie_api: MOVIE_API_BASE,
    youtube_api: YOUTUBE_API_BASE,
    features: ['HD Streaming', 'Offline Downloads', 'YouTube Downloader', 'Premium Experience', 'Mobile Friendly']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎬 Beraflix Premium Server running on port ${PORT}`);
  console.log(`📍 Visit: http://localhost:${PORT}`);
  console.log(`🎯 Movie API: ${MOVIE_API_BASE}`);
  console.log(`📺 YouTube API: ${YOUTUBE_API_BASE}`);
  console.log(`✨ Features: HD Streaming • Offline Downloads • YouTube Downloader`);
});

module.exports = app;
