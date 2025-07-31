/**
 * KQXS Theme Manager - Professional Module
 * Quản lý theme và tương tác cho hệ thống KQXS 3 miền
 */

// ==================== CONSTANTS ====================
const THEMES = {
    NORTH: 'north',
    CENTRAL: 'central', 
    SOUTH: 'south'
};

const THEME_CONFIG = {
    [THEMES.NORTH]: {
        name: 'Miền Bắc',
        colors: {
            primary: '#dc2626',
            secondary: '#fbbf24',
            accent: '#b91c1c',
            light: '#fef2f2'
        },
        icon: 'fas fa-pagoda',
        culture: '🏛️ Hà Nội nghìn năm văn hiến',
        tagline: 'Kinh đô thiên niên kỷ',
        drawTime: '18:15',
        specialInfo: 'Thủ đô Hà Nội - Trái tim của đất nước'
    },
    [THEMES.CENTRAL]: {
        name: 'Miền Trung', 
        colors: {
            primary: '#ea580c',
            secondary: '#fbbf24',
            accent: '#c2410c',
            light: '#fff7ed'
        },
        icon: 'fas fa-crown',
        culture: '👑 Cố đô Huế hoàng gia',
        tagline: 'Miền đất Hoàng triều',
        drawTime: '17:00',
        specialInfo: 'Cố đô Huế - Kinh thành hoàng gia'
    },
    [THEMES.SOUTH]: {
        name: 'Miền Nam',
        colors: {
            primary: '#059669',
            secondary: '#10b981',
            accent: '#047857',
            light: '#f0fdf4'
        },
        icon: 'fas fa-palm-tree',
        culture: '🌴 Thành phố Hồ Chí Minh nhiệt đới',
        tagline: 'Đất phương Nam đầy nắng',
        drawTime: '16:00', 
        specialInfo: 'TP.HCM - Trung tâm kinh tế đất nước'
    }
};

// ==================== THEME MANAGER CLASS ====================
class ThemeManager {
    constructor() {
        this.currentTheme = this.detectTheme();
        this.init();
    }

    /**
     * Phát hiện theme hiện tại từ body class
     */
    detectTheme() {
        const body = document.body;
        if (body.classList.contains('theme-north')) return THEMES.NORTH;
        if (body.classList.contains('theme-central')) return THEMES.CENTRAL;
        if (body.classList.contains('theme-south')) return THEMES.SOUTH;
        return THEMES.NORTH; // default
    }

    /**
     * Khởi tạo theme manager
     */
    init() {
        this.applyTheme(this.currentTheme);
        this.bindEvents();
        this.updateDynamicContent();
    }

    /**
     * Áp dụng theme
     */
    applyTheme(theme) {
        if (!THEME_CONFIG[theme]) return;

        this.currentTheme = theme;
        const config = THEME_CONFIG[theme];
        
        // Update CSS custom properties
        const root = document.documentElement;
        Object.entries(config.colors).forEach(([property, value]) => {
            root.style.setProperty(`--color-${property}`, value);
        });

        // Update body class
        document.body.className = document.body.className.replace(/theme-\w+/, '');
        document.body.classList.add(`theme-${theme}`);

        // Update meta theme-color
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            themeColorMeta.setAttribute('content', config.colors.primary);
        }

        console.log(`Theme switched to: ${config.name}`);
    }

    /**
     * Cập nhật nội dung động theo theme
     */
    updateDynamicContent() {
        const config = THEME_CONFIG[this.currentTheme];
        
        // Update draw time
        const drawTimeElements = document.querySelectorAll('[data-draw-time]');
        drawTimeElements.forEach(el => {
            el.textContent = config.drawTime;
        });

        // Update cultural info
        const cultureElements = document.querySelectorAll('[data-culture]');
        cultureElements.forEach(el => {
            el.textContent = config.culture;
        });

        // Update special info
        const specialElements = document.querySelectorAll('[data-special-info]');
        specialElements.forEach(el => {
            el.textContent = config.specialInfo;
        });
    }

    /**
     * Bind events
     */
    bindEvents() {
        // Region selector
        const regionSelector = document.getElementById('region-selector');
        if (regionSelector) {
            regionSelector.addEventListener('change', (e) => {
                const selectedRegion = e.target.value;
                if (THEME_CONFIG[selectedRegion]) {
                    this.switchTheme(selectedRegion);
                }
            });
        }

        // Theme switcher buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-theme]')) {
                const theme = e.target.getAttribute('data-theme');
                this.switchTheme(theme);
            }
        });
    }

    /**
     * Chuyển đổi theme
     */
    switchTheme(theme) {
        if (!THEME_CONFIG[theme] || theme === this.currentTheme) return;

        // Smooth transition
        document.body.style.transition = 'all 0.3s ease';
        
        this.applyTheme(theme);
        this.updateDynamicContent();
        
        // Remove transition after completion
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);

        // Trigger custom event
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { 
                oldTheme: this.currentTheme,
                newTheme: theme,
                config: THEME_CONFIG[theme]
            }
        }));
    }

    /**
     * Get current theme config
     */
    getCurrentConfig() {
        return THEME_CONFIG[this.currentTheme];
    }
}

