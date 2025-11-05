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

// YouTube APIs Configuration
const YOUTUBE_APIS = {
  baseURL: 'https://api.giftedtech.co.ke/api',
  apiKey: 'gifted',
  endpoints: {
    mp3: '/download/ytmp3',
    mp4: '/download/ytmp4',
    search: '/search/yts'
  }
};

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'beraflix_super_secret_key_2024';

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Enhanced YouTube API Class with Search-to-Download functionality
class YouTubeAPI {
  constructor() {
    this.baseURL = YOUTUBE_APIS.baseURL;
    this.apiKey = YOUTUBE_APIS.apiKey;
  }

  // Search YouTube videos
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

  // Download YouTube video by search term
  async downloadBySearch(searchTerm, type = 'mp4', maxAttempts = 3) {
    try {
      // First search for videos
      const searchResult = await this.searchVideos(searchTerm);
      
      if (!searchResult.success || !searchResult.videos || searchResult.videos.length === 0) {
        return {
          success: false,
          error: 'No videos found for search term'
        };
      }

      // Get the first video result
      const video = searchResult.videos[0];
      const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
      
      console.log(`Found video: ${video.title} - ${videoUrl}`);

      // Now download the video
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

// Initialize YouTube API
const youtubeAPI = new YouTubeAPI();

// Serve main HTML
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Beraflix - Stream & Download</title>
    <style>
        body {
            background: #0a0a0a;
            color: white;
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .youtube-section {
            background: rgba(255,0,0,0.1);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border: 2px solid #ff0000;
        }
        .search-box {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        .search-input {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 5px;
            background: rgba(255,255,255,0.1);
            color: white;
        }
        .search-btn {
            padding: 12px 24px;
            background: #ff0000;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        .format-buttons {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        .format-btn {
            padding: 10px 20px;
            background: rgba(255,255,255,0.1);
            color: white;
            border: 1px solid #ccc;
            border-radius: 5px;
            cursor: pointer;
        }
        .format-btn.active {
            background: #ff0000;
            border-color: #ff0000;
        }
        .results {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .video-card {
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            padding: 15px;
        }
        .video-thumbnail {
            width: 100%;
            height: 180px;
            object-fit: cover;
            border-radius: 5px;
        }
        .video-title {
            font-weight: bold;
            margin: 10px 0;
        }
        .download-buttons {
            display: flex;
            gap: 10px;
        }
        .download-btn {
            flex: 1;
            padding: 8px;
            background: #ff0000;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        .download-btn.mp3 {
            background: #00ff88;
        }
        .loading {
            text-align: center;
            padding: 40px;
        }
        .error {
            color: #ff4444;
            text-align: center;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎬 Beraflix - YouTube Downloader</h1>
        
        <div class="youtube-section">
            <h2>🔍 Search & Download YouTube Videos</h2>
            
            <div class="search-box">
                <input type="text" class="search-input" id="searchInput" placeholder="Enter search terms (e.g., music, movies, tutorials)...">
                <button class="search-btn" id="searchBtn">Search YouTube</button>
            </div>

            <div class="format-buttons">
                <button class="format-btn active" data-format="mp4">🎥 MP4 Video</button>
                <button class="format-btn" data-format="mp3">🎵 MP3 Audio</button>
            </div>

            <div class="results" id="results">
                <div class="loading" id="loading" style="display: none;">
                    🔄 Searching YouTube...
                </div>
            </div>
        </div>
    </div>

    <script>
        let currentFormat = 'mp4';
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const results = document.getElementById('results');
        const loading = document.getElementById('loading');
        const formatButtons = document.querySelectorAll('.format-btn');

        // Format selection
        formatButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                formatButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentFormat = e.target.getAttribute('data-format');
            });
        });

        // Search function
        searchBtn.addEventListener('click', searchYouTube);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchYouTube();
        });

        async function searchYouTube() {
            const query = searchInput.value.trim();
            if (!query) {
                alert('Please enter search terms');
                return;
            }

            loading.style.display = 'block';
            results.innerHTML = '';

            try {
                const response = await fetch('/api/youtube/search/' + encodeURIComponent(query));
                const data = await response.json();

                loading.style.display = 'none';

                if (data.success && data.results && data.results.items) {
                    displayResults(data.results.items);
                } else {
                    results.innerHTML = '<div class="error">No videos found for "' + query + '"</div>';
                }
            } catch (error) {
                loading.style.display = 'none';
                results.innerHTML = '<div class="error">Error searching YouTube</div>';
            }
        }

        function displayResults(videos) {
            if (!videos.length) {
                results.innerHTML = '<div class="error">No videos found</div>';
                return;
            }

            results.innerHTML = videos.map(video => `
                <div class="video-card">
                    <img src="${video.thumbnail}" class="video-thumbnail" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMwMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMxNDE0MTQiLz48dGV4dCB4PSIxNTAiIHk9IjkwIiBmaWxsPSIjOEM4QzhDIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPllPVVRVQkUgVklERU88L3RleHQ+PC9zdmc+'">
                    <div class="video-title">${video.title}</div>
                    <div style="color: #ccc; font-size: 14px; margin-bottom: 10px;">
                        ${video.duration || 'N/A'} • ${video.views || 'N/A'} views
                    </div>
                    <div class="download-buttons">
                        <button class="download-btn" onclick="downloadVideo('${video.id}', '${video.title.replace(/'/g, "\\'")}', 'mp4')">
                            📥 MP4
                        </button>
                        <button class="download-btn mp3" onclick="downloadVideo('${video.id}', '${video.title.replace(/'/g, "\\'")}', 'mp3')">
                            🎵 MP3
                        </button>
                    </div>
                </div>
            `).join('');
        }

        async function downloadVideo(videoId, title, type) {
            try {
                const response = await fetch('/api/youtube/download/search?query=' + encodeURIComponent(title) + '&type=' + type);
                const data = await response.json();

                if (data.success && data.results && data.results.download) {
                    const downloadData = data.results.download;
                    
                    // Create download link
                    if (downloadData.url || downloadData.downloadUrl) {
                        const downloadUrl = downloadData.url || downloadData.downloadUrl;
                        const link = document.createElement('a');
                        link.href = downloadUrl;
                        link.download = 'Beraflix_' + title.replace(/[^a-z0-9]/gi, '_') + '.' + type;
                        link.style.display = 'none';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        alert('Download started for: ' + title);
                    } else {
                        alert('Download link not available');
                    }
                } else {
                    alert('Download failed: ' + (data.error || 'Unknown error'));
                }
            } catch (error) {
                alert('Download error: ' + error.message);
            }
        }

        // Make function global
        window.downloadVideo = downloadVideo;
    </script>
</body>
</html>
  `);
});

// API Routes - Only the YouTube APIs you wanted
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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Beraflix YouTube Downloader',
    apis: ['YouTube Search', 'YouTube MP3 Download', 'YouTube MP4 Download'],
    usage: 'Search by keywords - no URLs needed!'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎬 Beraflix YouTube Downloader running on port ${PORT}`);
  console.log(`📍 Visit: http://localhost:${PORT}`);
  console.log(`🔍 Search YouTube by typing keywords`);
  console.log(`📥 Download MP3/MP4 without needing URLs`);
  console.log(`✨ APIs: Search + MP3 Download + MP4 Download`);
});

module.exports = app;
