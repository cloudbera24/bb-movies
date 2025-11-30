const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// API Configuration
const API_BASE_URL = 'https://movieapi.giftedtech.co.ke';

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Global CSS Styles
const globalStyles = `
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
      --dark-bg: #0a0a0f;
      --dark-card: #1a1a2e;
      --text-primary: #ffffff;
      --text-secondary: #b0b0b0;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: var(--dark-bg);
      color: var(--text-primary);
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* Neon Glow Effects */
    .neon-glow {
      box-shadow: 
        0 0 5px var(--neon-cyan),
        0 0 10px var(--neon-cyan),
        0 0 15px var(--neon-cyan),
        inset 0 0 5px rgba(0, 243, 255, 0.1);
    }

    .neon-pink-glow {
      box-shadow: 
        0 0 5px var(--neon-pink),
        0 0 10px var(--neon-pink),
        0 0 15px var(--neon-pink),
        inset 0 0 5px rgba(255, 0, 255, 0.1);
    }

    .neon-purple-glow {
      box-shadow: 
        0 0 5px var(--neon-purple),
        0 0 10px var(--neon-purple),
        0 0 15px var(--neon-purple),
        inset 0 0 5px rgba(157, 0, 255, 0.1);
    }

    /* Header Styles */
    .header {
      background: rgba(10, 10, 15, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(0, 243, 255, 0.3);
      position: sticky;
      top: 0;
      z-index: 1000;
      padding: 1rem 2rem;
    }

    .logo {
      font-size: 2rem;
      font-weight: bold;
      background: linear-gradient(45deg, var(--neon-cyan), var(--neon-pink));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 0 10px rgba(0, 243, 255, 0.5);
    }

    .search-bar {
      background: rgba(26, 26, 46, 0.8);
      border: 1px solid var(--neon-cyan);
      border-radius: 25px;
      padding: 0.5rem 1rem;
      color: var(--text-primary);
      width: 300px;
      transition: all 0.3s ease;
    }

    .search-bar:focus {
      outline: none;
      box-shadow: 0 0 15px var(--neon-cyan);
    }

    /* Movie Card Styles */
    .movie-card {
      background: var(--dark-card);
      border-radius: 10px;
      overflow: hidden;
      transition: all 0.3s ease;
      border: 1px solid transparent;
    }

    .movie-card:hover {
      transform: translateY(-10px) scale(1.02);
      border-color: var(--neon-cyan);
      box-shadow: 
        0 10px 30px rgba(0, 243, 255, 0.3),
        0 0 20px rgba(0, 243, 255, 0.2);
    }

    .movie-poster {
      width: 100%;
      height: 300px;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .movie-card:hover .movie-poster {
      transform: scale(1.1);
    }

    /* Skeleton Loaders */
    .skeleton {
      background: linear-gradient(90deg, #2d2d42 25%, #3a3a52 50%, #2d2d42 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 4px;
    }

    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .skeleton-poster {
      width: 100%;
      height: 300px;
      border-radius: 8px;
    }

    .skeleton-text {
      height: 20px;
      margin: 10px 0;
    }

    .skeleton-title {
      height: 24px;
      width: 80%;
    }

    /* Trending Slider */
    .trending-slider {
      position: relative;
      overflow: hidden;
      border-radius: 15px;
    }

    .slider-container {
      display: flex;
      transition: transform 0.5s ease;
    }

    .slider-item {
      min-width: 100%;
      position: relative;
    }

    .slider-backdrop {
      width: 100%;
      height: 500px;
      object-fit: cover;
      filter: brightness(0.6);
    }

    .slider-content {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 2rem;
      background: linear-gradient(transparent, rgba(0,0,0,0.9));
    }

    /* Mobile Navigation */
    .mobile-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(10, 10, 15, 0.95);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(0, 243, 255, 0.3);
      padding: 0.5rem;
      z-index: 1000;
    }

    .nav-item {
      flex: 1;
      text-align: center;
      padding: 0.5rem;
      color: var(--text-secondary);
      text-decoration: none;
      transition: all 0.3s ease;
    }

    .nav-item.active {
      color: var(--neon-cyan);
    }

    .nav-item:hover {
      color: var(--neon-cyan);
    }

    /* Buttons */
    .btn {
      padding: 0.5rem 1.5rem;
      border: none;
      border-radius: 25px;
      font-weight: bold;
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
      background: var(--neon-cyan);
      color: var(--dark-bg);
      box-shadow: 0 0 20px rgba(0, 243, 255, 0.5);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .header {
        padding: 1rem;
      }

      .search-bar {
        width: 200px;
      }

      .slider-backdrop {
        height: 300px;
      }

      .mobile-nav {
        display: flex;
      }

      .main-content {
        padding-bottom: 70px;
      }
    }

    @media (max-width: 480px) {
      .search-bar {
        width: 150px;
      }

      .logo {
        font-size: 1.5rem;
      }
    }

    /* Grid Layout */
    .movies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1.5rem;
      padding: 2rem;
    }

    /* Details Page */
    .detail-hero {
      position: relative;
      height: 70vh;
      overflow: hidden;
    }

    .detail-backdrop {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: brightness(0.4);
    }

    .detail-content {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 2rem;
    }

    .cast-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
    }

    .cast-card {
      text-align: center;
    }

    .cast-image {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      margin: 0 auto;
    }

    /* Episode Selector */
    .season-selector {
      background: var(--dark-card);
      border-radius: 10px;
      padding: 1rem;
      margin: 1rem 0;
    }

    .episode-list {
      display: grid;
      gap: 0.5rem;
    }

    .episode-card {
      background: rgba(255,255,255,0.05);
      padding: 1rem;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .episode-card:hover {
      background: rgba(255,255,255,0.1);
      border-left: 3px solid var(--neon-cyan);
    }

    /* Video Player */
    .video-container {
      position: relative;
      width: 100%;
      height: 0;
      padding-bottom: 56.25%; /* 16:9 aspect ratio */
    }

    .video-player {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 10px;
    }

    /* Download Options */
    .quality-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }

    .quality-btn {
      background: var(--dark-card);
      border: 1px solid var(--neon-cyan);
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
      color: var(--text-primary);
      text-decoration: none;
      transition: all 0.3s ease;
    }

    .quality-btn:hover {
      background: var(--neon-cyan);
      color: var(--dark-bg);
      box-shadow: 0 0 15px var(--neon-cyan);
    }
  </style>
`;

