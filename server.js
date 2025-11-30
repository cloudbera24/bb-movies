const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global variables
let browser;

// Initialize Puppeteer
async function initPuppeteer() {
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        console.log('Puppeteer initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Puppeteer:', error);
    }
}

// API Proxy Routes
app.get('/api/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const page = await browser.newPage();
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        await page.goto(`https://movieapi.giftedtech.co.ke/api/search/${encodeURIComponent(query)}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        const content = await page.content();
        const jsonMatch = content.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
        
        if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[1]);
            res.json(jsonData);
        } else {
            res.json({ results: [] });
        }
        
        await page.close();
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Failed to fetch search results' });
    }
});

app.get('/api/info/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const page = await browser.newPage();
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        await page.goto(`https://movieapi.giftedtech.co.ke/api/info/${id}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        const content = await page.content();
        const jsonMatch = content.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
        
        if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[1]);
            res.json(jsonData);
        } else {
            res.status(404).json({ error: 'Content not found' });
        }
        
        await page.close();
    } catch (error) {
        console.error('Info error:', error);
        res.status(500).json({ error: 'Failed to fetch content info' });
    }
});

app.get('/api/sources/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { season, episode } = req.query;
        let url = `https://movieapi.giftedtech.co.ke/api/sources/${id}`;
        
        if (season && episode) {
            url += `?season=${season}&episode=${episode}`;
        }

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        const content = await page.content();
        const jsonMatch = content.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
        
        if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[1]);
            res.json(jsonData);
        } else {
            res.status(404).json({ error: 'Sources not found' });
        }
        
        await page.close();
    } catch (error) {
        console.error('Sources error:', error);
        res.status(500).json({ error: 'Failed to fetch sources' });
    }
});

