/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { THEME_CLASSES } from '../styles/tokens';
import { CalendarRange, Calendar, DollarSign, Trees, XCircle, ChevronRight, Star, ExternalLink, ShieldAlert } from 'lucide-react';
import { ApiClient } from '../services/api';

export const Reservations: React.FC = () => {
  const { user, allReservations, cabins, setView, reloadDatabase } = useApp();

  const userReservations = useMemo(() => {
    if (!user) return [];
    return allReservations
      .filter(r => r.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allReservations, user]);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <ShieldAlert size={48} className="text-amber-500 mx-auto" />
        <h3 className="font-bold">Para ver tu historial de reservas debes iniciar sesión primero</h3>
        <button onClick={() => setView('login')} className={THEME_CLASSES.btnPrimary}>Ir al Login</button>
      </div>
    );
  }

  const getCabinDetails = (cabinId: string) => {
    return cabins.find(c => c.id === cabinId);
  };

  const handleCancelReservation = async (resId: string) => {
    const confirm = window.confirm("¿Estás completamente seguro de que deseas cancelar esta reserva? Esta acción liberará las fechas inmediatamente.");
    if (confirm) {
      try {
        await ApiClient.updateReservationStatus(resId, 'cancelled');
        await reloadDatabase();
        alert("Tu reserva fue cancelada exitosamente y las fechas han sido liberadas.");
      } catch (err: any) {
        alert(err.message || "No se pudo procesar la cancelación.");
      }
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'completed': return 'bg-sky-100 text-[#1F5937] border-sky-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-amber-100 text-amber-850 border-amber-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada (Próxima)';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return 'Pendiente';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">

      <div className="flex flex-col sm:row sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h2 className="font-sans text-2xl font-black text-[#1F2937] tracking-tight flex items-center gap-2">
            <CalendarRange size={28} className="text-[#1F5937]" /> Mi Historial de Reservas
          </h2>
          <p className="text-xs text-gray-500">Consulta los detalles de tus hospedajes contratados, cancela estadías activas, o deja un comentario sobre tus viajes.</p>
        </div>
        <button
          onClick={() => setView('home')}
          className="bg-[#1F5937] hover:bg-[#143B24] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition duration-200 cursor-pointer"
        >
          Explorar Más Cabañas
        </button>
      </div>

      {userReservations.length > 0 ? (
        <div className="space-y-6">
          {userReservations.map((res) => {
            const cabin = getCabinDetails(res.cabinId);
            if (!cabin) return null;

            return (
              <div
                key={res.id}
                className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 p-5"
              >
                {/* Product Thumbnail image left side */}
                <div className="w-full md:w-48 aspect-[16/10] md:aspect-square rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <img src={cabin.imageUrls[0]} alt={cabin.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>

                {/* Info block middle */}
                <div className="flex-1 space-y-4 flex flex-col justify-between">
                  <div className="space-y-1.5">

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusBadgeClass(res.status)}`}>
                        {getStatusLabel(res.status)}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">Código: RR-{res.id.toUpperCase().split('-')[1]}</span>
                    </div>

                    <h4
                      onClick={() => setView('detail', cabin.id)}
                      className="text-base font-black text-[#1F2937] hover:text-[#1F5937] transition-colors leading-tight cursor-pointer"
                    >
                      {cabin.name}
                    </h4>

                    <p className="text-xs text-gray-500">📍 {cabin.city}, {cabin.state}</p>

                    {/* Check In / Out grid dates */}
                    <div className="grid grid-cols-2 gap-4 pt-1.5">
                      <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <p className="text-[9px] text-gray-400 font-bold uppercase leading-none">Entrada</p>
                        <p className="text-xs font-bold text-[#1F2937] mt-1 flex items-center gap-1">
                          <Calendar size={12} className="text-[#8DB600]" /> {res.checkInDate}
                        </p>
                      </div>

                      <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <p className="text-[9px] text-gray-400 font-bold uppercase leading-none">Salida</p>
                        <p className="text-xs font-bold text-[#1F2937] mt-1 flex items-center gap-1">
                          <Calendar size={12} className="text-[#8DB600]" /> {res.checkOutDate}
                        </p>
                      </div>
                    </div>

                  </div>

                  <div className="flex items-center gap-6 text-xs text-gray-500 border-t border-gray-100 pt-3">
                    <p>Huéspedes: <strong className="text-[#1F2937]">{res.guestsCount}</strong></p>
                    <p>Total Importe: <strong className="text-lg text-[#1F5937]">${res.totalAmount} USD</strong></p>
                  </div>
                </div>

                {/* Action block right side */}
                <div className="w-full md:w-44 shrink-0 flex flex-col md:justify-center gap-2.5 bg-slate-50/50 md:bg-transparent -m-5 md:-m-0 p-5 md:p-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-5">
                  <button
                    onClick={() => setView('detail', cabin.id)}
                    className="w-full bg-[#1F5937] hover:bg-[#143B24] text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <span>Ver Detalles Cabaña</span>
                    <ChevronRight size={14} />
                  </button>

                  {res.status === 'confirmed' && (
                    <button
                      onClick={() => handleCancelReservation(res.id)}
                      className="w-full bg-white border border-red-300 hover:bg-red-50 text-red-700 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <XCircle size={14} />
                      <span>Cancelar Reserva</span>
                    </button>
                  )}

                  {res.status === 'confirmed' && (
                    <button
                      onClick={() => setView('detail', cabin.id)}
                      className="w-full bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Star size={13} fill="#D97706" stroke="none" />
                      <span>Calificar Hospedaje</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#F5F5F5] border border-gray-200 rounded-3xl p-16 text-center max-w-xl mx-auto flex flex-col items-center space-y-4">
          <Trees className="text-gray-400" size={56} />
          <h4 className="font-bold text-[#1F2937]">Organiza tu primera aventura</h4>
          <p className="text-xs text-gray-500 max-w-md">Aún no cuentas con reservaciones registradas a tu nombre. Explora nuestro catálogo premium de cabañas, elige tus fechas en Valle de Bravo o Mazamitla e inicia tu escape.</p>
          <button
            onClick={() => setView('home')}
            className={THEME_CLASSES.btnPrimary}
          >
            Buscar Cabañas Disponibles
          </button>
        </div>
      )}

    </div>
  );
};
