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
app.use(express.static('.')); // Serve static files from current directory

// API Proxy endpoints (keep the same as before)
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

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle all other routes
app.get('*', (req, res) => {
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`🎬 BB Movies server running on port ${PORT}`);
    console.log(`🚀 Visit: http://localhost:${PORT}`);
    console.log(`🔍 Search API: http://localhost:${PORT}/api/search/{query}`);
    console.log(`📖 Info API: http://localhost:${PORT}/api/info/{id}`);
    console.log(`💾 Sources API: http://localhost:${PORT}/api/sources/{id}`);
    console.log(`🎥 Streaming API: http://localhost:${PORT}/api/stream/{id}`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
});
