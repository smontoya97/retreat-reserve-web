/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Cabin, Reservation, Review, Category, Feature, OutgoingEmail } from '../types';
import { ApiClient } from '../services/api';

export type BackendStatus = 'online' | 'degraded' | 'offline';

interface SearchCriteria {
  city: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guests: number;
}

export type ViewState =
  | 'home'
  | 'detail'
  | 'search'
  | 'login'
  | 'register'
  | 'profile'
  | 'reservations'
  | 'favorites'
  | 'admin';

interface AppContextType {
  user: User | null;
  currentView: ViewState;
  selectedCabinId: string | null;
  selectedCategoryFilter: string | null;
  searchCriteria: SearchCriteria;
  favorites: string[];
  cabins: Cabin[];
  categories: Category[];
  features: Feature[];
  allReservations: Reservation[];
  allReviews: Review[];
  sentEmails: OutgoingEmail[];
  adminMessage: string | null; // Top required message if redirecting to login
  adminSubTab: 'properties' | 'categories' | 'features' | 'users' | 'reservations';

  // Actions
  setView: (view: ViewState, cabinId?: string | null) => void;
  setCategoryFilter: (catId: string | null) => void;
  setSearch: (criteria: Partial<SearchCriteria>) => void;
  clearSearch: () => void;
  register: (user: Omit<User, 'id'> & { password?: string }) => Promise<User>;
  login: (email: string, password?: string) => Promise<User>;
  logout: () => void;
  toggleFavorite: (cabinId: string) => Promise<void>;
  addReservation: (reservation: Omit<Reservation, 'id' | 'createdAt'>) => Promise<Reservation>;
  addReview: (review: Omit<Review, 'id' | 'date'>) => Promise<Review>;
  refreshEmails: () => void;
  setAdminMessage: (msg: string | null) => void;
  setAdminSubTab: (tab: 'properties' | 'categories' | 'features' | 'users' | 'reservations') => void;

  // DB reloads for admin edits
  reloadDatabase: () => Promise<void>;
  refreshUser: (user: User | null) => void;
  backendStatus: BackendStatus;
  backendMessage: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const storedUser = window.localStorage.getItem('rr_logged_in_user');
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser) as User;
    } catch {
      return null;
    }
  });
  const [currentView, setCurrentViewState] = useState<ViewState>('home');
  const [selectedCabinId, setSelectedCabinId] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [adminSubTab, setAdminSubTab] = useState<'properties' | 'categories' | 'features' | 'users' | 'reservations'>('properties');

  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    city: '',
    checkIn: '',
    checkOut: '',
    guests: 1
  });

  const [favorites, setFavorites] = useState<string[]>([]);
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [sentEmails, setSentEmails] = useState<OutgoingEmail[]>([]);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('online');
  const [backendMessage, setBackendMessage] = useState<string | null>(null);

  const reloadDatabase = async () => {
    try {
      const userId = user?.id;
      const [fetchedCabins, fetchedCategories, fetchedFeatures] = await Promise.all([
        ApiClient.getCabinsSearch(),
        ApiClient.getCategories(),
        ApiClient.getFeatures(),
      ]);

      const fetchedReservations = userId ? await ApiClient.getReservationsByUserId(userId) : [];
      const fetchedReviews: Review[] = [];

      setBackendStatus('online');
      setBackendMessage(null);
      setCabins(fetchedCabins);
      setCategories(fetchedCategories);
      setFeatures(fetchedFeatures);
      setAllReservations(fetchedReservations);
      setAllReviews(fetchedReviews);
      setSentEmails([]);

      if (userId) {
        const nextFavorites = await ApiClient.getFavoritesByUserId(userId);
        setFavorites(nextFavorites);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Unable to reload backend data.', error);
      const message = error instanceof Error ? error.message : 'El backend no está respondiendo en este momento.';
      setBackendStatus('offline');
      setBackendMessage(`No se pudo cargar la información del backend. ${message}`);
      setCabins([]);
      setCategories([]);
      setFeatures([]);
      setAllReservations([]);
      setAllReviews([]);
      setSentEmails([]);
      setFavorites([]);
    }
  };

  useEffect(() => {
    void reloadDatabase();

    return () => {
      // No-op: the app now relies on backend responses only.
    };
  }, [user]);

  const setView = (view: ViewState, cabinId: string | null = null) => {
    setCurrentViewState(view);
    if (cabinId) setSelectedCabinId(cabinId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setCategoryFilter = (catId: string | null) => {
    setSelectedCategoryFilter(catId);
  };

  const setSearch = (criteria: Partial<SearchCriteria>) => {
    setSearchCriteria(prev => ({ ...prev, ...criteria }));
  };

  const clearSearch = () => {
    setSearchCriteria({
      city: '',
      checkIn: '',
      checkOut: '',
      guests: 1
    });
  };

  const refreshUser = (nextUser: User | null) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem('rr_logged_in_user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('rr_logged_in_user');
    }
  };

  const register = async (userInfo: Omit<User, 'id'> & { password?: string }) => {
    const newUser = await ApiClient.register(userInfo);
    await reloadDatabase();
    return newUser;
  };

  const login = async (email: string, password?: string) => {
    const { user: loggedInUser } = await ApiClient.login(email, password);
    refreshUser(loggedInUser);
    const nextFavorites = await ApiClient.getFavoritesByUserId(loggedInUser.id);
    setFavorites(nextFavorites);
    await reloadDatabase();
    return loggedInUser;
  };

  const logout = () => {
    ApiClient.clearToken();
    refreshUser(null);
    setFavorites([]);
    setCurrentViewState('home');
  };

  const toggleFavorite = async (cabinId: string) => {
    if (!user) {
      setAdminMessage("Por favor, inicia sesión para poder guardar tus cabañas favoritas.");
      setCurrentViewState('login');
      return;
    }
    const nextFavorites = await ApiClient.toggleFavorite(user.id, cabinId);
    setFavorites(nextFavorites);
    await reloadDatabase();
  };

  const addReservation = async (reservation: Omit<Reservation, 'id' | 'createdAt'>) => {
    const res = await ApiClient.createReservation(reservation);
    await reloadDatabase();
    return res;
  };

  const addReview = async (review: Omit<Review, 'id' | 'date'>) => {
    const rev = await ApiClient.createReview(review);
    await reloadDatabase();
    return rev;
  };

  const refreshEmails = () => {
    setSentEmails([]);
  };

  return (
    <AppContext.Provider value={{
      user,
      currentView,
      selectedCabinId,
      selectedCategoryFilter,
      searchCriteria,
      favorites,
      cabins,
      categories,
      features,
      allReservations,
      allReviews,
      sentEmails,
      adminMessage,
      adminSubTab,
      setView,
      setCategoryFilter,
      setSearch,
      clearSearch,
      register,
      login,
      logout,
      toggleFavorite,
      addReservation,
      addReview,
      refreshEmails,
      setAdminMessage,
      setAdminSubTab,
      reloadDatabase,
      refreshUser,
      backendStatus,
      backendMessage
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