// ==================== ANIMATION MANAGER ====================
class AnimationManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.setupLoadingAnimations();
    }

    /**
     * Setup Intersection Observer for scroll animations
     */
    setupIntersectionObserver() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-fade-in');
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            }
        );

        // Observe elements with animation classes
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }

    /**
     * Setup loading animations
     */
    setupLoadingAnimations() {
        // Stagger animation for cards
        const cards = document.querySelectorAll('.card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });

        // Stats counter animation
        this.animateCounters();
    }

    /**
     * Animate number counters
     */
    animateCounters() {
        const counters = document.querySelectorAll('[data-counter]');
        
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-counter'));
            const duration = 2000; // 2 seconds
            const step = target / (duration / 16); // 60fps
            let current = 0;

            const updateCounter = () => {
                current += step;
                if (current < target) {
                    counter.textContent = Math.floor(current).toLocaleString('vi-VN');
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target.toLocaleString('vi-VN');
                }
            };

            updateCounter();
        });
    }

    /**
     * Show loading indicator
     */
    showLoading() {
        const loading = document.getElementById('loading-indicator');
        if (loading) {
            loading.classList.remove('hidden');
        }
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        const loading = document.getElementById('loading-indicator');
        if (loading) {
            loading.classList.add('hidden');
        }
    }
}

// ==================== UI MANAGER ====================
class UIManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupMobileMenu();
        this.setupDatePicker();
        this.setupTooltips();
        this.setupModals();
    }

    /**
     * Setup mobile menu
     */
    setupMobileMenu() {
        const menuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');

        if (menuBtn && mobileMenu) {
            menuBtn.addEventListener('click', () => {
                const isOpen = !mobileMenu.classList.contains('hidden');
                
                if (isOpen) {
                    mobileMenu.classList.add('hidden');
                    menuBtn.setAttribute('aria-expanded', 'false');
                } else {
                    mobileMenu.classList.remove('hidden');
                    menuBtn.setAttribute('aria-expanded', 'true');
                }
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!menuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
                    mobileMenu.classList.add('hidden');
                    menuBtn.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }

    /**
     * Setup date picker with current date
     */
    setupDatePicker() {
        const datePicker = document.getElementById('date-picker');
        if (datePicker) {
            // Set current date as default
            const today = new Date();
            const currentDate = today.toISOString().split('T')[0];
            datePicker.value = currentDate;

            // Set max date to today
            datePicker.max = currentDate;

            // Handle date change
            datePicker.addEventListener('change', (e) => {
                const selectedDate = e.target.value;
                this.loadResultsForDate(selectedDate);
            });
        }
    }

    /**
     * Load results for specific date
     */
    loadResultsForDate(date) {
        console.log(`Loading results for date: ${date}`);
        // Implement actual API call here
        
        // Show loading
        window.animationManager?.showLoading();
        
        // Simulate API call
        setTimeout(() => {
            window.animationManager?.hideLoading();
            this.displayResults(date);
        }, 1000);
    }

    /**
     * Display results
     */
    displayResults(date) {
        const container = document.getElementById('results-container');
        if (!container) return;

        // Sample result display
        container.innerHTML = `
            <div class="card animate-fade-in">
                <div class="card__header">
                    <h4 class="card__title">Kết quả ngày ${new Date(date).toLocaleDateString('vi-VN')}</h4>
                </div>
                <div class="card__body">
                    <p class="text-gray-600">Đang cập nhật kết quả...</p>
                </div>
            </div>
        `;
    }

    /**
     * Setup tooltips
     */
    setupTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', this.showTooltip.bind(this));
            element.addEventListener('mouseleave', this.hideTooltip.bind(this));
        });
    }

    showTooltip(e) {
        const text = e.target.getAttribute('data-tooltip');
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip fixed bg-gray-800 text-white text-sm px-2 py-1 rounded shadow-lg z-50';
        tooltip.textContent = text;
        tooltip.style.left = e.pageX + 10 + 'px';
        tooltip.style.top = e.pageY - 30 + 'px';
        
        document.body.appendChild(tooltip);
        e.target._tooltip = tooltip;
    }

    hideTooltip(e) {
        if (e.target._tooltip) {
            e.target._tooltip.remove();
            delete e.target._tooltip;
        }
    }

    /**
     * Setup modals
     */
    setupModals() {
        // Modal triggers
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-modal]')) {
                const modalId = e.target.getAttribute('data-modal');
                this.openModal(modalId);
            }

            if (e.target.matches('[data-modal-close]')) {
                this.closeModal();
            }
        });

        // Close modal on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.add('hidden');
        });
        document.body.style.overflow = '';
    }
}

