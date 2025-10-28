require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Proxy endpoints
app.get('/api/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const { page = 1 } = req.query;
        
        const apiUrl = `https://movieapi.giftedtech.co.ke/api/search/${encodeURIComponent(query)}?page=${page}`;
        
        console.log('🔍 Searching movies from:', apiUrl);
        
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
            timeout: 15000
        });
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('✅ Search results received:', data.results?.items?.length || 0, 'items');
        
        res.json(data);
    } catch (error) {
        console.error('❌ Search Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to search movies',
            details: error.message,
            results: { items: [] }
        });
    }
});

app.get('/api/info/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const apiUrl = `https://movieapi.giftedtech.co.ke/api/info/${id}`;
        
        console.log('🔍 Fetching movie info from:', apiUrl);
        
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
            timeout: 15000
        });
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('✅ Movie info received for:', data.results?.subject?.title);
        
        res.json(data);
    } catch (error) {
        console.error('❌ Movie Info Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch movie info',
            details: error.message
        });
    }
});

app.get('/api/sources/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { season, episode } = req.query;
        
        let apiUrl = `https://movieapi.giftedtech.co.ke/api/sources/${id}`;
        if (season) {
            apiUrl += `?season=${season}`;
            if (episode) {
                apiUrl += `&episode=${episode}`;
            }
        }
        
        console.log('🔍 Fetching download sources from:', apiUrl);
        
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
            timeout: 15000
        });
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('✅ Download sources received:', data.results?.length || 0, 'sources');
        
        res.json(data);
    } catch (error) {
        console.error('❌ Sources Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch download sources',
            details: error.message
        });
    }
});

