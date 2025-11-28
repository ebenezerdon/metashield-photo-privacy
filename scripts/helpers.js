window.App = window.App || {};

(function() {
  'use strict';

  const AppHelpers = {
    /**
     * Format file size bytes to human readable string
     */
    formatBytes(bytes, decimals = 2) {
      if (!+bytes) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    },

    /**
     * Convert decimal coordinates to DMS for display
     */
    toDMS(coordinate) {
      const absolute = Math.abs(coordinate);
      const degrees = Math.floor(absolute);
      const minutesNotTruncated = (absolute - degrees) * 60;
      const minutes = Math.floor(minutesNotTruncated);
      const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
      return `${degrees}° ${minutes}' ${seconds}"`;
    },

    /**
     * Debounce function for performance
     */
    debounce(func, wait) {
      let timeout;
      return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
      };
    },

    /**
     * Safe delay
     */
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Check if file is JPEG
     */
    isJpeg(file) {
      return file.type === 'image/jpeg' || file.type === 'image/jpg';
    }
  };

  // Expose to App namespace
  window.App.Helpers = AppHelpers;
})();