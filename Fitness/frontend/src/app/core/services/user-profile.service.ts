import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ProfileResponse, UpdateProfilePayload } from '../models/user-profile.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/users/profile`;

  /**
   * Fetch current authenticated user profile and calculated metrics.
   */
  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(this.baseUrl);
  }

  /**
   * Update current user's profile and sync with AuthService.
   */
  updateProfile(payload: UpdateProfilePayload): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>(this.baseUrl, payload).pipe(
      tap((response) => {
        // Synchronize updated user name and basic data with AuthService
        const currentUser = this.authService.currentUser();
        if (currentUser) {
          this.authService.currentUser.set({
            ...currentUser,
            name: response.data.user.name,
          });
        }
      })
    );
  }
}
