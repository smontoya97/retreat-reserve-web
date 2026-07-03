/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { Trees, Facebook, Twitter, Instagram, HelpCircle, Mail, MapPin } from 'lucide-react';
import { Logo } from './Logo';

export const Footer: React.FC = () => {
  const { setView } = useApp();

  return (
    <footer className="w-full bg-[#1F5937] text-white py-12 border-t border-emerald-800 rounded-t-[20px] md:rounded-t-[28px] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main responsive grid columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-emerald-800">
          
          {/* Logo Brand info (Alineado a la izquierda) */}
          <div className="md:col-span-2 space-y-4">
            <div 
              onClick={() => { setView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="cursor-pointer group w-fit transition-all duration-300 hover:opacity-90 active:scale-98"
            >
              <Logo mode="dark" layout="horizontal" iconSize={36} />
            </div>
            
            <p className="text-emerald-100 text-sm max-w-sm leading-relaxed">
              Encuentra y reserva cabañas únicas, rodeadas de la belleza natural de Colombia. Diseñadas para una desconexión y reconexión profunda.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#8DB600] mb-4">Información</h4>
            <ul className="space-y-2 text-sm text-emerald-100">
              <li>
                <button 
                  onClick={() => setView('home')} 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Cabañas disponibles
                </button>
              </li>
              <li>
                <span className="text-emerald-300">Términos y Condiciones</span>
              </li>
              <li>
                <span className="text-emerald-300">Políticas de Privacidad</span>
              </li>
              <li>
                <span className="text-emerald-300">Preguntas Frecuentes</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#8DB600] mb-4">Contacto</h4>
            <ul className="space-y-3.5 text-xs text-emerald-100">
              <li className="flex items-center gap-2">
                <MapPin size={16} className="text-[#8DB600]" />
                <span>Valle de Bravo / Mazamitla / Tapalpa</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-[#8DB600]" />
                <a href="mailto:hola@retreatreserve.com" className="hover:underline">hola@retreatreserve.com</a>
              </li>
              <li className="flex items-center gap-2">
                <HelpCircle size={16} className="text-[#8DB600]" />
                <span>Atención a Clientes 24/7</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Lower Row (Branded elements aligned correctly) */}
        <div className="flex flex-col sm:row sm:flex-row items-center justify-between gap-4 text-xs text-emerald-200">
          
          {/* Aligned left: Isologotipo, año, copyright */}
          <div className="flex flex-col sm:flex-row items-center sm:space-x-3 text-center sm:text-left">
            <span className="font-semibold text-white">© 2026 Retreat Reserve.</span>
            <span className="hidden sm:inline-block">|</span>
            <span>Todos los derechos reservados. Diseñado con armonía natural.</span>
          </div>

          {/* Branded Social platforms (Historial 27 alignment) */}
          <div className="flex items-center space-x-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">Síguenos:</span>
            <span className="p-1.5 bg-emerald-800 rounded-lg hover:bg-[#8DB600] text-white transition-colors cursor-pointer">
              <Facebook size={16} />
            </span>
            <span className="p-1.5 bg-emerald-800 rounded-lg hover:bg-[#8DB600] text-white transition-colors cursor-pointer">
              <Twitter size={16} />
            </span>
            <span className="p-1.5 bg-emerald-800 rounded-lg hover:bg-[#8DB600] text-white transition-colors cursor-pointer">
              <Instagram size={16} />
            </span>
          </div>

        </div>

      </div>
    </footer>
  );
};
