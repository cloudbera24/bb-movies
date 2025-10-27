class BBMovies {
    constructor() {
        this.currentPage = 1; 
        this.isLoading = false; 
        this.currentSection = 'home';
        this.watchlist = JSON.parse(localStorage.getItem('bb_watchlist')) || [];
        this.downloads = JSON.parse(localStorage.getItem('bb_downloads')) || [];
        this.continueWatching = JSON.parse(localStorage.getItem('bb_continue')) || [];
        this.currentMovieDetails = null;
        this.videoPlayer = null;
        this.init();
    }

    init() { 
        this.bindEvents(); 
        this.loadInitialData(); 
        this.updateUI(); 
        this.videoPlayer = document.getElementById('videoPlayer');
        console.log('BB Movies initialized!');
    }

    bindEvents() {
        const searchInput = document.getElementById('searchInput'); 
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => { 
            const query = e.target.value.trim();
            clearTimeout(searchTimeout); 
            
            if (query) {
                this.showSearchLoading();
            } else {
                this.hideSearchLoading();
                this.hideSearchResults();
            }
            
            searchTimeout = setTimeout(() => { 
                this.handleSearch(query); 
            }, 800); 
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

        // Video player events
        if (this.videoPlayer) {
            this.videoPlayer.addEventListener('play', () => {
                document.getElementById('playPauseIcon').className = 'fas fa-pause';
                this.hideStreamingLoading();
            });

            this.videoPlayer.addEventListener('pause', () => {
                document.getElementById('playPauseIcon').className = 'fas fa-play';
            });

            this.videoPlayer.addEventListener('waiting', () => {
                this.showStreamingLoading();
            });

            this.videoPlayer.addEventListener('canplay', () => {
                this.hideStreamingLoading();
            });

            this.videoPlayer.addEventListener('error', (e) => {
                console.error('Video player error:', e);
                this.hideStreamingLoading();
                alert('Error loading video. Please try a different quality or try again later.');
            });
        }
    }

    showSearchLoading() {
        document.getElementById('searchLoading').style.display = 'block';
    }

    hideSearchLoading() {
        document.getElementById('searchLoading').style.display = 'none';
    }

    showStreamingLoading() {
        const loadingEl = document.getElementById('streamingLoading');
        if (loadingEl) loadingEl.style.display = 'block';
    }

    hideStreamingLoading() {
        const loadingEl = document.getElementById('streamingLoading');
        if (loadingEl) loadingEl.style.display = 'none';
    }

    async loadInitialData() { 
        console.log('Loading initial data...');
        await Promise.all([
            this.loadFeaturedMovies(), 
            this.loadTrendingMovies()
        ]); 
        this.updateContinueWatching(); 
    }

    async fetchMovies(query = '', page = 1) {
        try { 
            this.showLoading(); 
            const apiUrl = `/api/search/${encodeURIComponent(query)}?page=${page}`;
            console.log('Fetching from:', apiUrl);
            
            const response = await fetch(apiUrl); 
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json(); 
            return data;
        } catch (error) { 
            console.error('Error fetching movies:', error); 
            return { results: { items: [] } }; 
        } finally {
            this.hideLoading(); 
            this.hideSearchLoading();
        }
    }

    async fetchMovieInfo(movieId) {
        try {
            this.showLoading();
            const apiUrl = `/api/info/${movieId}`;
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
            const apiUrl = `/api/sources/${movieId}`;
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
            this.hideSearchLoading();
            return; 
        } 
        
        this.currentPage = 1; 
        const data = await this.fetchMovies(query); 
        this.displaySearchResults(data.results?.items || [], query); 
    }

    async loadFeaturedMovies() { 
        try {
            const data = await this.fetchMovies('marvel'); 
            const movies = data.results?.items || []; 
            this.displayMovies(movies.slice(0, 8), 'featured-grid'); 
        } catch (error) {
            console.error('Error loading featured movies:', error);
        }
    }

    async loadTrendingMovies() { 
        try {
            const data = await this.fetchMovies('action'); 
            const movies = data.results?.items || []; 
            this.displayMovies(movies.slice(0, 12), 'trending-grid'); 
        } catch (error) {
            console.error('Error loading trending movies:', error);
        }
    }

    displayMovies(movies, containerId) {
        const container = document.getElementById(containerId); 
        if (!container) return;
        
        // Clear skeleton loaders
        container.innerHTML = '';
        
        const moviesArray = Array.isArray(movies) ? movies : [movies];
        
        if (moviesArray.length === 0) {
            container.innerHTML = '<div class="no-results"><i class="fas fa-film"></i><h3>No movies found</h3><p>Try refreshing the page</p></div>';
            return;
        }
        
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
        
        // Hide other sections when showing search results
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
        const description = movie.description || 'No description available'; 
        const releaseDate = movie.releaseDate;
        const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
        
        return `
            <div class="movie-card" data-movie-id="${movie.subjectId}">
                <button class="watchlist-btn ${isInWatchlist ? 'active' : ''}" 
                        onclick="event.stopPropagation(); app.toggleWatchlist(${JSON.stringify(movie).replace(/"/g, '&quot;')})">
                    <i class="fas ${isInWatchlist ? 'fa-bookmark' : 'fa-bookmark'}"></i>
                </button>
                ${posterUrl ? 
                    `<img src="${posterUrl}" alt="${title}" class="movie-poster" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                    ''
                }
                <div class="poster-fallback" style="${posterUrl ? 'display: none;' : ''}">
                    <i class="fas fa-film"></i>
                </div>
                <div class="movie-info">
                    <h3 class="movie-title">${title}</h3>
                    <div class="movie-year">${year}</div>
                    <p class="movie-description">${description.substring(0, 150)}${description.length > 150 ? '...' : ''}</p>
                    <div class="movie-actions">
                        <button class="btn btn-watch" onclick="event.stopPropagation(); app.watchMovie(${JSON.stringify(movie).replace(/"/g, '&quot;')})">Watch Now</button>
                        <button class="btn btn-download" onclick="event.stopPropagation(); app.showDownloadOptions('${movie.subjectId}')">Download</button>
                    </div>
                </div>
            </div>
        `;
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
        const movie = movieInfo.results?.subject;
        if (!movie) return '<div class="modal-details"><h2>Error loading movie details</h2></div>';
        
        const isInWatchlist = this.watchlist.some(m => m.subjectId === movie.subjectId); 
        const posterUrl = movie.cover?.url || movie.thumbnail; 
        const title = movie.title || 'Unknown Title'; 
        const description = movie.description || 'No overview available.'; 
        const releaseDate = movie.releaseDate;
        const rating = movie.imdbRatingValue || 'N/A';
        const genre = movie.genre || 'Various';
        const duration = movie.duration ? Math.floor(movie.duration / 60) + ' min' : 'N/A';
        
        return `
            <div class="modal-poster-container">
                ${posterUrl ? 
                    `<img src="${posterUrl}" alt="${title}" class="modal-poster">` : 
                    '<div class="poster-fallback" style="height: 400px;"><i class="fas fa-film"></i></div>'
                }
            </div>
            <div class="modal-details">
                <h2>${title}</h2>
                <div class="modal-meta">
                    <span>⭐ ${rating}/10</span>
                    <span>📅 ${releaseDate || 'Unknown'}</span>
                    <span>⏱️ ${duration}</span>
                    <span>🎭 ${genre}</span>
                </div>
                <p class="modal-overview">${description}</p>
                <div class="quality-selector">
                    <h4>Select Streaming Quality:</h4>
                    <div class="quality-options">
                        <button class="quality-btn active" onclick="app.streamMovie('${movie.subjectId}', '720p')">720p HD</button>
                        <button class="quality-btn" onclick="app.streamMovie('${movie.subjectId}', '480p')">480p SD</button>
                        <button class="quality-btn" onclick="app.streamMovie('${movie.subjectId}', '360p')">360p Low</button>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-watch" onclick="app.streamMovie('${movie.subjectId}', '720p')">
                        <i class="fas fa-play"></i> Stream Now
                    </button>
                    <button class="btn btn-download" onclick="app.showDownloadOptions('${movie.subjectId}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="btn ${isInWatchlist ? 'btn-delete' : ''}" onclick="app.toggleWatchlist(${JSON.stringify(movie).replace(/"/g, '&quot;')})">
                        <i class="fas ${isInWatchlist ? 'fa-bookmark' : 'fa-bookmark'}"></i> 
                        ${isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    </button>
                </div>
            </div>
        `;
    }

    async streamMovie(movieId, quality) {
        try {
            this.showLoading();
            
            // Update quality buttons
            document.querySelectorAll('.quality-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            // Create streaming URL
            const streamUrl = `/api/stream/${movieId}?quality=${quality}`;
            
            console.log('Streaming URL:', streamUrl);
            
            // Show video player and start loading
            this.showVideoPlayer(streamUrl);
            
            this.hideLoading();
            
        } catch (error) {
            console.error('Streaming error:', error);
            alert('Failed to start streaming. Please try again.');
            this.hideLoading();
        }
    }

    showVideoPlayer(streamUrl) {
        const videoPlayerModal = document.getElementById('videoPlayerModal');
        const videoPlayer = document.getElementById('videoPlayer');
        
        this.showStreamingLoading();
        
        // Set video source
        videoPlayer.src = streamUrl;
        videoPlayer.load();
        
        // Show modal
        videoPlayerModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Try to auto-play when ready
        videoPlayer.addEventListener('loadeddata', () => {
            videoPlayer.play().catch(e => {
                console.log('Auto-play prevented, user interaction required:', e);
                this.hideStreamingLoading();
            });
        }, { once: true });
    }

    closeVideoPlayer() {
        const videoPlayerModal = document.getElementById('videoPlayerModal');
        const videoPlayer = document.getElementById('videoPlayer');
        
        videoPlayer.pause();
        videoPlayer.src = '';
        videoPlayerModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.hideStreamingLoading();
    }

    togglePlayPause() {
        if (this.videoPlayer.paused) {
            this.videoPlayer.play();
        } else {
            this.videoPlayer.pause();
        }
    }

    toggleFullscreen() {
        const playerContainer = document.querySelector('.video-player-container');
        if (!document.fullscreenElement) {
            playerContainer.requestFullscreen().catch(err => {
                console.log('Fullscreen error:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    async showDownloadOptions(movieId) {
        try {
            const sources = await this.fetchDownloadSources(movieId);
            if (sources.results && sources.results.length > 0) {
                sources.results.forEach(source => {
                    const link = document.createElement('a');
                    link.href = source.download_url;
                    link.download = `${this.currentMovieDetails.results.subject.title} - ${source.quality}.mp4`;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
                alert('Download started! Check your browser downloads.');
            } else {
                alert('No download sources available for this movie.');
            }
        } catch (error) {
            console.error('Error fetching download sources:', error);
            alert('Failed to load download options. Please try again.');
        }
    }

    closeModal() { 
        const modal = document.getElementById('movieModal'); 
        modal.style.display = 'none'; 
        document.body.style.overflow = 'auto'; 
        this.currentMovieDetails = null;
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
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
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
        container.innerHTML = this.downloads.map(download => `
            <div class="download-item">
                <img src="${download.thumbnail}" alt="${download.title}" class="download-thumbnail" onerror="this.style.display='none'">
                <div class="download-info">
                    <h4>${download.title}</h4>
                    <p>Quality: ${download.quality} • Size: ${download.fileSize}</p>
                    <p>Downloaded: ${new Date(download.downloadDate).toLocaleDateString()}</p>
                </div>
                <div class="download-actions">
                    <button class="btn btn-watch" onclick="app.watchOffline(${JSON.stringify(download).replace(/"/g, '&quot;')})">
                        <i class="fas fa-play"></i> Play
                    </button>
                    <button class="btn btn-delete" onclick="app.deleteDownload('${download.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
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
        alert(`Playing offline: ${download.title} (${download.quality})\n\nIn a production environment, this would play the downloaded file.`);
    }

    updateUI() {
        document.querySelectorAll('.watchlist-btn').forEach(btn => {
            const movieId = btn.closest('.movie-card').dataset.movieId;
            const isInWatchlist = this.watchlist.some(m => m.subjectId == movieId);
            btn.classList.toggle('active', isInWatchlist);
            btn.innerHTML = `<i class="fas ${isInWatchlist ? 'fa-bookmark' : 'fa-bookmark'}"></i>`;
        });
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
            const movies = data.results?.items || [];
            if (movies && movies.length > 0) this.appendMovies(movies, 'search-results-grid');
        } else {
            const data = await this.fetchMovies('action', this.currentPage);
            const movies = data.results?.items || [];
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

    showLoading() { 
        document.getElementById('loadingSpinner').style.display = 'flex'; 
    }
    
    hideLoading() { 
        document.getElementById('loadingSpinner').style.display = 'none'; 
    }

    watchMovie(movie) {
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
        
        // Open streaming directly
        this.streamMovie(movie.subjectId, '720p');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => { 
    window.app = new BBMovies(); 
});
