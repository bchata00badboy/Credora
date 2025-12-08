document.addEventListener('DOMContentLoaded', () => {
    // Seleccionamos todas las tarjetas originales
    const serviceEls = document.querySelectorAll('.services_element');

    serviceEls.forEach((el) => {
        // Evitamos que el script se ejecute dos veces en el mismo elemento
        if (el.dataset.flipInit === 'true') return;
        el.dataset.flipInit = 'true';

        // 1. LEER LOS DATOS DEL HTML
        const customTitle = el.dataset.backTitle;
        const customDesc = el.dataset.backDesc;
        const customListRaw = el.dataset.backList; 

        // 2. CREAR LA ESTRUCTURA 3D
        const flipCard = document.createElement('div');
        flipCard.className = 'flip-card';

        const flipInner = document.createElement('div');
        flipInner.className = 'flip-inner';

        const front = document.createElement('div');
        front.className = 'flip-front';

        const back = document.createElement('div');
        back.className = 'flip-back';

        // 3. MOVER EL CONTENIDO ORIGINAL AL FRENTE
        while (el.firstChild) {
            front.appendChild(el.firstChild);
        }

        // 4. CONSTRUIR EL REVERSO (BACK)
        const backTitle = document.createElement('h4');
        backTitle.textContent = customTitle ? customTitle : 'Detalles';

        const backDesc = document.createElement('p');
        backDesc.textContent = customDesc ? customDesc : 'Más información disponible.';

        const backList = document.createElement('ul');
        if (customListRaw) {
            const items = customListRaw.split(',');
            items.forEach(txt => {
                const li = document.createElement('li');
                li.textContent = txt.trim();
                backList.appendChild(li);
            });
        }

        const backBtn = document.createElement('button');
        backBtn.className = 'services_back_btn';
        backBtn.textContent = 'Volver';

        back.appendChild(backTitle);
        back.appendChild(backDesc);
        back.appendChild(backList);
        back.appendChild(backBtn);

        // 5. ARMAR LA TARJETA
        flipInner.appendChild(front);
        flipInner.appendChild(back);
        flipCard.appendChild(flipInner);
        el.appendChild(flipCard);

        // 6. ACTIVAR EL GIRO
        const cta = front.querySelector('.services_cta');
        if (cta) {
            cta.addEventListener('click', (e) => {
                e.preventDefault();
                flipCard.classList.add('flipped');
            });
        }

        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            flipCard.classList.remove('flipped');
        });
    });
});