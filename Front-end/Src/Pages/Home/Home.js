/* ============================================
   CREDORA - SCRIPT Home
   ============================================
   
   Funcionalidades:
   - Animaciones 3D (Three.js)
   - Efectos de Aurora Borealis
   - Sistema de Nieve
   - Tarjeta 3D Interactiva
   - Scroll Parallax
   - Interactividad de Componentes
   
   ============================================ */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

// CONFIGURACIÓN RESPONSIVA
const isMobile = window.innerWidth < 768;

/**
 * CREAR TEXTURA REALISTA PARA LA TARJETA
 * Genera una textura de lienzo con chip, números y textos
 */
function createRealisticCardTexture() {
    const w = 1024, h = 640;
    const cvs = document.createElement('canvas');
    cvs.width = w; 
    cvs.height = h;
    const ctx = cvs.getContext('2d');
    
    // Fondo base con gradiente
    const grd = ctx.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, '#0a1a3a'); 
    grd.addColorStop(1, '#1a0a0a'); 
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    const texture = new THREE.CanvasTexture(cvs);
    texture.colorSpace = THREE.SRGBColorSpace; 

    /**
     * Dibujar detalles de la tarjeta (chip, números, textos)
     */
    function drawDetails() {
        // Chip dorado
        const chipX = 80, chipY = 250;
        ctx.fillStyle = '#d4af37'; 
        ctx.roundRect(chipX, chipY, 130, 100, 10); 
        ctx.fill();
        ctx.strokeStyle = '#b48f17'; 
        ctx.lineWidth = 2; 
        ctx.beginPath();
        ctx.moveTo(chipX, chipY + 30); 
        ctx.lineTo(chipX + 130, chipY + 30);
        ctx.moveTo(chipX, chipY + 70); 
        ctx.lineTo(chipX + 130, chipY + 70);
        ctx.moveTo(chipX + 65, chipY); 
        ctx.lineTo(chipX + 65, chipY + 100);
        ctx.moveTo(chipX + 35, chipY + 30); 
        ctx.lineTo(chipX + 35, chipY + 70);
        ctx.moveTo(chipX + 95, chipY + 30); 
        ctx.lineTo(chipX + 95, chipY + 70);
        ctx.stroke();

        // Números de tarjeta
        ctx.font = "bold 60px monospace";
        ctx.fillStyle = '#e0e0e0'; 
        ctx.shadowColor = 'rgba(0,0,0,0.6)'; 
        ctx.shadowOffsetX = 2; 
        ctx.shadowOffsetY = 3; 
        ctx.shadowBlur = 4;
        ctx.textAlign = 'left';
        ctx.fillText("**** **** **** ****", 80, 450);

        // Nombre titular
        ctx.font = "bold 32px sans-serif";
        ctx.fillText("ALEJANDRO BUENO", 80, 550);
        
        // Fecha de validez
        ctx.font = "20px sans-serif"; 
        ctx.fillText("VALID THRU", 650, 510);
        ctx.font = "bold 28px monospace"; 
        ctx.fillText("12/28", 650, 550);

        // Logo REDORA
        ctx.shadowColor = 'transparent'; 
        ctx.textAlign = 'left'; 
        ctx.font = "900 50px sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("REDORA", 150, 110); 
        
        // Subtext Platinum
        ctx.font = "300 24px sans-serif";
        ctx.fillStyle = "#cccccc";
        ctx.fillText("Platinum", 150, 150);
    }

    // Dibujar detalles iniciales
    drawDetails();
    texture.needsUpdate = true;

    /**
     * CARGA DE IMÁGENES DE FONDO Y LOGO
     */
    const imgBg = new Image();
    const imgLogo = new Image();

    // URLs de recursos
    imgBg.src = '../../Assets/Images/rojoazul.jpeg'; 
    imgLogo.src = '../../Assets/Logotipos Credora mejora/Diseño_sin_título-removebg-preview.png'; 

    imgBg.onload = () => {
        ctx.drawImage(imgBg, 0, 0, w, h);
        
        imgLogo.onload = () => {
            const logoW = 130; 
            const logoH = 130;
            ctx.drawImage(imgLogo, 40, 40, logoW, logoH); 
            drawDetails(); 
            texture.needsUpdate = true;
        };
        
        imgLogo.onerror = () => { 
            drawDetails(); 
            texture.needsUpdate = true; 
        };

        if(imgLogo.complete && imgLogo.naturalWidth !== 0) {
            ctx.drawImage(imgLogo, 40, 40, 130, 130); 
            drawDetails();
            texture.needsUpdate = true;
        } else if (!imgLogo.src) {
            drawDetails();
            texture.needsUpdate = true;
        }
    };

    return texture;
}

