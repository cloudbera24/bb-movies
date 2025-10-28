require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('.'));

// API Proxy endpoints
app.get('/api/search/:query', async (req, res) => {
  try {
    const response = await fetch(`${process.env.API_BASE_URL}/search/${encodeURIComponent(req.params.query)}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch search results' });
  }
});

app.get('/api/info/:id', async (req, res) => {
  try {
    const response = await fetch(`${process.env.API_BASE_URL}/info/${req.params.id}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movie info' });
  }
});

app.get('/api/sources/:id', async (req, res) => {
  try {
    const response = await fetch(`${process.env.API_BASE_URL}/sources/${req.params.id}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movie sources' });
  }
});

app.listen(PORT, () => {
  console.log(`🎬 BB Movies Server running on port ${PORT}`);
  console.log(`🚀 Powered by Bera Tech`);
});
