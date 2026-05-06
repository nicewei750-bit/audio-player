class AudioPlayer {
    constructor() {
        // DOM Elements
        this.fileInput = document.getElementById('fileInput');
        this.dropZone = document.getElementById('dropZone');
        this.fileSelection = document.getElementById('fileSelection');
        this.playerArea = document.getElementById('playerArea');
        this.playlistArea = document.getElementById('playlistArea');
        this.playlist = document.getElementById('playlist');
        this.title = document.getElementById('title');
        this.author = document.getElementById('author');
        this.currentTime = document.getElementById('currentTime');
        this.duration = document.getElementById('duration');
        this.progressBar = document.getElementById('progressBar');
        this.playPauseButton = document.getElementById('playPauseButton');
        this.prevButton = document.getElementById('prevButton');
        this.nextButton = document.getElementById('nextButton');
        this.repeatButton = document.getElementById('repeatButton');
        this.randomButton = document.getElementById('randomButton');
        this.muteButton = document.getElementById('muteButton');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.speedButton = document.getElementById('speedButton');
        this.speedModal = document.getElementById('speedModal');
        this.closeSpeedModal = document.getElementById('closeSpeedModal');
        this.speedOptions = document.querySelectorAll('.speed-option');
        this.libraryButton = document.getElementById('libraryButton');
        this.playerButton = document.getElementById('playerButton');
        this.playlistButton = document.getElementById('playlistButton');
        this.backButton = document.getElementById('backButton');
        this.themeToggle = document.getElementById('themeToggle');
        this.clearPlaylistButton = document.getElementById('clearPlaylistButton');
        this.screenshotButton = document.getElementById('screenshotButton');
        this.bookCover = document.getElementById('bookCover');
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');

        // Audio object
        this.audio = new Audio();
        
        // Player state
        this.playlistItems = [];
        this.currentTrackIndex = -1;
        this.isPlaying = false;
        this.isRepeating = false;
        this.isRandom = false;
        this.isMuted = false;
        this.previousVolume = 80;
        this.playbackSpeed = 1.0;
        this.randomQueue = [];
        
        // Initialize the player
        this.init();
    }

    init() {
        // Setup event listeners
        this.setupEventListeners();
        
        // Load playlist from localStorage
        this.loadPlaylist();
        
        // Check if there are any tracks in the playlist
        if (this.playlistItems.length > 0) {
            this.switchToPlayer();
            this.updatePlaylistUI();
        }
    }

    setupEventListeners() {
        // File input and drop zone
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        
        // Drag and drop
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('border-primary');
        });
        
        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('border-primary');
        });
        
        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('border-primary');
            if (e.dataTransfer.files.length > 0) {
                this.handleFiles(e.dataTransfer.files);
            }
        });
        
        // Audio events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateTrackInfo());
        this.audio.addEventListener('ended', () => this.handleTrackEnd());
        this.audio.addEventListener('error', (e) => this.handleAudioError(e));
        
        // Control buttons
        this.playPauseButton.addEventListener('click', () => this.togglePlayPause());
        this.prevButton.addEventListener('click', () => this.playPrevious());
        this.nextButton.addEventListener('click', () => this.playNext());
        this.repeatButton.addEventListener('click', () => this.toggleRepeat());
        this.randomButton.addEventListener('click', () => this.toggleRandom());
        this.muteButton.addEventListener('click', () => this.toggleMute());
        this.volumeSlider.addEventListener('input', () => this.adjustVolume());
        this.progressBar.addEventListener('input', () => this.seek());
        
        // Speed control
        this.speedButton.addEventListener('click', () => this.openSpeedModal());
        this.closeSpeedModal.addEventListener('click', () => this.closeSpeedModal());
        this.speedOptions.forEach(option => {
            option.addEventListener('click', (e) => this.setPlaybackSpeed(e.target.dataset.speed));
        });
        
        // Navigation
        this.libraryButton.addEventListener('click', () => this.switchToLibrary());
        this.playerButton.addEventListener('click', () => this.switchToPlayer());
        this.playlistButton.addEventListener('click', () => this.switchToPlaylist());
        this.backButton.addEventListener('click', () => this.goBack());
        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Playlist management
        this.clearPlaylistButton.addEventListener('click', () => this.clearPlaylist());
        this.screenshotButton.addEventListener('click', () => this.createScreenshotZip());
        
        // Click outside speed modal to close
        this.speedModal.addEventListener('click', (e) => {
            if (e.target === this.speedModal) {
                this.closeSpeedModal();
            }
        });
    }

    handleFiles(files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Check if the file is an audio file
            if (!file.type.startsWith('audio/')) {
                continue;
            }
            
            // Create a URL for the file
            const fileURL = URL.createObjectURL(file);
            
            // Extract title and author from filename (simple approach)
            let trackTitle = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension
            let trackAuthor = "未知作者";
            
            // Try to extract author and title if filename has a common format
            const match = trackTitle.match(/^(.+)\s*[-–]\s*(.+)$/);
            if (match) {
                trackAuthor = match[1].trim();
                trackTitle = match[2].trim();
            }
            
            // Add to playlist
            this.addToPlaylist({
                id: Date.now() + i,
                title: trackTitle,
                author: trackAuthor,
                url: fileURL,
                filename: file.name,
                duration: 0 // Will be updated when loaded
            });
        }
        
        // Save playlist to localStorage
        this.savePlaylist();
        
        // Update UI
        this.updatePlaylistUI();
        
        // Switch to player view
        this.switchToPlayer();
        
        // If no track is playing, start playing the first one
        if (!this.isPlaying && this.playlistItems.length > 0) {
            this.playTrack(0);
        }
        
        // Show toast
        this.showToast(`已添加 ${files.length} 个文件到播放列表`);
    }

    addToPlaylist(track) {
        this.playlistItems.push(track);
    }

    updatePlaylistUI() {
        // Clear playlist
        this.playlist.innerHTML = '';
        
        // Add tracks to playlist
        this.playlistItems.forEach((track, index) => {
            const li = document.createElement('li');
            li.className = `p-4 border-b border-dark-600 flex items-center justify-between playlist-item ${index === this.currentTrackIndex ? 'bg-dark-600' : ''}`;
            
            // Add random color for track icon
            const colors = ['#007AFF', '#FF3B30', '#34C759', '#FF9500', '#5856D6', '#AF52DE'];
            const randomColor = colors[index % colors.length];
            
            // Track info with icon
            const trackInfo = document.createElement('div');
            trackInfo.className = 'flex items-center flex-1 mr-4';
            trackInfo.innerHTML = `
                <div class="w-10 h-10 rounded-full bg-opacity-20 flex items-center justify-center mr-3" style="background-color: ${randomColor}">
                    <i class="fa fa-music" style="color: ${randomColor}"></i>
                </div>
                <div>
                    <h3 class="font-medium truncate">${track.title}</h3>
                    <p class="text-dark-100 text-xs">${track.author}</p>
                </div>
            `;
            
            // Track duration
            const trackDuration = document.createElement('span');
            trackDuration.className = 'text-dark-100 text-xs mr-2';
            trackDuration.textContent = this.formatTime(track.duration);
            
            // Play button (only show for current track)
            const playButton = document.createElement('button');
            playButton.className = `p-2 ${index === this.currentTrackIndex ? 'text-primary' : 'text-dark-100 opacity-0 hover:opacity-100 transition-opacity'}`;
            playButton.innerHTML = `<i class="fa ${index === this.currentTrackIndex && this.isPlaying ? 'fa-pause' : 'fa-play'}"></i>`;
            playButton.addEventListener('click', (e) => {
                e.stopPropagation();
                if (index === this.currentTrackIndex) {
                    this.togglePlayPause();
                } else {
                    this.playTrack(index);
                }
            });
            
            // Assemble list item
            li.appendChild(trackInfo);
            li.appendChild(trackDuration);
            li.appendChild(playButton);
            
            // Click to play
            li.addEventListener('click', () => {
                if (index === this.currentTrackIndex) {
                    this.togglePlayPause();
                } else {
                    this.playTrack(index);
                }
            });
            
            // Add to playlist
            this.playlist.appendChild(li);
        });
        
        // Dispatch playlist updated event for animations
        document.dispatchEvent(new CustomEvent('playlistUpdated'));
    }

    playTrack(index) {
        if (index < 0 || index >= this.playlistItems.length) {
            return;
        }
        
        // Stop current track
        this.audio.pause();
        this.audio.currentTime = 0;
        
        // Update current track index
        this.currentTrackIndex = index;
        
        // Load new track
        const track = this.playlistItems[index];
        this.audio.src = track.url;
        this.audio.playbackRate = this.playbackSpeed;
        
        // Update UI
        this.title.textContent = track.title;
        this.author.textContent = track.author;
        this.updatePlaylistUI();
        this.switchToPlayer();
        
        // Play track
        this.audio.play()
            .then(() => {
                this.isPlaying = true;
                this.updatePlayPauseButton();
            })
            .catch(error => {
                console.error('Error playing track:', error);
                this.showToast('播放失败，请重试');
            });
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        } else {
            // If no track is loaded, load the first one
            if (this.currentTrackIndex === -1 && this.playlistItems.length > 0) {
                this.playTrack(0);
                return;
            }
            
            this.audio.play()
                .then(() => {
                    this.isPlaying = true;
                })
                .catch(error => {
                    console.error('Error playing track:', error);
                    this.showToast('播放失败，请重试');
                });
        }
        
        this.updatePlayPauseButton();
    }

    updatePlayPauseButton() {
        if (this.isPlaying) {
            this.playPauseButton.innerHTML = '<i class="fa fa-pause text-xl"></i>';
            // Add active state styling
            this.playPauseButton.classList.add('bg-primary/90');
        } else {
            this.playPauseButton.innerHTML = '<i class="fa fa-play text-xl"></i>';
            // Remove active state styling
            this.playPauseButton.classList.remove('bg-primary/90');
        }
        
        // Dispatch play state change event for animations
        document.dispatchEvent(new CustomEvent('playStateChange', {
            detail: { isPlaying: this.isPlaying }
        }));
    }

    playPrevious() {
        if (this.playlistItems.length === 0) {
            return;
        }
        
        let newIndex;
        
        if (this.isRandom) {
            // If random mode is on, use the random queue
            if (this.randomQueue.length === 0) {
                this.generateRandomQueue();
            }
            
            // Get the previous track from the random queue
            this.randomQueue.pop(); // Remove current track
            newIndex = this.randomQueue.length > 0 ? this.randomQueue[this.randomQueue.length - 1] : this.getRandomTrackIndex();
            
            // Add to random queue
            if (!this.randomQueue.includes(newIndex)) {
                this.randomQueue.push(newIndex);
            }
        } else {
            // Normal mode
            newIndex = this.currentTrackIndex - 1;
            if (newIndex < 0) {
                newIndex = this.playlistItems.length - 1;
            }
        }
        
        this.playTrack(newIndex);
    }

    playNext() {
        if (this.playlistItems.length === 0) {
            return;
        }
        
        let newIndex;
        
        if (this.isRandom) {
            // If random mode is on, use the random queue
            newIndex = this.getRandomTrackIndex();
            
            // Add to random queue
            if (!this.randomQueue.includes(newIndex)) {
                this.randomQueue.push(newIndex);
            }
        } else {
            // Normal mode
            newIndex = this.currentTrackIndex + 1;
            if (newIndex >= this.playlistItems.length) {
                newIndex = 0;
            }
        }
        
        this.playTrack(newIndex);
    }

    getRandomTrackIndex() {
        if (this.playlistItems.length <= 1) {
            return 0;
        }
        
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * this.playlistItems.length);
        } while (randomIndex === this.currentTrackIndex);
        
        return randomIndex;
    }

    generateRandomQueue() {
        this.randomQueue = [];
        for (let i = 0; i < this.playlistItems.length; i++) {
            if (i !== this.currentTrackIndex) {
                this.randomQueue.push(i);
            }
        }
        
        // Shuffle the queue
        for (let i = this.randomQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.randomQueue[i], this.randomQueue[j]] = [this.randomQueue[j], this.randomQueue[i]];
        }
        
        // Add current track at the end
        if (this.currentTrackIndex !== -1) {
            this.randomQueue.push(this.currentTrackIndex);
        }
    }

    toggleRepeat() {
        this.isRepeating = !this.isRepeating;
        this.audio.loop = this.isRepeating;
        
        if (this.isRepeating) {
            this.repeatButton.classList.remove('text-dark-100');
            this.repeatButton.classList.add('text-primary');
            // Add bounce animation
            this.repeatButton.classList.add('bounce');
            setTimeout(() => {
                this.repeatButton.classList.remove('bounce');
            }, 500);
        } else {
            this.repeatButton.classList.remove('text-primary');
            this.repeatButton.classList.add('text-dark-100');
        }
        
        // Show notification
        this.showToast(this.isRepeating ? '已开启单曲循环' : '已关闭单曲循环', 'info');
    }

    toggleRandom() {
        this.isRandom = !this.isRandom;
        
        if (this.isRandom) {
            this.randomButton.classList.remove('text-dark-100');
            this.randomButton.classList.add('text-primary');
            this.generateRandomQueue();
            // Add rotate animation
            this.randomButton.classList.add('rotate-icon', 'rotated');
        } else {
            this.randomButton.classList.remove('text-primary');
            this.randomButton.classList.add('text-dark-100');
            this.randomQueue = [];
            // Remove rotate animation
            this.randomButton.classList.remove('rotate-icon', 'rotated');
        }
        
        // Show notification
        this.showToast(this.isRandom ? '已开启随机播放' : '已关闭随机播放', 'info');
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            this.previousVolume = this.volumeSlider.value;
            this.volumeSlider.value = 0;
            this.audio.volume = 0;
            this.muteButton.innerHTML = '<i class="fa fa-volume-off"></i>';
        } else {
            this.volumeSlider.value = this.previousVolume;
            this.audio.volume = this.previousVolume / 100;
            this.muteButton.innerHTML = this.previousVolume > 50 ? 
                '<i class="fa fa-volume-up"></i>' : 
                '<i class="fa fa-volume-down"></i>';
        }
    }

    adjustVolume() {
        const volume = this.volumeSlider.value;
        this.audio.volume = volume / 100;
        
        // Update mute state
        if (volume === 0) {
            this.isMuted = true;
            this.muteButton.innerHTML = '<i class="fa fa-volume-off"></i>';
        } else {
            this.isMuted = false;
            this.previousVolume = volume;
            this.muteButton.innerHTML = volume > 50 ? 
                '<i class="fa fa-volume-up"></i>' : 
                '<i class="fa fa-volume-down"></i>';
        }
    }

    updateProgress() {
        const currentTime = this.audio.currentTime;
        const duration = this.audio.duration;
        
        // Update progress bar
        if (duration > 0) {
            const progress = (currentTime / duration) * 100;
            this.progressBar.value = progress;
        }
        
        // Update time display
        this.currentTime.textContent = this.formatTime(currentTime);
    }

    updateTrackInfo() {
        // Update duration
        const duration = this.audio.duration;
        this.duration.textContent = this.formatTime(duration);
        
        // Update track duration in playlist
        if (this.currentTrackIndex !== -1) {
            this.playlistItems[this.currentTrackIndex].duration = duration;
            this.savePlaylist();
            this.updatePlaylistUI();
        }
    }

    seek() {
        const seekTime = (this.progressBar.value / 100) * this.audio.duration;
        this.audio.currentTime = seekTime;
    }

    handleTrackEnd() {
        if (this.isRepeating) {
            // If repeating is on, just loop the current track
            this.audio.currentTime = 0;
            this.audio.play();
        } else {
            // Otherwise, play the next track
            this.playNext();
        }
    }

    handleAudioError(error) {
        console.error('Audio error:', error);
        this.showToast('播放出错，请检查文件格式');
        this.isPlaying = false;
        this.updatePlayPauseButton();
    }

    formatTime(seconds) {
        if (isNaN(seconds) || seconds === Infinity) {
            return '0:00';
        }
        
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    openSpeedModal() {
        this.speedModal.classList.remove('hidden');
        
        // Highlight current speed
        this.speedOptions.forEach(option => {
            if (option.dataset.speed === this.playbackSpeed.toString()) {
                option.classList.add('bg-primary', 'text-white');
            } else {
                option.classList.remove('bg-primary', 'text-white');
            }
        });
    }

    closeSpeedModal() {
        this.speedModal.classList.add('hidden');
    }

    setPlaybackSpeed(speed) {
        this.playbackSpeed = parseFloat(speed);
        this.audio.playbackRate = this.playbackSpeed;
        this.speedButton.innerHTML = `<span class="text-xs">${this.playbackSpeed.toFixed(1)}x</span>`;
        this.closeSpeedModal();
    }

    switchToLibrary() {
        // Dispatch page change event for animations
        document.dispatchEvent(new CustomEvent('pageChange', {
            detail: {
                from: this.playerArea.classList.contains('hidden') ? this.playlistArea : this.playerArea,
                to: this.fileSelection
            }
        }));
        
        this.libraryButton.classList.remove('text-dark-100');
        this.libraryButton.classList.add('text-primary');
        this.playerButton.classList.remove('text-primary');
        this.playerButton.classList.add('text-dark-100');
        this.playlistButton.classList.remove('text-primary');
        this.playlistButton.classList.add('text-dark-100');
        
        // Add tab transition effect
        this.libraryButton.classList.add('scale-in');
        setTimeout(() => {
            this.libraryButton.classList.remove('scale-in');
        }, 300);
    }

    switchToPlayer() {
        // Dispatch page change event for animations
        document.dispatchEvent(new CustomEvent('pageChange', {
            detail: {
                from: this.fileSelection.classList.contains('hidden') ? this.playlistArea : this.fileSelection,
                to: this.playerArea
            }
        }));
        
        this.libraryButton.classList.remove('text-primary');
        this.libraryButton.classList.add('text-dark-100');
        this.playerButton.classList.remove('text-dark-100');
        this.playerButton.classList.add('text-primary');
        this.playlistButton.classList.remove('text-primary');
        this.playlistButton.classList.add('text-dark-100');
        
        // Add tab transition effect
        this.playerButton.classList.add('scale-in');
        setTimeout(() => {
            this.playerButton.classList.remove('scale-in');
        }, 300);
    }

    switchToPlaylist() {
        // Dispatch page change event for animations
        document.dispatchEvent(new CustomEvent('pageChange', {
            detail: {
                from: this.fileSelection.classList.contains('hidden') ? this.playerArea : this.fileSelection,
                to: this.playlistArea
            }
        }));
        
        this.libraryButton.classList.remove('text-primary');
        this.libraryButton.classList.add('text-dark-100');
        this.playerButton.classList.remove('text-primary');
        this.playerButton.classList.add('text-dark-100');
        this.playlistButton.classList.remove('text-dark-100');
        this.playlistButton.classList.add('text-primary');
        
        // Add tab transition effect
        this.playlistButton.classList.add('scale-in');
        setTimeout(() => {
            this.playlistButton.classList.remove('scale-in');
        }, 300);
    }

    goBack() {
        // If we're in playlist view, go back to player
        if (!this.playlistArea.classList.contains('hidden')) {
            this.switchToPlayer();
            return;
        }
        
        // If we're in player view, go back to library
        if (!this.playerArea.classList.contains('hidden')) {
            this.switchToLibrary();
            return;
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark');
        
        if (document.body.classList.contains('dark')) {
            this.themeToggle.innerHTML = '<i class="fa fa-sun-o text-lg"></i>';
        } else {
            this.themeToggle.innerHTML = '<i class="fa fa-moon-o text-lg"></i>';
        }
    }

    clearPlaylist() {
        if (this.playlistItems.length === 0) {
            return;
        }
        
        // Stop current track
        this.audio.pause();
        this.audio.currentTime = 0;
        
        // Clear playlist
        this.playlistItems = [];
        this.currentTrackIndex = -1;
        this.isPlaying = false;
        this.randomQueue = [];
        
        // Update UI
        this.updatePlaylistUI();
        this.updatePlayPauseButton();
        this.switchToLibrary();
        
        // Clear from localStorage
        localStorage.removeItem('audioPlayerPlaylist');
        
        // Show toast
        this.showToast('播放列表已清空');
    }

    async createScreenshotZip() {
        if (this.currentTrackIndex === -1) {
            this.showToast('没有正在播放的内容');
            return;
        }
        
        try {
            // Create a canvas from the current player view
            const canvas = await this.capturePlayerView();
            
            // Create a zip file
            const zip = new JSZip();
            
            // Convert canvas to blob
            canvas.toBlob((blob) => {
                // Add screenshot to zip
                zip.file('player_screenshot.png', blob);
                
                // Add track info as JSON
                const trackInfo = {
                    title: this.playlistItems[this.currentTrackIndex].title,
                    author: this.playlistItems[this.currentTrackIndex].author,
                    currentTime: this.audio.currentTime,
                    duration: this.audio.duration,
                    timestamp: new Date().toISOString()
                };
                
                zip.file('track_info.json', JSON.stringify(trackInfo, null, 2));
                
                // Generate and download the zip file
                zip.generateAsync({ type: 'blob' })
                    .then((content) => {
                        saveAs(content, `audio_screenshot_${Date.now()}.zip`);
                        this.showToast('截图压缩包已生成');
                    })
                    .catch((error) => {
                        console.error('Error generating zip:', error);
                        this.showToast('生成压缩包失败');
                    });
            });
        } catch (error) {
            console.error('Error creating screenshot:', error);
            this.showToast('创建截图失败');
        }
    }

    capturePlayerView() {
        return new Promise((resolve, reject) => {
            try {
                // Create a canvas with the same dimensions as the player area
                const canvas = document.createElement('canvas');
                const playerRect = this.playerArea.getBoundingClientRect();
                canvas.width = playerRect.width;
                canvas.height = playerRect.height;
                
                // Get the 2D context
                const ctx = canvas.getContext('2d');
                
                // Set background color
                ctx.fillStyle = '#18181A';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw book cover
                const bookCoverRect = this.bookCover.getBoundingClientRect();
                const bookCoverX = bookCoverRect.left - playerRect.left;
                const bookCoverY = bookCoverRect.top - playerRect.top;
                
                // Create a temporary canvas for the book cover
                const bookCoverCanvas = document.createElement('canvas');
                bookCoverCanvas.width = bookCoverRect.width;
                bookCoverCanvas.height = bookCoverRect.height;
                const bookCoverCtx = bookCoverCanvas.getContext('2d');
                
                // Draw the book cover content
                bookCoverCtx.fillStyle = '#2C2C2E';
                bookCoverCtx.fillRect(0, 0, bookCoverRect.width, bookCoverRect.height);
                
                // Draw the book icon
                const iconSize = Math.min(bookCoverRect.width, bookCoverRect.height) * 0.5;
                const iconX = (bookCoverRect.width - iconSize) / 2;
                const iconY = (bookCoverRect.height - iconSize) / 2;
                
                // Simple book icon drawing
                bookCoverCtx.fillStyle = '#48484A';
                bookCoverCtx.fillRect(iconX, iconY, iconSize, iconSize * 0.7);
                bookCoverCtx.fillRect(iconX + iconSize * 0.1, iconY - iconSize * 0.1, iconSize * 0.8, iconSize * 0.1);
                
                // Draw the book cover onto the main canvas
                ctx.drawImage(bookCoverCanvas, bookCoverX, bookCoverY, bookCoverRect.width, bookCoverRect.height);
                
                // Draw track info
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(this.title.textContent, canvas.width / 2, bookCoverY + bookCoverRect.height + 40);
                
                ctx.fillStyle = '#8E8E93';
                ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
                ctx.fillText(this.author.textContent, canvas.width / 2, bookCoverY + bookCoverRect.height + 65);
                
                // Draw progress bar
                const progressBarWidth = canvas.width * 0.8;
                const progressBarHeight = 4;
                const progressBarX = (canvas.width - progressBarWidth) / 2;
                const progressBarY = bookCoverY + bookCoverRect.height + 100;
                
                // Background
                ctx.fillStyle = '#48484A';
                ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
                
                // Progress
                const progress = (this.audio.currentTime / this.audio.duration) * progressBarWidth;
                ctx.fillStyle = '#007AFF';
                ctx.fillRect(progressBarX, progressBarY, progress, progressBarHeight);
                
                // Progress thumb
                const thumbX = progressBarX + progress - 6;
                const thumbY = progressBarY - 4;
                ctx.beginPath();
                ctx.arc(thumbX, thumbY + 2, 6, 0, Math.PI * 2);
                ctx.fillStyle = '#007AFF';
                ctx.fill();
                
                // Draw time
                ctx.fillStyle = '#8E8E93';
                ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(this.currentTime.textContent, progressBarX, progressBarY - 8);
                
                ctx.textAlign = 'right';
                ctx.fillText(this.duration.textContent, progressBarX + progressBarWidth, progressBarY - 8);
                
                // Draw play button
                const playButtonSize = 60;
                const playButtonX = (canvas.width - playButtonSize) / 2;
                const playButtonY = progressBarY + 60;
                
                ctx.beginPath();
                ctx.arc(playButtonX + playButtonSize / 2, playButtonY + playButtonSize / 2, playButtonSize / 2, 0, Math.PI * 2);
                ctx.fillStyle = '#007AFF';
                ctx.fill();
                
                // Draw play icon
                const iconPadding = 15;
                if (this.isPlaying) {
                    // Pause icon
                    const pauseWidth = 10;
                    const pauseHeight = 20;
                    const pauseX = playButtonX + playButtonSize / 2 - pauseWidth - 5;
                    const pauseY = playButtonY + playButtonSize / 2 - pauseHeight / 2;
                    
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(pauseX, pauseY, pauseWidth, pauseHeight);
                    ctx.fillRect(pauseX + pauseWidth + 10, pauseY, pauseWidth, pauseHeight);
                } else {
                    // Play icon
                    const triangleWidth = 20;
                    const triangleHeight = 25;
                    const triangleX = playButtonX + playButtonSize / 2 + 5;
                    const triangleY = playButtonY + playButtonSize / 2 - triangleHeight / 2;
                    
                    ctx.beginPath();
                    ctx.moveTo(triangleX + triangleWidth, triangleY);
                    ctx.lineTo(triangleX, triangleY + triangleHeight / 2);
                    ctx.lineTo(triangleX + triangleWidth, triangleY + triangleHeight);
                    ctx.closePath();
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fill();
                }
                
                resolve(canvas);
            } catch (error) {
                reject(error);
            }
        });
    }

    savePlaylist() {
        // We can't save the actual audio files, but we can save the metadata
        const playlistData = this.playlistItems.map(track => ({
            id: track.id,
            title: track.title,
            author: track.author,
            filename: track.filename,
            duration: track.duration
        }));
        
        localStorage.setItem('audioPlayerPlaylist', JSON.stringify(playlistData));
    }

    loadPlaylist() {
        try {
            const savedPlaylist = localStorage.getItem('audioPlayerPlaylist');
            if (savedPlaylist) {
                this.playlistItems = JSON.parse(savedPlaylist);
            }
        } catch (error) {
            console.error('Error loading playlist:', error);
            this.playlistItems = [];
        }
    }

    showToast(message, type = 'info') {
        // This method will be overridden by the animations class
        // in the DOMContentLoaded event listener
        console.log(`Toast: ${message}`);
    }
}

// Initialize the audio player when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const player = new AudioPlayer();
    
    // Initialize animations
    const animations = new Animations();
    animations.init();
    
    // Add cover rotation effect
    animations.addCoverRotationEffect();
    
    // Add volume slider animation
    animations.addVolumeSliderAnimation();
    
    // Add theme toggle animation
    animations.addThemeToggleAnimation();
    
    // Override showToast method to use animations
    player.showToast = (message, type = 'info') => {
        animations.showNotification(message, type);
    };
});