// Generar textura de la tarjeta
const cardMap = createRealisticCardTexture();

/**
 * INICIALIZAR ESCENA THREE.JS
 */
const scene = new THREE.Scene(); 
scene.background = new THREE.Color(0x000000); 
scene.fog = new THREE.FogExp2(0x000000, 0.04);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth/window.innerHeight, 0.1, 100); 
camera.position.set(0, 0, 13);

const renderer = new THREE.WebGLRenderer({antialias:true}); 
renderer.setSize(window.innerWidth, window.innerHeight); 
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
renderer.outputColorSpace = THREE.SRGBColorSpace; 
document.getElementById('canvas-container').appendChild(renderer.domElement);

/**
 * AURORA BOREALIS (SHADER MATERIAL)
 */
const auroraMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
        varying vec2 vUv; 
        void main(){ 
            vUv = uv; 
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
        }`,
    fragmentShader: `
        varying vec2 vUv; 
        uniform float uTime;
        void main() { 
            vec2 uv = vUv; 
            float w1 = sin(uv.x*2.0)*0.5+0.5; 
            vec3 c1 = vec3(0.25, 0.0, 0.05); 
            vec3 c2 = vec3(0.02, 0.02, 0.25); 
            vec3 col = mix(c1, c2, cos(uv.x*4.0)*0.5+0.5); 
            float mask = smoothstep(0.0,0.6,uv.y)*smoothstep(1.0,0.4,uv.y); 
            gl_FragColor = vec4(col*w1*mask*0.6, 1.0); 
        }`,
    transparent: true, 
    blending: THREE.AdditiveBlending, 
    depthWrite: false
});

const auroraPlane = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), auroraMat); 
auroraPlane.position.z = -10; 
scene.add(auroraPlane);

/**
 * SISTEMA DE NIEVE
 */
const particleCount = isMobile ? 800 : 2400; 
const snowGeo = new THREE.BufferGeometry(); 
const snowPos = new Float32Array(particleCount*3);

for(let i=0; i<particleCount; i++) {
    snowPos[i] = (Math.random()-0.5)*(i%3===1 ? 20 : 30);
}

snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));

// Crear textura de partícula de nieve
const sCvs = document.createElement('canvas'); 
sCvs.width = 32; 
sCvs.height = 32; 
const sCtx = sCvs.getContext('2d');
const gr = sCtx.createRadialGradient(16, 16, 0, 16, 16, 16); 
gr.addColorStop(0, 'rgba(255,255,255,0.8)'); 
gr.addColorStop(1, 'rgba(255,255,255,0)'); 
sCtx.fillStyle = gr; 
sCtx.fillRect(0, 0, 32, 32);

const snowMat = new THREE.PointsMaterial({
    size: 0.15, 
    map: new THREE.CanvasTexture(sCvs), 
    transparent: true, 
    opacity: 0.4, 
    blending: THREE.AdditiveBlending, 
    depthWrite: false
});

const snowSystem = new THREE.Points(snowGeo, snowMat); 
scene.add(snowSystem);

/**
 * TARJETA 3D INTERACTIVA
 */
const cardGroup = new THREE.Group(); 
scene.add(cardGroup);

const cardMesh = new THREE.Mesh(
    new THREE.BoxGeometry(5.0, 3.1, 0.07), 
    new THREE.MeshBasicMaterial({
        map: cardMap,
        color: 0xffffff,
        transparent: false,
        opacity: 1.0
    })
);

cardGroup.add(cardMesh);

/**
 * ILUMINACIÓN
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); 
scene.add(ambientLight);

const rimLight = new THREE.SpotLight(0xc1121f, 300); 
rimLight.position.set(5, 0, -5); 
scene.add(rimLight);

/**
 * POST-PROCESAMIENTO
 */
const composer = new EffectComposer(renderer); 
composer.addPass(new RenderPass(scene, camera));

/**
 * VARIABLES DE ANIMACIÓN
 */
const clock = new THREE.Clock(); 
let scrollY = 0;
const mouse = new THREE.Vector2();

const questionsSection = document.getElementById('preguntas');

/**
 * EVENT LISTENERS PARA ENTRADA DE USUARIO
 */
window.addEventListener('scroll', () => { 
    scrollY = window.scrollY; 
});

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

/**
 * FUNCIÓN PRINCIPAL DE ANIMACIÓN
 */
function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    
    // Animar nieve cayendo
    const pos = snowSystem.geometry.attributes.position.array;
    for(let i = 1; i < particleCount * 3; i += 3){ 
        pos[i] -= 0.03; 
        if(pos[i] < -10) pos[i] = 10; 
    }
    snowSystem.geometry.attributes.position.needsUpdate = true;

    // Calcular limite de animación
    const animationLimit = questionsSection ? 
        (questionsSection.offsetTop + (questionsSection.clientHeight * 0.5) - (window.innerHeight * 0.5)) 
        : 99999;
    
    const effectiveScroll = Math.min(scrollY, animationLimit);
    const scrollRange = animationLimit > 0 ? animationLimit : 1; 
    const progress = effectiveScroll / scrollRange; 
    
    // Posiciones y rotaciones de la tarjeta
    let targetY = 0; 
    let targetX = 4.5;
    let targetRotX_Scroll = 0; 
    let targetRotZ_Scroll = 0;
    
    // Lógica de scroll basada en animación
    if(effectiveScroll > 50) {
        targetX = Math.cos(progress * Math.PI * 4) * 4.5; 
        targetRotZ_Scroll = Math.sin(progress * Math.PI * 4) * 0.4;
        targetRotX_Scroll = progress * Math.PI * 0.25; 
    } else {
        targetY = 0; 
        targetX = 4.5; 
        targetRotX_Scroll = 0; 
        targetRotZ_Scroll = 0;
    }

    // Control de movimiento del mouse
    const isFrozen = scrollY > animationLimit;
    const mouseTiltStrength = isFrozen ? 0 : 0.3;

    const targetRotX_Mouse = mouse.y * mouseTiltStrength;
    const targetRotY_Mouse = mouse.x * mouseTiltStrength;
    const smoothing = 0.12;

    // Aplicar suavizado a posiciones
    cardGroup.position.y += (targetY - cardGroup.position.y) * smoothing;
    if(cardGroup.position.y < -1.5) cardGroup.position.y = -1.5;
    cardGroup.position.x += (targetX - cardGroup.position.x) * smoothing;

    // Aplicar rotaciones
    const totalTargetRotX = targetRotX_Scroll - targetRotX_Mouse; 
    cardMesh.rotation.x += (totalTargetRotX - cardMesh.rotation.x) * smoothing;
    const totalTargetRotY = targetRotY_Mouse;
    cardMesh.rotation.y += (totalTargetRotY - cardMesh.rotation.y) * smoothing;
    cardMesh.rotation.z += (targetRotZ_Scroll - cardMesh.rotation.z) * smoothing;
    
    // Movimiento flotante
    if(!isFrozen) {
        cardGroup.position.y += Math.sin(time) * 0.002;
    }

    composer.render();
}

// Iniciar animación
animate();

/**
 * EVENT LISTENER PARA RESIZE DE VENTANA
 */
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

/**
 * PRELOADER - OCULTAR AL CARGAR
 */
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    preloader.style.opacity = '0';
    setTimeout(() => {
        preloader.style.display = 'none';
        const nav = document.querySelector('.nav');
        const heroContent = document.querySelector('.hero_content');
        if(nav) nav.classList.add('is-visible');
        if(heroContent) heroContent.classList.add('is-visible');
    }, 500);
});

/**
 * INICIALIZAR COMPONENTES INTERACTIVOS
 */
document.addEventListener('DOMContentLoaded', () => {
    
    /**
     * INTERSECTION OBSERVER - PARA SCROLL ANIMATIONS
     */
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            } else {
                entry.target.classList.remove('is-visible');
            }
        });
    }, { threshold: 0.1 }); 

    document.querySelectorAll('.scroll-item').forEach(el => observer.observe(el));

    /**
     * SERVICIOS - SISTEMA DE FLIP CARDS
     */
    document.querySelectorAll('.services_element').forEach(el => {
        const backContent = el.querySelector('.flip-back');
        
        // Crear título posterior
        const title = document.createElement('h4'); 
        title.className = 'back-title'; 
        title.textContent = el.dataset.backTitle;
        
        // Crear lista de beneficios
        const list = document.createElement('ul'); 
        list.className = 'services-list-ul';
        if(el.dataset.backList) {
            el.dataset.backList.split(',').forEach(item => {
                const li = document.createElement('li');
                li.className = 'services-list-li';
                li.innerHTML = `<span class="check-icon">✓</span> ${item.trim()}`;
                list.appendChild(li);
            });
        }
        
        // Crear botón de volver
        const btn = document.createElement('button'); 
        btn.className = "services_back_btn"; 
        btn.textContent = "Volver";
        backContent.append(title, list, btn);
        
        // Event listeners para flip
        const ctaBtn = el.querySelector('.services_cta');
        if(ctaBtn) {
            ctaBtn.addEventListener('click', (e) => { 
                e.preventDefault(); 
                el.classList.add('flipped'); 
            });
        }
        btn.addEventListener('click', (e) => { 
            e.preventDefault(); 
            el.classList.remove('flipped'); 
        });
    });

    /**
     * TESTIMONIOS - CARRUSEL
     */
    const testimonies = document.querySelectorAll('.testimony_body'), 
          prevBtn = document.getElementById('prevTestimony'), 
          nextBtn = document.getElementById('nextTestimony'); 
    
    let currentTestimony = 0;

    function showTestimony(index) {
        testimonies.forEach(t => t.classList.remove('testimony_body--show'));
        testimonies[index].classList.add('testimony_body--show');
    }

    nextBtn.addEventListener('click', () => {
        currentTestimony = (currentTestimony + 1) % testimonies.length;
        showTestimony(currentTestimony);
    });

    prevBtn.addEventListener('click', () => {
        currentTestimony = (currentTestimony - 1 + testimonies.length) % testimonies.length;
        showTestimony(currentTestimony);
    });
    
    /**
     * FAQ - ACORDEÓN
     */
    document.querySelectorAll('.questions_title').forEach(q => {
        q.addEventListener('click', () => {
            const parent = q.parentElement;
            parent.classList.toggle('active');
        });
    });

    /**
     * NAVEGACIÓN FLOTANTE
     */
    const sections = ['inicio', 'acerca', 'knowledge-section', 'servicios', 'contacto', 'preguntas', 'final']; 
    
    document.getElementById('navUp').addEventListener('click', () => {
        const c = sections.find(id => document.getElementById(id).getBoundingClientRect().top >= -100);
        const p = sections[sections.indexOf(c) - 1];
        if(p) document.getElementById(p).scrollIntoView();
    });
    
    document.getElementById('navDown').addEventListener('click', () => {
        const c = sections.find(id => document.getElementById(id).getBoundingClientRect().top >= -100);
        const n = sections[sections.indexOf(c) + 1];
        if(n) document.getElementById(n).scrollIntoView();
    });
});
