/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trees, Compass, Heart, CalendarRange, User as UserIcon, LogOut, Settings2, Menu, X } from 'lucide-react';
import { Logo } from './Logo';

export const Header: React.FC = () => {
  const { user, currentView, setView, logout } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name?: string, lastName?: string) => {
    const firstInitial = String(name || '').trim().charAt(0).toUpperCase();
    const secondInitial = String(lastName || '').trim().charAt(0).toUpperCase();
    const initials = `${firstInitial}${secondInitial}`.trim();
    return initials || 'US';
  };

  const navigateTo = (view: any) => {
    setView(view);
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E5E7EB] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

        {/* Logo & Slogan (Alineado a la izquierda) */}
        <div
          onClick={() => navigateTo('home')}
          className="cursor-pointer group flex items-center transition-all duration-300 hover:opacity-90 active:scale-98"
        >
          <Logo mode="light" layout="horizontal" iconSize={40} />
        </div>

        {/* Desktop Navigation (Center/Right info blocks) */}
        <div className="hidden md:flex items-center space-x-6">
          <button
            onClick={() => navigateTo('home')}
            className={`font-medium text-sm transition-colors cursor-pointer ${currentView === 'home' ? 'text-[#1F5937]' : 'text-gray-600 hover:text-[#1F5937]'}`}
          >
            Explorar
          </button>

          {user && (
            <>
              <button
                onClick={() => navigateTo('favorites')}
                className={`font-medium text-sm transition-colors flex items-center gap-1.5 cursor-pointer ${currentView === 'favorites' ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}
              >
                <Heart size={16} fill={currentView === 'favorites' ? 'currentColor' : 'none'} />
                Favoritos
              </button>
              <button
                onClick={() => navigateTo('reservations')}
                className={`font-medium text-sm transition-colors flex items-center gap-1.5 cursor-pointer ${currentView === 'reservations' ? 'text-[#1F5937]' : 'text-gray-600 hover:text-[#1F5937]'}`}
              >
                <CalendarRange size={16} />
                Mis Reservas
              </button>
            </>
          )}

          {/* User action cluster */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-3 p-1.5 bg-[#F5F5F5] hover:bg-[#F4E9D9] rounded-full transition-colors cursor-pointer focus:outline-none"
              >
                <div className="w-10 h-10 rounded-full bg-[#1F5937] text-white flex items-center justify-center font-bold text-sm tracking-wider border-2 border-white shadow-sm">
                  {getInitials(user.name, user.lastName)}
                </div>
                <div className="text-left pr-2">
                  <p className="text-xs text-gray-400 font-medium">Hola,</p>
                  <p className="text-sm font-semibold text-[#1F2937]">{user.name || 'Usuario'}</p>
                </div>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-56 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="px-4 py-2 border-b border-[#E5E7EB] bg-gray-50/50">
                    <p className="text-xs text-gray-400">Sesión iniciada como</p>
                    <p className="text-sm font-bold truncate text-[#1F2937]">{user.email || 'correo@ejemplo.com'}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                      {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </span>
                  </div>

                  {user.role === 'admin' && (
                    <button
                      onClick={() => navigateTo('admin')}
                      className="w-full text-left px-4 py-2 text-sm text-[#1F5937] font-semibold hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Settings2 size={16} />
                      Panel de Administración
                    </button>
                  )}

                  <button
                    onClick={() => navigateTo('profile')}
                    className="w-full text-left px-4 py-2 text-sm text-[#1F2937] hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                  >
                    <UserIcon size={16} className="text-gray-400" />
                    Mi Perfil
                  </button>

                  <button
                    onClick={() => navigateTo('favorites')}
                    className="w-full text-left px-4 py-2 text-sm text-[#1F2937] hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Heart size={16} className="text-gray-400" />
                    Mis Favoritos
                  </button>

                  <button
                    onClick={() => navigateTo('reservations')}
                    className="w-full text-left px-4 py-2 text-sm text-[#1F2937] hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                  >
                    <CalendarRange size={16} className="text-gray-400" />
                    Mis Reservas
                  </button>

                  <hr className="my-1 border-gray-100" />

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <LogOut size={16} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigateTo('login')}
                className="text-sm font-semibold text-gray-700 hover:text-[#1F5937] px-4 py-2 transition-colors cursor-pointer"
              >
                Iniciar sesión
              </button>
              <button
                onClick={() => navigateTo('register')}
                className="text-sm font-semibold bg-[#1F5937] text-white hover:bg-[#143B24] px-5 py-2 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                Crear cuenta
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center space-x-3">
          {user && (
            <div className="w-9 h-9 rounded-full bg-[#1F5937] text-white flex items-center justify-center font-bold text-xs shadow-inner">
              {getInitials(user.name, user.lastName)}
            </div>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-[#1F2937] cursor-pointer"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#E5E7EB] py-4 px-4 space-y-3 shadow-inner">
          <button
            onClick={() => navigateTo('home')}
            className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 cursor-pointer"
          >
            <Compass size={16} /> Explorar Cabañas
          </button>

          {user ? (
            <>
              {user.role === 'admin' && (
                <button
                  onClick={() => navigateTo('admin')}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-[#1F5937] hover:bg-[#F4E9D9] rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <Settings2 size={16} /> Panel de Administración
                </button>
              )}
              <button
                onClick={() => navigateTo('profile')}
                className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 cursor-pointer"
              >
                <UserIcon size={16} /> Mi Perfil
              </button>
              <button
                onClick={() => navigateTo('favorites')}
                className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 cursor-pointer"
              >
                <Heart size={16} className="text-red-500" /> Mis Favoritos
              </button>
              <button
                onClick={() => navigateTo('reservations')}
                className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 cursor-pointer"
              >
                <CalendarRange size={16} /> Mis Reservas
              </button>
              <hr className="border-gray-100" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 cursor-pointer"
              >
                <LogOut size={16} /> Cerrar Sesión
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => navigateTo('login')}
                className="text-center font-semibold text-gray-700 hover:bg-gray-100 rounded-lg py-2 text-sm cursor-pointer"
              >
                Iniciar sesión
              </button>
              <button
                onClick={() => navigateTo('register')}
                className="text-center font-semibold bg-[#1F5937] text-white hover:bg-[#143B24] rounded-xl py-2 text-sm cursor-pointer"
              >
                Crear cuenta
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
