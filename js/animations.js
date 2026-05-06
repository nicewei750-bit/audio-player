/**
 * 本地小说音频播放器 - 动画效果模块
 * 提供丰富的UI动画和交互效果
 */

class Animations {
    constructor() {
        this.isInitialized = false;
        this.animationFrameId = null;
        this.audioWaveInterval = null;
    }

    /**
     * 初始化所有动画效果
     */
    init() {
        if (this.isInitialized) return;
        
        // 初始化页面过渡动画
        this.initPageTransitions();
        
        // 初始化按钮交互效果
        this.initButtonEffects();
        
        // 初始化进度条动画
        this.initProgressAnimations();
        
        // 初始化列表项动画
        this.initListItemAnimations();
        
        // 初始化音频波形动画
        this.initAudioWaveAnimation();
        
        // 初始化手势支持
        this.initGestureSupport();
        
        this.isInitialized = true;
    }

    /**
     * 初始化页面过渡动画
     */
    initPageTransitions() {
        // 监听页面切换
        document.addEventListener('pageChange', (e) => {
            const { from, to } = e.detail;
            
            // 添加离开动画
            if (from) {
                from.classList.add('page-leave');
                setTimeout(() => {
                    from.classList.add('hidden');
                    from.classList.remove('page-leave');
                }, 300);
            }
            
            // 添加进入动画
            if (to) {
                to.classList.remove('hidden');
                to.classList.add('page-enter');
                setTimeout(() => {
                    to.classList.remove('page-enter');
                }, 300);
            }
        });
    }

