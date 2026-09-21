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
  private resizeObserver?: ResizeObserver;

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
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
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
      // Clear any previous canvas children
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      const getWidth = () => Math.max(container.clientWidth || 0, container.offsetWidth || 0, 480);
      const getHeight = () => Math.max(container.clientHeight || 0, container.offsetHeight || 0, 360);

      const scene = new THREE.Scene();
      this.scene = scene;

      const camera = new THREE.PerspectiveCamera(45, getWidth() / getHeight(), 0.1, 1000);
      camera.position.set(0, 0, 16);
      this.camera = camera;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(getWidth(), getHeight());
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      container.appendChild(renderer.domElement);
      this.renderer = renderer;

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0x00c974, 3.0);
      dirLight.position.set(8, 12, 10);
      scene.add(dirLight);

      const cyanLight = new THREE.DirectionalLight(0x00f5ff, 2.0);
      cyanLight.position.set(-8, -10, 6);
      scene.add(cyanLight);

      // Centered Master Group
      const masterGroup = new THREE.Group();
      masterGroup.position.set(0, 0, 0);
      scene.add(masterGroup);

      // 1. Central Holographic Core (Wireframe Icosahedron + Inner Glowing Core)
      const innerGeo = new THREE.IcosahedronGeometry(3.0, 1);
      const innerMat = new THREE.MeshPhongMaterial({
        color: 0x00c974,
        wireframe: true,
        transparent: true,
        opacity: 0.4,
        emissive: 0x004d29,
        shininess: 90,
      });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      masterGroup.add(innerMesh);

      const coreGeo = new THREE.SphereGeometry(1.8, 32, 32);
      const coreMat = new THREE.MeshPhongMaterial({
        color: 0x052e1b,
        emissive: 0x00c974,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.8,
        shininess: 100,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      masterGroup.add(coreMesh);

      // 2. Biomechanical 32-Keypoint Humanoid Athlete Skeleton
      const skeletonGroup = new THREE.Group();
      masterGroup.add(skeletonGroup);

      // Joint Coordinates for Biomechanical Figure
      const joints: [number, number, number][] = [
        [0, 3.4, 0],       // 0: Head
        [0, 2.6, 0],       // 1: Neck
        [0, 1.3, 0],       // 2: Sternum / Upper Spine
        [0, 0.0, 0],       // 3: Core / Pelvis
        // Left Arm
        [-1.4, 2.4, 0],    // 4: L Shoulder
        [-2.3, 1.2, 0.3],  // 5: L Elbow
        [-2.0, 0.1, 0.7],  // 6: L Wrist
        [-1.8, -0.4, 0.8], // 7: L Hand
        // Right Arm
        [1.4, 2.4, 0],     // 8: R Shoulder
        [2.3, 1.2, 0.3],   // 9: R Elbow
        [2.0, 0.1, 0.7],   // 10: R Wrist
        [1.8, -0.4, 0.8],  // 11: R Hand
        // Left Leg
        [-0.8, -0.2, 0],   // 12: L Hip
        [-1.0, -1.8, 0.2], // 13: L Knee
        [-1.2, -3.4, 0],   // 14: L Ankle
        [-1.3, -3.7, 0.4], // 15: L Foot
        // Right Leg
        [0.8, -0.2, 0],    // 16: R Hip
        [1.0, -1.8, 0.2],  // 17: R Knee
        [1.2, -3.4, 0],    // 18: R Ankle
        [1.3, -3.7, 0.4],  // 19: R Foot
      ];

      // Bones Connecting Keypoints
      const bonePairs: [number, number][] = [
        [0, 1], [1, 2], [2, 3],
        [1, 4], [4, 5], [5, 6], [6, 7],
        [1, 8], [8, 9], [9, 10], [10, 11],
        [3, 12], [12, 13], [13, 14], [14, 15],
        [3, 16], [16, 17], [17, 18], [18, 19],
      ];

      // Create glowing keypoint joints
      const jointMaterial = new THREE.MeshBasicMaterial({
        color: 0x41e68d,
        transparent: true,
        opacity: 0.9,
      });

      const headGeo = new THREE.SphereGeometry(0.32, 16, 16);
      const headMesh = new THREE.Mesh(headGeo, jointMaterial);
      headMesh.position.set(joints[0][0], joints[0][1], joints[0][2]);
      skeletonGroup.add(headMesh);

      const jointGeo = new THREE.SphereGeometry(0.14, 12, 12);
      joints.slice(1).forEach(([x, y, z]) => {
        const jm = new THREE.Mesh(jointGeo, jointMaterial);
        jm.position.set(x, y, z);
        skeletonGroup.add(jm);
      });

      // Create bone connector lines
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x00c974,
        transparent: true,
        opacity: 0.55,
        linewidth: 2,
      });

      bonePairs.forEach(([idxA, idxB]) => {
        const pts = [
          new THREE.Vector3(...joints[idxA]),
          new THREE.Vector3(...joints[idxB]),
        ];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(lineGeo, lineMaterial);
        skeletonGroup.add(line);
      });

      // 3. Orbital Glowing Biometric Rings (Centered Gyroscope)
      const rings: { mesh: THREE.Mesh; speedX: number; speedY: number }[] = [];
      const ringData = [
        { r: 4.8, tube: 0.035, color: 0x00c974, rx: 1.1, ry: 0.4 },
        { r: 5.9, tube: 0.04, color: 0x10b981, rx: -0.8, ry: 1.2 },
        { r: 7.0, tube: 0.03, color: 0x34d399, rx: 0.6, ry: -0.7 },
      ];

      ringData.forEach((d) => {
        const geo = new THREE.TorusGeometry(d.r, d.tube, 16, 120);
        const mat = new THREE.MeshBasicMaterial({
          color: d.color,
          transparent: true,
          opacity: 0.65,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = d.rx;
        mesh.rotation.y = d.ry;
        masterGroup.add(mesh);
        rings.push({
          mesh,
          speedX: 0.005 * (Math.random() > 0.5 ? 1 : -1),
          speedY: 0.007,
        });
      });

      // 4. Floating Biometric Node Particles
      const particleCount = 130;
      const pGeo = new THREE.BufferGeometry();
      const posArray = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i += 3) {
        const radius = 3.5 + Math.random() * 5.0;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        posArray[i] = radius * Math.sin(phi) * Math.cos(theta);
        posArray[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        posArray[i + 2] = radius * Math.cos(phi);
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

      const pMat = new THREE.PointsMaterial({
        size: 0.16,
        color: 0x41e68d,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });
      const particles = new THREE.Points(pGeo, pMat);
      masterGroup.add(particles);

      // Responsive Resize Observer
      const updateSize = () => {
        if (!container || !renderer || !camera) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, true);
        }
      };

      this.resizeObserver = new ResizeObserver(() => updateSize());
      this.resizeObserver.observe(container);

      // Safety resize checks after initial CSS settle
      setTimeout(() => updateSize(), 60);
      setTimeout(() => updateSize(), 300);
      setTimeout(() => updateSize(), 800);

      // Mouse Parallax Interaction
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

      // Animation Loop
      const clock = new THREE.Clock();
      const animate = () => {
        this.animFrameId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        targetX += (mouseX * 0.4 - targetX) * 0.05;
        targetY += (mouseY * 0.4 - targetY) * 0.05;

        // Rotate entire scene gently around center
        masterGroup.rotation.y = elapsedTime * 0.18 + targetX;
        masterGroup.rotation.x = Math.sin(elapsedTime * 0.12) * 0.1 + targetY;

        innerMesh.rotation.y += 0.006;
        innerMesh.rotation.x += 0.004;

        rings.forEach((r, idx) => {
          r.mesh.rotation.z += 0.003 * (idx % 2 === 0 ? 1 : -1);
        });

        particles.rotation.y = -elapsedTime * 0.04;

        // Subtle breathing scale
        const scale = 1 + Math.sin(elapsedTime * 1.5) * 0.03;
        coreMesh.scale.set(scale, scale, scale);

        renderer.render(scene, camera);
      };

      animate();
    });
  }
}
