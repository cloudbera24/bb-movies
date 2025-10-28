require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(__dirname));

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API Proxy endpoints
app.get('/api/search/:query', async (req, res) => {
  try {
    console.log(`Searching for: ${req.params.query}`);
    const response = await fetch(`${process.env.API_BASE_URL || 'https://movieapi.giftedtech.co.ke/api'}/search/${encodeURIComponent(req.params.query)}`);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch search results',
      details: error.message 
    });
  }
});

app.get('/api/info/:id', async (req, res) => {
  try {
    console.log(`Fetching info for ID: ${req.params.id}`);
    const response = await fetch(`${process.env.API_BASE_URL || 'https://movieapi.giftedtech.co.ke/api'}/info/${req.params.id}`);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Info error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch movie info',
      details: error.message 
    });
  }
});

app.get('/api/sources/:id', async (req, res) => {
  try {
    console.log(`Fetching sources for ID: ${req.params.id}`);
    const response = await fetch(`${process.env.API_BASE_URL || 'https://movieapi.giftedtech.co.ke/api'}/sources/${req.params.id}`);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Sources error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch movie sources',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'BB Movies API is running' });
});

// Fallback for all other routes - serve index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🎬 BB Movies Server running on port ${PORT}`);
  console.log(`🚀 Powered by Bera Tech`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
