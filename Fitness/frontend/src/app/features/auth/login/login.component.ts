import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal<boolean>(false);
  readonly fieldPulse = signal<boolean>(false);
  readonly loginSuccessToast = signal<boolean>(false);

  private returnUrl = '/dashboard';

  readonly loginForm = this.fb.group({
    email: ['member@fitness.com', [Validators.required, Validators.email]],
    password: ['Member@123', [Validators.required, Validators.minLength(6)]],
    rememberMe: [true],
  });

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  fillDemoAthlete(): void {
    this.loginForm.patchValue({
      email: 'member@fitness.com',
      password: 'Member@123',
    });
    this.triggerPulse();
  }

  fillDemoTrainer(): void {
    this.loginForm.patchValue({
      email: 'trainer@fitness.com',
      password: 'Trainer@123',
    });
    this.triggerPulse();
  }

  private triggerPulse(): void {
    this.fieldPulse.set(true);
    setTimeout(() => this.fieldPulse.set(false), 600);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.loginSuccessToast.set(true);
        setTimeout(() => {
          this.router.navigateByUrl(this.returnUrl);
        }, 600);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message || err?.message || 'Invalid email or password. Please verify your credentials.'
        );
      },
    });
  }
}
