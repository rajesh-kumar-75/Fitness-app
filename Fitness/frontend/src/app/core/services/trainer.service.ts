import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  TrainerProfile,
  TrainerPublicInfo,
  TrainerClient,
  DietPlan,
  CreateDietPlanPayload,
} from '../models/trainer.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TrainerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/trainers`;

  /**
   * Get authenticated trainer's professional profile and client counts.
   */
  getTrainerProfile(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/profile`);
  }

  /**
   * Update authenticated trainer's professional profile.
   */
  updateTrainerProfile(payload: Partial<TrainerProfile>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/profile`, payload);
  }

  /**
   * Public directory of certified trainers for users to browse.
   */
  getPublicTrainers(): Observable<{ success: boolean; data: { trainers: TrainerPublicInfo[]; count: number } }> {
    return this.http.get<{ success: boolean; data: { trainers: TrainerPublicInfo[]; count: number } }>(
      `${this.baseUrl}/public`
    );
  }

  /**
   * Get trainer's roster of clients (active and pending).
   */
  getClients(): Observable<{
    success: boolean;
    data: {
      clients: TrainerClient[];
      activeClients: TrainerClient[];
      pendingRequests: TrainerClient[];
      activeCount: number;
      pendingCount: number;
    };
  }> {
    return this.http.get<any>(`${this.baseUrl}/clients`);
  }

  /**
   * Respond to a client connection request (accept or reject).
   */
  respondToConnectionRequest(
    clientId: string,
    action: 'accept' | 'reject'
  ): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/clients/${clientId}/respond`, { action });
  }

  /**
   * Get full details and current plans for an authorized client.
   */
  getClientDetails(clientId: string): Observable<{
    success: boolean;
    data: {
      client: any;
      connection: TrainerClient;
    };
  }> {
    return this.http.get<any>(`${this.baseUrl}/clients/${clientId}`);
  }

  /**
   * Assign a workout plan to an active client.
   */
  assignWorkoutPlan(clientId: string, workoutPlanId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/clients/${clientId}/workout-plan`, {
      workoutPlanId,
    });
  }

  /**
   * Create and assign a custom diet plan to an active client.
   */
  createAndAssignDietPlan(
    clientId: string,
    payload: CreateDietPlanPayload
  ): Observable<{ success: boolean; data: { dietPlan: DietPlan } }> {
    return this.http.post<any>(`${this.baseUrl}/clients/${clientId}/diet-plan`, payload);
  }

  /**
   * Get active diet plan for a client.
   */
  getClientDietPlan(clientId: string): Observable<{ success: boolean; data: { dietPlan: DietPlan } }> {
    return this.http.get<any>(`${this.baseUrl}/clients/${clientId}/diet-plan`);
  }

  /**
   * View client's weight progression.
   */
  getClientProgress(clientId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/clients/${clientId}/progress`);
  }

  /**
   * View client's strength progression across workout logs.
   */
  getClientStrengthProgress(clientId: string, exerciseName?: string): Observable<any> {
    let params = new HttpParams();
    if (exerciseName) {
      params = params.set('exerciseName', exerciseName);
    }
    return this.http.get<any>(`${this.baseUrl}/clients/${clientId}/strength`, { params });
  }

  /**
   * View client's completed workout logs with set breakdowns.
   */
  getClientWorkoutHistory(clientId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/clients/${clientId}/workouts`);
  }

  /**
   * View client's body measurements.
   */
  getClientMeasurements(clientId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/clients/${clientId}/measurements`);
  }

  /**
   * User requests connection with a certified trainer.
   */
  connectWithTrainer(trainerId: string, message?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${trainerId}/connect`, { message });
  }

  /**
   * User retrieves their active trainer and assigned plans.
   */
  getMyTrainer(): Observable<{
    success: boolean;
    data: {
      connection: TrainerClient | null;
      hasTrainer: boolean;
    };
  }> {
    return this.http.get<any>(`${this.baseUrl}/my-trainer`);
  }
}
