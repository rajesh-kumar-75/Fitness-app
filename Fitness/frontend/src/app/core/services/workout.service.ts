import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  WorkoutPlansResponse,
  ActivePlanResponse,
  WorkoutPlan,
  WorkoutLogResponse,
  WorkoutHistoryResponse,
  WorkoutLogExercise,
} from '../models/workout.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WorkoutService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/workouts`;

  // --- Workout Plans ---

  getPlans(filters?: { difficulty?: string; goal?: string }): Observable<WorkoutPlansResponse> {
    let params = new HttpParams();
    if (filters?.difficulty && filters.difficulty !== 'All') {
      params = params.set('difficulty', filters.difficulty);
    }
    if (filters?.goal && filters.goal !== 'All') {
      params = params.set('goal', filters.goal);
    }
    return this.http.get<WorkoutPlansResponse>(`${this.baseUrl}/plans`, { params });
  }

  getMyActivePlan(): Observable<ActivePlanResponse> {
    return this.http.get<ActivePlanResponse>(`${this.baseUrl}/plans/my-plan`);
  }

  getPlanById(id: string): Observable<{ success: boolean; data: { plan: WorkoutPlan } }> {
    return this.http.get<{ success: boolean; data: { plan: WorkoutPlan } }>(
      `${this.baseUrl}/plans/${id}`
    );
  }

  createPlan(payload: Partial<WorkoutPlan>): Observable<{ success: boolean; data: { plan: WorkoutPlan } }> {
    return this.http.post<{ success: boolean; data: { plan: WorkoutPlan } }>(
      `${this.baseUrl}/plans`,
      payload
    );
  }

  adoptPlan(id: string): Observable<{ success: boolean; data: { plan: WorkoutPlan } }> {
    return this.http.post<{ success: boolean; data: { plan: WorkoutPlan } }>(
      `${this.baseUrl}/plans/${id}/adopt`,
      {}
    );
  }

  assignPlan(
    id: string,
    targetUserId: string
  ): Observable<{ success: boolean; message: string; data: { plan: WorkoutPlan } }> {
    return this.http.post<{ success: boolean; message: string; data: { plan: WorkoutPlan } }>(
      `${this.baseUrl}/plans/${id}/assign`,
      { targetUserId }
    );
  }

  // --- Workout Session Tracking & Logs ---

  startWorkout(dayOfWeek: string, planId?: string): Observable<WorkoutLogResponse> {
    return this.http.post<WorkoutLogResponse>(`${this.baseUrl}/logs/start`, {
      dayOfWeek,
      planId,
    });
  }

  getActiveSession(): Observable<WorkoutLogResponse> {
    return this.http.get<WorkoutLogResponse>(`${this.baseUrl}/logs/active`);
  }

  updateProgress(
    sessionId: string,
    exercises: WorkoutLogExercise[],
    notes?: string
  ): Observable<WorkoutLogResponse> {
    return this.http.put<WorkoutLogResponse>(`${this.baseUrl}/logs/${sessionId}/progress`, {
      exercises,
      notes,
    });
  }

  completeWorkout(
    sessionId: string,
    exercises?: WorkoutLogExercise[],
    notes?: string
  ): Observable<WorkoutLogResponse> {
    return this.http.put<WorkoutLogResponse>(`${this.baseUrl}/logs/${sessionId}/complete`, {
      exercises,
      notes,
    });
  }

  cancelWorkout(sessionId: string): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(
      `${this.baseUrl}/logs/${sessionId}/cancel`,
      {}
    );
  }

  getHistory(): Observable<WorkoutHistoryResponse> {
    return this.http.get<WorkoutHistoryResponse>(`${this.baseUrl}/logs/history`);
  }
}
