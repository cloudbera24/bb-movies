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

// Enhanced Content Categories
const CONTENT_CATEGORIES = {
  movies: 'Movies',
  series: 'TV Series',
  tvshows: 'TV Shows',
  newreleases: 'New Releases',
  trending: 'Trending Now',
  popular: 'Popular',
  mylist: 'My List'
};

const GENRES = [
  'Action', 'Adventure', 'Romance', 'Mystery', 'Thriller', 
  'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Fantasy',
  'Animation', 'Documentary', 'Crime', 'Family', 'Western'
];

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
            --bera-blue-gradient: linear-gradient(135deg, #00a8ff 0%, #0097e6 50%, #0078b5 100%);
            --bera-purple-gradient: linear-gradient(135deg, #8a2be2 0%, #7b1fa2 50%, #6a1b9a 100%);
            --bera-glow: 0 0 20px rgba(229, 9, 20, 0.5);
        }

        body {
            background: var(--bera-black);
            color: var(--bera-white);
            font-family: 'Montserrat', 'Roboto', sans-serif;
            overflow-x: hidden;
            line-height: 1.6;
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

        /* Enhanced Navigation with Categories */
        .navbar {
            position: fixed;
            top: 0;
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 4%;
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
            font-size: 2.8rem;
            font-weight: bold;
            color: transparent;
            background: var(--bera-gradient);
            -webkit-background-clip: text;
            background-clip: text;
            letter-spacing: 3px;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .nav-logo::before {
            content: "🎬";
            font-size: 2rem;
        }

        .nav-links {
            display: flex;
            gap: 2.5rem;
            list-style: none;
            margin-left: 4rem;
        }

        .nav-links a {
            color: var(--bera-white);
            text-decoration: none;
            font-size: 1rem;
            font-weight: 600;
            transition: all 0.3s;
            position: relative;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 0.5rem 1rem;
            border-radius: 25px;
        }

        .nav-links a:hover {
            color: var(--bera-red);
            transform: translateY(-2px);
            background: rgba(229, 9, 20, 0.1);
        }

        .nav-links a.active {
            color: var(--bera-red);
            background: rgba(229, 9, 20, 0.2);
        }

        .nav-search {
            display: flex;
            align-items: center;
            gap: 2rem;
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
            width: 320px;
            font-size: 1rem;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }

        .search-input:focus {
            border-color: var(--bera-red);
            background: rgba(255,255,255,0.15);
            box-shadow: 0 0 20px rgba(229, 9, 20, 0.3);
        }

        .search-btn {
            background: var(--bera-gradient);
            border: none;
            color: var(--bera-white);
            cursor: pointer;
            font-size: 1.1rem;
            padding: 0.8rem 1.2rem;
            border-radius: 30px;
            margin-left: 0.8rem;
            transition: all 0.3s;
            font-weight: 600;
        }

        .search-btn:hover {
            transform: translateY(-2px);
            box-shadow: var(--bera-glow);
        }

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

        .downloads-btn:hover {
            background: var(--bera-gold);
            color: #000;
            transform: translateY(-2px);
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

        .user-avatar:hover {
            transform: scale(1.1);
            box-shadow: var(--bera-glow);
        }

        /* Enhanced Category Filter */
        .category-filter {
            position: fixed;
            top: 80px;
            left: 0;
            width: 100%;
            background: rgba(20,20,20,0.95);
            backdrop-filter: blur(10px);
            padding: 1rem 4%;
            z-index: 999;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            display: flex;
            gap: 1rem;
            overflow-x: auto;
            scrollbar-width: none;
        }

        .category-filter::-webkit-scrollbar {
            display: none;
        }

        .filter-btn {
            background: rgba(255,255,255,0.1);
            border: 2px solid transparent;
            color: var(--bera-white);
            padding: 0.7rem 1.5rem;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
            white-space: nowrap;
            font-size: 0.9rem;
        }

        .filter-btn:hover {
            background: rgba(229, 9, 20, 0.2);
            border-color: var(--bera-red);
        }

        .filter-btn.active {
            background: var(--bera-gradient);
            border-color: var(--bera-red);
            color: var(--bera-white);
        }

        /* Enhanced Hero Banner */
        .hero-banner {
            position: relative;
            height: 90vh;
            background: linear-gradient(77deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.4) 60%, transparent 100%);
            display: flex;
            align-items: center;
            padding: 0 4%;
            margin-bottom: 4rem;
            overflow: hidden;
            margin-top: 140px;
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

        .play-btn, .info-btn, .download-hero-btn, .add-to-list-btn {
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

        .add-to-list-btn {
            background: var(--bera-blue);
            color: var(--bera-white);
        }

        .add-to-list-btn:hover {
            background: #0097e6;
            transform: translateY(-3px);
        }

        /* Enhanced Content Rows */
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

        /* Enhanced Movie Cards */
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

        .add-btn {
            background: var(--bera-blue);
            color: var(--bera-white);
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

        .content-type-badge {
            position: absolute;
            top: 1rem;
            left: 1rem;
            background: rgba(10,10,10,0.9);
            color: var(--bera-white);
            padding: 0.4rem 0.8rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 700;
            border: 1px solid;
        }

        .movie-badge { border-color: var(--bera-red); }
        .series-badge { border-color: var(--bera-blue); }
        .tvshow-badge { border-color: var(--bera-purple); }

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

        /* Enhanced Video Player */
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

        /* Enhanced Loading States */
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

        /* My List Section */
        .my-list-section {
            background: rgba(20,20,20,0.8);
            border-radius: 15px;
            padding: 2rem;
            margin: 2rem 0;
            border: 1px solid rgba(0,168,255,0.3);
        }

        .empty-list {
            text-align: center;
            padding: 4rem;
            color: var(--bera-light);
        }

        .empty-list i {
            font-size: 4rem;
            margin-bottom: 1.5rem;
            color: var(--bera-blue);
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
            .hero-content { max-width: 55%; }
            .hero-title { font-size: 4rem; }
        }

        @media (max-width: 968px) {
            .nav-links { display: none; }
            .hero-content { max-width: 70%; }
            .hero-title { font-size: 3.5rem; }
            .movie-card { width: 300px; }
            .category-filter { top: 70px; padding: 1rem; }
            .hero-banner { margin-top: 120px; }
        }

        @media (max-width: 768px) {
            .navbar { padding: 1rem; }
            .search-input { width: 200px; }
            .hero-content { max-width: 85%; }
            .hero-title { font-size: 3rem; }
            .hero-description { font-size: 1.2rem; }
            .movie-card { width: 250px; }
            .splash-logo { font-size: 5rem; }
            .hero-buttons { flex-wrap: wrap; }
        }

        @media (max-width: 480px) {
            .search-input { width: 150px; }
            .hero-title { font-size: 2.5rem; }
            .hero-buttons { flex-direction: column; }
            .movie-card { width: 200px; }
            .category-filter { flex-wrap: wrap; justify-content: center; }
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

        /* Notification System */
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bera-gradient);
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        }

        .notification.show {
            transform: translateX(0);
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
        <!-- Enhanced Beraflix Navigation -->
        <nav class="navbar" id="navbar">
            <div class="nav-left">
                <a href="#" class="nav-logo">BERAFLIX</a>
                <ul class="nav-links">
                    <li><a href="#" class="nav-link active" data-category="all">Home</a></li>
                    <li><a href="#" class="nav-link" data-category="movies">Movies</a></li>
                    <li><a href="#" class="nav-link" data-category="series">TV Series</a></li>
                    <li><a href="#" class="nav-link" data-category="tvshows">TV Shows</a></li>
                    <li><a href="#" class="nav-link" data-category="newreleases">New Releases</a></li>
                    <li><a href="#" class="nav-link" data-category="mylist">My List</a></li>
                </ul>
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
                    <div class="user-avatar">
                        <i class="fas fa-crown"></i>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Category Filter -->
        <div class="category-filter" id="categoryFilter">
            <button class="filter-btn active" data-genre="all">All</button>
            <button class="filter-btn" data-genre="action">Action</button>
            <button class="filter-btn" data-genre="adventure">Adventure</button>
            <button class="filter-btn" data-genre="romance">Romance</button>
            <button class="filter-btn" data-genre="mystery">Mystery</button>
            <button class="filter-btn" data-genre="thriller">Thriller</button>
            <button class="filter-btn" data-genre="comedy">Comedy</button>
            <button class="filter-btn" data-genre="drama">Drama</button>
            <button class="filter-btn" data-genre="horror">Horror</button>
            <button class="filter-btn" data-genre="sci-fi">Sci-Fi</button>
        </div>

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
                    <button class="add-to-list-btn" id="heroAddToListBtn">
                        <i class="fas fa-plus"></i> My List
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

        <!-- My List Section -->
        <section class="my-list-section" id="myListSection" style="display: none;">
            <div class="row-header">
                <h2 class="row-title">My List</h2>
                <span class="premium-badge">Personalized</span>
            </div>
            <div class="movies-container" id="myListContainer">
                <!-- My List content will be populated here -->
            </div>
        </section>

        <!-- Main Content Rows -->
        <main class="content-rows" id="mainContent">
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

            <!-- New Releases -->
            <section class="row" id="newReleasesRow">
                <div class="row-header">
                    <h2 class="row-title">🎉 New Releases</h2>
                    <span class="premium-badge">Latest</span>
                </div>
                <div class="row-content">
                    <button class="scroll-btn scroll-left" onclick="scrollRow('newReleasesContainer', -400)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="movies-container" id="newReleasesContainer">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            Loading new releases...
                        </div>
                    </div>
                    <button class="scroll-btn scroll-right" onclick="scrollRow('newReleasesContainer', 400)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </section>

            <!-- Popular Movies -->
            <section class="row" id="popularRow">
                <div class="row-header">
                    <h2 class="row-title">🎬 Popular Movies</h2>
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

            <!-- TV Series -->
            <section class="row" id="seriesRow">
                <div class="row-header">
                    <h2 class="row-title">📺 TV Series</h2>
                    <span class="premium-badge">Binge-watch</span>
                </div>
                <div class="row-content">
                    <button class="scroll-btn scroll-left" onclick="scrollRow('seriesContainer', -400)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="movies-container" id="seriesContainer">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            Loading TV series...
                        </div>
                    </div>
                    <button class="scroll-btn scroll-right" onclick="scrollRow('seriesContainer', 400)">
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

            <!-- Romance Movies -->
            <section class="row" id="romanceRow">
                <div class="row-header">
                    <h2 class="row-title">💖 Romance</h2>
                    <span class="premium-badge">Feel Good</span>
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
            <div class="quality-option" data-quality="1080p">1080p - Full HD</div>
            <div class="quality-option" data-quality="4k">4K - Ultra HD</div>
        </div>

        <!-- Download Modal -->
        <div class="download-modal" id="downloadModal">
            <div class="download-content">
                <div class="download-icon">
                    <i class="fas fa-download"></i>
                </div>
                <h3>Download with <span style="color: var(--bera-gold);">BeraTech</span></h3>
                <p id="downloadMovieTitle">Select your preferred quality:</p>
                <div class="download-quality-options" id="downloadQualityOptions">
                    <!-- Quality options will be populated here -->
                </div>
                <button class="retry-btn" id="closeDownloadModal">Cancel</button>
            </div>
        </div>

        <!-- Notification -->
        <div class="notification" id="notification">
            <i class="fas fa-check-circle"></i> <span id="notificationText">Operation completed successfully!</span>
        </div>
    </div>

    <script>
        // Enhanced Global State
        let currentMovies = [];
        let trendingMovies = [];
        let popularMovies = [];
        let actionMovies = [];
        let romanceMovies = [];
        let seriesMovies = [];
        let newReleases = [];
        let currentHeroMovie = null;
        let currentMovieSources = [];
        let userDownloads = JSON.parse(localStorage.getItem('beraflix_downloads')) || [];
        let userList = JSON.parse(localStorage.getItem('beraflix_mylist')) || [];
        let currentCategory = 'all';
        let currentGenre = 'all';

        // DOM Elements
        const splashScreen = document.getElementById('splashScreen');
        const app = document.getElementById('app');
        const navbar = document.getElementById('navbar');
        const categoryFilter = document.getElementById('categoryFilter');
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const downloadsBtn = document.getElementById('downloadsBtn');
        const downloadsSection = document.getElementById('downloadsSection');
        const downloadsGrid = document.getElementById('downloadsGrid');
        const myListSection = document.getElementById('myListSection');
        const myListContainer = document.getElementById('myListContainer');
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
        const heroAddToListBtn = document.getElementById('heroAddToListBtn');
        const trendingContainer = document.getElementById('trendingContainer');
        const popularContainer = document.getElementById('popularContainer');
        const actionContainer = document.getElementById('actionContainer');
        const romanceContainer = document.getElementById('romanceContainer');
        const seriesContainer = document.getElementById('seriesContainer');
        const newReleasesContainer = document.getElementById('newReleasesContainer');
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
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');

        // Initialize App
        document.addEventListener('DOMContentLoaded', async () => {
            setTimeout(() => {
                splashScreen.style.display = 'none';
                app.classList.remove('hidden');
                initializeApp();
            }, 3000);
        });

        function initializeApp() {
            setupEventListeners();
            loadAllContent();
            updateDownloadsDisplay();
            updateMyListDisplay();
        }

        function setupEventListeners() {
            // Search functionality
            searchBtn.addEventListener('click', handleSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSearch();
            });

            // Navigation
            downloadsBtn.addEventListener('click', toggleDownloadsSection);

            // Category navigation
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const category = e.target.getAttribute('data-category');
                    switchCategory(category);
                });
            });

            // Genre filtering
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const genre = e.target.getAttribute('data-genre');
                    filterByGenre(genre);
                });
            });

            // Video player
            closePlayer.addEventListener('click', () => {
                videoPlayer.classList.add('hidden');
                videoElement.pause();
                qualitySelector.style.display = 'none';
            });

            downloadPlayerBtn.addEventListener('click', showDownloadOptionsForCurrent);

            // Scroll effect for navbar
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

            heroAddToListBtn.addEventListener('click', () => {
                if (currentHeroMovie) {
                    toggleMyList(currentHeroMovie);
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

        // Switch category
        function switchCategory(category) {
            currentCategory = category;
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            document.querySelector(`[data-category="${category}"]`).classList.add('active');

            // Show/hide sections based on category
            const mainContent = document.getElementById('mainContent');
            const downloadsSection = document.getElementById('downloadsSection');
            const myListSection = document.getElementById('myListSection');
            const searchResultsRow = document.getElementById('searchResultsRow');

            if (category === 'mylist') {
                mainContent.style.display = 'none';
                downloadsSection.style.display = 'none';
                myListSection.style.display = 'block';
                searchResultsRow.style.display = 'none';
                updateMyListDisplay();
            } else if (category === 'all') {
                mainContent.style.display = 'block';
                downloadsSection.style.display = 'none';
                myListSection.style.display = 'none';
                searchResultsRow.style.display = 'none';
            } else {
                // Filter content based on category
                filterContentByCategory(category);
            }
        }

        // Filter by genre
        function filterByGenre(genre) {
            currentGenre = genre;
            
            // Update active filter button
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[data-genre="${genre}"]`).classList.add('active');

            // Filter content
            filterContent();
        }

        // Filter content based on current category and genre
        function filterContent() {
            const rows = document.querySelectorAll('.row');
            rows.forEach(row => {
                if (currentGenre === 'all') {
                    row.style.display = 'block';
                } else {
                    const rowTitle = row.querySelector('.row-title').textContent.toLowerCase();
                    if (rowTitle.includes(currentGenre)) {
                        row.style.display = 'block';
                    } else {
                        row.style.display = 'none';
                    }
                }
            });
        }

        // Filter content by category
        function filterContentByCategory(category) {
            const rows = document.querySelectorAll('.row');
            rows.forEach(row => {
                const rowId = row.id;
                if (rowId.includes(category)) {
                    row.style.display = 'block';
                } else {
                    row.style.display = 'none';
                }
            });
        }

        // Toggle downloads section
        function toggleDownloadsSection() {
            const isVisible = downloadsSection.style.display !== 'none';
            downloadsSection.style.display = isVisible ? 'none' : 'block';
            myListSection.style.display = 'none';
            document.getElementById('mainContent').style.display = isVisible ? 'block' : 'none';
            
            if (!isVisible) {
                updateDownloadsDisplay();
            }
        }

        // Update downloads display
        function updateDownloadsDisplay() {
            if (userDownloads.length === 0) {
                downloadsGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--bera-light);">
                        <i class="fas fa-download" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        <h3>No Downloads Yet</h3>
                        <p>Download movies to watch them offline</p>
                    </div>`;
                return;
            }

            downloadsGrid.innerHTML = userDownloads.map(download => 
                `<div class="download-item">
                    <div class="download-item-header">
                        <div class="download-title">${download.title}</div>
                        <div class="download-quality">${download.quality}</div>
                    </div>
                    <div class="download-meta">
                        <div>Size: ${download.size}</div>
                        <div>Downloaded: ${new Date(download.timestamp).toLocaleDateString()}</div>
                    </div>
                    <div class="download-progress">
                        <div class="download-progress-bar" style="width: 100%"></div>
                    </div>
                    <div class="download-actions">
                        <button class="movie-action-btn watch-btn" onclick="playDownload('${download.url}')">
                            <i class="fas fa-play"></i> Play
                        </button>
                        <button class="movie-action-btn download-btn" onclick="redownloadMovie('${download.movieId}')">
                            <i class="fas fa-redo"></i> Re-download
                        </button>
                    </div>
                </div>`
            ).join('');
        }

        // Update My List display
        function updateMyListDisplay() {
            if (userList.length === 0) {
                myListContainer.innerHTML = `
                    <div class="empty-list">
                        <i class="fas fa-bookmark"></i>
                        <h3>Your List is Empty</h3>
                        <p>Add movies and TV shows to your list to watch later</p>
                    </div>`;
                return;
            }

            displayMovies(userList, myListContainer);
        }

        // Toggle item in My List
        function toggleMyList(movie) {
            const existingIndex = userList.findIndex(item => item.subjectId === movie.subjectId);
            
            if (existingIndex > -1) {
                userList.splice(existingIndex, 1);
                showNotification('Removed from My List');
            } else {
                userList.push(movie);
                showNotification('Added to My List');
            }
            
            localStorage.setItem('beraflix_mylist', JSON.stringify(userList));
            updateMyListDisplay();
            
            // Update button state
            const isInList = userList.some(item => item.subjectId === movie.subjectId);
            heroAddToListBtn.innerHTML = isInList ? 
                '<i class="fas fa-check"></i> In List' : 
                '<i class="fas fa-plus"></i> My List';
        }

        // Show notification
        function showNotification(message) {
            notificationText.textContent = message;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
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
            await loadRomanceMovies();
            await loadSeries();
            await loadNewReleases();
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

        // Load romance movies
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

        // Load TV series
        async function loadSeries() {
            try {
                seriesContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading TV series...</div>';
                
                const response = await fetch('/api/search/series');
                const data = await response.json();
                
                if (data.success && data.results && data.results.items.length > 0) {
                    seriesMovies = data.results.items.slice(0, 12);
                    displayMovies(seriesMovies, seriesContainer, 'series');
                } else {
                    seriesContainer.innerHTML = '<div class="error-message">No TV series found.</div>';
                }
            } catch (error) {
                console.error('Error loading TV series:', error);
                seriesContainer.innerHTML = '<div class="error-message">Error loading TV series.</div>';
            }
        }

        // Load new releases
        async function loadNewReleases() {
            try {
                newReleasesContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading new releases...</div>';
                
                const response = await fetch('/api/search/new');
                const data = await response.json();
                
                if (data.success && data.results && data.results.items.length > 0) {
                    newReleases = data.results.items.slice(0, 12);
                    displayMovies(newReleases, newReleasesContainer);
                } else {
                    // Use current year movies as fallback
                    const currentYear = new Date().getFullYear();
                    const fallbackResponse = await fetch('/api/search/' + currentYear);
                    const fallbackData = await fallbackResponse.json();
                    
                    if (fallbackData.success && fallbackData.results && fallbackData.results.items.length > 0) {
                        newReleases = fallbackData.results.items.slice(0, 12);
                        displayMovies(newReleases, newReleasesContainer);
                    } else {
                        newReleasesContainer.innerHTML = '<div class="error-message">No new releases found.</div>';
                    }
                }
            } catch (error) {
                console.error('Error loading new releases:', error);
                newReleasesContainer.innerHTML = '<div class="error-message">Error loading new releases.</div>';
            }
        }

        // Search movies
        async function searchMovies(query) {
            try {
                searchResultsContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Searching for "' + query + '"...</div>';
                searchResultsRow.style.display = 'block';
                
                document.getElementById('mainContent').style.display = 'none';
                downloadsSection.style.display = 'none';
                myListSection.style.display = 'none';
                
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
        function displayMovies(movies, container, type = 'movie') {
            if (!movies || movies.length === 0) {
                container.innerHTML = '<div class="error-message">No movies to display</div>';
                return;
            }

            container.innerHTML = movies.map(movie => {
                const poster = movie.cover && movie.cover.url ? 
                    '<img src="' + movie.cover.url + '" alt="' + movie.title + '" class="movie-poster">' :
                    '<div style="background: var(--bera-gradient); height: 200px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.2rem;">BERAFLIX</div>';
                
                const rating = movie.imdbRatingValue ? '<div class="movie-rating">⭐ ' + movie.imdbRatingValue + '</div>' : '';
                
                const badgeClass = type === 'series' ? 'series-badge' : 'movie-badge';
                const badgeText = type === 'series' ? 'TV Series' : 'Movie';
                const typeBadge = '<div class="content-type-badge ' + badgeClass + '">' + badgeText + '</div>';
                
                const isInList = userList.some(item => item.subjectId === movie.subjectId);
                const listButtonText = isInList ? '<i class="fas fa-check"></i> In List' : '<i class="fas fa-plus"></i> My List';
                const listButtonClass = isInList ? 'add-btn active' : 'add-btn';
                
                return '<div class="movie-card">' +
                    poster +
                    rating +
                    typeBadge +
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
                            '<button class="movie-action-btn ' + listButtonClass + '" onclick="toggleMyList(' + JSON.stringify(movie).replace(/"/g, '&quot;') + ')">' +
                                listButtonText +
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
            
            // Update My List button state
            const isInList = userList.some(item => item.subjectId === movie.subjectId);
            heroAddToListBtn.innerHTML = isInList ? 
                '<i class="fas fa-check"></i> In List' : 
                '<i class="fas fa-plus"></i> My List';
        }

        // Show download modal
        async function showDownloadModal(movie) {
            try {
                const response = await fetch('/api/sources/' + movie.subjectId);
                const data = await response.json();
                
                if (data.success && data.results && data.results.length > 0) {
                    downloadMovieTitle.textContent = 'Download "' + movie.title + '" with BeraTech';
                    
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

        // Download movie function with BeraTech branding
        async function downloadMovie(movieId, title, quality, url, size) {
            try {
                // Create download link with BeraTech branding
                const link = document.createElement('a');
                link.href = url;
                link.download = 'BeraTech_' + title.replace(/[^a-z0-9]/gi, '_') + '_' + quality + '.mp4';
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
                // Keep only last 20 downloads
                userDownloads = userDownloads.slice(0, 20);
                localStorage.setItem('beraflix_downloads', JSON.stringify(userDownloads));
                
                // Show success message with BeraTech branding
                showNotification('🎉 Download started with BeraTech!');
                
                downloadModal.style.display = 'none';
                updateDownloadsDisplay();
                
            } catch (error) {
                console.error('Error downloading movie:', error);
                alert('Error starting download. Please try again.');
            }
        }

        // Play downloaded movie
        function playDownload(url) {
            videoElement.src = url;
            playerTitle.textContent = 'Playing Downloaded Movie - BeraTech';
            videoPlayer.classList.remove('hidden');
            videoElement.play();
        }

        // Redownload movie
        function redownloadMovie(movieId) {
            const allMovies = [...trendingMovies, ...popularMovies, ...actionMovies, ...romanceMovies, ...seriesMovies, ...newReleases, ...currentMovies];
            const movie = allMovies.find(m => m.subjectId === movieId);
            if (movie) {
                showDownloadModal(movie);
            }
        }

        // Show download options for current playing movie
        function showDownloadOptionsForCurrent() {
            const allMovies = [...trendingMovies, ...popularMovies, ...actionMovies, ...romanceMovies, ...seriesMovies, ...newReleases, ...currentMovies];
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
                    
                    const allMovies = [...trendingMovies, ...popularMovies, ...actionMovies, ...romanceMovies, ...seriesMovies, ...newReleases, ...currentMovies];
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
                    const play = confirm((movie.title || 'Movie') + '\\n\\n' + (movie.description || 'No description available') + '\\n\\nRating: ' + (movie.imdbRatingValue || 'N/A') + '/10\\nGenre: ' + (movie.genre || 'N/A') + '\\n\\nClick OK to watch or Cancel to download.');
                    
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
                document.getElementById('mainContent').style.display = 'block';
            }
        }

        // Make functions global
        window.showMovieDetails = showMovieDetails;
        window.playMovie = playMovie;
        window.showDownloadModal = showDownloadModal;
        window.downloadMovie = downloadMovie;
        window.playDownload = playDownload;
        window.redownloadMovie = redownloadMovie;
        window.toggleMyList = toggleMyList;
        window.handleSearch = handleSearch;
        window.scrollRow = scrollRow;
        window.loadTrendingMovies = loadTrendingMovies;
        window.toggleDownloadsSection = toggleDownloadsSection;
        window.switchCategory = switchCategory;
        window.filterByGenre = filterByGenre;
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
    features: ['HD Streaming', 'Offline Downloads', '4K Content', 'Premium Experience', 'BeraTech Downloads']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎬 Beraflix Premium Server running on port ${PORT}`);
  console.log(`📍 Visit: http://localhost:${PORT}`);
  console.log(`🎯 Movie API: ${MOVIE_API_BASE}`);
  console.log(`✨ Brand: BERAFLIX - The Ultimate Streaming Experience`);
  console.log(`💫 Features: HD Streaming • Offline Downloads • 4K Content • BeraTech Downloads`);
  console.log(`🎮 Categories: Movies • TV Series • New Releases • My List`);
  console.log(`🎭 Genres: Action • Romance • Mystery • Adventure • and more!`);
});

module.exports = app;
