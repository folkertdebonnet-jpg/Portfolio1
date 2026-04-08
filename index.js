/* ─────────────────────────────────────────────────────────────────────────
   homepage.js — Global nav, hexagon toggle, page slide transitions
   ───────────────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

    /* ── Menu Toggle ───────────────────────────────────────────────────── */

    const menuBtn = document.querySelector('.nav-menu-btn');
    const navContainer = document.querySelector('.nav-container');
    const menuText = document.querySelector('.nav-menu-text');

    if (menuBtn && navContainer) {
        menuBtn.addEventListener('click', () => {
            navContainer.classList.toggle('is-expanded');
            if (menuText) {
                menuText.textContent = navContainer.classList.contains('is-expanded') ? 'Close' : 'Works';
            }
        });

        // Close menu on outside click
        document.addEventListener('click', e => {
            if (!navContainer.contains(e.target) && navContainer.classList.contains('is-expanded')) {
                navContainer.classList.remove('is-expanded');
                if (menuText) menuText.textContent = 'Works';
            }
        });
    }


    /* ── Hexagon Logo: Red → Gray toggle ──────────────────────────────── */

    const hexPath = document.querySelector('.nav-icon-path');
    if (hexPath) {
        // Initial state: red fill
        hexPath.style.fill = '#FF0000';
        hexPath.style.stroke = '#FF0000';

        const hexBtn = document.querySelector('.nav-icon-btn');
        if (hexBtn) {
            let isRed = true;
            hexBtn.addEventListener('click', e => {
                // Only toggle if we're NOT navigating away (same page click)
                if (hexBtn.getAttribute('href') === window.location.pathname.split('/').pop()
                    || hexBtn.getAttribute('href') === window.location.href) {
                    e.preventDefault();
                    isRed = !isRed;
                    const color = isRed ? '#FF0000' : '#888888';
                    hexPath.style.fill = color;
                    hexPath.style.stroke = color;
                }
            });
        }
    }


    /* ── Page Slide Transitions ────────────────────────────────────────── */

    function navigateTo(url) {
        // Use native View Transitions API if available
        if (document.startViewTransition) {
            document.startViewTransition(() => {
                window.location.href = url;
            });
        } else {
            // CSS fallback: fade out then navigate
            const wrapper = document.querySelector('.page-transition-wrapper');
            if (wrapper) {
                wrapper.style.animation = 'none';
                wrapper.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                wrapper.style.opacity = '0';
                wrapper.style.transform = 'translate3d(-40px, 0, 0)';
                setTimeout(() => { window.location.href = url; }, 300);
            } else {
                window.location.href = url;
            }
        }
    }

    // Intercept all links marked with [data-navigate]
    document.querySelectorAll('a[data-navigate]').forEach(link => {
        link.addEventListener('click', e => {
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
            e.preventDefault();
            navigateTo(href);
        });
    });

    // Handle hash-only navigation (e.g. contact → About.html#contact)
    document.querySelectorAll('a[href*="#"]').forEach(link => {
        link.addEventListener('click', e => {
            const href = link.getAttribute('href');
            const [page, hash] = href.split('#');
            const isSamePage = !page || page === '' || window.location.pathname.endsWith(page);

            if (isSamePage && hash) {
                e.preventDefault();
                const target = document.getElementById(hash);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });


    /* ── Auto-scroll to hash on page load ─────────────────────────────── */

    if (window.location.hash) {
        setTimeout(() => {
            const el = document.querySelector(window.location.hash);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 400);
    }

});
