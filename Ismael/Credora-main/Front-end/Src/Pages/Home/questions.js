// questions.js — manejo único y accesible de FAQs
document.addEventListener('DOMContentLoaded', () => {
    const articles = document.querySelectorAll('.questions_padding');
    if (!articles || articles.length === 0) return;

    articles.forEach((article, idx) => {
        const title = article.querySelector('.questions_title');
        const content = article.querySelector('.questions_show');
        const arrow = article.querySelector('.questions_arrow');
        if (!title || !content) return;

        // Asegurar id único para aria-controls
        if (!content.id) content.id = `questions_show_${idx}`;

        // Preparar atributos accesibles
        title.setAttribute('role', 'button');
        title.setAttribute('tabindex', '0');
        title.setAttribute('aria-controls', content.id);
        title.setAttribute('aria-expanded', content.classList.contains('questions_show--active') ? 'true' : 'false');

        const setExpanded = (expanded) => {
            title.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            if (arrow) {
                if (expanded) arrow.classList.add('questions_arrow--rotate');
                else arrow.classList.remove('questions_arrow--rotate');
            }
        };

        const toggle = () => {
            const isNow = !content.classList.contains('questions_show--active');
            article.classList.toggle('questions_padding--add', isNow);
            content.classList.toggle('questions_show--active', isNow);
            setExpanded(isNow);
        };

        // Click y teclado
        title.addEventListener('click', (e) => {
            e.preventDefault();
            toggle();
        });
        title.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
            }
        });
    });
});