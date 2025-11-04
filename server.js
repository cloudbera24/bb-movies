require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const cors = require('cors');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 8080;

// API Base URLs
const MOVIE_API_BASE = 'https://movieapi.giftedtech.co.ke/api';
const GIFTED_API_BASE = 'https://api.giftedtech.co.ke/api';
const API_KEY = 'gifted';

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
    "description": "Stream movies, download YouTube videos, search music, and more",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#0a0a0a",
    "theme_color": "#e50914",
    "orientation": "any",
    "icons": [
      {
        "src": "/icon-192.png",
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": "/icon-512.png",
        "sizes": "512x512",
        "type": "image/png"
      }
    ],
    "categories": ["entertainment", "movies", "video", "music"]
  });
});

// Service Worker
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    const CACHE_NAME = 'beraflix-v1';
    self.addEventListener('install', (event) => {
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then((cache) => cache.addAll(['/']))
      );
    });
    self.addEventListener('fetch', (event) => {
      event.respondWith(
        caches.match(event.request)
          .then((response) => response || fetch(event.request))
      );
    });
  `);
});

// Serve main HTML
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Beraflix - Movies, YouTube & Music</title>
    <meta name="theme-color" content="#e50914">
    <link rel="manifest" href="/manifest.json">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0a0a0a; color: white; font-family: Arial, sans-serif; }
        .navbar { background: #141414; padding: 1rem; position: fixed; width: 100%; top: 0; }
        .nav-logo { color: #e50914; font-size: 2rem; font-weight: bold; }
        .nav-tabs { display: flex; gap: 1rem; list-style: none; }
        .nav-tab { color: white; text-decoration: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; }
        .nav-tab.active { background: #e50914; }
        .main-content { margin-top: 80px; padding: 2rem; }
        .section { display: none; }
        .section.active { display: block; }
        .search-container { background: #1a1a1a; padding: 2rem; border-radius: 10px; margin: 1rem 0; }
        .search-input { width: 70%; padding: 1rem; border: none; border-radius: 5px; }
        .search-btn { background: #e50914; color: white; border: none; padding: 1rem 2rem; border-radius: 5px; cursor: pointer; }
        .content-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; margin-top: 1rem; }
        .content-card { background: #1a1a1a; border-radius: 10px; padding: 1rem; }
        .card-image { width: 100%; height: 150px; object-fit: cover; border-radius: 5px; }
        .card-title { margin: 0.5rem 0; font-weight: bold; }
        .card-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
        .action-btn { padding: 0.5rem 1rem; border: none; border-radius: 5px; cursor: pointer; }
        .watch-btn { background: #e50914; color: white; }
        .download-btn { background: #ffd700; color: black; }
        .loading { text-align: center; padding: 2rem; }
        @media (max-width: 768px) {
            .nav-tabs { display: none; }
            .search-input { width: 100%; margin-bottom: 1rem; }
            .content-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="nav-logo">BERAFLIX</div>
        <ul class="nav-tabs">
            <li><a class="nav-tab active" data-tab="movies">Movies</a></li>
            <li><a class="nav-tab" data-tab="youtube">YouTube</a></li>
            <li><a class="nav-tab" data-tab="music">Music</a></li>
            <li><a class="nav-tab" data-tab="torrents">Torrents</a></li>
        </ul>
    </nav>

    <main class="main-content">
        <!-- Movies Section -->
        <section id="moviesSection" class="section active">
            <h2>🎬 Movies & TV Shows</h2>
            <div class="search-container">
                <input type="text" class="search-input" id="movieSearchInput" placeholder="Search for movies...">
                <button class="search-btn" id="movieSearchBtn">Search Movies</button>
                <div class="content-grid" id="moviesResults"></div>
            </div>
        </section>

        <!-- YouTube Section -->
        <section id="youtubeSection" class="section">
            <h2>🎥 YouTube Tools</h2>
            <div class="search-container">
                <input type="text" class="search-input" id="youtubeSearchInput" placeholder="Search YouTube...">
                <button class="search-btn" id="youtubeSearchBtn">Search YouTube</button>
                <div class="content-grid" id="youtubeResults"></div>
            </div>
            <div class="search-container">
                <input type="text" class="search-input" id="youtubeUrlInput" placeholder="Paste YouTube URL...">
                <button class="search-btn" id="youtubeDownloadBtn">Download</button>
                <div id="youtubeDownloadOptions"></div>
            </div>
        </section>

        <!-- Music Section -->
        <section id="musicSection" class="section">
            <h2>🎵 Music Search</h2>
            <div class="search-container">
                <input type="text" class="search-input" id="musicSearchInput" placeholder="Search for songs...">
                <button class="search-btn" id="musicSearchBtn">Search Music</button>
                <div class="content-grid" id="musicResults"></div>
            </div>
        </section>

        <!-- Torrents Section -->
        <section id="torrentsSection" class="section">
            <h2>📥 Torrent Search</h2>
            <div class="search-container">
                <input type="text" class="search-input" id="torrentSearchInput" placeholder="Search for torrents...">
                <button class="search-btn" id="torrentSearchBtn">Search Torrents</button>
                <div class="content-grid" id="torrentResults"></div>
            </div>
        </section>
    </main>

    <script>
        let currentTab = 'movies';
        const sections = document.querySelectorAll('.section');
        const navTabs = document.querySelectorAll('.nav-tab');

        // Tab navigation
        navTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.getAttribute('data-tab');
                switchTab(tabName);
            });
        });

        function switchTab(tabName) {
            currentTab = tabName;
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(tabName + 'Section').classList.add('active');
            navTabs.forEach(tab => tab.classList.remove('active'));
            document.querySelector('.nav-tab[data-tab="' + tabName + '"]').classList.add('active');
        }

        // Search handlers
        document.getElementById('movieSearchBtn').addEventListener('click', searchMovies);
        document.getElementById('youtubeSearchBtn').addEventListener('click', searchYouTube);
        document.getElementById('youtubeDownloadBtn').addEventListener('click', handleYouTubeDownload);
        document.getElementById('musicSearchBtn').addEventListener('click', searchMusic);
        document.getElementById('torrentSearchBtn').addEventListener('click', searchTorrents);

        // API Functions
        async function searchMovies() {
            const query = document.getElementById('movieSearchInput').value;
            const container = document.getElementById('moviesResults');
            container.innerHTML = '<div class="loading">Searching movies...</div>';

            try {
                const response = await fetch('/api/search/movies?query=' + encodeURIComponent(query));
                const data = await response.json();
                
                if (data.success && data.results.length > 0) {
                    let html = '';
                    data.results.forEach(movie => {
                        html += '<div class="content-card">';
                        html += '<img src="' + (movie.cover?.url || '') + '" class="card-image">';
                        html += '<div class="card-title">' + (movie.title || 'Unknown') + '</div>';
                        html += '<div class="card-actions">';
                        html += '<button class="action-btn watch-btn" onclick="playMovie(\\'' + (movie.subjectId || '') + '\\')">Watch</button>';
                        html += '<button class="action-btn download-btn" onclick="downloadMovie(\\'' + (movie.subjectId || '') + '\\')">Download</button>';
                        html += '</div></div>';
                    });
                    container.innerHTML = html;
                } else {
                    container.innerHTML = '<div class="loading">No movies found</div>';
                }
            } catch (error) {
                container.innerHTML = '<div class="loading">Search failed</div>';
            }
        }

        async function searchYouTube() {
            const query = document.getElementById('youtubeSearchInput').value;
            const container = document.getElementById('youtubeResults');
            container.innerHTML = '<div class="loading">Searching YouTube...</div>';

            try {
                const response = await fetch('/api/search/youtube?query=' + encodeURIComponent(query));
                const data = await response.json();
                
                if (data.success && data.results.length > 0) {
                    let html = '';
                    data.results.forEach(video => {
                        html += '<div class="content-card">';
                        html += '<img src="' + (video.thumbnail || '') + '" class="card-image">';
                        html += '<div class="card-title">' + (video.title || 'Unknown') + '</div>';
                        html += '<div class="card-actions">';
                        html += '<button class="action-btn watch-btn" onclick="playYouTube(\\'' + (video.videoId || '') + '\\')">Watch</button>';
                        html += '<button class="action-btn download-btn" onclick="downloadYouTube(\\'' + (video.videoId || '') + '\\')">Download</button>';
                        html += '</div></div>';
                    });
                    container.innerHTML = html;
                } else {
                    container.innerHTML = '<div class="loading">No videos found</div>';
                }
            } catch (error) {
                container.innerHTML = '<div class="loading">Search failed</div>';
            }
        }

        async function handleYouTubeDownload() {
            const url = document.getElementById('youtubeUrlInput').value;
            const container = document.getElementById('youtubeDownloadOptions');
            container.innerHTML = '<div class="loading">Processing...</div>';

            try {
                const response = await fetch('/api/download/youtube?url=' + encodeURIComponent(url));
                const data = await response.json();
                
                if (data.success) {
                    container.innerHTML = '<div class="content-card">';
                    container.innerHTML += '<div class="card-title">' + data.title + '</div>';
                    container.innerHTML += '<div class="card-actions">';
                    container.innerHTML += '<button class="action-btn download-btn" onclick="downloadFile(\\'' + data.mp3_url + '\\', \\'' + data.title + '.mp3\\')">MP3</button>';
                    container.innerHTML += '<button class="action-btn download-btn" onclick="downloadFile(\\'' + data.mp4_url + '\\', \\'' + data.title + '.mp4\\')">MP4</button>';
                    container.innerHTML += '</div></div>';
                } else {
                    container.innerHTML = '<div class="loading">Download failed</div>';
                }
            } catch (error) {
                container.innerHTML = '<div class="loading">Download failed</div>';
            }
        }

        async function searchMusic() {
            const query = document.getElementById('musicSearchInput').value;
            const container = document.getElementById('musicResults');
            container.innerHTML = '<div class="loading">Searching music...</div>';

            try {
                const response = await fetch('/api/search/music?query=' + encodeURIComponent(query));
                const data = await response.json();
                
                if (data.success && data.results.length > 0) {
                    let html = '';
                    data.results.forEach(track => {
                        html += '<div class="content-card">';
                        html += '<img src="' + (track.thumbnail || '') + '" class="card-image">';
                        html += '<div class="card-title">' + (track.title || 'Unknown') + '</div>';
                        html += '<div class="card-actions">';
                        html += '<button class="action-btn watch-btn" onclick="playMusic(\\'' + (track.id || '') + '\\')">Play</button>';
                        html += '<button class="action-btn download-btn" onclick="downloadMusic(\\'' + (track.id || '') + '\\')">Download</button>';
                        html += '</div></div>';
                    });
                    container.innerHTML = html;
                } else {
                    container.innerHTML = '<div class="loading">No music found</div>';
                }
            } catch (error) {
                container.innerHTML = '<div class="loading">Search failed</div>';
            }
        }

        async function searchTorrents() {
            const query = document.getElementById('torrentSearchInput').value;
            const container = document.getElementById('torrentResults');
            container.innerHTML = '<div class="loading">Searching torrents...</div>';

            try {
                const response = await fetch('/api/search/torrents?query=' + encodeURIComponent(query));
                const data = await response.json();
                
                if (data.success && data.results.length > 0) {
                    let html = '';
                    data.results.forEach(torrent => {
                        html += '<div class="content-card">';
                        html += '<div class="card-title">' + (torrent.title || 'Unknown') + '</div>';
                        html += '<div class="card-actions">';
                        html += '<button class="action-btn watch-btn" onclick="downloadTorrent(\\'' + (torrent.magnet || '') + '\\')">Magnet</button>';
                        html += '<button class="action-btn download-btn" onclick="downloadTorrentFile(\\'' + (torrent.url || '') + '\\')">Torrent</button>';
                        html += '</div></div>';
                    });
                    container.innerHTML = html;
                } else {
                    container.innerHTML = '<div class="loading">No torrents found</div>';
                }
            } catch (error) {
                container.innerHTML = '<div class="loading">Search failed</div>';
            }
        }

        // Utility functions
        function downloadFile(url, filename) {
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
        }

        function playMovie(movieId) {
            alert('Playing movie: ' + movieId);
        }

        function downloadMovie(movieId) {
            alert('Downloading movie: ' + movieId);
        }

        function playYouTube(videoId) {
            window.open('https://www.youtube.com/watch?v=' + videoId, '_blank');
        }

        function downloadYouTube(videoId) {
            alert('Downloading YouTube video: ' + videoId);
        }

        function playMusic(trackId) {
            alert('Playing music: ' + trackId);
        }

        function downloadMusic(trackId) {
            alert('Downloading music: ' + trackId);
        }

        function downloadTorrent(magnetUrl) {
            window.open(magnetUrl, '_blank');
        }

        function downloadTorrentFile(torrentUrl) {
            downloadFile(torrentUrl, 'download.torrent');
        }
    </script>
</body>
</html>
  `);
});

