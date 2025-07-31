/**
 * KQXS Professional JavaScript Architecture
 * Modular approach with separation of concerns
 */

// ================================================== //
// CORE UTILITIES MODULE                              //
// ================================================== //

const Utils = {
  /**
   * Debounce function execution
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
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
   * Throttle function execution
   * @param {Function} func - Function to throttle
   * @param {number} limit - Limit time in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Format date to Vietnamese locale
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   */
  formatDate(date) {
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    }).format(date);
  },

  /**
   * Format date for API calls
   * @param {Date} date - Date to format
   * @returns {string} API formatted date
   */
  formatDateForAPI(date) {
    return date.toISOString().split('T')[0];
  },

  /**
   * Animate number counting up
   * @param {HTMLElement} element - Target element
   * @param {number} target - Target number
   * @param {number} duration - Animation duration
   */
  animateNumber(element, target, duration = 1000) {
    const start = 0;
    const range = target - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      element.textContent = Math.floor(current).toLocaleString('vi-VN');
    }, 16);
  },

  /**
   * Show toast notification
   * @param {string} message - Message to show
   * @param {string} type - Type of toast (success, error, warning, info)
   * @param {number} duration - Duration in milliseconds
   */
  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    
    document.body.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('toast--visible');
    });
    
    // Remove after duration
    setTimeout(() => {
      toast.classList.remove('toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /**
   * Create element with attributes
   * @param {string} tag - HTML tag
   * @param {Object} attributes - Element attributes
   * @param {string} content - Element content
   * @returns {HTMLElement} Created element
   */
  createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else {
        element.setAttribute(key, value);
      }
    });
    
    if (content) {
      element.innerHTML = content;
    }
    
    return element;
  }
};

// ================================================== //
// CACHE MANAGER MODULE                               //
// ================================================== //

class CacheManager {
  constructor(maxSize = 100, ttl = 300000) { // 5 minutes default TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl; // Time to live in milliseconds
  }

  /**
   * Set cache entry
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   */
  set(key, value) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Get cache entry
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Check if key exists and is valid
   * @param {string} key - Cache key
   * @returns {boolean} Whether key exists
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }
}

// ================================================== //
// API SERVICE MODULE                                 //
// ================================================== //

class APIService {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
    this.cache = new CacheManager();
  }

  /**
   * Make HTTP request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise} Response promise
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  /**
   * Get lottery results with caching
   * @param {string} date - Date string
   * @param {string} region - Region code
   * @returns {Promise} Results promise
   */
  async getLotteryResults(date, region = 'all') {
    const cacheKey = `results_${date}_${region}`;
    
    // Check cache first
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const results = await this.request(`/results?date=${date}&region=${region}`);
      
      // Cache the results
      this.cache.set(cacheKey, results);
      
      return results;
    } catch (error) {
      // Return mock data for demo purposes
      return this.getMockResults(region);
    }
  }

  /**
   * Get mock results for demo
   * @param {string} region - Region code
   * @returns {Object} Mock results
   */
  getMockResults(region) {
    const regions = {
      north: {
        name: 'Miền Bắc',
        date: new Date().toLocaleDateString('vi-VN'),
        prizes: [
          { name: 'Giải đặc biệt', numbers: ['12345'] },
          { name: 'Giải nhất', numbers: ['67890'] },
          { name: 'Giải nhì', numbers: ['11111', '22222'] },
          { name: 'Giải ba', numbers: ['33333', '44444', '55555', '66666', '77777', '88888'] }
        ]
      },
      central: {
        name: 'Miền Trung',
        date: new Date().toLocaleDateString('vi-VN'),
        prizes: [
          { name: 'Giải đặc biệt', numbers: ['54321'] },
          { name: 'Giải nhất', numbers: ['09876'] },
          { name: 'Giải nhì', numbers: ['99999', '88888'] },
          { name: 'Giải ba', numbers: ['77777', '66666', '55555', '44444', '33333', '22222'] }
        ]
      },
      south: {
        name: 'Miền Nam',
        date: new Date().toLocaleDateString('vi-VN'),
        prizes: [
          { name: 'Giải đặc biệt', numbers: ['98765'] },
          { name: 'Giải nhất', numbers: ['43210'] },
          { name: 'Giải nhì', numbers: ['11111', '33333'] },
          { name: 'Giải ba', numbers: ['22222', '44444', '55555', '66666', '77777', '99999'] }
        ]
      }
    };

    return region === 'all' ? regions : { [region]: regions[region] };
  }
}

