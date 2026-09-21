import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
  HostListener,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';

export interface ExerciseDef {
  id: string;
  name: string;
  icon: string;
  target: string;
  equipment: string;
  aiCue: string;
  primaryMuscle: string;
  secondaryMuscle: string;
}

@Component({
  selector: 'app-three-background',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="three-container">
      <canvas #webglCanvas class="webgl-canvas"></canvas>

      <!-- Interactive 3D Exercise & AI Form HUD Overlay -->
      <div class="exercise-hud">
        <!-- Top: Active Workout & AI Biometrics Telemetry -->
        <div class="hud-top-card glass-badge">
          <!-- AI Status Bar -->
          <div class="ai-status-row">
            <div class="ai-badge">
              <span class="ai-pulse"></span>
              <span class="ai-label">AI BIOMECHANICS ENGINE</span>
            </div>
            <div class="ai-score-pill">
              <span class="score-dot"></span>
              <span class="score-val">{{ aiFormScore() }}%</span>
              <span class="score-text">FORM ACCURACY</span>
            </div>
          </div>

          <!-- Active Exercise Title & Reps -->
          <div class="exercise-header">
            <div class="title-group">
              <span class="exercise-icon">{{ currentExercise().icon }}</span>
              <span class="exercise-title">{{ currentExercise().name }}</span>
            </div>
            <div class="rep-counter">
              <span class="rep-label">REP</span>
              <span class="rep-num">{{ currentRep() }}</span>
            </div>
          </div>

          <!-- Live AI Coaching Cue -->
          <div class="ai-cue-box">
            <span class="cue-robot">🤖</span>
            <span class="cue-text">{{ currentExercise().aiCue }}</span>
          </div>

          <!-- Muscle Target Telemetry -->
          <div class="muscle-metrics">
            <div class="metric-item">
              <span class="metric-name">Primary: {{ currentExercise().primaryMuscle }}</span>
              <div class="metric-bar"><div class="fill fill-primary"></div></div>
            </div>
            <div class="metric-item">
              <span class="metric-name">Stabilizers: {{ currentExercise().secondaryMuscle }}</span>
              <div class="metric-bar"><div class="fill fill-secondary"></div></div>
            </div>
          </div>
        </div>

        <!-- Bottom: Exercise Switcher Pills & Auto-Cycle -->
        <div class="hud-bottom-controls">
          <div class="pills-scroll-container">
            <button
              *ngFor="let ex of exercises; let idx = index"
              type="button"
              class="pill-btn"
              [class.active]="selectedExerciseIndex() === idx"
              (click)="onSelectExercise(idx)"
            >
              <span class="btn-icon">{{ ex.icon }}</span>
              <span class="btn-label">{{ ex.id | uppercase }}</span>
            </button>
          </div>

          <div class="cycle-bar">
            <button type="button" class="cycle-status-btn" (click)="toggleAutoCycle()">
              <span class="cycle-icon">{{ autoCycle() ? '🔄' : '⏸️' }}</span>
              <span class="cycle-text">
                {{ autoCycle() ? 'AI Auto-Cycle Active (8s)' : 'Manual Mode (Paused)' }}
              </span>
            </button>
            <span class="athlete-badge">🧍 3D ATHLETE RIG V2.5</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 3;
        pointer-events: none;
      }

      .three-container {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
      }

      .webgl-canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 3;
        display: block;
        pointer-events: none;
      }

      .exercise-hud {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 4;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 1.25rem 1.5rem;
        pointer-events: none;
        box-sizing: border-box;
      }

      .glass-badge {
        background: rgba(13, 17, 23, 0.78);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        border: 1px solid rgba(16, 185, 129, 0.28);
        border-radius: 0.95rem;
        padding: 0.85rem 1.1rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55), inset 0 0 20px rgba(16, 185, 129, 0.08);
      }

      .hud-top-card {
        max-width: 310px;
        pointer-events: auto;
        animation: fadeInDown 0.6s cubic-bezier(0.16, 1, 0.3, 1);

        .ai-status-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.45rem;

          .ai-badge {
            display: flex;
            align-items: center;
            gap: 0.4rem;

            .ai-pulse {
              width: 7px;
              height: 7px;
              border-radius: 50%;
              background: #10b981;
              box-shadow: 0 0 8px #10b981;
              animation: pulseGlow 1.5s infinite;
            }

            .ai-label {
              font-size: 0.64rem;
              font-weight: 800;
              letter-spacing: 0.08em;
              color: #10b981;
            }
          }

          .ai-score-pill {
            display: flex;
            align-items: center;
            gap: 0.3rem;
            background: rgba(16, 185, 129, 0.12);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 9999px;
            padding: 0.12rem 0.48rem;

            .score-dot {
              width: 5px;
              height: 5px;
              border-radius: 50%;
              background: #34d399;
            }

            .score-val {
              font-size: 0.68rem;
              font-weight: 800;
              color: #34d399;
              font-family: monospace;
            }

            .score-text {
              font-size: 0.58rem;
              font-weight: 700;
              color: #94a3b8;
            }
          }
        }

        .exercise-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.45rem;

          .title-group {
            display: flex;
            align-items: center;
            gap: 0.45rem;

            .exercise-icon {
              font-size: 1.15rem;
            }

            .exercise-title {
              font-size: 1.02rem;
              font-weight: 800;
              color: #ffffff;
              letter-spacing: -0.01em;
            }
          }

          .rep-counter {
            display: flex;
            align-items: baseline;
            gap: 0.2rem;
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.25) 100%);
            border: 1px solid rgba(16, 185, 129, 0.4);
            padding: 0.15rem 0.5rem;
            border-radius: 0.45rem;

            .rep-label {
              font-size: 0.58rem;
              font-weight: 700;
              color: #94a3b8;
            }

            .rep-num {
              font-size: 0.95rem;
              font-weight: 900;
              color: #34d399;
              font-family: monospace;
            }
          }
        }

        .ai-cue-box {
          display: flex;
          align-items: flex-start;
          gap: 0.4rem;
          background: rgba(15, 23, 42, 0.65);
          border-left: 3px solid #10b981;
          padding: 0.35rem 0.55rem;
          border-radius: 0 0.45rem 0.45rem 0;
          margin-bottom: 0.45rem;

          .cue-robot {
            font-size: 0.78rem;
            margin-top: 1px;
          }

          .cue-text {
            font-size: 0.68rem;
            color: #cbd5e1;
            line-height: 1.3;
            font-weight: 500;
          }
        }

        .muscle-metrics {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;

          .metric-item {
            .metric-name {
              display: block;
              font-size: 0.62rem;
              color: #94a3b8;
              font-weight: 600;
              margin-bottom: 0.15rem;
            }

            .metric-bar {
              height: 3.5px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 9999px;
              overflow: hidden;

              .fill {
                height: 100%;
                border-radius: 9999px;

                &.fill-primary {
                  width: 95%;
                  background: linear-gradient(90deg, #10b981, #34d399);
                }

                &.fill-secondary {
                  width: 78%;
                  background: linear-gradient(90deg, #06b6d4, #38bdf8);
                }
              }
            }
          }
        }
      }

      .hud-bottom-controls {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: 380px;
        pointer-events: auto;
        animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);

        .pills-scroll-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }

        .pill-btn {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.34rem 0.62rem;
          border-radius: 0.55rem;
          background: rgba(18, 24, 38, 0.88);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #94a3b8;
          font-size: 0.68rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

          .btn-icon {
            font-size: 0.78rem;
          }

          &:hover {
            border-color: rgba(16, 185, 129, 0.5);
            color: #ffffff;
            transform: translateY(-2px);
            background: rgba(16, 185, 129, 0.15);
          }

          &.active {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(5, 150, 105, 0.45) 100%);
            border-color: #10b981;
            color: #ffffff;
            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
            transform: translateY(-1px);
          }
        }

        .cycle-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 0.25rem;

          .cycle-status-btn {
            background: none;
            border: none;
            padding: 0;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            font-size: 0.72rem;
            color: #64748b;
            cursor: pointer;
            user-select: none;
            transition: color 0.2s ease;

            &:hover {
              color: #10b981;
            }

            .cycle-icon {
              font-size: 0.8rem;
            }
          }

          .athlete-badge {
            font-size: 0.68rem;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 0.05em;
          }
        }
      }

      @keyframes pulseGlow {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.4;
          transform: scale(1.3);
        }
      }

      @keyframes fadeInDown {
        from {
          opacity: 0;
          transform: translateY(-14px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(14px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class ThreeBackgroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('webglCanvas', { static: true })
  private canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly ngZone = inject(NgZone);

  // 6 Distinct Exercises with AI Biomechanics Specs
  readonly exercises: ExerciseDef[] = [
    {
      id: 'curls',
      name: 'Dumbbell Bicep Curls',
      icon: '💪',
      target: 'Biceps & Forearms',
      equipment: 'dumbbells',
      aiCue: 'Elbows pinned to ribs. Full concentric peak contraction.',
      primaryMuscle: 'Biceps Brachii (100%)',
      secondaryMuscle: 'Brachioradialis (85%)',
    },
    {
      id: 'squats',
      name: 'Olympic Barbell Squats',
      icon: '🏋️',
      target: 'Quadriceps & Glutes',
      equipment: 'barbell-back',
      aiCue: 'Hip crease breaks parallel. Chest tall, neutral spine.',
      primaryMuscle: 'Quadriceps & Gluteus (100%)',
      secondaryMuscle: 'Core & Spinal Erectors (90%)',
    },
    {
      id: 'press',
      name: 'Overhead Shoulder Press',
      icon: '⚡',
      target: 'Deltoids & Shoulders',
      equipment: 'dumbbells',
      aiCue: 'Full vertical lockout overhead without lumbar extension.',
      primaryMuscle: 'Anterior & Lateral Deltoids (100%)',
      secondaryMuscle: 'Triceps & Upper Traps (80%)',
    },
    {
      id: 'deadlifts',
      name: 'Romanian Deadlifts',
      icon: '🏆',
      target: 'Hamstrings & Lower Back',
      equipment: 'barbell-hands',
      aiCue: 'Deep hip hinge back. Barbell glides tight against shins.',
      primaryMuscle: 'Hamstrings & Glutes (100%)',
      secondaryMuscle: 'Latissimus & Trapezius (88%)',
    },
    {
      id: 'lateral',
      name: 'Dumbbell Lateral Raises',
      icon: '🦅',
      target: 'Lateral Deltoids',
      equipment: 'dumbbells',
      aiCue: 'Lead with elbows. Strict 3-second negative eccentric.',
      primaryMuscle: 'Lateral Deltoids (100%)',
      secondaryMuscle: 'Upper Trapezius (65%)',
    },
    {
      id: 'swings',
      name: 'Kettlebell Power Swings',
      icon: '🔥',
      target: 'Posterior Chain & Core',
      equipment: 'kettlebell',
      aiCue: 'Explosive hip snap at apex. Arms act as loose pendulum.',
      primaryMuscle: 'Glutes & Hamstrings (100%)',
      secondaryMuscle: 'Transverse Abdominis (92%)',
    },
  ];

  readonly selectedExerciseIndex = signal<number>(0);
  readonly currentRep = signal<number>(1);
  readonly autoCycle = signal<boolean>(true);
  readonly aiFormScore = signal<number>(98);

  readonly currentExercise = computed(() => this.exercises[this.selectedExerciseIndex()]);

  // Three.js Core
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;
  private autoCycleTimer: any = null;
  private clock = new THREE.Clock();

  // 3D Scene Groups
  private mainGroup = new THREE.Group();
  private characterGroup = new THREE.Group();
  private torsoGroup = new THREE.Group();

  // Articulated Human Limbs
  private leftShoulderPivot = new THREE.Group();
  private rightShoulderPivot = new THREE.Group();
  private leftElbowPivot = new THREE.Group();
  private rightElbowPivot = new THREE.Group();
  private leftWristPivot = new THREE.Group();
  private rightWristPivot = new THREE.Group();

  private leftHipPivot = new THREE.Group();
  private rightHipPivot = new THREE.Group();
  private leftKneePivot = new THREE.Group();
  private rightKneePivot = new THREE.Group();

  // Dynamic Equipment Groups
  private dumbbellsGroup = new THREE.Group();
  private barbellTrapsGroup = new THREE.Group();
  private barbellHandsGroup = new THREE.Group();
  private kettlebellGroup = new THREE.Group();

  // Ambient effects
  private energyRing!: THREE.Mesh;
  private particlesMesh!: THREE.Points;

  // Disposables
  private disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];

  // Mouse parallax interaction
  private mouseX = 0;
  private mouseY = 0;
  private targetX = 0;
  private targetY = 0;

  ngAfterViewInit(): void {
    this.initThree();
    this.buildLighting();
    this.buildRealisticHumanAthlete();
    this.buildEquipment();
    this.buildAmbientVisuals();
    this.updateEquipmentVisibility(this.selectedExerciseIndex());
    this.startAnimationLoop();
    this.startAutoCycle();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.autoCycleTimer) {
      clearInterval(this.autoCycleTimer);
      this.autoCycleTimer = null;
    }

    this.disposables.forEach((item) => {
      if (item && typeof (item as any).dispose === 'function') {
        (item as any).dispose();
      }
    });

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
  }

  onSelectExercise(index: number): void {
    this.selectedExerciseIndex.set(index);
    this.currentRep.set(1);
    this.aiFormScore.set(Math.floor(96 + Math.random() * 3.8));
    this.updateEquipmentVisibility(index);
  }

  toggleAutoCycle(): void {
    const next = !this.autoCycle();
    this.autoCycle.set(next);
    if (next) {
      this.startAutoCycle();
    } else if (this.autoCycleTimer) {
      clearInterval(this.autoCycleTimer);
      this.autoCycleTimer = null;
    }
  }

  private startAutoCycle(): void {
    if (this.autoCycleTimer) clearInterval(this.autoCycleTimer);
    this.autoCycleTimer = setInterval(() => {
      if (this.autoCycle()) {
        const nextIdx = (this.selectedExerciseIndex() + 1) % this.exercises.length;
        this.selectedExerciseIndex.set(nextIdx);
        this.currentRep.set(1);
        this.aiFormScore.set(Math.floor(96 + Math.random() * 3.8));
        this.updateEquipmentVisibility(nextIdx);
      }
    }, 8000);
  }

  private updateEquipmentVisibility(index: number): void {
    const ex = this.exercises[index];
    this.dumbbellsGroup.visible = ex.equipment === 'dumbbells';
    this.barbellTrapsGroup.visible = ex.equipment === 'barbell-back';
    this.barbellHandsGroup.visible = ex.equipment === 'barbell-hands';
    this.kettlebellGroup.visible = ex.equipment === 'kettlebell';
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.canvasRef || !this.renderer || !this.camera) return;

    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement || canvas;
    const width = parent.clientWidth || window.innerWidth / 2;
    const height = parent.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    const halfX = window.innerWidth / 2;
    const halfY = window.innerHeight / 2;
    this.targetX = (event.clientX - halfX) * 0.0007;
    this.targetY = (event.clientY - halfY) * 0.0007;
  }

  private initThree(): void {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement || canvas;
    const width = parent.clientWidth || window.innerWidth / 2;
    const height = parent.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    this.camera.position.set(0, 1.15, 4.85);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // Scale down 3D character & equipment for optimal proportion and breathing room
    this.mainGroup.scale.set(0.75, 0.75, 0.75);
    this.mainGroup.position.set(0, -0.2, 0);
    this.scene.add(this.mainGroup);
  }

  private buildLighting(): void {
    // Ambient soft fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    // Warm Studio Key Light
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.2);
    keyLight.position.set(3, 5, 4);
    this.scene.add(keyLight);

    // Neon Emerald Gym Rim
    const emeraldRim = new THREE.DirectionalLight(0x10b981, 2.4);
    emeraldRim.position.set(-3.5, 3.5, 2.5);
    this.scene.add(emeraldRim);

    // Cool Cyan Backlight
    const cyanBack = new THREE.DirectionalLight(0x06b6d4, 1.8);
    cyanBack.position.set(0, 4, -3.5);
    this.scene.add(cyanBack);

    // Subtle Under-Floor Emerald Point Glow
    const floorGlow = new THREE.PointLight(0x10b981, 1.8, 6);
    floorGlow.position.set(0, 0.1, 0.8);
    this.scene.add(floorGlow);
  }

  /**
   * Builds an anatomically realistic 3D athletic male character ("Real Human Man")
   * with sculpted muscular anatomy, natural skin tones, hair, gym apparel, and athletic sneakers.
   */
  private buildRealisticHumanAthlete(): void {
    // Realistic Human Materials
    // 1. Natural Warm Skin Tone PBR Material
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xd49b78,
      roughness: 0.52,
      metalness: 0.06,
    });
    this.disposables.push(skinMaterial);

    // 2. Athletic Dark Charcoal / Emerald Gym Tank Material
    const tankMaterial = new THREE.MeshStandardMaterial({
      color: 0x18202c,
      roughness: 0.65,
      metalness: 0.15,
    });
    this.disposables.push(tankMaterial);

    const tankTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0x10b981, // FitPlatform Emerald Trim
      roughness: 0.4,
      metalness: 0.3,
    });
    this.disposables.push(tankTrimMaterial);

    // 3. Compression Training Shorts Material
    const shortsMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      metalness: 0.1,
    });
    this.disposables.push(shortsMaterial);

    // 4. Athletic Taper Hair Material
    const hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x221711, // Dark chestnut / espresso athletic crop
      roughness: 0.85,
      metalness: 0.05,
    });
    this.disposables.push(hairMaterial);

    // 5. Gym Gloves / Wrist Straps Material
    const gloveMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.3,
    });
    this.disposables.push(gloveMaterial);

    // 6. Athletic Sneakers Materials
    const shoeUpperMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.6,
      metalness: 0.2,
    });
    this.disposables.push(shoeUpperMaterial);

    const shoeSoleMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Crisp white trainer sole
      roughness: 0.35,
      metalness: 0.1,
    });
    this.disposables.push(shoeSoleMaterial);

    this.characterGroup = new THREE.Group();
    this.mainGroup.add(this.characterGroup);

    // ==========================================
    // 1. PELVIS & COMPRESSION GYM SHORTS
    // ==========================================
    const pelvisGeo = new THREE.CylinderGeometry(0.32, 0.29, 0.32, 16);
    this.disposables.push(pelvisGeo);
    const pelvis = new THREE.Mesh(pelvisGeo, shortsMaterial);
    pelvis.position.set(0, 1.06, 0);
    this.characterGroup.add(pelvis);

    // Emerald shorts stripe
    const shortsStripeGeo = new THREE.TorusGeometry(0.325, 0.015, 8, 24);
    this.disposables.push(shortsStripeGeo);
    const shortsStripe = new THREE.Mesh(shortsStripeGeo, tankTrimMaterial);
    shortsStripe.rotation.x = Math.PI / 2;
    shortsStripe.position.set(0, 0.12, 0);
    pelvis.add(shortsStripe);

    // ==========================================
    // 2. ATHLETIC TORSO & CHEST
    // ==========================================
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 1.22, 0);
    this.characterGroup.add(this.torsoGroup);

    // Abdominal Core & V-Taper
    const absGeo = new THREE.CylinderGeometry(0.36, 0.3, 0.42, 16);
    this.disposables.push(absGeo);
    const absMesh = new THREE.Mesh(absGeo, tankMaterial);
    absMesh.position.set(0, 0.18, 0);
    this.torsoGroup.add(absMesh);

    // Muscular Chest (Pectorals) & Broad Shoulders
    const chestGeo = new THREE.CylinderGeometry(0.44, 0.36, 0.46, 16);
    this.disposables.push(chestGeo);
    const chestMesh = new THREE.Mesh(chestGeo, tankMaterial);
    chestMesh.position.set(0, 0.58, 0);
    this.torsoGroup.add(chestMesh);

    // FitPlatform Chest Logo Emblem
    const emblemGeo = new THREE.BoxGeometry(0.18, 0.05, 0.02);
    this.disposables.push(emblemGeo);
    const emblem = new THREE.Mesh(emblemGeo, tankTrimMaterial);
    emblem.position.set(0, 0.64, 0.43);
    this.torsoGroup.add(emblem);

    // Left & Right Pectoral Sculpt Definition
    [-0.14, 0.14].forEach((x) => {
      const pecGeo = new THREE.SphereGeometry(0.16, 12, 12);
      this.disposables.push(pecGeo);
      const pec = new THREE.Mesh(pecGeo, tankMaterial);
      pec.scale.set(1.1, 0.8, 0.6);
      pec.position.set(x, 0.58, 0.28);
      this.torsoGroup.add(pec);
    });

    // ==========================================
    // 3. ANATOMICAL NECK, HEAD & FACIAL FEATURES
    // ==========================================
    // Muscular Neck
    const neckGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.22, 16);
    this.disposables.push(neckGeo);
    const neck = new THREE.Mesh(neckGeo, skinMaterial);
    neck.position.set(0, 0.9, 0);
    this.torsoGroup.add(neck);

    // Athletic Trapezius slope
    const trapGeo = new THREE.CylinderGeometry(0.24, 0.42, 0.16, 16);
    this.disposables.push(trapGeo);
    const traps = new THREE.Mesh(trapGeo, skinMaterial);
    traps.position.set(0, 0.82, -0.02);
    this.torsoGroup.add(traps);

    // Realistic Human Head Cranium
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.15, 0);
    this.torsoGroup.add(headGroup);

    const skullGeo = new THREE.SphereGeometry(0.22, 20, 20);
    this.disposables.push(skullGeo);
    const skull = new THREE.Mesh(skullGeo, skinMaterial);
    skull.scale.set(0.9, 1.05, 0.96);
    headGroup.add(skull);

    // Jawline & Chin
    const jawGeo = new THREE.BoxGeometry(0.24, 0.15, 0.22);
    this.disposables.push(jawGeo);
    const jaw = new THREE.Mesh(jawGeo, skinMaterial);
    jaw.position.set(0, -0.08, 0.06);
    headGroup.add(jaw);

    // Nose Bridge
    const noseGeo = new THREE.ConeGeometry(0.038, 0.09, 8);
    this.disposables.push(noseGeo);
    const nose = new THREE.Mesh(noseGeo, skinMaterial);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.02, 0.23);
    headGroup.add(nose);

    // Brow & Eye Sockets Definition
    const browGeo = new THREE.BoxGeometry(0.28, 0.04, 0.06);
    this.disposables.push(browGeo);
    const brow = new THREE.Mesh(browGeo, skinMaterial);
    brow.position.set(0, 0.08, 0.2);
    headGroup.add(brow);

    // Athletic Haircut (Modern Textured Taper Fade)
    const hairGeo = new THREE.SphereGeometry(0.23, 18, 18);
    this.disposables.push(hairGeo);
    const hair = new THREE.Mesh(hairGeo, hairMaterial);
    hair.scale.set(0.92, 0.95, 0.94);
    hair.position.set(0, 0.07, -0.03);
    headGroup.add(hair);

    // Front Hair Fringe / Texture
    const fringeGeo = new THREE.BoxGeometry(0.26, 0.08, 0.12);
    this.disposables.push(fringeGeo);
    const fringe = new THREE.Mesh(fringeGeo, hairMaterial);
    fringe.position.set(0, 0.18, 0.13);
    headGroup.add(fringe);

    // Athletic Headband / Sweatband (FitPlatform Neon Emerald Accent)
    const headbandGeo = new THREE.TorusGeometry(0.225, 0.022, 8, 24);
    this.disposables.push(headbandGeo);
    const headband = new THREE.Mesh(headbandGeo, tankTrimMaterial);
    headband.rotation.x = Math.PI / 2;
    headband.position.set(0, 0.1, 0);
    headGroup.add(headband);

    // Ears
    [-0.2, 0.2].forEach((x) => {
      const earGeo = new THREE.SphereGeometry(0.045, 8, 8);
      this.disposables.push(earGeo);
      const ear = new THREE.Mesh(earGeo, skinMaterial);
      ear.scale.set(0.4, 1.2, 0.7);
      ear.position.set(x, 0, 0.02);
      headGroup.add(ear);
    });

    // ==========================================
    // 4. ARTICULATED LEGS & ATHLETIC TRAINERS
    // ==========================================
    const buildLeg = (isLeft: boolean) => {
      const hipPivot = new THREE.Group();
      const xPos = isLeft ? -0.22 : 0.22;
      hipPivot.position.set(xPos, 0.98, 0);

      // Muscular Thigh (Quadriceps)
      const thighGeo = new THREE.CylinderGeometry(0.165, 0.135, 0.62, 16);
      this.disposables.push(thighGeo);
      const thigh = new THREE.Mesh(thighGeo, skinMaterial);
      thigh.position.set(0, -0.31, 0);
      hipPivot.add(thigh);

      // Upper shorts sleeve
      const shortLegGeo = new THREE.CylinderGeometry(0.18, 0.165, 0.32, 16);
      this.disposables.push(shortLegGeo);
      const shortLeg = new THREE.Mesh(shortLegGeo, shortsMaterial);
      shortLeg.position.set(0, -0.16, 0);
      hipPivot.add(shortLeg);

      // Knee Joint & Patella
      const kneePivot = new THREE.Group();
      kneePivot.position.set(0, -0.62, 0);
      hipPivot.add(kneePivot);

      const patellaGeo = new THREE.SphereGeometry(0.11, 12, 12);
      this.disposables.push(patellaGeo);
      const patella = new THREE.Mesh(patellaGeo, skinMaterial);
      patella.scale.set(1, 1.1, 1);
      kneePivot.add(patella);

      // Muscular Calf (Gastrocnemius & Tibia)
      const calfGeo = new THREE.CylinderGeometry(0.13, 0.095, 0.6, 16);
      this.disposables.push(calfGeo);
      const calf = new THREE.Mesh(calfGeo, skinMaterial);
      calf.position.set(0, -0.3, -0.01);
      kneePivot.add(calf);

      // Gym Training Sneaker
      const shoeGroup = new THREE.Group();
      shoeGroup.position.set(0, -0.62, 0.08);

      // Sneaker Upper
      const shoeUpperGeo = new THREE.BoxGeometry(0.18, 0.13, 0.38);
      this.disposables.push(shoeUpperGeo);
      const shoeUpper = new THREE.Mesh(shoeUpperGeo, shoeUpperMaterial);
      shoeUpper.position.set(0, 0.04, 0);
      shoeGroup.add(shoeUpper);

      // White Cushioned Sole
      const soleGeo = new THREE.BoxGeometry(0.19, 0.05, 0.4);
      this.disposables.push(soleGeo);
      const sole = new THREE.Mesh(soleGeo, shoeSoleMaterial);
      sole.position.set(0, -0.03, 0);
      shoeGroup.add(sole);

      // Emerald Sneaker Accent Line
      const shoeStripeGeo = new THREE.BoxGeometry(0.2, 0.02, 0.18);
      this.disposables.push(shoeStripeGeo);
      const shoeStripe = new THREE.Mesh(shoeStripeGeo, tankTrimMaterial);
      shoeStripe.position.set(0, 0.05, 0.02);
      shoeGroup.add(shoeStripe);

      kneePivot.add(shoeGroup);
      this.characterGroup.add(hipPivot);

      return { hipPivot, kneePivot };
    };

    const leftLeg = buildLeg(true);
    this.leftHipPivot = leftLeg.hipPivot;
    this.leftKneePivot = leftLeg.kneePivot;

    const rightLeg = buildLeg(false);
    this.rightHipPivot = rightLeg.hipPivot;
    this.rightKneePivot = rightLeg.kneePivot;

    // ==========================================
    // 5. ARTICULATED ARMS & LIFTING GLOVES
    // ==========================================
    const buildArm = (isLeft: boolean) => {
      const shoulderPivot = new THREE.Group();
      const xPos = isLeft ? -0.52 : 0.52;
      shoulderPivot.position.set(xPos, 0.72, 0);

      // Rounded Muscular Deltoid Cap
      const deltoidGeo = new THREE.SphereGeometry(0.165, 14, 14);
      this.disposables.push(deltoidGeo);
      const deltoid = new THREE.Mesh(deltoidGeo, skinMaterial);
      shoulderPivot.add(deltoid);

      // Upper Arm (Biceps & Triceps)
      const bicepGeo = new THREE.CylinderGeometry(0.13, 0.115, 0.54, 16);
      this.disposables.push(bicepGeo);
      const bicep = new THREE.Mesh(bicepGeo, skinMaterial);
      bicep.position.set(0, -0.27, 0);
      shoulderPivot.add(bicep);

      // Elbow Joint
      const elbowPivot = new THREE.Group();
      elbowPivot.position.set(0, -0.54, 0);
      shoulderPivot.add(elbowPivot);

      const elbowJointGeo = new THREE.SphereGeometry(0.1, 10, 10);
      this.disposables.push(elbowJointGeo);
      const elbowJoint = new THREE.Mesh(elbowJointGeo, skinMaterial);
      elbowPivot.add(elbowJoint);

      // Muscular Forearm
      const forearmGeo = new THREE.CylinderGeometry(0.115, 0.09, 0.52, 16);
      this.disposables.push(forearmGeo);
      const forearm = new THREE.Mesh(forearmGeo, skinMaterial);
      forearm.position.set(0, -0.26, 0);
      elbowPivot.add(forearm);

      // Wrist & Gym Lifting Glove
      const wristPivot = new THREE.Group();
      wristPivot.position.set(0, -0.52, 0);
      elbowPivot.add(wristPivot);

      const wristWrapGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.1, 14);
      this.disposables.push(wristWrapGeo);
      const wristWrap = new THREE.Mesh(wristWrapGeo, gloveMaterial);
      wristPivot.add(wristWrap);

      // Emerald wristband detail
      const wristStripeGeo = new THREE.TorusGeometry(0.098, 0.012, 6, 16);
      this.disposables.push(wristStripeGeo);
      const wristStripe = new THREE.Mesh(wristStripeGeo, tankTrimMaterial);
      wristStripe.rotation.x = Math.PI / 2;
      wristPivot.add(wristStripe);

      // Natural Human Hand & Grip
      const handGeo = new THREE.BoxGeometry(0.12, 0.13, 0.14);
      this.disposables.push(handGeo);
      const hand = new THREE.Mesh(handGeo, skinMaterial);
      hand.position.set(0, -0.06, 0.02);
      wristPivot.add(hand);

      this.torsoGroup.add(shoulderPivot);
      return { shoulderPivot, elbowPivot, wristPivot };
    };

    const leftArm = buildArm(true);
    this.leftShoulderPivot = leftArm.shoulderPivot;
    this.leftElbowPivot = leftArm.elbowPivot;
    this.leftWristPivot = leftArm.wristPivot;

    const rightArm = buildArm(false);
    this.rightShoulderPivot = rightArm.shoulderPivot;
    this.rightElbowPivot = rightArm.elbowPivot;
    this.rightWristPivot = rightArm.wristPivot;
  }

  /**
   * Premium Gym Equipment Models:
   * Hex Dumbbells, Olympic Barbell (for back squats & deadlifts), and Cast-Iron Kettlebell.
   */
  private buildEquipment(): void {
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.95,
      roughness: 0.15,
    });
    this.disposables.push(chromeMat);

    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.75,
    });
    this.disposables.push(plateMat);

    const neonRingMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
    });
    this.disposables.push(neonRingMat);

    // ==========================================
    // A. DUMBBELLS (Attached to hands)
    // ==========================================
    this.dumbbellsGroup = new THREE.Group();

    const buildDumbbell = () => {
      const db = new THREE.Group();
      const gripGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.52, 12);
      this.disposables.push(gripGeo);
      const grip = new THREE.Mesh(gripGeo, chromeMat);
      grip.rotation.z = Math.PI / 2;
      db.add(grip);

      const hexPlateGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.12, 6);
      this.disposables.push(hexPlateGeo);
      const ringGeo = new THREE.TorusGeometry(0.19, 0.015, 8, 16);
      this.disposables.push(ringGeo);

      [-0.2, 0.2].forEach((pos) => {
        const plate = new THREE.Mesh(hexPlateGeo, plateMat);
        plate.rotation.z = Math.PI / 2;
        plate.position.set(pos, 0, 0);

        const ring = new THREE.Mesh(ringGeo, neonRingMat);
        ring.rotation.y = Math.PI / 2;
        plate.add(ring);

        db.add(plate);
      });

      return db;
    };

    const leftDB = buildDumbbell();
    leftDB.position.set(0, -0.06, 0.04);
    this.leftWristPivot.add(leftDB);

    const rightDB = buildDumbbell();
    rightDB.position.set(0, -0.06, 0.04);
    this.rightWristPivot.add(rightDB);

    this.dumbbellsGroup.add(leftDB, rightDB);

    // ==========================================
    // B. OLYMPIC BARBELL ON TRAPS (For Back Squats)
    // ==========================================
    this.barbellTrapsGroup = new THREE.Group();
    this.barbellTrapsGroup.position.set(0, 0.86, -0.06);

    const barGeo = new THREE.CylinderGeometry(0.032, 0.032, 2.6, 16);
    this.disposables.push(barGeo);
    const barMesh = new THREE.Mesh(barGeo, chromeMat);
    barMesh.rotation.z = Math.PI / 2;
    this.barbellTrapsGroup.add(barMesh);

    // Heavy Olympic 45lb Bumper Plates
    const bumperPlateGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.14, 24);
    this.disposables.push(bumperPlateGeo);
    const bumperRingGeo = new THREE.TorusGeometry(0.38, 0.02, 8, 24);
    this.disposables.push(bumperRingGeo);

    [-1.05, 1.05].forEach((xPos) => {
      const plate = new THREE.Mesh(bumperPlateGeo, plateMat);
      plate.rotation.z = Math.PI / 2;
      plate.position.set(xPos, 0, 0);

      const ring = new THREE.Mesh(bumperRingGeo, neonRingMat);
      ring.rotation.y = Math.PI / 2;
      plate.add(ring);

      this.barbellTrapsGroup.add(plate);
    });

    this.torsoGroup.add(this.barbellTrapsGroup);

    // ==========================================
    // C. OLYMPIC BARBELL IN HANDS (For Deadlifts)
    // ==========================================
    this.barbellHandsGroup = new THREE.Group();
    const barHandsMesh = new THREE.Mesh(barGeo, chromeMat);
    barHandsMesh.rotation.z = Math.PI / 2;
    this.barbellHandsGroup.add(barHandsMesh);

    [-1.05, 1.05].forEach((xPos) => {
      const plate = new THREE.Mesh(bumperPlateGeo, plateMat);
      plate.rotation.z = Math.PI / 2;
      plate.position.set(xPos, 0, 0);

      const ring = new THREE.Mesh(bumperRingGeo, neonRingMat);
      ring.rotation.y = Math.PI / 2;
      plate.add(ring);

      this.barbellHandsGroup.add(plate);
    });

    this.characterGroup.add(this.barbellHandsGroup);

    // ==========================================
    // D. CAST-IRON KETTLEBELL (For Swings)
    // ==========================================
    this.kettlebellGroup = new THREE.Group();

    const kbBallGeo = new THREE.SphereGeometry(0.24, 16, 16);
    this.disposables.push(kbBallGeo);
    const kbBall = new THREE.Mesh(kbBallGeo, plateMat);
    this.kettlebellGroup.add(kbBall);

    const kbHandleGeo = new THREE.TorusGeometry(0.15, 0.032, 8, 16, Math.PI);
    this.disposables.push(kbHandleGeo);
    const kbHandle = new THREE.Mesh(kbHandleGeo, chromeMat);
    kbHandle.position.set(0, 0.22, 0);
    this.kettlebellGroup.add(kbHandle);

    const kbRingGeo = new THREE.TorusGeometry(0.24, 0.015, 8, 24);
    this.disposables.push(kbRingGeo);
    const kbRing = new THREE.Mesh(kbRingGeo, neonRingMat);
    this.kettlebellGroup.add(kbRing);

    this.characterGroup.add(this.kettlebellGroup);
  }

  private buildAmbientVisuals(): void {
    // 1. Neon Floor Ring
    const ringGeo = new THREE.RingGeometry(1.4, 1.62, 48);
    this.disposables.push(ringGeo);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    this.disposables.push(ringMat);

    this.energyRing = new THREE.Mesh(ringGeo, ringMat);
    this.energyRing.rotation.x = Math.PI / 2;
    this.energyRing.position.set(0, -0.05, 0);
    this.mainGroup.add(this.energyRing);

    // 2. Ambient Cyber Particles
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 6.5;
      particlePositions[i + 1] = Math.random() * 4.5;
      particlePositions[i + 2] = (Math.random() - 0.5) * 4.5;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    this.disposables.push(particleGeo);

    const particleMat = new THREE.PointsMaterial({
      color: 0x34d399,
      size: 0.038,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    this.disposables.push(particleMat);

    this.particlesMesh = new THREE.Points(particleGeo, particleMat);
    this.scene.add(this.particlesMesh);
  }

  private startAnimationLoop(): void {
    this.ngZone.runOutsideAngular(() => {
      let lastRepCycle = 0;

      const animate = () => {
        this.animationFrameId = requestAnimationFrame(animate);

        const time = this.clock.getElapsedTime();
        const currentIdx = this.selectedExerciseIndex();
        const exId = this.exercises[currentIdx].id;

        // Exercise cycle pacing
        const cycleSpeed = exId === 'swings' ? 2.8 : exId === 'lateral' ? 1.9 : 2.2;
        const cycleTime = time * cycleSpeed;
        const sinVal = Math.sin(cycleTime);
        const progress = (sinVal + 1) / 2; // Normalized 0 to 1

        // Rep counter trigger on completion of concentric phase
        if (sinVal > 0.95 && lastRepCycle <= 0.95) {
          this.ngZone.run(() => {
            const nextRep = (this.currentRep() % 12) + 1;
            this.currentRep.set(nextRep);
            this.aiFormScore.set(Math.floor(96 + Math.random() * 3.8));
          });
        }
        lastRepCycle = sinVal;

        // Reset base transforms
        this.characterGroup.position.y = 0;
        this.torsoGroup.position.set(0, 1.22, 0);
        this.torsoGroup.rotation.set(0, 0, 0);
        this.leftHipPivot.rotation.set(0, 0, 0);
        this.rightHipPivot.rotation.set(0, 0, 0);
        this.leftKneePivot.rotation.set(0, 0, 0);
        this.rightKneePivot.rotation.set(0, 0, 0);
        this.leftWristPivot.rotation.set(0, 0, 0);
        this.rightWristPivot.rotation.set(0, 0, 0);
        this.kettlebellGroup.visible = false;
        this.barbellHandsGroup.visible = false;

        // =========================================================================
        // REALISTIC BIOMECHANICAL KINEMATICS ENGINE
        // =========================================================================
        switch (exId) {
          case 'curls': {
            // 1. DUMBBELL BICEP CURLS (Alternating Natural Flexion)
            const leftCurl = (Math.sin(time * 2.4) + 1) / 2;
            const rightCurl = (Math.sin(time * 2.4 + Math.PI * 0.85) + 1) / 2;

            this.leftElbowPivot.rotation.x = -leftCurl * 2.15;
            this.leftShoulderPivot.rotation.x = 0.12 + leftCurl * 0.12;
            this.leftShoulderPivot.rotation.z = -0.12;

            this.rightElbowPivot.rotation.x = -rightCurl * 2.15;
            this.rightShoulderPivot.rotation.x = 0.12 + rightCurl * 0.12;
            this.rightShoulderPivot.rotation.z = 0.12;

            this.torsoGroup.position.y = 1.22 + Math.sin(time * 2.4) * 0.025;
            break;
          }

          case 'squats': {
            // 2. OLYMPIC BARBELL BACK SQUATS (Deep Parallel Squat)
            const squatDepth = progress * 0.65;
            this.characterGroup.position.y = -squatDepth;

            const thighAngle = progress * 1.35;
            this.leftHipPivot.rotation.x = -thighAngle;
            this.rightHipPivot.rotation.x = -thighAngle;

            const kneeAngle = progress * 2.1;
            this.leftKneePivot.rotation.x = kneeAngle;
            this.rightKneePivot.rotation.x = kneeAngle;

            // Torso angles forward naturally for biomechanical balance
            this.torsoGroup.rotation.x = progress * 0.35;

            // Grip barbell on upper traps
            this.leftShoulderPivot.rotation.set(0.2, 0.4, -1.1);
            this.leftElbowPivot.rotation.set(-1.8, 0, 0);

            this.rightShoulderPivot.rotation.set(0.2, -0.4, 1.1);
            this.rightElbowPivot.rotation.set(-1.8, 0, 0);
            break;
          }

          case 'press': {
            // 3. OVERHEAD SHOULDER PRESS (Vertical Lockout)
            const pressProgress = progress;

            this.leftShoulderPivot.rotation.z = -1.15 + pressProgress * 0.9;
            this.leftShoulderPivot.rotation.x = -0.1 + pressProgress * 0.45;
            this.leftElbowPivot.rotation.x = -1.75 + pressProgress * 1.55;

            this.rightShoulderPivot.rotation.z = 1.15 - pressProgress * 0.9;
            this.rightShoulderPivot.rotation.x = -0.1 + pressProgress * 0.45;
            this.rightElbowPivot.rotation.x = -1.75 + pressProgress * 1.55;

            this.torsoGroup.rotation.x = -0.05 + pressProgress * 0.08;
            break;
          }

          case 'deadlifts': {
            // 4. ROMANIAN DEADLIFTS (Barbell Hip Hinge)
            this.barbellHandsGroup.visible = true;

            // progress = 1 (bottom of hinge), progress = 0 (tall lockout)
            const hingeAngle = progress * 0.85; // ~48 degrees torso forward tilt
            this.torsoGroup.rotation.x = hingeAngle;

            // Hip hinge back
            this.leftHipPivot.rotation.x = -progress * 0.4;
            this.rightHipPivot.rotation.x = -progress * 0.4;

            // Soft 20° knee bend
            this.leftKneePivot.rotation.x = progress * 0.35;
            this.rightKneePivot.rotation.x = progress * 0.35;

            // Arms hang straight down holding the barbell
            this.leftShoulderPivot.rotation.set(-hingeAngle + 0.1, 0, -0.15);
            this.leftElbowPivot.rotation.set(0, 0, 0);

            this.rightShoulderPivot.rotation.set(-hingeAngle + 0.1, 0, 0.15);
            this.rightElbowPivot.rotation.set(0, 0, 0);

            // Barbell follows hands down along shins
            const barY = 0.95 - progress * 0.55;
            const barZ = 0.28 + progress * 0.18;
            this.barbellHandsGroup.position.set(0, barY, barZ);
            break;
          }

          case 'lateral': {
            // 5. DUMBBELL LATERAL RAISES (Shoulder Abduction)
            const raiseProg = progress; // 0 to 1

            // Shoulders abduct up to 90 degrees (Math.PI / 2)
            const abductAngle = raiseProg * 1.5;
            this.leftShoulderPivot.rotation.set(0, 0, -abductAngle);
            this.leftElbowPivot.rotation.set(-0.15, 0, 0);

            this.rightShoulderPivot.rotation.set(0, 0, abductAngle);
            this.rightElbowPivot.rotation.set(-0.15, 0, 0);

            this.torsoGroup.rotation.x = -0.04;
            break;
          }

          case 'swings': {
            // 6. KETTLEBELL POWER SWINGS (Dynamic Posterior Chain)
            this.kettlebellGroup.visible = true;

            const swingCycle = Math.sin(time * 2.8);
            const swingProg = (swingCycle + 1) / 2;

            this.leftHipPivot.rotation.x = (1 - swingProg) * 0.45;
            this.rightHipPivot.rotation.x = (1 - swingProg) * 0.45;
            this.leftKneePivot.rotation.x = (1 - swingProg) * 0.65;
            this.rightKneePivot.rotation.x = (1 - swingProg) * 0.65;

            this.torsoGroup.rotation.x = (1 - swingProg) * 0.65;

            const armAngle = -0.3 + swingProg * 1.65;
            this.leftShoulderPivot.rotation.set(armAngle, 0, -0.2);
            this.leftElbowPivot.rotation.set(-0.15, 0, 0);

            this.rightShoulderPivot.rotation.set(armAngle, 0, 0.2);
            this.rightElbowPivot.rotation.set(-0.15, 0, 0);

            const kbAngle = -0.4 + swingProg * 1.8;
            const kbRadius = 0.95;
            this.kettlebellGroup.position.set(
              0,
              1.15 - Math.cos(kbAngle) * kbRadius,
              Math.sin(kbAngle) * kbRadius
            );
            this.kettlebellGroup.rotation.x = kbAngle;
            break;
          }
        }

        // Slow aesthetic camera angle orbit
        this.mainGroup.rotation.y = 0.22 + Math.sin(time * 0.45) * 0.2;

        if (this.energyRing) {
          this.energyRing.rotation.z = time * 0.45;
        }

        if (this.particlesMesh) {
          this.particlesMesh.rotation.y = time * 0.04;
        }

        // Smooth Mouse Parallax
        this.mouseX += (this.targetX - this.mouseX) * 0.05;
        this.mouseY += (this.targetY - this.mouseY) * 0.05;

        this.camera.position.x = this.mouseX * 8;
        this.camera.position.y = 1.15 - this.mouseY * 5;
        this.camera.lookAt(0, 0.72, 0);

        this.renderer.render(this.scene, this.camera);
      };

      animate();
    });
  }
}
