/**
 * BERA FLIX - Premium Movie Streaming Platform
 * Complete Real Implementation with Download Features
 * Powered by Gifted Movies API
 * 
 * Features:
 * - Real API integration with Gifted Movies API
 * - Direct movie and series downloads
 * - Episode-by-episode downloading
 * - Multiple quality options (360p, 480p, 720p)
 * - Branded download filenames
 * - Progress tracking
 * - Download history
 * - PWA support
 * 
 * Deployment:
 * npm install express cors axios compression helmet path
 * node server.js
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Constants
const BASE_API_URL = 'https://movieapi.giftedtech.co.ke';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Cache storage
const cache = new Map();
const downloadHistory = new Map();

// Enhanced API service with real implementation
class BeraFlixAPIService {
    constructor() {
        this.baseURL = BASE_API_URL;
    }

    async makeRequest(endpoint, params = {}) {
        const cacheKey = `${endpoint}-${JSON.stringify(params)}`;
        const cached = cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }

        try {
            let url = `${this.baseURL}${endpoint}`;
            console.log(`🔄 API Request: ${url}`);
            
            const response = await axios.get(url, {
                params,
                timeout: 15000,
                headers: {
                    'User-Agent': 'BERA-FLIX/2.0.0',
                    'Accept': 'application/json'
                }
            });

            const data = response.data;
            
            if (data && data.success !== false) {
                cache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });
            }

            return data;
        } catch (error) {
            console.error(`❌ API Error for ${endpoint}:`, error.message);
            
            if (cached) {
                console.log('🔄 Returning cached data');
                return cached.data;
            }

            throw new Error(`API request failed: ${error.message}`);
        }
    }

    async searchMovies(query, page = 1) {
        return this.makeRequest(`/api/search/${encodeURIComponent(query)}`, { page });
    }

    async getMovieInfo(movieId) {
        return this.makeRequest(`/api/info/${movieId}`);
    }

    async getDownloadSources(movieId, season = null, episode = null) {
        const params = {};
        if (season !== null) params.season = season;
        if (episode !== null) params.episode = episode;
        
        return this.makeRequest(`/api/sources/${movieId}`, params);
    }

    async getTrending() {
        return this.searchMovies('movie');
    }

    async getMoviesByGenre(genre) {
        return this.searchMovies(genre);
    }

    // Real download implementation
    async streamDownload(sourceUrl, res, filename, downloadId) {
        return new Promise((resolve, reject) => {
            const protocol = sourceUrl.startsWith('https') ? https : http;
            
            const request = protocol.get(sourceUrl, (sourceResponse) => {
                // Set download headers
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.setHeader('Content-Type', 'video/mp4');
                res.setHeader('Content-Length', sourceResponse.headers['content-length']);
                res.setHeader('Cache-Control', 'no-cache');

                let downloadedBytes = 0;
                const totalBytes = parseInt(sourceResponse.headers['content-length']) || 0;

                // Track download progress
                sourceResponse.on('data', (chunk) => {
                    downloadedBytes += chunk.length;
                    if (downloadId && totalBytes > 0) {
                        const progress = Math.round((downloadedBytes / totalBytes) * 100);
                        downloadHistory.set(downloadId, {
                            progress: progress,
                            downloaded: downloadedBytes,
                            total: totalBytes,
                            status: 'downloading'
                        });
                    }
                });

                // Pipe the download to client
                sourceResponse.pipe(res);

                sourceResponse.on('end', () => {
                    if (downloadId) {
                        downloadHistory.set(downloadId, {
                            progress: 100,
                            downloaded: downloadedBytes,
                            total: totalBytes,
                            status: 'completed',
                            completedAt: new Date().toISOString()
                        });
                    }
                    resolve();
                });

                sourceResponse.on('error', (error) => {
                    if (downloadId) {
                        downloadHistory.set(downloadId, {
                            progress: 0,
                            status: 'failed',
                            error: error.message
                        });
                    }
                    reject(error);
                });

            }).on('error', (error) => {
                if (downloadId) {
                    downloadHistory.set(downloadId, {
                        progress: 0,
                        status: 'failed',
                        error: error.message
                    });
                }
                reject(error);
            });

            request.setTimeout(30000, () => {
                request.destroy();
                reject(new Error('Download timeout'));
            });
        });
    }
}

const movieAPI = new BeraFlixAPIService();

// Movie genres
const MOVIE_GENRES = [
    "Action", "Adventure", "Animation", "Comedy", "Crime", 
    "Documentary", "Drama", "Fantasy", "Horror", "Mystery",
    "Romance", "Sci-Fi", "Thriller", "Western", "Family",
    "Superhero", "Musical", "Historical", "War", "Sports"
];

// Utility functions
function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_');
}

function generateDownloadId() {
    return `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// API Routes
app.get('/api/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const page = parseInt(req.query.page) || 1;
        
        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                status: 400,
                success: false,
                error: 'Search query must be at least 2 characters long'
            });
        }

        const data = await movieAPI.searchMovies(query, page);
        res.json(data);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            status: 500,
            success: false,
            error: 'Search service temporarily unavailable'
        });
    }
});

app.get('/api/info/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                status: 400,
                success: false,
                error: 'Movie ID is required'
            });
        }

        const data = await movieAPI.getMovieInfo(id);
        res.json(data);
    } catch (error) {
        console.error('Movie info error:', error);
        res.status(500).json({
            status: 500,
            success: false,
            error: 'Failed to fetch movie information'
        });
    }
});

app.get('/api/sources/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { season, episode } = req.query;
        
        if (!id) {
            return res.status(400).json({
                status: 400,
                success: false,
                error: 'Movie ID is required'
            });
        }

        const seasonNum = season ? parseInt(season) : null;
        const episodeNum = episode ? parseInt(episode) : null;

        const data = await movieAPI.getDownloadSources(id, seasonNum, episodeNum);
        res.json(data);
    } catch (error) {
        console.error('Sources error:', error);
        res.status(500).json({
            status: 500,
            success: false,
            error: 'Failed to fetch download sources'
        });
    }
});

// REAL DOWNLOAD ENDPOINT - Core Implementation
app.get('/api/download/:movieId', async (req, res) => {
    try {
        const { movieId } = req.params;
        const { 
            sourceUrl, 
            quality, 
            title, 
            season, 
            episode,
            downloadId = generateDownloadId() 
        } = req.query;

        if (!sourceUrl || !quality || !title) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: sourceUrl, quality, title'
            });
        }

        console.log(`📥 Starting download: ${title} - ${quality}`);

        // Decode the source URL (it comes encoded from the frontend)
        const decodedSourceUrl = decodeURIComponent(sourceUrl);
        
        // Generate branded filename
        let filename;
        if (season && episode) {
            filename = `BERAFLIX_${sanitizeFilename(title)}_S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}_${quality}.mp4`;
        } else {
            filename = `BERAFLIX_${sanitizeFilename(title)}_${quality}.mp4`;
        }

        // Initialize download tracking
        downloadHistory.set(downloadId, {
            movieId: movieId,
            title: title,
            quality: quality,
            season: season,
            episode: episode,
            progress: 0,
            status: 'starting',
            startedAt: new Date().toISOString()
        });

        // Stream the download to the user
        await movieAPI.streamDownload(decodedSourceUrl, res, filename, downloadId);

    } catch (error) {
        console.error('❌ Download failed:', error.message);
        
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: 'Download failed',
                message: error.message
            });
        }
    }
});

// Download progress endpoint
app.get('/api/download/:downloadId/progress', (req, res) => {
    const { downloadId } = req.params;
    const progress = downloadHistory.get(downloadId);
    
    if (!progress) {
        return res.status(404).json({
            success: false,
            error: 'Download not found'
        });
    }

    res.json({
        success: true,
        data: progress
    });
});

// Get all available sources for download with metadata
app.get('/api/:movieId/download-sources', async (req, res) => {
    try {
        const { movieId } = req.params;
        const { season, episode } = req.query;

        // Get movie info first for metadata
        const movieInfo = await movieAPI.getMovieInfo(movieId);
        const sources = await movieAPI.getDownloadSources(movieId, season, episode);

        if (!movieInfo.success || !sources.success) {
            throw new Error('Failed to fetch movie data');
        }

        const movieData = movieInfo.results.subject;
        const availableSources = sources.results || [];

        // Enhance sources with download URLs
        const enhancedSources = availableSources.map(source => ({
            ...source,
            download_url: `/api/download/${movieId}?${new URLSearchParams({
                sourceUrl: encodeURIComponent(source.download_url),
                quality: source.quality,
                title: sanitizeFilename(movieData.title),
                season: season || '',
                episode: episode || '',
                downloadId: generateDownloadId()
            }).toString()}`
        }));

        res.json({
            status: 200,
            success: true,
            data: {
                movie: {
                    id: movieData.subjectId,
                    title: movieData.title,
                    description: movieData.description,
                    genre: movieData.genre,
                    year: movieData.releaseDate ? new Date(movieData.releaseDate).getFullYear() : 'N/A',
                    rating: movieData.imdbRatingValue,
                    duration: movieData.duration,
                    cover: movieData.cover?.url
                },
                sources: enhancedSources,
                isTvShow: movieData.subjectType === 2, // Assuming 2 is for TV shows
                season: season,
                episode: episode
            }
        });

    } catch (error) {
        console.error('Download sources error:', error);
        res.status(500).json({
            status: 500,
            success: false,
            error: 'Failed to fetch download sources'
        });
    }
});

// TV Series episodes endpoint
app.get('/api/tv/:seriesId/seasons', async (req, res) => {
    try {
        const { seriesId } = req.params;
        
        const seriesInfo = await movieAPI.getMovieInfo(seriesId);
        
        if (!seriesInfo.success) {
            throw new Error('Failed to fetch series information');
        }

        const seriesData = seriesInfo.results;
        const seasons = seriesData.resource?.seasons || [];

        res.json({
            status: 200,
            success: true,
            data: {
                series: {
                    id: seriesData.subject.subjectId,
                    title: seriesData.subject.title,
                    description: seriesData.subject.description,
                    totalSeasons: seasons.length,
                    cover: seriesData.subject.cover?.url
                },
                seasons: seasons.map(season => ({
                    seasonNumber: season.se,
                    episodes: season.maxEp,
                    availableQualities: season.resolutions
                }))
            }
        });

    } catch (error) {
        console.error('Seasons error:', error);
        res.status(500).json({
            status: 500,
            success: false,
            error: 'Failed to fetch series seasons'
        });
    }
});

// Batch home content
app.get('/api/home', async (req, res) => {
    try {
        const [trending, action, comedy, drama] = await Promise.all([
            movieAPI.searchMovies('avengers'),
            movieAPI.searchMovies('action'),
            movieAPI.searchMovies('comedy'),
            movieAPI.searchMovies('drama')
        ]);

        res.json({
            status: 200,
            success: true,
            data: {
                trending: trending.results?.items?.slice(0, 12) || [],
                action: action.results?.items?.slice(0, 12) || [],
                comedy: comedy.results?.items?.slice(0, 12) || [],
                drama: drama.results?.items?.slice(0, 12) || []
            }
        });
    } catch (error) {
        console.error('Home content error:', error);
        res.status(500).json({
            status: 500,
            success: false,
            error: 'Failed to load home content'
        });
    }
});

// Genre endpoints
app.get('/api/trending', async (req, res) => {
    try {
        const data = await movieAPI.getTrending();
        res.json(data);
    } catch (error) {
        console.error('Trending error:', error);
        res.status(500).json({
            status: 500,
            success: false,
            error: 'Failed to fetch trending content'
        });
    }
});

app.get('/api/genre/:genre', async (req, res) => {
    try {
        const { genre } = req.params;
        const page = parseInt(req.query.page) || 1;
        
        if (!MOVIE_GENRES.includes(genre)) {
            return res.status(400).json({
                status: 400,
                success: false,
                error: 'Invalid genre',
                availableGenres: MOVIE_GENRES
            });
        }

        const data = await movieAPI.getMoviesByGenre(genre);
        res.json(data);
    } catch (error) {
        console.error('Genre error:', error);
        res.status(500).json({
            status: 500,
            success: false,
            error: `Failed to fetch ${req.params.genre} movies`
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        server: 'BERA FLIX',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        downloads: {
            active: Array.from(downloadHistory.values()).filter(d => d.status === 'downloading').length,
            completed: Array.from(downloadHistory.values()).filter(d => d.status === 'completed').length
        }
    });
});

// Service Worker
app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`
        const CACHE_NAME = 'bera-flix-v4';
        const API_CACHE_NAME = 'bera-flix-api-v3';
        
        self.addEventListener('install', (event) => {
            self.skipWaiting();
        });

        self.addEventListener('fetch', (event) => {
            if (event.request.url.includes('/api/') && !event.request.url.includes('/api/download/')) {
                event.respondWith(
                    fetch(event.request)
                        .then(response => {
                            const responseClone = response.clone();
                            caches.open(API_CACHE_NAME)
                                .then(cache => cache.put(event.request, responseClone));
                            return response;
                        })
                        .catch(() => caches.match(event.request))
                );
            }
        });
    `);
});

// Serve the main application
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>BERA FLIX - Premium Streaming</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: Arial, sans-serif; 
                    background: #0f0f0f; 
                    color: #fff; 
                    overflow-x: hidden;
                }
                .container { 
                    max-width: 1200px; 
                    margin: 0 auto; 
                    padding: 2rem;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 3rem;
                }
                .logo { 
                    color: #e50914; 
                    font-size: 4rem; 
                    font-weight: bold;
                    text-shadow: 0 0 20px rgba(229, 9, 20, 0.5);
                }
                .tagline {
                    color: #8c8c8c;
                    font-size: 1.2rem;
                    margin-top: 1rem;
                }
                .features {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                    margin: 3rem 0;
                }
                .feature-card {
                    background: #1a1a1a;
                    padding: 2rem;
                    border-radius: 10px;
                    border: 1px solid #333;
                }
                .feature-card h3 {
                    color: #e50914;
                    margin-bottom: 1rem;
                }
                .api-status {
                    background: #1a1a1a;
                    padding: 2rem;
                    border-radius: 10px;
                    margin: 2rem 0;
                }
                .status-online {
                    color: #00ff00;
                }
                .btn {
                    display: inline-block;
                    background: #e50914;
                    color: white;
                    padding: 1rem 2rem;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                    margin: 0.5rem;
                    transition: all 0.3s;
                }
                .btn:hover {
                    background: #f40612;
                    transform: translateY(-2px);
                }
                .download-demo {
                    background: #2d2d2d;
                    padding: 2rem;
                    border-radius: 10px;
                    margin: 2rem 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">BERA FLIX</div>
                    <div class="tagline">Premium Movie Streaming & Download Platform</div>
                </div>

                <div class="api-status">
                    <h2>🚀 Server Status: <span class="status-online">ONLINE</span></h2>
                    <p>Backend API server running successfully with real download functionality</p>
                </div>

                <div class="features">
                    <div class="feature-card">
                        <h3>🎬 Real Movie Streaming</h3>
                        <p>Stream thousands of movies and TV shows through Gifted Movies API integration</p>
                    </div>
                    <div class="feature-card">
                        <h3>📥 Direct Downloads</h3>
                        <p>Download movies and episodes in multiple qualities (360p, 480p, 720p)</p>
                    </div>
                    <div class="feature-card">
                        <h3>📱 Branded Downloads</h3>
                        <p>All downloads include BERA FLIX branding in filenames</p>
                    </div>
                </div>

                <div class="download-demo">
                    <h3>🔧 API Endpoints Available:</h3>
                    <div style="margin: 1rem 0;">
                        <a href="/api/search/avengers" class="btn" target="_blank">Test Search</a>
                        <a href="/api/trending" class="btn" target="_blank">Trending Movies</a>
                        <a href="/health" class="btn" target="_blank">Health Check</a>
                    </div>
                    <p><strong>Download Example:</strong> Use the API to get sources and initiate downloads with branded filenames</p>
                </div>

                <div style="text-align: center; margin-top: 3rem; color: #8c8c8c;">
                    <p>Powered by Gifted Movies API | BERA FLIX v2.0.0</p>
                </div>
            </div>

            <script>
                // Register service worker
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('/sw.js')
                        .then(reg => console.log('SW registered'))
                        .catch(err => console.log('SW error:', err));
                }

                // Example of how to use download functionality
                async function testDownload() {
                    try {
                        // First get movie info and sources
                        const searchResponse = await fetch('/api/search/black panther');
                        const searchData = await searchResponse.json();
                        
                        if (searchData.success && searchData.results.items.length > 0) {
                            const movie = searchData.results.items[0];
                            console.log('Found movie:', movie.title);
                            
                            // Get download sources
                            const sourcesResponse = await fetch(\`/api/\${movie.subjectId}/download-sources\`);
                            const sourcesData = await sourcesResponse.json();
                            
                            if (sourcesData.success) {
                                console.log('Available sources:', sourcesData.data.sources);
                                // You can now initiate download using the provided download_url
                            }
                        }
                    } catch (error) {
                        console.error('Test failed:', error);
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// Error handling
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        status: 500,
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        status: 404,
        success: false,
        error: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    🎬 BERA FLIX SERVER STARTED!
    
    📍 Local: http://localhost:${PORT}
    🌐 Network: http://0.0.0.0:${PORT}
    
    ⚡ Features:
    ✅ Real API Integration
    ✅ Movie & Series Downloads  
    ✅ Multiple Quality Support
    ✅ Branded Download Names
    ✅ Progress Tracking
    ✅ TV Show Episode Support
    
    📊 Endpoints:
    🔍 /api/search/{query}
    📄 /api/info/{id}
    💾 /api/sources/{id}
    📥 /api/download/{movieId}
    📈 /api/{movieId}/download-sources
    📺 /api/tv/{seriesId}/seasons
    
    🚀 Ready for production!
    `);
});

module.exports = app;