// API Routes
app.get('/api/search/movies', async (req, res) => {
  try {
    const query = req.query.query;
    const response = await fetch(MOVIE_API_BASE + '/search/' + encodeURIComponent(query));
    const data = await response.json();
    
    if (data.status === 200 && data.results && data.results.items) {
      res.json({ success: true, results: data.results.items.slice(0, 12) });
    } else {
      res.json({ success: false, results: [] });
    }
  } catch (error) {
    res.json({ success: false, results: [] });
  }
});

app.get('/api/search/youtube', async (req, res) => {
  try {
    const query = req.query.query;
    const response = await fetch(GIFTED_API_BASE + '/youtube-search?apikey=' + API_KEY + '&q=' + encodeURIComponent(query));
    const data = await response.json();
    res.json({ success: true, results: data.results || [] });
  } catch (error) {
    res.json({ success: false, results: [] });
  }
});

app.get('/api/download/youtube', async (req, res) => {
  try {
    const url = req.query.url;
    const mp3Response = await fetch(GIFTED_API_BASE + '/download/ytmp3?apikey=' + API_KEY + '&url=' + encodeURIComponent(url));
    const mp3Data = await mp3Response.json();
    
    const mp4Response = await fetch(GIFTED_API_BASE + '/download/ytmp4?apikey=' + API_KEY + '&url=' + encodeURIComponent(url));
    const mp4Data = await mp4Response.json();
    
    if (mp3Data.status && mp4Data.status) {
      res.json({ 
        success: true,
        title: mp3Data.title || 'YouTube Video',
        mp3_url: mp3Data.download_url,
        mp4_url: mp4Data.download_url
      });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    res.json({ success: false });
  }
});

app.get('/api/search/music', async (req, res) => {
  try {
    const query = req.query.query;
    const response = await fetch(GIFTED_API_BASE + '/search/spotifysearch?apikey=' + API_KEY + '&query=' + encodeURIComponent(query));
    const data = await response.json();
    res.json({ success: true, results: data.results || [] });
  } catch (error) {
    res.json({ success: false, results: [] });
  }
});

app.get('/api/search/torrents', async (req, res) => {
  try {
    const query = req.query.query;
    const response = await fetch(GIFTED_API_BASE + '/search/yts?apikey=' + API_KEY + '&query=' + encodeURIComponent(query));
    const data = await response.json();
    res.json({ success: true, results: data.results || [] });
  } catch (error) {
    res.json({ success: false, results: [] });
  }
});

app.get('/api/download/advanced-youtube', async (req, res) => {
  try {
    const url = req.query.url;
    const response = await fetch(GIFTED_API_BASE + '/download/ytdlv3?apikey=' + API_KEY + '&url=' + encodeURIComponent(url));
    const data = await response.json();
    res.json({ success: true, data: data });
  } catch (error) {
    res.json({ success: false });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Beraflix Ultimate',
    features: ['Movies', 'YouTube', 'Music', 'Torrents']
  });
});

app.listen(PORT, () => {
  console.log('🚀 Beraflix running on port ' + PORT);
});
