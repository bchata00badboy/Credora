    const bodies = document.querySelectorAll('.testimony_body');
    const beforeBtn = document.getElementById('before');
    const nextBtn = document.getElementById('next');
    let currentIndex = 0;  // Empieza en el primero (data-id="1")
    function showTestimony(index) {
        // Quita --show de todos (salida instantánea)
        bodies.forEach(body => body.classList.remove('testimony_body--show'));
        // Añade --show al nuevo (entrada animada)
        bodies[index].classList.add('testimony_body--show');
    }
    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % bodies.length;
        showTestimony(currentIndex);
    });
    beforeBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + bodies.length) % bodies.length;
        showTestimony(currentIndex);
    });
    // Inicializa el primero visible (sin animación inicial, ya que ya tiene --show)
    showTestimony(currentIndex);