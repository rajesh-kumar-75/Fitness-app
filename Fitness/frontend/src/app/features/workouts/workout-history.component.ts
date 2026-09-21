import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProgressService } from '../../core/services/progress.service';

@Component({
  selector: 'app-workout-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './workout-history.component.html',
  styleUrl: './workout-history.component.scss',
})
export class WorkoutHistoryComponent implements OnInit {
  private readonly progressService = inject(ProgressService);

  readonly history = signal<any[]>([]);
  readonly pagination = signal<{ total: number; page: number; limit: number; pages: number }>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  readonly isLoading = signal<boolean>(true);
  readonly expandedSessionId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadHistory(1);
  }

  loadHistory(page: number): void {
    this.isLoading.set(true);
    this.progressService.getWorkoutHistory(page, 10).subscribe({
      next: (res) => {
        this.history.set(res.data.history || []);
        this.pagination.set(res.data.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  toggleExpand(id: string): void {
    if (this.expandedSessionId() === id) {
      this.expandedSessionId.set(null);
    } else {
      this.expandedSessionId.set(id);
    }
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pagination().pages) return;
    this.loadHistory(page);
  }
}
