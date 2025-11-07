document.addEventListener('DOMContentLoaded', function() {
    const questionsTitles = document.querySelectorAll('.questions_title');
    
    questionsTitles.forEach(title => {
        title.addEventListener('click', function() {
            const article = this.closest('.questions_padding'); // Encuentra el artículo padre
            const show = article.querySelector('.questions_show');
            const arrow = article.querySelector('.questions_arrow');
            
            // Alterna clases
            article.classList.toggle('questions_padding--add');
            show.classList.toggle('questions_show--active');
            arrow.classList.toggle('questions_arrow--rotate');
        });
    });
});