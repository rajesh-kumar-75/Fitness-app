import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { HealthService } from '../../core/services/health.service';
import { HealthData } from '../../core/models/health.model';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-health-check',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './health-check.component.html',
  styleUrl: './health-check.component.scss',
})
export class HealthCheckComponent implements OnInit, OnDestroy {
  private readonly healthService = inject(HealthService);
  private autoRefreshSub?: Subscription;

  // Reactive State Signals
  readonly isLoading = signal<boolean>(false);
  readonly healthData = signal<HealthData | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly latencyMs = signal<number | null>(null);
  readonly lastCheckedAt = signal<Date | null>(null);

  // Reactive Form Control for Auto-refresh toggle
  readonly autoRefreshControl = new FormControl<boolean>(false);

  ngOnInit(): void {
    this.checkHealth();

    // Listen to auto-refresh toggle changes
    this.autoRefreshControl.valueChanges.subscribe((enabled) => {
      if (enabled) {
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  checkHealth(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const startTime = performance.now();

    this.healthService.checkHealth().subscribe({
      next: (response) => {
        const endTime = performance.now();
        this.latencyMs.set(Math.round(endTime - startTime));
        this.healthData.set(response.data);
        this.lastCheckedAt.set(new Date());
        this.isLoading.set(false);
      },
      error: (err) => {
        const endTime = performance.now();
        this.latencyMs.set(Math.round(endTime - startTime));
        this.healthData.set(null);
        this.errorMessage.set(err.message || 'Failed to connect to backend service.');
        this.lastCheckedAt.set(new Date());
        this.isLoading.set(false);
      },
    });
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    // Poll every 10 seconds
    this.autoRefreshSub = interval(10000).subscribe(() => {
      this.checkHealth();
    });
  }

  private stopAutoRefresh(): void {
    if (this.autoRefreshSub) {
      this.autoRefreshSub.unsubscribe();
      this.autoRefreshSub = undefined;
    }
  }
}
