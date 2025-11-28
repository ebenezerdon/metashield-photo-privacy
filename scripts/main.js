window.App = window.App || {};

$(function() {
  'use strict';

  // Check dependencies
  if (!window.App.UI || !window.App.Helpers) {
    console.error('Modules missing');
    return;
  }

  const { UI, Helpers } = window.App;
  const { formatBytes, isJpeg } = Helpers;
  
  let currentFile = null;
  let currentExif = null;
  let currentDataURL = null;

  // Initialize UI
  UI.init();

  // --- Core Logic ---

  // 1. File Upload Handler
  const handleFile = (file) => {
    if (!file) return;
    if (!isJpeg(file)) {
      UI.showToast('Only JPEG/JPG images are supported for EXIF editing.', 'error');
      return;
    }

    currentFile = file;
    UI.elements.filenameDisplay.text(`${file.name} (${formatBytes(file.size)})`);
    
    // Read file
    const reader = new FileReader();
    reader.onload = (e) => {
      currentDataURL = e.target.result;
      UI.elements.previewImage.attr('src', currentDataURL);
      UI.toggleView(true);
      
      // Parse EXIF
      try {
        if (window.piexif) {
          currentExif = piexif.load(currentDataURL);
          UI.renderMetadata(currentExif);
          checkForGPS(currentExif);
        } else {
          console.error('piexifjs not loaded');
        }
      } catch (err) {
        console.error(err);
        UI.showToast('Could not parse image metadata. It might be corrupted.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  // 2. GPS Helper
  const checkForGPS = (exif) => {
    const gps = exif['GPS'];
    if (gps && gps[piexif.GPSIFD.GPSLatitude] && gps[piexif.GPSIFD.GPSLongitude]) {
        const lat = convertDMSToDD(gps[piexif.GPSIFD.GPSLatitude], gps[piexif.GPSIFD.GPSLatitudeRef]);
        const lng = convertDMSToDD(gps[piexif.GPSIFD.GPSLongitude], gps[piexif.GPSIFD.GPSLongitudeRef]);
        if (!isNaN(lat) && !isNaN(lng)) {
            UI.renderMap(lat, lng);
            return;
        }
    }
    UI.renderMap(null, null);
  };

  // DMS to Decimal helper
  const convertDMSToDD = (dms, ref) => {
      if (!dms || dms.length < 3) return NaN;
      const d = dms[0][0] / dms[0][1];
      const m = dms[1][0] / dms[1][1];
      const s = dms[2][0] / dms[2][1];
      let dd = d + m / 60 + s / 3600;
      if (ref === 'S' || ref === 'W') dd = dd * -1;
      return dd;
  };

  // 3. Event Listeners
  
  // Drag and Drop
  const $drop = UI.elements.dropZone;
  $drop.on('dragover', (e) => {
    e.preventDefault();
    $drop.addClass('border-teal-500 bg-teal-50/50 scale-[1.01]');
  });
  $drop.on('dragleave', (e) => {
    e.preventDefault();
    $drop.removeClass('border-teal-500 bg-teal-50/50 scale-[1.01]');
  });
  $drop.on('drop', (e) => {
    e.preventDefault();
    $drop.removeClass('border-teal-500 bg-teal-50/50 scale-[1.01]');
    const files = e.originalEvent.dataTransfer.files;
    if (files.length) handleFile(files[0]);
  });
  
  // Input Change
  UI.elements.fileInput.on('change', (e) => {
    if (e.target.files.length) handleFile(e.target.files[0]);
  });

  // Clean & Save
  UI.elements.cleanBtn.on('click', () => {
    if (!currentDataURL || !window.piexif) return;
    
    // Create empty EXIF object
    const cleanExif = {
      "0th": {},
      "Exif": {},
      "GPS": {},
      "Interop": {},
      "1st": {},
      "thumbnail": null
    };
    
    // Convert to string and insert
    const exifStr = piexif.dump(cleanExif);
    const newJpeg = piexif.insert(exifStr, currentDataURL);
    
    // Trigger download
    const link = document.createElement('a');
    link.href = newJpeg;
    link.download = `CLEAN_${currentFile.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    UI.showToast('Metadata stripped & download started!', 'success');
  });

  // --- AI Feature ---
  
  UI.elements.aiBtn.on('click', async () => {
     const $aiArea = UI.elements.aiSection;
     $aiArea.removeClass('hidden');
     $('html, body').animate({ scrollTop: $aiArea.offset().top }, 500);

     // Check if loaded
     if (!window.AppLLM) return;
     
     try {
       if (!window.AppLLM.ready) {
         $('#ai-loading-state').removeClass('hidden');
         $('#ai-start-prompt').addClass('hidden');
         await window.AppLLM.load(null, (pct) => UI.updateAIProgress(pct));
       }
       
       // Generate report
       $('#ai-loading-state').addClass('hidden');
       $('#ai-chat-interface').removeClass('hidden');
       
       const prompt = generatePromptFromExif(currentExif);
       let fullResponse = '';
       $('#ai-response-text').text('');
       
       await window.AppLLM.generate(prompt, {
         system: 'You are a Privacy Security Expert. Analyze the provided image metadata. Explain briefly (3 sentences max) what risks this data exposes (e.g., location tracking, device fingerprinting). If no data, say it is safe.',
         onToken: (t) => {
           fullResponse += t;
           $('#ai-response-text').text(fullResponse);
         }
       });
       
     } catch (err) {
       console.error(err);
       UI.showToast('AI Model failed to load: ' + err.message, 'error');
       $('#ai-loading-state').addClass('hidden');
     }
  });

  const generatePromptFromExif = (exif) => {
      if (!exif) return 'No metadata found.';
      let summary = [];
      
      // GPS
      if (exif['GPS'] && Object.keys(exif['GPS']).length > 0) summary.push('Contains GPS Coordinates.');
      else summary.push('No GPS data.');
      
      // Device
      const make = exif['0th']?.[271] || '';
      const model = exif['0th']?.[272] || '';
      if (make || model) summary.push(`Device: ${make} ${model}.`);
      
      // Date
      const date = exif['Exif']?.[36867] || '';
      if (date) summary.push(`Date Taken: ${date}.`);
      
      return `Analyze this metadata for privacy risks: ${summary.join(' ')}`;
  };

});