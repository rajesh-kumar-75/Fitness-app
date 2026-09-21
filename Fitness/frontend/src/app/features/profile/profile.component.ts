import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserProfileService } from '../../core/services/user-profile.service';
import {
  UserProfile,
  ProfileMetrics,
  FitnessGoal,
  ActivityLevel,
  Gender,
} from '../../core/models/user-profile.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(UserProfileService);

  readonly isLoading = signal<boolean>(true);
  readonly isSaving = signal<boolean>(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly profile = signal<UserProfile | null>(null);
  readonly metrics = signal<ProfileMetrics | null>(null);

  readonly activeStreak = '42 DAYS';
  readonly nextGoal = 'Bench 100kg - 85% Completed';

  readonly fitnessGoals: FitnessGoal[] = [
    'Muscle Gain',
    'Weight Loss',
    'Strength',
    'Endurance',
    'General Fitness',
  ];

  readonly activityLevels: { value: ActivityLevel; label: string; desc: string }[] = [
    { value: 'Sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
    { value: 'Lightly Active', label: 'Lightly Active', desc: 'Exercise 1-3 times/week' },
    { value: 'Moderately Active', label: 'Moderately Active', desc: 'Exercise 4-5 times/week' },
    { value: 'Very Active', label: 'Very Active', desc: 'Daily intense exercise' },
    { value: 'Extremely Active', label: 'Extremely Active', desc: 'Professional athlete training' },
  ];

  readonly genderOptions: Gender[] = [
    'Male',
    'Female',
    'Non-Binary',
    'Other',
    'Prefer not to say',
  ];

  readonly avatarPresets: string[] = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  ];

  readonly profileForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    profileImage: [''],
    age: [null as number | null, [Validators.min(10), Validators.max(120)]],
    gender: ['Prefer not to say' as Gender, [Validators.required]],
    height: [null as number | null, [Validators.min(50), Validators.max(300)]],
    weight: [null as number | null, [Validators.min(20), Validators.max(500)]],
    fitnessGoal: ['General Fitness' as FitnessGoal, [Validators.required]],
    activityLevel: ['Moderately Active' as ActivityLevel, [Validators.required]],
  });

  // Real-time BMI calculation based on form values
  readonly liveBmi = signal<number | null>(null);
  readonly liveBmiCategory = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProfile();

    // Listen to height and weight changes for live BMI calculation
    this.profileForm.valueChanges.subscribe((vals) => {
      this.calculateLiveBmi(vals.weight, vals.height);
    });
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.profileService.getProfile().subscribe({
      next: (response) => {
        const user = response.data.user;
        this.profile.set(user);
        this.metrics.set(response.data.metrics);

        this.profileForm.patchValue({
          name: user.name,
          profileImage: user.profileImage || '',
          age: user.age ?? null,
          gender: user.gender || 'Prefer not to say',
          height: user.height ?? null,
          weight: user.weight ?? null,
          fitnessGoal: user.fitnessGoal || 'General Fitness',
          activityLevel: user.activityLevel || 'Moderately Active',
        });

        this.calculateLiveBmi(user.weight, user.height);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Failed to load user profile.');
      },
    });
  }

  selectAvatarPreset(url: string): void {
    this.profileForm.patchValue({ profileImage: url });
    this.profileForm.markAsDirty();
  }

  private calculateLiveBmi(weight: number | null | undefined, height: number | null | undefined): void {
    if (!weight || !height || height <= 0 || weight <= 0) {
      this.liveBmi.set(null);
      this.liveBmiCategory.set(null);
      return;
    }

    const heightInMeters = height / 100;
    const bmiVal = Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
    this.liveBmi.set(bmiVal);

    if (bmiVal < 18.5) {
      this.liveBmiCategory.set('Underweight');
    } else if (bmiVal < 25) {
      this.liveBmiCategory.set('Normal weight');
    } else if (bmiVal < 30) {
      this.liveBmiCategory.set('Overweight');
    } else {
      this.liveBmiCategory.set('Obese');
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const formValues = this.profileForm.value;

    this.profileService.updateProfile({
      name: formValues.name!,
      profileImage: formValues.profileImage || '',
      age: formValues.age ?? null,
      gender: formValues.gender as Gender,
      height: formValues.height ?? null,
      weight: formValues.weight ?? null,
      fitnessGoal: formValues.fitnessGoal as FitnessGoal,
      activityLevel: formValues.activityLevel as ActivityLevel,
    }).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.profile.set(res.data.user);
        this.metrics.set(res.data.metrics);
        this.successMessage.set('Profile updated successfully!');
        this.profileForm.markAsPristine();

        // Auto-dismiss success alert after 4s
        setTimeout(() => this.successMessage.set(null), 4000);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.message || 'Failed to update profile.');
      },
    });
  }
}
