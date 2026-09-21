import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  MeasurementsResponse,
  AddMeasurementPayload,
  WeightProgressResponse,
  StrengthProgressResponse,
  ProgressOverviewResponse,
} from '../models/progress.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProgressService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/progress`;

  /**
   * Get all body measurement entries for user.
   */
  getMeasurements(): Observable<MeasurementsResponse> {
    return this.http.get<MeasurementsResponse>(`${this.baseUrl}/measurements`);
  }

  /**
   * Add a new body measurement entry.
   */
  addMeasurement(payload: AddMeasurementPayload): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(
      `${this.baseUrl}/measurements`,
      payload
    );
  }

  /**
   * Delete a body measurement entry.
   */
  deleteMeasurement(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/measurements/${id}`);
  }

  /**
   * Get weight progression time-series.
   */
  getWeightProgress(): Observable<WeightProgressResponse> {
    return this.http.get<WeightProgressResponse>(`${this.baseUrl}/weight`);
  }

  /**
   * Get strength progression time-series for a selected exercise.
   */
  getStrengthProgress(exerciseName?: string): Observable<StrengthProgressResponse> {
    let params = new HttpParams();
    if (exerciseName) {
      params = params.set('exerciseName', exerciseName);
    }
    return this.http.get<StrengthProgressResponse>(`${this.baseUrl}/strength`, { params });
  }

  /**
   * Get paginated workout history.
   */
  getWorkoutHistory(page = 1, limit = 15): Observable<any> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<any>(`${this.baseUrl}/workouts`, { params });
  }

  /**
   * Get high-level progress overview metrics.
   */
  getProgressOverview(): Observable<ProgressOverviewResponse> {
    return this.http.get<ProgressOverviewResponse>(`${this.baseUrl}/overview`);
  }
}