// Utility function to render movie cards
function renderMovieCard(movie, isSlider = false) {
  const poster = movie.poster || '/api/placeholder/200/300';
  const rating = movie.imdbRating || 'N/A';
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A';
  
  if (isSlider) {
    return `
      <div class="slider-item">
        <img src="${movie.backdrop || poster}" alt="${movie.title}" class="slider-backdrop">
        <div class="slider-content">
          <h2 class="text-3xl font-bold mb-2">${movie.title}</h2>
          <p class="text-lg mb-4">${movie.description || 'No description available'}</p>
          <div class="flex gap-4">
            <a href="/movie/${movie.id}" class="btn btn-primary">View Details</a>
            ${movie.trailer ? `<a href="/watch/${movie.id}" class="btn btn-secondary">Watch Trailer</a>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="movie-card neon-glow">
      <div class="relative overflow-hidden">
        <img src="${poster}" alt="${movie.title}" class="movie-poster skeleton" 
             onload="this.classList.remove('skeleton')">
        <div class="absolute top-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded">
          ⭐ ${rating}
        </div>
      </div>
      <div class="p-4">
        <h3 class="font-bold text-lg mb-2 truncate">${movie.title}</h3>
        <div class="flex justify-between text-sm text-gray-400">
          <span>${year}</span>
          <span>${movie.country || 'N/A'}</span>
        </div>
        <a href="/movie/${movie.id}" class="btn btn-secondary w-full mt-3">View Details</a>
      </div>
    </div>
  `;
}

// Skeleton loader for movie cards
function renderSkeletonCards(count = 12) {
  let skeletons = '';
  for (let i = 0; i < count; i++) {
    skeletons += `
      <div class="movie-card">
        <div class="skeleton skeleton-poster"></div>
        <div class="p-4">
          <div class="skeleton skeleton-text skeleton-title"></div>
          <div class="skeleton skeleton-text" style="width: 60%;"></div>
        </div>
      </div>
    `;
  }
  return skeletons;
}

// Header component
function renderHeader(currentPage = 'home') {
  return `
    <header class="header">
      <div class="flex justify-between items-center">
        <a href="/" class="logo">BERAFLIX</a>
        <div class="flex items-center gap-4">
          <form action="/search" method="GET" class="flex gap-2">
            <input type="text" name="q" placeholder="Search movies..." class="search-bar" required>
            <button type="submit" class="btn btn-primary">Search</button>
          </form>
        </div>
      </div>
    </header>
  `;
}

// Mobile Navigation
function renderMobileNav(currentPage = 'home') {
  return `
    <nav class="mobile-nav">
      <a href="/" class="nav-item ${currentPage === 'home' ? 'active' : ''}">
        <div>🏠</div>
        <div class="text-xs">Home</div>
      </a>
      <a href="/search" class="nav-item ${currentPage === 'search' ? 'active' : ''}">
        <div>🔍</div>
        <div class="text-xs">Search</div>
      </a>
    </nav>
  `;
}

// Routes

// Home Page
app.get('/', async (req, res) => {
  try {
    // Fetch trending movies (using search as example)
    const searchResponse = await axios.get(`${API_BASE_URL}/api/search/avengers`);
    const trendingMovies = searchResponse.data.results?.slice(0, 10) || [];

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Beraflix - Stream Movies & TV Shows</title>
        ${globalStyles}
      </head>
      <body>
        ${renderHeader('home')}
        
        <main class="main-content">
          <!-- Trending Slider -->
          <section class="p-4">
            <h2 class="text-2xl font-bold mb-4 text-neon-cyan">Trending Now</h2>
            <div class="trending-slider neon-glow">
              <div class="slider-container" id="trendingSlider">
                ${trendingMovies.length > 0 
                  ? trendingMovies.map(movie => renderMovieCard(movie, true)).join('')
                  : '<div class="slider-item"><div class="slider-backdrop skeleton"></div></div>'
                }
              </div>
            </div>
          </section>

          <!-- Popular Movies -->
          <section class="p-4">
            <h2 class="text-2xl font-bold mb-4 text-neon-pink">Popular Movies</h2>
            <div class="movies-grid" id="moviesGrid">
              ${trendingMovies.length > 0 
                ? trendingMovies.map(movie => renderMovieCard(movie)).join('')
                : renderSkeletonCards(8)
              }
            </div>
          </section>

          <!-- Categories -->
          <section class="p-4">
            <h2 class="text-2xl font-bold mb-4 text-neon-purple">Browse Categories</h2>
            <div class="flex flex-wrap gap-4">
              <a href="/search?q=action" class="btn btn-secondary">Action</a>
              <a href="/search?q=adventure" class="btn btn-secondary">Adventure</a>
              <a href="/search?q=sci-fi" class="btn btn-secondary">Sci-Fi</a>
              <a href="/search?q=comedy" class="btn btn-secondary">Comedy</a>
              <a href="/search?q=drama" class="btn btn-secondary">Drama</a>
              <a href="/search?q=horror" class="btn btn-secondary">Horror</a>
            </div>
          </section>
        </main>

        ${renderMobileNav('home')}

        <script>
          // Slider functionality
          let currentSlide = 0;
          const slider = document.getElementById('trendingSlider');
          const slides = slider ? slider.children : [];
          
          function showSlide(index) {
            if (slider && slides.length > 0) {
              slider.style.transform = \`translateX(-\${index * 100}%)\`;
            }
          }

          // Auto-slide
          setInterval(() => {
            if (slides.length > 0) {
              currentSlide = (currentSlide + 1) % slides.length;
              showSlide(currentSlide);
            }
          }, 5000);

          // Initialize slider
          showSlide(currentSlide);
        </script>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Home page error:', error);
    res.status(500).send('Error loading home page');
  }
});

// Search Page
app.get('/search', async (req, res) => {
  const query = req.query.q;
  const page = parseInt(req.query.page) || 1;

  try {
    let movies = [];
    let totalResults = 0;

    if (query) {
      const searchResponse = await axios.get(`${API_BASE_URL}/api/search/${encodeURIComponent(query)}`);
      movies = searchResponse.data.results || [];
      totalResults = movies.length;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Search - Beraflix</title>
        ${globalStyles}
      </head>
      <body>
        ${renderHeader('search')}
        
        <main class="main-content">
          <div class="p-4">
            <h1 class="text-3xl font-bold mb-6 text-neon-cyan">Search Movies</h1>
            
            <form action="/search" method="GET" class="mb-6">
              <div class="flex gap-2">
                <input type="text" name="q" value="${query || ''}" placeholder="Search for movies..." class="search-bar flex-1" required>
                <button type="submit" class="btn btn-primary">Search</button>
              </div>
            </form>

            ${query ? `
              <div class="mb-4">
                <p class="text-lg">Found ${totalResults} results for "${query}"</p>
              </div>
            ` : ''}

            <div class="movies-grid" id="searchResults">
              ${query ? (
                movies.length > 0 
                  ? movies.map(movie => renderMovieCard(movie)).join('')
                  : `
                    <div class="col-span-full text-center py-12">
                      <div class="text-6xl mb-4">🎬</div>
                      <h3 class="text-2xl font-bold text-neon-pink mb-2">No movies found</h3>
                      <p class="text-gray-400">Try searching with different keywords</p>
                    </div>
                  `
              ) : renderSkeletonCards(12)}
            </div>
          </div>
        </main>

        ${renderMobileNav('search')}
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).send('Error performing search');
  }
});

// Movie Details Page
app.get('/movie/:id', async (req, res) => {
  const movieId = req.params.id;

  try {
    const infoResponse = await axios.get(`${API_BASE_URL}/api/info/${movieId}`);
    const movie = infoResponse.data;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${movie.title} - Beraflix</title>
        ${globalStyles}
      </head>
      <body>
        ${renderHeader()}
        
        <main class="main-content">
          <!-- Hero Section -->
          <div class="detail-hero">
            <img src="${movie.backdrop || movie.poster}" alt="${movie.title}" class="detail-backdrop">
            <div class="detail-content">
              <h1 class="text-4xl font-bold mb-4">${movie.title}</h1>
              <div class="flex flex-wrap gap-4 mb-4">
                <span>⭐ ${movie.imdbRating || 'N/A'}</span>
                <span>📅 ${movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'}</span>
                <span>⏱️ ${movie.duration || 'N/A'}</span>
                <span>🌍 ${movie.country || 'N/A'}</span>
              </div>
              <div class="flex gap-4">
                ${movie.trailer ? `<a href="/watch/${movieId}" class="btn btn-primary">Watch Trailer</a>` : ''}
                <a href="/download/${movieId}" class="btn btn-secondary">Download</a>
              </div>
            </div>
          </div>

          <!-- Details Section -->
          <div class="p-6">
            <!-- Genres -->
            ${movie.genres ? `
              <div class="mb-6">
                <h3 class="text-xl font-bold mb-2">Genres</h3>
                <div class="flex flex-wrap gap-2">
                  ${movie.genres.map(genre => `<span class="px-3 py-1 bg-neon-purple rounded-full text-sm">${genre}</span>`).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Description -->
            ${movie.description ? `
              <div class="mb-6">
                <h3 class="text-xl font-bold mb-2">Storyline</h3>
                <p class="text-gray-300 leading-relaxed">${movie.description}</p>
              </div>
            ` : ''}

            <!-- Cast -->
            ${movie.cast && movie.cast.length > 0 ? `
              <div class="mb-6">
                <h3 class="text-xl font-bold mb-4">Cast</h3>
                <div class="cast-grid">
                  ${movie.cast.slice(0, 12).map(actor => `
                    <div class="cast-card">
                      <img src="${actor.image || '/api/placeholder/100/100'}" alt="${actor.name}" class="cast-image skeleton">
                      <p class="mt-2 font-semibold">${actor.name}</p>
                      <p class="text-sm text-gray-400">${actor.character || 'Actor'}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Seasons and Episodes (for series) -->
            ${movie.seasons && movie.seasons.length > 0 ? `
              <div class="season-selector neon-glow">
                <h3 class="text-xl font-bold mb-4">Seasons & Episodes</h3>
                <select id="seasonSelect" class="search-bar mb-4">
                  ${movie.seasons.map((season, index) => `
                    <option value="${index}">Season ${index + 1}</option>
                  `).join('')}
                </select>
                <div class="episode-list" id="episodeList">
                  ${renderEpisodes(movie.seasons[0])}
                </div>
              </div>
            ` : ''}

            <!-- Stills -->
            ${movie.stills && movie.stills.length > 0 ? `
              <div class="mt-8">
                <h3 class="text-xl font-bold mb-4">Gallery</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  ${movie.stills.slice(0, 8).map(still => `
                    <img src="${still}" alt="Still" class="w-full h-32 object-cover rounded-lg skeleton">
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </main>

        ${renderMobileNav()}

        <script>
          // Season selector functionality
          const seasonSelect = document.getElementById('seasonSelect');
          const episodeList = document.getElementById('episodeList');
          
          if (seasonSelect) {
            seasonSelect.addEventListener('change', function() {
              // In a real app, this would fetch episodes for the selected season
              episodeList.innerHTML = '<div class="text-center py-8"><div class="skeleton skeleton-text" style="width: 200px; margin: 0 auto;"></div></div>';
              
              // Simulate loading
              setTimeout(() => {
                episodeList.innerHTML = \`${renderEpisodes(movie.seasons[0])}\`;
              }, 1000);
            });
          }

          // Lazy load images
          document.addEventListener('DOMContentLoaded', function() {
            const images = document.querySelectorAll('img');
            images.forEach(img => {
              img.addEventListener('load', function() {
                this.classList.remove('skeleton');
              });
            });
          });
        </script>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Movie details error:', error);
    res.status(500).send('Error loading movie details');
  }
});

// Helper function to render episodes
function renderEpisodes(season) {
  if (!season || !season.episodes) return '<p>No episodes available</p>';
  
  return season.episodes.map(episode => `
    <div class="episode-card">
      <div class="flex justify-between items-center">
        <div>
          <h4 class="font-semibold">Episode ${episode.episodeNumber}: ${episode.title || 'Untitled'}</h4>
          <p class="text-sm text-gray-400">${episode.description || 'No description'}</p>
        </div>
        <a href="/download/${season.id}?season=${season.seasonNumber}&episode=${episode.episodeNumber}" 
           class="btn btn-primary text-sm">
          Download
        </a>
      </div>
    </div>
  `).join('');
}

// Watch Trailer Page
app.get('/watch/:id', async (req, res) => {
  const movieId = req.params.id;

  try {
    const infoResponse = await axios.get(`${API_BASE_URL}/api/info/${movieId}`);
    const movie = infoResponse.data;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Watch ${movie.title} - Beraflix</title>
        ${globalStyles}
      </head>
      <body>
        ${renderHeader()}
        
        <main class="main-content">
          <div class="p-4">
            <a href="/movie/${movieId}" class="btn btn-secondary mb-4">← Back to Details</a>
            
            <h1 class="text-3xl font-bold mb-6">${movie.title} - Trailer</h1>
            
            <div class="video-container neon-glow mb-6">
              ${movie.trailer && movie.trailer.videoAddress ? `
                <video controls class="video-player" poster="${movie.poster}">
                  <source src="${movie.trailer.videoAddress.url}" type="video/mp4">
                  Your browser does not support the video tag.
                </video>
              ` : `
                <div class="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
                  <div class="text-center">
                    <div class="text-6xl mb-4">🎬</div>
                    <h3 class="text-xl font-bold text-neon-pink">Trailer Not Available</h3>
                    <p class="text-gray-400">The trailer for this movie is not available at the moment.</p>
                  </div>
                </div>
              `}
            </div>

            ${movie.description ? `
              <div class="bg-dark-card p-6 rounded-lg neon-purple-glow">
                <h3 class="text-xl font-bold mb-2">About the Movie</h3>
                <p class="text-gray-300">${movie.description}</p>
              </div>
            ` : ''}
          </div>
        </main>

        ${renderMobileNav()}
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Watch trailer error:', error);
    res.status(500).send('Error loading trailer');
  }
});

// Download Page
app.get('/download/:id', async (req, res) => {
  const movieId = req.params.id;
  const season = req.query.season;
  const episode = req.query.episode;

  try {
    // Fetch movie info
    const infoResponse = await axios.get(`${API_BASE_URL}/api/info/${movieId}`);
    const movie = infoResponse.data;

    // Fetch download sources
    let sources = [];
    try {
      let sourcesUrl = `${API_BASE_URL}/api/sources/${movieId}`;
      if (season && episode) {
        sourcesUrl += `?season=${season}&episode=${episode}`;
      }
      const sourcesResponse = await axios.get(sourcesUrl);
      sources = sourcesResponse.data.sources || [];
    } catch (error) {
      console.error('Error fetching sources:', error);
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Download ${movie.title} - Beraflix</title>
        ${globalStyles}
      </head>
      <body>
        ${renderHeader()}
        
        <main class="main-content">
          <div class="p-4">
            <a href="/movie/${movieId}" class="btn btn-secondary mb-4">← Back to Details</a>
            
            <h1 class="text-3xl font-bold mb-2">Download ${movie.title}</h1>
            ${season && episode ? `<p class="text-lg text-gray-400 mb-6">Season ${season} • Episode ${episode}</p>` : ''}

            ${sources.length > 0 ? `
              <div class="quality-options">
                ${sources.map(source => `
                  <a href="${source.url}" target="_blank" class="quality-btn">
                    <div class="font-bold">${source.quality || 'HD'}</div>
                    <div class="text-sm">${source.size || 'Unknown size'}</div>
                  </a>
                `).join('')}
              </div>
            ` : `
              <div class="text-center py-12">
                <div class="text-6xl mb-4">📥</div>
                <h3 class="text-2xl font-bold text-neon-pink mb-2">Download Not Available</h3>
                <p class="text-gray-400">Download links are not available for this content at the moment.</p>
              </div>
            `}

            <!-- Bulk Download for Series -->
            ${movie.seasons && movie.seasons.length > 0 && !season && !episode ? `
              <div class="mt-8">
                <h3 class="text-xl font-bold mb-4">Download Entire Seasons</h3>
                <div class="grid gap-4">
                  ${movie.seasons.map((seasonObj, index) => `
                    <div class="episode-card">
                      <div class="flex justify-between items-center">
                        <h4 class="font-semibold">Season ${index + 1}</h4>
                        <a href="/download/${movieId}?season=${index + 1}" class="btn btn-primary">
                          Download All Episodes
                        </a>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </main>

        ${renderMobileNav()}
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Download page error:', error);
    res.status(500).send('Error loading download page');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Beraflix server running on port ${PORT}`);
  console.log(`📱 Access at: http://localhost:${PORT}`);
});
