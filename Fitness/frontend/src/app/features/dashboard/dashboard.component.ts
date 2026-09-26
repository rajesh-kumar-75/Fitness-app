import {
  Component,
  inject,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface FloatingObject {
  type: 'barbell' | 'kettlebell' | 'dumbbell' | 'treadmill';
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  scale: number;
  rotation: number;
  speed: number;
  amplitude: number;
  phase: number;
  color: 'cyan' | 'purple' | 'metal';
}

interface PlasmaArc {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  points: { x: number; y: number }[];
  life: number;
  maxLife: number;
}

import { WaterTrackerComponent } from '../nutrition/components/water-tracker/water-tracker.component';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, WaterTrackerComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);

  @ViewChild('plasmaCanvas', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly user = this.authService.currentUser;
  readonly isTrainer = this.authService.isTrainer;
  readonly isAdmin = this.authService.isAdmin;

  // Step Counter State (Default Goal: 10,000 steps, max: 50,000)
  readonly stepGoal = signal<number>(10000);
  readonly currentSteps = signal<number>(0);
  readonly isUpdatingSteps = signal<boolean>(false);

  readonly stepPercentage = computed(() => {
    const goal = this.stepGoal();
    if (goal <= 0) return 0;
    return Math.min(100, Math.round((this.currentSteps() / goal) * 100));
  });

  readonly remainingSteps = computed(() => {
    return Math.max(0, this.stepGoal() - this.currentSteps());
  });

  readonly isStepGoalAchieved = computed(() => {
    return this.currentSteps() >= this.stepGoal();
  });

  // Display user details matching image_5.png with live fallbacks
  readonly displayName = computed(() => this.user()?.name || 'Adugula Rajesh Kumar');
  readonly displayEmail = computed(() => this.user()?.email || 'rajeshadugula501@gmail.com');
  readonly displayRole = computed(() => (this.user()?.role || 'USER').toUpperCase());
  readonly displayUserId = computed(() => this.user()?._id || '68cfd401a89c2d1b74e89f12');
  readonly displayJoined = computed(() => {
    const raw = this.user()?.createdAt;
    if (!raw) return 'Sep 19, 2026';
    const date = new Date(raw);
    return isNaN(date.getTime()) ? 'Sep 19, 2026' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  });

  readonly activeStreak = '42 DAYS';
  readonly nextGoal = 'Bench 100kg - 85% Completed';

  private animFrameId: number | null = null;
  private mouseX = 0;
  private mouseY = 0;
  private targetMouseX = 0;
  private targetMouseY = 0;
  private time = 0;
  private plasmaArcs: PlasmaArc[] = [];

  ngOnInit(): void {
    // Listen to mouse movement for subtle anti-gravity parallax
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', this.onMouseMove);
    }
    this.loadSteps();
  }

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      this.initCanvas();
    }
  }

  ngOnDestroy(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', this.onMouseMove);
      window.removeEventListener('resize', this.onResize);
    }
  }

  private onMouseMove = (e: MouseEvent): void => {
    const width = window.innerWidth || 1920;
    const height = window.innerHeight || 1080;
    this.targetMouseX = (e.clientX / width - 0.5) * 40;
    this.targetMouseY = (e.clientY / height - 0.5) * 30;
  };

  private onResize = (): void => {
    if (!this.canvasRef?.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
    canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
  };

  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    if (!canvas) return;

    this.onResize();
    window.addEventListener('resize', this.onResize);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create persistent starfield
    const numStars = 120;
    const stars: { x: number; y: number; size: number; alpha: number; pulseSpeed: number; color: string }[] = [];
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        pulseSpeed: Math.random() * 0.03 + 0.01,
        color: Math.random() > 0.4 ? '#38bdf8' : (Math.random() > 0.5 ? '#c084fc' : '#ffffff'),
      });
    }

    const render = () => {
      this.time += 0.015;

      // Smooth mouse interpolation
      this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
      this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // 1. Draw Cosmic Starfield
      for (const star of stars) {
        const starX = (star.x * w + this.mouseX * 0.2) % w;
        const starY = (star.y * h + this.mouseY * 0.2) % h;
        const currentAlpha = star.alpha * (0.6 + 0.4 * Math.sin(this.time * star.pulseSpeed * 100));

        ctx.save();
        ctx.globalAlpha = currentAlpha;
        ctx.fillStyle = star.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = star.color;
        ctx.beginPath();
        ctx.arc(starX, starY, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2. Draw Holographic Observation Portal Rings
      this.drawObservationPortalRings(ctx, w, h);

      // 3. Generate and Render Procedural Plasma Tendrils
      this.updateAndDrawPlasma(ctx, w, h);

      this.animFrameId = requestAnimationFrame(render);
    };

    render();
  }

  /**
   * Draw perspective curved neon portal rings that frame the anti-gravity chamber
   */
  private drawObservationPortalRings(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.save();

    // Left curved cyan ring arc
    ctx.beginPath();
    ctx.ellipse(w * 0.12 + this.mouseX * 0.4, h * 0.45 + this.mouseY * 0.4, w * 0.45, h * 0.55, -0.2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.16)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 18;
    ctx.stroke();

    // Right curved cyan ring arc
    ctx.beginPath();
    ctx.ellipse(w * 0.88 + this.mouseX * 0.4, h * 0.48 + this.mouseY * 0.4, w * 0.42, h * 0.52, 0.2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.14)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Electric purple outer orbital accent
    ctx.beginPath();
    ctx.ellipse(w * 0.5 + this.mouseX * 0.2, h * 0.35 + this.mouseY * 0.2, w * 0.6, h * 0.32, 0, Math.PI * 0.8, Math.PI * 2.2);
    ctx.strokeStyle = 'rgba(184, 69, 237, 0.12)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#b845ed';
    ctx.shadowBlur = 14;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Generates procedural lightning plasma streams between anchors
   */
  private updateAndDrawPlasma(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // Generate new arcs periodically
    if (Math.random() < 0.25 && this.plasmaArcs.length < 5) {
      // Anchors: barbell (top-center), kettlebell-left, kettlebell-right, kettlebell-bottom
      const anchors = [
        { x: w * 0.21, y: h * 0.22 }, // Top-left kettlebell
        { x: w * 0.48, y: h * 0.18 }, // Center barbell
        { x: w * 0.78, y: h * 0.23 }, // Top-right kettlebell
        { x: w * 0.41, y: h * 0.46 }, // Center kettlebell
        { x: w * 0.86, y: h * 0.36 }, // Right dumbbell
      ];

      const p1 = anchors[Math.floor(Math.random() * anchors.length)];
      let p2 = anchors[Math.floor(Math.random() * anchors.length)];
      while (p1 === p2) {
        p2 = anchors[Math.floor(Math.random() * anchors.length)];
      }

      const isCyan = Math.random() > 0.45;
      const color = isCyan ? '#00f5ff' : '#c084fc';
      const points = this.generateLightningPoints(p1.x, p1.y, p2.x, p2.y, 7, 26);

      this.plasmaArcs.push({
        fromX: p1.x,
        fromY: p1.y,
        toX: p2.x,
        toY: p2.y,
        color,
        points,
        life: 0,
        maxLife: Math.floor(Math.random() * 8) + 6,
      });
    }

    // Render & advance life of active arcs
    for (let i = this.plasmaArcs.length - 1; i >= 0; i--) {
      const arc = this.plasmaArcs[i];
      arc.life++;

      const progress = arc.life / arc.maxLife;
      const alpha = Math.sin(progress * Math.PI) * 0.85;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = arc.color;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = arc.color;
      ctx.shadowBlur = 16;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(arc.points[0].x, arc.points[0].y);
      for (let j = 1; j < arc.points.length; j++) {
        ctx.lineTo(arc.points[j].x, arc.points[j].y);
      }
      ctx.stroke();

      // Core white electrical center
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 6;
      ctx.stroke();

      ctx.restore();

      if (arc.life >= arc.maxLife) {
        this.plasmaArcs.splice(i, 1);
      }
    }
  }

  private generateLightningPoints(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    segments: number,
    roughness: number
  ): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [{ x: x1, y: y1 }];
    const dx = (x2 - x1) / segments;
    const dy = (y2 - y1) / segments;

    for (let i = 1; i < segments; i++) {
      const offsetX = (Math.random() - 0.5) * roughness * 2;
      const offsetY = (Math.random() - 0.5) * roughness * 2;
      points.push({
        x: x1 + dx * i + offsetX,
        y: y1 + dy * i + offsetY,
      });
    }
    points.push({ x: x2, y: y2 });
    return points;
  }

  loadSteps(): void {
    this.dashboardService.getDailySteps().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.currentSteps.set(res.data.steps || 0);
          this.stepGoal.set(res.data.stepGoal || 10000);
        }
      },
      error: (err) => {
        console.warn('Could not load step count from backend:', err);
      },
    });
  }

  addSteps(amount: number): void {
    const nextVal = Math.min(50000, this.currentSteps() + amount);
    this.currentSteps.set(nextVal);
    this.syncSteps(nextVal);
  }

  resetSteps(): void {
    if (this.currentSteps() === 0) return;
    if (!confirm("Are you sure you want to reset today's step count to 0?")) return;
    this.currentSteps.set(0);
    this.syncSteps(0);
  }

  private syncSteps(steps: number): void {
    this.isUpdatingSteps.set(true);
    this.dashboardService.updateDailySteps(steps, this.stepGoal()).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.currentSteps.set(res.data.steps);
          this.stepGoal.set(res.data.stepGoal);
        }
        this.isUpdatingSteps.set(false);
      },
      error: (err) => {
        console.error('Failed to sync steps with backend:', err);
        this.isUpdatingSteps.set(false);
      },
    });
  }

  onRefreshProfile(): void {
    this.authService.fetchCurrentUser().subscribe();
  }

  onLogout(): void {
    this.authService.logout();
  }
}
