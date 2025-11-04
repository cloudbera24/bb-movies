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
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Beraflix - Stream & Download HD Movies</title>
    <meta name="description" content="Stream and download HD movies, TV shows from Hollywood, Nollywood, Anime, Romance and more. Watch anywhere, download offline.">
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
            from {
                transform: translateY(100px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .install-prompt-content {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .install-icon {
            font-size: 2rem;
            color: var(--bera-red);
        }

        .install-text h3 {
            margin-bottom: 0.5rem;
            color: var(--bera-white);
        }

        .install-text p {
            color: var(--bera-light);
            font-size: 0.9rem;
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

        .install-btn:hover {
            background: var(--bera-dark-red);
            transform: translateY(-2px);
        }

        .cancel-install {
            background: transparent;
            border: 1px solid var(--bera-light);
            color: var(--bera-light);
        }

        .cancel-install:hover {
            background: var(--bera-gray);
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

        .mobile-nav-item:hover {
            color: var(--bera-white);
        }

        /* Mobile Search Overlay */
        .mobile-search-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--bera-black);
            z-index: 2000;
            display: none;
            flex-direction: column;
        }

        .mobile-search-header {
            display: flex;
            align-items: center;
            padding: 1rem;
            background: var(--bera-dark);
            border-bottom: 1px solid var(--bera-gray);
        }

        .mobile-search-input {
            flex: 1;
            background: transparent;
            border: none;
            color: var(--bera-white);
            font-size: 1.2rem;
            padding: 1rem;
            outline: none;
        }

        .close-mobile-search {
            background: none;
            border: none;
            color: var(--bera-white);
            font-size: 1.5rem;
            padding: 1rem;
            cursor: pointer;
        }

        .mobile-search-result {
            border-bottom: 1px solid var(--bera-gray);
            transition: background 0.3s;
        }

        .mobile-search-result:active {
            background: var(--bera-gray);
        }

        /* Enhanced Premium Badge */
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

        .nav-links {
            display: flex;
            gap: 2rem;
            list-style: none;
            margin-left: 2rem;
        }

        .nav-links a {
            color: var(--bera-white);
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 600;
            transition: all 0.3s;
            position: relative;
            text-transform: uppercase;
            letter-spacing: 1px;
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

        .mobile-search-btn {
            display: none;
            background: transparent;
            border: none;
            color: var(--bera-white);
            font-size: 1.2rem;
            padding: 0.5rem;
            cursor: pointer;
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

        /* Downloads Section */
        .downloads-section {
            background: rgba(20,20,20,0.8);
            border-radius: 15px;
            padding: 2rem;
            margin: 2rem 0;
            border: 1px solid rgba(255,215,0,0.3);
        }

        .downloads-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 1.5rem;
        }

        .download-item {
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            padding: 1.5rem;
            border: 1px solid rgba(255,215,0,0.2);
            transition: all 0.3s;
        }

        .download-item:hover {
            background: rgba(255,255,255,0.1);
            border-color: var(--bera-gold);
            transform: translateY(-5px);
        }

        .download-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }

        .download-title {
            font-weight: 700;
            color: var(--bera-white);
            font-size: 1.1rem;
        }

        .download-quality {
            background: var(--bera-gold);
            color: #000;
            padding: 0.3rem 0.8rem;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: 700;
        }

        .download-progress {
            width: 100%;
            height: 6px;
            background: rgba(255,255,255,0.2);
            border-radius: 3px;
            overflow: hidden;
            margin: 1rem 0;
        }

        .download-progress-bar {
            height: 100%;
            background: var(--bera-gradient);
            width: 0%;
            transition: width 0.3s;
        }

        .download-actions {
            display: flex;
            gap: 1rem;
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
            padding: 2rem 3rem;
            background: linear-gradient(180deg, rgba(0,0,0,0.9) 0%, transparent 100%);
        }

        .player-title {
            font-size: 1.6rem;
            font-weight: 700;
            color: var(--bera-white);
            font-family: 'Bebas Neue', cursive;
            letter-spacing: 1px;
        }

        .player-actions {
            display: flex;
            gap: 1rem;
        }

        .player-btn {
            background: rgba(255,255,255,0.1);
            border: none;
            color: var(--bera-white);
            padding: 0.8rem 1.2rem;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s;
        }

        .player-btn:hover {
            background: var(--bera-red);
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
            padding: 4rem;
            color: var(--bera-light);
            font-size: 1.2rem;
        }

        .loading-spinner {
            border: 4px solid var(--bera-gray);
            border-top: 4px solid var(--bera-red);
            border-radius: 50%;
            width: 60px;
            height: 60px;
            animation: spin 1s linear infinite;
            margin-right: 1.5rem;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Quality Selector */
        .quality-selector {
            position: absolute;
            bottom: 120px;
            right: 40px;
            background: rgba(20,20,20,0.95);
            border: 2px solid var(--bera-red);
            border-radius: 12px;
            padding: 1.5rem;
            z-index: 2001;
            display: none;
            backdrop-filter: blur(10px);
        }

        .quality-option {
            padding: 1rem 1.5rem;
            color: var(--bera-white);
            cursor: pointer;
            transition: all 0.3s;
            border-radius: 8px;
            margin: 0.5rem 0;
            font-weight: 600;
        }

        .quality-option:hover {
            background: var(--bera-red);
            transform: translateX(10px);
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

        .download-icon {
            font-size: 4rem;
            color: var(--bera-gold);
            margin-bottom: 1.5rem;
        }

        .download-quality-options {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin: 2rem 0;
        }

        .quality-option-large {
            background: rgba(255,255,255,0.1);
            padding: 1.2rem;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .quality-option-large:hover {
            background: var(--bera-gold);
            color: #000;
            transform: scale(1.05);
        }

        /* Scroll Buttons */
        .scroll-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(20,20,20,0.8);
            border: 2px solid var(--bera-red);
            color: var(--bera-white);
            padding: 2rem 1rem;
            cursor: pointer;
            z-index: 5;
            opacity: 0;
            transition: all 0.3s ease;
            font-size: 1.8rem;
            border-radius: 10px;
        }

        .scroll-left { left: 0; border-radius: 0 15px 15px 0; }
        .scroll-right { right: 0; border-radius: 15px 0 0 15px; }

        .row-content:hover .scroll-btn { opacity: 1; }
        .scroll-btn:hover { background: var(--bera-red); }

        /* Error States */
        .error-message {
            text-align: center;
            padding: 3rem;
            color: var(--bera-light);
            font-size: 1.2rem;
        }

        .retry-btn {
            background: var(--bera-red);
            color: var(--bera-white);
            border: none;
            padding: 1rem 2rem;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 1.5rem;
            font-weight: 700;
            transition: all 0.3s;
        }

        .retry-btn:hover {
            background: var(--bera-dark-red);
            transform: translateY(-2px);
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

            .install-prompt {
                left: 10px;
                right: 10px;
                max-width: none;
                bottom: 80px;
            }

            .content-rows {
                padding-bottom: 80px;
            }

            .quick-actions {
                display: none;
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

            .splash-logo {
                font-size: 4rem;
            }

            .install-prompt-content {
                flex-direction: column;
                text-align: center;
            }

            .downloads-grid {
                grid-template-columns: 1fr;
            }
        }

        /* Enhanced K-Drama and New Genre Styles */
        .genre-badge {
            background: linear-gradient(135deg, #ff6b6b, #ee5a24);
            color: white;
            padding: 0.3rem 1rem;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: 600;
        }

        .korean-badge {
            background: linear-gradient(135deg, #ff6b6b, #c23616);
        }

        .bollywood-badge {
            background: linear-gradient(135deg, #ff9ff3, #f368e0);
        }

        .sci-fi-badge {
            background: linear-gradient(135deg, #00d2d3, #54a0ff);
        }

        /* Quick Actions Panel */
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

        .quick-action-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(229, 9, 20, 0.6);
        }

        /* Download Progress Indicator */
        .download-progress-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bera-dark);
            border: 2px solid var(--bera-gold);
            border-radius: 10px;
            padding: 1rem;
            z-index: 1001;
            display: none;
            max-width: 300px;
        }

        .progress-text {
            margin-bottom: 0.5rem;
            font-weight: 600;
        }

        .progress-bar {
            width: 100%;
            height: 6px;
            background: var(--bera-gray);
            border-radius: 3px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: var(--bera-gold);
            width: 0%;
            transition: width 0.3s;
        }

        /* User Section */
        .user-section {
            display: flex;
            align-items: center;
            gap: 1.5rem;
        }

        .downloads-btn {
            background: transparent;
            border: 2px solid var(--bera-gold);
            color: var(--bera-gold);
            padding: 0.6rem 1.2rem;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .install-app-btn {
            background: transparent;
            border: 2px solid var(--bera-blue);
            color: var(--bera-blue);
            padding: 0.6rem 1.2rem;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .user-avatar {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            background: var(--bera-gradient);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            cursor: pointer;
            border: 2px solid var(--bera-red);
            transition: all 0.3s;
        }
    </style>
</head>
<body>
    <!-- Enhanced Install Prompt -->
    <div id="installPrompt" class="install-prompt">
        <div class="install-prompt-content">
            <div class="install-icon">
                <i class="fas fa-download"></i>
            </div>
            <div class="install-text">
                <h3>Install Beraflix</h3>
                <p>Get the best streaming experience with our app</p>
            </div>
        </div>
        <div class="install-buttons">
            <button class="install-btn" id="installBtn">
                <i class="fas fa-download"></i> Install
            </button>
            <button class="install-btn cancel-install" id="cancelInstall">
                Later
            </button>
        </div>
    </div>

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

    <!-- Mobile Search Overlay -->
    <div class="mobile-search-overlay" id="mobileSearchOverlay">
        <div class="mobile-search-header">
            <input type="text" class="mobile-search-input" id="mobileSearchInput" placeholder="Search movies and TV shows..." autofocus>
            <button class="close-mobile-search" id="closeMobileSearch">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="search-results-container" id="mobileSearchResults">
            <!-- Mobile search results will appear here -->
        </div>
    </div>

    <!-- Download Progress Indicator -->
    <div class="download-progress-indicator" id="downloadProgress">
        <div class="progress-text" id="progressText">Downloading...</div>
        <div class="progress-bar">
            <div class="progress-fill" id="progressFill"></div>
        </div>
    </div>

    <!-- Quick Actions Panel -->
    <div class="quick-actions">
        <button class="quick-action-btn" id="quickSearch" title="Search">
            <i class="fas fa-search"></i>
        </button>
        <button class="quick-action-btn" id="quickDownloads" title="Downloads">
            <i class="fas fa-download"></i>
        </button>
        <button class="quick-action-btn" id="quickInstall" title="Install App">
            <i class="fas fa-download"></i>
        </button>
    </div>

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
                <ul class="nav-links">
                    <li><a href="#" class="nav-link active">Home</a></li>
                    <li><a href="#" class="nav-link">Movies</a></li>
                    <li><a href="#" class="nav-link">TV Shows</a></li>
                    <li><a href="#" class="nav-link">New Releases</a></li>
                    <li><a href="#" class="nav-link">My List</a></li>
                </ul>
            </div>
            <div class="nav-search">
                <div class="search-container">
                    <input type="text" class="search-input" id="searchInput" placeholder="Search movies and TV shows...">
                    <button class="mobile-search-btn">
                        <i class="fas fa-search"></i>
                    </button>
                    <button class="search-btn" id="searchBtn">
                        <i class="fas fa-search"></i> Search
                    </button>
                </div>
                <div class="user-section">
                    <button class="install-app-btn" id="installAppBtn">
                        <i class="fas fa-download"></i> Install App
                    </button>
                    <button class="downloads-btn" id="downloadsBtn">
                        <i class="fas fa-download"></i> My Downloads
                    </button>
                    <div class="user-avatar">
                        <i class="fas fa-crown"></i>
                    </div>
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

        <!-- Downloads Section -->
        <section class="downloads-section" id="downloadsSection" style="display: none;">
            <div class="row-header">
                <h2 class="row-title">My Downloads</h2>
                <span class="premium-badge">Offline Viewing</span>
            </div>
            <div class="downloads-grid" id="downloadsGrid">
                <!-- Downloads will be populated here -->
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
                    <button class="scroll-btn scroll-left" onclick="scrollRow('trendingContainer', -400)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="movies-container" id="trendingContainer">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            Loading trending content...
                        </div>
                    </div>
                    <button class="scroll-btn scroll-right" onclick="scrollRow('trendingContainer', 400)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </section>

            <!-- Popular Movies -->
            <section class="row" id="popularRow">
                <div class="row-header">
                    <h2 class="row-title">🎬 Popular on Beraflix</h2>
                    <span class="premium-badge">HD</span>
                </div>
                <div class="row-content">
                    <button class="scroll-btn scroll-left" onclick="scrollRow('popularContainer', -400)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="movies-container" id="popularContainer">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            Loading popular movies...
                        </div>
                    </div>
                    <button class="scroll-btn scroll-right" onclick="scrollRow('popularContainer', 400)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </section>

            <!-- K-Drama Series -->
            <section class="row" id="kdramaRow">
                <div class="row-header">
                    <h2 class="row-title">🎎 K-Drama Series</h2>
                    <span class="premium-badge korean-badge">Korean</span>
                </div>
                <div class="row-content">
                    <button class="scroll-btn scroll-left" onclick="scrollRow('kdramaContainer', -400)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="movies-container" id="kdramaContainer">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            Loading K-Dramas...
                        </div>
                    </div>
                    <button class="scroll-btn scroll-right" onclick="scrollRow('kdramaContainer', 400)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </section>

            <!-- Bollywood Hits -->
            <section class="row" id="bollywoodRow">
                <div class="row-header">
                    <h2 class="row-title">💃 Bollywood Hits</h2>
                    <span class="premium-badge bollywood-badge">Indian</span>
                </div>
                <div class="row-content">
                    <button class="scroll-btn scroll-left" onclick="scrollRow('bollywoodContainer', -400)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="movies-container" id="bollywoodContainer">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            Loading Bollywood movies...
                        </div>
                    </div>
                    <button class="scroll-btn scroll-right" onclick="scrollRow('bollywoodContainer', 400)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </section>

            <!-- Sci-Fi & Fantasy -->
            <section class="row" id="scifiRow">
                <div class="row-header">
                    <h2 class="row-title">🚀 Sci-Fi & Fantasy</h2>
                    <span class="premium-badge sci-fi-badge">Future</span>
                </div>
                <div class="row-content">
                    <button class="scroll-btn scroll-left" onclick="scrollRow('scifiContainer', -400)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="movies-container" id="scifiContainer">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            Loading Sci-Fi movies...
                        </div>
                    </div>
                    <button class="scroll-btn scroll-right" onclick="scrollRow('scifiContainer', 400)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </section>

            <!-- Action Movies -->
            <section class="row" id="actionRow">
                <div class="row-header">
                    <h2 class="row-title">💥 Action & Adventure</h2>
                    <span class="premium-badge">4K</span>
                </div>
                <div class="row-content">
                    <button class="scroll-btn scroll-left" onclick="scrollRow('actionContainer', -400)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="movies-container" id="actionContainer">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            Loading action movies...
                        </div>
                    </div>
                    <button class="scroll-btn scroll-right" onclick="scrollRow('actionContainer', 400)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </section>

            <!-- Hollywood Movies -->
            <section class="row" id="hollywoodRow">
                <div class="row-header">
                    <h2 class="row-title">🎭 Hollywood Blockbusters</h2>
                    <span class="premium-badge">HD</span>
                </div>
                <div class="row-content">
                    <button class="scroll-btn scroll-left" onclick="scrollRow('hollywoodContainer', -400)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="movies-container" id="hollywoodContainer">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            Loading Hollywood movies...
                        </div>
                    </div>
                    <button class="scroll-btn scroll-right" onclick="scrollRow('hollywoodContainer', 400)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </section>

            <!-- Nollywood Movies -->
            <section class="row" id="nollywoodRow">
                <div class="row-header">
                    <h2 class="row-title">🌟 Nollywood Hits</h2>
                    <span class="premium-badge">HD</span>
                </div>
                <div class="row-content">
                    <button class="scroll-btn scroll-left" onclick="scrollRow('nollywoodContainer', -400)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="movies-container" id="nollywoodContainer">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            Loading Nollywood movies...
                        </div>
                    </div>
                    <button class="scroll-btn scroll-right" onclick="scrollRow('nollywoodContainer', 400)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </section>

            <!-- Anime -->
            <section class="row" id="animeRow">
                <div class="row-header">
                    <h2 class="row-title">🎌 Anime Series</h2>
                    <span class="premium-badge">HD</span>
                </div>
                <div class="row-content">
                    <button class="scroll-btn scroll-left" onclick="scrollRow('animeContainer', -400)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="movies-container" id="animeContainer">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            Loading anime...
                        </div>
                    </div>
                    <button class="scroll-btn scroll-right" onclick="scrollRow('animeContainer', 400)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </section>

            <!-- Disney -->
            <section class="row" id="disneyRow">
                <div class="row-header">
                    <h2 class="row-title">🏰 Disney Magic</h2>
                    <span class="premium-badge">Family</span>
                </div>
                <div class="row-content">
                    <button class="scroll-btn scroll-left" onclick="scrollRow('disneyContainer', -400)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="movies-container" id="disneyContainer">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            Loading Disney content...
                        </div>
                    </div>
                    <button class="scroll-btn scroll-right" onclick="scrollRow('disneyContainer', 400)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </section>

            <!-- Romance -->
            <section class="row" id="romanceRow">
                <div class="row-header">
                    <h2 class="row-title">❤️ Romance & Love</h2>
                    <span class="premium-badge">HD</span>
                </div>
                <div class="row-content">
                    <button class="scroll-btn scroll-left" onclick="scrollRow('romanceContainer', -400)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="movies-container" id="romanceContainer">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            Loading romance movies...
                        </div>
                    </div>
                    <button class="scroll-btn scroll-right" onclick="scrollRow('romanceContainer', 400)">
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

        <!-- Enhanced Video Player -->
        <div id="videoPlayer" class="video-player hidden">
            <div class="player-header">
                <div class="player-title" id="playerTitle">Now Playing on Beraflix</div>
                <div class="player-actions">
                    <button class="player-btn" id="downloadPlayerBtn">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="close-player" id="closePlayer">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <video class="video-element" id="videoElement" controls>
                Your browser does not support the video tag.
            </video>
        </div>

        <!-- Quality Selector -->
        <div class="quality-selector" id="qualitySelector">
            <div class="quality-option" data-quality="360p">360p - Good</div>
            <div class="quality-option" data-quality="480p">480p - Better</div>
            <div class="quality-option" data-quality="720p">720p - HD</div>
        </div>

        <!-- Download Modal -->
        <div class="download-modal" id="downloadModal">
            <div class="download-content">
                <div class="download-icon">
                    <i class="fas fa-download"></i>
                </div>
                <h3>Download Movie</h3>
                <p id="downloadMovieTitle">Select your preferred quality:</p>
                <div class="download-quality-options" id="downloadQualityOptions">
                    <!-- Quality options will be populated here -->
                </div>
                <button class="retry-btn" id="closeDownloadModal">Cancel</button>
            </div>
        </div>
    </div>

    <script>
        // Enhanced Global State with new genres
        let currentMovies = [];
        let trendingMovies = [];
        let popularMovies = [];
        let kdramaMovies = [];
        let bollywoodMovies = [];
        let scifiMovies = [];
        let actionMovies = [];
        let hollywoodMovies = [];
        let nollywoodMovies = [];
        let animeMovies = [];
        let disneyMovies = [];
        let romanceMovies = [];
        let currentHeroMovie = null;
        let currentMovieSources = [];
        let userDownloads = JSON.parse(localStorage.getItem('beraflix_downloads')) || [];
        let deferredPrompt = null;

        // DOM Elements
        const splashScreen = document.getElementById('splashScreen');
        const app = document.getElementById('app');
        const navbar = document.getElementById('navbar');
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const installAppBtn = document.getElementById('installAppBtn');
        const downloadsBtn = document.getElementById('downloadsBtn');
        const downloadsSection = document.getElementById('downloadsSection');
        const downloadsGrid = document.getElementById('downloadsGrid');
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
        const kdramaContainer = document.getElementById('kdramaContainer');
        const bollywoodContainer = document.getElementById('bollywoodContainer');
        const scifiContainer = document.getElementById('scifiContainer');
        const actionContainer = document.getElementById('actionContainer');
        const hollywoodContainer = document.getElementById('hollywoodContainer');
        const nollywoodContainer = document.getElementById('nollywoodContainer');
        const animeContainer = document.getElementById('animeContainer');
        const disneyContainer = document.getElementById('disneyContainer');
        const romanceContainer = document.getElementById('romanceContainer');
        const searchResultsRow = document.getElementById('searchResultsRow');
        const searchResultsContainer = document.getElementById('searchResultsContainer');
        const videoPlayer = document.getElementById('videoPlayer');
        const videoElement = document.getElementById('videoElement');
        const closePlayer = document.getElementById('closePlayer');
        const downloadPlayerBtn = document.getElementById('downloadPlayerBtn');
        const playerTitle = document.getElementById('playerTitle');
        const qualitySelector = document.getElementById('qualitySelector');
        const downloadModal = document.getElementById('downloadModal');
        const downloadMovieTitle = document.getElementById('downloadMovieTitle');
        const downloadQualityOptions = document.getElementById('downloadQualityOptions');
        const closeDownloadModal = document.getElementById('closeDownloadModal');
        const installPrompt = document.getElementById('installPrompt');
        const installBtn = document.getElementById('installBtn');
        const cancelInstall = document.getElementById('cancelInstall');

        // Mobile DOM Elements
        const mobileNav = document.querySelector('.mobile-nav');
        const mobileSearchOverlay = document.getElementById('mobileSearchOverlay');
        const mobileSearchInput = document.getElementById('mobileSearchInput');
        const closeMobileSearch = document.getElementById('closeMobileSearch');
        const mobileSearchResults = document.getElementById('mobileSearchResults');
        const mobileSearchBtn = document.getElementById('mobileSearchBtn');
        const mobileDownloadsBtn = document.getElementById('mobileDownloadsBtn');
        const mobileInstallBtn = document.getElementById('mobileInstallBtn');
        const downloadProgress = document.getElementById('downloadProgress');
        const progressText = document.getElementById('progressText');
        const progressFill = document.getElementById('progressFill');
        const quickSearch = document.getElementById('quickSearch');
        const quickDownloads = document.getElementById('quickDownloads');
        const quickInstall = document.getElementById('quickInstall');

        // Initialize App
        document.addEventListener('DOMContentLoaded', async () => {
            setTimeout(() => {
                splashScreen.style.display = 'none';
                app.classList.remove('hidden');
                initializeApp();
            }, 3000);

            // PWA Install Prompt
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                installAppBtn.style.display = 'flex';
                mobileInstallBtn.style.display = 'flex';
                quickInstall.style.display = 'flex';
            });

            // Track app installation
            window.addEventListener('appinstalled', () => {
                installAppBtn.style.display = 'none';
                mobileInstallBtn.style.display = 'none';
                quickInstall.style.display = 'none';
                deferredPrompt = null;
                localStorage.setItem('beraflix_app_installed', 'true');
            });

            // Check if app is already installed
            if (localStorage.getItem('beraflix_app_installed') === 'true') {
                installAppBtn.style.display = 'none';
                mobileInstallBtn.style.display = 'none';
                quickInstall.style.display = 'none';
            }

            // Request notification permission
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        });

        function initializeApp() {
            setupEventListeners();
            loadAllContent();
            updateDownloadsDisplay();
            registerServiceWorker();
            setupMobileFeatures();
            checkInstallPrompt();
        }

        function setupEventListeners() {
            // Search functionality
            searchBtn.addEventListener('click', handleSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSearch();
            });

            // Install functionality
            installAppBtn.addEventListener('click', showInstallPrompt);
            installBtn.addEventListener('click', installApp);
            cancelInstall.addEventListener('click', hideInstallPrompt);

            // Downloads functionality
            downloadsBtn.addEventListener('click', toggleDownloadsSection);

            // Video player functionality
            closePlayer.addEventListener('click', () => {
                videoPlayer.classList.add('hidden');
                videoElement.pause();
                qualitySelector.style.display = 'none';
            });

            downloadPlayerBtn.addEventListener('click', showDownloadOptionsForCurrent);

            // Scroll functionality
            window.addEventListener('scroll', () => {
                if (window.scrollY > 100) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            });

            // Hero buttons
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

            heroDownloadBtn.addEventListener('click', () => {
                if (currentHeroMovie) {
                    showDownloadModal(currentHeroMovie);
                }
            });

            // Quality selector
            document.querySelectorAll('.quality-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    const quality = e.target.getAttribute('data-quality');
                    selectQuality(quality);
                });
            });

            closeDownloadModal.addEventListener('click', () => {
                downloadModal.style.display = 'none';
            });
        }

        function setupMobileFeatures() {
            // Mobile search functionality
            mobileSearchBtn.addEventListener('click', () => {
                mobileSearchOverlay.style.display = 'flex';
                mobileSearchInput.focus();
            });

            closeMobileSearch.addEventListener('click', () => {
                mobileSearchOverlay.style.display = 'none';
            });

            mobileSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = mobileSearchInput.value.trim();
                    if (query) {
                        handleMobileSearch(query);
                    }
                }
            });

            // Mobile navigation
            mobileDownloadsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                toggleDownloadsSection();
            });

            mobileInstallBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showInstallPrompt();
            });

            // Quick actions
            quickSearch.addEventListener('click', () => {
                mobileSearchOverlay.style.display = 'flex';
                mobileSearchInput.focus();
            });

            quickDownloads.addEventListener('click', () => {
                toggleDownloadsSection();
            });

            quickInstall.addEventListener('click', () => {
                showInstallPrompt();
            });

            // Hide quick actions on scroll
            let lastScrollTop = 0;
            window.addEventListener('scroll', () => {
                const st = window.pageYOffset || document.documentElement.scrollTop;
                if (st > lastScrollTop) {
                    document.querySelector('.quick-actions').style.opacity = '0.5';
                } else {
                    document.querySelector('.quick-actions').style.opacity = '1';
                }
                lastScrollTop = st <= 0 ? 0 : st;
            }, { passive: true });
        }

        // PWA Functions
        function checkInstallPrompt() {
            setTimeout(() => {
                const promptDismissed = localStorage.getItem('beraflix_install_dismissed');
                if (!promptDismissed && deferredPrompt) {
                    showInstallPrompt();
                }
            }, 10000);
        }

        function showInstallPrompt() {
            installPrompt.style.display = 'block';
            setTimeout(() => {
                if (installPrompt.style.display === 'block') {
                    hideInstallPrompt();
                }
            }, 30000);
        }

        function hideInstallPrompt() {
            installPrompt.style.display = 'none';
            localStorage.setItem('beraflix_install_dismissed', 'true');
        }

        async function installApp() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    installPrompt.style.display = 'none';
                    installAppBtn.style.display = 'none';
                    mobileInstallBtn.style.display = 'none';
                    quickInstall.style.display = 'none';
                }
                deferredPrompt = null;
            }
        }

        async function registerServiceWorker() {
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    console.log('SW registered: ', registration);
                } catch (registrationError) {
                    console.log('SW registration failed: ', registrationError);
                }
            }
        }

        // Toggle downloads section
        function toggleDownloadsSection() {
            const isVisible = downloadsSection.style.display !== 'none';
            downloadsSection.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                updateDownloadsDisplay();
                // Scroll to downloads section
                downloadsSection.scrollIntoView({ behavior: 'smooth' });
            }
        }

        // Update downloads display
        function updateDownloadsDisplay() {
            if (userDownloads.length === 0) {
                downloadsGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--bera-light);"><i class="fas fa-download" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i><h3>No Downloads Yet</h3><p>Download movies to watch them offline</p></div>';
                return;
            }

            downloadsGrid.innerHTML = userDownloads.map(download => 
                '<div class="download-item">' +
                    '<div class="download-item-header">' +
                        '<div class="download-title">' + download.title + '</div>' +
                        '<div class="download-quality">' + download.quality + '</div>' +
                    '</div>' +
                    '<div class="download-meta">' +
                        '<div>Size: ' + download.size + '</div>' +
                        '<div>Downloaded: ' + new Date(download.timestamp).toLocaleDateString() + '</div>' +
                    '</div>' +
                    '<div class="download-progress">' +
                        '<div class="download-progress-bar" style="width: 100%"></div>' +
                    '</div>' +
                    '<div class="download-actions">' +
                        '<button class="movie-action-btn watch-btn" onclick="playDownload(\\'' + download.url + '\\')">' +
                            '<i class="fas fa-play"></i> Play' +
                        '</button>' +
                        '<button class="movie-action-btn download-btn" onclick="redownloadMovie(\\'' + download.movieId + '\\')">' +
                            '<i class="fas fa-redo"></i> Re-download' +
                        '</button>' +
                    '</div>' +
                '</div>'
            ).join('');
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
            await loadKdramaMovies();
            await loadBollywoodMovies();
            await loadScifiMovies();
            await loadActionMovies();
            await loadHollywoodMovies();
            await loadNollywoodMovies();
            await loadAnimeMovies();
            await loadDisneyMovies();
            await loadRomanceMovies();
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

        // Load K-Drama movies
        async function loadKdramaMovies() {
            try {
                kdramaContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading K-Dramas...</div>';
                
                const response = await fetch('/api/search/korean');
                const data = await response.json();
                
                if (data.success && data.results && data.results.items.length > 0) {
                    kdramaMovies = data.results.items.slice(0, 12);
                    displayMovies(kdramaMovies, kdramaContainer);
                } else {
                    // Fallback to romance movies
                    kdramaMovies = popularMovies.slice(0, 12);
                    displayMovies(kdramaMovies, kdramaContainer);
                }
            } catch (error) {
                console.error('Error loading K-Dramas:', error);
                kdramaContainer.innerHTML = '<div class="error-message">Error loading K-Dramas.</div>';
            }
        }

        // Load Bollywood movies
        async function loadBollywoodMovies() {
            try {
                bollywoodContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading Bollywood movies...</div>';
                
                const response = await fetch('/api/search/bollywood');
                const data = await response.json();
                
                if (data.success && data.results && data.results.items.length > 0) {
                    bollywoodMovies = data.results.items.slice(0, 12);
                    displayMovies(bollywoodMovies, bollywoodContainer);
                } else {
                    // Fallback to popular movies
                    bollywoodMovies = popularMovies.slice(0, 12);
                    displayMovies(bollywoodMovies, bollywoodContainer);
                }
            } catch (error) {
                console.error('Error loading Bollywood movies:', error);
                bollywoodContainer.innerHTML = '<div class="error-message">Error loading Bollywood movies.</div>';
            }
        }

        // Load Sci-Fi movies
        async function loadScifiMovies() {
            try {
                scifiContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading Sci-Fi movies...</div>';
                
                const response = await fetch('/api/search/scifi');
                const data = await response.json();
                
                if (data.success && data.results && data.results.items.length > 0) {
                    scifiMovies = data.results.items.slice(0, 12);
                    displayMovies(scifiMovies, scifiContainer);
                } else {
                    // Fallback to action movies
                    scifiMovies = popularMovies.slice(0, 12);
                    displayMovies(scifiMovies, scifiContainer);
                }
            } catch (error) {
                console.error('Error loading Sci-Fi movies:', error);
                scifiContainer.innerHTML = '<div class="error-message">Error loading Sci-Fi movies.</div>';
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

        // Load Hollywood movies
        async function loadHollywoodMovies() {
            try {
                hollywoodContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading Hollywood movies...</div>';
                
                const response = await fetch('/api/search/hollywood');
                const data = await response.json();
                
                if (data.success && data.results && data.results.items.length > 0) {
                    hollywoodMovies = data.results.items.slice(0, 12);
                    displayMovies(hollywoodMovies, hollywoodContainer);
                } else {
                    hollywoodMovies = popularMovies.slice(0, 12);
                    displayMovies(hollywoodMovies, hollywoodContainer);
                }
            } catch (error) {
                console.error('Error loading Hollywood movies:', error);
                hollywoodContainer.innerHTML = '<div class="error-message">Error loading Hollywood movies.</div>';
            }
        }

        // Load Nollywood movies
        async function loadNollywoodMovies() {
            try {
                nollywoodContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading Nollywood movies...</div>';
                
                const response = await fetch('/api/search/nollywood');
                const data = await response.json();
                
                if (data.success && data.results && data.results.items.length > 0) {
                    nollywoodMovies = data.results.items.slice(0, 12);
                    displayMovies(nollywoodMovies, nollywoodContainer);
                } else {
                    nollywoodContainer.innerHTML = '<div class="error-message">No Nollywood movies found.</div>';
                }
            } catch (error) {
                console.error('Error loading Nollywood movies:', error);
                nollywoodContainer.innerHTML = '<div class="error-message">Error loading Nollywood movies.</div>';
            }
        }

        // Load Anime
        async function loadAnimeMovies() {
            try {
                animeContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading anime...</div>';
                
                const response = await fetch('/api/search/anime');
                const data = await response.json();
                
                if (data.success && data.results && data.results.items.length > 0) {
                    animeMovies = data.results.items.slice(0, 12);
                    displayMovies(animeMovies, animeContainer);
                } else {
                    animeContainer.innerHTML = '<div class="error-message">No anime found.</div>';
                }
            } catch (error) {
                console.error('Error loading anime:', error);
                animeContainer.innerHTML = '<div class="error-message">Error loading anime.</div>';
            }
        }

        // Load Disney
        async function loadDisneyMovies() {
            try {
                disneyContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading Disney content...</div>';
                
                const response = await fetch('/api/search/disney');
                const data = await response.json();
                
                if (data.success && data.results && data.results.items.length > 0) {
                    disneyMovies = data.results.items.slice(0, 12);
                    displayMovies(disneyMovies, disneyContainer);
                } else {
                    disneyContainer.innerHTML = '<div class="error-message">No Disney content found.</div>';
                }
            } catch (error) {
                console.error('Error loading Disney content:', error);
                disneyContainer.innerHTML = '<div class="error-message">Error loading Disney content.</div>';
            }
        }

        // Load Romance
        async function loadRomanceMovies() {
            try {
                romanceContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading romance movies...</div>';
                
                const response = await fetch('/api/search/romance');
                const data = await response.json();
                
                if (data.success && data.results && data.results.items.length > 0) {
                    romanceMovies = data.results.items.slice(0, 12);
                    displayMovies(romanceMovies, romanceContainer);
                } else {
                    romanceContainer.innerHTML = '<div class="error-message">No romance movies found.</div>';
                }
            } catch (error) {
                console.error('Error loading romance movies:', error);
                romanceContainer.innerHTML = '<div class="error-message">Error loading romance movies.</div>';
            }
        }

        // Mobile Search Handler
        async function handleMobileSearch(query) {
            try {
                mobileSearchResults.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Searching...</div>';
                
                const response = await fetch('/api/search/' + encodeURIComponent(query));
                const data = await response.json();
                
                if (data.success && data.results && data.results.items.length > 0) {
                    displayMobileSearchResults(data.results.items);
                } else {
                    mobileSearchResults.innerHTML = '<div class="error-message">No results found</div>';
                }
            } catch (error) {
                console.error('Mobile search error:', error);
                mobileSearchResults.innerHTML = '<div class="error-message">Search failed</div>';
            }
        }

        function displayMobileSearchResults(movies) {
            mobileSearchResults.innerHTML = movies.map(movie => 
                '<div class="mobile-search-result" onclick="selectMobileResult(' + JSON.stringify(movie).replace(/"/g, '&quot;') + ')">' +
                    '<div style="display: flex; gap: 1rem; padding: 1rem; border-bottom: 1px solid var(--bera-gray);">' +
                        (movie.cover && movie.cover.url ? 
                            '<img src="' + movie.cover.url + '" alt="' + movie.title + '" style="width: 60px; height: 80px; object-fit: cover; border-radius: 8px;">' :
                            '<div style="width: 60px; height: 80px; background: var(--bera-gradient); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.8rem; text-align: center; padding: 0.5rem;">MOVIE</div>'
                        ) +
                        '<div style="flex: 1;">' +
                            '<div style="font-weight: 600; margin-bottom: 0.5rem;">' + (movie.title || 'Unknown Title') + '</div>' +
                            '<div style="font-size: 0.9rem; color: var(--bera-light); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">' + 
                                (movie.description || 'No description available') +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>'
            ).join('');
        }

        function selectMobileResult(movie) {
            mobileSearchOverlay.style.display = 'none';
            mobileSearchInput.value = '';
            showMovieDetails(movie.subjectId);
        }

        // Search movies
        async function searchMovies(query) {
            try {
                searchResultsContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Searching for "' + query + '"...</div>';
                searchResultsRow.style.display = 'block';
                
                // Hide all category rows when searching
                document.querySelectorAll('.row').forEach(row => {
                    if (!row.id.includes('Results')) {
                        row.style.display = 'none';
                    }
                });
                downloadsSection.style.display = 'none';
                
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

        // Display movies with enhanced cards
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
                            (movie.duration ? '<span>' + Math.floor(movie.duration / 60) + 'min</span>' : '') +
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
                    downloadMovieTitle.textContent = 'Download "' + movie.title + '"';
                    
                    downloadQualityOptions.innerHTML = data.results.map(source => 
                        '<div class="quality-option-large" onclick="downloadMovie(\\'' + movie.subjectId + '\\', \\'' + movie.title + '\\', \\'' + source.quality + '\\', \\'' + source.download_url + '\\', \\'' + source.size + '\\')">' +
                            '<span>' + source.quality + ' Quality</span>' +
                            '<span>' + formatFileSize(source.size) + '</span>' +
                        '</div>'
                    ).join('');
                    
                    downloadModal.style.display = 'flex';
                } else {
                    alert('No download sources available for this movie');
                }
            } catch (error) {
                console.error('Error getting download sources:', error);
                alert('Error getting download options');
            }
        }

        // Enhanced Download with Progress
        async function downloadMovie(movieId, title, quality, url, size) {
            try {
                // Show progress indicator
                downloadProgress.style.display = 'block';
                progressText.textContent = 'Downloading "' + title + '" - ' + quality;
                progressFill.style.width = '0%';

                // Simulate download progress
                const progressInterval = setInterval(() => {
                    const currentWidth = parseInt(progressFill.style.width) || 0;
                    if (currentWidth < 90) {
                        progressFill.style.width = (currentWidth + 10) + '%';
                    }
                }, 200);

                // Create download link
                const link = document.createElement('a');
                link.href = url;
                link.download = 'Beraflix_' + title.replace(/[^a-z0-9]/gi, '_') + '_' + quality + '.mp4';
                link.style.display = 'none';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Complete progress
                clearInterval(progressInterval);
                progressFill.style.width = '100%';
                progressText.textContent = 'Download Complete!';

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

                // Hide progress after delay
                setTimeout(() => {
                    downloadProgress.style.display = 'none';
                }, 2000);

                // Show success notification
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Beraflix Download Complete', {
                        body: '"' + title + '" - ' + quality + ' has been downloaded',
                        icon: '/icon-192.png'
                    });
                }

                downloadModal.style.display = 'none';
                updateDownloadsDisplay();
                
            } catch (error) {
                console.error('Download error:', error);
                progressText.textContent = 'Download Failed';
                setTimeout(() => {
                    downloadProgress.style.display = 'none';
                }, 3000);
            }
        }

        // Play downloaded movie
        function playDownload(url) {
            videoElement.src = url;
            playerTitle.textContent = 'Playing Downloaded Movie';
            videoPlayer.classList.remove('hidden');
            videoElement.play();
        }

        // Redownload movie
        function redownloadMovie(movieId) {
            const allMovies = [...trendingMovies, ...popularMovies, ...kdramaMovies, ...bollywoodMovies, ...scifiMovies, ...actionMovies, ...hollywoodMovies, ...nollywoodMovies, ...animeMovies, ...disneyMovies, ...romanceMovies, ...currentMovies];
            const movie = allMovies.find(m => m.subjectId === movieId);
            if (movie) {
                showDownloadModal(movie);
            }
        }

        // Show download options for current playing movie
        function showDownloadOptionsForCurrent() {
            const allMovies = [...trendingMovies, ...popularMovies, ...kdramaMovies, ...bollywoodMovies, ...scifiMovies, ...actionMovies, ...hollywoodMovies, ...nollywoodMovies, ...animeMovies, ...disneyMovies, ...romanceMovies, ...currentMovies];
            const currentMovieId = videoElement.src.includes('/api/') ? videoElement.src.split('/').pop() : null;
            const movie = allMovies.find(m => m.subjectId === currentMovieId);
            if (movie) {
                showDownloadModal(movie);
            }
        }

        // Play movie
        async function playMovie(movieId) {
            try {
                const response = await fetch('/api/sources/' + movieId);
                const data = await response.json();
                
                if (data.success && data.results && data.results.length > 0) {
                    currentMovieSources = data.results;
                    
                    let selectedSource = data.results.find(source => source.quality === '720p') ||
                                       data.results.find(source => source.quality === '480p') ||
                                       data.results[0];
                    
                    const videoSource = selectedSource.download_url;
                    
                    const allMovies = [...trendingMovies, ...popularMovies, ...kdramaMovies, ...bollywoodMovies, ...scifiMovies, ...actionMovies, ...hollywoodMovies, ...nollywoodMovies, ...animeMovies, ...disneyMovies, ...romanceMovies, ...currentMovies];
                    const movie = allMovies.find(m => m.subjectId === movieId);
                    
                    videoElement.src = videoSource;
                    playerTitle.textContent = movie ? movie.title + ' - Beraflix' : 'Now Playing on Beraflix';
                    videoPlayer.classList.remove('hidden');
                    
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

        // Show movie details
        async function showMovieDetails(movieId) {
            try {
                const response = await fetch('/api/info/' + movieId);
                const data = await response.json();
                
                if (data.success && data.results && data.results.subject) {
                    const movie = data.results.subject;
                    const play = confirm(movie.title + '\\n\\n' + (movie.description || 'No description available') + '\\n\\nRating: ' + (movie.imdbRatingValue || 'N/A') + '/10\\nGenre: ' + (movie.genre || 'N/A') + '\\n\\nClick OK to watch or Cancel to download.');
                    
                    if (play) {
                        playMovie(movieId);
                    } else {
                        showDownloadModal(movie);
                    }
                } else {
                    playMovie(movieId);
                }
            } catch (error) {
                console.error('Error getting movie info:', error);
                playMovie(movieId);
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
                // Show all category rows
                document.querySelectorAll('.row').forEach(row => {
                    if (!row.id.includes('Results')) {
                        row.style.display = 'block';
                    }
                });
            }
        }

        // Make functions global
        window.showMovieDetails = showMovieDetails;
        window.playMovie = playMovie;
        window.showDownloadModal = showDownloadModal;
        window.downloadMovie = downloadMovie;
        window.playDownload = playDownload;
        window.redownloadMovie = redownloadMovie;
        window.handleSearch = handleSearch;
        window.scrollRow = scrollRow;
        window.loadTrendingMovies = loadTrendingMovies;
        window.toggleDownloadsSection = toggleDownloadsSection;
        window.showInstallPrompt = showInstallPrompt;
        window.installApp = installApp;
        window.selectMobileResult = selectMobileResult;
        window.handleMobileSearch = handleMobileSearch;
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
    service: 'Beraflix - Premium Streaming Platform',
    movie_api: MOVIE_API_BASE,
    features: ['HD Streaming', 'Offline Downloads', '4K Content', 'Premium Experience', 'Multiple Categories', 'PWA Support', 'Mobile Friendly', 'K-Drama', 'Bollywood', 'Sci-Fi']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎬 Beraflix Premium Server running on port ${PORT}`);
  console.log(`📍 Visit: http://localhost:${PORT}`);
  console.log(`🎯 Movie API: ${MOVIE_API_BASE}`);
  console.log(`✨ Brand: BERAFLIX - The Ultimate Streaming Experience`);
  console.log(`💫 Features: HD Streaming • Offline Downloads • 4K Content`);
  console.log(`📱 PWA: Installable App • Offline Support • Mobile Optimized`);
  console.log(`🎭 Categories: Hollywood • Nollywood • Anime • K-Drama • Bollywood • Sci-Fi • Disney • Romance`);
});

module.exports = app;
