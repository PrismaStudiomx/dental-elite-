import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Lock, Trash2, CheckCircle, RefreshCw, Plus, Calendar, Clock
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bxhjsbbacfibmzjypfak.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_EyOu6Luna7s-gMmp0Rw8WA_D-Oms1U_';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function Admin() {
  const [password, setPassword] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [todasLasCitas, setTodasLasCitas] = useState([]);
  const [cargandoAdmin, setCargandoAdmin] = useState(false);

  const PASSWORD_CORRECTA = 'doctorelite2026'; // <--- Cambia la clave secreta aquí

  const cargarCitasAdmin = async () => {
    setCargandoAdmin(true);
    try {
      const { data, error } = await supabase
        .from('citas2')
        .select('*')
        .order('fecha', { ascending: true })
        .order('horario', { ascending: true });

      if (error) throw error;
      setTodasLasCitas(data || []);
    } catch (err) {
      alert("Error al cargar agenda: " + err.message);
    } finally {
      setCargandoAdmin(false);
    }
  };

  useEffect(() => {
    if (isAuthed) {
      cargarCitasAdmin();
    }
  }, [isAuthed]);

  const manejarLoginAdmin = (e) => {
    e.preventDefault();
    if (password === PASSWORD_CORRECTA) {
      setIsAuthed(true);
    } else {
      alert("Contraseña incorrecta médica.");
      setPassword('');
    }
  };

  const eliminarCita = async (id) => {
    if (!confirm("¿Deseas cancelar y liberar este horario en el sistema?")) return;
    try {
      const { error } = await supabase.from('citas2').delete().eq('id', id);
      if (error) throw error;
      alert("Cita liberada con éxito.");
      cargarCitasAdmin();
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased py-20 px-6">
      
      {/* NAVBAR SIMPLIFICADO ADMIN */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white">
            <Plus size={14} strokeWidth={3} />
          </div>
          <span className="text-sm font-black uppercase tracking-wider">PANEL MÉDICO PRIVADO</span>
        </div>
        <span className="text-[10px] bg-red-600 text-white font-black px-3 py-1 rounded-full animate-pulse">SOLO PERSONAL</span>
      </nav>

      {!isAuthed ? (
        /* ACCESO SEGURO */
        <div className="pt-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto bg-white p-10 rounded-[2rem] border border-slate-200 shadow-xl text-center">
            <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-slate-200">
              <Lock size={26} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Clínica Dental Elite</h3>
            <p className="text-slate-400 text-xs mb-8 leading-relaxed">Sistema de seguridad de agenda interna. Introduce la clave de administrador para consultar pacientes.</p>
            
            <form onSubmit={manejarLoginAdmin} className="space-y-4">
              <input 
                type="password" 
                placeholder="Contraseña Maestra" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4.5 bg-slate-50 rounded-2xl border border-slate-200 text-sm outline-none text-center font-bold focus:border-blue-600 focus:bg-white transition-all tracking-widest"
              />
              <button type="submit" className="w-full bg-blue-600 hover:bg-slate-900 text-white py-4 rounded-2xl font-black text-xs tracking-wider uppercase transition-all shadow-md shadow-blue-100">
                DESBLOQUEAR CALENDARIO
              </button>
            </form>
          </motion.div>
        </div>
      ) : (
        /* PANEL MÉDICO */
        <div className="max-w-5xl mx-auto pt-10 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest block mb-1">Base de datos de Citas</span>
              <h2 className="text-2xl font-black text-slate-900">Agenda de Citas Activas</h2>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={cargarCitasAdmin} 
                disabled={cargandoAdmin}
                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all flex items-center gap-2 text-xs font-bold disabled:opacity-50"
              >
                <RefreshCw size={14} className={cargandoAdmin ? 'animate-spin' : ''} /> Refrescar Citas
              </button>
              <button 
                onClick={() => { setIsAuthed(false); setPassword(''); }} 
                className="px-4 py-3 bg-slate-900 text-white text-xs font-bold rounded-xl transition-all hover:bg-slate-800"
              >
                Bloquear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Citas Totales</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{todasLasCitas.length}</p>
            </div>
            <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-md shadow-blue-100 col-span-2 sm:col-span-1">
              <p className="text-blue-100 font-bold text-[10px] uppercase tracking-wider">Sincronización</p>
              <p className="text-base font-black mt-2 flex items-center gap-1.5"><CheckCircle size={16} /> Supabase En Línea</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/50">
                    <th className="p-4 uppercase tracking-wider">Día / Fecha</th>
                    <th className="p-4 uppercase tracking-wider">Horario Seleccionado</th>
                    <th className="p-4 uppercase tracking-wider">Servicio Requerido</th>
                    <th className="p-4 uppercase tracking-wider">Notas adjuntas</th>
                    <th className="p-4 text-right uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {todasLasCitas.map((cita) => (
                    <tr key={cita.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-black text-slate-900 whitespace-nowrap">{cita.fecha}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-md border border-blue-100">{cita.horario}</span>
                      </td>
                      <td className="p-4 font-bold text-slate-800">{cita.servicio}</td>
                      <td className="p-4 text-slate-400 max-w-xs truncate" title={cita.nota}>
                        {cita.nota || <span className="italic text-slate-300">Sin notas</span>}
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => eliminarCita(cita.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {todasLasCitas.length === 0 && (
                <div className="p-12 text-center text-slate-400">No hay citas en la agenda para mostrar hoy.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}