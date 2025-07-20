  document.addEventListener('DOMContentLoaded', function() {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const filterPreview = document.getElementById('filter-preview');
  const placeholder = document.getElementById('placeholder');
  const flash = document.getElementById('flash');
  const timerDisplay = document.getElementById('timer');
  const counterDisplay = document.getElementById('counter');
  const startBtn = document.getElementById('startBtn');
  const captureBtn = document.getElementById('captureBtn');
  const singlePhotoBtn = document.getElementById('singlePhotoBtn');
  const retakeBtn = document.getElementById('retakeBtn');
  const saveBtn = document.getElementById('saveBtn');
  const viewPhotosBtn = document.getElementById('viewPhotosBtn');
  const saveSingleBtn = document.getElementById('save-single-btn');
  const backToCollageBtn = document.getElementById('back-to-collage-btn');
  const gallery = document.getElementById('gallery');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const mainControls = document.getElementById('main-controls');
  const actionButtons = document.getElementById('action-buttons');
  const collageContainer = document.getElementById('collage-container');
  const singlePhotoContainer = document.getElementById('single-photo-container');
  const singlePhoto = document.getElementById('single-photo');
  const collageItems = [
    document.getElementById('collage-1'),
    document.getElementById('collage-2'),
    document.getElementById('collage-3'),
    document.getElementById('collage-4')
  ];
  
  let stream = null;
  let currentPhotos = [];
  let photos = JSON.parse(localStorage.getItem('photoBoothCollages')) || [];
  let singlePhotos = JSON.parse(localStorage.getItem('photoBoothSinglePhotos')) || [];
  let currentFilter = 'none';
  let isCapturing = false;
  let filterPreviewInterval = null;
  
  // Load saved collages and single photos
  loadGallery();
  
  // Filter buttons
  filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      filterButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.filter;
      
      // Start or stop filter preview
      if (stream && currentFilter !== 'none') {
        startFilterPreview();
      } else {
        stopFilterPreview();
      }
    });
  });
  
  // Start camera
  startBtn.addEventListener('click', async function() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', 
          width: { ideal: 600 }, 
          height: { ideal: 400 } 
        } 
      });
      video.srcObject = stream;
      video.style.display = 'block';
      placeholder.style.display = 'none';
      collageContainer.style.display = 'none';
      singlePhotoContainer.style.display = 'none';
      
      startBtn.disabled = true;
      captureBtn.disabled = false;
      singlePhotoBtn.disabled = false;
      startBtn.textContent = '🎥 Camera Active';
      
      // Start filter preview if a filter is selected
      if (currentFilter !== 'none') {
        startFilterPreview();
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      placeholder.textContent = "Could not access camera. Please check permissions. 🚫";
    }
  });
  
  // Start filter preview (always mirrored)
  function startFilterPreview() {
    if (filterPreviewInterval) clearInterval(filterPreviewInterval);
    
    filterPreview.width = video.videoWidth || 600;
    filterPreview.height = video.videoHeight || 400;
    filterPreview.style.display = 'block';
    
    filterPreviewInterval = setInterval(() => {
      const ctx = filterPreview.getContext('2d');
      ctx.save();
      ctx.scale(-1, 1); // Mirror effect
      ctx.drawImage(video, -filterPreview.width, 0, filterPreview.width, filterPreview.height);
      ctx.restore();
      applyFilter(ctx, filterPreview.width, filterPreview.height, false);
    }, 50);
  }
  
  // Stop filter preview
  function stopFilterPreview() {
    if (filterPreviewInterval) {
      clearInterval(filterPreviewInterval);
      filterPreviewInterval = null;
    }
    filterPreview.style.display = 'none';
  }
  
  // Capture 4 photos with timer
  captureBtn.addEventListener('click', async function() {
    if (isCapturing) return;
    isCapturing = true;
    currentPhotos = [];
    counterDisplay.textContent = 'Photos: 0/4';
    
    for (let i = 0; i < 4; i++) {
      // Show countdown
      await countdown(3);
      
      // Flash effect
      flash.classList.add('flash-animate');
      setTimeout(() => flash.classList.remove('flash-animate'), 500);
      
      // Capture image (mirrored)
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.scale(-1, 1); // Mirror effect
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();
      
      // Apply filter
      applyFilter(ctx, canvas.width, canvas.height, true);
      
      currentPhotos.push(canvas.toDataURL('image/png'));
      counterDisplay.textContent = `Photos: ${i+1}/4`;
      
      // Update collage preview
      collageItems[i].style.backgroundImage = `url(${currentPhotos[i]})`;
      
      // Brief pause between photos
      if (i < 3) await sleep(500);
    }
    
    isCapturing = false;
    
    // Show collage and action buttons
    video.style.display = 'none';
    stopFilterPreview();
    collageContainer.style.display = 'block';
    mainControls.style.display = 'none';
    actionButtons.style.display = 'flex';
  });
  
  // Capture single photo (mirrored)
  singlePhotoBtn.addEventListener('click', async function() {
    if (isCapturing) return;
    isCapturing = true;
    
    // Show countdown
    await countdown(3);
    
    // Flash effect
    flash.classList.add('flash-animate');
    setTimeout(() => flash.classList.remove('flash-animate'), 500);
    
    // Capture image (mirrored)
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(-1, 1); // Mirror effect
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
    
    // Apply filter
    applyFilter(ctx, canvas.width, canvas.height, true);
    
    const photoDataURL = canvas.toDataURL('image/png');
    
    // Show single photo
    video.style.display = 'none';
    stopFilterPreview();
    singlePhoto.src = photoDataURL;
    singlePhotoContainer.style.display = 'block';
    mainControls.style.display = 'none';
    
    // Save button functionality
    saveSingleBtn.onclick = function() {
      singlePhotos.push(photoDataURL);
      localStorage.setItem('photoBoothSinglePhotos', JSON.stringify(singlePhotos));
      saveImageToDevice(photoDataURL);
      loadGallery();
      resetToCamera();
    };
    
    backToCollageBtn.onclick = resetToCamera;
    
    isCapturing = false;
  });
  
  // Retake all photos
  retakeBtn.addEventListener('click', function() {
    resetToCamera();
  });
  
  // Save collage
  saveBtn.addEventListener('click', function() {
    if (currentPhotos.length === 4) {
      // Create final collage image
      const collageCanvas = document.createElement('canvas');
      collageCanvas.width = 600;
      collageCanvas.height = 400;
      const ctx = collageCanvas.getContext('2d');
      
      // Draw all 4 photos in grid
      const imgWidth = collageCanvas.width / 2;
      const imgHeight = collageCanvas.height / 2;
      
      const loadImages = currentPhotos.map(photo => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.src = photo;
        });
      });
      
      Promise.all(loadImages).then(images => {
        // Top left
        ctx.drawImage(images[0], 0, 0, imgWidth, imgHeight);
        // Top right
        ctx.drawImage(images[1], imgWidth, 0, imgWidth, imgHeight);
        // Bottom left
        ctx.drawImage(images[2], 0, imgHeight, imgWidth, imgHeight);
        // Bottom right
        ctx.drawImage(images[3], imgWidth, imgHeight, imgWidth, imgHeight);
        
        const collageDataURL = collageCanvas.toDataURL('image/png');
        photos.push(collageDataURL);
        localStorage.setItem('photoBoothCollages', JSON.stringify(photos));
        saveImageToDevice(collageDataURL);
        loadGallery();
        
        resetToCamera();
      });
    }
  });
  
  // View individual photos
  viewPhotosBtn.addEventListener('click', function() {
    if (currentPhotos.length === 0) return;
    
    // Show the first photo
    singlePhoto.src = currentPhotos[0];
    singlePhotoContainer.style.display = 'block';
    collageContainer.style.display = 'none';
    actionButtons.style.display = 'none';
    
    let currentIndex = 0;
    
    // Update save button to save the current photo
    saveSingleBtn.onclick = function() {
      singlePhotos.push(currentPhotos[currentIndex]);
      localStorage.setItem('photoBoothSinglePhotos', JSON.stringify(singlePhotos));
      saveImageToDevice(currentPhotos[currentIndex]);
      loadGallery();
    };
    
    // Navigation buttons
    backToCollageBtn.textContent = '🔙 Back to Collage';
    backToCollageBtn.onclick = function() {
      singlePhotoContainer.style.display = 'none';
      collageContainer.style.display = 'block';
      actionButtons.style.display = 'flex';
    };
  });
  
  // Reset to camera view
  function resetToCamera() {
    currentPhotos = [];
    counterDisplay.textContent = 'Photos: 0/4';
    
    // Show camera view
    video.style.display = 'block';
    collageContainer.style.display = 'none';
    singlePhotoContainer.style.display = 'none';
    mainControls.style.display = 'flex';
    actionButtons.style.display = 'none';
    
    // Restart filter preview if needed
    if (currentFilter !== 'none') {
      startFilterPreview();
    }
  }
  
  // Countdown function
  async function countdown(seconds) {
    for (let i = seconds; i > 0; i--) {
      timerDisplay.textContent = i;
      timerDisplay.style.opacity = '1';
      await sleep(800);
      timerDisplay.style.opacity = '0';
      await sleep(200);
    }
  }
  
  // Apply filter to canvas (with consistent mirroring)
  function applyFilter(ctx, width, height, isFinal) {
    // First draw the mirrored video/image
    ctx.save();
    ctx.scale(-1, 1); // Mirror effect
    ctx.drawImage(video, -width, 0, width, height);
    ctx.restore();
    
    // Now get the image data to apply filters
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    switch(currentFilter) {
      case 'grayscale':
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = avg;     // R
          data[i + 1] = avg; // G
          data[i + 2] = avg; // B
        }
        break;
        
      case 'sepia':
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
          data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
          data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        }
        break;
        
      case 'invert':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i];     // R
          data[i + 1] = 255 - data[i + 1]; // G
          data[i + 2] = 255 - data[i + 2]; // B
        }
        break;
        
      case 'dreamy':
        // Dreamy filter - soft glow effect
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw original (mirrored)
        tempCtx.save();
        tempCtx.scale(-1, 1);
        tempCtx.drawImage(video, -width, 0, width, height);
        tempCtx.restore();
        
        // Create blurred version
        ctx.filter = 'blur(10px) brightness(1.1)';
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.filter = 'none';
        
        // Blend with original
        ctx.globalAlpha = 0.5;
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.globalAlpha = 1.0;
        return;
        
      case 'blur':
        // Simple box blur
        const blurCanvas = document.createElement('canvas');
        blurCanvas.width = width;
        blurCanvas.height = height;
        const blurCtx = blurCanvas.getContext('2d');
        
        // Draw original (mirrored)
        blurCtx.save();
        blurCtx.scale(-1, 1);
        blurCtx.drawImage(video, -width, 0, width, height);
        blurCtx.restore();
        
        // Apply multiple passes for stronger blur
        for (let i = 0; i < 3; i++) {
          ctx.filter = 'blur(5px)';
          ctx.drawImage(blurCanvas, 0, 0);
          ctx.filter = 'none';
        }
        return;
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  // Load collages and single photos from storage
  function loadGallery() {
    gallery.innerHTML = '';
    
    // Load collages
    photos.forEach((photo, index) => {
      const container = document.createElement('div');
      container.className = 'gallery-item';
      
      const img = document.createElement('img');
      img.src = photo;
      img.alt = `Collage ${index + 1}`;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.innerHTML = '×';
      deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        photos.splice(index, 1);
        localStorage.setItem('photoBoothCollages', JSON.stringify(photos));
        loadGallery();
      });
      
      container.appendChild(img);
      container.appendChild(deleteBtn);
      gallery.appendChild(container);
    });
    
    // Load single photos
    singlePhotos.forEach((photo, index) => {
      const container = document.createElement('div');
      container.className = 'gallery-item';
      
      const img = document.createElement('img');
      img.src = photo;
      img.alt = `Photo ${index + 1}`;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.innerHTML = '×';
      deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        singlePhotos.splice(index, 1);
        localStorage.setItem('photoBoothSinglePhotos', JSON.stringify(singlePhotos));
        loadGallery();
      });
      
      container.appendChild(img);
      container.appendChild(deleteBtn);
      gallery.appendChild(container);
    });
  }
  
  // Save image to device
  function saveImageToDevice(dataUrl) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `photo-booth-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  // Helper functions
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Clean up when leaving page
  window.addEventListener('beforeunload', function() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (filterPreviewInterval) clearInterval(filterPreviewInterval);
  });
});