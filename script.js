class BBMovies {
    constructor() {
        this.currentMovie = null;
        this.watchlist = this.getStoredData('watchlist') || [];
        this.downloads = this.getStoredData('downloads') || [];
        this.continueWatching = this.getStoredData('continueWatching') || [];
        this.userPreferences = this.getStoredData('userPreferences') || {
            theme: 'dark',
            playbackSpeed: 1,
            favoriteGenres: []
        };
        this.isListening = false;
        this.recognition = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTrendingMovies();
        this.setupServiceWorker();
        this.setupProfile();
        this.showInstallPrompt();
        this.setTheme(this.userPreferences.theme);
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length > 2) {
                searchTimeout = setTimeout(() => this.searchMovies(query), 500);
            } else if (query.length === 0) {
                this.hideSearchResults();
            }
        });

        // Avatar upload
        document.getElementById('avatarUpload').addEventListener('change', (e) => {
            this.handleAvatarUpload(e.target.files[0]);
        });

        document.getElementById('profileAvatar').addEventListener('click', () => {
            document.getElementById('avatarUpload').click();
        });

        // Playback speed
        document.getElementById('playbackSpeed').addEventListener('change', (e) => {
            this.userPreferences.playbackSpeed = parseFloat(e.target.value);
            this.saveUserPreferences();
        });

        // Video player events
        const videoPlayer = document.getElementById('moviePlayer');
        videoPlayer.addEventListener('timeupdate', () => {
            this.savePlaybackProgress();
        });

        videoPlayer.addEventListener('dblclick', () => {
            this.toggleCinemaMode();
        });

        // Click outside modal to close
        document.getElementById('movieModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('movieModal')) {
                this.closeModal();
            }
        });
    }

    async loadTrendingMovies() {
        try {
            // For demo, we'll search for popular terms to get trending movies
            const searchTerms = ['avengers', 'spider', 'batman', 'superman', 'iron man'];
            const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
            
            const response = await fetch(`/api/search/${encodeURIComponent(randomTerm)}`);
            const data = await response.json();
            
            if (data && data.results) {
                this.displayMovies(data.results.slice(0, 12), 'trendingGrid');
            }
        } catch (error) {
            console.error('Error loading trending movies:', error);
            document.getElementById('trendingGrid').innerHTML = 
                '<div class="loading">Failed to load trending movies</div>';
        }
    }

    async searchMovies(query) {
        try {
            document.getElementById('searchResultsGrid').innerHTML = 
                '<div class="loading"><div class="spinner"></div></div>';
            
            this.showSearchResults();
            
            const response = await fetch(`/api/search/${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data && data.results) {
                this.displayMovies(data.results, 'searchResultsGrid');
            } else {
                document.getElementById('searchResultsGrid').innerHTML = 
                    '<div class="loading">No movies found</div>';
            }
        } catch (error) {
            console.error('Error searching movies:', error);
            document.getElementById('searchResultsGrid').innerHTML = 
                '<div class="loading">Search failed</div>';
        }
    }

    displayMovies(movies, containerId) {
        const container = document.getElementById(containerId);
        
        if (!movies || movies.length === 0) {
            container.innerHTML = '<div class="loading">No movies found</div>';
            return;
        }

        container.innerHTML = movies.map(movie => `
            <div class="movie-card" onclick="app.showMovieInfo('${movie.id}')">
                <img class="movie-poster" 
                     src="${movie.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzJmMmYyZiIvPjx0ZXh0IHg9IjEwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM4YzhjOGMiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='}" 
                     alt="${movie.title}" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzJmMmYyZiIvPjx0ZXh0IHg9IjEwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM4YzhjOGMiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
                <div class="movie-info">
                    <div class="movie-title">${movie.title}</div>
                    <div class="movie-year">${movie.description || 'Movie'}</div>
                </div>
            </div>
        `).join('');
    }

    async showMovieInfo(movieId) {
        try {
            document.getElementById('movieModal').classList.add('active');
            
            const response = await fetch(`/api/info/${movieId}`);
            const movie = await response.json();
            
            this.currentMovie = movie;
            
            // Update modal content
            document.getElementById('modalPoster').src = movie.image || '';
            document.getElementById('modalTitle').textContent = movie.title;
            document.getElementById('modalYear').textContent = movie.releaseDate || 'N/A';
            document.getElementById('modalRating').textContent = `⭐ ${movie.rating || 'N/A'}`;
            document.getElementById('modalGenre').textContent = movie.genres ? movie.genres.join(', ') : 'Unknown';
            document.getElementById('modalDescription').textContent = movie.description || 'No description available.';
            
            // Update watchlist button
            const isInWatchlist = this.watchlist.some(m => m.id === movieId);
            const watchlistBtn = document.querySelector('.btn-secondary:nth-child(3)');
            watchlistBtn.innerHTML = isInWatchlist ? '❤️ Remove from Watchlist' : '❤️ Add to Watchlist';
            
        } catch (error) {
            console.error('Error loading movie info:', error);
            alert('Failed to load movie information');
        }
    }

    async playMovie() {
        if (!this.currentMovie) return;
        
        try {
            const response = await fetch(`/api/sources/${this.currentMovie.id}`);
            const sources = await response.json();
            
            if (sources && sources.sources && sources.sources.length > 0) {
                const videoPlayer = document.getElementById('moviePlayer');
                const videoContainer = document.getElementById('videoContainer');
                const qualitySelector = document.getElementById('qualitySelector');
                
                // Show video container
                videoContainer.style.display = 'block';
                
                // Set video source
                const bestQuality = sources.sources[0];
                videoPlayer.src = bestQuality.url;
                videoPlayer.load();
                
                // Set playback speed
                videoPlayer.playbackRate = this.userPreferences.playbackSpeed;
                
                // Load progress if exists
                const progress = this.getPlaybackProgress(this.currentMovie.id);
                if (progress > 0) {
                    videoPlayer.currentTime = progress;
                }
                
                // Show quality selector if multiple sources
                if (sources.sources.length > 1) {
                    this.showQualitySelector(sources.sources);
                }
                
            } else {
                alert('No video sources available for this movie');
            }
        } catch (error) {
            console.error('Error playing movie:', error);
            alert('Failed to play movie');
        }
    }

    showQualitySelector(sources) {
        const container = document.getElementById('qualitySelector');
        container.innerHTML = sources.map((source, index) => `
            <button class="quality-btn ${index === 0 ? 'active' : ''}" 
                    onclick="app.changeQuality('${source.url}', this)">
                ${source.quality || 'Unknown'}
            </button>
        `).join('');
        container.style.display = 'flex';
    }

    changeQuality(url, button) {
        const videoPlayer = document.getElementById('moviePlayer');
        const currentTime = videoPlayer.currentTime;
        
        // Update active button
        document.querySelectorAll('.quality-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Change source
        videoPlayer.src = url;
        videoPlayer.currentTime = currentTime;
        videoPlayer.play();
    }

    async downloadMovie() {
        if (!this.currentMovie) return;
        
        try {
            const response = await fetch(`/api/sources/${this.currentMovie.id}`);
            const sources = await response.json();
            
            if (sources && sources.sources && sources.sources.length > 0) {
                // For demo, we'll simulate download by storing movie info
                const downloadInfo = {
                    ...this.currentMovie,
                    downloadDate: new Date().toISOString(),
                    source: sources.sources[0].url
                };
                
                this.downloads.push(downloadInfo);
                this.saveDownloads();
                
                alert('Movie added to downloads!');
                this.updateDownloadsDisplay();
            }
        } catch (error) {
            console.error('Error downloading movie:', error);
            alert('Failed to download movie');
        }
    }

    toggleWatchlist() {
        if (!this.currentMovie) return;
        
        const index = this.watchlist.findIndex(m => m.id === this.currentMovie.id);
        
        if (index > -1) {
            this.watchlist.splice(index, 1);
        } else {
            this.watchlist.push(this.currentMovie);
        }
        
        this.saveWatchlist();
        this.showMovieInfo(this.currentMovie.id); // Refresh modal
        this.updateWatchlistDisplay();
    }

    savePlaybackProgress() {
        if (!this.currentMovie) return;
        
        const videoPlayer = document.getElementById('moviePlayer');
        const progress = {
            movieId: this.currentMovie.id,
            progress: videoPlayer.currentTime,
            duration: videoPlayer.duration,
            timestamp: new Date().toISOString()
        };
        
        // Update or add to continue watching
        const index = this.continueWatching.findIndex(item => item.movieId === this.currentMovie.id);
        if (index > -1) {
            this.continueWatching[index] = progress;
        } else {
            this.continueWatching.push(progress);
        }
        
        this.saveContinueWatching();
    }

    getPlaybackProgress(movieId) {
        const progress = this.continueWatching.find(item => item.movieId === movieId);
        return progress ? progress.progress : 0;
    }

    toggleCinemaMode() {
        document.body.classList.toggle('cinema-mode');
        const exitBtn = document.querySelector('.cinema-exit');
        exitBtn.style.display = document.body.classList.contains('cinema-mode') ? 'block' : 'none';
    }

    exitCinemaMode() {
        document.body.classList.remove('cinema-mode');
        document.querySelector('.cinema-exit').style.display = 'none';
    }

    // Voice Search
    toggleVoiceSearch() {
        if (!this.recognition) {
            this.initVoiceRecognition();
        }
        
        if (this.isListening) {
            this.stopVoiceSearch();
        } else {
            this.startVoiceSearch();
        }
    }

    initVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            alert('Voice search not supported in this browser');
            return;
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        
        this.recognition.onstart = () => {
            this.isListening = true;
            document.querySelector('.voice-search').classList.add('listening');
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            document.querySelector('.voice-search').classList.remove('listening');
        };
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('searchInput').value = transcript;
            this.searchMovies(transcript);
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            document.querySelector('.voice-search').classList.remove('listening');
        };
    }

    startVoiceSearch() {
        if (this.recognition) {
            this.recognition.start();
        }
    }

    stopVoiceSearch() {
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    // Profile Management
    setupProfile() {
        this.setTheme(this.userPreferences.theme);
        document.getElementById('playbackSpeed').value = this.userPreferences.playbackSpeed;
        this.setupGenrePreferences();
    }

    setTheme(theme) {
        this.userPreferences.theme = theme;
        document.body.setAttribute('data-theme', theme);
        
        // Update theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.includes(theme === 'dark' ? 'Dark' : 'Light')) {
                btn.classList.add('active');
            }
        });
        
        this.saveUserPreferences();
    }

    setupGenrePreferences() {
        const commonGenres = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Adventure'];
        const container = document.getElementById('genrePreferences');
        
        container.innerHTML = commonGenres.map(genre => `
            <label style="display: block; margin: 0.5rem 0;">
                <input type="checkbox" value="${genre}" 
                       ${this.userPreferences.favoriteGenres.includes(genre) ? 'checked' : ''}
                       onchange="app.toggleGenre('${genre}')">
                ${genre}
            </label>
        `).join('');
    }

    toggleGenre(genre) {
        const index = this.userPreferences.favoriteGenres.indexOf(genre);
        
        if (index > -1) {
            this.userPreferences.favoriteGenres.splice(index, 1);
        } else {
            this.userPreferences.favoriteGenres.push(genre);
        }
        
        this.saveUserPreferences();
    }

    handleAvatarUpload(file) {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('profileAvatar').src = e.target.result;
                this.userPreferences.avatar = e.target.result;
                this.saveUserPreferences();
            };
            reader.readAsDataURL(file);
        }
    }

    // Data Management
    getStoredData(key) {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch {
            return null;
        }
    }

    setStoredData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    saveWatchlist() { this.setStoredData('watchlist', this.watchlist); }
    saveDownloads() { this.setStoredData('downloads', this.downloads); }
    saveContinueWatching() { this.setStoredData('continueWatching', this.continueWatching); }
    saveUserPreferences() { this.setStoredData('userPreferences', this.userPreferences); }

    clearAllData() {
        if (confirm('Are you sure you want to clear all data?')) {
            localStorage.clear();
            this.watchlist = [];
            this.downloads = [];
            this.continueWatching = [];
            this.userPreferences = {
                theme: 'dark',
                playbackSpeed: 1,
                favoriteGenres: []
            };
            this.setupProfile();
            this.updateAllDisplays();
            alert('All data cleared!');
        }
    }

    // Display Updates
    updateWatchlistDisplay() {
        this.displayMovies(this.watchlist, 'watchlistGrid');
    }

    updateDownloadsDisplay() {
        this.displayMovies(this.downloads, 'downloadsGrid');
    }

    updateContinueWatchingDisplay() {
        // This would need to map progress data to movie info
        const continueMovies = this.continueWatching.map(progress => {
            return this.watchlist.find(m => m.id === progress.movieId) || 
                   this.downloads.find(m => m.id === progress.movieId);
        }).filter(Boolean);
        
        this.displayMovies(continueMovies, 'continueGrid');
    }

    updateAllDisplays() {
        this.updateWatchlistDisplay();
        this.updateDownloadsDisplay();
        this.updateContinueWatchingDisplay();
    }

    // UI Helpers
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show selected section
        document.getElementById(sectionId).style.display = 'block';
        
        // Update displays if needed
        if (sectionId === 'watchlist') this.updateWatchlistDisplay();
        if (sectionId === 'downloads') this.updateDownloadsDisplay();
        if (sectionId === 'continue') this.updateContinueWatchingDisplay();
    }

    showSearchResults() {
        this.hideAllSections();
        document.getElementById('searchResults').style.display = 'block';
    }

    hideSearchResults() {
        document.getElementById('searchResults').style.display = 'none';
        document.getElementById('trending').style.display = 'block';
    }

    hideAllSections() {
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
        });
    }

    closeModal() {
        document.getElementById('movieModal').classList.remove('active');
        document.getElementById('videoContainer').style.display = 'none';
        document.getElementById('qualitySelector').style.display = 'none';
        
        const videoPlayer = document.getElementById('moviePlayer');
        videoPlayer.pause();
        videoPlayer.src = '';
        
        this.exitCinemaMode();
    }

    // PWA Installation
    showInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            document.getElementById('installPrompt').classList.add('show');
        });
        
        document.getElementById('installPrompt').addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    document.getElementById('installPrompt').classList.remove('show');
                }
                deferredPrompt = null;
            }
        });
    }

    // Service Worker
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(() => console.log('✅ Service Worker Registered'))
                .catch(err => console.log('❌ Service Worker registration failed:', err));
        }
    }
}

// Global functions for HTML onclick handlers
function showSection(section) { app.showSection(section); }
function toggleProfile() { document.getElementById('profilePanel').classList.toggle('active'); }
function setTheme(theme) { app.setTheme(theme); }
function toggleVoiceSearch() { app.toggleVoiceSearch(); }
function playMovie() { app.playMovie(); }
function downloadMovie() { app.downloadMovie(); }
function toggleWatchlist() { app.toggleWatchlist(); }
function exitCinemaMode() { app.exitCinemaMode(); }
function clearAllData() { app.clearAllData(); }

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new BBMovies();
});
