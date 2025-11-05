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

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://hfczrryqocgnmbkwemmu.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmY3pycnlxb2Nnbm1ia3dlbW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MjAxMDQsImV4cCI6MjA3NzI5NjEwNH0.L7mltOW-QysNLyQ7vru87dntXqZCjdFRCEEL-Zwpwvw'
);

const MOVIE_API_BASE = 'https://movieapi.giftedtech.co.ke/api';

const YOUTUBE_APIS = {
  baseURL: 'https://api.giftedtech.co.ke/api',
  apiKey: 'gifted',
  endpoints: {
    mp3: '/download/ytmp3',
    mp4: '/download/ytmp4',
    search: '/search/yts'
  }
};

const JWT_SECRET = process.env.JWT_SECRET || 'beraflix_super_secret_key_2024';

app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public folder if they exist
app.use(express.static('public'));

class YouTubeAPI {
  constructor() {
    this.baseURL = YOUTUBE_APIS.baseURL;
    this.apiKey = YOUTUBE_APIS.apiKey;
  }

  async searchVideos(query, maxAttempts = 3) {
    const endpoint = `${this.baseURL}${YOUTUBE_APIS.endpoints.search}?apikey=${this.apiKey}&query=${encodeURIComponent(query)}`;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        console.log(`YouTube Search Attempt ${attempt + 1}:`, query);
        
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (response.ok && data && data.videos && data.videos.length > 0) {
          console.log(`YouTube Search Success: ${data.videos.length} videos found`);
          return {
            success: true,
            videos: data.videos,
            attempt: attempt + 1
          };
        }
      } catch (error) {
        console.warn(`YouTube Search Attempt ${attempt + 1} failed:`, error.message);
        
        if (attempt === maxAttempts - 1) {
          return {
            success: false,
            error: `Search failed: ${error.message}`,
            attempts: attempt + 1
          };
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
    
    return {
      success: false,
      error: 'All search attempts failed',
      attempts: maxAttempts
    };
  }

  async downloadBySearch(searchTerm, type = 'mp4', maxAttempts = 3) {
    try {
      const searchResult = await this.searchVideos(searchTerm);
      
      if (!searchResult.success || !searchResult.videos || searchResult.videos.length === 0) {
        return {
          success: false,
          error: 'No videos found for search term'
        };
      }

      const video = searchResult.videos[0];
      const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
      
      console.log(`Found video: ${video.title} - ${videoUrl}`);

      const downloadEndpoint = `${this.baseURL}${type === 'mp3' ? YOUTUBE_APIS.endpoints.mp3 : YOUTUBE_APIS.endpoints.mp4}?apikey=${this.apiKey}&url=${encodeURIComponent(videoUrl)}`;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          console.log(`Download Attempt ${attempt + 1} for: ${video.title}`);
          
          const response = await fetch(downloadEndpoint);
          const data = await response.json();
          
          if (response.ok && data) {
            console.log(`Download Success for: ${video.title}`);
            return {
              success: true,
              video: video,
              downloadData: data,
              type: type,
              attempt: attempt + 1
            };
          }
        } catch (error) {
          console.warn(`Download Attempt ${attempt + 1} failed:`, error.message);
          
          if (attempt === maxAttempts - 1) {
            return {
              success: false,
              error: `Download failed: ${error.message}`,
              attempts: attempt + 1
            };
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
      
      return {
        success: false,
        error: 'All download attempts failed',
        attempts: maxAttempts
      };

    } catch (error) {
      console.error('Error in downloadBySearch:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

const youtubeAPI = new YouTubeAPI();

// Serve the main HTML file directly
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Beraflix - Stream & Download HD Movies & YouTube</title>
    <meta name="description" content="Stream and download HD movies, TV shows, YouTube videos. Watch anywhere, download offline.">
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
            --bera-green: #00ff88;
            --bera-black: #0a0a0a;
            --bera-dark: #141414;
            --bera-gray: #2a2a2a;
            --bera-light: #8c8c8c;
            --bera-white: #ffffff;
            --bera-gradient: linear-gradient(135deg, #e50914 0%, #b2070f 50%, #8b0000 100%);
            --bera-premium: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
            --bera-youtube: linear-gradient(135deg, #ff0000 0%, #cc0000 50%, #990000 100%);
            --bera-glow: 0 0 20px rgba(229, 9, 20, 0.5);
        }

        body {
            background: var(--bera-black);
            color: var(--bera-white);
            font-family: 'Montserrat', 'Roboto', sans-serif;
            overflow-x: hidden;
            line-height: 1.6;
        }

        .youtube-section {
            background: rgba(255, 0, 0, 0.1);
            border: 2px solid var(--bera-red);
            border-radius: 15px;
            padding: 2rem;
            margin: 2rem 4%;
            position: relative;
            overflow: hidden;
        }

        .youtube-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: var(--bera-youtube);
        }

        .youtube-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .youtube-icon {
            font-size: 2rem;
            color: #ff0000;
        }

        .youtube-title {
            font-size: 1.8rem;
            font-weight: 700;
            background: var(--bera-youtube);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-family: 'Bebas Neue', cursive;
            letter-spacing: 1px;
        }

        .youtube-search-box {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
        }

        .youtube-search-input {
            flex: 1;
            min-width: 300px;
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid var(--bera-gray);
            border-radius: 10px;
            color: var(--bera-white);
            padding: 1rem 1.5rem;
            font-size: 1rem;
            transition: all 0.3s;
        }

        .youtube-search-input:focus {
            border-color: #ff0000;
            outline: none;
            box-shadow: 0 0 20px rgba(255, 0, 0, 0.3);
        }

        .youtube-search-btn {
            background: #ff0000;
            color: white;
            border: none;
            border-radius: 10px;
            padding: 1rem 2rem;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .youtube-search-btn:hover {
            background: #cc0000;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(255, 0, 0, 0.4);
        }

        .youtube-format-buttons {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
        }

        .format-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid var(--bera-gray);
            color: var(--bera-white);
            padding: 0.8rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .format-btn.active {
            background: var(--bera-youtube);
            border-color: #ff0000;
            color: white;
        }

        .format-btn:hover:not(.active) {
            border-color: #ff0000;
            transform: translateY(-2px);
        }

        .youtube-results {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }

        .youtube-video-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.3s;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .youtube-video-card:hover {
            transform: translateY(-5px);
            border-color: #ff0000;
            box-shadow: 0 10px 30px rgba(255, 0, 0, 0.3);
        }

        .youtube-thumbnail {
            width: 100%;
            height: 180px;
            object-fit: cover;
        }

        .youtube-video-info {
            padding: 1.5rem;
        }

        .youtube-video-title {
            font-weight: 600;
            margin-bottom: 0.5rem;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .youtube-video-meta {
            display: flex;
            justify-content: space-between;
            color: var(--bera-light);
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }

        .youtube-download-buttons {
            display: flex;
            gap: 0.8rem;
        }

        .youtube-download-btn {
            flex: 1;
            background: #ff0000;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 0.8rem;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }

        .youtube-download-btn.mp3 {
            background: var(--bera-green);
        }

        .youtube-download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(255, 0, 0, 0.4);
        }

        .youtube-download-btn.mp3:hover {
            box-shadow: 0 5px 15px rgba(0, 255, 136, 0.4);
        }

        .youtube-loading {
            text-align: center;
            padding: 3rem;
            color: var(--bera-light);
        }

        .youtube-error {
            text-align: center;
            padding: 2rem;
            color: #ff4444;
            background: rgba(255, 68, 68, 0.1);
            border-radius: 10px;
            margin: 1rem 0;
        }

        .hidden {
            display: none !important;
        }

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

        @keyframes glow {
            0%, 100% { box-shadow: 0 0 10px gold; }
            50% { box-shadow: 0 0 20px gold; }
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

        @media (max-width: 768px) {
            .navbar {
                padding: 1rem;
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

            .youtube-section {
                margin: 2rem 1rem;
                padding: 1.5rem;
            }

            .youtube-search-box {
                flex-direction: column;
            }

            .youtube-search-input {
                min-width: auto;
            }

            .youtube-results {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div id="app">
        <nav class="navbar" id="navbar">
            <div class="nav-left">
                <a href="#" class="nav-logo">BERAFLIX</a>
            </div>
        </nav>

        <section class="hero-banner" id="heroBanner">
            <div class="hero-gradient"></div>
            <div class="hero-content">
                <div class="hero-badge">🔥 TRENDING NOW</div>
                <h1 class="hero-title" id="heroTitle">Welcome to Beraflix</h1>
                <p class="hero-description" id="heroDescription">Unlimited HD movies, TV shows, and exclusive content. Watch anywhere. Download offline.</p>
                <div class="hero-meta" id="heroMeta">
                    <span><i class="fas fa-star"></i> <span id="heroRating">8.5/10</span></span>
                    <span><i class="fas fa-clock"></i> <span id="heroYear">2024</span></span>
                    <span><i class="fas fa-film"></i> <span id="heroGenre">Action</span></span>
                    <span class="hero-badge">4K Available</span>
                </div>
                <div class="hero-buttons">
                    <button class="play-btn" id="heroPlayBtn">
                        <i class="fas fa-play"></i> Watch Now
                    </button>
                    <button class="download-hero-btn" id="heroDownloadBtn">
                        <i class="fas fa-download"></i> Download HD
                    </button>
                </div>
            </div>
        </section>

        <section class="youtube-section" id="youtubeSection">
            <div class="youtube-header">
                <div class="youtube-icon">
                    <i class="fab fa-youtube"></i>
                </div>
                <h2 class="youtube-title">YouTube Downloader</h2>
                <span class="hero-badge">NEW</span>
            </div>
            
            <div class="youtube-search-box">
                <input type="text" class="youtube-search-input" id="youtubeSearchInput" placeholder="Search YouTube videos (e.g., music, movies, tutorials)...">
                <button class="youtube-search-btn" id="youtubeSearchBtn">
                    <i class="fas fa-search"></i> Search YouTube
                </button>
            </div>

            <div class="youtube-format-buttons">
                <button class="format-btn active" data-format="mp4">
                    <i class="fas fa-video"></i> MP4 Video
                </button>
                <button class="format-btn" data-format="mp3">
                    <i class="fas fa-music"></i> MP3 Audio
                </button>
            </div>

            <div class="youtube-results" id="youtubeResults">
                <div class="youtube-loading" id="youtubeLoading" style="display: none;">
                    <div class="loading-spinner"></div>
                    Searching YouTube...
                </div>
            </div>
        </section>

        <main class="content-rows">
            <section class="row" id="trendingRow">
                <div class="row-header">
                    <h2 class="row-title">🔥 Trending Now</h2>
                    <span class="hero-badge">Hot</span>
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

            <section class="row" id="popularRow">
                <div class="row-header">
                    <h2 class="row-title">🎬 Popular Movies</h2>
                    <span class="hero-badge">HD</span>
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
        </main>
    </div>

    <script>
        let currentDownloadFormat = 'mp4';
        let currentYouTubeResults = [];

        const youtubeSearchInput = document.getElementById('youtubeSearchInput');
        const youtubeSearchBtn = document.getElementById('youtubeSearchBtn');
        const youtubeResults = document.getElementById('youtubeResults');
        const youtubeLoading = document.getElementById('youtubeLoading');
        const formatButtons = document.querySelectorAll('.format-btn');
        const trendingContainer = document.getElementById('trendingContainer');
        const popularContainer = document.getElementById('popularContainer');

        // Setup YouTube features
        function setupYouTubeFeatures() {
            youtubeSearchBtn.addEventListener('click', handleYouTubeSearch);
            youtubeSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleYouTubeSearch();
            });

            formatButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    formatButtons.forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    currentDownloadFormat = e.target.getAttribute('data-format');
                });
            });
        }

        // YouTube Search Handler
        async function handleYouTubeSearch() {
            const query = youtubeSearchInput.value.trim();
            if (!query) {
                alert('Please enter a search term');
                return;
            }

            youtubeLoading.style.display = 'flex';
            youtubeResults.innerHTML = '';

            try {
                const response = await fetch('/api/youtube/search/' + encodeURIComponent(query));
                const data = await response.json();

                youtubeLoading.style.display = 'none';

                if (data.success && data.results && data.results.items) {
                    currentYouTubeResults = data.results.items;
                    displayYouTubeResults(currentYouTubeResults);
                } else {
                    youtubeResults.innerHTML = '<div class="youtube-error">No YouTube videos found for "' + query + '"</div>';
                }
            } catch (error) {
                console.error('YouTube search error:', error);
                youtubeLoading.style.display = 'none';
                youtubeResults.innerHTML = '<div class="youtube-error">Error searching YouTube. Please try again.</div>';
            }
        }

        // Display YouTube Results
        function displayYouTubeResults(videos) {
            if (!videos || videos.length === 0) {
                youtubeResults.innerHTML = '<div class="youtube-error">No videos found</div>';
                return;
            }

            youtubeResults.innerHTML = videos.map(video => `
                <div class="youtube-video-card">
                    <img src="${video.thumbnail}" alt="${video.title}" class="youtube-thumbnail" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMTQxNDE0Ii8+Cjx0ZXh0IHg9IjE2MCIgeT0iOTAiIGZpbGw9IiM4QzhDOEMiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+WU9VVFVCRSBWSURFTzwvdGV4dD4KPC9zdmc+'">
                    <div class="youtube-video-info">
                        <div class="youtube-video-title">${video.title}</div>
                        <div class="youtube-video-meta">
                            <span>${video.duration || 'N/A'}</span>
                            <span>${video.views || 'N/A'} views</span>
                        </div>
                        <div class="youtube-download-buttons">
                            <button class="youtube-download-btn" onclick="downloadYouTubeVideo('${video.id}', '${video.title.replace(/'/g, "\\'")}', 'mp4')">
                                <i class="fas fa-download"></i> MP4
                            </button>
                            <button class="youtube-download-btn mp3" onclick="downloadYouTubeVideo('${video.id}', '${video.title.replace(/'/g, "\\'")}', 'mp3')">
                                <i class="fas fa-music"></i> MP3
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Download YouTube Video
        async function downloadYouTubeVideo(videoId, title, type) {
            try {
                const response = await fetch('/api/youtube/download/search?query=' + encodeURIComponent(title) + '&type=' + type);
                const data = await response.json();

                if (data.success && data.results && data.results.download) {
                    const downloadUrl = data.results.download.url || data.results.download.downloadUrl;
                    
                    if (downloadUrl) {
                        const link = document.createElement('a');
                        link.href = downloadUrl;
                        link.download = 'Beraflix_' + title.replace(/[^a-z0-9]/gi, '_') + '.' + type;
                        link.style.display = 'none';
                        
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    } else {
                        alert('Download URL not found in response');
                    }
                } else {
                    throw new Error(data.error || 'Download failed');
                }
            } catch (error) {
                console.error('YouTube download error:', error);
                alert('Download failed: ' + error.message);
            }
        }

        // Load movie content
        async function loadMovieContent() {
            try {
                // Load trending movies
                const trendingResponse = await fetch('/api/search/avengers');
                const trendingData = await trendingResponse.json();
                
                if (trendingData.success && trendingData.results && trendingData.results.items.length > 0) {
                    displayMovies(trendingData.results.items.slice(0, 8), trendingContainer);
                } else {
                    trendingContainer.innerHTML = '<div class="error-message">No trending movies found</div>';
                }

                // Load popular movies
                const popularResponse = await fetch('/api/search/popular');
                const popularData = await popularResponse.json();
                
                if (popularData.success && popularData.results && popularData.results.items.length > 0) {
                    displayMovies(popularData.results.items.slice(0, 8), popularContainer);
                } else {
                    popularContainer.innerHTML = '<div class="error-message">No popular movies found</div>';
                }

            } catch (error) {
                console.error('Error loading movies:', error);
                trendingContainer.innerHTML = '<div class="error-message">Error loading movies</div>';
                popularContainer.innerHTML = '<div class="error-message">Error loading movies</div>';
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
                
                return '<div class="movie-card">' +
                    poster +
                    '<div class="movie-info">' +
                        '<div class="movie-title">' + (movie.title || 'Unknown Title') + '</div>' +
                        '<div class="movie-meta">' +
                            (movie.releaseDate ? '<span>' + movie.releaseDate.split('-')[0] + '</span>' : '') +
                            (movie.genre ? '<span>' + movie.genre.split(',')[0] + '</span>' : '') +
                        '</div>' +
                        '<div class="movie-description">' + (movie.description || 'Stream now on Beraflix') + '</div>' +
                        '<div class="movie-actions">' +
                            '<button class="movie-action-btn download-btn" onclick="alert(\\'Movie download feature coming soon!\\')">' +
                                '<i class="fas fa-download"></i> Download' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            }).join('');
        }

        // Initialize app
        document.addEventListener('DOMContentLoaded', () => {
            setupYouTubeFeatures();
            loadMovieContent();
            
            // Navbar scroll effect
            window.addEventListener('scroll', () => {
                const navbar = document.getElementById('navbar');
                if (window.scrollY > 100) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            });
        });

        // Make functions global
        window.downloadYouTubeVideo = downloadYouTubeVideo;
    </script>
</body>
</html>
  `);
});

// API Routes (same as before)
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

app.get('/api/youtube/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    console.log('Searching YouTube for:', query);
    
    const result = await youtubeAPI.searchVideos(query);
    
    if (result.success) {
      res.json({
        success: true,
        results: {
          items: result.videos,
          source: 'youtube',
          attempt: result.attempt
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        attempts: result.attempts
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

app.get('/api/youtube/download/search', async (req, res) => {
  try {
    const { query, type = 'mp4' } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    console.log('YouTube Download by Search:', query, type);
    
    const result = await youtubeAPI.downloadBySearch(query, type);
    
    if (result.success) {
      res.json({
        success: true,
        results: {
          video: result.video,
          download: result.downloadData,
          type: result.type,
          attempt: result.attempt
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        attempts: result.attempts
      });
    }
  } catch (error) {
    console.error('Error downloading YouTube by search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download YouTube video'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Beraflix - Premium Streaming Platform',
    movie_api: MOVIE_API_BASE,
    youtube_api: YOUTUBE_APIS.baseURL,
    features: ['HD Streaming', 'Offline Downloads', '4K Content', 'YouTube Downloader']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎬 Beraflix Premium Server running on port ${PORT}`);
  console.log(`📍 Visit: http://localhost:${PORT}`);
  console.log(`🎯 Movie API: ${MOVIE_API_BASE}`);
  console.log(`📺 YouTube API: ${YOUTUBE_APIS.baseURL}`);
  console.log(`✨ Features: YouTube Downloader • Movie Streaming • HD Content`);
});

module.exports = app;