// ================================================== //
// THEME MANAGER MODULE                               //
// ================================================== //

// ================================================== //
// ACCESSIBILITY MANAGER MODULE                       //
// ================================================== //

class AccessibilityManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupSkipLinks();
    this.setupFocusManagement();
    this.setupKeyboardNavigation();
    this.setupScreenReaderAnnouncements();
  }

  /**
   * Setup skip to content links
   */
  setupSkipLinks() {
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(skipLink.getAttribute('href'));
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }

  /**
   * Setup focus management
   */
  setupFocusManagement() {
    // Trap focus in mobile menu
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const mobileMenu = document.querySelector('#mobile-menu');
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
          this.trapFocus(e, mobileMenu);
        }
      }
    });
  }

  /**
   * Trap focus within an element
   * @param {KeyboardEvent} e - Keyboard event
   * @param {HTMLElement} container - Container element
   */
  trapFocus(e, container) {
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  }

  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Escape key handling
      if (e.key === 'Escape') {
        this.handleEscape();
      }
      
      // Arrow key navigation
      if (e.target.matches('.nav__link')) {
        this.handleArrowNavigation(e);
      }
    });
  }

  /**
   * Handle escape key press
   */
  handleEscape() {
    // Close mobile menu
    const mobileMenu = document.querySelector('#mobile-menu');
    const mobileMenuBtn = document.querySelector('#mobile-menu-btn');
    
    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
      mobileMenu.classList.add('hidden');
      mobileMenuBtn?.focus();
    }

    // Close any open modals or dropdowns
    const openModals = document.querySelectorAll('.modal:not(.hidden)');
    openModals.forEach(modal => {
      modal.classList.add('hidden');
    });
  }

  /**
   * Handle arrow key navigation
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleArrowNavigation(e) {
    const links = Array.from(document.querySelectorAll('.nav__link'));
    const currentIndex = links.indexOf(e.target);
    
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % links.length;
      links[nextIndex].focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex === 0 ? links.length - 1 : currentIndex - 1;
      links[prevIndex].focus();
    }
  }

  /**
   * Setup screen reader announcements
   */
  setupScreenReaderAnnouncements() {
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.className = 'sr-only';
    document.body.appendChild(this.announcer);
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   */
  announce(message) {
    if (this.announcer) {
      this.announcer.textContent = message;
    }
  }
}

// ================================================== //
// LOTTERY RESULTS RENDERER MODULE                    //
// ================================================== //

class LotteryRenderer {
  constructor(container) {
    this.container = container;
  }

  /**
   * Render lottery results
   * @param {Object} results - Results data
   * @param {string} region - Region code
   */
  render(results, region) {
    this.container.innerHTML = '';
    
    if (region === 'all') {
      Object.entries(results).forEach(([regionKey, regionData]) => {
        this.renderRegion(regionKey, regionData);
      });
    } else {
      this.renderRegion(region, results[region]);
    }
  }

  /**
   * Render single region results
   * @param {string} regionKey - Region key
   * @param {Object} regionData - Region data
   */
  renderRegion(regionKey, regionData) {
    const regionCard = Utils.createElement('div', {
      className: `card lottery-card theme-${regionKey}`,
      dataset: { region: regionKey }
    });

    const header = Utils.createElement('div', {
      className: 'card__header'
    }, `
      <h3 class="card__title">
        <i class="fas fa-${this.getRegionIcon(regionKey)} mr-2"></i>
        ${regionData.name}
      </h3>
      <p class="card__subtitle">${regionData.date}</p>
    `);

    const body = Utils.createElement('div', {
      className: 'card__body'
    });

    const table = this.createResultsTable(regionData.prizes);
    body.appendChild(table);

    regionCard.appendChild(header);
    regionCard.appendChild(body);
    this.container.appendChild(regionCard);

    // Add fade-in animation
    requestAnimationFrame(() => {
      regionCard.classList.add('animate-fade-in');
    });
  }

