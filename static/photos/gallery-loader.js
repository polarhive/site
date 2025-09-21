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
            console.log('Fetching photos.json...');
            // Use the full path for testing
            const jsonUrl = this.jsonUrl || '/photos/photos.json';
            console.log('JSON URL:', jsonUrl);
            
            const response = await fetch(jsonUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            console.log('Response received, parsing JSON...');
            this.photosData = await response.json();
            console.log('JSON parsed successfully:', this.photosData);
            
            this.isLoaded = true;
            return this.photosData;
        } catch (error) {
            console.error('Error fetching photos.json:', error);
            console.error('Fetch URL:', this.jsonUrl);
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
        this.progressText.textContent = `Scroll more: ${loaded}/${total} (${percent}%)`;
        
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
        
        // Create placeholder div with same aspect ratio as image
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder loading';
        placeholder.setAttribute('data-id', photoData.id);
        placeholder.setAttribute('data-src', photoData.src);
        placeholder.setAttribute('data-alt', photoData.alt || '');
        placeholder.setAttribute('data-title', photoData.title || '');
        
        // Add a small spinner or loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'placeholder-loading-indicator';
        placeholder.appendChild(loadingIndicator);
        
        // Apply the lazy loading via Intersection Observer later
        photoElement.appendChild(placeholder);
        
        return photoElement;
    }
    
    // This method loads the actual image when it's in the viewport
    setupImageLazyLoad(placeholder) {
        const imgObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const placeholder = entry.target;
                    const photoData = {
                        id: placeholder.getAttribute('data-id'),
                        src: placeholder.getAttribute('data-src'),
                        alt: placeholder.getAttribute('data-alt'),
                        title: placeholder.getAttribute('data-title')
                    };
                    
                    // Create the actual image element
                    const img = document.createElement('img');
                    img.className = 'loading';
                    img.alt = photoData.alt;
                    img.title = photoData.title;
                    img.setAttribute('data-id', photoData.id);
                    
                    // Add load event to remove loading class
                    img.addEventListener('load', () => {
                        img.classList.remove('loading');
                        placeholder.classList.remove('loading');
                        placeholder.classList.add('loaded');
                        
                        // Track loading progress
                        this.loadedImages++;
                        console.log(`Image loaded: ${this.loadedImages}/${this.totalImages}`);
                        this.updateProgress(this.loadedImages, this.totalImages);
                        
                        // Add click event to show larger image (only after load)
                        placeholder.addEventListener('click', (e) => {
                            if (!placeholder.classList.contains('error')) {
                                e.preventDefault();
                                e.stopPropagation();
                                this.showImageInViewer(photoData.src, photoData.title, photoData.alt, photoData.id);
                            }
                        });
                    });
                    
                    // Add error handling
                    img.addEventListener('error', () => {
                        img.classList.remove('loading');
                        img.classList.add('error');
                        placeholder.classList.remove('loading');
                        placeholder.classList.add('error');
                        console.error(`Failed to load image: ${photoData.src}`);
                        
                        // Track loading progress (errors count as "loaded" for progress)
                        this.loadedImages++;
                        console.log(`Image error: ${this.loadedImages}/${this.totalImages}`);
                        this.updateProgress(this.loadedImages, this.totalImages);
                        
                        // Add click event to retry loading
                        placeholder.addEventListener('click', (e) => {
                            if (placeholder.classList.contains('error')) {
                                e.preventDefault();
                                e.stopPropagation();
                                placeholder.classList.remove('error');
                                placeholder.classList.add('loading');
                                img.classList.remove('error');
                                img.classList.add('loading');
                                img.src = photoData.src.split('?')[0] + '?retry=' + new Date().getTime();
                                console.log(`Retrying image: ${photoData.src}`);
                            }
                        });
                    });
                    
                    // Actually set the source to start loading the image
                    img.src = photoData.src;
                    placeholder.appendChild(img);
                    
                    // Stop observing once the loading process has begun
                    imgObserver.unobserve(placeholder);
                    
                    // Add debugging info
                    console.log(`Starting to load image: ${photoData.src}`);
                }
            });
        }, {
            rootMargin: '300px', // Start loading when image is 300px from viewport
            threshold: 0.01
        });
        
        imgObserver.observe(placeholder);
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
    
    setupAllImagesLazyLoad() {
        // Find all placeholders and set up lazy loading
        const placeholders = this.galleryContainer.querySelectorAll('.image-placeholder');
        console.log(`Setting up lazy loading for ${placeholders.length} images`);
        
        // Store the total in the instance for progress tracking
        this.totalImages = placeholders.length;
        this.loadedImages = 0;
        
        // Update progress with initial state
        this.updateProgress(this.loadedImages, this.totalImages);
        
        // Set up lazy loading for each placeholder
        placeholders.forEach(placeholder => {
            this.setupImageLazyLoad(placeholder);
        });
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
                
                // Set up lazy loading for all images
                this.setupAllImagesLazyLoad();
                
                // Dispatch an event to notify that the gallery structure has loaded
                const event = new CustomEvent('galleryStructureLoaded');
                this.galleryContainer.dispatchEvent(event);
                
                // Monitor actual image loading in the setupImageLazyLoad method
            }
            
        } catch (error) {
            console.error('Error rendering photo gallery:', error);
            throw error; // Re-throw to trigger error state
        }
    }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function() {
    // Find the gallery container
    const galleryContainer = document.getElementById('photo-gallery');
    
    if (!galleryContainer) {
        console.error('Gallery container not found! Make sure there is an element with id="photo-gallery"');
        return;
    }
    
    console.log('Gallery container found:', galleryContainer);
    
    // Create global instance with explicit parameters
    window.photoGalleryLoader = new PhotoGalleryLoader(galleryContainer, '/photos/photos.json');
    
    console.log('Photo gallery loader created');
    
    // Load the gallery content immediately
    window.photoGalleryLoader.initialize();
    
    console.log('Photo gallery loader initialized');
});