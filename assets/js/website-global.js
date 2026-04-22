document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('main-header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    const navToggle = document.getElementById('nav-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (navToggle && mobileNav) {
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navToggle.classList.toggle('open');
            mobileNav.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
             if (mobileNav.classList.contains('open') && !mobileNav.contains(e.target) && e.target !== navToggle && !navToggle.contains(e.target)) {
                 navToggle.classList.remove('open');
                 mobileNav.classList.remove('open');
             }
        });

        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('open');
                mobileNav.classList.remove('open');
            });
        });
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => { 
        observer.observe(el); 
    });
});