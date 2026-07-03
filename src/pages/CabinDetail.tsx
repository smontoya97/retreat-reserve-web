/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { THEME_CLASSES } from '../styles/tokens';
import { 
  ArrowLeft, Star, Heart, Share2, Wifi, Utensils, Flame, Car, Tv, Compass, Snowflake, ShieldCheck, 
  Calendar, Users, AlertTriangle, CheckCircle2, X, Send, MapPin, ChevronLeft, ChevronRight, MessageCircle
} from 'lucide-react';
import { ApiClient } from '../services/api';

export const CabinDetail: React.FC = () => {
  const { 
    selectedCabinId, 
    setView, 
    user, 
    favorites, 
    toggleFavorite, 
    categories, 
    features,
    cabins,
    addReservation,
    addReview,
    allReservations,
    allReviews,
    setAdminMessage
  } = useApp();

  const cabin = useMemo(() => {
    if (!selectedCabinId) return null;
    return cabins.find((item) => item.id === selectedCabinId) || null;
  }, [cabins, selectedCabinId]);

  const bookingFormRef = useRef<HTMLDivElement>(null);

  // Click outside to close custom calendar popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bookingFormRef.current && !bookingFormRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Gallery Modal Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Sharing Modal
  const [shareOpen, setShareOpen] = useState(false);
  const [customShareMessage, setCustomShareMessage] = useState('¡Miren esta increíble cabaña que encontré para mis vacaciones!');

  // Calendar Booking Status & Error Sim
  const [dbFail, setDbFail] = useState(false);
  const [dateIn, setDateIn] = useState('');
  const [dateOut, setDateOut] = useState('');
  const [guestsCount, setGuestsCount] = useState(2);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdResId, setCreatedResId] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const formatDateNice = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return `${parseInt(day)} ${months[parseInt(month) - 1]}`;
  };

  const handleDateClick = (dateStr: string) => {
    if (!dateIn || (dateIn && dateOut)) {
      setDateIn(dateStr);
      setDateOut('');
    } else {
      const inTime = new Date(dateIn).getTime();
      const clickTime = new Date(dateStr).getTime();
      if (clickTime > inTime) {
        setDateOut(dateStr);
        setShowCalendar(false);
      } else {
        setDateIn(dateStr);
        setDateOut('');
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
      <div className="flex-1 min-w-[160px]" key={monthName}>
        <div className="text-center font-bold text-xs uppercase tracking-wider text-[#1F5937] mb-2">
          {monthName} {year}
        </div>
        <div className="grid grid-cols-7 gap-1 text-[9px] text-center font-bold text-gray-400 mb-1">
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, idx) => (
            <span key={idx} className="w-6 h-5 flex items-center justify-center">{day}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs">
          {days.map((dayNum, idx) => {
            if (dayNum === null) {
              return <div key={`empty-${idx}`} className="w-6 h-6"></div>;
            }

            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
            const isCheckInValue = dateIn === dateStr;
            const isCheckOutValue = dateOut === dateStr;
            
            let isInRange = false;
            if (dateIn && dateOut) {
              const checkInTime = new Date(dateIn).getTime();
              const checkOutTime = new Date(dateOut).getTime();
              const currTime = new Date(dateStr).getTime();
              isInRange = currTime > checkInTime && currTime < checkOutTime;
            }

            const isToday = dateStr === "2026-05-28";
            const isOccupied = occupiedDatesList.includes(dateStr);

            let dayStyle = "text-gray-700 hover:bg-emerald-50 rounded-md cursor-pointer transition w-6 h-6 flex items-center justify-center text-[9px] font-medium";
            if (isOccupied) {
              dayStyle = "bg-red-50 text-red-400 line-through rounded-md w-6 h-6 flex items-center justify-center text-[9px] cursor-not-allowed opacity-40";
            } else if (isCheckInValue || isCheckOutValue) {
              dayStyle = "bg-[#1F5937] text-white font-bold rounded-md cursor-pointer transition scale-105 shadow-sm w-6 h-6 flex items-center justify-center text-[9px]";
            } else if (isInRange) {
              dayStyle = "bg-emerald-50 text-[#1F5937] font-semibold rounded-none cursor-pointer transition w-6 h-6 flex items-center justify-center text-[9px]";
            } else if (isToday) {
              dayStyle = "border border-[#8DB600] text-[#1F5937] rounded-md font-bold cursor-pointer transition bg-emerald-50/10 w-6 h-6 flex items-center justify-center text-[9px]";
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isOccupied}
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

  // Review Form
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  if (!cabin) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle size={48} className="text-red-500 mx-auto" />
        <h3 className="text-lg font-bold">Cabaña no encontrada</h3>
        <button onClick={() => setView('home')} className={THEME_CLASSES.btnPrimary}>Volver al Home</button>
      </div>
    );
  }

  // Hydrate Reviews in real-time
  const cabinReviews = useMemo(() => {
    return allReviews.filter(r => r.cabinId === cabin.id);
  }, [allReviews, cabin.id]);

  const averageRating = useMemo(() => {
    if (cabinReviews.length === 0) return 4.5;
    const sum = cabinReviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / cabinReviews.length).toFixed(1));
  }, [cabinReviews]);

  // Hydrate occupied dates for calendar highlighting
  const occupiedDatesList = useMemo(() => {
    const dates: string[] = [];
    allReservations.forEach(r => {
      if (r.cabinId === cabin.id && r.status !== 'cancelled') {
        let start = new Date(r.checkInDate);
        const end = new Date(r.checkOutDate);
        while (start <= end) {
          dates.push(start.toISOString().split('T')[0]);
          start.setDate(start.getDate() + 1);
        }
      }
    });
    return dates;
  }, [allReservations, cabin.id]);

  const isFavorite = favorites.includes(cabin.id);

  // Feature icon mapping helper
  const renderFeatureIcon = (key: string) => {
    const props = { size: 18, className: "text-[#1F5937]" };
    switch (key) {
      case 'wifi': return <Wifi {...props} />;
      case 'utensils': return <Utensils {...props} />;
      case 'flame': return <Flame {...props} />;
      case 'car': return <Car {...props} />;
      case 'tv': return <Tv {...props} />;
      case 'compass': return <Compass {...props} />;
      case 'snowflake': return <Snowflake {...props} />;
      default: return <ShieldCheck {...props} />;
    }
  };

  // Execute Booking submit
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      // Historial 30: Si no está registrado se redirige al bloque login. El login debe contener un texto explicativo.
      setAdminMessage("⚠️ Iniciar sesión es un requisito obligatorio antes de completar tu reserva del producto en Retreat Reserve. Por favor identifícate o regístrate en segundos.");
      setView('login');
      return;
    }

    setBookingError(null);

    // Validate inputs
    if (!dateIn || !dateOut) {
      setBookingError("Por favor selecciona tanto una fecha de llegada como una de salida.");
      return;
    }

    const checkInDate = new Date(dateIn);
    const checkOutDate = new Date(dateOut);
    if (checkInDate >= checkOutDate) {
      setBookingError("La fecha de salida debe ser posterior a la fecha de llegada.");
      return;
    }

    // Verify availability check (Story 30 override)
    const available = await ApiClient.checkAvailability(cabin.id, dateIn, dateOut);
    if (!available) {
      setBookingError("⚠️ Las fechas seleccionadas se cruzan con una reserva existente. Por favor consulta el calendario de disponibilidad.");
      return;
    }

    // Calculate nights
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalAmount = nights * cabin.pricePerNight;

    try {
      const newRes = await addReservation({
        cabinId: cabin.id,
        userId: user.id,
        checkInDate: dateIn,
        checkOutDate: dateOut,
        guestsCount,
        totalAmount,
        status: 'confirmed'
      });
      setCreatedResId(newRes.id);
      setBookingSuccess(true);
    } catch (err: any) {
      setBookingError(err.message || "No se pudo crear la reserva en este momento.");
    }
  };

  // Submit Review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Por favor inicia sesión para poder puntuar la cabaña.");
      return;
    }
    await addReview({
      cabinId: cabin.id,
      userId: user.id,
      userName: `${user.name} ${user.lastName}`,
      rating: newRating,
      comment: newComment
    });
    setNewComment('');
    alert("¡Muchas gracias por tu reseña! Ha sido indexada y la calificación promedio se actualizó.");
  };

  return (
    <div className="bg-white min-h-screen pb-20">
      
      {/* 1. PUBLIC HEADER COVER (Historial 5: cubriendo 100% de la pantalla) */}
      <div className="w-full bg-[#1F5937] text-white py-6 rounded-t-xl md:rounded-t-[20px] rounded-b-[16px] md:rounded-b-[24px] overflow-hidden shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#8DB600] uppercase tracking-widest bg-emerald-950 px-2.5 py-1 rounded">
              {categories.find(c => c.id === cabin.categoryId)?.name || "Cabaña de Lujo"}
            </span>
            <h2 className="text-2xl font-black tracking-tight mt-1 flex items-center gap-2">
              {cabin.name}
            </h2>
            <p className="text-xs text-emerald-100 flex items-center gap-1 mt-1">
              📍 {cabin.address}, {cabin.city}, {cabin.state}, {cabin.country}
            </p>
          </div>
          
          {/* Back arrow right-aligned */}
          <button 
            onClick={() => setView('home')} 
            className="flex items-center gap-2 px-4 py-2 bg-emerald-800/80 hover:bg-emerald-700/80 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 border border-emerald-700"
          >
            <ArrowLeft size={14} /> Volver Atrás
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-12">
        
        {/* 2. IMAGE GALLERY GRID (Historial 6: 2x2 grid en mitad derecha en desktop; mobile stack) */}
        <div>
          <div className="relative rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-2 shadow-md">
            
            {/* Left Big main image (mitad izquierda) */}
            <div className="aspect-[4/3] w-full bg-slate-100 relative group">
              <img 
                src={cabin.imageUrls[0]} 
                alt="Main"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover cursor-pointer transition duration-300 group-hover:scale-102"
                onClick={() => { setActivePhotoIdx(0); setLightboxOpen(true); }}
              />
            </div>

            {/* Right grid: 2 filas y 2 columnas (mitad derecha en desktop) */}
            <div className="hidden lg:grid grid-cols-2 grid-rows-2 gap-2 aspect-[4/3]">
              {cabin.imageUrls.slice(1, 5).map((url, i) => (
                <div key={i} className="w-full h-full relative group overflow-hidden bg-slate-100">
                  <img 
                    src={url} 
                    alt={`Thumb ${i}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover cursor-pointer transition duration-300 group-hover:scale-105"
                    onClick={() => { setActivePhotoIdx(i + 1); setLightboxOpen(true); }}
                  />
                </div>
              ))}
            </div>

            {/* See more buttons in lower right corner */}
            <button
              onClick={() => { setActivePhotoIdx(0); setLightboxOpen(true); }}
              className="absolute bottom-4 right-4 bg-white/95 hover:bg-[#F4E9D9] text-[#1F2937] font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer border border-[#E5E7EB]"
            >
              <span>🖼️ Ver más fotos ({cabin.imageUrls.length})</span>
            </button>
          </div>
        </div>

        {/* 3. CO-SECTION SUMMARY META BLOCK */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT: Text descriptivo, características y políticas */}
          <div className="flex-1 space-y-8 min-w-0">
            
            {/* Quick meta statistics Bar */}
            <div className="bg-[#F5F5F5] p-5 rounded-2xl flex flex-wrap gap-6 text-xs text-[#1F2937] border border-gray-100 items-center justify-between">
              <div className="flex gap-4">
                <span className="font-bold">🚪 {cabin.numberOfBedrooms} Dormitorios</span>
                <span className="text-gray-300">|</span>
                <span className="font-bold">🛁 {cabin.numberOfBathrooms} Baños Completos</span>
                <span className="text-gray-300">|</span>
                <span className="font-bold">👥 Máximo {cabin.maxGuests} Huéspedes</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleFavorite(cabin.id)}
                  className="flex items-center gap-1.5 font-bold hover:text-red-500 transition cursor-pointer"
                >
                  <Heart size={16} fill={isFavorite ? '#EF4444' : 'none'} stroke={isFavorite ? '#EF4444' : '#1F2937'} />
                  <span>{isFavorite ? 'Guardado en Favoritos' : 'Guardar'}</span>
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setShareOpen(true)}
                  className="flex items-center gap-1.5 font-bold hover:text-blue-600 transition cursor-pointer"
                >
                  <Share2 size={16} />
                  <span>Compartir</span>
                </button>
              </div>
            </div>

            {/* Description Paragraph */}
            <div className="prose prose-slate">
              <h3 className="text-lg font-bold text-[#1F2937] mb-2 border-b border-gray-100 pb-2">Descripción de la propiedad</h3>
              <p className="text-sm text-gray-600 leading-relaxed font-light whitespace-pre-line">
                {cabin.description}
              </p>
            </div>

            {/* CHARACTERISTICS FEATURES PANEL (Historial 18: título "Características", íconos y responsivo) */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#1F2937] border-b border-gray-100 pb-2">Características y Servicios</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {features.filter(f => cabin.featureIds.includes(f.id)).map((feat) => (
                  <div key={feat.id} className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl hover:bg-[#F4E9D9]/35 border border-gray-100 transition-colors">
                    <div className="p-1.5 bg-white rounded-lg shadow-xs border border-gray-150">
                      {renderFeatureIcon(feat.iconKey)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1F2937]">{feat.name}</p>
                      {feat.description && <p className="text-[10px] text-gray-400 font-light">{feat.description}</p>}
                    </div>
                  </div>
                ))}
                {cabin.featureIds.length === 0 && (
                  <p className="text-xs text-gray-500">No se especificaron características específicas para esta propiedad.</p>
                )}
              </div>
            </div>

            {/* POLICIES PANEL (Historial 26: cubriendo 100%, título subrayado, columnas) */}
            <div className="w-full bg-emerald-50/45 p-6 rounded-2xl border border-emerald-100">
              <h3 className="text-lg font-black uppercase text-[#1F5937] tracking-wider mb-6 pb-1 border-b-2 border-[#1F5937] w-fit">
                <u>Políticas del producto</u>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cabin.policies.map((policy, i) => (
                  <div key={i} className="space-y-3 bg-white p-4 rounded-xl border border-emerald-100 shadow-xs">
                    <h4 className="font-bold text-xs uppercase text-[#8DB600] tracking-wider border-b border-gray-100 pb-1.5">{policy.title}</h4>
                    <ul className="space-y-2">
                      {policy.items.map((item, idx) => (
                        <li key={idx} className="text-xs text-[#1F2937] flex items-start gap-1.5 leading-relaxed">
                          <span className="text-[#1F5937] mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT: Calendar double check availability, price and reservation form (Historial 23 & 30) */}
          <div className="w-full lg:w-96 space-y-6 shrink-0 sticky top-24">
            
            {/* Price tag informational card */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-md space-y-4">
              
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-2xl font-black text-[#1F2937]">${cabin.pricePerNight}</span>
                  <span className="text-xs text-gray-500 font-medium"> / noche</span>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold px-2 py-1 rounded">
                  <Star fill="#F59E0B" stroke="none" size={14} />
                  <span>{averageRating.toFixed(1)} ({cabinReviews.length} opiniones)</span>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Booking success screen (Historial 32) */}
              {bookingSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-600 shrink-0" size={24} />
                    <h4 className="font-bold text-sm">¡Reserva Realizada con Éxito!</h4>
                  </div>
                  <p className="text-xs">Tu estancia ha sido registrada en el servidor central. Se envió un correo automatizado de seguridad con el recibo en la bandeja simuladora.</p>
                  
                  <div className="bg-white p-3 rounded border border-emerald-100 space-y-1 text-xs">
                    <p className="font-semibold text-[10px] text-gray-400 uppercase tracking-wider">Código de Confirmación</p>
                    <p className="font-mono font-bold text-sm text-[#1F5937]">RR-{createdResId.toUpperCase().split('-')[1]}</p>
                    <p className="text-gray-500 mt-1">Fechas: {dateIn} hasta {dateOut}</p>
                    <p className="text-gray-500">Cabaña: {cabin.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button 
                      onClick={() => setView('reservations')}
                      className="text-center bg-[#1F5937] hover:bg-[#143B24] text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Ir a mi historial
                    </button>
                    <button 
                      onClick={() => {
                        setBookingSuccess(false);
                        setDateIn('');
                        setDateOut('');
                      }}
                      className="text-center bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded text-xs font-bold cursor-pointer"
                    >
                      Reservar otra
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-[#8DB600] tracking-wider mb-2">Configure su Estadía</h4>
                  
                  {bookingError && (
                    <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg flex items-center gap-1.5 border border-red-150">
                      <AlertTriangle size={16} className="shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  {/* Input double calendars check-in / check-out */}
                  <div ref={bookingFormRef} className="space-y-1 relative">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Fechas de Estadía (Rango)</label>
                    <div 
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="grid grid-cols-2 gap-2 cursor-pointer"
                    >
                      <div className="flex items-center border border-gray-200 rounded-xl px-2.5 py-2.5 bg-gray-50 hover:border-[#1F5937] transition truncate">
                        <Calendar size={14} className="text-gray-400 mr-2 shrink-0" />
                        <span className="text-xs text-[#1F2937] font-medium truncate">
                          {dateIn ? formatDateNice(dateIn) : "Fecha Entrada"}
                        </span>
                      </div>
                      <div className="flex items-center border border-[#E5E7EB] hover:border-[#1F5937] rounded-xl px-2.5 py-2.5 bg-gray-50 hover:border-[#1F5937] transition truncate">
                        <Calendar size={14} className="text-gray-400 mr-2 shrink-0" />
                        <span className="text-xs text-[#1F2937] font-medium truncate">
                          {dateOut ? formatDateNice(dateOut) : "Fecha Salida"}
                        </span>
                      </div>
                    </div>

                    {/* Floating Custom Calendar Popover */}
                    {showCalendar && (
                      <div className="absolute right-0 left-0 mt-2 bg-white border border-gray-150 rounded-2xl shadow-2xl p-4 z-40 flex flex-col gap-3 animate-in fade-in slide-in-from-top-3 duration-250 w-full">
                        <div className="flex flex-col gap-4">
                          {renderCustomCalendarMonth(2026, 4, "Mayo")}
                          {renderCustomCalendarMonth(2026, 5, "Junio")}
                        </div>
                        <div className="border-t border-gray-100 pt-2.5 flex justify-between items-center bg-white">
                          <button 
                            type="button" 
                            onClick={() => { setDateIn(''); setDateOut(''); }}
                            className="text-xs text-gray-400 hover:text-red-500 font-bold transition cursor-pointer"
                          >
                            Limpiar
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setShowCalendar(false)}
                            className="bg-[#1F5937] hover:bg-[#143B24] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Cerrar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Cantidad de Huéspedes</label>
                    <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2 bg-gray-50">
                      <Users size={14} className="text-gray-400 mr-2" />
                      <select 
                        value={guestsCount} 
                        onChange={(e) => setGuestsCount(Number(e.target.value))}
                        className="text-xs text-[#1F2937] bg-transparent focus:outline-none w-full cursor-pointer"
                      >
                        {Array.from({ length: cabin.maxGuests }).map((_, i) => (
                          <option key={i} value={i + 1}>{i + 1} {i === 0 ? 'huésped' : 'huéspedes'}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {user && dateIn && dateOut && (
                    <div className="bg-amber-50/50 p-3 rounded-lg text-xs space-y-1.5 border border-amber-100">
                      <p className="font-bold text-[#1F5937]">Información del Huésped Autofill:</p>
                      <p className="text-gray-600 font-light truncate">Nombre: {user.name} {user.lastName}</p>
                      <p className="text-gray-600 font-light truncate">Email: {user.email}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className={`${THEME_CLASSES.btnPrimary} w-full py-3 mt-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer`}
                  >
                    <span>{user ? 'Confirmar Reserva' : 'Iniciar sesión para Reservar'}</span>
                  </button>
                </form>
              )}

            </div>

            {/* AVAILABILITY CALENDAR BLOCK (Historial 23) */}
            <div className="bg-[#F5F5F5] border border-gray-200 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase text-[#1F5937] tracking-wider flex items-center gap-1.5">
                  <Calendar size={14} /> Fecha de disponibilidad
                </h4>

                <button
                  type="button"
                  onClick={() => setDbFail(!dbFail)}
                  className="text-[9px] uppercase tracking-wider bg-slate-200 hover:bg-slate-300 px-1.5 h-5 rounded text-gray-600 cursor-pointer"
                  title="Simular problemas de red obteniendo calendario"
                >
                  ⚡ Fail Sim
                </button>
              </div>

              {dbFail ? (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-xs space-y-3">
                  <div className="flex items-start gap-1.5 text-red-700">
                    <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="font-bold">Error obteniendo calendario</p>
                      <p className="text-red-600">No pudimos procesar la comunicación remota con la base de datos de disponibilidad en este instante.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDbFail(false)}
                    className="w-full text-center text-xs font-semibold bg-white border border-red-300 text-red-700 hover:bg-red-50 rounded py-1.5 cursor-pointer"
                  >
                    Intentar de nuevo ahora
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] text-gray-500 leading-normal">
                    Las fechas marcadas en <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-xs"></span> rojo se encuentran actualmente reservadas y ocupadas.
                  </p>

                  {/* Simulating double calendars for May and June 2026 */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* May 2026 */}
                    <div className="bg-white p-2.5 rounded-lg border border-gray-150">
                      <p className="text-[10px] font-black uppercase text-center text-slate-700 mb-1">Mayo 2026</p>
                      <div className="grid grid-cols-7 gap-1 text-[8px] text-center font-bold">
                        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, idx) => (
                          <span key={idx} className="text-gray-400">{day}</span>
                        ))}
                        {/* Days: starts on Friday(5) */}
                        {Array.from({ length: 4 }).map((_, i) => <span key={`empty-${i}`}></span>)}
                        {Array.from({ length: 31 }).map((_, i) => {
                          const dayNum = i + 1;
                          const dateKey = `2026-05-${dayNum.toString().padStart(2, '0')}`;
                          const isOccupied = occupiedDatesList.includes(dateKey);
                          return (
                            <span 
                              key={i} 
                              className={`py-1 rounded-sm ${isOccupied ? 'bg-red-500 text-white font-black' : 'bg-gray-100 text-[#1F2937]'}`}
                            >
                              {dayNum}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* June 2026 */}
                    <div className="bg-white p-2.5 rounded-lg border border-gray-150">
                      <p className="text-[10px] font-black uppercase text-center text-slate-700 mb-1">Junio 2026</p>
                      <div className="grid grid-cols-7 gap-1 text-[8px] text-center font-bold">
                        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, idx) => (
                          <span key={idx} className="text-gray-400">{day}</span>
                        ))}
                        {/* Days: starts on Monday(1) */}
                        {Array.from({ length: 1 }).map((_, i) => <span key={`empty-${i}`}></span>)}
                        {Array.from({ length: 30 }).map((_, i) => {
                          const dayNum = i + 1;
                          const dateKey = `2026-06-${dayNum.toString().padStart(2, '0')}`;
                          const isOccupied = occupiedDatesList.includes(dateKey);
                          return (
                            <span 
                              key={i} 
                              className={`py-1 rounded-sm ${isOccupied ? 'bg-red-500 text-white font-black' : 'bg-gray-100 text-[#1F2937]'}`}
                            >
                              {dayNum}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* 4. REVIEWS SECTION (Historial 28: con estrellas, acumulado dinámico & añadir reseña) */}
        <div className="bg-white border-t border-gray-200 pt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Summary scores */}
          <div className="space-y-4">
            <h3 className="font-sans text-xl font-bold text-[#1F2937] tracking-tight">Opiniones del producto</h3>
            <div className="p-6 bg-amber-50/20 border border-amber-200 rounded-2xl flex items-center gap-4">
              <span className="text-4xl font-black text-[#1F5937] shrink-0">{averageRating.toFixed(1)}</span>
              <div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      size={16} 
                      fill={i < Math.round(averageRating) ? '#8DB600' : 'none'} 
                      stroke={i < Math.round(averageRating) ? '#8DB600' : '#D1D5DB'} 
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Calificación ponderada sobre {cabinReviews.length} opiniones indexadas</p>
              </div>
            </div>

            {/* Add Review Form if logged in */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
              <h4 className="font-bold text-xs uppercase text-[#8DB600] tracking-wider">¿Te has alojado aquí? Danos tu opinión</h4>
              
              {user ? (
                <form onSubmit={handleReviewSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase">Puntuación en Estrellas</label>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const starNum = i + 1;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setNewRating(starNum)}
                            className="p-1 hover:scale-110 transition cursor-pointer"
                          >
                            <Star 
                              size={20} 
                              fill={starNum <= newRating ? '#8DB600' : 'none'} 
                              stroke={starNum <= newRating ? '#8DB600' : '#9CA3AF'} 
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase">Escribe tu comentario</label>
                    <textarea 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Comparte tu experiencia de descanso con otros interesados de la comunidad..."
                      className="w-full bg-white text-xs text-[#1F2937] border border-gray-200 rounded-xl p-3 focus:ring-1 focus:ring-[#1F5937] h-20"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#1F5937] hover:bg-[#143B24] text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send size={12} /> Publicar Calificación
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-xs text-slate-800">
                  ⚠️ Debes registrarte o iniciar sesión en tu cuenta para poder publicar opiniones o calificar cabañas.
                </div>
              )}
            </div>
          </div>

          {/* Right listing comments */}
          <div className="lg:col-span-2 space-y-4 max-h-[500px] overflow-y-auto pr-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-2">Reseñas de Visitantes</h4>
            {cabinReviews.map((rev) => (
              <div key={rev.id} className="bg-white border border-[#E5E7EB] p-5 rounded-2xl shadow-xs space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#1F5937] text-white rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                      {rev.userName.charAt(0)}
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-[#1F2937]">{rev.userName}</h5>
                      <span className="text-[10px] text-gray-400 block">{rev.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        size={12} 
                        fill={i < Math.round(rev.rating) ? '#8DB600' : 'none'} 
                        stroke={i < Math.round(rev.rating) ? '#8DB600' : '#D1D5DB'} 
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-gray-600 font-light leading-relaxed">
                  "{rev.comment}"
                </p>
              </div>
            ))}

            {cabinReviews.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-6">Aún no hay reseñas registradas para esta propiedad. ¡Sé el primero en calificarla!</p>
            )}
          </div>

        </div>

      </div>

      {/* LIGHTBOX DE IMÁGENES MODAL (Story 6 Ver Más Fotos) */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-[#1F2937]/95 flex flex-col justify-between p-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center text-white">
            <h4 className="font-bold text-sm">{cabin.name} — Galería de fotos</h4>
            <button 
              onClick={() => setLightboxOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full text-white cursor-pointer"
            >
              <X size={24} />
            </button>
          </div>

          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <button
               onClick={() => setActivePhotoIdx(prev => prev === 0 ? cabin.imageUrls.length - 1 : prev - 1)}
               className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition cursor-pointer shrink-0"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-black flex items-center justify-center max-h-[60vh]">
              <img 
                src={cabin.imageUrls[activePhotoIdx]} 
                alt="Lightbox View" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>

            <button
               onClick={() => setActivePhotoIdx(prev => prev === cabin.imageUrls.length - 1 ? 0 : prev + 1)}
               className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition cursor-pointer shrink-0"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="flex justify-center gap-1.5 overflow-x-auto py-4">
            {cabin.imageUrls.map((url, i) => (
              <div 
                key={i} 
                className={`w-16 h-12 rounded overflow-hidden cursor-pointer shrink-0 border-2 transition ${activePhotoIdx === i ? 'border-[#8DB600] scale-105' : 'border-transparent opacity-60'}`}
                onClick={() => setActivePhotoIdx(i)}
              >
                <img src={url} alt="thumbnail" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SHARE MODAL EMERGENCE (Historial 27: Compartir en redes) */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-gray-100 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h4 className="font-sans text-lg font-bold text-[#1F2937] flex items-center gap-1.5">
                <Share2 size={18} className="text-[#1F5937]" /> Recomendar cabaña
              </h4>
              <button onClick={() => setShareOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-gray-100">
                <img src={cabin.imageUrls[0]} alt="preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </div>
              
              <div>
                <h5 className="font-bold text-sm text-[#1F2937]">{cabin.name}</h5>
                <p className="text-xs text-gray-500 truncate">📍 Las mejores vistas en {cabin.city}, {cabin.state}</p>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2 italic">"{cabin.description}"</p>
              </div>

              {/* Message customization input (Historial 27: Personalización de Compartir) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Añade tu mensaje personalizado:</label>
                <textarea
                  value={customShareMessage}
                  onChange={(e) => setCustomShareMessage(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs text-[#1F2937] p-2.5 rounded-xl h-16 focus:ring-1 focus:ring-[#1F5937]"
                ></textarea>
              </div>

              {/* Dynamic link simulation */}
              <div className="bg-slate-50 p-2.5 rounded border border-gray-150 text-[10px] text-slate-500 truncate font-mono">
                Enlace generado: <span className="text-blue-600 select-all hover:underline">{window.location.origin}/cabins/{cabin.id}</span>
              </div>
            </div>

            {/* Simulated target Social networks selectors */}
            <div className="space-y-2 pt-2">
              <p className="text-[10px] uppercase font-bold text-gray-400 text-center tracking-wider">Enviar a través de:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    alert(`📤 Compartido en Facebook exitosamente con el mensaje:\n"${customShareMessage}"`);
                    setShareOpen(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-[11px] transition cursor-pointer text-center"
                >
                  Facebook
                </button>
                <button
                  onClick={() => {
                    alert(`📤 Compartido en Twitter exitosamente con el mensaje:\n"${customShareMessage}"`);
                    setShareOpen(false);
                  }}
                  className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-3 rounded text-[11px] transition cursor-pointer text-center"
                >
                  Twitter (X)
                </button>
                <button
                  onClick={() => {
                    alert(`📤 Compartido en Instagram exitosamente con el mensaje:\n"${customShareMessage}"`);
                    setShareOpen(false);
                  }}
                  className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-3 rounded text-[11px] transition cursor-pointer text-center"
                >
                  Instagram
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
