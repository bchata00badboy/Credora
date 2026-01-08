document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    //  1. SLIDER PRINCIPAL (HERO) - Billeteras
    // ==========================================
    const heroImages = document.querySelectorAll('.hero_img');
    const heroPrevBtn = document.getElementById('heroPrev');
    const heroNextBtn = document.getElementById('heroNext');
    let currentHeroIndex = 0;
    let heroInterval;

    function showHeroImage(index) {
        if (!heroImages.length) return;
        
        // Quitar clase active
        heroImages.forEach(img => img.classList.remove('active'));
        
        // Calcular índice
        if (index >= heroImages.length) {
            currentHeroIndex = 0;
        } else if (index < 0) {
            currentHeroIndex = heroImages.length - 1;
        } else {
            currentHeroIndex = index;
        }

        // Poner clase active
        heroImages[currentHeroIndex].classList.add('active');
    }

    function nextHeroImage() {
        showHeroImage(currentHeroIndex + 1);
        resetHeroTimer();
    }

    function prevHeroImage() {
        showHeroImage(currentHeroIndex - 1);
        resetHeroTimer();
    }

    function resetHeroTimer() {
        clearInterval(heroInterval);
        heroInterval = setInterval(nextHeroImage, 5000); // 5 segundos
    }

    // Listeners del Hero
    if(heroPrevBtn && heroNextBtn) {
        heroNextBtn.addEventListener('click', nextHeroImage);
        heroPrevBtn.addEventListener('click', prevHeroImage);
    }

    // Iniciar automático
    heroInterval = setInterval(nextHeroImage, 5000);


    // ==========================================
    //  2. SLIDER DE TESTIMONIOS (Tu código original)
    // ==========================================
    const container = document.querySelector('.testimony_container');
    let bodies = Array.from(document.querySelectorAll('.testimony_body'));
    let beforeBtn = document.getElementById('before');
    let nextBtn = document.getElementById('next');

    // Inyección de datos por defecto si está vacío
    if ((!bodies || bodies.length === 0) && container) {
        const defaultData = [
            {name: 'Alejandro Jose', role: 'Estudiante', text: 'Lorem ipsum dolor sit amet consectetur. Con experiencia en finanzas personales.' , img: 'https://i.scdn.co/image/ab67616d00001e02dc70b075d2db0dc27729fa6b'},
            {name: 'Kevin Varela', role: 'Estudiante', text: 'Opinión del usuario sobre la plataforma y su utilidad.' , img: 'https://preview.redd.it/vergil-is-so-easy-v0-d6r60f2uagve1.jpeg?width=640&crop=smart&auto=webp&s=d0cfa64ebbe46f15f4b65fa91142cb6218b23525'},
            {name: 'Ismael Campos', role: 'Estudiante', text: 'Testimonio sobre aprendizaje y crecimiento financiero.' , img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSpNsORWXdjRA8AKzD1NOiKn94fgcVOHb5WvQ&s'}
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
            
            if (container.querySelector('#next')) {
                container.insertBefore(section, container.querySelector('#next'));
            } else {
                container.appendChild(section);
            }
        });
        bodies = Array.from(document.querySelectorAll('.testimony_body'));
    }

    if (!beforeBtn && container) {
        const img = document.createElement('img');
        img.id = 'before';
        img.className = 'testimony_arrow';
        img.src = '../../Assets/Images/arrowLeft.svg'; // Asegúrate de tener este icono
        img.alt = 'before';
        container.insertBefore(img, container.firstChild);
        beforeBtn = img;
    }
    if (!nextBtn && container) {
        const img = document.createElement('img');
        img.id = 'next';
        img.className = 'testimony_arrow';
        img.src = '../../Assets/Images/arrowRight.svg'; // Asegúrate de tener este icono
        img.alt = 'next';
        container.appendChild(img);
        nextBtn = img;
    }

    if (!bodies || bodies.length === 0) return;

    let currentIndex = bodies.findIndex(b => b.classList.contains('testimony_body--show'));
    if (currentIndex === -1) currentIndex = 0;

    function showTestimony(index) {
        bodies.forEach(body => body.classList.remove('testimony_body--show'));
        const safeIndex = ((index % bodies.length) + bodies.length) % bodies.length;
        bodies[safeIndex].classList.add('testimony_body--show');
        currentIndex = safeIndex;
    }

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

    // Autoplay Testimonios
    let autoplayInterval = 6000;
    let autoplayTimer = setInterval(() => showTestimony(currentIndex + 1), autoplayInterval);
    if (container) {
        container.addEventListener('mouseenter', () => clearInterval(autoplayTimer));
        container.addEventListener('mouseleave', () => {
            clearInterval(autoplayTimer);
            autoplayTimer = setInterval(() => showTestimony(currentIndex + 1), autoplayInterval);
        });
    }

    showTestimony(currentIndex);

    // ==========================================
    //  3. RESTAURACIÓN ICONOS FOOTER (Opcional)
    // ==========================================
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