// Serve the main HTML page
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Beraflix - Stream Movies & TV Series</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            :root {
                --neon-cyan: #00f3ff;
                --neon-pink: #ff00ff;
                --neon-purple: #9d00ff;
                --dark-bg: #0a0a0a;
                --card-bg: #1a1a1a;
                --text-primary: #ffffff;
                --text-secondary: #b0b0b0;
            }

            body {
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
                color: var(--text-primary);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                min-height: 100vh;
                overflow-x: hidden;
            }

            /* Header Styles */
            header {
                background: rgba(10, 10, 10, 0.95);
                backdrop-filter: blur(10px);
                padding: 1rem 2rem;
                position: sticky;
                top: 0;
                z-index: 1000;
                border-bottom: 1px solid rgba(0, 243, 255, 0.2);
            }

            .header-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                max-width: 1400px;
                margin: 0 auto;
            }

            .logo {
                font-size: 2rem;
                font-weight: bold;
                background: linear-gradient(45deg, var(--neon-cyan), var(--neon-pink));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                text-shadow: 0 0 20px rgba(0, 243, 255, 0.5);
            }

            .search-container {
                flex: 1;
                max-width: 500px;
                margin: 0 2rem;
                position: relative;
            }

            .search-input {
                width: 100%;
                padding: 0.75rem 1rem;
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid transparent;
                border-radius: 25px;
                color: var(--text-primary);
                font-size: 1rem;
                transition: all 0.3s ease;
            }

            .search-input:focus {
                outline: none;
                border-color: var(--neon-cyan);
                box-shadow: 0 0 20px rgba(0, 243, 255, 0.3);
            }

            .nav-links {
                display: flex;
                gap: 2rem;
            }

            .nav-link {
                color: var(--text-primary);
                text-decoration: none;
                padding: 0.5rem 1rem;
                border-radius: 20px;
                transition: all 0.3s ease;
            }

            .nav-link:hover {
                background: rgba(0, 243, 255, 0.1);
                box-shadow: 0 0 15px rgba(0, 243, 255, 0.3);
            }

            /* Mobile Navigation */
            .mobile-nav {
                display: none;
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(10, 10, 10, 0.95);
                backdrop-filter: blur(10px);
                padding: 1rem;
                z-index: 1000;
                border-top: 1px solid rgba(0, 243, 255, 0.2);
            }

            .mobile-nav-links {
                display: flex;
                justify-content: space-around;
            }

            .mobile-nav-link {
                color: var(--text-primary);
                text-decoration: none;
                text-align: center;
                padding: 0.5rem;
                border-radius: 15px;
                transition: all 0.3s ease;
                flex: 1;
                margin: 0 0.25rem;
            }

            .mobile-nav-link:hover {
                background: rgba(0, 243, 255, 0.1);
            }

            /* Main Content */
            main {
                max-width: 1400px;
                margin: 0 auto;
                padding: 2rem;
            }

            /* Section Styles */
            .section {
                margin-bottom: 3rem;
            }

            .section-title {
                font-size: 1.5rem;
                margin-bottom: 1.5rem;
                color: var(--text-primary);
                position: relative;
            }

            .section-title::after {
                content: '';
                position: absolute;
                bottom: -5px;
                left: 0;
                width: 50px;
                height: 3px;
                background: linear-gradient(90deg, var(--neon-cyan), var(--neon-pink));
                border-radius: 2px;
            }

            /* Trending Slider */
            .trending-slider {
                position: relative;
                overflow: hidden;
                border-radius: 15px;
                margin-bottom: 2rem;
            }

            .slider-container {
                display: flex;
                transition: transform 0.5s ease;
                gap: 1rem;
            }

            .slider-item {
                min-width: 300px;
                border-radius: 15px;
                overflow: hidden;
                position: relative;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .slider-item:hover {
                transform: scale(1.05);
                box-shadow: 0 0 30px rgba(0, 243, 255, 0.5);
            }

            .slider-image {
                width: 100%;
                height: 200px;
                object-fit: cover;
            }

            .slider-info {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
                padding: 1rem;
            }

            /* Movie Grid */
            .movies-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }

            .movie-card {
                background: var(--card-bg);
                border-radius: 15px;
                overflow: hidden;
                transition: all 0.3s ease;
                cursor: pointer;
                position: relative;
            }

            .movie-card:hover {
                transform: translateY(-10px);
                box-shadow: 0 10px 30px rgba(0, 243, 255, 0.3);
            }

            .movie-poster {
                width: 100%;
                height: 300px;
                object-fit: cover;
            }

            .movie-info {
                padding: 1rem;
            }

            .movie-title {
                font-size: 1rem;
                margin-bottom: 0.5rem;
                color: var(--text-primary);
            }

            .movie-meta {
                display: flex;
                justify-content: space-between;
                color: var(--text-secondary);
                font-size: 0.9rem;
            }

            /* Skeleton Loaders */
            .skeleton {
                background: linear-gradient(90deg, #2a2a2a 25%, #333 50%, #2a2a2a 75%);
                background-size: 200% 100%;
                animation: shimmer 2s infinite;
                border-radius: 8px;
            }

            @keyframes shimmer {
                0% {
                    background-position: -200% 0;
                }
                100% {
                    background-position: 200% 0;
                }
            }

            .skeleton-slider {
                height: 200px;
                min-width: 300px;
                border-radius: 15px;
            }

            .skeleton-card {
                height: 300px;
                border-radius: 15px;
            }

            .skeleton-text {
                height: 1rem;
                margin-bottom: 0.5rem;
            }

            .skeleton-text.short {
                width: 60%;
            }

            /* Details Page */
            .details-container {
                max-width: 1200px;
                margin: 0 auto;
            }

            .details-hero {
                position: relative;
                height: 60vh;
                border-radius: 20px;
                overflow: hidden;
                margin-bottom: 2rem;
            }

            .details-backdrop {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .details-overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
                padding: 2rem;
            }

            .details-content {
                display: grid;
                grid-template-columns: 1fr 2fr;
                gap: 2rem;
            }

            .details-poster {
                width: 100%;
                border-radius: 15px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            }

            /* Search Results */
            .search-results {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 1.5rem;
                margin-top: 2rem;
            }

            /* Buttons */
            .btn {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 25px;
                font-size: 1rem;
                cursor: pointer;
                transition: all 0.3s ease;
                text-decoration: none;
                display: inline-block;
                text-align: center;
            }

            .btn-primary {
                background: linear-gradient(45deg, var(--neon-cyan), var(--neon-purple));
                color: white;
            }

            .btn-primary:hover {
                box-shadow: 0 0 20px rgba(0, 243, 255, 0.5);
                transform: translateY(-2px);
            }

            .btn-secondary {
                background: transparent;
                border: 2px solid var(--neon-cyan);
                color: var(--neon-cyan);
            }

            .btn-secondary:hover {
                background: rgba(0, 243, 255, 0.1);
                box-shadow: 0 0 15px rgba(0, 243, 255, 0.3);
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                .header-content {
                    flex-direction: column;
                    gap: 1rem;
                }

                .search-container {
                    margin: 1rem 0;
                    max-width: 100%;
                }

                .nav-links {
                    display: none;
                }

                .mobile-nav {
                    display: block;
                }

                .movies-grid {
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 1rem;
                }

                .details-content {
                    grid-template-columns: 1fr;
                }

                main {
                    padding: 1rem;
                    margin-bottom: 80px;
                }

                .slider-item {
                    min-width: 250px;
                }
            }

            @media (max-width: 480px) {
                .movies-grid {
                    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                }

                .slider-item {
                    min-width: 200px;
                }
            }

            /* Utility Classes */
            .hidden {
                display: none !important;
            }

            .text-center {
                text-align: center;
            }

            .mt-2 {
                margin-top: 2rem;
            }

            .mb-2 {
                margin-bottom: 2rem;
            }

            /* Loading Spinner */
            .spinner {
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top: 3px solid var(--neon-cyan);
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 2rem auto;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    </head>
    <body>
        <!-- Header -->
        <header>
            <div class="header-content">
                <div class="logo">BERAFLEX</div>
                <div class="search-container">
                    <input type="text" class="search-input" id="searchInput" placeholder="Search movies and TV series...">
                </div>
                <nav class="nav-links">
                    <a href="#" class="nav-link" onclick="showPage('home')">Home</a>
                    <a href="#" class="nav-link" onclick="showPage('movies')">Movies</a>
                    <a href="#" class="nav-link" onclick="showPage('series')">TV Series</a>
                </nav>
            </div>
        </header>

        <!-- Mobile Navigation -->
        <nav class="mobile-nav">
            <div class="mobile-nav-links">
                <a href="#" class="mobile-nav-link" onclick="showPage('home')">
                    <div>🏠</div>
                    <small>Home</small>
                </a>
                <a href="#" class="mobile-nav-link" onclick="showPage('movies')">
                    <div>🎬</div>
                    <small>Movies</small>
                </a>
                <a href="#" class="mobile-nav-link" onclick="showPage('series')">
                    <div>📺</div>
                    <small>TV Series</small>
                </a>
                <a href="#" class="mobile-nav-link" onclick="showSearch()">
                    <div>🔍</div>
                    <small>Search</small>
                </a>
            </div>
        </nav>

        <!-- Main Content -->
        <main>
            <!-- Home Page -->
            <div id="homePage" class="page">
                <section class="section">
                    <h2 class="section-title">Trending Now</h2>
                    <div class="trending-slider">
                        <div class="slider-container" id="trendingSlider">
                            <!-- Skeleton loaders -->
                            <div class="slider-item skeleton skeleton-slider"></div>
                            <div class="slider-item skeleton skeleton-slider"></div>
                            <div class="slider-item skeleton skeleton-slider"></div>
                            <div class="slider-item skeleton skeleton-slider"></div>
                            <div class="slider-item skeleton skeleton-slider"></div>
                        </div>
                    </div>
                </section>

                <section class="section">
                    <h2 class="section-title">Popular Movies</h2>
                    <div class="movies-grid" id="popularMovies">
                        <!-- Skeleton loaders -->
                        ${Array(12).fill(0).map(() => `
                            <div class="movie-card">
                                <div class="skeleton skeleton-card"></div>
                                <div class="movie-info">
                                    <div class="skeleton skeleton-text"></div>
                                    <div class="skeleton skeleton-text short"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>

                <section class="section">
                    <h2 class="section-title">Categories</h2>
                    <div class="movies-grid">
                        <div class="movie-card" onclick="searchCategory('action')">
                            <div style="background: linear-gradient(45deg, #ff6b6b, #ee5a24); height: 150px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 1.5rem; font-weight: bold;">💥 Action</span>
                            </div>
                        </div>
                        <div class="movie-card" onclick="searchCategory('adventure')">
                            <div style="background: linear-gradient(45deg, #00d2d3, #54a0ff); height: 150px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 1.5rem; font-weight: bold;">🏔️ Adventure</span>
                            </div>
                        </div>
                        <div class="movie-card" onclick="searchCategory('sci-fi')">
                            <div style="background: linear-gradient(45deg, #9d00ff, #00f3ff); height: 150px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 1.5rem; font-weight: bold;">🚀 Sci-Fi</span>
                            </div>
                        </div>
                        <div class="movie-card" onclick="searchCategory('comedy')">
                            <div style="background: linear-gradient(45deg, #feca57, #ff9ff3); height: 150px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 1.5rem; font-weight: bold;">😂 Comedy</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <!-- Search Page -->
            <div id="searchPage" class="page hidden">
                <div class="section">
                    <h2 class="section-title">Search Results</h2>
                    <div class="search-results" id="searchResults">
                        <!-- Results will be populated here -->
                    </div>
                    <div id="searchLoading" class="hidden">
                        <div class="spinner"></div>
                    </div>
                    <div id="noResults" class="hidden text-center">
                        <h3 style="color: var(--neon-pink); margin-bottom: 1rem;">No results found</h3>
                        <p style="color: var(--text-secondary);">Try searching for something else</p>
                    </div>
                </div>
            </div>

            <!-- Details Page -->
            <div id="detailsPage" class="page hidden">
                <div class="details-container" id="detailsContent">
                    <!-- Details will be populated here -->
                </div>
            </div>
        </main>

        <script>
            // Page Management
            function showPage(pageId) {
                document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
                document.getElementById(pageId + 'Page').classList.remove('hidden');
            }

            function showSearch() {
                showPage('search');
                document.getElementById('searchInput').focus();
            }

            function searchCategory(category) {
                document.getElementById('searchInput').value = category;
                performSearch();
                showPage('search');
            }

            // Search functionality
            let searchTimeout;
            document.getElementById('searchInput').addEventListener('input', function(e) {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    if (e.target.value.trim()) {
                        performSearch();
                        showPage('search');
                    }
                }, 500);
            });

            async function performSearch() {
                const query = document.getElementById('searchInput').value.trim();
                if (!query) return;

                const resultsContainer = document.getElementById('searchResults');
                const loadingElement = document.getElementById('searchLoading');
                const noResultsElement = document.getElementById('noResults');

                resultsContainer.innerHTML = '';
                loadingElement.classList.remove('hidden');
                noResultsElement.classList.add('hidden');

                try {
                    const response = await fetch('/api/search/' + encodeURIComponent(query));
                    const data = await response.json();

                    loadingElement.classList.add('hidden');

                    if (data.results && data.results.length > 0) {
                        resultsContainer.innerHTML = data.results.map(item => 
                            createMovieCard(item, item.id)
                        ).join('');
                    } else {
                        noResultsElement.classList.remove('hidden');
                    }
                } catch (error) {
                    console.error('Search error:', error);
                    loadingElement.classList.add('hidden');
                    noResultsElement.classList.remove('hidden');
                }
            }

            // Movie card template
            function createMovieCard(movie, id) {
                return \`
                    <div class="movie-card" onclick="showDetails('\${id}')">
                        <img src="\${movie.image || '/api/placeholder/200/300'}" alt="\${movie.title}" class="movie-poster" onerror="this.src='/api/placeholder/200/300'">
                        <div class="movie-info">
                            <h3 class="movie-title">\${movie.title}</h3>
                            <div class="movie-meta">
                                <span>\${movie.type || 'Movie'}</span>
                                <span>\${movie.year || ''}</span>
                            </div>
                        </div>
                    </div>
                \`;
            }

            // Show movie/series details
            async function showDetails(id) {
                showPage('details');
                const detailsContent = document.getElementById('detailsContent');
                
                // Show skeleton loader
                detailsContent.innerHTML = \`
                    <div class="details-hero skeleton"></div>
                    <div class="details-content">
                        <div class="skeleton" style="height: 400px; border-radius: 15px;"></div>
                        <div>
                            <div class="skeleton skeleton-text" style="height: 2rem; margin-bottom: 1rem;"></div>
                            <div class="skeleton skeleton-text" style="height: 1.5rem; margin-bottom: 0.5rem;"></div>
                            <div class="skeleton skeleton-text" style="height: 1.5rem; margin-bottom: 0.5rem;"></div>
                            <div class="skeleton skeleton-text" style="height: 1.5rem; margin-bottom: 2rem;"></div>
                            <div class="skeleton" style="height: 100px; margin-bottom: 1rem;"></div>
                        </div>
                    </div>
                \`;

                try {
                    const response = await fetch('/api/info/' + id);
                    const data = await response.json();

                    if (data.type === 'Movie') {
                        renderMovieDetails(data);
                    } else {
                        renderSeriesDetails(data);
                    }
                } catch (error) {
                    console.error('Details error:', error);
                    detailsContent.innerHTML = '<div class="text-center"><h3>Error loading details</h3><p>Please try again later</p></div>';
                }
            }

            function renderMovieDetails(movie) {
                const detailsContent = document.getElementById('detailsContent');
                detailsContent.innerHTML = \`
                    <div class="details-hero">
                        <img src="\${movie.image}" alt="\${movie.title}" class="details-backdrop" onerror="this.style.display='none'">
                        <div class="details-overlay">
                            <h1 style="font-size: 3rem; margin-bottom: 1rem;">\${movie.title}</h1>
                            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                                <span>\${movie.year}</span>
                                <span>\${movie.rating || 'N/A'}</span>
                                <span>\${movie.runtime || ''}</span>
                            </div>
                        </div>
                    </div>
                    <div class="details-content">
                        <div>
                            <img src="\${movie.image}" alt="\${movie.title}" class="details-poster">
                        </div>
                        <div>
                            <h2 style="margin-bottom: 1rem;">Overview</h2>
                            <p style="line-height: 1.6; margin-bottom: 2rem; color: var(--text-secondary);">\${movie.description || 'No description available.'}</p>
                            
                            <div style="margin-bottom: 2rem;">
                                <h3 style="margin-bottom: 1rem;">Details</h3>
                                <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1rem;">
                                    <strong>Genre:</strong> <span>\${movie.genre?.join(', ') || 'N/A'}</span>
                                    <strong>Release:</strong> <span>\${movie.releaseDate || 'N/A'}</span>
                                    <strong>Rating:</strong> <span>\${movie.rating || 'N/A'}</span>
                                </div>
                            </div>

                            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                                <button class="btn btn-primary" onclick="playTrailer('\${movie.id}')">
                                    ▶ Play Trailer
                                </button>
                                <button class="btn btn-secondary" onclick="showDownloadOptions('\${movie.id}')">
                                    ⬇ Download
                                </button>
                            </div>
                        </div>
                    </div>
                \`;
            }

            function renderSeriesDetails(series) {
                const detailsContent = document.getElementById('detailsContent');
                detailsContent.innerHTML = \`
                    <div class="details-hero">
                        <img src="\${series.image}" alt="\${series.title}" class="details-backdrop" onerror="this.style.display='none'">
                        <div class="details-overlay">
                            <h1 style="font-size: 3rem; margin-bottom: 1rem;">\${series.title}</h1>
                            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                                <span>\${series.year}</span>
                                <span>\${series.rating || 'N/A'}</span>
                                <span>\${series.seasons?.length || 0} Seasons</span>
                            </div>
                        </div>
                    </div>
                    <div class="details-content">
                        <div>
                            <img src="\${series.image}" alt="\${series.title}" class="details-poster">
                        </div>
                        <div>
                            <h2 style="margin-bottom: 1rem;">Overview</h2>
                            <p style="line-height: 1.6; margin-bottom: 2rem; color: var(--text-secondary);">\${series.description || 'No description available.'}</p>
                            
                            <div style="margin-bottom: 2rem;">
                                <h3 style="margin-bottom: 1rem;">Seasons</h3>
                                <div id="seasonsList">
                                    \${(series.seasons || []).map(season => \`
                                        <div style="margin-bottom: 1rem; padding: 1rem; background: var(--card-bg); border-radius: 10px;">
                                            <h4 style="margin-bottom: 0.5rem;">\${season.title}</h4>
                                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                                \${(season.episodes || []).map(episode => \`
                                                    <button class="btn btn-secondary" onclick="showEpisodeDownload('\${series.id}', \${season.number}, \${episode.number})">
                                                        E\${episode.number}
                                                    </button>
                                                \`).join('')}
                                            </div>
                                        </div>
                                    \`).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                \`;
            }

            // Placeholder functions for trailer and download
            function playTrailer(id) {
                alert('Trailer playback would start for ID: ' + id);
            }

            function showDownloadOptions(id) {
                alert('Download options would show for ID: ' + id);
            }

            function showEpisodeDownload(seriesId, season, episode) {
                alert(\`Download options for S\${season}E\${episode} of series \${seriesId}\`);
            }

            // Load trending and popular content
            async function loadHomeContent() {
                // Simulate loading trending movies
                setTimeout(() => {
                    const trendingSlider = document.getElementById('trendingSlider');
                    trendingSlider.innerHTML = Array(5).fill(0).map((_, i) => \`
                        <div class="slider-item" onclick="showDetails('trending-\${i}')">
                            <img src="/api/placeholder/300/200" alt="Trending \${i + 1}" class="slider-image">
                            <div class="slider-info">
                                <h3>Trending Movie \${i + 1}</h3>
                                <p>Action • 2024</p>
                            </div>
                        </div>
                    \`).join('');

                    const popularMovies = document.getElementById('popularMovies');
                    popularMovies.innerHTML = Array(12).fill(0).map((_, i) => \`
                        <div class="movie-card" onclick="showDetails('popular-\${i}')">
                            <img src="/api/placeholder/200/300" alt="Popular \${i + 1}" class="movie-poster">
                            <div class="movie-info">
                                <h3 class="movie-title">Popular Movie \${i + 1}</h3>
                                <div class="movie-meta">
                                    <span>Movie</span>
                                    <span>2024</span>
                                </div>
                            </div>
                        </div>
                    \`).join('');
                }, 2000);
            }

            // Initialize
            document.addEventListener('DOMContentLoaded', function() {
                loadHomeContent();
                showPage('home');
            });

            // Placeholder image endpoint
            app.get('/api/placeholder/:width?/:height?', (req, res) => {
                const width = parseInt(req.params.width) || 200;
                const height = parseInt(req.params.height) || 300;
                const svg = \`
                    <svg width="\${width}" height="\${height}" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100%" height="100%" fill="#2a2a2a"/>
                        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#666" font-family="sans-serif" font-size="14">
                            No Image
                        </text>
                    </svg>
                \`;
                res.set('Content-Type', 'image/svg+xml');
                res.send(svg);
            });
        </script>
    </body>
    </html>
    `);
});

// Start server
async function startServer() {
    await initPuppeteer();
    
    app.listen(PORT, () => {
        console.log(`
    🎬 Beraflix Server Started!
    🌐 URL: http://localhost:${PORT}
    📱 Mobile-responsive neon movie streaming site
    🔍 Search, details, and download functionality
    🎨 Neon theme with skeleton loaders
        `);
    });
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Beraflix server...');
    if (browser) {
        await browser.close();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    if (browser) {
        await browser.close();
    }
    process.exit(0);
});

startServer().catch(console.error);
