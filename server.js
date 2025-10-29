require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 8080;

// Supabase Configuration
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Movie API Base URL
const MOVIE_API_BASE = process.env.MOVIE_API_BASE;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Serve main HTML
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// API Routes - Real movie data
app.get('/api/movies/trending', async (req, res) => {
  try {
    const response = await fetch(`${MOVIE_API_BASE}/search/?q=2024`);
    const data = await response.json();
    
    if (data.movies && data.movies.length > 0) {
      res.json({ 
        success: true, 
        movies: data.movies.slice(0, 20) 
      });
    } else {
      res.json({ 
        success: false, 
        message: 'No trending movies found',
        movies: []
      });
    }
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch trending movies' 
    });
  }
});

app.get('/api/movies/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: 'Query parameter required' 
      });
    }

    const response = await fetch(`${MOVIE_API_BASE}/search/?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (data.movies && data.movies.length > 0) {
      res.json({ 
        success: true, 
        movies: data.movies 
      });
    } else {
      res.json({ 
        success: false, 
        message: 'No movies found',
        movies: []
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

app.get('/api/movies/sources/:id', async (req, res) => {
  try {
    const movieId = req.params.id;
    const response = await fetch(`${MOVIE_API_BASE}/sources/${movieId}`);
    const data = await response.json();
    
    if (data.sources && data.sources.length > 0) {
      res.json({ 
        success: true, 
        sources: data.sources 
      });
    } else {
      res.json({ 
        success: false, 
        message: 'No sources available for this movie',
        sources: []
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

// Serve static files
app.use(express.static('public'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'BB Movies API' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎬 BB Movies Server running on port ${PORT}`);
  console.log(`📍 Visit: http://localhost:${PORT}`);
  console.log(`🎯 Movie API: ${MOVIE_API_BASE}`);
  console.log(`🔐 Supabase: ${process.env.SUPABASE_URL ? 'Connected' : 'Not configured'}`);
});

module.exports = app;