  /**
   * Create results table
   * @param {Array} prizes - Prize data
   * @returns {HTMLElement} Table element
   */
  createResultsTable(prizes) {
    const table = Utils.createElement('table', {
      className: 'lottery-table',
      role: 'table'
    });

    const thead = Utils.createElement('thead', {
      className: 'lottery-table__header'
    });

    const headerRow = Utils.createElement('tr', {}, `
      <th scope="col">Giải thưởng</th>
      <th scope="col">Kết quả</th>
    `);

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = Utils.createElement('tbody');

    prizes.forEach((prize, index) => {
      const row = Utils.createElement('tr', {
        className: 'lottery-table__row'
      });

      const prizeCell = Utils.createElement('td', {
        className: 'lottery-table__cell lottery-table__prize'
      }, prize.name);

      const numbersCell = Utils.createElement('td', {
        className: 'lottery-table__cell'
      });

      const numbersList = Utils.createElement('div', {
        className: 'prize-numbers'
      });

      prize.numbers.forEach(number => {
        const numberSpan = Utils.createElement('span', {
          className: `prize-number ${this.getPrizeClass(index)}`
        }, number);
        numbersList.appendChild(numberSpan);
      });

      numbersCell.appendChild(numbersList);
      row.appendChild(prizeCell);
      row.appendChild(numbersCell);
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    return table;
  }

  /**
   * Get region icon
   * @param {string} region - Region key
   * @returns {string} Icon class
   */
  getRegionIcon(region) {
    const icons = {
      north: 'pagoda',
      central: 'crown',
      south: 'palm-tree'
    };
    return icons[region] || 'dice';
  }

  /**
   * Get prize CSS class
   * @param {number} index - Prize index
   * @returns {string} CSS class
   */
  getPrizeClass(index) {
    const classes = ['prize--special', 'prize--first', 'prize--second', 'prize--third'];
    return classes[index] || 'prize--normal';
  }
}

// ================================================== //
// MAIN APPLICATION CLASS                             //
// ================================================== //

class KQXSApp {
  constructor() {
    this.apiService = new APIService();
    this.themeManager = new ThemeManager();
    this.accessibilityManager = new AccessibilityManager();
    this.renderer = new LotteryRenderer(document.getElementById('results-container'));
    
    this.currentDate = new Date();
    this.selectedRegion = 'all';
    
    this.init();
  }

  async init() {
    try {
      this.setupEventListeners();
      this.setupMobileMenu();
      this.setupDatePicker();
      this.setupThemeSwitcher();
      this.setupIntersectionObserver();
      
      // Load initial results
      await this.loadResults();
      
      // Setup auto-refresh
      this.setupAutoRefresh();
      
      console.log('KQXS App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize KQXS App:', error);
      Utils.showToast('Không thể khởi tạo ứng dụng', 'error');
    }
  }

  setupEventListeners() {
    // Date picker
    const datePicker = document.getElementById('date-picker');
    if (datePicker) {
      datePicker.addEventListener('change', 
        Utils.debounce((e) => this.handleDateChange(e), 300)
      );
    }

    // Region selector
    const regionSelector = document.getElementById('region-selector');
    if (regionSelector) {
      regionSelector.addEventListener('change', 
        Utils.debounce((e) => this.handleRegionChange(e), 200)
      );
    }

    // View results button
    const viewBtn = document.getElementById('view-results-btn');
    if (viewBtn) {
      viewBtn.addEventListener('click', (e) => this.handleViewResults(e));
    }

    // Scroll events
    window.addEventListener('scroll', 
      Utils.throttle(() => this.handleScroll(), 16)
    );

    // Resize events
    window.addEventListener('resize',
      Utils.debounce(() => this.handleResize(), 250)
    );

    // Online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!mobileMenuBtn || !mobileMenu) return;

    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMobileMenu();
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        this.closeMobileMenu();
      }
    });
  }

  toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const isHidden = mobileMenu.classList.contains('hidden');

    mobileMenu.classList.toggle('hidden', !isHidden);
    mobileMenuBtn.setAttribute('aria-expanded', isHidden);

    const icon = mobileMenuBtn.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-bars', !isHidden);
      icon.classList.toggle('fa-times', isHidden);
    }

    // Focus management
    if (isHidden) {
      const firstLink = mobileMenu.querySelector('a');
      firstLink?.focus();
    }
  }

  closeMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    
    if (!mobileMenu.classList.contains('hidden')) {
      mobileMenu.classList.add('hidden');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) {
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-times');
      }
    }
  }

  setupDatePicker() {
    const datePicker = document.getElementById('date-picker');
    if (!datePicker) return;

    const today = new Date();
    datePicker.max = Utils.formatDateForAPI(today);
    datePicker.value = Utils.formatDateForAPI(today);

    // Validate date selection
    datePicker.addEventListener('input', (e) => {
      const selectedDate = new Date(e.target.value);
      if (selectedDate > today) {
        e.target.value = Utils.formatDateForAPI(today);
        Utils.showToast('Không thể chọn ngày trong tương lai', 'warning');
      }
    });
  }

  setupThemeSwitcher() {
    // Theme can be switched based on current page
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('north')) {
      this.themeManager.switchTheme('theme-north');
    } else if (currentPath.includes('central')) {
      this.themeManager.switchTheme('theme-central');
    } else if (currentPath.includes('south')) {
      this.themeManager.switchTheme('theme-south');
    }
  }

  setupIntersectionObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '10px'
    });

    // Observe all cards
    document.querySelectorAll('.card').forEach(card => {
      this.observer.observe(card);
    });
  }

  setupAutoRefresh() {
    // Refresh every 5 minutes
    setInterval(async () => {
      await this.loadResults(true);
    }, 5 * 60 * 1000);
  }

  async loadResults(isRefresh = false) {
    const loadingIndicator = document.getElementById('loading-indicator');
    
    if (!isRefresh && loadingIndicator) {
      loadingIndicator.classList.remove('hidden');
    }

    try {
      const dateStr = Utils.formatDateForAPI(this.currentDate);
      const results = await this.apiService.getLotteryResults(dateStr, this.selectedRegion);
      
      this.renderer.render(results, this.selectedRegion);
      
      if (isRefresh) {
        Utils.showToast('Đã cập nhật kết quả mới nhất', 'success');
      }
      
      this.accessibilityManager.announce(
        `Đã tải kết quả xổ số ngày ${Utils.formatDate(this.currentDate)}`
      );
      
    } catch (error) {
      console.error('Failed to load results:', error);
      Utils.showToast('Không thể tải kết quả. Vui lòng thử lại sau.', 'error');
    } finally {
      if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
      }
    }
  }

  // Event Handlers
  async handleDateChange(e) {
    this.currentDate = new Date(e.target.value);
    await this.loadResults();
  }

  async handleRegionChange(e) {
    this.selectedRegion = e.target.value;
    await this.loadResults();
  }

  async handleViewResults(e) {
    e.preventDefault();
    await this.loadResults();
  }

  handleScroll() {
    const header = document.querySelector('.header');
    if (header) {
      header.classList.toggle('header--scrolled', window.scrollY > 10);
    }
  }

  handleResize() {
    // Close mobile menu on resize to desktop
    if (window.innerWidth >= 768) {
      this.closeMobileMenu();
    }
  }

  handleOnline() {
    Utils.showToast('Đã kết nối internet', 'success');
    this.loadResults(true);
  }

  handleOffline() {
    Utils.showToast('Mất kết nối internet', 'warning');
  }

  // Cleanup method
  destroy() {
    this.observer?.disconnect();
    
    // Clear all event listeners and timers
    document.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('resize', this.handleResize);
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }
}

// ================================================== //
// APPLICATION INITIALIZATION                         //
// ================================================== //

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.kqxsApp = new KQXSApp();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  window.kqxsApp?.destroy();
});

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    KQXSApp,
    Utils,
    CacheManager,
    APIService,
    ThemeManager,
    AccessibilityManager,
    LotteryRenderer
  };
}
