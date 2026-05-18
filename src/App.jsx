import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, ShieldCheck, Stethoscope, Sparkles, 
  ChevronRight, ChevronDown, Plus, MessageCircle, AlertCircle, PhoneCall
} from 'lucide-react';
// ========================================================
// 1. CONEXIÓN DIRECTA A SUPABASE
// ========================================================
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bxhjsbbacfibmzjypfak.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_EyOu6Luna7s-gMmp0Rw8WA_D-Oms1U_';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [step, setStep] = useState(1);
  const [reserva, setReserva] = useState({ servicio: '', fecha: '', horario: '', nota: '' });
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });
  const [ocupados, setOcupados] = useState([]); 
  const [openFaq, setOpenFaq] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mensajeUrgencia, setMensajeUrgencia] = useState('');

  const servicios = [
    { id: 1, nombre: 'Diseño de Sonrisa', precio: 'Valoración Gratis', icon: <Sparkles size={24} />, desc: 'Carillas y estética avanzada con tecnología digital.', img: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?q=80&w=800' },
    { id: 2, nombre: 'Ortodoncia Invisible', precio: 'Desde $1,200/mes', icon: <ShieldCheck size={24} />, desc: 'Alineadores transparentes y cómodos (Invisalign).', img: 'https://cuidateplus.marca.com/sites/default/files/styles/natural/public/cms/odontologia-invisible.jpg.webp?itok=Zay4ZgcF' },
    { id: 3, nombre: 'Implantes Dentales', precio: 'Consúltanos', icon: <Stethoscope size={24} />, desc: 'Restauración funcional permanente y sin dolor.', img: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?q=80&w=800' }
  ];

  const faqs = [
    { q: "¿Aceptan seguros médicos?", a: "Sí, trabajamos con las principales aseguradoras del país y ofrecemos facturación inmediata." },
    { q: "¿Tienen citas de urgencia?", a: "Contamos con espacios bloqueados diariamente para atender dolores agudos el mismo día." },
    { q: "¿Duele el blanqueamiento?", a: "Utilizamos tecnología de desensibilización previa para garantizar cero molestias durante el proceso." }
  ];

  const formatearFecha = (fecha) => {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  };

  const generarProximosDias = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  // CONSULTAR DISPONIBILIDAD (CORREGIDO PARA ADAPTAR EL FORMATO MILITAR)
  useEffect(() => {
    const consultarDisponibilidad = async () => {
      setOcupados([]); 
      const fechaFiltro = formatearFecha(fechaSeleccionada);
      try {
        const { data, error } = await supabase
          .from('citas2')
          .select('horario')
          .eq('fecha', fechaFiltro);

        if (error) throw error;
   
        if (data) {
          // Traducimos los formatos de la base de datos para que hagan Match con tus botones
          const horariosMapeados = data.map(cita => {
            if (!cita.horario) return '';
            
            // Si el horario de la base de datos viene en formato militar "11:00:00" o "16:00:00"
            if (cita.horario.includes(':') && !cita.horario.includes('M')) {
              const [h, m] = cita.horario.split(':');
              let horaNum = parseInt(h, 10);
              const meridiano = horaNum >= 12 ? 'PM' : 'AM';
              
              horaNum = horaNum % 12;
              horaNum = horaNum ? horaNum : 12; // Si es 0 lo convierte en 12
              
              return `${String(horaNum).padStart(2, '0')}:${m} ${meridiano}`;
            }
            
            return cita.horario; // Si ya venía como "11:00 AM", lo deja igual
          });

          setOcupados(horariosMapeados);
        }
      } catch (err) {
        console.error("Error al consultar Supabase:", err.message);
      }
    };
    consultarDisponibilidad();
  }, [fechaSeleccionada]);

  // INSERTAR EN LA BASE DE DATOS
  const registrarCitaEnBase = async () => {
    setCargando(true);
    try {
      // Convertimos el horario en segundo plano de "11:00 AM" a "11:00:00" solo para Supabase
      let horaFormateada = reserva.horario;
      if (reserva.horario && reserva.horario.includes(' ')) {
        const [tiempo, meridiano] = reserva.horario.split(' ');
        let [horas, minutos] = tiempo.split(':').map(Number);
        if (meridiano === 'PM' && horas !== 12) horas += 12;
        if (meridiano === 'AM' && horas === 12) horas = 0;
        horaFormateada = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:00`;
      }

      const { error } = await supabase
        .from('citas2')
        .insert([
          {
            fecha: reserva.fecha,
            horario: horaFormateada, // Envía el formato correcto a la base de datos
            servicio: reserva.servicio,
            nota: reserva.nota
          }
        ]);

      if (error) throw error;

      const mensajeWA = `Hola!%20Deseo%20confirmar%20mi%20cita%20médica.%0A%0A📌%20*Servicio:*%20${reserva.servicio}%0A📅%20*Fecha:*%20${reserva.fecha}%0A⏰%20*Hora:*%20${reserva.horario}%0A📝%20*Nota:*%20${reserva.nota || 'Ninguna'}`;
      window.open(`https://wa.me/521234567890?text=${mensajeWA}`);

      alert("¡Cita agendada con éxito en el sistema!");
      setStep(1);
      setReserva({ servicio: '', fecha: '', horario: '', nota: '' });
    } catch (err) {
      alert("Error al guardar en la base de datos: " + err.message);
    } finally {
      setCargando(false);
    }
  };

  const enviarUrgenciaWhatsApp = () => {
    if (!mensajeUrgencia.trim()) {
      alert("Por favor escribe brevemente qué te sucede para poder priorizar tu atención.");
      return;
    }
    const textoWA = `🚨%20*¡URGENCIA%20DENTAL!*%20🚨%0A%0AEl%20paciente%20reporta%20el%20siguiente%20problema:%0A💬%20_"${encodeURIComponent(mensajeUrgencia)}_"%0A%0ANecesito%20atención%20inmediata,%20por%20favor.`;
    window.open(`https://wa.me/521234567890?text=${textoWA}`);
  };

  const renderHorarios = () => {
    const diaSemana = fechaSeleccionada.getDay();
    if (diaSemana === 0) {
      return (
        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-center text-red-600 font-bold text-sm">
          Aviso: Los domingos la clínica permanece cerrada. Por favor elige otro día.
        </div>
      );
    }

    let horariosDelDia = [];
    if (diaSemana === 6) {
      horariosDelDia = ['10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM'];
    } else {
      horariosDelDia = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'];
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {horariosDelDia.map(h => {
          const estaOcupado = ocupados.includes(h);
          let horaYaPaso = false;
          const hoy = new Date();
          const esMismoDia = fechaSeleccionada.toDateString() === hoy.toDateString();

          if (esMismoDia) {
            const [tiempo, meridiano] = h.split(' ');
            let [horas, minutos] = tiempo.split(':').map(Number);
            
            if (meridiano === 'PM' && horas !== 12) horas += 12;
            if (meridiano === 'AM' && horas === 12) horas = 0;

            const horaBoton = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), horas, minutos);
            if (hoy > horaBoton) {
              horaYaPaso = true;
            }
          }

          const deshabilitarBoton = estaOcupado || horaYaPaso;

          return (
            <button 
              key={h}
              disabled={deshabilitarBoton}
              onClick={() => { 
                setReserva({...reserva, horario: h, fecha: formatearFecha(fechaSeleccionada)});
                setStep(3); 
              }}
              className={`py-3.5 rounded-xl border text-xs font-bold text-center transition-all ${
                deshabilitarBoton 
                  ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed line-through' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900'
              }`}
            >
              {h} {estaOcupado ? '(Ocupado)' : horaYaPaso ? '(Pasado)' : ''}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased overflow-x-hidden">
      
      {/* BOTÓN FLOTANTE S.O.S DE URGENCIAS */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <span className="bg-red-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-md shadow-lg animate-pulse tracking-wider">
          ¿Urgencia? 24/7
        </span>
        <button 
          onClick={() => document.getElementById('modulo-urgencias').scrollIntoView({behavior: 'smooth'})}
          className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-200 hover:scale-110 transition-all group"
        >
          <PhoneCall size={24} className="group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 md:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Plus size={18} strokeWidth={3} />
          </div>
          <span className="text-lg font-black tracking-tighter uppercase text-slate-900">Dental<span className="text-blue-600">Elite</span></span>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={() => document.getElementById('modulo-urgencias').scrollIntoView({behavior: 'smooth'})} 
            className="text-red-600 border border-red-200 bg-red-50/50 px-3 md:px-4 py-2 rounded-full text-[11px] font-bold hover:bg-red-600 hover:text-white transition-all"
          >
            SOS
          </button>
          <button 
            onClick={() => document.getElementById('reservar').scrollIntoView({behavior: 'smooth'})} 
            className="bg-slate-900 text-white px-4 py-2 rounded-full text-[11px] font-bold hover:bg-blue-600 transition-all shadow-sm"
          >
            AGENDAR
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-32 pb-16 px-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">Excelencia Médica</span>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight mb-6">
              Tu salud dental, <br/><span className="text-blue-600 italic font-serif">redefinida.</span>
            </h2>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-md mb-8">
              Especialistas certificados utilizando la última tecnología digital para un diagnóstico preciso, estético y completamente libre de dolor.
            </p>
            <button 
              onClick={() => document.getElementById('reservar').scrollIntoView({behavior: 'smooth'})}
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-900 transition-all shadow-lg shadow-blue-200 text-sm"
            >
              Agendar Cita Normal
            </button>
          </motion.div>
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1629909607103-68d80509f61b?q=80&w=1000" className="rounded-[2.5rem] shadow-2xl border border-white w-full h-auto object-cover" alt="Especialista Dental" />
          </div>
        </div>
      </section>

      {/* TRATAMIENTOS */}
      <section className="py-20 bg-slate-100/60 px-6 border-y border-slate-200/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900">Tratamientos Avanzados</h3>
            <p className="text-slate-400 text-xs md:text-sm mt-2">Tecnología clínica aplicada a tu bienestar.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {servicios.map((s, idx) => (
              <div key={idx} className="bg-white rounded-[2rem] overflow-hidden border border-slate-200/60 shadow-sm flex flex-col justify-between">
                <div className="h-48 md:h-52 overflow-hidden relative">
                  <img src={s.img} className="w-full h-full object-cover" alt={s.nombre} />
                </div>
                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-blue-600 mb-4">{s.icon}</div>
                    <h4 className="font-bold text-lg md:text-xl text-slate-900 mb-2">{s.nombre}</h4>
                    <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-6">{s.desc}</p>
                  </div>
                  <div>
                    <span className="inline-block text-xs font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full">{s.precio}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MÓDULO EXCLUSIVO DE URGENCIAS */}
      <section id="modulo-urgencias" className="pt-16 px-4 md:px-6 max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-[2.5rem] p-6 md:p-12 text-white shadow-xl shadow-red-100 relative overflow-hidden">
          <div className="absolute right-[-20px] top-[-20px] text-red-500/20 pointer-events-none">
            <AlertCircle size={240} strokeWidth={1} />
          </div>
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 bg-red-700/50 border border-red-500/30 w-max px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-6">
              <AlertCircle size={14} className="animate-pulse" /> Módulo de Atención Inmediata
            </div>
            <h3 className="text-2xl md:text-4xl font-black tracking-tight leading-tight mb-4">
              ¿Tienes una Urgencia Dental?
            </h3>
            <p className="text-red-100 text-xs md:text-sm mb-6 md:text-base leading-relaxed">
              Dolor severo, traumatismos o inflamación. Escribe qué te ocurre aquí abajo; saltarás la fila de espera y un odontólogo de guardia te atenderá de inmediato por WhatsApp.
            </p>
            <div className="space-y-3">
              <textarea 
                value={mensajeUrgencia}
                onChange={(e) => setMensajeUrgencia(e.target.value)}
                placeholder="Ej: Tengo un dolor insoportable en una muela desde hace 2 horas..."
                className="w-full p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 outline-none text-xs md:text-sm h-24 placeholder:text-red-200/80 text-white focus:bg-white/15 focus:border-white/50 transition-all resize-none"
              />
              <button 
                onClick={enviarUrgenciaWhatsApp}
                className="w-full sm:w-auto bg-white text-red-700 px-6 py-3.5 rounded-2xl font-black text-xs md:text-sm hover:bg-slate-900 hover:text-white transition-all shadow-lg flex items-center justify-center gap-2.5"
              >
                <MessageCircle size={18} strokeWidth={2.5} /> CONTACTAR A GUARDIA SOS
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* PANEL DE RESERVAS */}
      <section id="reservar" className="py-16 md:py-24 px-4 md:px-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="bg-slate-900 p-6 md:p-10 text-white flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
              <div>
                <span className="text-blue-500 text-[10px] uppercase font-black tracking-widest block mb-2">Citas Online</span>
                <h3 className="text-xl md:text-2xl font-black leading-tight">PANEL DE<br/>RESERVA</h3>
              </div>
              <div className="flex flex-row md:flex-col justify-between md:justify-start gap-4 md:space-y-6 mt-6 md:mt-10">
                {[1,2,3].map(n => (
                  <div key={n} className={`flex items-center gap-2 md:gap-3 transition-opacity duration-300 ${step === n ? 'opacity-100' : 'opacity-40'}`}>
                    <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border flex items-center justify-center text-[9px] md:text-[10px] font-bold ${step === n ? 'bg-blue-600 border-blue-600 text-white' : 'border-white text-white'}`}>{n}</div>
                    <span className="text-[9px] md:text-[10px] uppercase font-black tracking-widest">{n === 1 ? 'Tratamiento' : n === 2 ? 'Horario' : 'Confirmar'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 p-6 md:p-10 bg-slate-50/50">
              <AnimatePresence mode="wait">
                 {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Paso 1: Elige tu consulta</label>
                    {servicios.map(s => (
                      <button 
                        key={s.id}
                        onClick={() => { setReserva({...reserva, servicio: s.nombre}); setStep(2); }}
                        className="w-full p-4 bg-white rounded-2xl border border-slate-200/80 text-left flex justify-between items-center hover:border-blue-600 hover:bg-blue-50/20 transition-all group"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-sm md:text-base">{s.nombre}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{s.precio}</p>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                      </button>
                    ))}
                  </motion.div>
                )}

                {step === 2 && (
  <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
    <div>
      {/* SECCIÓN CORREGIDA CON EL BOTÓN PARA REGRESAR AL PASO 1 */}
      <div className="flex justify-between items-center mb-3">
        <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">Paso 2: Selecciona el Día</label>
        <button 
          onClick={() => setStep(1)} 
          className="text-[11px] font-bold text-blue-600 hover:text-slate-900 transition-colors flex items-center gap-1"
        >
          ← Cambiar tratamiento
        </button>
      </div>
      
      {/* CONTENEDOR DE DÍAS (Mantiene el scroll fluido de celular) */}
      <div className="w-full overflow-x-auto overflow-y-hidden pt-1 pb-3 flex gap-2 scrollbar-thin touch-pan-x">
        {generarProximosDias().map((f, i) => {
          const isSel = f.toDateString() === fechaSeleccionada.toDateString();
          return (
            <button 
              key={i} 
              type="button"
              onClick={() => setFechaSeleccionada(f)} 
              className={`flex-shrink-0 w-14 h-16 rounded-xl flex flex-col items-center justify-center border transition-all ${
                isSel 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100' 
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <span className="text-[8px] font-bold uppercase mb-0.5">{f.toLocaleDateString('es', {weekday: 'short'})}</span>
              <span className="text-base font-black">{f.getDate()}</span>
            </button>
          );
        })}
      </div>
    </div>
    <div>
      <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-3 block">Horas Disponibles hoy</label>
      {renderHorarios()}
    </div>
  </motion.div>
)}

                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                    <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100/70">
                      <p className="text-[9px] uppercase font-black text-blue-500 tracking-widest mb-1">Tu selection</p>
                      <h5 className="font-bold text-slate-900 text-base md:text-lg">{reserva.servicio}</h5>
                      <p className="text-xs text-slate-500 mt-0.5">{reserva.fecha} a las {reserva.horario}</p>
                    </div>
                    <div>
                      <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2 block">¿Quieres dejarle una nota al odontólogo?</label>
                      <textarea 
                        placeholder="Ej: Dolor en zona molar, revisión de rutina, etc..."
                        className="w-full p-4 bg-white rounded-2xl border border-slate-200 outline-none text-xs md:text-sm h-24 md:h-28 focus:border-blue-600 transition-colors resize-none"
                        onChange={(e) => setReserva({...reserva, nota: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setStep(1)} className="px-4 bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold hover:bg-slate-300 transition-colors">Volver</button>
                      <button 
                        onClick={registrarCitaEnBase}
                        disabled={cargando}
                        className="flex-1 bg-blue-600 text-white py-3.5 md:py-4 rounded-2xl font-black text-xs md:text-sm shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <MessageCircle size={16} /> {cargando ? 'RESERVANDO...' : 'CONFIRMAR Y AGENDAR'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 px-6 max-w-3xl mx-auto border-t border-slate-200/60">
        <h3 className="text-xl md:text-2xl font-black text-center mb-12 text-slate-900">PREGUNTAS <span className="text-blue-600">FRECUENTES</span></h3>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="border border-slate-200/60 rounded-2xl overflow-hidden bg-white shadow-sm">
              <button 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-4 md:p-5 flex justify-between items-center hover:bg-slate-50 transition-all text-left"
              >
                <span className="font-bold text-slate-800 text-xs md:text-sm">{f.q}</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-blue-600' : ''}`} />
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <p className="p-4 md:p-5 pt-0 text-slate-400 text-xs leading-relaxed border-t border-slate-100 bg-slate-50/40">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white py-12 md:py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-xs md:text-sm text-slate-400">
          <div>
            <div className="flex items-center gap-2 mb-4 text-white">
              <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center"><Plus size={12} /></div>
              <span className="font-black tracking-tighter text-base">DENTAL ELITE</span>
            </div>
            <p className="leading-relaxed text-xs">Clínica odontológica de alta especialidad enfocada en brindarte salud y estética dental de nivel internacional.</p>
          </div>
          <div>
            <h5 className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-4">Ubicación</h5>
            <p className="text-xs leading-relaxed">Torre Médica de Especialidades, Piso 4<br/>Av. Lázaro Cárdenas 2400, Guadalajara, Jal.</p>
          </div>
          <div>
            <h5 className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-4">Soporte Médico</h5>
            <p className="text-xs leading-relaxed">contacto@dentalelite.com<br/>Tel: +52 (33) 1234 5678</p>
          </div>
        </div>
      </footer>

    </div>
  );
}