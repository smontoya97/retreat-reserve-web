/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { THEME_CLASSES } from '../styles/tokens';
import { Search, Calendar, Users, Heart, Star, Compass, RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, Trees, Sparkles, MapPin } from 'lucide-react';

export const Home: React.FC = () => {
  const {
    cabins,
    categories,
    selectedCategoryFilter,
    setCategoryFilter,
    searchCriteria,
    setSearch,
    user,
    favorites,
    toggleFavorite,
    setView
  } = useApp();

  const searchFormRef = useRef<HTMLFormElement>(null);

  // Search input state
  const [cityInput, setCityInput] = useState(searchCriteria.city);
  const [showSuggest, setShowSuggest] = useState(false);
  const [checkIn, setCheckIn] = useState(searchCriteria.checkIn);
  const [checkOut, setCheckOut] = useState(searchCriteria.checkOut);
  const [guestsCount, setGuestsCount] = useState(searchCriteria.guests);
  const [showCalendar, setShowCalendar] = useState(false);

  // Click outside to close custom calendar & recommendations dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchFormRef.current && !searchFormRef.current.contains(event.target as Node)) {
        setShowSuggest(false);
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatDateNice = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return `${parseInt(day)} ${months[parseInt(month) - 1]}`;
  };

  const handleDateClick = (dateStr: string) => {
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(dateStr);
      setCheckOut('');
    } else {
      const inTime = new Date(checkIn).getTime();
      const clickTime = new Date(dateStr).getTime();
      if (clickTime > inTime) {
        setCheckOut(dateStr);
        setShowCalendar(false);
      } else {
        setCheckIn(dateStr);
        setCheckOut('');
      }
    }
  };

  const renderCustomCalendarMonth = (year: number, month: number, monthName: string) => {
    const days = [];
    const date = new Date(year, month, 1);
    const startDay = date.getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(d);
    }

    return (
      <div className="flex-1 min-w-[200px]" key={monthName}>
        <div className="text-center font-bold text-xs uppercase tracking-wider text-[#1F5937] mb-2">
          {monthName} {year}
        </div>
        <div className="grid grid-cols-7 gap-1 text-[10px] text-center font-bold text-gray-400 mb-1">
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, idx) => (
            <span key={idx} className="w-7 h-5 flex items-center justify-center">{day}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs">
          {days.map((dayNum, idx) => {
            if (dayNum === null) {
              return <div key={`empty-${idx}`} className="w-7 h-7"></div>;
            }

            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
            const isCheckInValue = checkIn === dateStr;
            const isCheckOutValue = checkOut === dateStr;

            let isInRange = false;
            if (checkIn && checkOut) {
              const checkInTime = new Date(checkIn).getTime();
              const checkOutTime = new Date(checkOut).getTime();
              const currTime = new Date(dateStr).getTime();
              isInRange = currTime > checkInTime && currTime < checkOutTime;
            }

            const isToday = dateStr === "2026-05-28";

            let dayStyle = "text-gray-700 hover:bg-emerald-50 rounded-lg cursor-pointer transition w-7 h-7 flex items-center justify-center text-[11px] font-medium";
            if (isCheckInValue || isCheckOutValue) {
              dayStyle = "bg-[#1F5937] text-white font-bold rounded-lg cursor-pointer transition scale-105 shadow-sm w-7 h-7 flex items-center justify-center text-[11px]";
            } else if (isInRange) {
              dayStyle = "bg-emerald-50 text-[#1F5937] font-semibold rounded-none cursor-pointer transition w-7 h-7 flex items-center justify-center text-[11px]";
            } else if (isToday) {
              dayStyle = "border border-[#8DB600] text-[#1F2937] rounded-lg font-bold cursor-pointer transition bg-emerald-50/10 w-7 h-7 flex items-center justify-center text-[11px]";
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleDateClick(dateStr)}
                className={dayStyle}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Pagination page state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4; // Use 4 so the user can see pagination working immediately! 

  // Pre-seed search suggestions
  const SUGGESTED_LOCATIONS = ["Valle de Bravo, Estado de México", "Mazamitla, Jalisco", "Tapalpa, Jalisco", "Huasca de Ocampo, Hidalgo"];

  const filteredSuggestions = useMemo(() => {
    if (!cityInput) return SUGGESTED_LOCATIONS;
    return SUGGESTED_LOCATIONS.filter(loc => loc.toLowerCase().includes(cityInput.toLowerCase()));
  }, [cityInput]);

  // Seed randomized shuffle order once on mount or keep consistent
  const randomizedCabins = useMemo(() => {
    // Return all cabins filtered by category and search
    let list = [...cabins];

    if (selectedCategoryFilter) {
      list = list.filter(c => c.categoryId === selectedCategoryFilter);
    }

    if (searchCriteria.city) {
      list = list.filter(c =>
        c.city.toLowerCase().includes(searchCriteria.city.toLowerCase()) ||
        c.state.toLowerCase().includes(searchCriteria.city.toLowerCase())
      );
    }

    if (searchCriteria.guests) {
      list = list.filter(c => c.maxGuests >= searchCriteria.guests);
    }

    return list;
  }, [cabins, selectedCategoryFilter, searchCriteria]);

  // Pagination logic
  const totalPages = Math.ceil(randomizedCabins.length / ITEMS_PER_PAGE) || 1;
  const paginatedCabins = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return randomizedCabins.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [randomizedCabins, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch({
      city: cityInput,
      checkIn,
      checkOut,
      guests: guestsCount
    });
    setCurrentPage(1);
    setShowSuggest(false);
  };

  const handleClearFilters = () => {
    setCategoryFilter(null);
    setCityInput('');
    setCheckIn('');
    setCheckOut('');
    setGuestsCount(1);
    setSearch({
      city: '',
      checkIn: '',
      checkOut: '',
      guests: 1
    });
    setCurrentPage(1);
  };

  const calculateAverageRating = (cabin: { averageRating?: number }) => {
    return cabin.averageRating ?? 0;
  };

  const getReviewCount = (cabin: { totalReviews?: number }) => {
    return cabin.totalReviews ?? 0;
  };

  return (
    <div className="min-h-screen bg-white pb-16">

      {/* 1. HERO & SEARCH BLOCK (Historial 22 - Realizar búsqueda) */}
      <div className="relative w-full py-16 px-4 md:py-24 z-20" id="hero-outer-container">
        {/* Rounded background element with overflow-hidden for the image, while main container allows z-index dropdown overflow */}
        <div
          className="absolute inset-0 bg-slate-900 rounded-t-xl md:rounded-t-[20px] rounded-b-[20px] md:rounded-b-[28px] overflow-hidden shadow-sm pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(31, 89, 55, 0.4), rgba(15, 23, 42, 0.85)), url("https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&w=1600&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />

        {/* Content over the background */}
        <div className="relative z-10 max-w-4xl mx-auto text-center text-white space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8DB600]/25 text-[#F4E9D9] text-xs font-semibold uppercase tracking-wider border border-[#8DB600]/30 animate-pulse">
            <Sparkles size={12} />
            Tu refugio en la naturaleza te está esperando
          </span>
          <h2 className="font-sans text-3xl font-extrabold tracking-tight md:text-5xl lg:text-6xl text-white drop-shadow-md">
            Escápate de la rutina y <br className="hidden md:inline" />
            <span className="text-[#8DB600]">reconecta</span> en la naturaleza
          </h2>
          <p className="text-white/80 max-w-xl mx-auto text-sm md:text-base font-light">
            Descubre cabañas rústicas y lodges premium para escapadas únicas. Ingresa tus fechas y encuentra tu espacio de paz.
          </p>

          {/* Search form box */}
          <form
            ref={searchFormRef}
            onSubmit={handleSearchSubmit}
            className="bg-white text-gray-800 p-5 md:p-6 lg:p-7 rounded-[26px] shadow-2xl flex flex-col lg:flex-row gap-4 items-stretch lg:items-center border border-gray-100 max-w-5xl mx-auto mt-8 text-left relative z-20"
          >
            {/* Destination Selection */}
            <div className="flex-[1.5] min-w-0 relative">
              <label className="text-[10px] font-bold uppercase text-[#8DB600] tracking-wider block mb-1">¿A dónde quieres ir?</label>
              <div className="flex items-center border border-[#E5E7EB] hover:border-[#1F5937] rounded-xl px-3.5 py-2.5 bg-gray-50/50 transition">
                <MapPin className="text-gray-400 mr-2 shrink-0" size={16} />
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => { setCityInput(e.target.value); setShowSuggest(true); }}
                  onFocus={() => { setShowSuggest(true); setShowCalendar(false); }}
                  placeholder="Ubicación (ej: Valle de Bravo)"
                  className="w-full text-xs text-slate-800 focus:outline-none bg-transparent"
                />
              </div>

              {/* Suggestions dropdown dropdown list */}
              {showSuggest && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto py-1.5">
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Destinos Populares</div>
                  {filteredSuggestions.map((loc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCityInput(loc);
                        setShowSuggest(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-[#1F2937] hover:bg-emerald-50 transition cursor-pointer flex items-center justify-between"
                    >
                      <span>🌲 {loc}</span>
                      <span className="text-[9px] uppercase tracking-wide bg-emerald-100 text-[#1F5937] px-1.5 py-0.5 rounded">Explorar</span>
                    </button>
                  ))}
                  {filteredSuggestions.length === 0 && (
                    <div className="px-4 py-3 text-xs text-gray-500">Ninguna cabaña coincide exactamente. Escribe tu palabra para buscar en las descripciones.</div>
                  )}
                </div>
              )}
            </div>

            {/* Date Range Selection (Mock double calendar input) */}
            <div className="flex-[1.8] min-w-0 relative">
              <label className="text-[10px] font-bold uppercase text-[#8DB600] tracking-wider block mb-1">Fechas (Rango)</label>
              <div
                onClick={() => { setShowCalendar(!showCalendar); setShowSuggest(false); }}
                className="grid grid-cols-2 gap-2 cursor-pointer"
              >
                <div className="flex items-center border border-[#E5E7EB] hover:border-[#1F5937] rounded-xl px-3 py-2.5 bg-gray-50/50 transition truncate">
                  <Calendar className="text-gray-400 mr-2 shrink-0" size={15} />
                  <span className="text-xs text-slate-700 font-medium select-none truncate">
                    {checkIn ? formatDateNice(checkIn) : "Entrada"}
                  </span>
                </div>
                <div className="flex items-center border border-[#E5E7EB] hover:border-[#1F5937] rounded-xl px-3 py-2.5 bg-gray-50/50 transition truncate">
                  <Calendar className="text-gray-400 mr-2 shrink-0" size={15} />
                  <span className="text-xs text-slate-700 font-medium select-none truncate">
                    {checkOut ? formatDateNice(checkOut) : "Salida"}
                  </span>
                </div>
              </div>

              {/* Floating Custom Calendar Popover */}
              {showCalendar && (
                <div className="absolute right-0 left-0 lg:left-auto lg:right-0 mt-3 bg-white border border-gray-150 rounded-2xl shadow-2xl p-6 z-40 w-full sm:w-[500px] flex flex-col gap-4 animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {renderCustomCalendarMonth(2026, 4, "Mayo")}
                    {renderCustomCalendarMonth(2026, 5, "Junio")}
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => { setCheckIn(''); setCheckOut(''); }}
                      className="text-xs text-gray-400 hover:text-red-500 font-bold transition cursor-pointer"
                    >
                      Limpiar fechas
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCalendar(false)}
                      className="bg-[#1F5937] hover:bg-[#143B24] text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Aceptar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Guests count selection */}
            <div className="w-full lg:w-44">
              <label className="text-[10px] font-bold uppercase text-[#8DB600] tracking-wider block mb-1">Huéspedes</label>
              <div className="flex items-center border border-[#E5E7EB] hover:border-[#1F5937] rounded-xl px-3 py-2.5 bg-gray-50/50 transition">
                <Users className="text-gray-400 mr-2 shrink-0" size={16} />
                <select
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(Number(e.target.value))}
                  className="w-full text-xs text-slate-800 focus:outline-none bg-transparent cursor-pointer"
                >
                  <option value={1}>1 huésped</option>
                  <option value={2}>2 huéspedes</option>
                  <option value={4}>4 huéspedes</option>
                  <option value={6}>6 huéspedes</option>
                  <option value={8}>8 huéspedes+</option>
                </select>
              </div>
            </div>

            {/* Search Submit Button */}
            <div className="pt-5 flex items-end">
              <button
                type="submit"
                className="w-full lg:w-auto bg-[#1F5937] hover:bg-[#143B24] text-white font-bold px-6 py-3 rounded-xl transition duration-200 shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer h-11"
              >
                <Search size={16} />
                <span>Buscar</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-12 relative z-10">

        {/* 2. CATEGORIES FILTER SHELF (Historial 20 - Crear sección de categorías) */}
        <div className="bg-[#F5F5F5] p-5 rounded-2xl border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#1F5937] flex items-center gap-1.5">
                <Compass size={16} /> Explora por categorías
              </h3>
              <p className="text-xs text-gray-500">Haz clic en una categoría para filtrar nuestro catálogo en tiempo real</p>
            </div>

            {(selectedCategoryFilter || searchCriteria.city) && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-red-600 hover:text-red-800 hover:underline flex items-center gap-1 font-bold cursor-pointer"
              >
                <RefreshCw size={12} /> Limpiar Filtros
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setCategoryFilter(null)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 border ${!selectedCategoryFilter ? 'bg-[#1F5937] text-white border-transparent' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
            >
              ⭐ Ver Todas
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategoryFilter(isSelected ? null : cat.id);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 border ${isSelected ? 'bg-[#1F5937] text-white border-transparent' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                >
                  <Trees size={14} className={isSelected ? 'text-[#F4E9D9]' : 'text-[#1F5937]'} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. PRODUCT RECOMMENDATIONS SECTION (Historial 4 & 8) */}
        <div>
          <div className="flex flex-col sm:row sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-200 pb-4 mb-6">
            <div>
              <h3 className="font-sans text-xl font-bold text-[#1F2937] tracking-tight">
                {selectedCategoryFilter
                  ? `Cabañas en categoría: ${categories.find(c => c.id === selectedCategoryFilter)?.name}`
                  : searchCriteria.city
                    ? `Resultados para su búsqueda: "${searchCriteria.city}"`
                    : "Cabañas recomendadas para ti"}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Mostrando {randomizedCabins.length} cabañas de lujo de {cabins.length} totales disponibles
              </p>
            </div>

            {/* active badges indicating filters */}
            <div className="flex gap-2.5 flex-wrap">
              {selectedCategoryFilter && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F4E9D9] text-[#1F5937] px-2.5 py-1 rounded">
                  Filtro: {categories.find(c => c.id === selectedCategoryFilter)?.name}
                </span>
              )}
              {searchCriteria.city && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F4E9D9] text-[#1F5937] px-2.5 py-1 rounded">
                  Lugar: {searchCriteria.city}
                </span>
              )}
            </div>
          </div>

          {paginatedCabins.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[1600px] overflow-hidden">
              {paginatedCabins.map((cabin) => {
                const isFavorite = favorites.includes(cabin.id);
                const average = calculateAverageRating(cabin);
                const reviewsCount = getReviewCount(cabin);

                return (
                  <div
                    key={cabin.id}
                    className="group bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-fit relative cursor-pointer"
                  >

                    {/* Cabin Image slot */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                      <img
                        src={cabin.imageUrls[0]}
                        alt={cabin.name}
                        referrerPolicy="no-referrer"
                        onClick={() => setView('detail', cabin.id)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Floating Category badge */}
                      <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-xs font-bold text-[#1F5937] px-3 py-1.5 rounded-xl shadow-sm border border-emerald-50">
                        {categories.find(cat => cat.id === cabin.categoryId)?.name || "Cabaña"}
                      </span>

                      {/* FAVORITES HEART BUTTON (Historial 24 - Marcar favorito con un solo clic) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(cabin.id);
                        }}
                        className="absolute top-4 right-4 p-2.5 bg-white/95 rounded-full shadow hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all cursor-pointer focus:outline-none"
                      >
                        <Heart
                          size={18}
                          className="transition-transform active:scale-125"
                          fill={isFavorite ? '#EF4444' : 'none'}
                          stroke={isFavorite ? '#EF4444' : '#9CA3AF'}
                        />
                      </button>

                      {/* Display Location Overlay */}
                      <div className="absolute bottom-4 left-4 bg-[#1F2937]/80 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded">
                        📍 {cabin.city}, {cabin.state}
                      </div>
                    </div>

                    {/* Content Slot */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h4
                            onClick={() => setView('detail', cabin.id)}
                            className="font-sans text-lg font-bold text-[#1F2937] hover:text-[#1F5937] transition-colors leading-snug"
                          >
                            {cabin.name}
                          </h4>
                          <div className="flex items-center gap-1 shrink-0 bg-[#F4E9D9]/50 px-2 py-0.5 rounded text-xs font-bold text-[#1F5937]">
                            <Star size={13} fill="#8DB600" stroke="none" />
                            <span>{average.toFixed(1)}</span>
                          </div>
                        </div>

                        <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
                          {cabin.description}
                        </p>

                        {/* Capacities */}
                        <div className="flex gap-4 pt-1 text-[11px] text-[#8DB600] font-bold">
                          <span>🚪 {cabin.numberOfBedrooms} Hab.</span>
                          <span>🛁 {cabin.numberOfBathrooms} Baños</span>
                          <span>👥 {cabin.maxGuests} Huéspedes máx</span>
                        </div>
                      </div>

                      {/* Card Price / Button bar */}
                      <div className="border-t border-gray-100 pt-4 mt-4 flex justify-between items-center bg-gray-50/50 -mx-5 -mb-5 p-5">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-none">Precio por noche</p>
                          <p className="text-xl font-extrabold text-[#1F2937]">
                            ${cabin.pricePerNight} <span className="text-xs text-gray-400 font-normal">/ noche</span>
                          </p>
                        </div>
                        <button
                          onClick={() => setView('detail', cabin.id)}
                          className={`${THEME_CLASSES.btnPrimary} !py-2 !px-4 text-xs tracking-wider cursor-pointer`}
                        >
                          Ver Detalles
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#F5F5F5] border border-gray-200 rounded-2xl p-12 text-center max-w-xl mx-auto flex flex-col items-center space-y-4">
              <Trees className="text-gray-400 animate-pulse" size={48} />
              <h4 className="font-bold text-[#1F2937]">Cabañas bajo este filtro no encontradas</h4>
              <p className="text-xs text-gray-500 max-w-md">No disponemos de opciones que coincidan exactamente con tus criterios actuales en la base de datos local. Intenta restablecer los filtros para volver a ver todo nuestro catálogo original.</p>
              <button
                onClick={handleClearFilters}
                className={THEME_CLASSES.btnOutline}
              >
                Limpiar todos los filtros
              </button>
            </div>
          )}

          {/* 4. PAGINATION COUNTER (Historial 8) */}
          {randomizedCabins.length > ITEMS_PER_PAGE && (
            <div className="mt-12 flex justify-center items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
                title="Ir al inicio"
              >
                <ChevronsLeft size={16} />
              </button>

              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 text-[#1F2937] font-semibold disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer flex items-center gap-1.5 text-xs"
              >
                <ChevronLeft size={14} /> Atrás
              </button>

              {/* Page numbers list */}
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition cursor-pointer ${currentPage === i + 1 ? 'bg-[#1F5937] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 text-[#1F2937] font-semibold disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer flex items-center gap-1.5 text-xs"
              >
                Siguiente <ChevronRight size={14} />
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
