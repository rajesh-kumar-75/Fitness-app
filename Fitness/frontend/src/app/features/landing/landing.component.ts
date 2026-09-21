import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as THREE from 'three';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  private readonly ngZone = inject(NgZone);
  private readonly authService = inject(AuthService);

  @ViewChild('threejsContainer') threejsContainerRef!: ElementRef<HTMLDivElement>;

  readonly isAuthenticated = this.authService.isAuthenticated;

  // Billing state
  readonly billingCycle = signal<'monthly' | 'yearly'>('monthly');

  // Interactive Set Logger state
  readonly set3Logged = signal<boolean>(false);

  // Active Exercise filter
  readonly activeExercise = signal<string>('Bicep Curls');

  // CTA form state
  readonly ctaSubmitted = signal<boolean>(false);
  readonly ctaEmail = signal<string>('');

  // Three.js instances
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private renderer?: THREE.WebGLRenderer;
  private animFrameId?: number;
  private mouseMoveHandler?: (e: MouseEvent) => void;
  private resizeHandler?: () => void;

  ngAfterViewInit(): void {
    this.initThreeJS();
  }

  ngOnDestroy(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.mouseMoveHandler) {
      window.removeEventListener('mousemove', this.mouseMoveHandler);
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }

  setBilling(cycle: 'monthly' | 'yearly'): void {
    this.billingCycle.set(cycle);
  }

  logSet(): void {
    this.set3Logged.set(true);
  }

  selectExercise(name: string): void {
    this.activeExercise.set(name);
  }

  onCtaSubmit(emailInput: HTMLInputElement): void {
    if (emailInput && emailInput.value) {
      this.ctaEmail.set(emailInput.value);
      this.ctaSubmitted.set(true);
    }
  }

  private initThreeJS(): void {
    const container = this.threejsContainerRef?.nativeElement;
    if (!container) return;

    this.ngZone.runOutsideAngular(() => {
      const width = container.clientWidth || 600;
      const height = container.clientHeight || 360;

      const scene = new THREE.Scene();
      this.scene = scene;

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 0, 18);
      this.camera = camera;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(renderer.domElement);
      this.renderer = renderer;

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0x00c974, 2.5);
      dirLight.position.set(10, 15, 10);
      scene.add(dirLight);

      const blueLight = new THREE.DirectionalLight(0x10b981, 1.8);
      blueLight.position.set(-10, -10, 5);
      scene.add(blueLight);

      const group = new THREE.Group();
      scene.add(group);

      // 1. Central Holographic Core (Wireframe Icosahedron + Inner Sphere)
      const innerGeo = new THREE.IcosahedronGeometry(3.6, 1);
      const innerMat = new THREE.MeshPhongMaterial({
        color: 0x00c974,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
        emissive: 0x005a30,
        shininess: 80,
      });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      group.add(innerMesh);

      const coreGeo = new THREE.SphereGeometry(2.2, 32, 32);
      const coreMat = new THREE.MeshPhongMaterial({
        color: 0x052e1b,
        emissive: 0x00c974,
        emissiveIntensity: 0.25,
        transparent: true,
        opacity: 0.85,
        shininess: 100,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      group.add(coreMesh);

      // 2. Orbital Glowing Biometric Rings
      const rings: { mesh: THREE.Mesh; speedX: number; speedY: number }[] = [];
      const ringData = [
        { r: 5.5, tube: 0.04, color: 0x00c974, rx: 1.2, ry: 0.4 },
        { r: 6.8, tube: 0.05, color: 0x10b981, rx: -0.7, ry: 1.1 },
        { r: 8.0, tube: 0.03, color: 0x34d399, rx: 0.5, ry: -0.8 },
      ];

      ringData.forEach((d) => {
        const geo = new THREE.TorusGeometry(d.r, d.tube, 16, 100);
        const mat = new THREE.MeshBasicMaterial({
          color: d.color,
          transparent: true,
          opacity: 0.75,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = d.rx;
        mesh.rotation.y = d.ry;
        group.add(mesh);
        rings.push({
          mesh,
          speedX: 0.006 * (Math.random() > 0.5 ? 1 : -1),
          speedY: 0.008,
        });
      });

      // 3. Floating Biometric Node Particles
      const particleCount = 140;
      const pGeo = new THREE.BufferGeometry();
      const posArray = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i += 3) {
        const radius = 4.5 + Math.random() * 6.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        posArray[i] = radius * Math.sin(phi) * Math.cos(theta);
        posArray[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        posArray[i + 2] = radius * Math.cos(phi);
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

      const pMat = new THREE.PointsMaterial({
        size: 0.18,
        color: 0x00c974,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const particles = new THREE.Points(pGeo, pMat);
      group.add(particles);

      // Mouse Parallax
      let mouseX = 0;
      let mouseY = 0;
      let targetX = 0;
      let targetY = 0;

      this.mouseMoveHandler = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        mouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
      };
      window.addEventListener('mousemove', this.mouseMoveHandler);

      this.resizeHandler = () => {
        if (!container || !renderer || !camera) return;
        const w = container.clientWidth || 600;
        const h = container.clientHeight || 360;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', this.resizeHandler);

      // Animation Loop
      const clock = new THREE.Clock();
      const animate = () => {
        this.animFrameId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        targetX += (mouseX * 0.5 - targetX) * 0.05;
        targetY += (mouseY * 0.5 - targetY) * 0.05;

        group.rotation.y = elapsedTime * 0.2 + targetX;
        group.rotation.x = Math.sin(elapsedTime * 0.15) * 0.15 + targetY;

        innerMesh.rotation.y += 0.005;
        innerMesh.rotation.x += 0.003;

        rings.forEach((r, idx) => {
          r.mesh.rotation.z += 0.004 * (idx % 2 === 0 ? 1 : -1);
        });

        particles.rotation.y = -elapsedTime * 0.05;

        const scale = 1 + Math.sin(elapsedTime * 1.8) * 0.04;
        coreMesh.scale.set(scale, scale, scale);

        renderer.render(scene, camera);
      };

      animate();
    });
  }
}
