import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Exercise,
  ExerciseFilters,
  ExerciseListResponse,
  ExerciseDetailResponse,
  CreateExercisePayload,
} from '../models/exercise.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ExerciseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/exercises`;

  /**
   * Fetch exercises with optional search and filter parameters.
   */
  getExercises(filters?: ExerciseFilters): Observable<ExerciseListResponse> {
    let params = new HttpParams();

    if (filters?.search && filters.search.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters?.muscleGroup && filters.muscleGroup !== 'All') {
      params = params.set('muscleGroup', filters.muscleGroup);
    }
    if (filters?.difficulty && filters.difficulty !== 'All') {
      params = params.set('difficulty', filters.difficulty);
    }
    if (filters?.equipment && filters.equipment !== 'All') {
      params = params.set('equipment', filters.equipment);
    }

    return this.http.get<ExerciseListResponse>(this.baseUrl, { params });
  }

  /**
   * Retrieve single exercise by ID.
   */
  getExerciseById(id: string): Observable<ExerciseDetailResponse> {
    return this.http.get<ExerciseDetailResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new exercise (Admin only).
   */
  createExercise(payload: CreateExercisePayload): Observable<ExerciseDetailResponse> {
    return this.http.post<ExerciseDetailResponse>(this.baseUrl, payload);
  }

  /**
   * Update an existing exercise (Admin only).
   */
  updateExercise(
    id: string,
    payload: Partial<CreateExercisePayload>
  ): Observable<ExerciseDetailResponse> {
    return this.http.put<ExerciseDetailResponse>(`${this.baseUrl}/${id}`, payload);
  }

  /**
   * Delete an exercise (Admin only).
   */
  deleteExercise(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/${id}`);
  }
}
