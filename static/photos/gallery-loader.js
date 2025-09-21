/**
 * Loads and displays photos dynamically from photos.json
 */

class PhotoGalleryLoader {
  constructor(galleryContainer, jsonUrl) {
    this.galleryContainer = document.querySelector('#photo-gallery');
    this.jsonUrl = jsonUrl || '/photos/photos.json';
    this.photoData = [];
    this.observer = null;
    this.totalImages = 0;
    this.loadedImages = 0;
    this.lazyLoadingEnabled = true;
    this.isLoaded = false;
    this.isLoading = false;
  }

  async initialize() {
    try {
      await this.loadGalleryContent();
    } catch (error) {
      console.error('Failed to initialize photo gallery:', error);
      this.showErrorState();
    }
  }

    // Method to disable lazy loading (useful for immediate loading)
    disableLazyLoading() {
        this.lazyLoadingEnabled = false;
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }

    // Method to enable lazy loading
    enableLazyLoading() {
        this.lazyLoadingEnabled = true;
        if (!this.isLoaded) {
            this.setupLazyLoading();
        }
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupLazyLoading());
        } else {
            this.setupLazyLoading();
        }
    }

    setupLazyLoading() {
        if (!this.lazyLoadingEnabled) return;

        this.galleryContainer = document.querySelector('#photo-gallery');
        
        if (!this.galleryContainer) {
            console.warn('Photo gallery container not found');
            return;
        }

        // Create intersection observer with some margin to preload before visible
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isLoaded && !this.isLoading) {
                    this.loadGalleryContent();
                }
            });
        }, {
            root: null,
            rootMargin: '100px', // Start loading 100px before the section is visible
            threshold: 0.1
        });

        this.observer.observe(this.galleryContainer);
    }

    async loadPhotosData() {
        if (this.isLoaded && this.photosData) {
            return this.photosData;
        }

        try {
            const response = await fetch('/photos/photos.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.photosData = await response.json();
            this.isLoaded = true;
            return this.photosData;
        } catch (error) {
            console.error('Error fetching photos.json:', error);
            throw error;
        }
    }

    createProgressIndicator() {
        // Create progress bar elements
        const progressContainer = document.createElement('div');
        progressContainer.className = 'gallery-progress-container';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'gallery-progress-bar';
        progressContainer.appendChild(progressBar);
        
        const progressText = document.createElement('div');
        progressText.className = 'gallery-progress-text';
        progressText.textContent = 'Loading gallery...';
        progressContainer.appendChild(progressText);
        
        document.body.appendChild(progressContainer);
        
        return { container: progressContainer, bar: progressBar, text: progressText };
    }
    
    updateProgress(loaded, total) {
        if (!this.progressBar || !this.progressText) return;
        
        const percent = Math.round((loaded / total) * 100);
        this.progressBar.style.width = `${percent}%`;
        this.progressText.textContent = `Loading: ${loaded}/${total} (${percent}%)`;
        
        if (loaded === total) {
            // Fade out progress after a delay
            setTimeout(() => {
                this.progressContainer.classList.add('complete');
                setTimeout(() => {
                    this.progressContainer.remove();
                    this.progressContainer = null;
                    this.progressBar = null;
                    this.progressText = null;
                }, 1000);
            }, 500);
        }
    }

    async loadGalleryContent() {
        if (this.isLoading || this.isLoaded) return;
        
        this.isLoading = true;
        this.showLoadingState();
        
        // Create progress indicator
        const progress = this.createProgressIndicator();
        this.progressContainer = progress.container;
        this.progressBar = progress.bar;
        this.progressText = progress.text;

        try {
            // Simulate network delay for better UX (remove in production if not needed)
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Load the gallery content
            await this.renderPhotoGallery();
            
            this.isLoaded = true;
            this.hideLoadingState();
            
            // Disconnect observer as we no longer need it
            if (this.observer) {
                this.observer.disconnect();
            }
            
        } catch (error) {
            console.error('Failed to load photo gallery:', error);
            this.showErrorState();
            
            // Update progress indicator to show error
            if (this.progressContainer) {
                this.progressContainer.classList.add('error');
                this.progressText.textContent = 'Error loading gallery';
            }
        } finally {
            this.isLoading = false;
        }
    }

    showLoadingState() {
        if (!this.galleryContainer) return;

        // Create skeleton items that respect the two-column layout
        const loadingHTML = `
            <div class="gallery-loading">
                <div class="gallery-skeleton">
                    ${Array(16).fill(0).map(() => `
                        <div class="skeleton-image"></div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.galleryContainer.innerHTML = loadingHTML;
    }

    hideLoadingState() {
        if (!this.galleryContainer) return;
        
        const loadingElement = this.galleryContainer.querySelector('.gallery-loading');
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    showErrorState() {
        if (!this.galleryContainer) return;

        const errorHTML = `
            <div class="gallery-error">
                <p>Failed to load photos. <button onclick="window.photoGalleryLoader.loadGalleryContent()">Try again</button></p>
            </div>
        `;
        
        this.galleryContainer.innerHTML = errorHTML;
    }

    createImageViewerOverlay() {
        // Check if overlay already exists
        if (document.getElementById('image-viewer-overlay')) {
            return document.getElementById('image-viewer-overlay');
        }
        
        const overlay = document.createElement('div');
        overlay.id = 'image-viewer-overlay';
        overlay.className = 'image-viewer-overlay';
        
        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-viewer-container';
        
        const image = document.createElement('img');
        image.className = 'image-viewer-img';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'image-viewer-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            overlay.classList.remove('active');
        });
        
        const caption = document.createElement('div');
        caption.className = 'image-viewer-caption';
        
        // Add navigation buttons
        const prevBtn = document.createElement('button');
        prevBtn.className = 'image-viewer-nav prev';
        prevBtn.innerHTML = '&#10094;';
        prevBtn.title = 'Previous image';
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'image-viewer-nav next';
        nextBtn.innerHTML = '&#10095;';
        nextBtn.title = 'Next image';
        
        imageContainer.appendChild(image);
        overlay.appendChild(imageContainer);
        overlay.appendChild(closeBtn);
        overlay.appendChild(caption);
        overlay.appendChild(prevBtn);
        overlay.appendChild(nextBtn);
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
        
        document.body.appendChild(overlay);
        return overlay;
    }
    
    showImageInViewer(src, title, alt, id) {
        const overlay = this.createImageViewerOverlay();
        const image = overlay.querySelector('.image-viewer-img');
        const caption = overlay.querySelector('.image-viewer-caption');
        const prevBtn = overlay.querySelector('.prev');
        const nextBtn = overlay.querySelector('.next');
        
        // Show loading state
        image.classList.add('loading');
        image.onload = () => {
            image.classList.remove('loading');
        };
        
        // Set the current image data
        image.src = src;
        image.dataset.id = id;
        caption.textContent = title || alt || '';
        
        // Set up navigation
        this.setupImageNavigation(prevBtn, nextBtn, id);
        
        // Show the overlay
        overlay.classList.add('active');
        
        // Add keyboard navigation
        this.setupKeyboardNavigation();
    }
    
    setupImageNavigation(prevBtn, nextBtn, currentId) {
        // Find the current image index
        let currentIndex = -1;
        if (this.photosData && this.photosData.photos) {
            currentIndex = this.photosData.photos.findIndex(photo => photo.id === currentId);
        }
        
        if (currentIndex === -1) return;
        
        const navigateToImage = (index) => {
            if (index >= 0 && index < this.photosData.photos.length) {
                const photo = this.photosData.photos[index];
                const overlay = document.getElementById('image-viewer-overlay');
                const image = overlay.querySelector('.image-viewer-img');
                const caption = overlay.querySelector('.image-viewer-caption');
                
                // Show loading state
                image.classList.add('loading');
                
                // Update image
                image.src = photo.src;
                image.dataset.id = photo.id;
                caption.textContent = photo.title || photo.alt || '';
                
                // Remove loading when image loads
                image.onload = () => {
                    image.classList.remove('loading');
                };
                
                // Update navigation
                this.setupImageNavigation(prevBtn, nextBtn, photo.id);
            }
        };
        
        // Set up previous button
        prevBtn.onclick = (e) => {
            e.stopPropagation();
            navigateToImage(currentIndex - 1);
        };
        
        // Set up next button
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            navigateToImage(currentIndex + 1);
        };
        
        // Show/hide buttons based on position
        prevBtn.style.display = currentIndex > 0 ? 'flex' : 'none';
        nextBtn.style.display = currentIndex < this.photosData.photos.length - 1 ? 'flex' : 'none';
    }
    
    setupKeyboardNavigation() {
        // Add one-time keyboard event listener
        const handleKeydown = (event) => {
            const overlay = document.getElementById('image-viewer-overlay');
            if (!overlay || !overlay.classList.contains('active')) {
                document.removeEventListener('keydown', handleKeydown);
                return;
            }
            
            if (event.key === 'ArrowLeft') {
                const prevBtn = overlay.querySelector('.prev');
                if (prevBtn && prevBtn.style.display !== 'none') {
                    prevBtn.click();
                }
            } else if (event.key === 'ArrowRight') {
                const nextBtn = overlay.querySelector('.next');
                if (nextBtn && nextBtn.style.display !== 'none') {
                    nextBtn.click();
                }
            } else if (event.key === 'Escape') {
                overlay.classList.remove('active');
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        
        document.addEventListener('keydown', handleKeydown);
    }

    generatePhotoGalleryHTML(photoData) {
        const photoElement = document.createElement('div');
        photoElement.className = 'photo-item';
        
        const img = document.createElement('img');
        img.src = photoData.src;
        img.alt = photoData.alt || '';
        img.title = photoData.title || '';
        img.className = 'loading';
        img.setAttribute('data-id', photoData.id);
        
        // Add load event to remove loading class
        img.addEventListener('load', () => {
            img.classList.remove('loading');
        });
        
        // Add error handling
        img.addEventListener('error', () => {
            img.classList.remove('loading');
            img.classList.add('error');
            console.error(`Failed to load image: ${photoData.src}`);
            
            // Add click event to retry loading
            img.addEventListener('click', (e) => {
                if (img.classList.contains('error')) {
                    e.preventDefault();
                    e.stopPropagation();
                    img.classList.remove('error');
                    img.classList.add('loading');
                    img.src = img.src.split('?')[0] + '?retry=' + new Date().getTime();
                    console.log(`Retrying image: ${photoData.src}`);
                }
            }, { once: false });
        });
        
        // Add click event to show larger image
        img.addEventListener('click', (e) => {
            if (!img.classList.contains('error')) {
                e.preventDefault();
                e.stopPropagation();
                this.showImageInViewer(photoData.src, photoData.title, photoData.alt, photoData.id);
            }
        });
        
        photoElement.appendChild(img);
        
        return photoElement;
    }

    // Shuffle the photos array for randomized display
    shufflePhotos(photos) {
        // Create a copy of the array to avoid mutating the original
        const shuffled = [...photos];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
        }
        return shuffled;
    }

    generatePhotoGalleryElements(photosArray) {
        // Create a document fragment to hold all elements
        const fragment = document.createDocumentFragment();
        
        // Process each photo
        photosArray.forEach(photoData => {
            const photoElement = this.generatePhotoGalleryHTML(photoData);
            fragment.appendChild(photoElement);
        });
        
        return fragment;
    }

    async renderPhotoGallery() {
        try {
            const data = await this.loadPhotosData();
            
            if (!data || !data.photos || !Array.isArray(data.photos) || data.photos.length === 0) {
                console.error('No photos found in data:', data);
                this.showErrorState();
                return;
            }
            
            console.log(`Found ${data.photos.length} photos`);
            
            // Shuffle the photos for a random display each time
            const shuffledPhotos = this.shufflePhotos(data.photos);
            
            // Generate HTML from JSON data
            const galleryElements = this.generatePhotoGalleryElements(shuffledPhotos);

            // Set the content with fade-in effect
            if (this.galleryContainer) {
                // Clear existing content
                this.galleryContainer.innerHTML = '';
                
                // Add new content
                this.galleryContainer.appendChild(galleryElements);
                this.galleryContainer.style.opacity = '0';
                this.galleryContainer.style.transition = 'opacity 0.3s ease-in-out';
                
                // Trigger fade-in
                requestAnimationFrame(() => {
                    this.galleryContainer.style.opacity = '1';
                });
                
                // Track image loading progress
                const allImages = this.galleryContainer.querySelectorAll('img');
                const totalImages = allImages.length;
                let loadedImages = 0;
                
                // Update progress with initial state
                this.updateProgress(loadedImages, totalImages);
                
                allImages.forEach(img => {
                    if (img.complete) {
                        img.classList.remove('loading');
                        loadedImages++;
                        this.updateProgress(loadedImages, totalImages);
                    } else {
                        img.addEventListener('load', () => {
                            img.classList.remove('loading');
                            loadedImages++;
                            this.updateProgress(loadedImages, totalImages);
                        });
                        
                        img.addEventListener('error', () => {
                            img.classList.remove('loading');
                            img.classList.add('error');
                            loadedImages++;
                            this.updateProgress(loadedImages, totalImages);
                        });
                    }
                });
                
                // Dispatch an event to notify that the gallery has loaded
                const event = new CustomEvent('galleryLoaded');
                this.galleryContainer.dispatchEvent(event);
            }
            
        } catch (error) {
            console.error('Error rendering photo gallery:', error);
            throw error; // Re-throw to trigger error state
        }
    }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function() {
    // Create global instance
    window.photoGalleryLoader = new PhotoGalleryLoader();
    
    // Set up lazy loading
    if (window.photoGalleryLoader.lazyLoadingEnabled) {
        window.photoGalleryLoader.init();
    } else {
        window.photoGalleryLoader.initialize();
    }
    
    console.log('Photo gallery loader initialized');
});