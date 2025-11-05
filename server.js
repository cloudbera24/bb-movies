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

  async downloadDirect(videoURL, type = 'mp4', maxAttempts = 3) {
    const endpoint = `${this.baseURL}${type === 'mp3' ? YOUTUBE_APIS.endpoints.mp3 : YOUTUBE_APIS.endpoints.mp4}?apikey=${this.apiKey}&url=${encodeURIComponent(videoURL)}`;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        console.log(`Direct Download Attempt ${attempt + 1}`);
        
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (response.ok && data) {
          return {
            success: true,
            data: data,
            attempt: attempt + 1
          };
        }
      } catch (error) {
        console.warn(`Direct Download Attempt ${attempt + 1} failed:`, error.message);
        
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
  }
}

const youtubeAPI = new YouTubeAPI();

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/manifest.json', (req, res) => {
  res.json({
    "name": "Beraflix - Stream & Download Movies & YouTube",
    "short_name": "Beraflix",
    "description": "Stream and download HD movies, TV shows, YouTube videos and more",
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

app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    const CACHE_NAME = 'beraflix-v4';
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

app.get('/api/youtube/download/direct', async (req, res) => {
  try {
    const { url, type = 'mp4' } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'YouTube URL is required'
      });
    }
    
    console.log('Direct YouTube Download:', url, type);
    
    const result = await youtubeAPI.downloadDirect(url, type);
    
    if (result.success) {
      res.json({
        success: true,
        results: result.data,
        source: 'youtube-direct',
        attempt: result.attempt
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        attempts: result.attempts
      });
    }
  } catch (error) {
    console.error('Error direct downloading YouTube:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download YouTube video'
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

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Beraflix - Premium Streaming Platform',
    movie_api: MOVIE_API_BASE,
    youtube_api: YOUTUBE_APIS.baseURL,
    features: ['HD Streaming', 'Offline Downloads', '4K Content', 'YouTube Downloader', 'Premium Experience', 'Multiple Categories', 'PWA Support', 'Mobile Friendly']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎬 Beraflix Premium Server running on port ${PORT}`);
  console.log(`📍 Visit: http://localhost:${PORT}`);
  console.log(`🎯 Movie API: ${MOVIE_API_BASE}`);
  console.log(`📺 YouTube API: ${YOUTUBE_APIS.baseURL}`);
  console.log(`✨ Brand: BERAFLIX - The Ultimate Streaming Experience`);
  console.log(`💫 Features: HD Streaming • Offline Downloads • 4K Content • YouTube Downloader`);
  console.log(`📱 PWA: Installable App • Offline Support • Mobile Optimized`);
});

module.exports = app;
