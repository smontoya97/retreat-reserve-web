/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, ChevronDown, ChevronUp, Trash2, CheckCircle2, ExternalLink } from 'lucide-react';

export const EmailLoggerTray: React.FC = () => {
  const { sentEmails, refreshEmails, setView } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  const handleClear = () => {
    refreshEmails();
    setSelectedEmailId(null);
  };

  const handleVerifyEmailClick = (emailBody: string) => {
    // Look for token link in body
    const match = emailBody.match(/\/verify-email\?token=[a-zA-Z0-9-]+/);
    if (match) {
      const url = match[0];
      const token = url.split('token=')[1];

      // Simulate click
      setExpanded(false);
      setView('login');
      alert(`🎉 Correo Verificado Exitosamente!\nSe procesó el token de registro: "${token}". Ahora puedes iniciar sesión en tucabana.`);
    }
  };

  if (sentEmails.length === 0) {
    return null; // Don't show if no emails triggered yet to prevent clutter
  }

  return (
    <div className="fixed bottom-6 left-6 z-40 max-w-sm sm:max-w-md bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 overflow-hidden font-mono text-xs">

      {/* Header bar */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="bg-slate-800 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-700 transition"
      >
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-emerald-400 animate-bounce" />
          <span className="font-bold tracking-tight">Simulador de Correos Sent ({sentEmails.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </div>

      {/* Expanded view */}
      {expanded && (
        <div className="p-4 max-h-96 overflow-y-auto space-y-3 bg-slate-950">
          <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-2">
            <span>Servidor SMTP Integrado (Ficticio)</span>
            <button
              onClick={handleClear}
              className="hover:text-red-400 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={12} /> Limpiar Todo
            </button>
          </div>

          <div className="space-y-2">
            {sentEmails.map((email) => {
              const isSelected = selectedEmailId === email.id;
              const hasVerifyLink = email.body.includes('/verify-email');

              return (
                <div
                  key={email.id}
                  className={`border rounded-lg p-2.5 transition duration-200 ${isSelected ? 'border-emerald-500 bg-slate-900' : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900'}`}
                >
                  <div
                    onClick={() => setSelectedEmailId(isSelected ? null : email.id)}
                    className="cursor-pointer space-y-1"
                  >
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Para: <strong className="text-white">{email.to}</strong></span>
                      <span>{email.sentAt}</span>
                    </div>
                    <div className="font-bold text-emerald-400 text-[11px] truncate">{email.subject}</div>
                  </div>

                  {/* Render simulated email body */}
                  {isSelected && (
                    <div className="mt-3.5 pt-3.5 border-t border-slate-800 text-[11px] text-slate-300 whitespace-pre-line leading-relaxed select-text bg-slate-950 p-2.5 rounded">
                      {email.body}

                      {/* Helper simulation link highlights */}
                      {hasVerifyLink && (
                        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2">
                          <p className="text-[10px] text-[#8DB600] font-bold">✨ Enlace de Verificación Encontrado:</p>
                          <button
                            onClick={() => handleVerifyEmailClick(email.body)}
                            className="w-full bg-[#1F5937] hover:bg-[#143B24] text-white py-1.5 px-3 rounded-xl text-[10px] font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <ExternalLink size={12} />
                            Hacer clic para verificar correo
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
