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

// Serve static files from public directory (if any)
app.use(express.static('public'));

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
            timeout: 10000
        });
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('✅ Search results received');
        
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

// Get movie info by ID
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
            timeout: 10000
        });
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('✅ Movie info received');
        
        res.json(data);
    } catch (error) {
        console.error('❌ Movie Info Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch movie info',
            details: error.message
        });
    }
});

// Get download sources
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
            timeout: 10000
        });
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('✅ Download sources received');
        
        res.json(data);
    } catch (error) {
        console.error('❌ Sources Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch download sources',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'BB Movies server is running',
        timestamp: new Date().toISOString()
    });
});

// Serve the main HTML page
app.get('/', (req, res) => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BB Movies - Premium Streaming</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --primary-bg: #0a0a0a; --secondary-bg: #111111; --accent-red: #e50914;
            --text-primary: #ffffff; --text-secondary: #b3b3b3; --card-bg: #1a1a1a;
            --gradient: linear-gradient(135deg, #e50914 0%, #8b0000 100%);
            --glow: 0 0 20px rgba(229, 9, 20, 0.3);
        }
        body { font-family: 'Arial', sans-serif; background: var(--primary-bg); color: var(--text-primary); line-height: 1.6; }
        
        .navbar { position: fixed; top: 0; width: 100%; background: rgba(10, 10, 10, 0.95); backdrop-filter: blur(10px); z-index: 1000; padding: 1rem 0; border-bottom: 1px solid rgba(229, 9, 20, 0.3); }
        .nav-container { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 2rem; }
        .nav-logo { display: flex; align-items: center; gap: 0.5rem; }
        .bb-logo { background: var(--gradient); padding: 0.5rem; border-radius: 8px; font-weight: bold; font-size: 1.5rem; }
        .movies-text { font-size: 1.5rem; font-weight: bold; color: var(--text-primary); }
        .nav-menu { display: flex; list-style: none; gap: 2rem; }
        .nav-link { color: var(--text-secondary); text-decoration: none; transition: color 0.3s ease; font-weight: 500; }
        .nav-link:hover, .nav-link.active { color: var(--text-primary); }
        .nav-link.active { color: var(--accent-red); }
        .search-container { position: relative; }
        #searchInput { background: var(--secondary-bg); border: 1px solid #333; border-radius: 25px; padding: 0.5rem 1rem 0.5rem 2.5rem; color: var(--text-primary); width: 250px; transition: all 0.3s ease; }
        #searchInput:focus { outline: none; border-color: var(--accent-red); box-shadow: var(--glow); }
        .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-secondary); }
        
        .hero { position: relative; height: 70vh; background: linear-gradient(rgba(0,0,0,0.7), var(--secondary-bg)); display: flex; align-items: center; justify-content: center; margin-top: 80px; }
        .hero-content { text-align: center; z-index: 2; }
        .hero-title { font-size: 4rem; margin-bottom: 1rem; background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero-subtitle { font-size: 1.5rem; color: var(--text-secondary); margin-bottom: 2rem; }
        .hero-btn { background: var(--gradient); color: white; border: none; padding: 1rem 2rem; border-radius: 30px; font-size: 1.1rem; cursor: pointer; transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .hero-btn:hover { transform: translateY(-2px); box-shadow: var(--glow); }
        
        .main-content { max-width: 1200px; margin: 2rem auto; padding: 0 2rem; }
        .section { margin-bottom: 4rem; opacity: 0; transform: translateY(30px); transition: all 0.6s ease; }
        .section.visible { opacity: 1; transform: translateY(0); }
        .section-title { font-size: 2rem; margin-bottom: 1.5rem; color: var(--text-primary); border-left: 4px solid var(--accent-red); padding-left: 1rem; }
        
        .movies-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2rem; }
        .movie-card { background: var(--card-bg); border-radius: 12px; overflow: hidden; transition: all 0.3s ease; position: relative; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.1); }
        .movie-card:hover { transform: translateY(-10px) scale(1.02); box-shadow: var(--glow); border-color: var(--accent-red); }
        .movie-poster { width: 100%; height: 400px; object-fit: cover; background: var(--secondary-bg); }
        .poster-fallback { width: 100%; height: 400px; background: linear-gradient(45deg, #333, #555); display: flex; align-items: center; justify-content: center; color: var(--text-secondary); }
        .movie-info { padding: 1.5rem; }
        .movie-title { font-size: 1.2rem; margin-bottom: 0.5rem; }
        .movie-year { color: var(--accent-red); font-weight: bold; margin-bottom: 0.5rem; }
        .movie-description { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .movie-actions { display: flex; gap: 0.5rem; }
        .btn { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; transition: all 0.3s ease; flex: 1; text-align: center; }
        .btn-watch { background: var(--gradient); color: white; }
        .btn-download { background: transparent; color: var(--text-primary); border: 1px solid var(--text-secondary); }
        .btn:hover { transform: translateY(-2px); box-shadow: var(--glow); }
        
        .modal { display: none; position: fixed; z-index: 2000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); }
        .modal-content { background: var(--secondary-bg); margin: 2% auto; padding: 2rem; border-radius: 12px; width: 90%; max-width: 800px; position: relative; border: 1px solid var(--accent-red); box-shadow: var(--glow); }
        .close-modal { position: absolute; right: 1rem; top: 1rem; font-size: 2rem; cursor: pointer; color: var(--text-secondary); }
        .close-modal:hover { color: var(--accent-red); }
        .modal-body { display: grid; grid-template-columns: 300px 1fr; gap: 2rem; }
        .modal-poster { width: 100%; border-radius: 8px; }
        .modal-details h2 { font-size: 2rem; margin-bottom: 1rem; }
        .modal-meta { display: flex; gap: 1rem; margin-bottom: 1rem; color: var(--text-secondary); }
        .modal-overview { margin-bottom: 2rem; line-height: 1.6; }
        .modal-actions { display: flex; gap: 1rem; }
        
        .downloads-list { display: grid; gap: 1rem; }
        .download-item { background: var(--card-bg); padding: 1rem; border-radius: 8px; display: flex; align-items: center; gap: 1rem; border: 1px solid rgba(255, 255, 255, 0.1); }
        .download-thumbnail { width: 80px; height: 120px; object-fit: cover; border-radius: 6px; }
        .download-info { flex: 1; }
        .download-actions { display: flex; gap: 0.5rem; }
        .btn-delete { background: transparent; color: var(--accent-red); border: 1px solid var(--accent-red); }
        
        .quality-selector { margin: 1rem 0; }
        .quality-options { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .quality-btn { padding: 0.5rem 1rem; border: 1px solid var(--accent-red); background: transparent; color: var(--text-primary); border-radius: 4px; cursor: pointer; transition: all 0.3s ease; }
        .quality-btn:hover, .quality-btn.active { background: var(--accent-red); color: white; }
        
        .loading-spinner { display: flex; justify-content: center; align-items: center; padding: 2rem; }
        .spinner { width: 50px; height: 50px; border: 4px solid rgba(229, 9, 20, 0.3); border-left: 4px solid var(--accent-red); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        .empty-state, .no-results { text-align: center; padding: 4rem 2rem; color: var(--text-secondary); }
        .empty-state i, .no-results i { font-size: 4rem; margin-bottom: 1rem; opacity: 0.5; }
        .hidden { display: none !important; }
        
        .watchlist-btn { position: absolute; top: 1rem; right: 1rem; background: rgba(0, 0, 0, 0.7); border: none; border-radius: 50%; width: 40px; height: 40px; color: white; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; }
        .watchlist-btn:hover { background: var(--accent-red); transform: scale(1.1); }
        .watchlist-btn.active { background: var(--accent-red); color: white; }
        
        @media (max-width: 768px) {
            .nav-container { flex-direction: column; gap: 1rem; }
            .nav-menu { gap: 1rem; }
            #searchInput { width: 200px; }
            .hero-title { font-size: 2.5rem; }
            .movies-grid { grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; }
            .modal-body { grid-template-columns: 1fr; }
            .modal-content { margin: 5% auto; width: 95%; }
        }
        @media (max-width: 480px) {
            .movies-grid { grid-template-columns: 1fr; }
            .nav-menu { flex-wrap: wrap; justify-content: center; }
            .hero { height: 50vh; margin-top: 120px; }
        }
    </style>
</head>
<body>
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
            <button class="hero-btn">Explore Movies</button>
        </div>
    </section>

    <main class="main-content">
        <section class="section" id="search-results" style="display: none;">
            <h2 class="section-title">Search Results</h2>
            <div class="movies-grid" id="search-results-grid"></div>
        </section>
        <section class="section" id="featured">
            <h2 class="section-title">BB Exclusives</h2>
            <div class="movies-grid" id="featured-grid"></div>
        </section>
        <section class="section" id="trending">
            <h2 class="section-title">Trending Now</h2>
            <div class="movies-grid" id="trending-grid"></div>
        </section>
        <section class="section" id="continue-watching" style="display: none;">
            <h2 class="section-title">Continue Watching</h2>
            <div class="movies-grid" id="continue-grid"></div>
        </section>
        <div class="loading-spinner" id="loadingSpinner" style="display: none;"><div class="spinner"></div></div>
        <div class="no-results" id="noResults" style="display: none;"><i class="fas fa-film"></i><h3>No movies found</h3><p>Try searching for something else</p></div>
    </main>

    <div class="modal" id="movieModal">
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div class="modal-body" id="modalBody"></div>
        </div>
    </div>

    <section class="section hidden" id="watchlist-section">
        <h2 class="section-title">My Watchlist</h2>
        <div class="movies-grid" id="watchlist-grid"></div>
        <div class="empty-state" id="empty-watchlist"><i class="fas fa-bookmark"></i><h3>Your watchlist is empty</h3><p>Start adding movies to watch later</p></div>
    </section>

    <section class="section hidden" id="downloads-section">
        <h2 class="section-title">My Downloads</h2>
        <div class="downloads-list" id="downloads-list"></div>
        <div class="empty-state" id="empty-downloads"><i class="fas fa-download"></i><h3>No downloads yet</h3><p>Download movies to watch offline</p></div>
    </section>

    <section class="section hidden" id="about-section">
        <div class="about-content"><h2>About BB Movies</h2><p>Next-generation streaming platform with premium features including offline viewing, smart recommendations, and cinematic experience.</p></div>
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
                this.init();
            }

            init() { 
                this.bindEvents(); 
                this.loadInitialData(); 
                this.updateUI(); 
                this.setupIntersectionObserver(); 
            }

            bindEvents() {
                const searchInput = document.getElementById('searchInput'); 
                let searchTimeout;
                searchInput.addEventListener('input', (e) => { 
                    clearTimeout(searchTimeout); 
                    searchTimeout = setTimeout(() => { 
                        this.handleSearch(e.target.value); 
                    }, 500); 
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
                    if (e.target.id === 'movieModal') this.closeModal(); 
                });

                document.querySelector('.hero-btn').addEventListener('click', () => { 
                    document.getElementById('searchInput').focus(); 
                });

                window.addEventListener('scroll', () => { 
                    this.handleInfiniteScroll(); 
                });
            }

            async loadInitialData() { 
                await Promise.all([
                    this.loadFeaturedMovies(), 
                    this.loadTrendingMovies()
                ]); 
                this.updateContinueWatching(); 
            }

            async fetchMovies(query = '', page = 1) {
                try { 
                    this.showLoading(); 
                    const apiUrl = \`/api/search/\${encodeURIComponent(query)}?page=\${page}\`;
                    const response = await fetch(apiUrl); 
                    if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);
                    const data = await response.json(); 
                    return data;
                } catch (error) { 
                    console.error('Error fetching movies:', error); 
                    return { results: { items: [] } }; 
                } finally {
                    this.hideLoading(); 
                }
            }

            async fetchMovieInfo(movieId) {
                try {
                    this.showLoading();
                    const apiUrl = \`/api/info/\${movieId}\`;
                    const response = await fetch(apiUrl);
                    if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);
                    const data = await response.json();
                    return data;
                } catch (error) {
                    console.error('Error fetching movie info:', error);
                    throw error;
                } finally {
                    this.hideLoading();
                }
            }

            async fetchDownloadSources(movieId) {
                try {
                    this.showLoading();
                    const apiUrl = \`/api/sources/\${movieId}\`;
                    const response = await fetch(apiUrl);
                    if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);
                    const data = await response.json();
                    return data;
                } catch (error) {
                    console.error('Error fetching download sources:', error);
                    throw error;
                } finally {
                    this.hideLoading();
                }
            }

            async handleSearch(query) { 
                if (!query.trim()) { 
                    this.hideSearchResults(); 
                    return; 
                } 
                this.currentPage = 1; 
                const data = await this.fetchMovies(query); 
                this.displaySearchResults(data.results.items || [], query); 
            }

            async loadFeaturedMovies() { 
                const data = await this.fetchMovies('marvel'); 
                const movies = data.results.items || []; 
                this.displayMovies(movies.slice(0, 8), 'featured-grid'); 
            }

            async loadTrendingMovies() { 
                const data = await this.fetchMovies('action'); 
                const movies = data.results.items || []; 
                this.displayMovies(movies.slice(0, 12), 'trending-grid'); 
            }

            displayMovies(movies, containerId) {
                const container = document.getElementById(containerId); 
                if (!container || !movies) return;
                const moviesArray = Array.isArray(movies) ? movies : [movies];
                container.innerHTML = moviesArray.map(movie => this.createMovieCard(movie)).join('');
                container.querySelectorAll('.movie-card').forEach((card, index) => { 
                    card.addEventListener('click', () => { 
                        this.showMovieDetails(moviesArray[index]); 
                    }); 
                });
            }

            displaySearchResults(movies, query) {
                const section = document.getElementById('search-results'); 
                const grid = document.getElementById('search-results-grid'); 
                const noResults = document.getElementById('noResults');
                const moviesArray = Array.isArray(movies) ? movies : (movies ? [movies] : []);
                if (!moviesArray || moviesArray.length === 0) { 
                    grid.innerHTML = ''; 
                    noResults.style.display = 'block'; 
                    section.style.display = 'block'; 
                    return; 
                }
                noResults.style.display = 'none'; 
                this.displayMovies(moviesArray, 'search-results-grid'); 
                section.style.display = 'block';
                document.querySelectorAll('.section').forEach(section => { 
                    if (section.id !== 'search-results' && !section.classList.contains('hidden')) 
                        section.style.display = 'none'; 
                });
            }

            hideSearchResults() {
                const section = document.getElementById('search-results'); 
                section.style.display = 'none';
                document.querySelectorAll('.section').forEach(section => { 
                    if (!section.id.includes('section')) 
                        section.style.display = 'block'; 
                });
            }

            createMovieCard(movie) { 
                if (!movie) return ''; 
                const isInWatchlist = this.watchlist.some(m => m.subjectId === movie.subjectId); 
                const posterUrl = movie.cover?.url || movie.thumbnail; 
                const title = movie.title || 'Unknown Title'; 
                const description = movie.description || ''; 
                const releaseDate = movie.releaseDate;
                const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
                
                return \`
                    <div class="movie-card" data-movie-id="\${movie.subjectId}">
                        <button class="watchlist-btn \${isInWatchlist ? 'active' : ''}" 
                                onclick="event.stopPropagation(); app.toggleWatchlist(\${JSON.stringify(movie).replace(/"/g, '&quot;')})">
                            <i class="fas \${isInWatchlist ? 'fa-bookmark' : 'fa-bookmark'}"></i>
                        </button>
                        \${posterUrl ? 
                            \`<img src="\${posterUrl}" alt="\${title}" class="movie-poster" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">\` : 
                            ''
                        }
                        <div class="poster-fallback" style="\${posterUrl ? 'display: none;' : ''}">
                            <i class="fas fa-film"></i>
                        </div>
                        <div class="movie-info">
                            <h3 class="movie-title">\${title}</h3>
                            <div class="movie-year">\${year}</div>
                            <p class="movie-description">\${description.substring(0, 150)}\${description.length > 150 ? '...' : ''}</p>
                            <div class="movie-actions">
                                <button class="btn btn-watch" onclick="event.stopPropagation(); app.watchMovie(\${JSON.stringify(movie).replace(/"/g, '&quot;')})">Watch Now</button>
                                <button class="btn btn-download" onclick="event.stopPropagation(); app.downloadMovie(\${JSON.stringify(movie).replace(/"/g, '&quot;')})">Download</button>
                            </div>
                        </div>
                    </div>
                \`;
            }

            async showMovieDetails(movie) { 
                if (!movie) return; 
                try {
                    const movieInfo = await this.fetchMovieInfo(movie.subjectId);
                    this.currentMovieDetails = movieInfo;
                    
                    const modal = document.getElementById('movieModal'); 
                    const modalBody = document.getElementById('modalBody'); 
                    modalBody.innerHTML = this.createModalContent(movieInfo); 
                    modal.style.display = 'block'; 
                    document.body.style.overflow = 'hidden';
                } catch (error) {
                    console.error('Error showing movie details:', error);
                    alert('Failed to load movie details. Please try again.');
                }
            }

            createModalContent(movieInfo) { 
                const movie = movieInfo.results.subject;
                const isInWatchlist = this.watchlist.some(m => m.subjectId === movie.subjectId); 
                const posterUrl = movie.cover?.url || movie.thumbnail; 
                const title = movie.title || 'Unknown Title'; 
                const description = movie.description || 'No overview available.'; 
                const releaseDate = movie.releaseDate;
                const rating = movie.imdbRatingValue || 'N/A';
                const genre = movie.genre || 'Various';
                const duration = movie.duration ? Math.floor(movie.duration / 60) + ' min' : 'N/A';
                
                return \`
                    <div class="modal-poster-container">
                        \${posterUrl ? 
                            \`<img src="\${posterUrl}" alt="\${title}" class="modal-poster">\` : 
                            '<div class="poster-fallback" style="height: 400px;"><i class="fas fa-film"></i></div>'
                        }
                    </div>
                    <div class="modal-details">
                        <h2>\${title}</h2>
                        <div class="modal-meta">
                            <span>⭐ \${rating}/10</span>
                            <span>📅 \${releaseDate || 'Unknown'}</span>
                            <span>⏱️ \${duration}</span>
                            <span>🎭 \${genre}</span>
                        </div>
                        <p class="modal-overview">\${description}</p>
                        <div class="quality-selector" id="qualitySelector" style="display: none;">
                            <h4>Select Quality:</h4>
                            <div class="quality-options" id="qualityOptions"></div>
                        </div>
                        <div class="modal-actions">
                            <button class="btn btn-watch" onclick="app.watchMovie(\${JSON.stringify(movie).replace(/"/g, '&quot;')})">
                                <i class="fas fa-play"></i> Watch Now
                            </button>
                            <button class="btn btn-download" onclick="app.showDownloadOptions('\${movie.subjectId}')">
                                <i class="fas fa-download"></i> Download
                            </button>
                            <button class="btn \${isInWatchlist ? 'btn-delete' : ''}" onclick="app.toggleWatchlist(\${JSON.stringify(movie).replace(/"/g, '&quot;')})">
                                <i class="fas \${isInWatchlist ? 'fa-bookmark' : 'fa-bookmark'}"></i> 
                                \${isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                            </button>
                        </div>
                    </div>
                \`;
            }

            async showDownloadOptions(movieId) {
                try {
                    const sources = await this.fetchDownloadSources(movieId);
                    const qualitySelector = document.getElementById('qualitySelector');
                    const qualityOptions = document.getElementById('qualityOptions');
                    
                    if (sources.results && sources.results.length > 0) {
                        qualityOptions.innerHTML = sources.results.map(source => \`
                            <button class="quality-btn" onclick="app.downloadMovieFile('\${source.download_url}', '\${source.quality}', '\${source.size}')">
                                \${source.quality} (\${this.formatFileSize(source.size)})
                            </button>
                        \`).join('');
                        qualitySelector.style.display = 'block';
                    } else {
                        alert('No download sources available for this movie.');
                    }
                } catch (error) {
                    console.error('Error fetching download sources:', error);
                    alert('Failed to load download options. Please try again.');
                }
            }

            formatFileSize(bytes) {
                if (!bytes) return 'Unknown size';
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(1024));
                return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
            }

            async downloadMovieFile(downloadUrl, quality, size) {
                try {
                    this.showLoading();
                    // Create a temporary link to trigger download
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = \`\${this.currentMovieDetails.results.subject.title} - \${quality}.mp4\`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    // Add to downloads list
                    const downloadItem = {
                        id: this.currentMovieDetails.results.subject.subjectId,
                        title: this.currentMovieDetails.results.subject.title,
                        thumbnail: this.currentMovieDetails.results.subject.cover?.url,
                        fileSize: size,
                        quality: quality,
                        downloadDate: new Date().toISOString(),
                        fileUrl: downloadUrl
                    };
                    
                    this.downloads.unshift(downloadItem);
                    localStorage.setItem('bb_downloads', JSON.stringify(this.downloads));
                    this.updateDownloadsUI();
                    
                    this.hideLoading();
                    alert(\`Download started: \${this.currentMovieDetails.results.subject.title} (\${quality})\`);
                    
                } catch (error) {
                    console.error('Download error:', error);
                    alert('Download failed. Please try again.');
                    this.hideLoading();
                }
            }

            closeModal() { 
                const modal = document.getElementById('movieModal'); 
                modal.style.display = 'none'; 
                document.body.style.overflow = 'auto'; 
                this.currentMovieDetails = null;
            }

            async watchMovie(movie) { 
                const existing = this.continueWatching.find(m => m.subjectId === movie.subjectId);
                if (!existing) {
                    this.continueWatching.unshift({
                        ...movie,
                        progress: 0,
                        timestamp: Date.now()
                    });
                    if (this.continueWatching.length > 10) this.continueWatching.pop();
                    localStorage.setItem('bb_continue', JSON.stringify(this.continueWatching));
                    this.updateContinueWatching();
                }
                
                // In a real implementation, this would stream the movie
                // For demo, we'll show a message
                alert(\`Now streaming: \${movie.title}\\n\\nIn a production environment, this would open the video player with the actual movie stream.\`);
            }

            toggleWatchlist(movie) {
                const index = this.watchlist.findIndex(m => m.subjectId === movie.subjectId);
                if (index > -1) {
                    this.watchlist.splice(index, 1);
                } else {
                    this.watchlist.unshift(movie);
                }
                localStorage.setItem('bb_watchlist', JSON.stringify(this.watchlist));
                this.updateWatchlistUI();
                this.updateUI();
            }

            showSection(section) {
                document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
                document.querySelector(\`[data-section="\${section}"]\`).classList.add('active');
                document.querySelectorAll('.section, #watchlist-section, #downloads-section, #about-section').forEach(el => {
                    el.classList.add('hidden');
                });
                this.currentSection = section;
                switch(section) {
                    case 'home':
                        document.querySelectorAll('.section').forEach(el => {
                            if (!el.id.includes('section')) {
                                el.classList.remove('hidden');
                            }
                        });
                        break;
                    case 'watchlist':
                        document.getElementById('watchlist-section').classList.remove('hidden');
                        this.updateWatchlistUI();
                        break;
                    case 'downloads':
                        document.getElementById('downloads-section').classList.remove('hidden');
                        this.updateDownloadsUI();
                        break;
                    case 'about':
                        document.getElementById('about-section').classList.remove('hidden');
                        break;
                }
            }

            updateWatchlistUI() {
                const container = document.getElementById('watchlist-grid');
                const emptyState = document.getElementById('empty-watchlist');
                if (this.watchlist.length === 0) {
                    container.innerHTML = '';
                    emptyState.style.display = 'block';
                    return;
                }
                emptyState.style.display = 'none';
                this.displayMovies(this.watchlist, 'watchlist-grid');
            }

            updateDownloadsUI() {
                const container = document.getElementById('downloads-list');
                const emptyState = document.getElementById('empty-downloads');
                if (this.downloads.length === 0) {
                    container.innerHTML = '';
                    emptyState.style.display = 'block';
                    return;
                }
                emptyState.style.display = 'none';
                container.innerHTML = this.downloads.map(download => \`
                    <div class="download-item">
                        <img src="\${download.thumbnail}" alt="\${download.title}" class="download-thumbnail" onerror="this.style.display='none'">
                        <div class="download-info">
                            <h4>\${download.title}</h4>
                            <p>Quality: \${download.quality} • Size: \${this.formatFileSize(download.fileSize)}</p>
                            <p>Downloaded: \${new Date(download.downloadDate).toLocaleDateString()}</p>
                        </div>
                        <div class="download-actions">
                            <button class="btn btn-watch" onclick="app.watchOffline(\${JSON.stringify(download).replace(/"/g, '&quot;')})">
                                <i class="fas fa-play"></i> Play
                            </button>
                            <button class="btn btn-delete" onclick="app.deleteDownload('\${download.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                \`).join('');
            }

            updateContinueWatching() {
                const container = document.getElementById('continue-grid');
                const section = document.getElementById('continue-watching');
                if (this.continueWatching.length === 0) {
                    section.style.display = 'none';
                    return;
                }
                section.style.display = 'block';
                this.displayMovies(this.continueWatching, 'continue-grid');
            }

            deleteDownload(movieId) {
                this.downloads = this.downloads.filter(d => d.id !== movieId);
                localStorage.setItem('bb_downloads', JSON.stringify(this.downloads));
                this.updateDownloadsUI();
            }

            watchOffline(download) {
                alert(\`Playing offline: \${download.title} (\${download.quality})\\n\\nIn a production environment, this would play the downloaded file.\`);
            }

            updateUI() {
                document.querySelectorAll('.watchlist-btn').forEach(btn => {
                    const movieId = btn.closest('.movie-card').dataset.movieId;
                    const isInWatchlist = this.watchlist.some(m => m.subjectId == movieId);
                    btn.classList.toggle('active', isInWatchlist);
                    btn.innerHTML = \`<i class="fas \${isInWatchlist ? 'fa-bookmark' : 'fa-bookmark'}"></i>\`;
                });
            }

            setupIntersectionObserver() {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) entry.target.classList.add('visible');
                    });
                }, { threshold: 0.1 });
                document.querySelectorAll('.section').forEach(section => observer.observe(section));
            }

            handleInfiniteScroll() {
                if (this.isLoading) return;
                const scrollTop = window.scrollY;
                const windowHeight = window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight;
                if (scrollTop + windowHeight >= documentHeight - 500) this.loadMoreMovies();
            }

            async loadMoreMovies() {
                if (this.isLoading) return;
                this.isLoading = true;
                this.currentPage++;
                const searchQuery = document.getElementById('searchInput').value;
                if (searchQuery) {
                    const data = await this.fetchMovies(searchQuery, this.currentPage);
                    const movies = data.results.items || [];
                    if (movies && movies.length > 0) this.appendMovies(movies, 'search-results-grid');
                } else {
                    const data = await this.fetchMovies('action', this.currentPage);
                    const movies = data.results.items || [];
                    if (movies && movies.length > 0) this.appendMovies(movies, 'trending-grid');
                }
                this.isLoading = false;
            }

            appendMovies(movies, containerId) {
                const container = document.getElementById(containerId);
                if (!container || !movies) return;
                const moviesArray = Array.isArray(movies) ? movies : [movies];
                const movieCards = moviesArray.map(movie => this.createMovieCard(movie)).join('');
                container.innerHTML += movieCards;
                const newCards = container.querySelectorAll('.movie-card');
                newCards.forEach((card, index) => {
                    const globalIndex = container.children.length - moviesArray.length + index;
                    card.addEventListener('click', () => {
                        this.showMovieDetails(moviesArray[globalIndex]);
                    });
                });
            }

            showLoading() { document.getElementById('loadingSpinner').style.display = 'flex'; }
            hideLoading() { document.getElementById('loadingSpinner').style.display = 'none'; }
        }

        document.addEventListener('DOMContentLoaded', () => { window.app = new BBMovies(); });
    </script>
</body>
</html>
    `;
    res.send(htmlContent);
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
    console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
});
