const particleVertex = `
  attribute float scale;
  uniform float uTime;

  void main() {
    vec3 p = position;
    float s = scale;

    p.y += (sin(p.x + uTime) * 0.5) + (cos(p.y + uTime) * 0.1) * 2.0;
    p.x += (sin(p.y + uTime) * 0.5);
    s += (sin(p.x + uTime) * 0.5) + (cos(p.y + uTime) * 0.1) * 2.0;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = s * 15.0 * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particleFragment = `
  void main() {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 0.5);
  }
`;

function lerp(start, end, amount) {
  return (1 - amount) * start + amount * end;
};

class Canvas {
  constructor() {
    this.config = {
      canvas: document.querySelector('#c'),
      winWidth: window.innerWidth,
      winHeight: window.innerHeight,
      aspectRatio: window.innerWidth / window.innerHeight,
      mouse: new THREE.Vector2(-10, -10)
    };

    this.onResize = this.onResize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.animate = this.animate.bind(this);

    this.initCamera();
    this.initScene();
    this.initRenderer();
    this.initParticles();
    this.bindEvents();
    this.animate();
  }

  bindEvents() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove, false);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(75, this.config.aspectRatio, 0.01, 1000);
    this.camera.position.set(0, 6, 5);
  }

  initScene() {
    this.scene = new THREE.Scene();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.config.canvas,
      antialias: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.config.winWidth, this.config.winHeight);
  }

  initParticles() {
    const gap = 0.3;
    const amountX = 200;
    const amountY = 200;
    const particleNum = amountX * amountY;
    const particlePositions = new Float32Array(particleNum * 3);
    const particleScales = new Float32Array(particleNum);
    let i = 0;
    let j = 0;

    for (let ix = 0; ix < amountX; ix++) {
      for (let iy = 0; iy < amountY; iy++) {
        particlePositions[i] = ix * gap - ((amountX * gap) / 2);
        particlePositions[i + 1] = 0;
        particlePositions[i + 2] = iy * gap - ((amountX * gap) / 2);
        particleScales[j] = 1;
        i += 3;
        j++;
      }
    }

    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    this.particleGeometry.setAttribute('scale', new THREE.BufferAttribute(particleScales, 1));

    this.particleMaterial = new THREE.ShaderMaterial({
      transparent: true,
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      uniforms: {
        uTime: { type: 'f', value: 0 }
      }
    });
    this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particles);
  }

  render() {
    this.camera.lookAt(this.scene.position);
    this.renderer.render(this.scene, this.camera);
  }

  animate() {
    this.particleMaterial.uniforms.uTime.value += 0.05;
    requestAnimationFrame(this.animate);
    this.render();
  }

  onMouseMove(e) {
    this.config.mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
    this.config.mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
  }

  onResize() {
    this.config.winWidth = window.innerWidth;
    this.config.winHeight = window.innerHeight;
    this.camera.aspect = this.config.winWidth / this.config.winHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.config.winWidth, this.config.winHeight);
  }

  updateParticleColor(color) {
	this.particleMaterial.fragmentShader = `
	  void main() {
		gl_FragColor = vec4(${color === "black" ? "0.0, 0.0, 0.0, 0.5" : "1.0, 1.0, 1.0, 0.5"});
	  }
	`;
	this.particleMaterial.needsUpdate = true;
	this.particles.material = this.particleMaterial; // Forçar a atualização do material
  }
  
}

document.addEventListener("DOMContentLoaded", function () {
    const page = document.getElementById("Page");
    const savedTheme = localStorage.getItem("theme");

    // Definir cores padrão
    let backgroundColor = 0x000000; // Preto
    let particleColor = "white";    // Partículas brancas

    if (savedTheme === "light") {
        document.body.classList.add("is-light");
        document.body.classList.remove("is-dark");

        backgroundColor = 0xffffff; // Branco
        particleColor = "black";    // Partículas pretas
    } else {
        document.body.classList.add("is-dark");
        document.body.classList.remove("is-light");
    }

    // Criar a instância do Three.js **após definir o tema**
    const canvasInstance = new Canvas();
    canvasInstance.scene.background = new THREE.Color(backgroundColor);
    canvasInstance.updateParticleColor(particleColor);

    // 🔹 Ativar Light Mode
    document.getElementById("lightMode").addEventListener("click", () => {
        document.body.classList.add("is-light");
        document.body.classList.remove("is-dark");
        localStorage.setItem("theme", "light");

        // Atualizar fundo e partículas
        canvasInstance.scene.background = new THREE.Color(0xffffff);
        canvasInstance.updateParticleColor("black");
    });

    // 🔹 Ativar Dark Mode
    document.getElementById("darkMode").addEventListener("click", () => {
        document.body.classList.add("is-dark");
        document.body.classList.remove("is-light");
        localStorage.setItem("theme", "dark");

        // Atualizar fundo e partículas
        canvasInstance.scene.background = new THREE.Color(0x000000);
        canvasInstance.updateParticleColor("white");
    });

    // 🔹 Animações GSAP (mantém do jeito que já está)
    gsap.to("#Page", { opacity: 1, duration: 1, ease: "power2.out" });
    gsap.to("#intro-text", { opacity: 1, duration: 1, ease: "power3.out", delay: 0.3 });
    gsap.to("#first-word", { opacity: 1, duration: 1, ease: "power2.out", delay: 0.6 });
    gsap.to("#second-word", { opacity: 1, duration: 1, ease: "power2.out", delay: 0.9 });

    gsap.to("#first-word", {
        opacity: 0,
        duration: 1,
        ease: "power2.inOut",
        delay: 2
    });

    gsap.to("#second-word", {
        opacity: 0,
        duration: 1,
        ease: "power2.inOut",
        delay: 2.2,
        onComplete: function() {
            gsap.to("#background canvas", { opacity: 1, duration: 1.5, ease: "power3.out" });
            gsap.to("#Frame", { opacity: 1, duration: 1.5, ease: "power3.out" });
            gsap.to("#SiteHeader", { opacity: 1, duration: 1, ease: "power3.out" });
            gsap.to("#Content", { opacity: 1, duration: 1, ease: "power3.out" });
        }
    });
});

gsap.to("#Copyright", {
    opacity: 1,
    duration: 1,
    ease: "power2.out",
    delay: 3.2,
});

gsap.to("#Theme", {
    opacity: 1,
    duration: 1,
    ease: "power2.out",
    delay: 3.2,
});

document.body.classList.add("is-light");
document.body.classList.remove("is-dark");

function toggleTheme(isLight) {
    if (isLight) {
        document.body.classList.add("is-light");
        document.body.classList.remove("is-dark");
        document.querySelector("#background canvas").style.backgroundColor = "white";
        document.querySelector("#background canvas").style.opacity = "1"; 
    } else {
        document.body.classList.add("is-dark");
        document.body.classList.remove("is-light");
        document.querySelector("#background canvas").style.backgroundColor = "black";
        document.querySelector("#background canvas").style.opacity = "1"; 
    }
}





