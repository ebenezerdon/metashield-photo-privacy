window.App = window.App || {};

(function() {
  'use strict';

  const UI = {
    elements: {},
    mapInstance: null,

    init() {
      this.cacheDOM();
      this.bindEvents();
    },

    cacheDOM() {
      this.elements = {
        dropZone: $('#drop-zone'),
        fileInput: $('#file-input'),
        previewImage: $('#preview-image'),
        metadataList: $('#metadata-list'),
        actionPanel: $('#action-panel'),
        mapContainer: $('#map-preview'),
        cleanBtn: $('#clean-btn'),
        aiSection: $('#ai-advisor'),
        aiBtn: $('#btn-ai-analyze'),
        aiOutput: $('#ai-output'),
        aiProgress: $('#ai-progress'),
        toastContainer: $('#toast-container'),
        emptyState: $('#empty-state'),
        activeState: $('#active-state'),
        filenameDisplay: $('#filename-display')
      };
    },

    bindEvents() {
      // Helper for file input trigger
      $('#trigger-upload').on('click', (e) => {
        e.preventDefault();
        this.elements.fileInput.click();
      });
    },

    showToast(message, type = 'info') {
      const colors = {
        info: 'bg-slate-800 text-white border-slate-700',
        success: 'bg-emerald-900/90 text-emerald-100 border-emerald-700',
        error: 'bg-rose-900/90 text-rose-100 border-rose-700'
      };

      const $toast = $(`
        <div class="flex items-center gap-3 px-6 py-4 mb-3 rounded-xl shadow-xl backdrop-blur-md border border-white/10 transform translate-y-10 opacity-0 transition-all duration-500 ${colors[type]}">
          <div class="text-sm font-medium">${message}</div>
        </div>
      `);

      this.elements.toastContainer.append($toast);
      
      // Animate in
      requestAnimationFrame(() => {
        $toast.removeClass('translate-y-10 opacity-0');
      });

      // Remove after 3s
      setTimeout(() => {
        $toast.addClass('translate-y-2 opacity-0');
        setTimeout(() => $toast.remove(), 500);
      }, 3500);
    },

    toggleView(hasFile) {
      if (hasFile) {
        this.elements.emptyState.addClass('hidden');
        this.elements.activeState.removeClass('hidden').addClass('flex');
        this.elements.actionPanel.removeClass('opacity-50 pointer-events-none');
      } else {
        this.elements.emptyState.removeClass('hidden');
        this.elements.activeState.addClass('hidden').removeClass('flex');
        this.elements.actionPanel.addClass('opacity-50 pointer-events-none');
      }
    },

    renderMetadata(exifObj) {
      const $list = this.elements.metadataList;
      $list.empty();

      if (!exifObj || (Object.keys(exifObj['0th'] || {}).length === 0 && Object.keys(exifObj['Exif'] || {}).length === 0 && Object.keys(exifObj['GPS'] || {}).length === 0)) {
        $list.html(`
          <div class="p-6 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <p>No cleanable metadata found.</p>
            <p class="text-xs mt-1 opacity-70">This image is already clean or format is not supported.</p>
          </div>
        `);
        return;
      }

      // Helper to row
      const createRow = (label, value, tagId, ifd) => {
        if (!value) return '';
        // Truncate long binary/garbage strings
        let displayValue = value.toString();
        if (displayValue.length > 50) displayValue = displayValue.substring(0, 47) + '...';
        
        return `
          <div class="flex justify-between items-center py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 px-2 rounded-lg transition-colors">
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">${label}</span>
            <span class="text-sm text-slate-800 font-mono text-right" title="${value}">${displayValue}</span>
          </div>
        `;
      };

      // Sections
      const sections = [
        { name: 'Device Info', ifd: '0th', keys: { 271: 'Make', 272: 'Model', 305: 'Software' } },
        { name: 'Photo Data', ifd: 'Exif', keys: { 36867: 'Taken Date', 33434: 'Exposure', 33437: 'F-Stop', 34855: 'ISO' } },
        { name: 'GPS Coordinates', ifd: 'GPS', keys: { 2: 'Latitude', 4: 'Longitude', 6: 'Altitude' } }
      ];

      sections.forEach(sec => {
        const data = exifObj[sec.ifd];
        if (!data) return;
        
        let rows = '';
        // Check specific keys or iterate
        Object.keys(sec.keys).forEach(code => {
          if (data[code]) {
            rows += createRow(sec.keys[code], data[code], code, sec.ifd);
          }
        });

        // Render GPS specially if exists
        if (sec.ifd === 'GPS' && (data[2] || data[4])) {
             // Pass - handled generically above but map handles visual
        }

        if (rows) {
          $list.append(`
            <div class="mb-6">
              <h3 class="text-sm font-bold text-teal-900 mb-3 flex items-center gap-2">
                 <div class="w-2 h-2 rounded-full bg-teal-500"></div> ${sec.name}
              </h3>
              <div class="bg-white rounded-xl border border-slate-200 p-2 shadow-sm">
                ${rows}
              </div>
            </div>
          `);
        }
      });
    },

    renderMap(lat, lng) {
      const $container = this.elements.mapContainer;
      if (!lat || !lng) {
        $container.html('<div class="h-full w-full flex items-center justify-center text-slate-400 text-sm">No GPS Data</div>');
        return;
      }

      // Clean up previous map if any
      if (this.mapInstance) {
        this.mapInstance.remove();
        this.mapInstance = null;
      }
      
      $container.empty().append('<div id="leaflet-map" class="w-full h-full rounded-xl z-0"></div>');
      
      // Initialize Leaflet
      // Ensure Leaflet script is loaded in HTML
      if (window.L) {
        this.mapInstance = L.map('leaflet-map', { zoomControl: false, attributionControl: false }).setView([lat, lng], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19
        }).addTo(this.mapInstance);
        L.marker([lat, lng]).addTo(this.mapInstance);
        
        // Add attribution manually cleanly
        $container.append('<div class="absolute bottom-1 right-2 text-[10px] text-slate-400 z-[400] bg-white/80 px-1 rounded">© OpenStreetMap</div>');
      }
    },

    updateAIProgress(percent) {
        const $bar = $('#ai-progress-bar');
        const $text = $('#ai-progress-text');
        $bar.css('width', `${percent}%`);
        $text.text(`Loading Privacy AI Model... ${percent}%`);
        
        if (percent >= 100) {
            setTimeout(() => {
                $('#ai-loading-state').addClass('hidden');
                $('#ai-chat-interface').removeClass('hidden');
            }, 500);
        }
    }
  };

  window.App.UI = UI;
})();