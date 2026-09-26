import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DailyNutritionResponse,
  FoodsListResponse,
  LogFoodPayload,
  Food,
  ScanResponse,
  WaterTrackerResponse,
  GroceryListResponse,
  GroceryItem,
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

  /**
   * Scan macro image / food label via Gemini Vision API or OCR fallback.
   */
  scanFoodImage(file: File): Observable<ScanResponse> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<ScanResponse>(`${this.baseUrl}/scan`, formData);
  }

  /**
   * Get daily water intake and streak.
   */
  getWaterIntake(date?: string): Observable<WaterTrackerResponse> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date);
    }
    return this.http.get<WaterTrackerResponse>(`${this.baseUrl}/water`, { params });
  }

  /**
   * Log quick water intake increment (e.g. +250ml, +500ml, +750ml).
   */
  logWaterIntake(amountMl: number, date?: string): Observable<WaterTrackerResponse> {
    return this.http.post<WaterTrackerResponse>(`${this.baseUrl}/water/log`, {
      amountMl,
      date,
    });
  }

  /**
   * Reset water intake for the day.
   */
  resetWaterIntake(date?: string): Observable<WaterTrackerResponse> {
    return this.http.post<WaterTrackerResponse>(`${this.baseUrl}/water/reset`, { date });
  }

  /**
   * Get aggregated grocery checklist for the week.
   */
  getGroceryList(week?: string): Observable<GroceryListResponse> {
    let params = new HttpParams();
    if (week) {
      params = params.set('week', week);
    }
    return this.http.get<GroceryListResponse>(`${this.baseUrl}/grocery-list`, { params });
  }

  /**
   * Update grocery checklist items (check/uncheck, add custom items, quantity change).
   */
  updateGroceryList(items: GroceryItem[], weekStartDate?: string): Observable<GroceryListResponse> {
    return this.http.patch<GroceryListResponse>(`${this.baseUrl}/grocery-list`, {
      items,
      weekStartDate,
    });
  }
}
