import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DailyNutritionResponse,
  FoodsListResponse,
  LogFoodPayload,
  Food,
} from '../models/nutrition.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NutritionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/nutrition`;

  /**
   * Search and filter foods in the food database.
   */
  getFoods(search?: string, category?: string): Observable<FoodsListResponse> {
    let params = new HttpParams();
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    if (category && category !== 'All') {
      params = params.set('category', category);
    }
    return this.http.get<FoodsListResponse>(`${this.baseUrl}/foods`, { params });
  }

  /**
   * Create a new custom food item.
   */
  createFood(food: Partial<Food>): Observable<{ success: boolean; data: { food: Food } }> {
    return this.http.post<{ success: boolean; data: { food: Food } }>(
      `${this.baseUrl}/foods`,
      food
    );
  }

  /**
   * Get daily nutrition summary, meal logs, and targets for a specific date (YYYY-MM-DD).
   */
  getDailyNutrition(date?: string): Observable<DailyNutritionResponse> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date);
    }
    return this.http.get<DailyNutritionResponse>(`${this.baseUrl}/daily`, { params });
  }

  /**
   * Log food item into a meal for a date.
   */
  logFood(payload: LogFoodPayload): Observable<{ success: boolean; data: { meal: any } }> {
    return this.http.post<{ success: boolean; data: { meal: any } }>(
      `${this.baseUrl}/log`,
      payload
    );
  }

  /**
   * Remove a logged food item.
   */
  removeFoodItem(logId: string, itemId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.baseUrl}/log/${logId}/item/${itemId}`
    );
  }
}
