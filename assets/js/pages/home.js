document.addEventListener('DOMContentLoaded', () => {
    // Lógica do Accordion de FAQs
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Fecha todos
            faqItems.forEach(i => {
                i.classList.remove('active');
                i.querySelector('.faq-answer').style.maxHeight = 0;
            });
            
            // Abre o clicado (se não estava aberto)
            if (!isActive) {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    // Lógica de Carrossel para os Planos no Mobile
    const scroller = document.getElementById('plans-scroller');
    const prevBtn = document.getElementById('prev-plan');
    const nextBtn = document.getElementById('next-plan');
    
    if (scroller && prevBtn && nextBtn) {
        const cardWidth = 350; // 320px do card + 30px do gap
        prevBtn.addEventListener('click', () => { 
            scroller.scrollBy({ left: -cardWidth, behavior: 'smooth' }); 
        });
        nextBtn.addEventListener('click', () => { 
            scroller.scrollBy({ left: cardWidth, behavior: 'smooth' }); 
        });
    }
});