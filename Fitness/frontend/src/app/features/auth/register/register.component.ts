import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/auth.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentStep = signal<1 | 2 | 3 | 4>(1);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal<boolean>(false);

  // Selected fitness goals
  readonly selectedGoals = signal<string[]>([
    'Build Muscle',
    'Increase Strength',
    'Athletic Performance',
  ]);

  // Dynamic password strength state
  readonly strengthPercent = signal<number>(15);
  readonly strengthLabel = signal<string>('Unrated');
  readonly strengthColor = signal<string>('text-red-400');
  readonly hasLength = signal<boolean>(false);
  readonly hasNumber = signal<boolean>(false);
  readonly hasUpper = signal<boolean>(false);
  readonly hasSpecial = signal<boolean>(false);

  readonly registerForm = this.fb.group({
    name: ['Alex Vance', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['alex.vance@fitplatform.com', [Validators.required, Validators.email]],
    password: ['BioKinetic99!', [Validators.required, Validators.minLength(6)]],
    role: ['USER' as UserRole, [Validators.required]],
    termsAccepted: [true, [Validators.requiredTrue]],
    aiConsent: [true],
  });

  constructor() {
    this.evaluatePasswordStrength(this.registerForm.get('password')?.value || '');
  }

  get name() {
    return this.registerForm.get('name');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get role() {
    return this.registerForm.get('role');
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  goToStep(step: 1 | 2 | 3): void {
    if (step === 2 && (this.name?.invalid || this.email?.invalid || this.password?.invalid)) {
      this.name?.markAsTouched();
      this.email?.markAsTouched();
      this.password?.markAsTouched();
      return;
    }
    this.currentStep.set(step);
  }

  nextStep(step: 1 | 2 | 3): void {
    this.goToStep(step);
  }

  selectRole(roleValue: UserRole): void {
    this.registerForm.patchValue({ role: roleValue });
  }

  toggleGoal(goal: string): void {
    this.selectedGoals.update((goals) => {
      if (goals.includes(goal)) {
        return goals.filter((g) => g !== goal);
      } else {
        return [...goals, goal];
      }
    });
  }

  isGoalSelected(goal: string): boolean {
    return this.selectedGoals().includes(goal);
  }

  evaluatePasswordStrength(pwd: string): void {
    const len = pwd.length >= 8;
    const num = /\d/.test(pwd);
    const upper = /[A-Z]/.test(pwd);
    const spec = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

    this.hasLength.set(len);
    this.hasNumber.set(num);
    this.hasUpper.set(upper);
    this.hasSpecial.set(spec);

    const score = (len ? 1 : 0) + (num ? 1 : 0) + (upper ? 1 : 0) + (spec ? 1 : 0);

    if (!pwd || score === 0) {
      this.strengthPercent.set(15);
      this.strengthLabel.set('Unrated');
      this.strengthColor.set('text-red-400');
    } else if (score === 1) {
      this.strengthPercent.set(30);
      this.strengthLabel.set('Weak');
      this.strengthColor.set('text-orange-400');
    } else if (score === 2) {
      this.strengthPercent.set(60);
      this.strengthLabel.set('Moderate');
      this.strengthColor.set('text-yellow-400');
    } else if (score === 3) {
      this.strengthPercent.set(85);
      this.strengthLabel.set('Strong');
      this.strengthColor.set('text-emerald-400');
    } else {
      this.strengthPercent.set(100);
      this.strengthLabel.set('Mil-Spec Entropy');
      this.strengthColor.set('text-primary');
    }
  }

  executeRegistration(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { name, email, password, role } = this.registerForm.value;

    this.authService
      .register({
        name: name!,
        email: email!,
        password: password!,
        role: role as UserRole,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.currentStep.set(4);
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1800);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            err?.error?.message || err?.message || 'Registration failed. Please verify your details.'
          );
        },
      });
  }

  resetForm(): void {
    this.currentStep.set(1);
    this.errorMessage.set(null);
  }
}
