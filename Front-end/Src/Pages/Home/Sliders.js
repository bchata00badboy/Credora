document.addEventListener('DOMContentLoaded', () => {
    // Restaurador y controlador del slider de testimonios.
    const container = document.querySelector('.testimony_container');
    let bodies = Array.from(document.querySelectorAll('.testimony_body'));
    let beforeBtn = document.getElementById('before');
    let nextBtn = document.getElementById('next');

    // Si faltan testimonios, inyectamos contenidos por defecto (no modifica HTML fuente)
    if ((!bodies || bodies.length === 0) && container) {
        const defaultData = [
            {name: 'Alejandro Jose', role: 'Estudiante', text: 'Lorem ipsum dolor sit amet consectetur. Con experiencia en finanzas personales.' , img: '../../Assets/Images/default1.jpg'},
            {name: 'Kevin Varela', role: 'Estudiante', text: 'Opinión del usuario sobre la plataforma y su utilidad.' , img: '../../Assets/Images/default2.jpg'},
            {name: 'Ismael Campos', role: 'Estudiante', text: 'Testimonio sobre aprendizaje y crecimiento financiero.' , img: '../../Assets/Images/default3.jpg'}
        ];

        defaultData.forEach((d, i) => {
            const section = document.createElement('section');
            section.className = 'testimony_body' + (i === 0 ? ' testimony_body--show' : '');
            section.setAttribute('data-id', String(i+1));

            const texts = document.createElement('div');
            texts.className = 'testimony_texts';
            const h2 = document.createElement('h2');
            h2.className = 'subtitle';
            h2.innerHTML = `${d.name}, <span class="testimony_course">${d.role}</span>`;
            const p = document.createElement('p');
            p.className = 'testimony_review';
            p.textContent = d.text;
            texts.appendChild(h2);
            texts.appendChild(p);

            const fig = document.createElement('figure');
            fig.className = 'testimony_picture';
            const img = document.createElement('img');
            img.className = 'testimony_img';
            img.src = d.img;
            img.alt = d.name;
            fig.appendChild(img);

            section.appendChild(texts);
            section.appendChild(fig);
            // insert before the next arrow if present, else append
            if (container.querySelector('#next')) {
                container.insertBefore(section, container.querySelector('#next'));
            } else {
                container.appendChild(section);
            }
        });

        bodies = Array.from(document.querySelectorAll('.testimony_body'));
    }

    // Si faltan flechas, tratamos de recuperarlas o crearlas (no modifica HTML original salvo inyectar nodos necesarios para interactividad)
    if (!beforeBtn && container) {
        const img = document.createElement('img');
        img.id = 'before';
        img.className = 'testimony_arrow';
        img.src = '../../Assets/Images/arrowLeft.svg';
        img.alt = 'before';
        container.insertBefore(img, container.firstChild);
        beforeBtn = img;
    }
    if (!nextBtn && container) {
        const img = document.createElement('img');
        img.id = 'next';
        img.className = 'testimony_arrow';
        img.src = '../../Assets/Images/arrowRight.svg';
        img.alt = 'next';
        container.appendChild(img);
        nextBtn = img;
    }

    if (!bodies || bodies.length === 0) return; // nada que mostrar

    // determinar índice inicial
    let currentIndex = bodies.findIndex(b => b.classList.contains('testimony_body--show'));
    if (currentIndex === -1) currentIndex = 0;

    function showTestimony(index) {
        bodies.forEach(body => body.classList.remove('testimony_body--show'));
        const safeIndex = ((index % bodies.length) + bodies.length) % bodies.length;
        bodies[safeIndex].classList.add('testimony_body--show');
        currentIndex = safeIndex;
    }

    // listeners para flechas (si existen)
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            showTestimony(currentIndex + 1);
        });
    }
    if (beforeBtn) {
        beforeBtn.addEventListener('click', () => {
            showTestimony(currentIndex - 1);
        });
    }

    // Autoplay con pausa al pasar el ratón
    let autoplayInterval = 6000;
    let autoplayTimer = setInterval(() => showTestimony(currentIndex + 1), autoplayInterval);
    if (container) {
        container.addEventListener('mouseenter', () => clearInterval(autoplayTimer));
        container.addEventListener('mouseleave', () => {
            clearInterval(autoplayTimer);
            autoplayTimer = setInterval(() => showTestimony(currentIndex + 1), autoplayInterval);
        });
    }

    // Inicializa
    showTestimony(currentIndex);

    // Restaurar iconos sociales si están vacíos (pequeña ayuda no invasiva)
    const footerSocial = document.querySelector('.footer_social');
    if (footerSocial && footerSocial.children.length === 0) {
        const socials = [
            {href:'#', img: '../../Assets/Images/instagram.svg', alt: 'instagram'},
            {href:'#', img: '../../Assets/Images/tiktok.svg', alt: 'tiktok'},
            {href:'#', img: '../../Assets/Images/youtube.svg', alt: 'youtube'}
        ];
        socials.forEach(s => {
            const a = document.createElement('a');
            a.className = 'footer_icons';
            a.href = s.href;
            const im = document.createElement('img');
            im.className = 'footer_img';
            im.src = s.img;
            im.alt = s.alt;
            a.appendChild(im);
            footerSocial.appendChild(a);
        });
    }

});