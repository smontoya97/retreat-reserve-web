/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { THEME_CLASSES } from '../styles/tokens';
import { User, Mail, ShieldAlert, Award, Save, Lock, CheckCircle2 } from 'lucide-react';
import { ApiClient } from '../services/api';

export const Profile: React.FC = () => {
  const { user, setView, refreshUser } = useApp();
  const [name, setName] = useState(user?.name || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [success, setSuccess] = useState(false);
  const [errorMess, setErrorMess] = useState('');

  // Password change elements
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <ShieldAlert size={48} className="text-amber-500 mx-auto" />
        <h3 className="font-bold">Para ver tu perfil debes iniciar sesión primero</h3>
        <button onClick={() => setView('login')} className={THEME_CLASSES.btnPrimary}>Ir al Login</button>
      </div>
    );
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setErrorMess('');

    if (!name.trim() || !lastName.trim()) {
      setErrorMess("El nombre y apellido no pueden estar vacíos.");
      return;
    }

    try {
      const updatedUser = await ApiClient.updateProfile(user.id, {
        name: name.trim(),
        lastName: lastName.trim()
      });
      refreshUser({ ...user, ...updatedUser });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setErrorMess(err.message || "Error al actualizar perfil.");
    }
  };

  const handlePassUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccess(false);

    if (newPass.length < 6) {
      alert("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      await ApiClient.changePassword(user.id, currPass, newPass);
      alert("¡Contraseña actualizada con éxito! Se ha guardado tu cambio de forma segura.");
      setCurrPass('');
      setNewPass('');
      setPassSuccess(true);
      setTimeout(() => setPassSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || "No se pudo actualizar la contraseña.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">

      <div>
        <h2 className="font-sans text-2xl font-black text-[#1F2937] tracking-tight">Mi Perfil Personal</h2>
        <p className="text-xs text-gray-500">Administra tus datos de contacto y seguridad para agilizar tus reservas de cabañas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left Stats Info card */}
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm text-center space-y-4 h-fit">
          <div className="w-20 h-20 rounded-full bg-[#1F5937] text-white flex items-center justify-center font-bold text-2xl mx-auto border-4 border-emerald-50 shadow-inner">
            {user.name.charAt(0).toUpperCase()}{user.lastName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold text-lg text-[#1F2937]">{user.name} {user.lastName}</h4>
            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
              {user.role === 'admin' ? 'Administrador del sitio' : 'Huésped Registrado'}
            </span>
          </div>

          <hr className="border-gray-100" />

          <div className="text-left text-xs text-gray-500 space-y-2">
            <p className="flex items-center gap-2">
              <Mail size={14} className="text-[#8DB600]" />
              <span className="truncate" title={user.email}>{user.email}</span>
            </p>
            <p className="flex items-center gap-2">
              <Award size={14} className="text-[#8DB600]" />
              <span>Miembro desde: 2026</span>
            </p>
          </div>
        </div>

        {/* Right Details update Forms */}
        <div className="md:col-span-2 space-y-6">

          {/* PROFILE DATA FORM */}
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-[#1F2937] border-b border-gray-100 pb-2">Información de Cuenta</h4>

            {success && (
              <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-xl border border-emerald-200 flex items-center gap-1.5 font-bold">
                <CheckCircle2 size={16} />
                <span>Perfil actualizado exitosamente.</span>
              </div>
            )}

            {errorMess && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-150">{errorMess}</p>
            )}

            <form onSubmit={handleUpdate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Nombre</label>
                <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2 bg-gray-50/50">
                  <User size={14} className="text-gray-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-xs text-[#1F2937] bg-transparent focus:outline-none w-full"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Apellido</label>
                <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2 bg-gray-50/50">
                  <User size={14} className="text-gray-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="text-xs text-[#1F2937] bg-transparent focus:outline-none w-full"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  className={`${THEME_CLASSES.btnPrimary} text-xs py-2 px-4 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer`}
                >
                  <Save size={14} /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>

          {/* PASSWORD CHANGE FORM */}
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-[#1F2937] border-b border-gray-100 pb-2">Cambiar Contraseña</h4>

            {passSuccess && (
              <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-xl border border-emerald-200 flex items-center gap-1.5 font-bold">
                <CheckCircle2 size={16} />
                <span>La contraseña fue guardada correctamente.</span>
              </div>
            )}

            <form onSubmit={handlePassUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Contraseña Actual</label>
                  <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2 bg-gray-50/50">
                    <Lock size={14} className="text-gray-400 mr-2 shrink-0" />
                    <input
                      type="password"
                      value={currPass}
                      onChange={(e) => setCurrPass(e.target.value)}
                      placeholder="******"
                      className="text-xs text-[#1F2937] bg-transparent focus:outline-none w-full"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Nueva Contraseña</label>
                  <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2 bg-gray-50/50">
                    <Lock size={14} className="text-gray-400 mr-2 shrink-0" />
                    <input
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="text-xs text-[#1F2937] bg-transparent focus:outline-none w-full"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className={`${THEME_CLASSES.btnSecondary} text-xs py-2 px-4 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer`}
                >
                  <Lock size={14} /> Modificar Contraseña
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};
