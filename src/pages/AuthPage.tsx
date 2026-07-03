/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { THEME_CLASSES } from '../styles/tokens';
import { Mail, Lock, User, Key, Sparkles, LogIn, Award, AlertCircle, HelpCircle } from 'lucide-react';
import { Logo } from '../components/Logo';

export const AuthPage: React.FC = () => {
  const { login, register, adminMessage, setAdminMessage, setView } = useApp();
  const [isLoginView, setIsLoginView] = useState(true);

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);

  // Quick Autofill helpers for tests
  const handleAdminAutofill = () => {
    setLoginEmail('admin@retreatreserve.com');
    setLoginError(null);
    setIsLoginView(true);
  };

  const handleDemoAutofill = () => {
    setLoginEmail('maria@ejemplo.com');
    setLoginError(null);
    setIsLoginView(true);
  };

  // Submit login checks
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const trimmedEmail = loginEmail.trim();
    if (!trimmedEmail) {
      setLoginError("Por favor ingresa tu correo electrónico.");
      return;
    }

    try {
      await login(trimmedEmail, loginPassword);
      // Clean up warnings
      setAdminMessage(null);
      // Redirect home or back
      setView('home');
    } catch (err: any) {
      setLoginError(err.message || "Usuario no registrado en la base de datos.");
    }
  };

  // Submit Register checks
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(false);

    // Validate inputs (Historial 13 input check rules)
    const trimmedName = regName.trim();
    const trimmedLastName = regLastName.trim();
    const trimmedEmail = regEmail.trim();
    const password = regPassword;

    if (!trimmedName || !trimmedLastName) {
      setRegError("El nombre y apellido son obligatorios y deben ser válidos.");
      return;
    }

    if (trimmedName.length < 2 || trimmedLastName.length < 2) {
      setRegError("El nombre y apellido deben tener al menos 2 caracteres.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setRegError("Por favor, introduce una dirección de correo electrónico válida.");
      return;
    }

    if (!password || password.length < 6) {
      setRegError("La contraseña debe constar de al menos 6 caracteres para fines de seguridad.");
      return;
    }

    try {
      await register({
        name: trimmedName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        role: 'user',
        password: regPassword
      });

      setRegSuccess(true);
      // Clear fields
      setRegName('');
      setRegLastName('');
      setRegEmail('');
      setRegPassword('');

      // Auto toggle view switch
      setTimeout(() => {
        setIsLoginView(true);
        setLoginEmail(trimmedEmail);
        setRegSuccess(false);
      }, 4000);

    } catch (err: any) {
      setRegError(err.message || "El correo electrónico ya se encuentra registrado.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundImage: 'radial-gradient(#F4E9D9 1px, transparent 1px)', backgroundSize: '24px 24px' }}>

      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-4">
        <Logo mode="light" layout="vertical" iconSize={60} className="mx-auto" />
        <p className="text-center text-xs text-gray-500 uppercase tracking-widest font-bold">
          {isLoginView ? 'Identifícate en tu cuenta' : 'Regístrate como Miembro nuevo'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">

        {/* Reservation booking warning banner (Historial 30) */}
        {adminMessage && (
          <div className="mb-4 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-xs text-xs text-amber-800 animate-bounce">
            <div className="flex gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">Requisito de Reserva</p>
                <p>{adminMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form containerbox */}
        <div className="bg-white py-8 px-4 shadow-xl rounded-3xl sm:px-10 border border-gray-100 space-y-6">

          {isLoginView ? (
            /* --- LOGIN FORM --- */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="text-center pb-2">
                <span className="text-xs bg-emerald-50 text-[#1F5937] py-1 px-3 rounded-full font-bold">¡Bienvenido de vuelta!</span>
              </div>

              {loginError && (
                <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-200 flex gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <p>{loginError}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Correo Electrónico</label>
                <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50/50">
                  <Mail size={16} className="text-gray-400 mr-2.5 shrink-0" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="maria@ejemplo.com o admin@retreatreserve.com"
                    className="text-xs text-[#1F2937] bg-transparent focus:outline-none w-full"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Contraseña</label>
                  <span className="text-[10px] text-gray-400 hover:text-[#1F5937] hover:underline cursor-pointer">¿La olvidaste?</span>
                </div>
                <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50/50">
                  <Lock size={16} className="text-gray-400 mr-2.5 shrink-0" />
                  <input
                    type="password"
                    placeholder="Contraseña segura"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="text-xs text-[#1F2937] bg-transparent focus:outline-none w-full"
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`${THEME_CLASSES.btnPrimary} w-full py-3 mt-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2`}
              >
                <LogIn size={15} />
                <span>Ingresar</span>
              </button>
            </form>
          ) : (
            /* --- REGISTER FORM --- */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">

              <div className="text-center pb-2">
                <span className="text-xs bg-lime-50 text-[#8DB600] py-1 px-3 rounded-full font-bold">Crear nueva cuenta</span>
              </div>

              {regSuccess && (
                <div className="bg-emerald-50 text-emerald-800 text-xs p-4 rounded-xl border border-emerald-200 space-y-1.5">
                  <p className="font-extrabold">¡Registro Creado con Éxito!</p>
                  <p>Se envió un email de confirmación y enlace de activación e inicio inmediato a tu bandeja. Revisa el simulador abajo.</p>
                </div>
              )}

              {regError && (
                <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-200 flex gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <p>{regError}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Nombre</label>
                  <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2 bg-gray-50/50">
                    <User size={14} className="text-gray-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="María"
                      className="text-xs text-[#1F2937] bg-transparent focus:outline-none w-full"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Apellido</label>
                  <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2 bg-gray-50/50">
                    <User size={14} className="text-gray-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      placeholder="González"
                      className="text-xs text-[#1F2937] bg-transparent focus:outline-none w-full"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Correo Electrónico</label>
                <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50/50">
                  <Mail size={16} className="text-gray-400 mr-2.5 shrink-0" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="text-xs text-[#1F2937] bg-transparent focus:outline-none w-full"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Contraseña para su Cuenta</label>
                <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50/50">
                  <Key size={16} className="text-gray-400 mr-2.5 shrink-0" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="text-xs text-[#1F2937] bg-transparent focus:outline-none w-full"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`${THEME_CLASSES.btnSecondary} w-full py-3 mt-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2`}
              >
                <Sparkles size={15} />
                <span>Registrarme ya</span>
              </button>
            </form>
          )}

          {/* Toggle button bar */}
          <div className="border-t border-gray-100 pt-5 text-center">
            <button
              onClick={() => {
                setIsLoginView(!isLoginView);
                setLoginError(null);
                setRegError(null);
              }}
              className="text-xs text-[#1F5937] font-bold hover:underline cursor-pointer focus:outline-none"
            >
              {isLoginView ? '¿No tienes cuenta? Registrate aquí.' : '¿Ya eres miembro? Inicia sesión aquí.'}
            </button>
          </div>

          {/* QUICK TESTING LOGIN ACCELERATORS */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-gray-150 space-y-2">
            <p className="text-[10px] uppercase font-bold text-slate-400 text-center tracking-widest flex items-center justify-center gap-1">
              <Award size={12} className="text-[#8DB600]" />
              Aceleradores de prueba
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleAdminAutofill}
                className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold p-2 rounded-lg transition-all cursor-pointer truncate"
                title="Llenar correo del administrador"
              >
                🔑 Admin Autofill
              </button>
              <button
                type="button"
                onClick={handleDemoAutofill}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold p-2 rounded-lg transition-all cursor-pointer truncate"
                title="Llenar correo del usuario de demo"
              >
                👥 Demo User Autofill
              </button>
            </div>
            <p className="text-[9px] text-center text-gray-400 italic">No requieren contraseña física para la demostración en el iFrame sandbox.</p>
          </div>

        </div>

      </div>
    </div>
  );
};
