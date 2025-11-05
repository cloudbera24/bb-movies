require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const compression = require('compression');
const path = require('path');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 8080;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ellyongiro8:QwXDXE6tyrGpUTNb@cluster0.tyxcmm9.mongodb.net/beraflix?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  preferences: {
    favoriteGenres: [String],
    language: { type: String, default: 'en' },
    quality: { type: String, default: '720p' }
  },
  watchHistory: [{
    movieId: String,
    title: String,
    timestamp: { type: Date, default: Date.now },
    progress: Number
  }],
  downloads: [{
    movieId: String,
    title: String,
    quality: String,
    url: String,
    size: String,
    timestamp: { type: Date, default: Date.now }
  }],
  isPremium: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Supabase Configuration
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://hfczrryqocgnmbkwemmu.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmY3pycnlxb2Nnbm1ia3dlbW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MjAxMDQsImV4cCI6MjA3NzI5NjEwNH0.L7mltOW-QysNLyQ7vru87dntXqZCjdFRCEEL-Zwpwvw'
);

// Movie API Base URL
const MOVIE_API_BASE = 'https://movieapi.giftedtech.co.ke/api';

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'beraflix_super_secret_key_2024_enhanced';

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per minute
  message: 'Too many API requests, please slow down.'
});

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Apply rate limiting
app.use('/api/auth/', authLimiter);
app.use('/api/', apiLimiter);

// Authentication Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Enhanced PWA Manifest
app.get('/manifest.json', (req, res) => {
  res.json({
    "name": "Beraflix - Stream & Download Movies",
    "short_name": "Beraflix",
    "description": "Stream and download HD movies, TV shows from Hollywood, Nollywood, Anime and more",
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

// Enhanced Service Worker
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
        // Network first for API calls
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
        // Cache first for static assets
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

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email or username' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=e50914&color=fff&size=128`
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isPremium: user.isPremium
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during registration' 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isPremium: user.isPremium,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during login' 
    });
  }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        avatar: req.user.avatar,
        isPremium: req.user.isPremium,
        preferences: req.user.preferences,
        watchHistory: req.user.watchHistory,
        downloads: req.user.downloads
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user profile' 
    });
  }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { username, preferences } = req.body;
    
    const updateData = {};
    if (username) updateData.username = username;
    if (preferences) updateData.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isPremium: user.isPremium,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating profile' 
    });
  }
});

// User-specific data routes
app.post('/api/user/watch-history', authenticateToken, async (req, res) => {
  try {
    const { movieId, title, progress } = req.body;
    
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        watchHistory: {
          movieId,
          title,
          progress: progress || 0,
          timestamp: new Date()
        }
      }
    });

    res.json({ success: true, message: 'Watch history updated' });
  } catch (error) {
    console.error('Watch history error:', error);
    res.status(500).json({ success: false, message: 'Error updating watch history' });
  }
});

app.get('/api/user/downloads', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, downloads: user.downloads });
  } catch (error) {
    console.error('Downloads fetch error:', error);
    res.status(500).json({ success: false, message: 'Error fetching downloads' });
  }
});

