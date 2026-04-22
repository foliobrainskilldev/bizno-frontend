document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-toggle');
    if (sidebar && sidebar.classList.contains('open')) {
        if (!sidebar.contains(event.target) && menuBtn && !menuBtn.contains(event.target)) {
            sidebar.classList.remove('open');
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(() => {
        const viewer = document.getElementById('pdp-media-viewer');
        const thumbs = document.getElementById('pdp-thumbnails');
        if (viewer && thumbs && thumbs.children.length > 0 && !document.getElementById('pdp-swipe-container')) {
            
            const mediaElements = Array.from(thumbs.querySelectorAll('.pdp-thumbnail'));
            viewer.innerHTML = '';
            thumbs.style.display = 'none';
            
            const swipeContainer = document.createElement('div');
            swipeContainer.id = 'pdp-swipe-container';
            swipeContainer.className = 'pdp-swipe-container';
            
            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'pdp-dots';
            dotsContainer.id = 'pdp-dots-container';
            
            mediaElements.forEach((el, i) => {
                const slide = document.createElement('div');
                slide.className = 'pdp-swipe-slide';
                
                const videoUrl = el.dataset.videoUrl;
                if (videoUrl && videoUrl !== "") {
                    slide.innerHTML = `<video class="pdp-main-media plyr-swipe" playsinline controls><source src="${videoUrl}" type="video/mp4"></video>`;
                } else {
                    slide.innerHTML = `<img src="${el.src}" class="pdp-main-media">`;
                }
                
                swipeContainer.appendChild(slide);
                
                const dot = document.createElement('div');
                dot.className = i === 0 ? 'pdp-dot active' : 'pdp-dot';
                dotsContainer.appendChild(dot);
            });
            
            swipeContainer.addEventListener('scroll', () => {
                const index = Math.round(swipeContainer.scrollLeft / swipeContainer.clientWidth);
                const dots = dotsContainer.querySelectorAll('.pdp-dot');
                dots.forEach((dot, i) => {
                    if (i === index) dot.classList.add('active');
                    else dot.classList.remove('active');
                });
            });
            
            viewer.appendChild(swipeContainer);
            const oldDots = document.getElementById('pdp-dots-container');
            if (oldDots) oldDots.remove();
            viewer.parentNode.insertBefore(dotsContainer, viewer.nextSibling);

            const players = Array.from(document.querySelectorAll('.plyr-swipe')).map(p => new Plyr(p));
        }
    });
    const pdpContainer = document.querySelector('.pdp-container');
    if(pdpContainer) observer.observe(pdpContainer, { childList: true, subtree: true });
});