// ==================== PERFORMANCE MANAGER ====================
class PerformanceManager {
    constructor() {
        this.metrics = {};
        this.init();
    }

    init() {
        this.measurePageLoad();
        this.setupPerformanceObserver();
    }

    /**
     * Measure page load performance
     */
    measurePageLoad() {
        window.addEventListener('load', () => {
            if ('performance' in window) {
                const perfData = performance.getEntriesByType('navigation')[0];
                this.metrics.pageLoad = {
                    loadTime: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
                    domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
                    firstPaint: this.getFirstPaint(),
                    firstContentfulPaint: this.getFirstContentfulPaint()
                };
                
                console.log('Performance Metrics:', this.metrics.pageLoad);
            }
        });
    }

    getFirstPaint() {
        const entry = performance.getEntriesByName('first-paint')[0];
        return entry ? Math.round(entry.startTime) : null;
    }

    getFirstContentfulPaint() {
        const entry = performance.getEntriesByName('first-contentful-paint')[0];
        return entry ? Math.round(entry.startTime) : null;
    }

    /**
     * Setup Performance Observer
     */
    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.entryType === 'largest-contentful-paint') {
                        this.metrics.lcp = Math.round(entry.startTime);
                    }
                    if (entry.entryType === 'first-input') {
                        this.metrics.fid = Math.round(entry.processingStart - entry.startTime);
                    }
                });
            });

            try {
                observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
            } catch (e) {
                console.log('Performance Observer not supported');
            }
        }
    }

    /**
     * Get performance report
     */
    getReport() {
        return this.metrics;
    }
}

// ==================== MAIN APPLICATION ====================
class KQXSApp {
    constructor() {
        this.themeManager = null;
        this.animationManager = null;
        this.uiManager = null;
        this.performanceManager = null;
        this.init();
    }

    /**
     * Initialize application
     */
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupManagers();
            });
        } else {
            this.setupManagers();
        }
    }

    /**
     * Setup all managers
     */
    setupManagers() {
        try {
            this.themeManager = new ThemeManager();
            this.animationManager = new AnimationManager();
            this.uiManager = new UIManager();
            this.performanceManager = new PerformanceManager();

            // Make managers globally accessible
            window.themeManager = this.themeManager;
            window.animationManager = this.animationManager;
            window.uiManager = this.uiManager;
            window.performanceManager = this.performanceManager;

            console.log('KQXS App initialized successfully');
            this.bindGlobalEvents();

        } catch (error) {
            console.error('Error initializing KQXS App:', error);
        }
    }

    /**
     * Bind global events
     */
    bindGlobalEvents() {
        // View results button
        const viewBtn = document.getElementById('view-results-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', () => {
                const datePicker = document.getElementById('date-picker');
                const regionSelector = document.getElementById('region-selector');
                
                const date = datePicker?.value || new Date().toISOString().split('T')[0];
                const region = regionSelector?.value || 'north';
                
                this.loadResults(date, region);
            });
        }

        // Theme change listener
        window.addEventListener('themeChanged', (e) => {
            console.log('Theme changed:', e.detail);
            // Implement any additional theme change logic here
        });

        // Error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
        });

        // Unhandled promise rejection
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
        });
    }

    /**
     * Load results for date and region
     */
    loadResults(date, region) {
        console.log(`Loading results for ${region} on ${date}`);
        
        this.animationManager.showLoading();
        
        // Simulate API call
        setTimeout(() => {
            this.animationManager.hideLoading();
            
            // Update URL without refresh
            const url = new URL(window.location);
            url.searchParams.set('date', date);
            url.searchParams.set('region', region);
            window.history.pushState({}, '', url);
            
            this.uiManager.displayResults(date);
        }, 1000);
    }
}

// ==================== UTILITY FUNCTIONS ====================
const KQXSUtils = {
    /**
     * Format date to Vietnamese format
     */
    formatDate(date) {
        return new Date(date).toLocaleDateString('vi-VN');
    },

    /**
     * Format number with Vietnamese locale
     */
    formatNumber(number) {
        return new Intl.NumberFormat('vi-VN').format(number);
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// ==================== INITIALIZE APPLICATION ====================
// Initialize the app when script loads
const kqxsApp = new KQXSApp();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { KQXSApp, ThemeManager, AnimationManager, UIManager, PerformanceManager, KQXSUtils };
}