// Serve main HTML with enhanced authentication and animations
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Beraflix - Stream & Download HD Movies</title>
    <meta name="description" content="Stream and download HD movies, TV shows from Hollywood, Nollywood, Anime, Romance and more. Watch anywhere, download offline.">
    <meta name="theme-color" content="#e50914">
    <link rel="manifest" href="/manifest.json">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="apple-touch-icon" href="/icon-192.png">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@300;400;500;600;700;800;900&family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --bera-red: #e50914;
            --bera-dark-red: #b2070f;
            --bera-gold: #ffd700;
            --bera-blue: #00a8ff;
            --bera-black: #0a0a0a;
            --bera-dark: #141414;
            --bera-gray: #2a2a2a;
            --bera-light: #8c8c8c;
            --bera-white: #ffffff;
            --bera-gradient: linear-gradient(135deg, #e50914 0%, #b2070f 50%, #8b0000 100%);
            --bera-premium: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
            --bera-glow: 0 0 20px rgba(229, 9, 20, 0.5);
            --bera-success: #00b894;
            --bera-warning: #fdcb6e;
            --bera-info: #0984e3;
        }

        body {
            background: var(--bera-black);
            color: var(--bera-white);
            font-family: 'Montserrat', 'Roboto', sans-serif;
            overflow-x: hidden;
            line-height: 1.6;
        }

        /* Enhanced Authentication Modal */
        .auth-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(10, 10, 10, 0.95);
            backdrop-filter: blur(10px);
            z-index: 10000;
            display: none;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .auth-modal.active {
            display: flex;
            opacity: 1;
            animation: modalAppear 0.5s ease-out;
        }

        @keyframes modalAppear {
            from {
                opacity: 0;
                transform: scale(0.9) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }

        .auth-container {
            background: var(--bera-dark);
            border-radius: 20px;
            padding: 3rem;
            width: 90%;
            max-width: 450px;
            border: 2px solid var(--bera-red);
            box-shadow: 0 20px 60px rgba(229, 9, 20, 0.3);
            position: relative;
            overflow: hidden;
        }

        .auth-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 4px;
            background: var(--bera-gradient);
            animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
        }

        .auth-header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .auth-logo {
            font-family: 'Bebas Neue', cursive;
            font-size: 3rem;
            background: var(--bera-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 1rem;
            letter-spacing: 3px;
        }

        .auth-subtitle {
            color: var(--bera-light);
            font-size: 1.1rem;
        }

        .auth-tabs {
            display: flex;
            margin-bottom: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 4px;
        }

        .auth-tab {
            flex: 1;
            padding: 1rem;
            text-align: center;
            background: transparent;
            border: none;
            color: var(--bera-light);
            font-weight: 600;
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.3s ease;
        }

        .auth-tab.active {
            background: var(--bera-red);
            color: var(--bera-white);
            box-shadow: 0 4px 15px rgba(229, 9, 20, 0.4);
        }

        .auth-form {
            display: none;
            animation: formSlide 0.4s ease-out;
        }

        @keyframes formSlide {
            from {
                opacity: 0;
                transform: translateX(20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .auth-form.active {
            display: block;
        }

        .form-group {
            margin-bottom: 1.5rem;
            position: relative;
        }

        .form-input {
            width: 100%;
            padding: 1rem 1.5rem;
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid transparent;
            border-radius: 12px;
            color: var(--bera-white);
            font-size: 1rem;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }

        .form-input:focus {
            outline: none;
            border-color: var(--bera-red);
            background: rgba(255, 255, 255, 0.15);
            box-shadow: 0 0 20px rgba(229, 9, 20, 0.3);
        }

        .form-input::placeholder {
            color: var(--bera-light);
        }

        .form-label {
            position: absolute;
            left: 1.5rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--bera-light);
            transition: all 0.3s ease;
            pointer-events: none;
            background: var(--bera-dark);
            padding: 0 0.5rem;
        }

        .form-input:focus + .form-label,
        .form-input:not(:placeholder-shown) + .form-label {
            top: 0;
            font-size: 0.8rem;
            color: var(--bera-red);
        }

        .auth-btn {
            width: 100%;
            padding: 1.2rem;
            background: var(--bera-gradient);
            border: none;
            border-radius: 12px;
            color: var(--bera-white);
            font-size: 1.1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
            position: relative;
            overflow: hidden;
        }

        .auth-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
        }

        .auth-btn:hover::before {
            left: 100%;
        }

        .auth-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(229, 9, 20, 0.5);
        }

        .auth-btn:active {
            transform: translateY(0);
        }

        .auth-btn.loading {
            pointer-events: none;
            opacity: 0.8;
        }

        .auth-btn.loading::after {
            content: '';
            position: absolute;
            width: 20px;
            height: 20px;
            border: 2px solid transparent;
            border-top: 2px solid var(--bera-white);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            right: 1rem;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .auth-footer {
            text-align: center;
            margin-top: 1.5rem;
            color: var(--bera-light);
        }

        .auth-link {
            color: var(--bera-red);
            text-decoration: none;
            font-weight: 600;
            cursor: pointer;
            transition: color 0.3s ease;
        }

        .auth-link:hover {
            color: var(--bera-gold);
        }

        .close-auth {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            color: var(--bera-light);
            font-size: 1.5rem;
            cursor: pointer;
            transition: color 0.3s ease;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .close-auth:hover {
            color: var(--bera-white);
            background: rgba(255, 255, 255, 0.1);
        }

        .form-message {
            padding: 0.8rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            text-align: center;
            font-weight: 600;
            display: none;
            animation: messageSlide 0.3s ease-out;
        }

        @keyframes messageSlide {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .form-message.success {
            background: rgba(0, 184, 148, 0.2);
            color: var(--bera-success);
            border: 1px solid var(--bera-success);
            display: block;
        }

        .form-message.error {
            background: rgba(229, 9, 20, 0.2);
            color: var(--bera-red);
            border: 1px solid var(--bera-red);
            display: block;
        }

        .password-toggle {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--bera-light);
            cursor: pointer;
            transition: color 0.3s ease;
        }

        .password-toggle:hover {
            color: var(--bera-white);
        }

        /* Enhanced User Profile */
        .user-profile {
            display: flex;
            align-items: center;
            gap: 1rem;
            cursor: pointer;
            position: relative;
        }

        .user-avatar {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            background: var(--bera-gradient);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            border: 2px solid var(--bera-red);
            transition: all 0.3s ease;
            overflow: hidden;
        }

        .user-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .user-avatar:hover {
            transform: scale(1.1);
            box-shadow: 0 0 20px rgba(229, 9, 20, 0.5);
        }

        .user-menu {
            position: absolute;
            top: 100%;
            right: 0;
            background: var(--bera-dark);
            border: 1px solid var(--bera-gray);
            border-radius: 12px;
            padding: 1rem;
            min-width: 200px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            display: none;
            z-index: 1000;
            backdrop-filter: blur(10px);
        }

        .user-menu.active {
            display: block;
            animation: menuSlide 0.3s ease-out;
        }

        @keyframes menuSlide {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .user-menu-item {
            padding: 0.8rem 1rem;
            color: var(--bera-white);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 0.8rem;
            border-radius: 8px;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .user-menu-item:hover {
            background: rgba(229, 9, 20, 0.2);
            color: var(--bera-red);
        }

        .user-menu-item i {
            width: 20px;
            text-align: center;
        }

        .user-info {
            padding: 0.8rem 1rem;
            border-bottom: 1px solid var(--bera-gray);
            margin-bottom: 0.5rem;
        }

        .user-name {
            font-weight: 700;
            margin-bottom: 0.3rem;
        }

        .user-email {
            color: var(--bera-light);
            font-size: 0.9rem;
        }

        .premium-badge {
            background: var(--bera-premium);
            color: #000;
            padding: 0.3rem 0.8rem;
            border-radius: 15px;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            animation: glow 2s infinite;
        }

        @keyframes glow {
            0%, 100% { box-shadow: 0 0 10px gold; }
            50% { box-shadow: 0 0 20px gold; }
        }

        /* Enhanced Floating Particles for Background */
        .particles {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
        }

        .particle {
            position: absolute;
            background: var(--bera-red);
            border-radius: 50%;
            opacity: 0.3;
            animation: float 20s infinite linear;
        }

        @keyframes float {
            0% {
                transform: translateY(100vh) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 0.3;
            }
            90% {
                opacity: 0.3;
            }
            100% {
                transform: translateY(-100px) rotate(360deg);
                opacity: 0;
            }
        }

        /* Enhanced Responsive Design */
        @media (max-width: 768px) {
            .auth-container {
                padding: 2rem;
                margin: 1rem;
                width: calc(100% - 2rem);
            }

            .auth-logo {
                font-size: 2.5rem;
            }

            .form-input {
                padding: 0.8rem 1.2rem;
            }

            .user-profile .user-name {
                display: none;
            }
        }

        /* Enhanced Loading States */
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(10, 10, 10, 0.9);
            backdrop-filter: blur(10px);
            z-index: 9999;
            display: none;
            justify-content: center;
            align-items: center;
            flex-direction: column;
        }

        .loading-overlay.active {
            display: flex;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .loading-spinner-large {
            width: 80px;
            height: 80px;
            border: 4px solid transparent;
            border-top: 4px solid var(--bera-red);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1.5rem;
        }

        .loading-text {
            color: var(--bera-white);
            font-size: 1.2rem;
            font-weight: 600;
        }

        /* Enhanced Toast Notifications */
        .toast-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10001;
            max-width: 400px;
        }

        .toast {
            background: var(--bera-dark);
            border-left: 4px solid var(--bera-red);
            color: var(--bera-white);
            padding: 1rem 1.5rem;
            margin-bottom: 0.8rem;
            border-radius: 8px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            gap: 1rem;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
        }

        .toast.show {
            transform: translateX(0);
            opacity: 1;
        }

        .toast.success {
            border-left-color: var(--bera-success);
        }

        .toast.error {
            border-left-color: var(--bera-red);
        }

        .toast.warning {
            border-left-color: var(--bera-warning);
        }

        .toast.info {
            border-left-color: var(--bera-info);
        }

        .toast-icon {
            font-size: 1.5rem;
        }

        .toast-content {
            flex: 1;
        }

        .toast-title {
            font-weight: 700;
            margin-bottom: 0.3rem;
        }

        .toast-message {
            color: var(--bera-light);
            font-size: 0.9rem;
        }

        .close-toast {
            background: none;
            border: none;
            color: var(--bera-light);
            cursor: pointer;
            padding: 0.3rem;
            border-radius: 4px;
            transition: all 0.3s ease;
        }

        .close-toast:hover {
            color: var(--bera-white);
            background: rgba(255, 255, 255, 0.1);
        }

        /* Rest of your existing styles remain the same... */
        /* [Previous CSS styles for install prompt, mobile nav, hero banner, etc.] */

    </style>
</head>
<body>
    <!-- Enhanced Authentication Modal -->
    <div id="authModal" class="auth-modal">
        <div class="auth-container">
            <button class="close-auth" id="closeAuth">
                <i class="fas fa-times"></i>
            </button>
            
            <div class="auth-header">
                <div class="auth-logo">BERAFLIX</div>
                <div class="auth-subtitle">Premium Streaming Experience</div>
            </div>

            <div class="auth-tabs">
                <button class="auth-tab active" data-tab="login">Sign In</button>
                <button class="auth-tab" data-tab="register">Sign Up</button>
            </div>

            <!-- Login Form -->
            <form class="auth-form active" id="loginForm">
                <div class="form-message" id="loginMessage"></div>
                
                <div class="form-group">
                    <input type="email" class="form-input" id="loginEmail" placeholder=" " required>
                    <label class="form-label" for="loginEmail">Email Address</label>
                </div>

                <div class="form-group">
                    <input type="password" class="form-input" id="loginPassword" placeholder=" " required>
                    <label class="form-label" for="loginPassword">Password</label>
                    <button type="button" class="password-toggle" id="loginPasswordToggle">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>

                <button type="submit" class="auth-btn" id="loginBtn">
                    Sign In to Beraflix
                </button>

                <div class="auth-footer">
                    New to Beraflix? <span class="auth-link" data-tab="register">Sign up now</span>
                </div>
            </form>

            <!-- Registration Form -->
            <form class="auth-form" id="registerForm">
                <div class="form-message" id="registerMessage"></div>
                
                <div class="form-group">
                    <input type="text" class="form-input" id="registerUsername" placeholder=" " required>
                    <label class="form-label" for="registerUsername">Username</label>
                </div>

                <div class="form-group">
                    <input type="email" class="form-input" id="registerEmail" placeholder=" " required>
                    <label class="form-label" for="registerEmail">Email Address</label>
                </div>

                <div class="form-group">
                    <input type="password" class="form-input" id="registerPassword" placeholder=" " required>
                    <label class="form-label" for="registerPassword">Password</label>
                    <button type="button" class="password-toggle" id="registerPasswordToggle">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>

                <div class="form-group">
                    <input type="password" class="form-input" id="registerConfirmPassword" placeholder=" " required>
                    <label class="form-label" for="registerConfirmPassword">Confirm Password</label>
                </div>

                <button type="submit" class="auth-btn" id="registerBtn">
                    Create Account
                </button>

                <div class="auth-footer">
                    Already have an account? <span class="auth-link" data-tab="login">Sign in</span>
                </div>
            </form>
        </div>
    </div>

    <!-- Enhanced Loading Overlay -->
    <div class="loading-overlay" id="globalLoading">
        <div class="loading-spinner-large"></div>
        <div class="loading-text" id="loadingText">Loading Beraflix...</div>
    </div>

    <!-- Enhanced Toast Container -->
    <div class="toast-container" id="toastContainer"></div>

    <!-- Floating Particles -->
    <div class="particles" id="particles"></div>

    <!-- Rest of your existing HTML structure -->
    <!-- [Previous HTML for install prompt, mobile nav, hero banner, etc.] -->

    <script>
        // Enhanced Global State with Authentication
        let currentUser = null;
        let authToken = localStorage.getItem('beraflix_token');
        let currentMovies = [];
        let trendingMovies = [];
        let popularMovies = [];
        let kdramaMovies = [];
        let bollywoodMovies = [];
        let scifiMovies = [];
        let actionMovies = [];
        let hollywoodMovies = [];
        let nollywoodMovies = [];
        let animeMovies = [];
        let disneyMovies = [];
        let romanceMovies = [];
        let currentHeroMovie = null;
        let currentMovieSources = [];
        let userDownloads = [];

        // DOM Elements for Authentication
        const authModal = document.getElementById('authModal');
        const closeAuth = document.getElementById('closeAuth');
        const authTabs = document.querySelectorAll('.auth-tab');
        const authForms = document.querySelectorAll('.auth-form');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const loginMessage = document.getElementById('loginMessage');
        const registerMessage = document.getElementById('registerMessage');
        const loginPasswordToggle = document.getElementById('loginPasswordToggle');
        const registerPasswordToggle = document.getElementById('registerPasswordToggle');
        const globalLoading = document.getElementById('globalLoading');
        const loadingText = document.getElementById('loadingText');
        const toastContainer = document.getElementById('toastContainer');
        const particlesContainer = document.getElementById('particles');

        // Initialize App with Authentication
        document.addEventListener('DOMContentLoaded', async () => {
            createParticles();
            setupAuthEventListeners();
            
            setTimeout(() => {
                document.getElementById('splashScreen').style.display = 'none';
                document.getElementById('app').classList.remove('hidden');
                
                if (authToken) {
                    verifyTokenAndLoadUser();
                } else {
                    initializeApp();
                }
            }, 3000);

            // PWA Install Prompt (existing code)
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                // ... existing PWA code
            });
        });

        function createParticles() {
            const colors = ['#e50914', '#ffd700', '#00a8ff', '#ffffff'];
            for (let i = 0; i < 50; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.width = `${Math.random() * 4 + 2}px`;
                particle.style.height = particle.style.width;
                particle.style.background = colors[Math.floor(Math.random() * colors.length)];
                particle.style.left = `${Math.random() * 100}vw`;
                particle.style.animationDelay = `${Math.random() * 20}s`;
                particle.style.animationDuration = `${Math.random() * 10 + 15}s`;
                particlesContainer.appendChild(particle);
            }
        }

        function setupAuthEventListeners() {
            // Auth modal toggle
            document.querySelectorAll('.user-avatar, .auth-trigger').forEach(element => {
                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (!currentUser) {
                        showAuthModal();
                    }
                });
            });

            // Close auth modal
            closeAuth.addEventListener('click', hideAuthModal);
            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) hideAuthModal();
            });

            // Auth tabs
            authTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const targetTab = tab.getAttribute('data-tab');
                    switchAuthTab(targetTab);
                });
            });

            // Auth links
            document.querySelectorAll('.auth-link').forEach(link => {
                link.addEventListener('click', () => {
                    const targetTab = link.getAttribute('data-tab');
                    switchAuthTab(targetTab);
                });
            });

            // Password toggle
            loginPasswordToggle.addEventListener('click', togglePasswordVisibility.bind(null, 'loginPassword'));
            registerPasswordToggle.addEventListener('click', togglePasswordVisibility.bind(null, 'registerPassword'));

            // Form submissions
            loginForm.addEventListener('submit', handleLogin);
            registerForm.addEventListener('submit', handleRegister);
        }

        function togglePasswordVisibility(fieldId) {
            const field = document.getElementById(fieldId);
            const toggle = fieldId === 'loginPassword' ? loginPasswordToggle : registerPasswordToggle;
            const icon = toggle.querySelector('i');
            
            if (field.type === 'password') {
                field.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                field.type = 'password';
                icon.className = 'fas fa-eye';
            }
        }

        function switchAuthTab(tabName) {
            // Update tabs
            authTabs.forEach(tab => {
                tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
            });

            // Update forms
            authForms.forEach(form => {
                form.classList.toggle('active', form.id === `${tabName}Form`);
            });

            // Clear messages
            loginMessage.style.display = 'none';
            registerMessage.style.display = 'none';
        }

        function showAuthModal() {
            authModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function hideAuthModal() {
            authModal.classList.remove('active');
            document.body.style.overflow = '';
            // Clear forms
            loginForm.reset();
            registerForm.reset();
            loginMessage.style.display = 'none';
            registerMessage.style.display = 'none';
        }

        async function handleLogin(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            if (!email || !password) {
                showMessage(loginMessage, 'Please fill in all fields', 'error');
                return;
            }

            setButtonLoading(loginBtn, true);

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    showMessage(loginMessage, 'Login successful!', 'success');
                    authToken = data.token;
                    currentUser = data.user;
                    
                    localStorage.setItem('beraflix_token', authToken);
                    showToast('Welcome back to Beraflix!', 'success');
                    
                    setTimeout(() => {
                        hideAuthModal();
                        updateUIForUser();
                        initializeApp();
                    }, 1500);
                } else {
                    showMessage(loginMessage, data.message, 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                showMessage(loginMessage, 'Login failed. Please try again.', 'error');
            } finally {
                setButtonLoading(loginBtn, false);
            }
        }

        async function handleRegister(e) {
            e.preventDefault();
            
            const username = document.getElementById('registerUsername').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerConfirmPassword').value;

            if (!username || !email || !password || !confirmPassword) {
                showMessage(registerMessage, 'Please fill in all fields', 'error');
                return;
            }

            if (password.length < 6) {
                showMessage(registerMessage, 'Password must be at least 6 characters long', 'error');
                return;
            }

            if (password !== confirmPassword) {
                showMessage(registerMessage, 'Passwords do not match', 'error');
                return;
            }

            setButtonLoading(registerBtn, true);

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await response.json();

                if (data.success) {
                    showMessage(registerMessage, 'Account created successfully!', 'success');
                    authToken = data.token;
                    currentUser = data.user;
                    
                    localStorage.setItem('beraflix_token', authToken);
                    showToast('Welcome to Beraflix!', 'success');
                    
                    setTimeout(() => {
                        hideAuthModal();
                        updateUIForUser();
                        initializeApp();
                    }, 1500);
                } else {
                    showMessage(registerMessage, data.message, 'error');
                }
            } catch (error) {
                console.error('Registration error:', error);
                showMessage(registerMessage, 'Registration failed. Please try again.', 'error');
            } finally {
                setButtonLoading(registerBtn, false);
            }
        }

        async function verifyTokenAndLoadUser() {
            showLoading('Verifying session...');
            
            try {
                const response = await fetch('/api/auth/profile', {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });

                const data = await response.json();

                if (data.success) {
                    currentUser = data.user;
                    updateUIForUser();
                    initializeApp();
                } else {
                    localStorage.removeItem('beraflix_token');
                    authToken = null;
                    initializeApp();
                }
            } catch (error) {
                console.error('Token verification error:', error);
                localStorage.removeItem('beraflix_token');
                authToken = null;
                initializeApp();
            } finally {
                hideLoading();
            }
        }

        function updateUIForUser() {
            const userAvatar = document.querySelector('.user-avatar');
            const userName = document.querySelector('.user-name');
            const authTriggers = document.querySelectorAll('.auth-trigger');
            
            if (currentUser) {
                // Update user avatar and name
                userAvatar.innerHTML = currentUser.avatar ? 
                    `<img src="${currentUser.avatar}" alt="${currentUser.username}">` :
                    `<i class="fas fa-user"></i>`;
                
                if (userName) {
                    userName.textContent = currentUser.username;
                    if (currentUser.isPremium) {
                        userName.innerHTML += ' <span class="premium-badge">PREMIUM</span>';
                    }
                }

                // Hide auth triggers
                authTriggers.forEach(trigger => {
                    trigger.style.display = 'none';
                });

                // Setup user menu
                setupUserMenu();
            }
        }

        function setupUserMenu() {
            const userProfile = document.querySelector('.user-profile');
            const userMenu = document.createElement('div');
            userMenu.className = 'user-menu';
            userMenu.innerHTML = `
                <div class="user-info">
                    <div class="user-name">${currentUser.username} ${currentUser.isPremium ? '<span class="premium-badge">PREMIUM</span>' : ''}</div>
                    <div class="user-email">${currentUser.email}</div>
                </div>
                <div class="user-menu-item" onclick="showProfile()">
                    <i class="fas fa-user"></i>
                    <span>My Profile</span>
                </div>
                <div class="user-menu-item" onclick="showWatchHistory()">
                    <i class="fas fa-history"></i>
                    <span>Watch History</span>
                </div>
                <div class="user-menu-item" onclick="showDownloads()">
                    <i class="fas fa-download"></i>
                    <span>My Downloads</span>
                </div>
                <div class="user-menu-item" onclick="showPreferences()">
                    <i class="fas fa-cog"></i>
                    <span>Preferences</span>
                </div>
                <div class="user-menu-item" onclick="handleLogout()">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Sign Out</span>
                </div>
            `;

            userProfile.appendChild(userMenu);

            userProfile.addEventListener('click', (e) => {
                e.stopPropagation();
                userMenu.classList.toggle('active');
            });

            // Close menu when clicking outside
            document.addEventListener('click', () => {
                userMenu.classList.remove('active');
            });
        }

        async function handleLogout() {
            showLoading('Signing out...');
            
            localStorage.removeItem('beraflix_token');
            authToken = null;
            currentUser = null;
            
            setTimeout(() => {
                hideLoading();
                showToast('Signed out successfully', 'info');
                location.reload();
            }, 1000);
        }

        function showMessage(element, message, type) {
            element.textContent = message;
            element.className = `form-message ${type}`;
            element.style.display = 'block';
        }

        function setButtonLoading(button, isLoading) {
            if (isLoading) {
                button.classList.add('loading');
                button.disabled = true;
            } else {
                button.classList.remove('loading');
                button.disabled = false;
            }
        }

        function showLoading(text = 'Loading...') {
            loadingText.textContent = text;
            globalLoading.classList.add('active');
        }

        function hideLoading() {
            globalLoading.classList.remove('active');
        }

        function showToast(message, type = 'info', title = 'Beraflix') {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `
                <div class="toast-icon">
                    ${getToastIcon(type)}
                </div>
                <div class="toast-content">
                    <div class="toast-title">${title}</div>
                    <div class="toast-message">${message}</div>
                </div>
                <button class="close-toast" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;

            toastContainer.appendChild(toast);

            // Show toast
            setTimeout(() => toast.classList.add('show'), 100);

            // Auto remove after 5 seconds
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 5000);
        }

        function getToastIcon(type) {
            const icons = {
                success: '<i class="fas fa-check-circle"></i>',
                error: '<i class="fas fa-exclamation-circle"></i>',
                warning: '<i class="fas fa-exclamation-triangle"></i>',
                info: '<i class="fas fa-info-circle"></i>'
            };
            return icons[type] || icons.info;
        }

        // Enhanced API calls with authentication
        async function makeAuthenticatedRequest(url, options = {}) {
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };

            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }

            try {
                const response = await fetch(url, {
                    ...options,
                    headers
                });

                if (response.status === 401) {
                    // Token expired
                    localStorage.removeItem('beraflix_token');
                    authToken = null;
                    currentUser = null;
                    showToast('Session expired. Please sign in again.', 'warning');
                    showAuthModal();
                    throw new Error('Authentication required');
                }

                return await response.json();
            } catch (error) {
                console.error('API request error:', error);
                throw error;
            }
        }

        // Enhanced download function with user tracking
        async function downloadMovie(movieId, title, quality, url, size) {
            if (!currentUser) {
                showToast('Please sign in to download movies', 'warning');
                showAuthModal();
                return;
            }

            try {
                // Show progress indicator
                downloadProgress.style.display = 'block';
                progressText.textContent = 'Downloading "' + title + '" - ' + quality;
                progressFill.style.width = '0%';

                // Simulate download progress
                const progressInterval = setInterval(() => {
                    const currentWidth = parseInt(progressFill.style.width) || 0;
                    if (currentWidth < 90) {
                        progressFill.style.width = (currentWidth + 10) + '%';
                    }
                }, 200);

                // Create download link
                const link = document.createElement('a');
                link.href = url;
                link.download = 'Beraflix_' + title.replace(/[^a-z0-9]/gi, '_') + '_' + quality + '.mp4';
                link.style.display = 'none';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Complete progress
                clearInterval(progressInterval);
                progressFill.style.width = '100%';
                progressText.textContent = 'Download Complete!';

                // Add to user's downloads in database
                await makeAuthenticatedRequest('/api/user/downloads', {
                    method: 'POST',
                    body: JSON.stringify({
                        movieId,
                        title,
                        quality,
                        url,
                        size
                    })
                });

                // Hide progress after delay
                setTimeout(() => {
                    downloadProgress.style.display = 'none';
                }, 2000);

                showToast(`"${title}" downloaded successfully!`, 'success');

            } catch (error) {
                console.error('Download error:', error);
                progressText.textContent = 'Download Failed';
                setTimeout(() => {
                    downloadProgress.style.display = 'none';
                }, 3000);
                showToast('Download failed. Please try again.', 'error');
            }
        }

        // Enhanced play movie with watch history
        async function playMovie(movieId) {
            if (!currentUser) {
                showToast('Please sign in to watch movies', 'warning');
                showAuthModal();
                return;
            }

            try {
                const response = await fetch('/api/sources/' + movieId);
                const data = await response.json();
                
                if (data.success && data.results && data.results.length > 0) {
                    currentMovieSources = data.results;
                    
                    let selectedSource = data.results.find(source => source.quality === '720p') ||
                                       data.results.find(source => source.quality === '480p') ||
                                       data.results[0];
                    
                    const videoSource = selectedSource.download_url;
                    
                    const allMovies = [...trendingMovies, ...popularMovies, ...kdramaMovies, ...bollywoodMovies, ...scifiMovies, ...actionMovies, ...hollywoodMovies, ...nollywoodMovies, ...animeMovies, ...disneyMovies, ...romanceMovies, ...currentMovies];
                    const movie = allMovies.find(m => m.subjectId === movieId);
                    
                    videoElement.src = videoSource;
                    playerTitle.textContent = movie ? movie.title + ' - Beraflix' : 'Now Playing on Beraflix';
                    videoPlayer.classList.remove('hidden');
                    
                    qualitySelector.style.display = 'block';
                    
                    // Add to watch history
                    if (movie) {
                        await makeAuthenticatedRequest('/api/user/watch-history', {
                            method: 'POST',
                            body: JSON.stringify({
                                movieId: movie.subjectId,
                                title: movie.title,
                                progress: 0
                            })
                        });
                    }
                    
                    videoElement.play().catch(e => {
                        console.log('Autoplay prevented:', e);
                    });
                } else {
                    showToast('No video source available for this movie', 'error');
                }
            } catch (error) {
                console.error('Error playing movie:', error);
                showToast('Error loading movie. Please try again.', 'error');
            }
        }

        // Initialize app after authentication
        function initializeApp() {
            // Your existing initialization code
            setupEventListeners();
            loadAllContent();
            updateDownloadsDisplay();
            registerServiceWorker();
            setupMobileFeatures();
            checkInstallPrompt();

            // Show welcome message for new users
            if (!authToken) {
                setTimeout(() => {
                    showToast('Sign in for personalized experience', 'info');
                }, 2000);
            }
        }

        // Make functions global
        window.showAuthModal = showAuthModal;
        window.handleLogout = handleLogout;
        window.showToast = showToast;
        // ... other global functions

    </script>
</body>
</html>
  `);
});

// API Routes - Using the exact Gifted Movies API endpoints
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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Beraflix - Premium Streaming Platform',
    movie_api: MOVIE_API_BASE,
    features: ['HD Streaming', 'Offline Downloads', '4K Content', 'Premium Experience', 'Multiple Categories', 'PWA Support', 'Mobile Friendly', 'K-Drama', 'Bollywood', 'Sci-Fi', 'User Authentication', 'MongoDB Integration']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎬 Beraflix Premium Server running on port ${PORT}`);
  console.log(`📍 Visit: http://localhost:${PORT}`);
  console.log(`🎯 Movie API: ${MOVIE_API_BASE}`);
  console.log(`🗄️  MongoDB: Connected`);
  console.log(`✨ Brand: BERAFLIX - The Ultimate Streaming Experience`);
  console.log(`💫 Features: HD Streaming • Offline Downloads • 4K Content • User Profiles`);
  console.log(`🔐 Authentication: MongoDB User Management`);
  console.log(`📱 PWA: Installable App • Offline Support • Mobile Optimized`);
  console.log(`🎭 Categories: Hollywood • Nollywood • Anime • K-Drama • Bollywood • Sci-Fi • Disney • Romance`);
});

module.exports = app;