    /**
     * 初始化按钮交互效果
     */
    initButtonEffects() {
        // 为所有按钮添加波纹效果
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            // 跳过已经添加效果的按钮
            if (button.classList.contains('ripple-effect')) return;
            
            button.classList.add('ripple-effect');
            button.addEventListener('click', (e) => {
                this.createRipple(e, button);
            });
        });
        
        // 为播放/暂停按钮添加特殊动画
        const playPauseButton = document.getElementById('playPauseButton');
        if (playPauseButton) {
            playPauseButton.addEventListener('click', () => {
                playPauseButton.classList.add('pulse-animation');
                setTimeout(() => {
                    playPauseButton.classList.remove('pulse-animation');
                }, 300);
            });
        }
    }

    /**
     * 创建按钮点击波纹效果
     * @param {Event} e - 点击事件
     * @param {HTMLElement} button - 按钮元素
     */
    createRipple(e, button) {
        // 获取按钮位置和尺寸
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        // 创建波纹元素
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        // 清除之前的波纹
        const existingRipple = button.querySelector('.ripple');
        if (existingRipple) {
            existingRipple.remove();
        }
        
        // 添加新波纹
        button.appendChild(ripple);
    }

    /**
     * 初始化进度条动画
     */
    initProgressAnimations() {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            // 添加拖动时的动画效果
            progressBar.addEventListener('input', () => {
                progressBar.classList.add('scrubbing');
            });
            
            progressBar.addEventListener('change', () => {
                progressBar.classList.remove('scrubbing');
            });
            
            // 添加自动更新时的平滑过渡
            const originalSetAttribute = progressBar.setAttribute;
            progressBar.setAttribute = function(name, value) {
                if (name === 'value' && !progressBar.classList.contains('scrubbing')) {
                    progressBar.style.setProperty('--target-value', value);
                }
                originalSetAttribute.call(this, name, value);
            };
        }
    }

    /**
     * 初始化列表项动画
     */
    initListItemAnimations() {
        // 监听播放列表更新
        document.addEventListener('playlistUpdated', () => {
            const items = document.querySelectorAll('#playlist li');
            items.forEach((item, index) => {
                // 添加进入动画
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                    item.style.transitionDelay = `${index * 50}ms`;
                }, 10);
                
                // 添加悬停效果
                item.addEventListener('mouseenter', () => {
                    item.style.transform = 'translateX(5px)';
                });
                
                item.addEventListener('mouseleave', () => {
                    item.style.transform = 'translateX(0)';
                });
                
                // 添加点击效果
                item.addEventListener('click', () => {
                    item.classList.add('selected');
                    setTimeout(() => {
                        item.classList.remove('selected');
                    }, 300);
                });
            });
        });
    }

    /**
     * 初始化音频波形动画
     */
    initAudioWaveAnimation() {
        // 创建音频波形容器
        const waveContainer = document.createElement('div');
        waveContainer.id = 'audioWave';
        waveContainer.classList.add('audio-wave', 'hidden');
        
        // 创建波形条
        for (let i = 0; i < 5; i++) {
            const bar = document.createElement('span');
            bar.style.animationDelay = `${i * 0.1}s`;
            waveContainer.appendChild(bar);
        }
        
        // 将波形添加到播放按钮旁边
        const playPauseButton = document.getElementById('playPauseButton');
        if (playPauseButton && playPauseButton.parentNode) {
            playPauseButton.parentNode.appendChild(waveContainer);
        }
        
        // 监听播放状态变化
        document.addEventListener('playStateChange', (e) => {
            const { isPlaying } = e.detail;
            
            if (isPlaying) {
                waveContainer.classList.remove('hidden');
                waveContainer.classList.add('active');
            } else {
                waveContainer.classList.add('hidden');
                waveContainer.classList.remove('active');
            }
        });
    }

    /**
     * 初始化手势支持
     */
    initGestureSupport() {
        // 检查是否支持触摸事件
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isTouchDevice) return;
        
        // 添加滑动手势支持
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, false);
        
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            handleSwipe();
        }, false);
        
        function handleSwipe() {
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;
            
            // 水平滑动
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 100) {
                // 向左滑动
                if (diffX > 0) {
                    document.dispatchEvent(new CustomEvent('swipe', { 
                        detail: { direction: 'left' } 
                    }));
                }
                // 向右滑动
                else {
                    document.dispatchEvent(new CustomEvent('swipe', { 
                        detail: { direction: 'right' } 
                    }));
                }
            }
            // 垂直滑动
            else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 100) {
                // 向上滑动
                if (diffY > 0) {
                    document.dispatchEvent(new CustomEvent('swipe', { 
                        detail: { direction: 'up' } 
                    }));
                }
                // 向下滑动
                else {
                    document.dispatchEvent(new CustomEvent('swipe', { 
                        detail: { direction: 'down' } 
                    }));
                }
            }
        }
    }

    /**
     * 为封面添加3D旋转效果
     */
    addCoverRotationEffect() {
        const bookCover = document.getElementById('bookCover');
        if (!bookCover) return;
        
        let isRotating = false;
        
        // 监听播放状态变化
        document.addEventListener('playStateChange', (e) => {
            const { isPlaying } = e.detail;
            
            if (isPlaying && !isRotating) {
                bookCover.classList.add('rotate-slow');
                isRotating = true;
            } else if (!isPlaying && isRotating) {
                bookCover.classList.remove('rotate-slow');
                isRotating = false;
            }
        });
        
        // 添加鼠标悬停效果
        bookCover.addEventListener('mouseenter', () => {
            if (!isRotating) {
                bookCover.classList.add('rotate-on-hover');
            }
        });
        
        bookCover.addEventListener('mouseleave', () => {
            bookCover.classList.remove('rotate-on-hover');
        });
    }

    /**
     * 添加音量滑块动画
     */
    addVolumeSliderAnimation() {
        const volumeSlider = document.getElementById('volumeSlider');
        const muteButton = document.getElementById('muteButton');
        
        if (!volumeSlider || !muteButton) return;
        
        // 创建音量弹出指示器
        const volumeIndicator = document.createElement('div');
        volumeIndicator.id = 'volumeIndicator';
        volumeIndicator.classList.add('volume-indicator', 'hidden');
        volumeIndicator.innerHTML = '<i class="fa fa-volume-up"></i>';
        muteButton.parentNode.appendChild(volumeIndicator);
        
        // 显示/隐藏音量指示器
        volumeSlider.addEventListener('input', () => {
            const volume = parseInt(volumeSlider.value);
            volumeIndicator.classList.remove('hidden');
            
            // 更新图标
            if (volume === 0) {
                volumeIndicator.innerHTML = '<i class="fa fa-volume-off"></i>';
            } else if (volume < 50) {
                volumeIndicator.innerHTML = '<i class="fa fa-volume-down"></i>';
            } else {
                volumeIndicator.innerHTML = '<i class="fa fa-volume-up"></i>';
            }
            
            // 更新指示器位置
            const percent = (volume / 100) * 100;
            volumeIndicator.style.left = `${percent}%`;
            
            // 清除之前的定时器
            clearTimeout(volumeIndicator.hideTimer);
            
            // 3秒后隐藏
            volumeIndicator.hideTimer = setTimeout(() => {
                volumeIndicator.classList.add('hidden');
            }, 3000);
        });
    }

    /**
     * 添加主题切换动画
     */
    addThemeToggleAnimation() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;
        
        themeToggle.addEventListener('click', () => {
            // 添加切换动画
            document.body.classList.add('theme-transition');
            
            // 移除动画类
            setTimeout(() => {
                document.body.classList.remove('theme-transition');
            }, 500);
        });
    }

    /**
     * 添加通知动画
     */
    showNotification(message, type = 'info', duration = 3000) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.classList.add('notification', type);
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close"><i class="fa fa-times"></i></button>
        `;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示通知
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // 关闭按钮
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => {
            this.hideNotification(notification);
        });
        
        // 自动隐藏
        if (duration > 0) {
            notification.hideTimer = setTimeout(() => {
                this.hideNotification(notification);
            }, duration);
        }
        
        return notification;
    }

    /**
     * 隐藏通知
     */
    hideNotification(notification) {
        if (!notification) return;
        
        // 清除定时器
        clearTimeout(notification.hideTimer);
        
        // 隐藏动画
        notification.classList.remove('show');
        
        // 移除元素
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    /**
     * 添加加载动画
     */
    showLoading(element) {
        // 创建加载元素
        const loading = document.createElement('div');
        loading.classList.add('loading-overlay');
        loading.innerHTML = '<div class="loading-spinner"></div>';
        
        // 添加到目标元素
        if (element) {
            element.classList.add('loading-container');
            element.appendChild(loading);
        } else {
            document.body.appendChild(loading);
        }
        
        return loading;
    }

    /**
     * 隐藏加载动画
     */
    hideLoading(element) {
        if (!element) return;
        
        const loading = element.querySelector('.loading-overlay');
        if (loading) {
            loading.classList.add('fade-out');
            
            setTimeout(() => {
                loading.remove();
                element.classList.remove('loading-container');
            }, 300);
        }
    }

    /**
     * 添加数字滚动动画
     */
    animateNumber(element, start, end, duration = 1000) {
        if (!element) return;
        
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            
            element.textContent = value;
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        
        window.requestAnimationFrame(step);
    }

    /**
     * 添加颜色渐变动画
     */
    animateBackgroundGradient(element, colors, duration = 5000) {
        if (!element) return;
        
        let currentIndex = 0;
        const colorCount = colors.length;
        
        const changeColor = () => {
            const nextIndex = (currentIndex + 1) % colorCount;
            const currentColor = colors[currentIndex];
            const nextColor = colors[nextIndex];
            
            element.style.background = `linear-gradient(45deg, ${currentColor}, ${nextColor})`;
            
            currentIndex = nextIndex;
            setTimeout(changeColor, duration);
        };
        
        // 开始动画
        changeColor();
    }

    /**
     * 销毁所有动画
     */
    destroy() {
        // 清除动画帧
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // 清除定时器
        if (this.audioWaveInterval) {
            clearInterval(this.audioWaveInterval);
        }
        
        // 移除所有事件监听器
        const rippleEffects = document.querySelectorAll('.ripple-effect');
        rippleEffects.forEach(button => {
            button.replaceWith(button.cloneNode(true));
        });
        
        this.isInitialized = false;
    }
}

// 导出动画类
window.Animations = Animations;