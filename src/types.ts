/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  role: 'admin' | 'user';
  createdAt?: string;
  phoneNumber?: string;
  emailVerified?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

export interface Feature {
  id: string;
  name: string;
  iconKey: string; // e.g. 'wifi', 'utensils', 'flame', 'car', 'tv', 'compass', 'snowflake', 'pet'
  description?: string;
}

export interface PolicyItem {
  title: string;
  displayOrder: number;
  items: string[];
}

export interface Cabin {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  city: string;
  state: string;
  country: string;
  address: string;
  latitude: number;
  longitude: number;
  maxGuests: number;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  pricePerNight: number;
  imageUrls: string[];
  featureIds: string[];
  policies: PolicyItem[];
  averageRating?: number;
  totalReviews?: number;
  status?: 'AVAILABLE' | 'UNAVAILABLE' | 'MAINTENANCE';
}

export interface Reservation {
  id: string;
  cabinId: string;
  userId: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  guestsCount: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Review {
  id: string;
  cabinId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  date: string; // YYYY-MM-DD
}

export interface OutgoingEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
}

