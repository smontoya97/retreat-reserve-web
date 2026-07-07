/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, Feature, Cabin, Reservation, Review, User } from '../types';

const BASE_API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api/v1';
const TOKEN_KEY = 'rr_auth_token';

export class ApiClient {
  static getBackendUrl(): string {
    return BASE_API_URL;
  }

  static setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  static clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  private static getHeaders(contentType = 'application/json'): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': contentType,
    };
    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const storedUser = localStorage.getItem('rr_logged_in_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?.id) {
          headers['X-User-Id'] = parsedUser.id;
        }
      } catch {
        // Ignore malformed session payloads.
      }
    }
    return headers;
  }

  private static async parseResponse<T>(response: Response): Promise<T | null> {
    const text = await response.text();
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  private static async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    try {
      const mergedHeaders = new Headers(this.getHeaders());
      if (options.headers) {
        new Headers(options.headers).forEach((value, key) => mergedHeaders.set(key, value));
      }

      const response = await fetch(`${BASE_API_URL}${endpoint}`, {
        ...options,
        headers: mergedHeaders,
      });

      if (!response.ok) {
        const payload = await this.parseResponse<any>(response);
        const rawMessage = payload?.message || payload?.error || `Server returned code ${response.status}`;
        const message = this.translateBackendErrorMessage(rawMessage);
        throw new Error(message);
      }

      const payload = await this.parseResponse<T>(response);
      if (payload === null || payload === undefined) {
        throw new Error('Respuesta vacía del backend');
      }
      return payload;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`[API Client] Error contacting backend at ${BASE_API_URL}${endpoint}:`, error);
      }
      throw error;
    }
  }

  private static normalizeUser(payload: any): User {
    const role = String(payload.role || payload.userRole || 'user').toLowerCase();
    return {
      id: payload.id || payload.userId || payload._id || '',
      name: payload.firstName || payload.name || 'Usuario',
      lastName: payload.lastName || '',
      email: payload.email || '',
      role: role === 'admin' ? 'admin' : 'user',
      createdAt: payload.createdAt || new Date().toISOString(),
      phoneNumber: payload.phoneNumber,
      emailVerified: payload.emailVerified,
    };
  }

  private static normalizeCabin(payload: any): Cabin {
    const location = payload.location || {};
    return {
      id: payload.id || payload.cabinId || payload._id || '',
      name: payload.name || 'Cabaña',
      description: payload.description || '',
      categoryId: payload.categoryId || payload.category?.id || '',
      city: payload.city || location.city || '',
      state: payload.state || location.state || '',
      country: payload.country || location.country || '',
      address: payload.address || '',
      latitude: payload.latitude ?? 0,
      longitude: payload.longitude ?? 0,
      maxGuests: payload.maxGuests ?? 1,
      numberOfBedrooms: payload.numberOfBedrooms ?? 1,
      numberOfBathrooms: payload.numberOfBathrooms ?? 1,
      pricePerNight: Number(payload.pricePerNight ?? payload.price ?? 0),
      imageUrls: payload.imageUrls || payload.images || [],
      featureIds: payload.featureIds || payload.features || [],
      policies: payload.policies || [],
      averageRating: payload.averageRating,
      totalReviews: payload.totalReviews,
      status: payload.status,
    };
  }

  private static normalizeReservation(payload: any): Reservation {
    const status = String(payload.status || 'pending').toLowerCase();
    return {
      id: payload.id || payload.reservationId || payload._id || '',
      cabinId: payload.cabinId || payload.cabin?.id || '',
      userId: payload.userId || payload.user?.id || '',
      checkInDate: payload.checkInDate || '',
      checkOutDate: payload.checkOutDate || '',
      guestsCount: payload.guestsCount ?? payload.numberOfGuests ?? 1,
      totalAmount: payload.totalAmount ?? payload.totalPrice ?? 0,
      status: status === 'cancelled' ? 'cancelled' : status === 'completed' ? 'completed' : status === 'confirmed' ? 'confirmed' : 'pending',
      createdAt: payload.createdAt || new Date().toISOString(),
    };
  }

  private static normalizeReview(payload: any): Review {
    return {
      id: payload.id || payload.reviewId || payload._id || '',
      cabinId: payload.cabinId || payload.cabin?.id || '',
      userId: payload.userId || payload.user?.id || '',
      userName: payload.userName || payload.user?.name || 'Usuario',
      rating: payload.rating ?? 0,
      comment: payload.comment || '',
      date: payload.date || new Date().toISOString().split('T')[0],
    };
  }

  private static translateBackendErrorMessage(rawMessage: string): string {
    const normalized = String(rawMessage).toLowerCase();

    if (normalized.includes('invalid email or password') || normalized.includes('incorrect email or password')) {
      return 'Correo o contraseña incorrectos.';
    }
    if (normalized.includes('unauthorized') || normalized.includes('no autorizado') || normalized.includes('forbidden')) {
      return 'No estás autorizado para realizar esta acción.';
    }
    if (normalized.includes('user not found') || normalized.includes('usuario no encontrado')) {
      return 'No se encontró una cuenta con este correo.';
    }
    if (normalized.includes('password too weak') || normalized.includes('contraseña demasiado débil')) {
      return 'La contraseña no cumple con los requisitos mínimos.';
    }
    if (normalized.includes('email already exists') || normalized.includes('email already in use') || normalized.includes('correo ya existe') || normalized.includes('ya existe')) {
      return 'Ya existe una cuenta con ese correo electrónico.';
    }
    if (normalized.includes('validation failed') || normalized.includes('invalid') || normalized.includes('required') || normalized.includes('must')) {
      return 'Los datos ingresados no son válidos. Revisa los campos e intenta nuevamente.';
    }
    if (normalized.includes('not found') || normalized.includes('no encontrado')) {
      return 'El recurso solicitado no fue encontrado.';
    }
    if (normalized.includes('server returned code 500') || normalized.includes('internal server error')) {
      return 'Ocurrió un error en el servidor. Intenta nuevamente más tarde.';
    }
    if (normalized.includes('server returned code 404')) {
      return 'No se encontró el recurso solicitado.';
    }
    return String(rawMessage).trim() || 'Ocurrió un error al comunicarse con el backend.';
  }

  static async login(email: string, password = 'password123'): Promise<{ token: string; user: User }> {
    try {
      const response = await fetch(`${BASE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorPayload = await this.parseResponse<any>(response);
        const backendMessage = errorPayload?.message || errorPayload?.error;
        const message = backendMessage
          ? this.translateBackendErrorMessage(backendMessage)
          : 'Correo o contraseña incorrectos.';
        throw new Error(message);
      }

      const data = await this.parseResponse<any>(response);
      const token = data?.token;
      if (token) {
        this.setToken(token);

        let normalizedUser: User;
        if (data.user) {
          normalizedUser = this.normalizeUser(data.user);
        } else if (data.userId) {
          normalizedUser = {
            id: data.userId,
            name: 'Usuario',
            lastName: '',
            email,
            role: 'user',
            createdAt: new Date().toISOString(),
          } as User;
        } else {
          throw new Error('Respuesta de login incompleta.');
        }

        if (data.userId) {
          normalizedUser = await this.getUserById(data.userId);
        } else {
          const shouldFetchProfile = !normalizedUser.name || !normalizedUser.lastName || normalizedUser.name === 'Usuario';
          if (shouldFetchProfile) {
            normalizedUser = await this.getUserById(normalizedUser.id);
          }
        }

        localStorage.setItem('rr_logged_in_user', JSON.stringify(normalizedUser));
        return { token, user: normalizedUser };
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Backend auth unavailable.', error);
      }
      const message = error?.message || 'No se pudo autenticar con el backend.';
      throw new Error(message);
    }

    throw new Error('No se pudo autenticar con el backend.');
  }

  static async getUserById(userId: string): Promise<User> {
    const payload = await this.request<any>(`/users/${userId}`, { method: 'GET' });
    return this.normalizeUser(payload);
  }

  static async register(user: Omit<User, 'id'> & { password?: string; phoneNumber?: string }): Promise<User> {
    try {
      const response = await fetch(`${BASE_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: user.name,
          lastName: user.lastName,
          email: user.email,
          password: user.password || 'Password123!',
          phoneNumber: user.phoneNumber || '',
        }),
      });

      if (!response.ok) {
        const errorPayload = await this.parseResponse<any>(response);
        const backendMessage = errorPayload?.message || errorPayload?.error;
        const message = backendMessage
          ? this.translateBackendErrorMessage(backendMessage)
          : 'No se pudo registrar el usuario con el backend.';
        throw new Error(message);
      }

      const payload = await this.parseResponse<any>(response);
      return this.normalizeUser(payload.user || payload);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Backend registration error.', error);
      }
      const message = error?.message || 'No se pudo registrar el usuario con el backend.';
      throw new Error(message);
    }
  }

  static async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/categories', { method: 'GET' });
  }

  static async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    return this.request<Category>('/categories', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(category),
    });
  }

  static async deleteCategory(id: string): Promise<boolean> {
    return this.request<boolean>(`/categories/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  static async getFeatures(): Promise<Feature[]> {
    return this.request<Feature[]>('/features', { method: 'GET' });
  }

  static async createFeature(feature: Omit<Feature, 'id'>): Promise<Feature> {
    return this.request<Feature>('/features', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(feature),
    });
  }

  static async deleteFeature(id: string): Promise<boolean> {
    return this.request<boolean>(`/features/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  static async getCabinsSearch(params?: {
    city?: string;
    maxGuests?: number;
    maxPrice?: number;
    categoryId?: string;
  }): Promise<Cabin[]> {
    const parts: string[] = [];
    if (params?.city) parts.push(`city=${encodeURIComponent(params.city)}`);
    if (params?.maxGuests) parts.push(`maxGuests=${params.maxGuests}`);
    if (params?.maxPrice) parts.push(`maxPrice=${params.maxPrice}`);
    if (params?.categoryId) parts.push(`categoryId=${params.categoryId}`);
    const query = parts.length > 0 ? `?${parts.join('&')}` : '';

    return this.request<Cabin[]>(`/cabins/search${query}`, { method: 'GET' });
  }

  static async getCabinById(id: string): Promise<Cabin> {
    return this.request<Cabin>(`/cabins/${id}`, { method: 'GET' });
  }

  static async createCabin(cabin: Omit<Cabin, 'id'>): Promise<Cabin> {
    return this.request<Cabin>('/cabins', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(cabin),
    });
  }

  static async deleteCabin(id: string): Promise<boolean> {
    return this.request<boolean>(`/cabins/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  static async checkAvailability(cabinId: string, checkIn: string, checkOut: string): Promise<boolean> {
    const url = `/reservations/check-availability?cabinId=${cabinId}&checkInDate=${checkIn}&checkOutDate=${checkOut}`;
    return this.request<{ available: boolean }>(url, { method: 'GET' }).then(result => result.available);
  }

  static async createReservation(reservation: Omit<Reservation, 'id' | 'createdAt'>): Promise<Reservation> {
    return this.request<Reservation>('/reservations', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(reservation),
    });
  }

  static async getReservationsByUserId(userId: string): Promise<Reservation[]> {
    if (!userId) {
      return [];
    }
    return this.request<Reservation[]>(`/reservations/user/${userId}`, { method: 'GET' });
  }

  static async cancelReservation(reservationId: string): Promise<Reservation> {
    return this.request<Reservation>(`/reservations/${reservationId}/cancel`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
  }

  static async completeReservation(reservationId: string): Promise<Reservation> {
    return this.request<Reservation>(`/reservations/${reservationId}/complete`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
  }

  static async updateReservationStatus(reservationId: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled'): Promise<Reservation> {
    if (status === 'cancelled') {
      return this.cancelReservation(reservationId);
    }
    if (status === 'completed') {
      return this.completeReservation(reservationId);
    }
    return this.request<Reservation>(`/reservations/${reservationId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
  }

  static async getReviewsByCabinId(cabinId: string): Promise<Review[]> {
    if (!cabinId) {
      return [];
    }
    return this.request<Review[]>(`/reviews/cabin/${cabinId}`, { method: 'GET' });
  }

  static async createReview(review: Omit<Review, 'id' | 'date'>): Promise<Review> {
    return this.request<Review>('/reviews', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(review),
    });
  }

  static async getFavoritesByUserId(userId: string): Promise<string[]> {
    if (!userId) {
      return [];
    }
    return this.request<string[]>(`/favorites/user/${userId}`, { method: 'GET' });
  }

  static async toggleFavorite(userId: string, cabinId: string): Promise<string[]> {
    if (!userId || !cabinId) {
      return [];
    }
    return this.request<string[]>(`/favorites`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ userId, cabinId }),
    });
  }

  static async updateProfile(userId: string, data: { name: string; lastName: string; phoneNumber?: string }): Promise<User> {
    return this.request<User>(`/users/${userId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({
        firstName: data.name,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || '',
      }),
    });
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    return this.request<boolean>(`/users/${userId}/change-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }
}
