/* ─────────────────────────────────────────────────────────────────────────
   works.js — Work page: modal, sidebar scroll sync, masonry
   ───────────────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

    /* ── Modal ─────────────────────────────────────────────────────────── */

    const overlay  = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('modal-close');
    const mediaEl  = document.getElementById('modal-media');
    const titleEl  = document.getElementById('modal-title');
    const descEl   = document.getElementById('modal-desc');
    const tagEl    = document.getElementById('modal-tag');

    function openModal(card) {
        const title = card.dataset.title   || 'Untitled';
        const type  = card.dataset.type    || 'image';
        let src   = card.dataset.src     || '';
        const desc  = card.dataset.description || '';
        const tagText = card.querySelector('.work-card-tag')?.textContent || '';

        titleEl.textContent = title;
        descEl.textContent  = desc;
        tagEl.textContent   = tagText;

        // Clear previous media
        mediaEl.innerHTML = '';

        if (src) {
            if (type === 'video') {
                if (src.includes('youtube.com') || src.includes('youtu.be') || src.includes('embed')) {
                    const iframe = document.createElement('iframe');
                    iframe.src = src;
                    iframe.setAttribute('allowfullscreen', 'true');
                    iframe.setAttribute('frameborder', '0');
                    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
                    mediaEl.appendChild(iframe);
                } else {
                    const video = document.createElement('video');
                    video.src       = src;
                    video.controls  = true;
                    video.autoplay  = false;
                    mediaEl.appendChild(video);
                }
            } else if (type === 'pdf') {
                // Multi-page rendering for PDF
                mediaEl.innerHTML = '<div class="pdf-loading">Loading document...</div>';
                
                if (typeof pdfjsLib !== 'undefined') {
                    const loadingTask = pdfjsLib.getDocument(src);
                    loadingTask.promise.then(async (pdf) => {
                        mediaEl.innerHTML = ''; // Clear loader
                        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                            try {
                                const page = await pdf.getPage(pageNum);
                                const viewport = page.getViewport({ scale: 2 }); // High res
                                const canvas = document.createElement('canvas');
                                const context = canvas.getContext('2d');
                                canvas.height = viewport.height;
                                canvas.width = viewport.width;
                                canvas.style.width = '100%';
                                canvas.style.height = 'auto';
                                canvas.style.marginBottom = '20px';
                                canvas.style.borderRadius = '4px';
                                
                                await page.render({ canvasContext: context, viewport: viewport }).promise;
                                mediaEl.appendChild(canvas);
                            } catch (err) {
                                console.error('Error rendering PDF page:', err);
                            }
                        }
                    }).catch(err => {
                        mediaEl.innerHTML = '<div class="pdf-error">Failed to load PDF.</div>';
                        console.error('PDF error:', err);
                    });
                } else {
                    // Fallback to iframe if pdf.js is not available
                    const iframe = document.createElement('iframe');
                    iframe.src = src;
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                    mediaEl.appendChild(iframe);
                }
            } else {
                const img = document.createElement('img');
                img.src = src;
                img.alt = title;
                mediaEl.appendChild(img);
            }
        } else {
            // Placeholder when no src yet
            mediaEl.innerHTML = `
                <div class="modal-media-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <path d="M3 9h18"/>
                    </svg>
                    <span>Media coming soon</span>
                </div>`;
        }

        overlay.hidden = false;
        requestAnimationFrame(() => overlay.classList.add('is-open'));
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        overlay.classList.remove('is-open');
        setTimeout(() => {
            overlay.hidden = true;
            mediaEl.innerHTML = '';
            document.body.style.overflow = '';
        }, 350);
    }

    // Open on card click
    document.querySelectorAll('.work-card').forEach(card => {
        card.addEventListener('click', () => openModal(card));
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') openModal(card);
        });
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Close on overlay background click
    overlay?.addEventListener('click', e => {
        if (e.target === overlay) closeModal();
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !overlay?.hidden) closeModal();
    });


    /* ── Sidebar Scroll Sync ───────────────────────────────────────────── */

    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const sections     = document.querySelectorAll('.works-section');

    // Click: smooth scroll
    sidebarLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const targetId = link.dataset.target;
            const section  = document.getElementById(targetId);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Update active immediately
                sidebarLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });

    // Scroll: highlight active sidebar link
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.dataset.section;
                sidebarLinks.forEach(link => {
                    link.classList.toggle('active', link.dataset.target === id);
                });
            }
        });
    }, { threshold: 0.3, rootMargin: '-100px 0px -50% 0px' });

    sections.forEach(s => observer.observe(s));

    /* ── Thumbnails ────────────────────────────────────────────────────── */
    
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    async function initThumbnails() {
        const cards = document.querySelectorAll('.work-card');
        
        for (const card of cards) {
            const type = card.dataset.type;
            const src  = card.dataset.src;
            const mediaContainer = card.querySelector('.work-card-media');
            const placeholder = card.querySelector('.work-card-placeholder');

            if (type === 'video' && src) {
                // Extract YouTube ID
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                const match = src.match(regExp);
                const videoId = (match && match[2].length === 11) ? match[2] : null;
                
                if (videoId) {
                    const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                    const img = document.createElement('img');
                    img.src = thumbUrl;
                    img.alt = card.dataset.title;
                    img.loading = "lazy";
                    mediaContainer.appendChild(img);
                    if (placeholder) placeholder.style.display = 'none';
                }
            } else if (type === 'pdf' && src && typeof pdfjsLib !== 'undefined') {
                try {
                    const thumbPage = parseInt(card.dataset.thumbPage) || 1;
                    const loadingTask = pdfjsLib.getDocument(src);
                    const pdf = await loadingTask.promise;
                    const page = await pdf.getPage(thumbPage);
                    
                    const scale = 1;
                    const viewport = page.getViewport({ scale });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    
                    await page.render(renderContext).promise;
                    
                    // Convert canvas to image for better CSS handling
                    const img = document.createElement('img');
                    img.src = canvas.toDataURL('image/jpeg', 0.8);
                    img.alt = card.dataset.title;
                    img.loading = "lazy";
                    mediaContainer.appendChild(img);
                    
                    if (placeholder) placeholder.style.display = 'none';
                } catch (err) {
                    console.error('Error generating PDF thumbnail:', err);
                }
            }
        }
    }

    // Initialize thumbnails
    initThumbnails();

});
