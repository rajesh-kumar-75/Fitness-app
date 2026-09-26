import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StepData {
  date: string;
  steps: number;
  stepGoal: number;
  remainingSteps: number;
  stepPercentage: number;
}

export interface StepResponse {
  success: boolean;
  message?: string;
  data: StepData;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  /**
   * Fetch current user's step count for today (or specified date).
   */
  getDailySteps(date?: string): Observable<StepResponse> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date);
    }
    return this.http.get<StepResponse>(`${this.baseUrl}/steps`, { params });
  }

  /**
   * Update current user's step count via PATCH /api/dashboard/steps.
   */
  updateDailySteps(steps: number, stepGoal: number = 10000, date?: string): Observable<StepResponse> {
    return this.http.patch<StepResponse>(`${this.baseUrl}/steps`, {
      steps,
      stepGoal,
      date,
    });
  }

  /**
   * Get member dashboard statistics and overview.
   */
  getMemberDashboard(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/member`);
  }
}
