import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AdminDashboardStats,
  AdminUser,
  AdminTrainer,
  AdminSubscription,
  AdminPayment,
  AdminReports,
} from '../models/admin.model';
import { WorkoutPlan } from '../models/workout.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  /**
   * Get comprehensive dashboard statistics.
   */
  getStats(): Observable<{ success: boolean; data: { stats: AdminDashboardStats } }> {
    return this.http.get<{ success: boolean; data: { stats: AdminDashboardStats } }>(
      `${this.baseUrl}/stats`
    );
  }

  /**
   * Get paginated users with search and filter.
   */
  getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Observable<{
    success: boolean;
    data: {
      users: AdminUser[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    };
  }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.role && params.role !== 'All') httpParams = httpParams.set('role', params.role);
    if (params?.status && params.status !== 'All') httpParams = httpParams.set('status', params.status);

    return this.http.get<any>(`${this.baseUrl}/users`, { params: httpParams });
  }

  /**
   * Activate or deactivate a user account.
   */
  updateUserStatus(userId: string, isActive: boolean): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/users/${userId}/status`, { isActive });
  }

  /**
   * Update a user's role (USER, TRAINER, ADMIN).
   */
  updateUserRole(userId: string, role: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/users/${userId}/role`, { role });
  }

  /**
   * Delete a user account.
   */
  deleteUser(userId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/users/${userId}`);
  }

  /**
   * Get all certified trainers with metrics.
   */
  getTrainers(): Observable<{ success: boolean; data: { trainers: AdminTrainer[] } }> {
    return this.http.get<{ success: boolean; data: { trainers: AdminTrainer[] } }>(
      `${this.baseUrl}/trainers`
    );
  }

  /**
   * Update trainer profile and verification status.
   */
  updateTrainer(trainerId: string, payload: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/trainers/${trainerId}`, payload);
  }

  /**
   * Get platform workout plans.
   */
  getWorkouts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    difficulty?: string;
    goal?: string;
  }): Observable<{
    success: boolean;
    data: {
      plans: WorkoutPlan[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    };
  }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.difficulty && params.difficulty !== 'All')
      httpParams = httpParams.set('difficulty', params.difficulty);
    if (params?.goal && params.goal !== 'All') httpParams = httpParams.set('goal', params.goal);

    return this.http.get<any>(`${this.baseUrl}/workouts`, { params: httpParams });
  }

  /**
   * Delete a workout plan.
   */
  deleteWorkout(planId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/workouts/${planId}`);
  }

  /**
   * Get platform subscriptions.
   */
  getSubscriptions(params?: {
    page?: number;
    limit?: number;
    plan?: string;
    status?: string;
  }): Observable<{
    success: boolean;
    data: {
      subscriptions: AdminSubscription[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    };
  }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.plan && params.plan !== 'All') httpParams = httpParams.set('plan', params.plan);
    if (params?.status && params.status !== 'All') httpParams = httpParams.set('status', params.status);

    return this.http.get<any>(`${this.baseUrl}/subscriptions`, { params: httpParams });
  }

  /**
   * Update subscription status.
   */
  updateSubscription(subscriptionId: string, payload: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/subscriptions/${subscriptionId}`, payload);
  }

  /**
   * Get payment transactions.
   */
  getPayments(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Observable<{
    success: boolean;
    data: {
      payments: AdminPayment[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    };
  }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.status && params.status !== 'All') httpParams = httpParams.set('status', params.status);

    return this.http.get<any>(`${this.baseUrl}/payments`, { params: httpParams });
  }

  /**
   * Get analytical reports.
   */
  getReports(): Observable<{ success: boolean; data: { reports: AdminReports } }> {
    return this.http.get<{ success: boolean; data: { reports: AdminReports } }>(
      `${this.baseUrl}/reports`
    );
  }
}
