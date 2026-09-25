import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ExerciseService } from '../../core/services/exercise.service';
import { AuthService } from '../../core/services/auth.service';
import { ImageService } from '../../core/services/image.service';
import {
  Exercise,
  MuscleGroup,
  Difficulty,
  CreateExercisePayload,
} from '../../core/models/exercise.model';

@Component({
  selector: 'app-exercise-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './exercise-list.component.html',
  styleUrl: './exercise-list.component.scss',
})
export class ExerciseListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly exerciseService = inject(ExerciseService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly authService = inject(AuthService);
  readonly imageService = inject(ImageService);

  readonly exercises = signal<Exercise[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Selected Exercise State Management (per requirement: selectedExercise: Exercise | null = null)
  selectedExercise: Exercise | null = null;
  readonly selectedExerciseSignal = signal<Exercise | null>(null);

  // Dynamic Video & Motion Player State
  sanitizedVideoEmbedUrl: SafeResourceUrl | null = null;
  directVideoUrl: string | null = null;
  motionMediaUrl: string | null = null;
  isYouTubeVideo: boolean = false;
  isVideoDirectFile: boolean = false;
  activeMediaTab: 'video' | 'motion' = 'video';
  isVideoMuted: boolean = true;
  isVideoPlaying: boolean = true;

  // Modals state
  readonly isFormModalOpen = signal<boolean>(false);
  readonly editingExerciseId = signal<string | null>(null);
  readonly isSaving = signal<boolean>(false);

  readonly isAdmin = this.authService.isAdmin;
  readonly user = this.authService.currentUser;
  readonly activeStreak = '42 DAYS';
  readonly nextGoal = 'Bench 100kg - 85% Completed';

  readonly muscleGroups: (MuscleGroup | 'All')[] = [
    'All',
    'Chest',
    'Back',
    'Shoulders',
    'Biceps',
    'Triceps',
    'Legs',
    'Glutes',
    'Core',
    'Cardio',
    'Yoga',
  ];

  readonly difficulties: (Difficulty | 'All')[] = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  // Search and Filter Controls
  readonly searchControl = new FormControl<string>('');
  readonly selectedMuscleGroup = signal<string>('All');
  readonly selectedDifficulty = new FormControl<string>('All');

  // Admin Exercise Create/Edit Form
  readonly exerciseForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    muscleGroup: ['Chest' as MuscleGroup, [Validators.required]],
    equipment: ['Barbell', [Validators.required, Validators.maxLength(50)]],
    difficulty: ['Beginner' as Difficulty, [Validators.required]],
    instructions: ['', [Validators.required]],
    image: [''],
    imageUrl: [''],
    thumbnailUrl: [''],
    altText: [''],
    video: [''],
    videoUrl: [''],
    motionUrl: [''],
  });

  ngOnInit(): void {
    this.loadExercises();

    // Listen to search changes
    this.searchControl.valueChanges.subscribe(() => {
      this.loadExercises();
    });

    // Listen to difficulty changes
    this.selectedDifficulty.valueChanges.subscribe(() => {
      this.loadExercises();
    });
  }

  loadExercises(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filters = {
      search: this.searchControl.value || '',
      muscleGroup: this.selectedMuscleGroup(),
      difficulty: this.selectedDifficulty.value || 'All',
    };

    this.exerciseService.getExercises(filters).subscribe({
      next: (res) => {
        this.exercises.set(res.data.exercises);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Failed to load exercises.');
      },
    });
  }

  onSelectMuscleGroup(group: string): void {
    this.selectedMuscleGroup.set(group);
    this.loadExercises();
  }

  openDetailModal(exercise: Exercise): void {
    this.selectedExercise = exercise;
    this.selectedExerciseSignal.set(exercise);
    this.prepareMediaForExercise(exercise);
  }

  selectExercise(exercise: Exercise): void {
    this.openDetailModal(exercise);
  }

  closeDetailModal(): void {
    this.selectedExercise = null;
    this.selectedExerciseSignal.set(null);
    this.sanitizedVideoEmbedUrl = null;
    this.directVideoUrl = null;
    this.motionMediaUrl = null;
    this.isYouTubeVideo = false;
    this.isVideoDirectFile = false;
  }

  backToList(): void {
    this.closeDetailModal();
  }

  setActiveMediaTab(tab: 'video' | 'motion'): void {
    this.activeMediaTab = tab;
  }

  toggleVideoPlay(videoEl: HTMLVideoElement): void {
    if (!videoEl) return;
    if (videoEl.paused) {
      videoEl.play();
      this.isVideoPlaying = true;
    } else {
      videoEl.pause();
      this.isVideoPlaying = false;
    }
  }

  toggleVideoMute(videoEl: HTMLVideoElement): void {
    if (!videoEl) return;
    videoEl.muted = !videoEl.muted;
    this.isVideoMuted = videoEl.muted;
  }

  private isDirectVideoUrl(url: string | undefined): boolean {
    if (!url) return false;
    const clean = url.trim().toLowerCase();
    return (
      clean.endsWith('.mp4') ||
      clean.endsWith('.webm') ||
      clean.endsWith('.ogg') ||
      clean.includes('.mp4?') ||
      clean.includes('.webm?')
    );
  }

  private extractYouTubeId(url: string | undefined): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = trimmed.match(regExp);
    return match && match[1] ? match[1] : null;
  }

  private prepareMediaForExercise(exercise: Exercise): void {
    const rawVideo = (exercise.videoUrl || exercise.video || '').trim();
    const rawMotion = (exercise.motionUrl || '').trim();

    this.sanitizedVideoEmbedUrl = null;
    this.directVideoUrl = null;
    this.motionMediaUrl = null;
    this.isYouTubeVideo = false;
    this.isVideoDirectFile = false;
    this.isVideoMuted = true;
    this.isVideoPlaying = true;

    // 1. Direct Video file check
    if (this.isDirectVideoUrl(rawVideo)) {
      this.directVideoUrl = rawVideo;
      this.isVideoDirectFile = true;
      this.activeMediaTab = 'video';
    } else if (rawVideo) {
      // 2. YouTube check
      const ytId = this.extractYouTubeId(rawVideo);
      if (ytId) {
        this.isYouTubeVideo = true;
        const embedUrl = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=1&modestbranding=1&rel=0`;
        this.sanitizedVideoEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
        this.activeMediaTab = 'video';
      } else if (rawVideo.startsWith('http')) {
        this.sanitizedVideoEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawVideo);
        this.isYouTubeVideo = true;
        this.activeMediaTab = 'video';
      }
    }

    // 3. Motion Media URL
    if (rawMotion) {
      this.motionMediaUrl = rawMotion;
    } else {
      // Fallback high-res demonstration
      this.motionMediaUrl = exercise.imageUrl || exercise.image || this.imageService.getExerciseImage(exercise, 'full');
    }

    // If no video was found but motion is available, switch default tab to motion
    if (!this.isVideoDirectFile && !this.isYouTubeVideo && this.motionMediaUrl) {
      this.activeMediaTab = 'motion';
    }
  }

  openCreateModal(): void {
    this.editingExerciseId.set(null);
    this.exerciseForm.reset({
      name: '',
      description: '',
      muscleGroup: 'Chest',
      equipment: 'Barbell',
      difficulty: 'Beginner',
      instructions: '',
      image: '',
      imageUrl: '',
      thumbnailUrl: '',
      altText: '',
      video: '',
      videoUrl: '',
      motionUrl: '',
    });
    this.isFormModalOpen.set(true);
  }

  openEditModal(exercise: Exercise, event: Event): void {
    event.stopPropagation();
    this.editingExerciseId.set(exercise._id);
    this.exerciseForm.patchValue({
      name: exercise.name,
      description: exercise.description,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      difficulty: exercise.difficulty,
      instructions: exercise.instructions.join('\n'),
      image: exercise.image || exercise.imageUrl || '',
      imageUrl: exercise.imageUrl || exercise.image || '',
      thumbnailUrl: exercise.thumbnailUrl || '',
      altText: exercise.altText || '',
      video: exercise.video || exercise.videoUrl || '',
      videoUrl: exercise.videoUrl || exercise.video || '',
      motionUrl: exercise.motionUrl || '',
    });
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.editingExerciseId.set(null);
  }

  onSaveExercise(): void {
    if (this.exerciseForm.invalid) {
      this.exerciseForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formVals = this.exerciseForm.value;

    const payload: CreateExercisePayload = {
      name: formVals.name!,
      description: formVals.description!,
      muscleGroup: formVals.muscleGroup as MuscleGroup,
      equipment: formVals.equipment!,
      difficulty: formVals.difficulty as Difficulty,
      instructions: formVals.instructions!,
      image: formVals.imageUrl || formVals.image || '',
      imageUrl: formVals.imageUrl || formVals.image || '',
      thumbnailUrl: formVals.thumbnailUrl || '',
      altText: formVals.altText || `${formVals.name} exercise demonstration`,
      video: formVals.videoUrl || formVals.video || '',
      videoUrl: formVals.videoUrl || formVals.video || '',
      motionUrl: formVals.motionUrl || '',
    };

    const id = this.editingExerciseId();
    if (id) {
      // Update
      this.exerciseService.updateExercise(id, payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeFormModal();
          this.showSuccess('Exercise updated successfully!');
          this.loadExercises();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err.message || 'Failed to update exercise.');
        },
      });
    } else {
      // Create
      this.exerciseService.createExercise(payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeFormModal();
          this.showSuccess('Exercise created successfully!');
          this.loadExercises();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err.message || 'Failed to create exercise.');
        },
      });
    }
  }

  onDeleteExercise(exercise: Exercise, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Are you sure you want to delete '${exercise.name}'?`)) {
      return;
    }

    this.exerciseService.deleteExercise(exercise._id).subscribe({
      next: () => {
        this.showSuccess(`Exercise '${exercise.name}' deleted.`);
        this.loadExercises();
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Failed to delete exercise.');
      },
    });
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 3500);
  }
}
