// Front-end/Src/Pages/Main/js/loader.js

const Loader = {
    element: null,

    init() {
        this.element = document.getElementById('preloader');
    },

    show() {
        if (!this.element) this.init();
        if (this.element) {
            this.element.classList.add('active'); // Agrega la clase CSS
        }
    },

    hide() {
        if (!this.element) this.init();
        if (this.element) {
            setTimeout(() => {
                this.element.classList.remove('active'); // Quita la clase CSS
            }, 500); // Pequeño delay extra para suavidad
        }
    }
};

window.Loader = Loader;