import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { TrainerService } from '../../core/services/trainer.service';
import { TrainerPublicInfo, TrainerClient } from '../../core/models/trainer.model';

@Component({
  selector: 'app-trainer-directory',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './trainer-directory.component.html',
  styleUrl: './trainer-directory.component.scss',
})
export class TrainerDirectoryComponent implements OnInit {
  private readonly trainerService = inject(TrainerService);
  private readonly fb = inject(FormBuilder);

  readonly trainers = signal<TrainerPublicInfo[]>([]);
  readonly activeStreak = '42 DAYS';
  readonly nextGoal = 'Bench 100kg - 85% Completed';
  readonly myConnection = signal<TrainerClient | null>(null);
  readonly hasTrainer = signal<boolean>(false);
  readonly isLoading = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  readonly successMessage = signal<string>('');
  readonly errorMessage = signal<string>('');

  // Connect Modal
  readonly isConnectModalOpen = signal<boolean>(false);
  readonly selectedTrainer = signal<TrainerPublicInfo | null>(null);
  connectForm!: FormGroup;

  ngOnInit(): void {
    this.connectForm = this.fb.group({
      message: [''],
    });
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    // 1. Get current user's trainer connection status (safe fallback if user has no trainer yet)
    this.trainerService.getMyTrainer().subscribe({
      next: (res) => {
        this.myConnection.set(res?.data?.connection || null);
        this.hasTrainer.set(res?.data?.hasTrainer || false);
      },
      error: () => {
        this.myConnection.set(null);
        this.hasTrainer.set(false);
      },
    });

    // 2. Load public trainers list
    this.trainerService.getPublicTrainers().subscribe({
      next: (res) => {
        this.trainers.set(res?.data?.trainers || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Failed to load trainers');
        this.isLoading.set(false);
      },
    });
  }

  openConnectModal(trainer: TrainerPublicInfo): void {
    this.selectedTrainer.set(trainer);
    this.connectForm.reset({
      message: `Hi ${trainer.name}, I would love your guidance to help me achieve my fitness goals!`,
    });
    this.isConnectModalOpen.set(true);
  }

  closeConnectModal(): void {
    this.isConnectModalOpen.set(false);
    this.selectedTrainer.set(null);
  }

  submitConnectRequest(): void {
    const trainer = this.selectedTrainer();
    if (!trainer) return;

    this.isSubmitting.set(true);
    const message = this.connectForm.value.message;

    this.trainerService.connectWithTrainer(trainer._id, message).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.closeConnectModal();
        this.successMessage.set(
          `Connection request sent to ${trainer.name}! They will review your inquiry shortly.`
        );
        this.loadData();
        setTimeout(() => this.successMessage.set(''), 4000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to send connection request');
        setTimeout(() => this.errorMessage.set(''), 4000);
      },
    });
  }
}
