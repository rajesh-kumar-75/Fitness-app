import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TrainerService } from '../../core/services/trainer.service';
import { TrainerClient, TrainerProfile } from '../../core/models/trainer.model';

@Component({
  selector: 'app-trainer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './trainer-dashboard.component.html',
  styleUrl: './trainer-dashboard.component.scss',
})
export class TrainerDashboardComponent implements OnInit {
  private readonly trainerService = inject(TrainerService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly activeTab = signal<'clients' | 'requests' | 'profile'>('clients');
  readonly isLoading = signal<boolean>(true);
  readonly isSavingProfile = signal<boolean>(false);
  readonly successMessage = signal<string>('');
  readonly errorMessage = signal<string>('');

  readonly activeStreak = '42 DAYS';
  readonly nextGoal = 'Bench 100kg - 85% Completed';

  // Roster
  readonly activeClients = signal<TrainerClient[]>([]);
  readonly pendingRequests = signal<TrainerClient[]>([]);
  readonly activeCount = signal<number>(0);
  readonly pendingCount = signal<number>(0);

  // Profile
  profileForm!: FormGroup;

  ngOnInit(): void {
    this.initProfileForm();
    this.loadRoster();
    this.loadProfile();
  }

  private initProfileForm(): void {
    this.profileForm = this.fb.group({
      specialties: ['Hypertrophy, Strength Training, Fat Loss', Validators.required],
      certifications: ['NASM Certified Personal Trainer', Validators.required],
      yearsOfExperience: [3, [Validators.required, Validators.min(0), Validators.max(50)]],
      bio: ['', [Validators.required, Validators.minLength(10)]],
      isAcceptingClients: [true],
    });
  }

  loadRoster(): void {
    this.isLoading.set(true);
    this.trainerService.getClients().subscribe({
      next: (res) => {
        this.activeClients.set(res.data.activeClients || []);
        this.pendingRequests.set(res.data.pendingRequests || []);
        this.activeCount.set(res.data.activeCount || 0);
        this.pendingCount.set(res.data.pendingCount || 0);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  loadProfile(): void {
    this.trainerService.getTrainerProfile().subscribe({
      next: (res) => {
        const tp = res.data.user?.trainerProfile;
        if (tp) {
          this.profileForm.patchValue({
            specialties: Array.isArray(tp.specialties) ? tp.specialties.join(', ') : tp.specialties,
            certifications: Array.isArray(tp.certifications) ? tp.certifications.join(', ') : tp.certifications,
            yearsOfExperience: tp.yearsOfExperience || 3,
            bio: tp.bio || '',
            isAcceptingClients: tp.isAcceptingClients ?? true,
          });
        }
      },
    });
  }

  respondToRequest(clientId: string, action: 'accept' | 'reject'): void {
    this.trainerService.respondToConnectionRequest(clientId, action).subscribe({
      next: () => {
        this.loadRoster();
      },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSavingProfile.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const val = this.profileForm.value;
    const specialtiesArray = typeof val.specialties === 'string'
      ? val.specialties.split(',').map((s: string) => s.trim()).filter(Boolean)
      : val.specialties;
    const certsArray = typeof val.certifications === 'string'
      ? val.certifications.split(',').map((c: string) => c.trim()).filter(Boolean)
      : val.certifications;

    this.trainerService
      .updateTrainerProfile({
        specialties: specialtiesArray,
        certifications: certsArray,
        yearsOfExperience: Number(val.yearsOfExperience),
        bio: val.bio,
        isAcceptingClients: Boolean(val.isAcceptingClients),
      })
      .subscribe({
        next: () => {
          this.isSavingProfile.set(false);
          this.successMessage.set('Trainer profile updated successfully!');
          setTimeout(() => this.successMessage.set(''), 3000);
        },
        error: (err) => {
          this.isSavingProfile.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to update profile');
        },
      });
  }

  viewClient(clientId: string): void {
    this.router.navigate(['/trainer/clients', clientId]);
  }
}
