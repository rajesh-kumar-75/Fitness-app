import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { ExerciseService } from '../../core/services/exercise.service';
import { AuthService } from '../../core/services/auth.service';
import {
  AdminDashboardStats,
  AdminUser,
  AdminTrainer,
  AdminSubscription,
  AdminPayment,
  AdminReports,
} from '../../core/models/admin.model';
import { Exercise } from '../../core/models/exercise.model';
import { WorkoutPlan } from '../../core/models/workout.model';
import { LineChartComponent, ChartPoint } from '../../shared/components/line-chart/line-chart.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LineChartComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly exerciseService = inject(ExerciseService);
  private readonly authService = inject(AuthService);

  readonly activeTab = signal<
    'overview' | 'users' | 'trainers' | 'exercises' | 'workouts' | 'subscriptions' | 'payments' | 'reports'
  >('overview');

  readonly currentAdminId = computed(() => this.authService.currentUser()?._id || '');

  // Notifications
  readonly alertMessage = signal<string>('');
  readonly alertType = signal<'success' | 'danger'>('success');

  // Overview Stats
  readonly stats = signal<AdminDashboardStats | null>(null);
  readonly isLoadingStats = signal<boolean>(true);

  // Users Management
  readonly users = signal<AdminUser[]>([]);
  readonly usersPage = signal<number>(1);
  readonly usersTotalPages = signal<number>(1);
  readonly usersTotal = signal<number>(0);
  readonly userSearch = signal<string>('');
  readonly userRoleFilter = signal<string>('All');
  readonly userStatusFilter = signal<string>('All');
  readonly isLoadingUsers = signal<boolean>(false);

  // Role Modal
  readonly isRoleModalOpen = signal<boolean>(false);
  readonly targetUser = signal<AdminUser | null>(null);
  readonly selectedRole = signal<'USER' | 'TRAINER' | 'ADMIN'>('USER');

  // Delete User Modal
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly userToDelete = signal<AdminUser | null>(null);

  // Trainers Management
  readonly trainers = signal<AdminTrainer[]>([]);
  readonly isLoadingTrainers = signal<boolean>(false);

  // Exercises
  readonly exercises = signal<Exercise[]>([]);
  readonly isLoadingExercises = signal<boolean>(false);

  // Workouts
  readonly workouts = signal<WorkoutPlan[]>([]);
  readonly workoutsPage = signal<number>(1);
  readonly workoutsTotalPages = signal<number>(1);
  readonly workoutsTotal = signal<number>(0);
  readonly isLoadingWorkouts = signal<boolean>(false);

  // Subscriptions
  readonly subscriptions = signal<AdminSubscription[]>([]);
  readonly subsPage = signal<number>(1);
  readonly subsTotalPages = signal<number>(1);
  readonly subsTotal = signal<number>(0);
  readonly subPlanFilter = signal<string>('All');
  readonly subStatusFilter = signal<string>('All');
  readonly isLoadingSubs = signal<boolean>(false);

  // Payments
  readonly payments = signal<AdminPayment[]>([]);
  readonly paymentsPage = signal<number>(1);
  readonly paymentsTotalPages = signal<number>(1);
  readonly paymentsTotal = signal<number>(0);
  readonly isLoadingPayments = signal<boolean>(false);

  // Reports
  readonly reports = signal<AdminReports | null>(null);
  readonly isLoadingReports = signal<boolean>(false);

  readonly userGrowthChartPoints = computed<ChartPoint[]>(() => {
    const rep = this.reports();
    if (!rep?.userTrends) return [];
    return rep.userTrends.map((t) => ({ x: t.month, y: t.count }));
  });

  readonly revenueChartPoints = computed<ChartPoint[]>(() => {
    const rep = this.reports();
    if (!rep?.revenueTrends) return [];
    return rep.revenueTrends.map((r) => ({ x: r.month, y: r.revenue }));
  });

  ngOnInit(): void {
    this.loadStats();
    this.loadUsers();
    this.loadTrainers();
    this.loadExercises();
    this.loadWorkouts();
    this.loadSubscriptions();
    this.loadPayments();
    this.loadReports();
  }

  showAlert(message: string, type: 'success' | 'danger' = 'success'): void {
    this.alertMessage.set(message);
    this.alertType.set(type);
    setTimeout(() => this.alertMessage.set(''), 4000);
  }

  // --- 1. Overview ---
  loadStats(): void {
    this.isLoadingStats.set(true);
    this.adminService.getStats().subscribe({
      next: (res) => {
        this.stats.set(res.data.stats);
        this.isLoadingStats.set(false);
      },
      error: () => this.isLoadingStats.set(false),
    });
  }

  // --- 2. Users ---
  loadUsers(): void {
    this.isLoadingUsers.set(true);
    this.adminService
      .getUsers({
        page: this.usersPage(),
        limit: 10,
        search: this.userSearch(),
        role: this.userRoleFilter(),
        status: this.userStatusFilter(),
      })
      .subscribe({
        next: (res) => {
          this.users.set(res.data.users || []);
          this.usersTotal.set(res.data.pagination.total);
          this.usersTotalPages.set(res.data.pagination.totalPages);
          this.isLoadingUsers.set(false);
        },
        error: () => this.isLoadingUsers.set(false),
      });
  }

  onUserSearch(text: string): void {
    this.userSearch.set(text);
    this.usersPage.set(1);
    this.loadUsers();
  }

  onUserRoleFilterChange(role: string): void {
    this.userRoleFilter.set(role);
    this.usersPage.set(1);
    this.loadUsers();
  }

  onUserStatusFilterChange(status: string): void {
    this.userStatusFilter.set(status);
    this.usersPage.set(1);
    this.loadUsers();
  }

  goToUsersPage(page: number): void {
    if (page < 1 || page > this.usersTotalPages()) return;
    this.usersPage.set(page);
    this.loadUsers();
  }

  toggleUserStatus(user: AdminUser): void {
    const nextStatus = !user.isActive;
    this.adminService.updateUserStatus(user._id, nextStatus).subscribe({
      next: () => {
        this.showAlert(`User ${user.name} has been ${nextStatus ? 'activated' : 'deactivated'}.`);
        this.loadUsers();
        this.loadStats();
      },
      error: (err) => this.showAlert(err.error?.message || 'Failed to update status', 'danger'),
    });
  }

  openRoleModal(user: AdminUser): void {
    this.targetUser.set(user);
    this.selectedRole.set(user.role);
    this.isRoleModalOpen.set(true);
  }

  closeRoleModal(): void {
    this.isRoleModalOpen.set(false);
    this.targetUser.set(null);
  }

  submitRoleChange(): void {
    const u = this.targetUser();
    if (!u) return;
    this.adminService.updateUserRole(u._id, this.selectedRole()).subscribe({
      next: () => {
        this.showAlert(`Role for ${u.name} updated to ${this.selectedRole()}.`);
        this.closeRoleModal();
        this.loadUsers();
        this.loadStats();
      },
      error: (err) => this.showAlert(err.error?.message || 'Failed to update role', 'danger'),
    });
  }

  openDeleteModal(user: AdminUser): void {
    this.userToDelete.set(user);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.userToDelete.set(null);
  }

  confirmDeleteUser(): void {
    const u = this.userToDelete();
    if (!u) return;
    this.adminService.deleteUser(u._id).subscribe({
      next: () => {
        this.showAlert(`User ${u.name} deleted successfully.`);
        this.closeDeleteModal();
        this.loadUsers();
        this.loadStats();
      },
      error: (err) => this.showAlert(err.error?.message || 'Failed to delete user', 'danger'),
    });
  }

  // --- 3. Trainers ---
  loadTrainers(): void {
    this.isLoadingTrainers.set(true);
    this.adminService.getTrainers().subscribe({
      next: (res) => {
        this.trainers.set(res.data.trainers || []);
        this.isLoadingTrainers.set(false);
      },
      error: () => this.isLoadingTrainers.set(false),
    });
  }

  toggleTrainerAccepting(trainer: AdminTrainer): void {
    const nextVal = !trainer.trainerProfile?.isAcceptingClients;
    this.adminService.updateTrainer(trainer._id, { isAcceptingClients: nextVal }).subscribe({
      next: () => {
        this.showAlert(`Trainer ${trainer.name} status updated.`);
        this.loadTrainers();
      },
      error: (err) => this.showAlert(err.error?.message || 'Failed to update trainer', 'danger'),
    });
  }

  // --- 4. Exercises ---
  loadExercises(): void {
    this.isLoadingExercises.set(true);
    this.exerciseService.getExercises().subscribe({
      next: (res) => {
        this.exercises.set(res.data.exercises || []);
        this.isLoadingExercises.set(false);
      },
      error: () => this.isLoadingExercises.set(false),
    });
  }

  deleteExercise(id: string, name: string): void {
    if (!confirm(`Are you sure you want to delete "${name}" from the exercise library?`)) return;
    this.exerciseService.deleteExercise(id).subscribe({
      next: () => {
        this.showAlert(`Exercise "${name}" deleted.`);
        this.loadExercises();
        this.loadStats();
      },
      error: (err) => this.showAlert(err.error?.message || 'Failed to delete exercise', 'danger'),
    });
  }

  // --- 5. Workouts ---
  loadWorkouts(): void {
    this.isLoadingWorkouts.set(true);
    this.adminService.getWorkouts({ page: this.workoutsPage(), limit: 10 }).subscribe({
      next: (res) => {
        this.workouts.set(res.data.plans || []);
        this.workoutsTotal.set(res.data.pagination.total);
        this.workoutsTotalPages.set(res.data.pagination.totalPages);
        this.isLoadingWorkouts.set(false);
      },
      error: () => this.isLoadingWorkouts.set(false),
    });
  }

  deleteWorkout(id: string, title: string): void {
    if (!confirm(`Are you sure you want to delete workout plan "${title}"?`)) return;
    this.adminService.deleteWorkout(id).subscribe({
      next: () => {
        this.showAlert(`Workout plan "${title}" deleted.`);
        this.loadWorkouts();
        this.loadStats();
      },
      error: (err) => this.showAlert(err.error?.message || 'Failed to delete workout', 'danger'),
    });
  }

  // --- 6. Subscriptions ---
  loadSubscriptions(): void {
    this.isLoadingSubs.set(true);
    this.adminService
      .getSubscriptions({
        page: this.subsPage(),
        limit: 10,
        plan: this.subPlanFilter(),
        status: this.subStatusFilter(),
      })
      .subscribe({
        next: (res) => {
          this.subscriptions.set(res.data.subscriptions || []);
          this.subsTotal.set(res.data.pagination.total);
          this.subsTotalPages.set(res.data.pagination.totalPages);
          this.isLoadingSubs.set(false);
        },
        error: () => this.isLoadingSubs.set(false),
      });
  }

  // --- 7. Payments ---
  loadPayments(): void {
    this.isLoadingPayments.set(true);
    this.adminService.getPayments({ page: this.paymentsPage(), limit: 10 }).subscribe({
      next: (res) => {
        this.payments.set(res.data.payments || []);
        this.paymentsTotal.set(res.data.pagination.total);
        this.paymentsTotalPages.set(res.data.pagination.totalPages);
        this.isLoadingPayments.set(false);
      },
      error: () => this.isLoadingPayments.set(false),
    });
  }

  // --- 8. Reports ---
  loadReports(): void {
    this.isLoadingReports.set(true);
    this.adminService.getReports().subscribe({
      next: (res) => {
        this.reports.set(res.data.reports);
        this.isLoadingReports.set(false);
      },
      error: () => this.isLoadingReports.set(false),
    });
  }
}
