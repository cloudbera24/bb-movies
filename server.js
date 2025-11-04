require('dotenv').config();
const express = require('express');
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
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0a0a0a; color: white; font-family: Arial, sans-serif; }
        .navbar { background: #141414; padding: 1rem; position: fixed; width: 100%; top: 0; z-index: 1000; }
        .nav-logo { color: #e50914; font-size: 2rem; font-weight: bold; }
        .nav-tabs { display: flex; gap: 1rem; list-style: none; }
        .nav-tab { color: white; text-decoration: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; }
        .nav-tab.active { background: #e50914; }
        .main-content { margin-top: 80px; padding: 2rem; }
        .section { display: none; }
        .section.active { display: block; }
        .search-container { background: #1a1a1a; padding: 2rem; border-radius: 10px; margin: 1rem 0; }
        .search-input { width: 70%; padding: 1rem; border: none; border-radius: 5px; background: #2a2a2a; color: white; }
        .search-btn { background: #e50914; color: white; border: none; padding: 1rem 2rem; border-radius: 5px; cursor: pointer; margin-left: 1rem; }
        .content-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; margin-top: 1rem; }
        .content-card { background: #1a1a1a; border-radius: 10px; padding: 1rem; }
        .card-image { width: 100%; height: 150px; object-fit: cover; border-radius: 5px; background: #2a2a2a; }
        .card-title { margin: 0.5rem 0; font-weight: bold; }
        .card-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
        .action-btn { padding: 0.5rem 1rem; border: none; border-radius: 5px; cursor: pointer; }
        .watch-btn { background: #e50914; color: white; }
        .download-btn { background: #ffd700; color: black; }
        .loading { text-align: center; padding: 2rem; }
        .error { color: #ff4444; text-align: center; padding: 1rem; }
        @media (max-width: 768px) {
            .nav-tabs { display: none; }
            .search-input { width: 100%; margin-bottom: 1rem; }
            .search-btn { margin-left: 0; width: 100%; }
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

        // Add enter key support
        document.getElementById('movieSearchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchMovies();
        });
        document.getElementById('youtubeSearchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchYouTube();
        });
        document.getElementById('musicSearchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchMusic();
        });
        document.getElementById('torrentSearchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchTorrents();
        });

        // API Functions
        async function searchMovies() {
            const query = document.getElementById('movieSearchInput').value.trim();
            if (!query) return alert('Please enter a search query');
            
            const container = document.getElementById('moviesResults');
            container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Searching movies...</div>';

            try {
                const response = await fetch('/api/search/movies?query=' + encodeURIComponent(query));
                const data = await response.json();
                console.log('Movie API Response:', data);
                
                if (data.success && data.results && data.results.length > 0) {
                    let html = '';
                    data.results.forEach(movie => {
                        const title = movie.title || 'Unknown Title';
                        const cover = movie.cover?.url || '';
                        const subjectId = movie.subjectId || '';
                        
                        html += '<div class="content-card">';
                        if (cover) {
                            html += '<img src="' + cover + '" class="card-image" onerror="this.style.display=\\'none\\'">';
                        } else {
                            html += '<div class="card-image" style="display: flex; align-items: center; justify-content: center; background: #e50914;">';
                            html += '<i class="fas fa-film" style="font-size: 2rem;"></i>';
                            html += '</div>';
                        }
                        html += '<div class="card-title">' + title + '</div>';
                        html += '<div class="card-actions">';
                        html += '<button class="action-btn watch-btn" onclick="playMovie(\\'' + subjectId + '\\')">Watch</button>';
                        html += '<button class="action-btn download-btn" onclick="downloadMovie(\\'' + subjectId + '\\')">Download</button>';
                        html += '</div></div>';
                    });
                    container.innerHTML = html;
                } else {
                    container.innerHTML = '<div class="error">No movies found. Try a different search.</div>';
                }
            } catch (error) {
                console.error('Movie search error:', error);
                container.innerHTML = '<div class="error">Search failed. Please try again.</div>';
            }
        }

        async function searchYouTube() {
            const query = document.getElementById('youtubeSearchInput').value.trim();
            if (!query) return alert('Please enter a search query');
            
            const container = document.getElementById('youtubeResults');
            container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Searching YouTube...</div>';

            try {
                const response = await fetch('/api/search/youtube?query=' + encodeURIComponent(query));
                const data = await response.json();
                console.log('YouTube API Response:', data);
                
                if (data.success && data.results && data.results.length > 0) {
                    let html = '';
                    data.results.forEach(video => {
                        const title = video.title || 'Unknown Video';
                        const thumbnail = video.thumbnail || '';
                        const videoId = video.videoId || '';
                        
                        html += '<div class="content-card">';
                        if (thumbnail) {
                            html += '<img src="' + thumbnail + '" class="card-image">';
                        } else {
                            html += '<div class="card-image" style="display: flex; align-items: center; justify-content: center; background: #ff0000;">';
                            html += '<i class="fab fa-youtube" style="font-size: 2rem;"></i>';
                            html += '</div>';
                        }
                        html += '<div class="card-title">' + title + '</div>';
                        html += '<div class="card-actions">';
                        html += '<button class="action-btn watch-btn" onclick="playYouTube(\\'' + videoId + '\\')">Watch</button>';
                        html += '<button class="action-btn download-btn" onclick="downloadYouTubeVideo(\\'' + videoId + '\\', \\'' + title.replace(/'/g, "\\\\'") + '\\')">Download</button>';
                        html += '</div></div>';
                    });
                    container.innerHTML = html;
                } else {
                    container.innerHTML = '<div class="error">No YouTube videos found. Try a different search.</div>';
                }
            } catch (error) {
                console.error('YouTube search error:', error);
                container.innerHTML = '<div class="error">Search failed. Please try again.</div>';
            }
        }

        async function handleYouTubeDownload() {
            const url = document.getElementById('youtubeUrlInput').value.trim();
            if (!url) return alert('Please enter a YouTube URL');
            
            const container = document.getElementById('youtubeDownloadOptions');
            container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Processing download...</div>';

            try {
                const response = await fetch('/api/download/youtube?url=' + encodeURIComponent(url));
                const data = await response.json();
                console.log('YouTube Download Response:', data);
                
                if (data.success) {
                    container.innerHTML = '<div class="content-card">';
                    container.innerHTML += '<div class="card-title">' + data.title + '</div>';
                    container.innerHTML += '<div class="card-actions">';
                    container.innerHTML += '<button class="action-btn download-btn" onclick="downloadFile(\\'' + data.mp3_url + '\\', \\'' + data.title.replace(/[^a-zA-Z0-9]/g, '_') + '.mp3\\')">Download MP3</button>';
                    container.innerHTML += '<button class="action-btn download-btn" onclick="downloadFile(\\'' + data.mp4_url + '\\', \\'' + data.title.replace(/[^a-zA-Z0-9]/g, '_') + '.mp4\\')">Download MP4</button>';
                    container.innerHTML += '</div></div>';
                } else {
                    container.innerHTML = '<div class="error">Download failed. Please check the URL and try again.</div>';
                }
            } catch (error) {
                console.error('YouTube download error:', error);
                container.innerHTML = '<div class="error">Download failed. Please try again.</div>';
            }
        }

        async function searchMusic() {
            const query = document.getElementById('musicSearchInput').value.trim();
            if (!query) return alert('Please enter a search query');
            
            const container = document.getElementById('musicResults');
            container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Searching music...</div>';

            try {
                const response = await fetch('/api/search/music?query=' + encodeURIComponent(query));
                const data = await response.json();
                console.log('Music API Response:', data);
                
                if (data.success && data.results && data.results.length > 0) {
                    let html = '';
                    data.results.forEach(track => {
                        const title = track.title || 'Unknown Track';
                        const artist = track.artist || 'Unknown Artist';
                        const thumbnail = track.thumbnail || '';
                        const trackId = track.id || '';
                        
                        html += '<div class="content-card">';
                        if (thumbnail) {
                            html += '<img src="' + thumbnail + '" class="card-image">';
                        } else {
                            html += '<div class="card-image" style="display: flex; align-items: center; justify-content: center; background: #1db954;">';
                            html += '<i class="fas fa-music" style="font-size: 2rem;"></i>';
                            html += '</div>';
                        }
                        html += '<div class="card-title">' + title + '</div>';
                        html += '<div style="color: #ccc; font-size: 0.9rem;">' + artist + '</div>';
                        html += '<div class="card-actions">';
                        html += '<button class="action-btn watch-btn" onclick="playMusic(\\'' + trackId + '\\')">Play</button>';
                        html += '<button class="action-btn download-btn" onclick="downloadMusic(\\'' + trackId + '\\', \\'' + title.replace(/'/g, "\\\\'") + '\\')">Download</button>';
                        html += '</div></div>';
                    });
                    container.innerHTML = html;
                } else {
                    container.innerHTML = '<div class="error">No music found. Try a different search.</div>';
                }
            } catch (error) {
                console.error('Music search error:', error);
                container.innerHTML = '<div class="error">Search failed. Please try again.</div>';
            }
        }

        async function searchTorrents() {
            const query = document.getElementById('torrentSearchInput').value.trim();
            if (!query) return alert('Please enter a search query');
            
            const container = document.getElementById('torrentResults');
            container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Searching torrents...</div>';

            try {
                const response = await fetch('/api/search/torrents?query=' + encodeURIComponent(query));
                const data = await response.json();
                console.log('Torrent API Response:', data);
                
                if (data.success && data.results && data.results.length > 0) {
                    let html = '';
                    data.results.forEach(torrent => {
                        const title = torrent.title || 'Unknown Torrent';
                        const size = torrent.size || 'Unknown size';
                        const seeds = torrent.seeds || '0';
                        const magnet = torrent.magnet || '';
                        const url = torrent.url || '';
                        
                        html += '<div class="content-card">';
                        html += '<div class="card-title">' + title + '</div>';
                        html += '<div style="color: #ccc; font-size: 0.9rem;">Size: ' + size + ' | Seeds: ' + seeds + '</div>';
                        html += '<div class="card-actions">';
                        html += '<button class="action-btn watch-btn" onclick="downloadTorrent(\\'' + magnet + '\\')">Magnet</button>';
                        html += '<button class="action-btn download-btn" onclick="downloadTorrentFile(\\'' + url + '\\')">Torrent File</button>';
                        html += '</div></div>';
                    });
                    container.innerHTML = html;
                } else {
                    container.innerHTML = '<div class="error">No torrents found. Try a different search.</div>';
                }
            } catch (error) {
                console.error('Torrent search error:', error);
                container.innerHTML = '<div class="error">Search failed. Please try again.</div>';
            }
        }

        // Utility functions
        function downloadFile(url, filename) {
            if (!url) return alert('Download URL not available');
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            alert('Download started: ' + filename);
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

        async function downloadYouTubeVideo(videoId, title) {
            const url = 'https://www.youtube.com/watch?v=' + videoId;
            try {
                const response = await fetch('/api/download/youtube?url=' + encodeURIComponent(url));
                const data = await response.json();
                if (data.success) {
                    downloadFile(data.mp4_url, title + '.mp4');
                } else {
                    alert('Download failed');
                }
            } catch (error) {
                alert('Download failed');
            }
        }

        function playMusic(trackId) {
            alert('Playing music: ' + trackId);
        }

        function downloadMusic(trackId, title) {
            alert('Downloading music: ' + title);
        }

        function downloadTorrent(magnetUrl) {
            if (!magnetUrl) return alert('Magnet link not available');
            window.open(magnetUrl, '_blank');
        }

        function downloadTorrentFile(torrentUrl) {
            if (!torrentUrl) return alert('Torrent file not available');
            downloadFile(torrentUrl, 'download.torrent');
        }
    </script>
</body>
</html>
  `);
});

// Fixed API Routes with Better Error Handling
app.get('/api/search/movies', async (req, res) => {
  try {
    const query = req.query.query;
    console.log('Searching movies for:', query);
    
    const response = await fetch(`${MOVIE_API_BASE}/search/${encodeURIComponent(query)}`);
    const data = await response.json();
    console.log('Movie API raw response:', data);
    
    if (data && data.results && data.results.items && data.results.items.length > 0) {
      res.json({ 
        success: true, 
        results: data.results.items.slice(0, 12) 
      });
    } else {
      res.json({ 
        success: false, 
        results: [],
        message: 'No movies found'
      });
    }
  } catch (error) {
    console.error('Movie search error:', error);
    res.json({ 
      success: false, 
      results: [],
      error: error.message 
    });
  }
});

app.get('/api/search/youtube', async (req, res) => {
  try {
    const query = req.query.query;
    console.log('Searching YouTube for:', query);
    
    const response = await fetch(`${GIFTED_API_BASE}/youtube-search?apikey=${API_KEY}&q=${encodeURIComponent(query)}`);
    const data = await response.json();
    console.log('YouTube API raw response:', data);
    
    if (data && data.results) {
      res.json({ 
        success: true, 
        results: data.results.slice(0, 12) 
      });
    } else {
      res.json({ 
        success: false, 
        results: [],
        message: 'No YouTube videos found'
      });
    }
  } catch (error) {
    console.error('YouTube search error:', error);
    res.json({ 
      success: false, 
      results: [],
      error: error.message 
    });
  }
});

app.get('/api/download/youtube', async (req, res) => {
  try {
    const url = req.query.url;
    console.log('Downloading YouTube URL:', url);
    
    // Try MP3 download
    const mp3Response = await fetch(`${GIFTED_API_BASE}/download/ytmp3?apikey=${API_KEY}&url=${encodeURIComponent(url)}`);
    const mp3Data = await mp3Response.json();
    console.log('MP3 API response:', mp3Data);
    
    // Try MP4 download  
    const mp4Response = await fetch(`${GIFTED_API_BASE}/download/ytmp4?apikey=${API_KEY}&url=${encodeURIComponent(url)}`);
    const mp4Data = await mp4Response.json();
    console.log('MP4 API response:', mp4Data);
    
    if (mp3Data.status === true && mp4Data.status === true) {
      res.json({ 
        success: true,
        title: mp3Data.title || 'YouTube Video',
        mp3_url: mp3Data.download_url,
        mp4_url: mp4Data.download_url
      });
    } else {
      res.json({ 
        success: false,
        message: 'Download failed - check if URL is valid'
      });
    }
  } catch (error) {
    console.error('YouTube download error:', error);
    res.json({ 
      success: false,
      error: error.message 
    });
  }
});

app.get('/api/search/music', async (req, res) => {
  try {
    const query = req.query.query;
    console.log('Searching music for:', query);
    
    const response = await fetch(`${GIFTED_API_BASE}/search/spotifysearch?apikey=${API_KEY}&query=${encodeURIComponent(query)}`);
    const data = await response.json();
    console.log('Music API raw response:', data);
    
    if (data && data.results) {
      res.json({ 
        success: true, 
        results: data.results.slice(0, 12) 
      });
    } else {
      res.json({ 
        success: false, 
        results: [],
        message: 'No music found'
      });
    }
  } catch (error) {
    console.error('Music search error:', error);
    res.json({ 
      success: false, 
      results: [],
      error: error.message 
    });
  }
});

app.get('/api/search/torrents', async (req, res) => {
  try {
    const query = req.query.query;
    console.log('Searching torrents for:', query);
    
    const response = await fetch(`${GIFTED_API_BASE}/search/yts?apikey=${API_KEY}&query=${encodeURIComponent(query)}`);
    const data = await response.json();
    console.log('Torrent API raw response:', data);
    
    if (data && data.results) {
      res.json({ 
        success: true, 
        results: data.results.slice(0, 12) 
      });
    } else {
      res.json({ 
        success: false, 
        results: [],
        message: 'No torrents found'
      });
    }
  } catch (error) {
    console.error('Torrent search error:', error);
    res.json({ 
      success: false, 
      results: [],
      error: error.message 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Beraflix Ultimate',
    apis: {
      movies: MOVIE_API_BASE,
      gifted: GIFTED_API_BASE
    }
  });
});

app.listen(PORT, () => {
  console.log('🚀 Beraflix running on port ' + PORT);
  console.log('📍 Visit: http://localhost:' + PORT);
  console.log('🔧 Debug mode: Check browser console for API responses');
});