// Direct streaming - use the download URL directly
app.get('/api/stream/:movieId', async (req, res) => {
    try {
        const { movieId } = req.params;
        const { quality = '720p' } = req.query;
        
        console.log(`🎬 Getting streaming sources for movie ${movieId} at ${quality} quality`);
        
        // First get the download sources
        const sourcesResponse = await fetch(`https://movieapi.giftedtech.co.ke/api/sources/${movieId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
            timeout: 15000
        });
        
        if (!sourcesResponse.ok) {
            throw new Error(`Sources API responded with status: ${sourcesResponse.status}`);
        }
        
        const sourcesData = await sourcesResponse.json();
        
        if (!sourcesData.results || sourcesData.results.length === 0) {
            throw new Error('No streaming sources available');
        }
        
        // Find the requested quality or fallback to highest available
        let streamUrl = null;
        const qualityPriority = [quality, '720p', '480p', '360p'];
        
        for (const q of qualityPriority) {
            const source = sourcesData.results.find(s => s.quality === q);
            if (source) {
                streamUrl = source.download_url;
                console.log(`✅ Selected ${q} quality for streaming: ${streamUrl}`);
                break;
            }
        }
        
        if (!streamUrl) {
            throw new Error('No suitable streaming quality found');
        }
        
        // Redirect to the actual video URL
        res.redirect(streamUrl);
        
    } catch (error) {
        console.error('❌ Streaming Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to get streaming URL',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'BB Movies server is running',
        timestamp: new Date().toISOString(),
        endpoints: {
            search: '/api/search/{query}',
            info: '/api/info/{id}',
            sources: '/api/sources/{id}',
            stream: '/api/stream/{id}'
        }
    });
});

// Serve the main HTML content directly
app.get('/', (req, res) => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BB Movies - Premium Streaming</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }

        :root {
            --primary-bg: #0a0a0a; 
            --secondary-bg: #1a1a1a; 
            --accent-red: #e50914;
            --text-primary: #ffffff; 
            --text-secondary: #b3b3b3; 
            --card-bg: #2a2a2a;
            --gradient: linear-gradient(135deg, #e50914 0%, #8b0000 100%);
            --glow: 0 0 20px rgba(229, 9, 20, 0.3);
        }

        body { 
            font-family: 'Arial', sans-serif; 
            background: var(--primary-bg); 
            color: var(--text-primary); 
            line-height: 1.6; 
        }

        /* Enhanced Loading Animations */
        .search-loading {
            display: none;
            text-align: center;
            padding: 3rem;
            color: var(--accent-red);
            background: var(--secondary-bg);
            border-radius: 12px;
            margin: 2rem 0;
            border: 1px solid rgba(229, 9, 20, 0.3);
        }

        .search-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(229, 9, 20, 0.3);
            border-top: 4px solid var(--accent-red);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }

        .skeleton-loader {
            background: linear-gradient(90deg, #333 25%, #444 50%, #333 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
            border-radius: 8px;
        }

        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }

        .skeleton-card {
            background: var(--card-bg);
            border-radius: 12px;
            overflow: hidden;
            height: 500px;
            border: 1px solid #333;
        }

        .skeleton-poster {
            width: 100%;
            height: 400px;
            background: #333;
        }

        .skeleton-content {
            padding: 1.5rem;
        }

        .skeleton-title {
            height: 24px;
            margin-bottom: 12px;
            background: #333;
            border-radius: 4px;
        }

        .skeleton-text {
            height: 14px;
            margin-bottom: 10px;
            background: #333;
            border-radius: 4px;
        }

        .skeleton-text.short {
            width: 60%;
        }

        /* Video Player Styles */
        .video-player-modal { 
            display: none; 
            position: fixed; 
            z-index: 3000; 
            left: 0; 
            top: 0; 
            width: 100%; 
            height: 100%; 
            background: rgba(0, 0, 0, 0.95); 
        }

        .video-player-container { 
            position: relative; 
            width: 90%; 
            height: 80%; 
            max-width: 1200px; 
            margin: 2% auto; 
            background: #000; 
            border-radius: 8px; 
            overflow: hidden; 
            box-shadow: 0 0 50px rgba(229, 9, 20, 0.3);
        }

        .video-player { 
            width: 100%; 
            height: 100%; 
            background: #000; 
            outline: none;
        }

        .player-controls { 
            position: absolute; 
            bottom: 0; 
            left: 0; 
            right: 0; 
            background: linear-gradient(transparent, rgba(0,0,0,0.8)); 
            padding: 1rem; 
            display: flex; 
            align-items: center; 
            gap: 1rem; 
            transition: opacity 0.3s ease;
        }

        .control-btn { 
            background: rgba(229, 9, 20, 0.8); 
            border: none; 
            color: white; 
            padding: 0.5rem 1rem; 
            border-radius: 4px; 
            cursor: pointer; 
            transition: all 0.3s ease; 
        }

        .control-btn:hover { 
            background: var(--accent-red); 
            transform: scale(1.05);
        }

        .close-player { 
            position: absolute; 
            top: 1rem; 
            right: 1rem; 
            background: rgba(0,0,0,0.7); 
            border: none; 
            color: white; 
            width: 40px; 
            height: 40px; 
            border-radius: 50%; 
            cursor: pointer; 
            font-size: 1.2rem; 
            z-index: 3001;
            transition: all 0.3s ease;
        }

        .close-player:hover {
            background: var(--accent-red);
            transform: scale(1.1);
        }

        .streaming-loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: white;
            z-index: 3002;
            background: rgba(0,0,0,0.8);
            padding: 2rem;
            border-radius: 8px;
        }

        .streaming-spinner {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(229, 9, 20, 0.3);
            border-top: 4px solid var(--accent-red);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }

        @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
        }

        /* Navigation */
        .navbar { 
            position: fixed; 
            top: 0; 
            width: 100%; 
            background: rgba(10, 10, 10, 0.95); 
            backdrop-filter: blur(10px); 
            z-index: 1000; 
            padding: 1rem 0; 
            border-bottom: 1px solid rgba(229, 9, 20, 0.3); 
        }

        .nav-container { 
            max-width: 1200px; 
            margin: 0 auto; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 0 2rem; 
        }

        .nav-logo { 
            display: flex; 
            align-items: center; 
            gap: 0.5rem; 
        }

        .bb-logo { 
            background: var(--gradient); 
            padding: 0.5rem; 
            border-radius: 8px; 
            font-weight: bold; 
            font-size: 1.5rem; 
        }

        .movies-text { 
            font-size: 1.5rem; 
            font-weight: bold; 
            color: var(--text-primary); 
        }

        .nav-menu { 
            display: flex; 
            list-style: none; 
            gap: 2rem; 
        }

        .nav-link { 
            color: var(--text-secondary); 
            text-decoration: none; 
            transition: color 0.3s ease; 
            font-weight: 500; 
        }

        .nav-link:hover, .nav-link.active { 
            color: var(--text-primary); 
        }

        .nav-link.active { 
            color: var(--accent-red); 
        }

        .search-container { 
            position: relative; 
        }

        #searchInput { 
            background: var(--secondary-bg); 
            border: 1px solid #444; 
            border-radius: 25px; 
            padding: 0.5rem 1rem 0.5rem 2.5rem; 
            color: var(--text-primary); 
            width: 250px; 
            transition: all 0.3s ease; 
            font-size: 0.9rem;
        }

        #searchInput:focus { 
            outline: none; 
            border-color: var(--accent-red); 
            box-shadow: var(--glow); 
        }

        .search-icon { 
            position: absolute; 
            left: 1rem; 
            top: 50%; 
            transform: translateY(-50%); 
            color: var(--text-secondary); 
        }

        /* Hero Section */
        .hero { 
            position: relative; 
            height: 70vh; 
            background: linear-gradient(rgba(0,0,0,0.8), var(--secondary-bg)); 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            margin-top: 80px; 
            text-align: center;
        }

        .hero-content { 
            z-index: 2; 
        }

        .hero-title { 
            font-size: 4rem; 
            margin-bottom: 1rem; 
            background: var(--gradient); 
            -webkit-background-clip: text; 
            -webkit-text-fill-color: transparent; 
            background-clip: text; 
            text-shadow: 0 0 30px rgba(229, 9, 20, 0.5);
        }

        .hero-subtitle { 
            font-size: 1.5rem; 
            color: var(--text-secondary); 
            margin-bottom: 2rem; 
        }

        .hero-btn { 
            background: var(--gradient); 
            color: white; 
            border: none; 
            padding: 1rem 2rem; 
            border-radius: 30px; 
            font-size: 1.1rem; 
            cursor: pointer; 
            transition: transform 0.3s ease, box-shadow 0.3s ease; 
            font-weight: bold;
        }

        .hero-btn:hover { 
            transform: translateY(-2px); 
            box-shadow: var(--glow); 
        }

        /* Main Content */
        .main-content { 
            max-width: 1200px; 
            margin: 2rem auto; 
            padding: 0 2rem; 
        }

        .section { 
            margin-bottom: 4rem; 
            opacity: 1; 
            transform: translateY(0); 
        }

        .section-title { 
            font-size: 2rem; 
            margin-bottom: 1.5rem; 
            color: var(--text-primary); 
            border-left: 4px solid var(--accent-red); 
            padding-left: 1rem; 
        }

        /* Movies Grid */
        .movies-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
            gap: 2rem; 
        }

        .movie-card { 
            background: var(--card-bg); 
            border-radius: 12px; 
            overflow: hidden; 
            transition: all 0.3s ease; 
            position: relative; 
            cursor: pointer; 
            border: 1px solid rgba(255, 255, 255, 0.1); 
        }

        .movie-card:hover { 
            transform: translateY(-10px) scale(1.02); 
            box-shadow: var(--glow); 
            border-color: var(--accent-red); 
        }

        .movie-poster { 
            width: 100%; 
            height: 400px; 
            object-fit: cover; 
            background: var(--secondary-bg); 
        }

        .poster-fallback { 
            width: 100%; 
            height: 400px; 
            background: linear-gradient(45deg, #333, #555); 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: var(--text-secondary); 
        }

        .movie-info { 
            padding: 1.5rem; 
        }

        .movie-title { 
            font-size: 1.2rem; 
            margin-bottom: 0.5rem; 
            color: var(--text-primary);
        }

        .movie-year { 
            color: var(--accent-red); 
            font-weight: bold; 
            margin-bottom: 0.5rem; 
        }

        .movie-description { 
            color: var(--text-secondary); 
            font-size: 0.9rem; 
            margin-bottom: 1rem; 
            display: -webkit-box; 
            -webkit-line-clamp: 3; 
            -webkit-box-orient: vertical; 
            overflow: hidden; 
        }

        .movie-actions { 
            display: flex; 
            gap: 0.5rem; 
        }

        .btn { 
            padding: 0.5rem 1rem; 
            border: none; 
            border-radius: 6px; 
            cursor: pointer; 
            font-weight: bold; 
            transition: all 0.3s ease; 
            flex: 1; 
            text-align: center; 
            font-size: 0.9rem;
        }

        .btn-watch { 
            background: var(--gradient); 
            color: white; 
        }

        .btn-download { 
            background: transparent; 
            color: var(--text-primary); 
            border: 1px solid var(--text-secondary); 
        }

        .btn:hover { 
            transform: translateY(-2px); 
            box-shadow: var(--glow); 
        }

        /* Modal */
        .modal { 
            display: none; 
            position: fixed; 
            z-index: 2000; 
            left: 0; 
            top: 0; 
            width: 100%; 
            height: 100%; 
            background: rgba(0, 0, 0, 0.95); 
        }

        .modal-content { 
            background: var(--secondary-bg); 
            margin: 2% auto; 
            padding: 2rem; 
            border-radius: 12px; 
            width: 90%; 
            max-width: 800px; 
            position: relative; 
            border: 1px solid var(--accent-red); 
            box-shadow: var(--glow); 
        }

        .close-modal { 
            position: absolute; 
            right: 1rem; 
            top: 1rem; 
            font-size: 2rem; 
            cursor: pointer; 
            color: var(--text-secondary); 
            background: rgba(0,0,0,0.7);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .close-modal:hover { 
            color: var(--accent-red); 
            background: rgba(229, 9, 20, 0.1);
        }

        .modal-body { 
            display: grid; 
            grid-template-columns: 300px 1fr; 
            gap: 2rem; 
        }

        .modal-poster { 
            width: 100%; 
            border-radius: 8px; 
        }

        .modal-details h2 { 
            font-size: 2rem; 
            margin-bottom: 1rem; 
            color: var(--text-primary);
        }

        .modal-meta { 
            display: flex; 
            gap: 1rem; 
            margin-bottom: 1rem; 
            color: var(--text-secondary); 
            flex-wrap: wrap; 
        }

        .modal-overview { 
            margin-bottom: 2rem; 
            line-height: 1.6; 
            color: var(--text-primary);
        }

        .modal-actions { 
            display: flex; 
            gap: 1rem; 
            flex-wrap: wrap; 
        }

        .quality-selector { 
            margin: 1rem 0; 
        }

        .quality-options { 
            display: flex; 
            gap: 0.5rem; 
            flex-wrap: wrap; 
        }

        .quality-btn { 
            padding: 0.5rem 1rem; 
            border: 1px solid var(--accent-red); 
            background: transparent; 
            color: var(--text-primary); 
            border-radius: 4px; 
            cursor: pointer; 
            transition: all 0.3s ease; 
            font-size: 0.9rem;
        }

        .quality-btn:hover, .quality-btn.active { 
            background: var(--accent-red); 
            color: white; 
        }

        /* Downloads List */
        .downloads-list { 
            display: grid; 
            gap: 1rem; 
        }

        .download-item { 
            background: var(--card-bg); 
            padding: 1rem; 
            border-radius: 8px; 
            display: flex; 
            align-items: center; 
            gap: 1rem; 
            border: 1px solid rgba(255, 255, 255, 0.1); 
        }

        .download-thumbnail { 
            width: 80px; 
            height: 120px; 
            object-fit: cover; 
            border-radius: 6px; 
        }

        .download-info { 
            flex: 1; 
        }

        .download-actions { 
            display: flex; 
            gap: 0.5rem; 
        }

        .btn-delete { 
            background: transparent; 
            color: var(--accent-red); 
            border: 1px solid var(--accent-red); 
        }

        .loading-spinner { 
            display: none; 
            justify-content: center; 
            align-items: center; 
            padding: 2rem; 
            background: var(--secondary-bg);
            border-radius: 12px;
            margin: 2rem 0;
        }

        .spinner { 
            width: 50px; 
            height: 50px; 
            border: 4px solid rgba(229, 9, 20, 0.3); 
            border-left: 4px solid var(--accent-red); 
            border-radius: 50%; 
            animation: spin 1s linear infinite; 
        }

        .empty-state, .no-results { 
            text-align: center; 
            padding: 4rem 2rem; 
            color: var(--text-secondary); 
            background: var(--secondary-bg);
            border-radius: 12px;
            border: 1px solid #333;
        }

        .empty-state i, .no-results i { 
            font-size: 4rem; 
            margin-bottom: 1rem; 
            opacity: 0.5; 
        }

        .hidden { 
            display: none !important; 
        }

        .watchlist-btn { 
            position: absolute; 
            top: 1rem; 
            right: 1rem; 
            background: rgba(0, 0, 0, 0.7); 
            border: none; 
            border-radius: 50%; 
            width: 40px; 
            height: 40px; 
            color: white; 
            cursor: pointer; 
            transition: all 0.3s ease; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
        }

        .watchlist-btn:hover { 
            background: var(--accent-red); 
            transform: scale(1.1); 
        }

        .watchlist-btn.active { 
            background: var(--accent-red); 
            color: white; 
        }

        /* Notification */
        .notification {
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--accent-red);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 4000;
            animation: slideIn 0.3s ease;
            box-shadow: var(--glow);
        }

        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            .nav-container { flex-direction: column; gap: 1rem; }
            .nav-menu { gap: 1rem; }
            #searchInput { width: 200px; }
            .hero-title { font-size: 2.5rem; }
            .movies-grid { grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; }
            .modal-body { grid-template-columns: 1fr; }
            .modal-content { margin: 5% auto; width: 95%; padding: 1rem; }
            .video-player-container { width: 95%; height: 60%; }
            .modal-actions { flex-direction: column; }
            .hero { height: 50vh; }
        }

        @media (max-width: 480px) {
            .movies-grid { grid-template-columns: 1fr; }
            .nav-menu { flex-wrap: wrap; justify-content: center; }
            .hero { height: 40vh; margin-top: 120px; }
            .hero-title { font-size: 2rem; }
            .hero-subtitle { font-size: 1.2rem; }
            .nav-container { padding: 0 1rem; }
            .main-content { padding: 0 1rem; }
        }
    </style>
</head>
<body>
    <!-- Video Player Modal -->
    <div class="video-player-modal" id="videoPlayerModal">
        <div class="video-player-container">
            <button class="close-player" onclick="app.closeVideoPlayer()">&times;</button>
            <div class="streaming-loading" id="streamingLoading">
                <div class="streaming-spinner"></div>
                <p>Loading stream...</p>
            </div>
            <video class="video-player" id="videoPlayer" controls>
                Your browser does not support the video tag.
            </video>
            <div class="player-controls">
                <button class="control-btn" onclick="app.togglePlayPause()">
                    <i class="fas fa-play" id="playPauseIcon"></i>
                </button>
                <button class="control-btn" onclick="app.toggleFullscreen()">
                    <i class="fas fa-expand"></i>
                </button>
            </div>
        </div>
    </div>

    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-logo"><span class="bb-logo">BB</span><span class="movies-text">MOVIES</span></div>
            <ul class="nav-menu">
                <li class="nav-item"><a href="#" class="nav-link active" data-section="home">Home</a></li>
                <li class="nav-item"><a href="#" class="nav-link" data-section="watchlist">Watchlist</a></li>
                <li class="nav-item"><a href="#" class="nav-link" data-section="downloads">Downloads</a></li>
                <li class="nav-item"><a href="#" class="nav-link" data-section="about">About</a></li>
            </ul>
            <div class="nav-search">
                <div class="search-container">
                    <input type="text" id="searchInput" placeholder="Search movies...">
                    <i class="fas fa-search search-icon"></i>
                </div>
            </div>
        </div>
    </nav>

    <section class="hero">
        <div class="hero-content">
            <h1 class="hero-title">Welcome to BB Movies</h1>
            <p class="hero-subtitle">Next-Generation Streaming Experience</p>
            <button class="hero-btn" onclick="app.scrollToContent()">Explore Movies</button>
        </div>
    </section>

    <main class="main-content">
        <!-- Search Loading Animation -->
        <div class="search-loading" id="searchLoading">
            <div class="search-spinner"></div>
            <p>Searching for movies...</p>
        </div>

        <section class="section" id="search-results" style="display: none;">
            <h2 class="section-title">Search Results</h2>
            <div class="movies-grid" id="search-results-grid"></div>
        </section>

        <section class="section" id="featured">
            <h2 class="section-title">BB Exclusives</h2>
            <div class="movies-grid" id="featured-grid">
                <!-- Skeleton loaders will be shown here initially -->
            </div>
        </section>

        <section class="section" id="trending">
            <h2 class="section-title">Trending Now</h2>
            <div class="movies-grid" id="trending-grid">
                <!-- Skeleton loaders will be shown here initially -->
            </div>
        </section>

        <section class="section" id="continue-watching" style="display: none;">
            <h2 class="section-title">Continue Watching</h2>
            <div class="movies-grid" id="continue-grid"></div>
        </section>

        <div class="loading-spinner" id="loadingSpinner">
            <div class="spinner"></div>
        </div>

        <div class="no-results" id="noResults" style="display: none;">
            <i class="fas fa-film"></i>
            <h3>No movies found</h3>
            <p>Try searching for something else</p>
        </div>
    </main>

    <div class="modal" id="movieModal">
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div class="modal-body" id="modalBody"></div>
        </div>
    </div>

    <section class="section hidden" id="home-section">
        <!-- Home content is in main-content -->
    </section>

    <section class="section hidden" id="watchlist-section">
        <div class="main-content">
            <h2 class="section-title">My Watchlist</h2>
            <div class="movies-grid" id="watchlist-grid"></div>
            <div class="empty-state" id="empty-watchlist">
                <i class="fas fa-bookmark"></i>
                <h3>Your watchlist is empty</h3>
                <p>Start adding movies to watch later</p>
            </div>
        </div>
    </section>

    <section class="section hidden" id="downloads-section">
        <div class="main-content">
            <h2 class="section-title">My Downloads</h2>
            <div class="downloads-list" id="downloads-list"></div>
            <div class="empty-state" id="empty-downloads">
                <i class="fas fa-download"></i>
                <h3>No downloads yet</h3>
                <p>Download movies to watch offline</p>
            </div>
        </div>
    </section>

    <section class="section hidden" id="about-section">
        <div class="main-content">
            <div class="about-content">
                <h2 class="section-title">About BB Movies</h2>
                <p>Next-generation streaming platform with premium features including offline viewing, smart recommendations, and cinematic experience.</p>
                <div style="margin-top: 2rem;">
                    <h3>Features:</h3>
                    <ul style="margin-top: 1rem; padding-left: 2rem;">
                        <li>High-quality streaming</li>
                        <li>Offline downloads</li>
                        <li>Personal watchlist</li>
                        <li>Continue watching</li>
                        <li>Multiple quality options</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <script>
        class BBMovies {
            constructor() {
                this.currentPage = 1; 
                this.isLoading = false; 
                this.currentSection = 'home';
                this.watchlist = JSON.parse(localStorage.getItem('bb_watchlist')) || [];
                this.downloads = JSON.parse(localStorage.getItem('bb_downloads')) || [];
                this.continueWatching = JSON.parse(localStorage.getItem('bb_continue')) || [];
                this.currentMovieDetails = null;
                this.videoPlayer = null;
                this.init();
            }

            init() { 
                this.bindEvents(); 
                this.showSkeletonLoaders();
                this.loadInitialData(); 
                this.updateUI(); 
                this.videoPlayer = document.getElementById('videoPlayer');
                console.log('BB Movies initialized!');
            }

            showSkeletonLoaders() {
                const featuredGrid = document.getElementById('featured-grid');
                const trendingGrid = document.getElementById('trending-grid');
                
                const skeletonCard = '<div class="skeleton-card"><div class="skeleton-poster skeleton-loader"></div><div class="skeleton-content"><div class="skeleton-title skeleton-loader"></div><div class="skeleton-text skeleton-loader short"></div><div class="skeleton-text skeleton-loader"></div><div class="skeleton-text skeleton-loader"></div></div></div>';
                
                featuredGrid.innerHTML = skeletonCard.repeat(8);
                trendingGrid.innerHTML = skeletonCard.repeat(12);
            }

            bindEvents() {
                const searchInput = document.getElementById('searchInput'); 
                let searchTimeout;
                
                searchInput.addEventListener('input', (e) => { 
                    const query = e.target.value.trim();
                    clearTimeout(searchTimeout); 
                    
                    if (query) {
                        this.showSearchLoading();
                    } else {
                        this.hideSearchLoading();
                        this.hideSearchResults();
                    }
                    
                    searchTimeout = setTimeout(() => { 
                        this.handleSearch(query); 
                    }, 800); 
                });

                document.querySelectorAll('.nav-link').forEach(link => { 
                    link.addEventListener('click', (e) => { 
                        e.preventDefault(); 
                        this.showSection(link.dataset.section); 
                    }); 
                });

                document.querySelector('.close-modal').addEventListener('click', () => { 
                    this.closeModal();
                });

                document.getElementById('movieModal').addEventListener('click', (e) => {
                    if (e.target.id === 'movieModal') {
                        this.closeModal();
                    }
                });

                document.getElementById('videoPlayerModal').addEventListener('click', (e) => {
                    if (e.target.id === 'videoPlayerModal') {
                        this.closeVideoPlayer();
                    }
                });

                // Video player events
                this.videoPlayer = document.getElementById('videoPlayer');
                this.videoPlayer.addEventListener('play', () => this.updatePlayPauseIcon(true));
                this.videoPlayer.addEventListener('pause', () => this.updatePlayPauseIcon(false));
                this.videoPlayer.addEventListener('ended', () => this.onVideoEnded());
                this.videoPlayer.addEventListener('error', (e) => this.onVideoError(e));

                // Keyboard shortcuts
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        this.closeModal();
                        this.closeVideoPlayer();
                    }
                });
            }

            scrollToContent() {
                document.querySelector('.main-content').scrollIntoView({ 
                    behavior: 'smooth' 
                });
            }

            showSearchLoading() {
                document.getElementById('searchLoading').style.display = 'block';
            }

            hideSearchLoading() {
                document.getElementById('searchLoading').style.display = 'none';
            }

            hideSearchResults() {
                document.getElementById('search-results').style.display = 'none';
            }

            async handleSearch(query) {
                if (!query) {
                    this.hideSearchResults();
                    this.hideSearchLoading();
                    return;
                }

                try {
                    this.showSearchLoading();
                    
                    const response = await fetch('/api/search/' + encodeURIComponent(query) + '?page=' + this.currentPage);
                    
                    if (!response.ok) {
                        throw new Error('Search failed: ' + response.status);
                    }
                    
                    const data = await response.json();
                    this.displaySearchResults(data.results?.items || []);
                    
                } catch (error) {
                    console.error('Search error:', error);
                    this.showError('Search failed. Please try again.');
                } finally {
                    this.hideSearchLoading();
                }
            }

            displaySearchResults(movies) {
                const resultsGrid = document.getElementById('search-results-grid');
                const resultsSection = document.getElementById('search-results');
                const noResults = document.getElementById('noResults');

                if (movies.length === 0) {
                    resultsSection.style.display = 'none';
                    noResults.style.display = 'block';
                    return;
                }

                noResults.style.display = 'none';
                resultsSection.style.display = 'block';

                resultsGrid.innerHTML = movies.map(movie => this.createMovieCard(movie)).join('');
            }

            createMovieCard(movie) {
                const isInWatchlist = this.watchlist.some(item => item.id === movie.id);
                const posterUrl = movie.poster || 'https://via.placeholder.com/300x450/333333/FFFFFF?text=No+Image';
                
                return '<div class="movie-card" data-id="' + movie.id + '">' +
                    '<button class="watchlist-btn ' + (isInWatchlist ? 'active' : '') + '" ' +
                            'onclick="app.toggleWatchlist(\'' + movie.id + '\')">' +
                        '<i class="fas fa-bookmark"></i>' +
                    '</button>' +
                    '<img src="' + posterUrl + '" alt="' + this.escapeHtml(movie.title) + '" class="movie-poster" ' +
                         'onerror="this.src=\\'https://via.placeholder.com/300x450/333333/FFFFFF?text=No+Image\\'">' +
                    '<div class="movie-info">' +
                        '<h3 class="movie-title">' + this.escapeHtml(movie.title) + '</h3>' +
                        '<div class="movie-year">' + (movie.year || 'N/A') + '</div>' +
                        '<p class="movie-description">' + this.escapeHtml(movie.description || 'No description available.') + '</p>' +
                        '<div class="movie-actions">' +
                            '<button class="btn btn-watch" onclick="app.showMovieDetails(\\'' + movie.id + '\\')">' +
                                '<i class="fas fa-play"></i> Watch' +
                            '</button>' +
                            '<button class="btn btn-download" onclick="app.showDownloadOptions(\\'' + movie.id + '\\')">' +
                                '<i class="fas fa-download"></i> Download' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            }

            escapeHtml(unsafe) {
                return unsafe
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
            }

            async loadInitialData() {
                try {
                    // Load featured movies
                    const featuredResponse = await fetch('/api/search/avengers');
                    const featuredData = await featuredResponse.json();
                    this.displayMovies(featuredData.results?.items?.slice(0, 8) || [], 'featured-grid');

                    // Load trending movies
                    const trendingResponse = await fetch('/api/search/marvel');
                    const trendingData = await trendingResponse.json();
                    this.displayMovies(trendingData.results?.items?.slice(0, 12) || [], 'trending-grid');

                } catch (error) {
                    console.error('Error loading initial data:', error);
                    this.showError('Failed to load movies. Please check your connection.');
                }
            }

            displayMovies(movies, gridId) {
                const grid = document.getElementById(gridId);
                if (movies.length === 0) {
                    grid.innerHTML = '<div class="no-results"><i class="fas fa-film"></i><h3>No movies found</h3></div>';
                    return;
                }
                grid.innerHTML = movies.map(movie => this.createMovieCard(movie)).join('');
            }

            async showMovieDetails(movieId) {
                try {
                    this.showLoading();
                    const response = await fetch('/api/info/' + movieId);
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch movie details');
                    }
                    
                    const data = await response.json();
                    this.currentMovieDetails = data.results?.subject;
                    
                    if (this.currentMovieDetails) {
                        this.displayMovieModal(this.currentMovieDetails);
                    }
                    
                } catch (error) {
                    console.error('Error fetching movie details:', error);
                    this.showError('Failed to load movie details.');
                } finally {
                    this.hideLoading();
                }
            }

            displayMovieModal(movie) {
                const modalBody = document.getElementById('modalBody');
                const posterUrl = movie.poster || 'https://via.placeholder.com/300x450/333333/FFFFFF?text=No+Image';
                const isInWatchlist = this.watchlist.some(item => item.id === movie.id);
                
                modalBody.innerHTML = '<img src="' + posterUrl + '" alt="' + this.escapeHtml(movie.title) + '" class="modal-poster" ' +
                         'onerror="this.src=\\'https://via.placeholder.com/300x450/333333/FFFFFF?text=No+Image\\'">' +
                    '<div class="modal-details">' +
                        '<h2>' + this.escapeHtml(movie.title) + '</h2>' +
                        '<div class="modal-meta">' +
                            '<span><i class="fas fa-calendar"></i> ' + (movie.year || 'N/A') + '</span>' +
                            '<span><i class="fas fa-star"></i> ' + (movie.rating || 'N/A') + '</span>' +
                            '<span><i class="fas fa-clock"></i> ' + (movie.runtime || 'N/A') + '</span>' +
                        '</div>' +
                        '<div class="modal-overview">' +
                            '<p>' + this.escapeHtml(movie.description || 'No description available.') + '</p>' +
                        '</div>' +
                        '<div class="quality-selector">' +
                            '<h4>Select Quality:</h4>' +
                            '<div class="quality-options">' +
                                '<button class="quality-btn active" data-quality="720p">720p</button>' +
                                '<button class="quality-btn" data-quality="480p">480p</button>' +
                                '<button class="quality-btn" data-quality="360p">360p</button>' +
                            '</div>' +
                        '</div>' +
                        '<div class="modal-actions">' +
                            '<button class="btn btn-watch" onclick="app.startStreaming(\\'' + movie.id + '\\', \\'720p\\')">' +
                                '<i class="fas fa-play"></i> Stream Now' +
                            '</button>' +
                            '<button class="btn btn-download" onclick="app.showDownloadOptions(\\'' + movie.id + '\\')">' +
                                '<i class="fas fa-download"></i> Download' +
                            '</button>' +
                            '<button class="btn" onclick="app.toggleWatchlist(\\'' + movie.id + '\\')">' +
                                '<i class="fas fa-bookmark"></i> ' + (isInWatchlist ? 'Remove from' : 'Add to') + ' Watchlist' +
                            '</button>' +
                        '</div>' +
                    '</div>';

                // Add quality selector event listeners
                modalBody.querySelectorAll('.quality-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        modalBody.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                    });
                });

                this.openModal();
            }

            async startStreaming(movieId, quality) {
                try {
                    this.showStreamingLoading();
                    this.openVideoPlayer();
                    
                    // Get the selected quality from modal if available
                    const activeQuality = document.querySelector('.quality-btn.active');
                    const selectedQuality = activeQuality ? activeQuality.dataset.quality : quality;
                    
                    const streamUrl = '/api/stream/' + movieId + '?quality=' + selectedQuality;
                    this.videoPlayer.src = streamUrl;
                    
                    this.videoPlayer.load();
                    
                    this.videoPlayer.oncanplay = () => {
                        this.hideStreamingLoading();
                        this.videoPlayer.play().catch(e => {
                            console.error('Auto-play failed:', e);
                        });
                    };

                    // Add to continue watching
                    this.addToContinueWatching(movieId);

                } catch (error) {
                    console.error('Streaming error:', error);
                    this.showError('Failed to start streaming. Please try again.');
                    this.hideStreamingLoading();
                }
            }

            async showDownloadOptions(movieId) {
                try {
                    this.showLoading();
                    const response = await fetch('/api/sources/' + movieId);
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch download sources');
                    }
                    
                    const data = await response.json();
                    const sources = data.results || [];
                    
                    if (sources.length === 0) {
                        this.showError('No download sources available for this movie.');
                        return;
                    }

                    this.displayDownloadOptions(sources, movieId);
                    
                } catch (error) {
                    console.error('Error fetching download sources:', error);
                    this.showError('Failed to load download options.');
                } finally {
                    this.hideLoading();
                }
            }

            displayDownloadOptions(sources, movieId) {
                const modalBody = document.getElementById('modalBody');
                
                modalBody.innerHTML = '<div style="grid-column: 1 / -1;">' +
                        '<h2>Download Options</h2>' +
                        '<div class="downloads-list">' +
                            sources.map(source => '<div class="download-item">' +
                                '<div class="download-info">' +
                                    '<h4>' + (source.quality || 'Unknown Quality') + '</h4>' +
                                    '<p>Size: ' + (source.size || 'Unknown') + '</p>' +
                                '</div>' +
                                '<div class="download-actions">' +
                                    '<button class="btn btn-watch" onclick="app.downloadMovie(\\'' + movieId + '\\', \\'' + source.quality + '\\')">' +
                                        '<i class="fas fa-download"></i> Download' +
                                    '</button>' +
                                '</div>' +
                            '</div>').join('') +
                        '</div>' +
                    '</div>';

                this.openModal();
            }

            async downloadMovie(movieId, quality) {
                try {
                    const response = await fetch('/api/sources/' + movieId);
                    const data = await response.json();
                    const sources = data.results || [];
                    
                    const source = sources.find(s => s.quality === quality);
                    if (!source || !source.download_url) {
                        throw new Error('Download URL not found');
                    }

                    // Create a temporary link to trigger download
                    const link = document.createElement('a');
                    link.href = source.download_url;
                    link.download = (this.currentMovieDetails?.title || 'movie') + '_' + quality + '.mp4';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    // Add to downloads list
                    this.addToDownloads(movieId, quality, source.download_url);

                } catch (error) {
                    console.error('Download error:', error);
                    this.showError('Download failed. Please try again.');
                }
            }

            addToDownloads(movieId, quality, downloadUrl) {
                const download = {
                    id: movieId + '_' + quality,
                    movieId: movieId,
                    title: this.currentMovieDetails?.title || 'Unknown Movie',
                    quality: quality,
                    downloadUrl: downloadUrl,
                    downloadedAt: new Date().toISOString()
                };

                this.downloads.unshift(download);
                this.saveDownloads();
                this.updateDownloadsUI();
                this.showNotification('Movie added to downloads!');
            }

            addToContinueWatching(movieId) {
                const existingIndex = this.continueWatching.findIndex(item => item.id === movieId);
                
                if (existingIndex > -1) {
                    this.continueWatching.splice(existingIndex, 1);
                }

                this.continueWatching.unshift({
                    id: movieId,
                    movieId: movieId,
                    title: this.currentMovieDetails?.title || 'Unknown Movie',
                    poster: this.currentMovieDetails?.poster,
                    timestamp: new Date().toISOString(),
                    progress: 0
                });

                // Keep only last 10 items
                this.continueWatching = this.continueWatching.slice(0, 10);
                this.saveContinueWatching();
                this.updateContinueWatchingUI();
            }

            toggleWatchlist(movieId) {
                const existingIndex = this.watchlist.findIndex(item => item.id === movieId);
                
                if (existingIndex > -1) {
                    this.watchlist.splice(existingIndex, 1);
                    this.showNotification('Removed from watchlist');
                } else {
                    this.watchlist.unshift({
                        id: movieId,
                        movieId: movieId,
                        title: this.currentMovieDetails?.title || 'Unknown Movie',
                        poster: this.currentMovieDetails?.poster,
                        year: this.currentMovieDetails?.year,
                        addedAt: new Date().toISOString()
                    });
                    this.showNotification('Added to watchlist!');
                }

                this.saveWatchlist();
                this.updateWatchlistUI();
                
                // Update watchlist button in current view
                const watchlistBtn = document.querySelector('.movie-card[data-id="' + movieId + '"] .watchlist-btn');
                if (watchlistBtn) {
                    watchlistBtn.classList.toggle('active');
                }
            }

            showSection(sectionName) {
                // Hide all sections
                document.querySelectorAll('.section').forEach(section => {
                    section.classList.add('hidden');
                });
                
                // Show selected section
                document.getElementById(sectionName + '-section').classList.remove('hidden');
                
                // Update nav links
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                document.querySelector('[data-section="' + sectionName + '"]').classList.add('active');

                this.currentSection = sectionName;

                // Load section-specific data
                switch(sectionName) {
                    case 'watchlist':
                        this.updateWatchlistUI();
                        break;
                    case 'downloads':
                        this.updateDownloadsUI();
                        break;
                    case 'home':
                        this.updateContinueWatchingUI();
                        break;
                }
            }

            updateWatchlistUI() {
                const watchlistGrid = document.getElementById('watchlist-grid');
                const emptyState = document.getElementById('empty-watchlist');

                if (this.watchlist.length === 0) {
                    watchlistGrid.innerHTML = '';
                    emptyState.style.display = 'block';
                    return;
                }

                emptyState.style.display = 'none';
                watchlistGrid.innerHTML = this.watchlist.map(movie => this.createMovieCard(movie)).join('');
            }

            updateDownloadsUI() {
                const downloadsList = document.getElementById('downloads-list');
                const emptyState = document.getElementById('empty-downloads');

                if (this.downloads.length === 0) {
                    downloadsList.innerHTML = '';
                    emptyState.style.display = 'block';
                    return;
                }

                emptyState.style.display = 'none';
                downloadsList.innerHTML = this.downloads.map(download => 
                    '<div class="download-item">' +
                        '<img src="' + (this.currentMovieDetails?.poster || 'https://via.placeholder.com/80x120/333333/FFFFFF?text=No+Image') + '" ' +
                             'alt="' + this.escapeHtml(download.title) + '" class="download-thumbnail">' +
                        '<div class="download-info">' +
                            '<h4>' + this.escapeHtml(download.title) + '</h4>' +
                            '<p>Quality: ' + download.quality + ' | Downloaded: ' + new Date(download.downloadedAt).toLocaleDateString() + '</p>' +
                        '</div>' +
                        '<div class="download-actions">' +
                            '<button class="btn btn-watch" onclick="app.startStreaming(\\'' + download.movieId + '\\', \\'' + download.quality + '\\')">' +
                                '<i class="fas fa-play"></i> Play' +
                            '</button>' +
                            '<button class="btn btn-delete" onclick="app.removeDownload(\\'' + download.id + '\\')">' +
                                '<i class="fas fa-trash"></i> Delete' +
                            '</button>' +
                        '</div>' +
                    '</div>'
                ).join('');
            }

            updateContinueWatchingUI() {
                const continueGrid = document.getElementById('continue-grid');
                const continueSection = document.getElementById('continue-watching');

                if (this.continueWatching.length === 0) {
                    continueSection.style.display = 'none';
                    return;
                }

                continueSection.style.display = 'block';
                continueGrid.innerHTML = this.continueWatching.map(movie => this.createMovieCard(movie)).join('');
            }

            updateUI() {
                this.updateWatchlistUI();
                this.updateDownloadsUI();
                this.updateContinueWatchingUI();
            }

            removeDownload(downloadId) {
                this.downloads = this.downloads.filter(download => download.id !== downloadId);
                this.saveDownloads();
                this.updateDownloadsUI();
                this.showNotification('Download removed');
            }

            // Storage methods
            saveWatchlist() {
                localStorage.setItem('bb_watchlist', JSON.stringify(this.watchlist));
            }

            saveDownloads() {
                localStorage.setItem('bb_downloads', JSON.stringify(this.downloads));
            }

            saveContinueWatching() {
                localStorage.setItem('bb_continue', JSON.stringify(this.continueWatching));
            }

            // UI Helper methods
            openModal() {
                document.getElementById('movieModal').style.display = 'block';
            }

            closeModal() {
                document.getElementById('movieModal').style.display = 'none';
                this.currentMovieDetails = null;
            }

            openVideoPlayer() {
                document.getElementById('videoPlayerModal').style.display = 'block';
            }

            closeVideoPlayer() {
                document.getElementById('videoPlayerModal').style.display = 'none';
                if (this.videoPlayer) {
                    this.videoPlayer.pause();
                    this.videoPlayer.src = '';
                }
                this.hideStreamingLoading();
            }

            showStreamingLoading() {
                document.getElementById('streamingLoading').style.display = 'block';
            }

            hideStreamingLoading() {
                document.getElementById('streamingLoading').style.display = 'none';
            }

            showLoading() {
                document.getElementById('loadingSpinner').style.display = 'flex';
            }

            hideLoading() {
                document.getElementById('loadingSpinner').style.display = 'none';
            }

            showError(message) {
                this.showNotification(message);
            }

            showNotification(message) {
                const notification = document.createElement('div');
                notification.className = 'notification';
                notification.textContent = message;
                document.body.appendChild(notification);

                setTimeout(() => {
                    notification.remove();
                }, 3000);
            }

            // Video player controls
            togglePlayPause() {
                if (this.videoPlayer.paused) {
                    this.videoPlayer.play();
                } else {
                    this.videoPlayer.pause();
                }
            }

            updatePlayPauseIcon(playing) {
                const icon = document.getElementById('playPauseIcon');
                if (icon) {
                    icon.className = playing ? 'fas fa-pause' : 'fas fa-play';
                }
            }

            toggleFullscreen() {
                if (!document.fullscreenElement) {
                    this.videoPlayer.requestFullscreen().catch(err => {
                        console.error('Error attempting to enable fullscreen:', err);
                    });
                } else {
                    document.exitFullscreen();
                }
            }

            onVideoEnded() {
                this.showNotification('Playback completed');
            }

            onVideoError(e) {
                console.error('Video error:', e);
                this.showError('Video playback error. Please try another quality or movie.');
            }
        }

        // Initialize the app when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            window.app = new BBMovies();
        });
    </script>
</body>
</html>`;

    res.send(htmlContent);
});

// Start server
app.listen(PORT, () => {
    console.log(`🎬 BB Movies Server running on port ${PORT}`);
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});
