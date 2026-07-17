/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { THEME_CLASSES } from '../styles/tokens';
import {
  Building2, FolderPlus, ToggleLeft, Activity, ShieldCheck, Plus, Trash2, Edit3,
  Settings2, AlertTriangle, ShieldAlert, CheckCircle2, Trash
} from 'lucide-react';
import { ApiClient } from '../services/api';
import { User } from '../types';

export const AdminPanel: React.FC = () => {
  const {
    user,
    setView,
    cabins,
    categories,
    features,
    allReservations,
    reloadDatabase,
    adminSubTab,
    setAdminSubTab
  } = useApp();

  // If the user isn't an admin, block access
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <ShieldAlert size={48} className="text-red-500 mx-auto" />
        <h3 className="font-sans text-xl font-bold">Acceso Denegado</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">Esta sección es para uso exclusivo de administradores del sistema. Inicia sesión como administrador para acceder.</p>
        <button onClick={() => setView('login')} className={THEME_CLASSES.btnPrimary}>Ir al Login</button>
      </div>
    );
  }

  // State to manage create forms
  const [showCabinForm, setShowCabinForm] = useState(false);
  const [cabinError, setCabinError] = useState<string | null>(null);
  const [cabinSuccess, setCabinSuccess] = useState(false);

  // Cabin Form Fields
  const [cabName, setCabName] = useState('');
  const [cabDesc, setCabDesc] = useState('');
  const [cabCat, setCabCat] = useState('');
  const [cabCity, setCabCity] = useState('Valle de Bravo');
  const [cabState, setCabState] = useState('Estado de México');
  const [cabPrice, setCabPrice] = useState(120);
  const [cabGuests, setCabGuests] = useState(4);
  const [cabBedrooms, setCabBedrooms] = useState(2);
  const [cabBathrooms, setCabBathrooms] = useState(2);
  const [cabImageFiles, setCabImageFiles] = useState<File[]>([]);
  const [cabImagePreviews, setCabImagePreviews] = useState<string[]>([]);
  const [cabUploading, setCabUploading] = useState(false);
  const [cabSelectedFeatures, setCabSelectedFeatures] = useState<string[]>([]);

  // Policies Form Fields (Dynamic builder)
  const [cabPolicies, setCabPolicies] = useState<{ title: string; displayOrder: number; items: string[] }[]>([
    {
      title: "Reglas Generales",
      displayOrder: 1,
      items: ["Check-in: 15:00", "Check-out: 11:00", "Prohibidas fiestas ruidosas"]
    },
    {
      title: "Cancelaciones",
      displayOrder: 2,
      items: ["Cancelación gratuita hasta 7 días antes de la llegada"]
    }
  ]);

  const handleAddPolicy = () => {
    setCabPolicies([
      ...cabPolicies,
      {
        title: '',
        displayOrder: cabPolicies.length + 1,
        items: []
      }
    ]);
  };

  const handleRemovePolicy = (index: number) => {
    const next = cabPolicies.filter((_, i) => i !== index)
      .map((policy, idx) => ({ ...policy, displayOrder: idx + 1 }));
    setCabPolicies(next);
  };

  const handleUpdatePolicyTitle = (index: number, title: string) => {
    const next = [...cabPolicies];
    next[index].title = title;
    setCabPolicies(next);
  };

  const handleAddPolicyItem = (policyIndex: number, itemText: string) => {
    if (!itemText.trim()) return;
    const next = [...cabPolicies];
    next[policyIndex].items.push(itemText.trim());
    setCabPolicies(next);
  };

  const handleRemovePolicyItem = (policyIndex: number, itemIndex: number) => {
    const next = [...cabPolicies];
    next[policyIndex].items = next[policyIndex].items.filter((_, idx) => idx !== itemIndex);
    setCabPolicies(next);
  };

  // Category Form Fields
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catImageFile, setCatImageFile] = useState<File | null>(null);
  const [catImagePreview, setCatImagePreview] = useState<string | null>(null);
  const [catUploading, setCatUploading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  // Feature Form Fields
  const [featName, setFeatName] = useState('');
  const [featIconFile, setFeatIconFile] = useState<File | null>(null);
  const [featIconPreview, setFeatIconPreview] = useState<string | null>(null);
  const [featUploading, setFeatUploading] = useState(false);
  const [featDesc, setFeatDesc] = useState('');

  // 1. Double Cabin Creation Handler (Historial 3)
  const handleCreateCabin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCabinError(null);
    setCabinSuccess(false);

    const name = cabName.trim();
    if (!name) return;

    const existing = cabins.some(c => c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      setCabinError(`⚠️ El nombre de la cabaña "${name}" ya está en uso. Por favor, asigne otro nombre único para el catálogo.`);
      return;
    }

    if (cabImageFiles.length === 0) {
      setCabinError('Selecciona al menos una imagen para la cabaña.');
      return;
    }

    try {
      setCabUploading(true);
      const uploadedImages = await ApiClient.uploadMultipleImages(cabImageFiles);
      const imageKeys = uploadedImages.map(item => item.imageKey || item.key || '').filter(Boolean);

      if (imageKeys.length === 0) {
        throw new Error('No se pudieron obtener las referencias de las imágenes subidas.');
      }

      await ApiClient.createCabin({
        name,
        description: cabDesc.trim() || "Cabaña en la naturaleza recién enlistada.",
        categoryId: cabCat || categories[0]?.id || '',
        city: cabCity,
        state: cabState,
        country: "México",
        address: "Av. Principal s/n",
        latitude: 19.1917,
        longitude: -100.1309,
        maxGuests: cabGuests,
        numberOfBedrooms: cabBedrooms,
        numberOfBathrooms: cabBathrooms,
        pricePerNight: Number(cabPrice),
        imageKeys,
        featureIds: cabSelectedFeatures,
        policies: cabPolicies
      });

      setCabinSuccess(true);
      reloadDatabase();

      setCabName('');
      setCabDesc('');
      setCabSelectedFeatures([]);
      setCabImageFiles([]);
      setCabImagePreviews([]);
      setCabPolicies([
        {
          title: "Reglas Generales",
          displayOrder: 1,
          items: ["Check-in: 15:00", "Check-out: 11:00", "Prohibidas fiestas ruidosas"]
        },
        {
          title: "Cancelaciones",
          displayOrder: 2,
          items: ["Cancelación gratuita hasta 7 días antes de la llegada"]
        }
      ]);
      setTimeout(() => {
        setCabinSuccess(false);
        setShowCabinForm(false);
      }, 2500);

    } catch (err: any) {
      setCabinError(err.message || "Error al encriptar o guardar el producto.");
    } finally {
      setCabUploading(false);
    }
  };

  // 2. Double Cabin Delete Handler
  const handleDeleteCabin = async (cabinId: string, cabinName: string) => {
    const doubleCheck = window.confirm(`¿Está completamente seguro de que desea eliminar la propiedad "${cabinName}" de la base de datos?\nEsta acción es irreversible.`);
    if (doubleCheck) {
      await ApiClient.deleteCabin(cabinId);
      await reloadDatabase();
      alert("Cabaña eliminada correctamente.");
    }
  };

  // 3. Category Create Handler
  const handleCreateCategory = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setCatError(null);

    if (!catName.trim() || !catDesc.trim()) {
      setCatError('Completa el nombre y la descripción de la categoría.');
      return;
    }

    if (!catImageFile) {
      setCatError('Selecciona una imagen para la categoría.');
      return;
    }

    try {
      setCatUploading(true);
      const uploadResult = await ApiClient.uploadImage(catImageFile);
      const imageKey = uploadResult?.imageKey;

      if (!imageKey) {
        throw new Error('El backend no devolvió una referencia válida para la imagen.');
      }

      await ApiClient.createCategory({
        name: catName.trim(),
        description: catDesc.trim(),
        imageKey,
        imageUrl: uploadResult?.imageUrl
      });

      setCatName('');
      setCatDesc('');
      setCatImageFile(null);
      setCatImagePreview(null);
      reloadDatabase();
      alert('Categoría creada con éxito.');
    } catch (err: any) {
      setCatError(err.message || 'No se pudo crear la categoría.');
    } finally {
      setCatUploading(false);
    }
  };

  // 4. Category Delete Handler (Historial 29)
  const handleDeleteCategory = async (catId: string, catName: string) => {
    const list = cabins.filter(c => c.categoryId === catId);
    let warning = `¿Eliminar la categoría "${catName}"?`;
    if (list.length > 0) {
      warning += `\n⚠️ ADVERTENCIA: Hay ${list.length} cabañas asociadas a esta categoría que quedarán huérfanas o se desvincularán.`;
    }

    const confirm = window.confirm(warning);
    if (confirm) {
      await ApiClient.deleteCategory(catId);
      await reloadDatabase();
      alert("Categoría desinstalada.");
    }
  };

  // 5. Feature Create Handler (Historial 17)
  const handleCreateFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featName.trim()) return;

    if (!featIconFile) {
      alert('Selecciona un icono para la característica.');
      return;
    }

    try {
      setFeatUploading(true);
      const uploadResult = await ApiClient.uploadImage(featIconFile);
      const iconUrl = uploadResult?.imageUrl || uploadResult?.url || '';

      if (!iconUrl) {
        throw new Error('No se pudo obtener la URL del ícono subido.');
      }

      await ApiClient.createFeature({
        name: featName.trim(),
        iconUrl,
        description: featDesc.trim() || ''
      });

      setFeatName('');
      setFeatDesc('');
      setFeatIconFile(null);
      setFeatIconPreview(null);
      reloadDatabase();
      alert("Nueva característica indexada correctamente.");
    } catch (err: any) {
      alert(err.message || 'No se pudo crear la característica.');
    } finally {
      setFeatUploading(false);
    }
  };

  // 6. Feature Delete Handler
  const handleDeleteFeature = async (featId: string) => {
    const confirm = window.confirm("¿Seguro que deseas eliminar esta característica? Se desvinculará de las propiedades.");
    if (confirm) {
      await ApiClient.deleteFeature(featId);
      await reloadDatabase();
    }
  };

  // 7. Toggle Users Privileges
  const handleToggleAdminUser = (targetUserId: string, targetName: string) => {
    if (targetUserId === user.id) {
      alert("No puedes revocar tus propios derechos directos de administrador mientras estás en sesión.");
      return;
    }
    const confirmVal = window.confirm(`¿Desea cambiar la jerarquía y permisos de rol para el usuario "${targetName}"?`);
    if (confirmVal) {
      alert("La gestión de roles se realizará desde el backend cuando esté disponible.");
    }
  };

  // 8. Custom override reservation status (Admin override)
  const handleUpdateResStatus = async (resId: string, status: any) => {
    await ApiClient.updateReservationStatus(resId, status);
    await reloadDatabase();
    alert(`Estado de reserva actualizado a "${status}"`);
  };

  const registeredUsers = useMemo(() => {
    return [] as User[];
  }, [allReservations]);

  return (
    <div className="min-h-screen bg-white">

      {/* ⚠️ HIGH COMPLIANT MOBILE WARNING PANEL OVERLAY (Historial 9) */}
      <div className="block lg:hidden fixed inset-0 z-50 bg-[#1F5937] text-[#F4E9D9] p-8 flex flex-col justify-center items-center text-center space-y-6">
        <AlertTriangle size={64} className="text-[#8DB600] animate-bounce" />
        <h3 className="font-sans text-2xl font-black uppercase tracking-tight">Panel Administrativo Exclusivo</h3>
        <p className="text-xs max-w-sm text-emerald-100 leading-relaxed font-light">
          ⚠️ Estimado administrador, por especificaciones visuales de control (No debe ser responsive), este panel requiere vistas extendidas para albergar los flujos CRUD. Por favor, acceda desde una Laptop, computadora de escritorio o maximice su resolución.
        </p>
        <button
          onClick={() => setView('home')}
          className="bg-[#F4E9D9] text-[#1F5937] px-6 py-2.5 rounded-xl font-bold text-xs"
        >
          Volver a Navegación Pública
        </button>
      </div>

      {/* DESKTOP LAYOUT (Widescreen CRM Admin Workspace) */}
      <div className="hidden lg:flex min-h-screen">

        {/* Left Sidebar Menu Menu Nav */}
        <div className="w-64 bg-[#1F5937] text-white p-6 space-y-8 shrink-0 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center space-x-2 border-b border-emerald-800 pb-4">
              <Settings2 size={22} className="text-[#8DB600]" />
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wider">Mesa de Control</h4>
                <p className="text-[9px] text-emerald-100 font-mono">Retreat Reserve Hub</p>
              </div>
            </div>

            {/* Tab items buttons */}
            <div className="space-y-2">
              <button
                onClick={() => setAdminSubTab('properties')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 transition ${adminSubTab === 'properties' ? 'bg-[#8DB600] text-white shadow-sm' : 'hover:bg-emerald-850/60 text-emerald-100'}`}
              >
                <Building2 size={16} /> 🛖 Propietades (Cabañas)
              </button>

              <button
                onClick={() => setAdminSubTab('categories')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 transition ${adminSubTab === 'categories' ? 'bg-[#8DB600] text-white shadow-sm' : 'hover:bg-emerald-850/60 text-emerald-100'}`}
              >
                <FolderPlus size={16} /> 📁 Categorías de Catálogo
              </button>

              <button
                onClick={() => setAdminSubTab('features')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 transition ${adminSubTab === 'features' ? 'bg-[#8DB600] text-white shadow-sm' : 'hover:bg-emerald-850/60 text-emerald-100'}`}
              >
                <Settings2 size={16} /> 🛠️ Características del Sitio
              </button>

              <button
                onClick={() => setAdminSubTab('reservations')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 transition ${adminSubTab === 'reservations' ? 'bg-[#8DB600] text-white shadow-sm' : 'hover:bg-emerald-850/60 text-emerald-100'}`}
              >
                <Activity size={16} /> 📅 Control de Reservas
              </button>

              <button
                onClick={() => setAdminSubTab('users')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 transition ${adminSubTab === 'users' ? 'bg-[#8DB600] text-white shadow-sm' : 'hover:bg-emerald-850/60 text-emerald-100'}`}
              >
                <ToggleLeft size={16} /> 👥 Privilegios / Usuarios
              </button>
            </div>
          </div>

          <div className="border-t border-emerald-800 pt-4">
            <button
              onClick={() => setView('home')}
              className="w-full text-center bg-[#F4E9D9] hover:bg-white text-[#1F5937] py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Salir al Home Público
            </button>
          </div>
        </div>

        {/* Right workspace view panel */}
        <div className="flex-1 p-10 bg-gray-50 max-h-screen overflow-y-auto">

          {/* Top panel admin card */}
          <div className="flex justify-between items-center border-b border-gray-200 pb-5 mb-8">
            <div>
              <span className="text-[10px] bg-[#F4E9D9] text-[#1F5937] font-bold py-1 px-3 rounded-full uppercase tracking-wider">Sesión Segura</span>
              <h2 className="font-sans text-2xl font-black text-[#1F2937] tracking-tight mt-1">Estudio del Administrador</h2>
              <p className="text-xs text-gray-500">Sesión activa: <strong className="text-gray-700">{user.name} {user.lastName} ({user.email})</strong></p>
            </div>

            {/* Quick quick cabin creator launcher */}
            {adminSubTab === 'properties' && !showCabinForm && (
              <button
                onClick={() => { setShowCabinForm(true); setCabinError(null); }}
                className={`${THEME_CLASSES.btnPrimary} text-xs py-2 px-4 shadow`}
              >
                <Plus size={16} className="inline mr-1" /> Registrar Nueva Cabaña
              </button>
            )}
          </div>

          {/* --- VIEW PANELS ROUTING --- */}

          {/* TAB 1: PROPERTIES (🛖 CABINS CRUD - HISTORIAL 3, 10, 11) */}
          {adminSubTab === 'properties' && (
            <div className="space-y-6 animate-in fade-in duration-200">

              {showCabinForm ? (
                /* CREATE FORM COMPONENT (Historial 3) */
                <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="font-bold text-[#1F2937] text-sm uppercase tracking-wider">Registrar Nuevo Alojamiento (Cabaña)</h3>
                    <button
                      onClick={() => setShowCabinForm(false)}
                      className="text-xs text-gray-400 hover:text-gray-600 font-bold"
                    >
                      Cancelar
                    </button>
                  </div>

                  {cabinSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-bounce">
                      <CheckCircle2 size={16} />
                      <span>¡Cabaña creada e indexada con éxito. Se actualizó el catálogo!</span>
                    </div>
                  )}

                  {cabinError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-start gap-1.5">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <p>{cabinError}</p>
                    </div>
                  )}

                  <form onSubmit={handleCreateCabin} className="space-y-4">

                    <div className="grid grid-cols-2 gap-4">
                      {/* Name with duplication checking */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Nombre del Alojamiento</label>
                        <input
                          type="text"
                          value={cabName}
                          onChange={(e) => setCabName(e.target.value)}
                          placeholder="Cabaña de la colina"
                          className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:ring-1 focus:ring-[#1F5937]"
                          required
                        />
                      </div>

                      {/* Category Selector (Historial 12) */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Categoría Asignada</label>
                        <select
                          value={cabCat}
                          onChange={(e) => setCabCat(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl cursor-pointer"
                          required
                        >
                          <option value="">Selecciona categoria...</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Descripción detallada</label>
                      <textarea
                        value={cabDesc}
                        onChange={(e) => setCabDesc(e.target.value)}
                        placeholder="Escribe un párrafo descriptivo sobre la cabaña, ubicación y atractivos..."
                        className="w-full bg-gray-50 border border-gray-200 text-xs p-3 rounded-xl h-24"
                        required
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      {/* Price */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Precio / Noche ($ USD)</label>
                        <input
                          type="number"
                          value={cabPrice}
                          onChange={(e) => setCabPrice(Number(e.target.value))}
                          className="w-full bg-gray-50 border border-gray-200 text-xs p-2.5 rounded-xl"
                          required
                        />
                      </div>

                      {/* Guests */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Huéspedes de Límite</label>
                        <input
                          type="number"
                          value={cabGuests}
                          onChange={(e) => setCabGuests(Number(e.target.value))}
                          className="w-full bg-gray-50 border border-gray-200 text-xs p-2.5 rounded-xl"
                          required
                        />
                      </div>

                      {/* Bedrooms */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Dormitorios</label>
                        <input
                          type="number"
                          value={cabBedrooms}
                          onChange={(e) => setCabBedrooms(Number(e.target.value))}
                          className="w-full bg-gray-50 border border-gray-200 text-xs p-2.5 rounded-xl"
                          required
                        />
                      </div>

                      {/* Bathrooms */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Baños</label>
                        <input
                          type="number"
                          value={cabBathrooms}
                          onChange={(e) => setCabBathrooms(Number(e.target.value))}
                          className="w-full bg-gray-50 border border-gray-200 text-xs p-2.5 rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Municipio / Ciudad</label>
                        <select
                          value={cabCity}
                          onChange={(e) => setCabCity(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 text-xs p-2.5 rounded-xl cursor-pointer"
                        >
                          <option value="Valle de Bravo">Valle de Bravo</option>
                          <option value="Mazamitla">Mazamitla</option>
                          <option value="Tapalpa">Tapalpa</option>
                          <option value="Huasca de Ocampo">Huasca de Ocampo</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Estado Federal</label>
                        <input
                          type="text"
                          value={cabState}
                          onChange={(e) => setCabState(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 text-xs p-2.5 rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Imágenes de la cabaña</label>
                      <div className="flex flex-col gap-2">
                        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 hover:bg-gray-100">
                          <span className="font-semibold text-[#1F5937]">Seleccionar varias imágenes</span>
                          <span className="rounded-lg bg-[#1F5937] px-3 py-1.5 text-[11px] font-bold text-white">Elegir archivos</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              setCabImageFiles(files);
                              setCabImagePreviews(files.map(file => URL.createObjectURL(file)));
                            }}
                            required
                          />
                        </label>
                        <div className="min-h-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
                          {cabImageFiles.length > 0 ? `${cabImageFiles.length} archivo(s) seleccionado(s)` : 'Aún no has elegido imágenes'}
                        </div>
                      </div>
                      {cabImagePreviews.length > 0 && (
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {cabImagePreviews.map((preview, index) => (
                            <img key={`${preview}-${index}`} src={preview} alt={`Vista previa ${index + 1}`} className="h-20 w-full rounded-lg object-cover" />
                          ))}
                        </div>
                      )}
                      <p className="text-[9px] text-gray-400">Se requiere al menos una imagen principal para el home.</p>
                    </div>

                    {/* SELECT AND DEFINE FEATURES CHECKBOXES */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase block">Asociar Características / Comodidades:</label>
                      <div className="grid grid-cols-3 gap-3">
                        {features.map((feat) => {
                          const checked = cabSelectedFeatures.includes(feat.id);
                          return (
                            <label key={feat.id} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-150 cursor-pointer text-xs select-none">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setCabSelectedFeatures([...cabSelectedFeatures, feat.id]);
                                  } else {
                                    setCabSelectedFeatures(cabSelectedFeatures.filter(id => id !== feat.id));
                                  }
                                }}
                              />
                              <span>{feat.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* POLICIES DYNAMIC BUILDER (layout & spacing compliant) */}
                    <div className="space-y-4 border-t pt-5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block tracking-wider">Políticas y Reglas del Alojamiento:</label>
                        <button
                          type="button"
                          onClick={handleAddPolicy}
                          className="text-[11px] bg-[#8DB600] hover:bg-[#739600] text-white px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        >
                          <Plus size={14} /> Agregar Política
                        </button>
                      </div>

                      <div className="space-y-4">
                        {cabPolicies.map((policy, pIdx) => (
                          <div key={pIdx} className="bg-gray-50/50 border border-gray-200/80 p-4.5 rounded-2xl relative space-y-4 shadow-2xs hover:shadow-xs transition duration-200">
                            <div className="flex gap-4 items-end justify-between">
                              <div className="flex-1 space-y-1.5">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Título de la Política</label>
                                <input
                                  type="text"
                                  value={policy.title}
                                  onChange={(e) => handleUpdatePolicyTitle(pIdx, e.target.value)}
                                  placeholder="Ej: Reglas de convivencia, Mascotas, Cancelación..."
                                  className="w-full bg-white border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:ring-1 focus:ring-[#1F5937]"
                                  required
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemovePolicy(pIdx)}
                                className="p-2.5 bg-red-50 hover:bg-red-150 text-red-600 rounded-xl transition cursor-pointer active:scale-95 shrink-0"
                                title="Eliminar política completa"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div className="space-y-2.5">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Reglas / Restricciones de esta Política:</label>

                              {policy.items.length > 0 ? (
                                <ul className="space-y-2">
                                  {policy.items.map((item, iIdx) => (
                                    <li key={iIdx} className="flex justify-between items-center text-xs text-gray-700 bg-white border border-gray-150 px-3.5 py-2 rounded-xl shadow-3xs">
                                      <span className="font-light">• {item}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemovePolicyItem(pIdx, iIdx)}
                                        className="text-red-500 hover:text-red-750 p-1 font-bold text-[10px]"
                                      >
                                        ✕
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-[10px] text-gray-400 italic pl-1.5 font-light">Aún no hay reglas agregadas a esta política.</p>
                              )}

                              <div className="flex gap-2.5 mt-2">
                                <input
                                  type="text"
                                  id={`new-item-input-${pIdx}`}
                                  placeholder="Agregar una nueva regla o restricción..."
                                  className="flex-1 bg-white border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl focus:ring-1 focus:ring-[#1F5937]"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const target = e.currentTarget;
                                      handleAddPolicyItem(pIdx, target.value);
                                      target.value = '';
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const inputEl = document.getElementById(`new-item-input-${pIdx}`) as HTMLInputElement;
                                    if (inputEl) {
                                      handleAddPolicyItem(pIdx, inputEl.value);
                                      inputEl.value = '';
                                    }
                                  }}
                                  className="bg-[#1F5937] hover:bg-[#143B24] text-white px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition cursor-pointer active:scale-95"
                                >
                                  Añadir
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 flex gap-2 border-t mt-4">
                      <button
                        type="submit"
                        className={THEME_CLASSES.btnPrimary}
                      >
                        Crear e Indexar Propiedad
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCabinForm(false)}
                        className="px-6 py-2.5 bg-gray-200 text-[#1F2937] text-xs font-bold rounded-xl hover:bg-gray-300"
                      >
                        Descartar
                      </button>
                    </div>

                  </form>
                </div>
              ) : (
                /* CABIN PRODUCTS TABLE LIST (Columnas: Id, Nombre, Acciones) */
                <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-5 border-b flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Listado Maestro de cabañas en Catálogo ({cabins.length})</h3>
                    <p className="text-xs text-[#8DB600] font-bold">Audit Mode</p>
                  </div>

                  <table className="w-full text-left text-xs text-[#1F2937] border-collapse">
                    <thead className="bg-[#F5F5F5] uppercase text-[10px] text-gray-500 font-bold border-b border-gray-150">
                      <tr>
                        <th className="p-4">Id</th>
                        <th className="p-4">Nombre del Producto</th>
                        <th className="p-4">Categoría</th>
                        <th className="p-4">Ubicación</th>
                        <th className="p-4">Precio / Noche</th>
                        <th className="p-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cabins.map((cabin) => (
                        <tr key={cabin.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4 font-mono font-bold text-[11px] text-[#1F5937]">{cabin.id}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={cabin.imageUrls[0]} referrerPolicy="no-referrer" className="w-10 h-8 rounded object-cover shrink-0" alt="" />
                              <strong className="text-gray-900 font-semibold">{cabin.name}</strong>
                            </div>
                          </td>
                          <td className="p-4 font-bold text-[#8DB600]">
                            {categories.find(c => c.id === cabin.categoryId)?.name || "Sin categoria"}
                          </td>
                          <td className="p-4 text-gray-500 font-light">{cabin.city}, {cabin.state}</td>
                          <td className="p-4 font-bold text-gray-900">${cabin.pricePerNight} USD</td>
                          <td className="p-4">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => setView('detail', cabin.id)}
                                className="p-1.5 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded-lg"
                                title="Ver ficha"
                              >
                                🗺️ Ver
                              </button>
                              <button
                                onClick={() => handleDeleteCabin(cabin.id, cabin.name)}
                                className="p-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Eliminar cabaña de catálogo"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {cabins.length === 0 && (
                    <div className="text-center py-10 text-gray-400">Ninguna cabaña alojada en los almacenes.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CATEGORIES (📁 CATEGORIES LIST + CREATE) */}
          {adminSubTab === 'categories' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in duration-200">

              {/* Category creation form */}
              <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4 h-fit">
                <h3 className="font-bold text-[#1F2937] text-sm uppercase tracking-wider border-b pb-2">Agregar Categoría</h3>

                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Título de la Categoría</label>
                    <input
                      type="text"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      placeholder="Ej: Con Alberca, Glamping"
                      className="w-full bg-gray-50 border border-gray-200 text-xs px-3.5 py-2 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Descripción de Enfoque</label>
                    <textarea
                      value={catDesc}
                      onChange={(e) => setCatDesc(e.target.value)}
                      placeholder="Describe qué caracteriza a los alojamientos de esta categoría..."
                      className="w-full bg-gray-50 border border-gray-200 text-xs p-3 rounded-xl h-20"
                      required
                    ></textarea>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Imagen de la categoría</label>
                    <div className="flex flex-col gap-2">
                      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 hover:bg-gray-100">
                        <span className="font-semibold text-[#1F5937]">Seleccionar archivo</span>
                        <span className="rounded-lg bg-[#1F5937] px-3 py-1.5 text-[11px] font-bold text-white">Elegir imagen</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setCatImageFile(file);
                            if (file) {
                              const previewUrl = URL.createObjectURL(file);
                              setCatImagePreview(previewUrl);
                            } else {
                              setCatImagePreview(null);
                            }
                          }}
                          required
                        />
                      </label>
                      <div className="min-h-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
                        {catImageFile ? `Archivo seleccionado: ${catImageFile.name}` : 'Aún no has elegido una imagen'}
                      </div>
                    </div>
                    {catImagePreview && (
                      <div className="mt-2 rounded-xl border border-gray-200 p-2 bg-gray-50">
                        <img src={catImagePreview} alt="Vista previa de categoría" className="h-24 w-full rounded-lg object-cover" />
                      </div>
                    )}
                  </div>

                  {catError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                      {catError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={catUploading}
                    className={`${THEME_CLASSES.btnSecondary} w-full py-2.5 text-xs font-bold uppercase disabled:opacity-60`}
                  >
                    {catUploading ? 'Subiendo imagen...' : 'Agregar Categoría'}
                  </button>
                </form>
              </div>

              {/* Category listing grid table */}
              <div className="xl:col-span-2 bg-white border rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-[#1F2937] text-xs uppercase tracking-wider border-b pb-2">Categorías Activas ({categories.length})</h3>

                <div className="space-y-3">
                  {categories.map((cat) => {
                    const linkedCabinsCount = cabins.filter(c => c.categoryId === cat.id).length;
                    return (
                      <div key={cat.id} className="flex items-center justify-between border border-gray-150 p-4 rounded-xl hover:bg-slate-50 transition">
                        <div className="flex items-center gap-4 min-w-0">
                          <img src={cat.imageUrl} referrerPolicy="no-referrer" className="w-12 h-10 object-cover rounded shadow-sm shrink-0 bg-gray-100" alt="" />
                          <div>
                            <h4 className="font-bold text-sm text-[#1F2937]">{cat.name}</h4>
                            <p className="text-[11px] text-gray-400 font-light truncate max-w-sm">{cat.description}</p>
                            <span className="text-[10px] font-bold text-[#1F5937] mt-1 block">🛖 {linkedCabinsCount} {linkedCabinsCount === 1 ? 'cabaña vinculada' : 'cabañas vinculadas'}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="p-2 border border-red-200 text-red-650 rounded-lg hover:bg-red-50 cursor-pointer transition shrink-0"
                          title="Eliminar Categoría de la base de datos"
                        >
                          <Trash size={14} className="text-red-500" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: FEATURES (🛠️ SERVICE AMENITIES CRUD) */}
          {adminSubTab === 'features' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in duration-200">

              {/* Feature Create (Historial 17) */}
              <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4 h-fit">
                <h3 className="font-bold text-[#1F2937] text-sm uppercase tracking-wider border-b pb-2">Nueva Característica</h3>

                <form onSubmit={handleCreateFeature} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Nombre del Servicio (Ej: Calefacción)</label>
                    <input
                      type="text"
                      value={featName}
                      onChange={(e) => setFeatName(e.target.value)}
                      placeholder="Ej: Jacuzzi exterior, Wifi fibra"
                      className="w-full bg-gray-50 border border-gray-200 text-xs p-2.5 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Ícono de la característica</label>
                    <div className="flex flex-col gap-2">
                      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 hover:bg-gray-100">
                        <span className="font-semibold text-[#1F5937]">Subir icono</span>
                        <span className="rounded-lg bg-[#1F5937] px-3 py-1.5 text-[11px] font-bold text-white">Elegir archivo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setFeatIconFile(file);
                            if (file) {
                              setFeatIconPreview(URL.createObjectURL(file));
                            } else {
                              setFeatIconPreview(null);
                            }
                          }}
                          required
                        />
                      </label>
                      <div className="min-h-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
                        {featIconFile ? `Archivo seleccionado: ${featIconFile.name}` : 'Requerido: selecciona un icono para la característica'}
                      </div>
                    </div>
                    {featIconPreview && (
                      <div className="mt-2 rounded-xl border border-gray-200 p-2 bg-gray-50">
                        <img src={featIconPreview} alt="Vista previa del icono" className="h-16 w-16 rounded-lg object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Descripción Breve</label>
                    <input
                      type="text"
                      value={featDesc}
                      onChange={(e) => setFeatDesc(e.target.value)}
                      placeholder="Ej: Smart TV con Netflix incluido"
                      className="w-full bg-gray-50 border border-gray-200 text-xs p-2.5 rounded-xl"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={featUploading}
                    className={`${THEME_CLASSES.btnPrimary} w-full py-2.5 text-xs font-bold uppercase disabled:opacity-60`}
                  >
                    {featUploading ? 'Subiendo icono...' : 'Añadir Nueva Característica'}
                  </button>
                </form>
              </div>

              {/* Feature list layout Table */}
              <div className="xl:col-span-2 bg-white border rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-[#1F2937] text-xs uppercase tracking-wider border-b pb-2">Características Oficiales Disponibles ({features.length})</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {features.map((feat) => (
                    <div key={feat.id} className="border border-gray-150 p-4 rounded-xl hover:bg-slate-50 transition flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {feat.iconUrl ? (
                          <img src={feat.iconUrl} referrerPolicy="no-referrer" alt={feat.name} className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <span className="p-2 bg-emerald-50 rounded bg-[#F4E9D9]/30 text-[#1F5937] font-bold font-mono text-xs">•••</span>
                        )}
                        <div>
                          <h4 className="font-bold text-xs text-[#1F2937]">{feat.name}</h4>
                          <span className="text-[9px] text-gray-400 italic block">{feat.description}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteFeature(feat.id)}
                        className="p-1.5 text-red-650 hover:bg-red-50 rounded-lg text-red-500 transition cursor-pointer"
                        title="Eliminar comodidad"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: RESERVATIONS CONTROL OVERRIDES (📅) */}
          {adminSubTab === 'reservations' && (
            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
              <div className="p-5 border-b bg-gray-50/50">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Mesa General de Control de Alquileres ({allReservations.length})</h3>
              </div>

              <table className="w-full text-left text-xs text-[#1F2937] border-collapse">
                <thead className="bg-[#F5F5F5] uppercase text-[10px] text-gray-500 font-bold border-b border-gray-150">
                  <tr>
                    <th className="p-4">Código / ID</th>
                    <th className="p-4">Cabaña</th>
                    <th className="p-4">Entrada</th>
                    <th className="p-4">Salida</th>
                    <th className="p-4 text-center">Estado</th>
                    <th className="p-4 text-center">Acciones Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allReservations.map((res) => {
                    const matchedCabin = cabins.find(c => c.id === res.cabinId);
                    return (
                      <tr key={res.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-mono font-bold text-[11px] text-slate-500">RR-{res.id.toUpperCase().split('-')[1]}</td>
                        <td className="p-4 text-gray-900 font-bold">{matchedCabin?.name || "Cabaña Desconocida"}</td>
                        <td className="p-4 font-light text-gray-500">{res.checkInDate}</td>
                        <td className="p-4 font-light text-gray-500">{res.checkOutDate}</td>
                        <td className="p-4 text-center">
                          <span className={`text-[10px] font-bold uppercase bg-slate-100 px-2 py-0.5 rounded ${res.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : res.status === 'cancelled' ? 'bg-red-100 text-red-850' : 'bg-gray-100 text-gray-800'}`}>
                            {res.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2 justify-center">
                            {res.status === 'confirmed' && (
                              <>
                                <button
                                  onClick={() => handleUpdateResStatus(res.id, 'completed')}
                                  className="text-[10px] bg-sky-100 text-sky-800 font-semibold px-2 py-1 rounded"
                                >
                                  Terminar
                                </button>
                                <button
                                  onClick={() => handleUpdateResStatus(res.id, 'cancelled')}
                                  className="text-[10px] bg-red-100 text-red-800 font-semibold px-2 py-1 rounded"
                                >
                                  Cancelar Alquiler
                                </button>
                              </>
                            )}
                            {res.status !== 'confirmed' && (
                              <span className="text-[10px] text-gray-400 italic">Saldada/Histórica</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {allReservations.length === 0 && (
                <div className="text-center py-10 text-gray-400">Aún no se han completado reservaciones en el sitio.</div>
              )}
            </div>
          )}

          {/* TAB 5: USERS ROLES MANAGEMENT SYSTEM (👥) */}
          {adminSubTab === 'users' && (
            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
              <div className="p-5 border-b bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Mesa de usuarios registrados en el sistema ({registeredUsers.length})</h3>
                <p className="text-xs text-[#8DB600] font-bold">Historial 16 Audit Mode</p>
              </div>

              <table className="w-full text-left text-xs border-collapse text-[#1F2937]">
                <thead className="bg-[#F5F5F5] uppercase text-[10px] text-gray-500 font-bold border-b border-gray-150">
                  <tr>
                    <th className="p-4">Id de Usuario</th>
                    <th className="p-4">Nombre Completo</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Privilegios (Rol)</th>
                    <th className="p-4 text-center">Jerarquía Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registeredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-mono text-[11px] text-[#1F5937] font-bold">{u.id}</td>
                      <td className="p-4 text-gray-950 font-bold">{u.name} {u.lastName}</td>
                      <td className="p-4 text-gray-500 font-light">{u.email}</td>
                      <td className="p-4 font-bold">
                        <span className={`text-[10px] font-extrabold uppercase bg-slate-100 px-2.5 py-1 rounded-full ${u.role === 'admin' ? 'bg-red-50 text-red-700 border border-red-150' : 'bg-gray-100 text-gray-600'}`}>
                          {u.role === 'admin' ? '👮 Administrador' : '👥 Huésped'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            type="button"
                            onClick={() => handleToggleAdminUser(u.id, `${u.name} ${u.lastName}`)}
                            className="bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-gray-100 text-slate-700 transition flex items-center gap-1 cursor-pointer"
                          >
                            <ShieldCheck size={12} className="text-[#8DB600]" />
                            <span>Intercambiar Rol Administrador</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
