import { useState, useEffect } from 'react';
import api from '../services/api';
import RegistroModal from '../components/RegistroModal';

/**
 * Componente Dashboard: Vista principal del usuario tras el login.
 * Muestra el saludo personalizado, la racha actual y el histórico de los últimos 7 días.
 */
export default function Dashboard() {
  const [registros, setRegistros] = useState([]);
  const [racha, setRacha] = useState(0);
  const [nombreUsuario, setNombreUsuario] = useState(''); 
  const [cargando, setCargando] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * Carga los datos iniciales necesarios para el panel.
   * - Obtiene perfil de usuario para mostrar saludo y racha.
   * - Solicita el histórico de registros de la última semana (rango definido dinámicamente).
   */
  const cargarDatos = async () => {
    try {
      const resUsuario = await api.get('/usuario/me');
      setNombreUsuario(resUsuario.data.nombre || 'Usuario'); 
      setRacha(resUsuario.data.rachaActual || 0); 

      // --- CÁLCULO DE RANGO PARA EL HISTORIAL ---
      // Calculamos un rango de 7 días hacia atrás desde hoy para mostrar en el Dashboard
      const hoy = new Date();
      const haceUnaSemana = new Date();
      haceUnaSemana.setDate(hoy.getDate() - 7);
      
      const pad = (num) => String(num).padStart(2, '0');

      const inicio = `${haceUnaSemana.getFullYear()}-${pad(haceUnaSemana.getMonth() + 1)}-${pad(haceUnaSemana.getDate())}T00:00:00`;
      const fin = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}T23:59:59`;

      const resRegistros = await api.get(`/registros?inicio=${inicio}&fin=${fin}`);
      setRegistros(resRegistros.data || []);
    } catch (error) {
      console.error("Error al cargar el panel:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  /**
   * Asigna dinámicamente una clase de Tailwind basándose en la puntuación del registro.
   * @param {number} nota - Puntuación global del registro (1-10).
   * @returns {string} Clases CSS correspondientes a la escala de colores.
   */
  const colorPuntuacion = (nota) => {
    if (nota >= 9) return 'bg-mood-9 text-white shadow-md';
    if (nota >= 7) return 'bg-mood-7 text-white shadow-md';
    if (nota >= 5) return 'bg-mood-5 text-white shadow-md';
    if (nota >= 3) return 'bg-mood-3 text-white shadow-md';
    return 'bg-mood-1 text-white shadow-md';
  };

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Lógica para determinar el saludo según la hora del sistema
  const horaActual = new Date().getHours();
  let saludoHorario = "¡Hola";
  if (horaActual >= 5 && horaActual < 12) saludoHorario = "¡Buenos días";
  else if (horaActual >= 12 && horaActual < 20) saludoHorario = "¡Buenas tardes";
  else saludoHorario = "¡Buenas noches";

  const hoyStr = new Date().toDateString();
  const registroDeHoy = registros.find(r => new Date(r.fechaAsignada).toDateString() === hoyStr);
  const mensajeSubtitulo = registroDeHoy 
    ? "¡Genial! Ya has completado tu registro de hoy." 
    : "Aquí tienes tu resumen. ¡No olvides registrar tu día!";

  if (cargando) {
    return <div className="flex h-64 items-center justify-center text-main/50">Cargando tu panel...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-in fade-in duration-300">

      {/* SECCIÓN 1: BIENVENIDA */}
      <div className="flex items-center justify-between rounded-3xl bg-surface p-6 shadow-sm border border-gray-200 dark:border-gray-800 lg:p-8 transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-extrabold text-main sm:text-3xl">
            {saludoHorario}, {nombreUsuario}! 👋
          </h1>
          <p className="mt-2 text-base font-medium text-main/70 sm:text-lg">
            {mensajeSubtitulo}
          </p>
        </div>
        
        {/* Indicador de Racha (Gamificación) */}
        <div className="flex flex-col items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-900/20 px-4 py-3 border border-orange-100 dark:border-orange-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-800 text-orange-500 dark:text-orange-400">
            <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.08-3.61 5.75-2.39 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.22.1-.46.04-.64-.12a7.3 7.3 0 0 1-1.38-1.66c-.34-.55-.65-1.15-.9-1.77-.38 1.44-.2 3.03.49 4.34.8 1.5 2.1 2.65 3.73 3.12 1.35.39 2.84.28 4.1-.25 1.54-.64 2.76-1.87 3.4-3.4.63-1.54.5-3.29-.24-4.75z" /></svg>
          </div>
          <span className="mt-2 text-sm font-black text-orange-600 dark:text-orange-400 uppercase tracking-wide">
            {racha} {racha === 1 ? 'día' : 'días'}
          </span>
        </div>
      </div>

      {/* SECCIÓN 2: BOTÓN DE ACCIÓN (Registro Rápido) */}
      <div className="flex flex-col items-center justify-center py-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center justify-center space-x-3 rounded-full bg-primary px-10 py-4 text-white shadow-md transition-all duration-300 hover:opacity-90 hover:-translate-y-1 hover:shadow-lg"
        >
          <svg className="h-7 w-7 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xl font-bold tracking-wide">Registrar mi Día</span>
        </button>
        <span className="mt-4 text-sm font-medium text-main/50">Tómate un momento para ti</span>
      </div>

      {/* SECCIÓN 3: HISTORIAL RECIENTE */}
      <div className="pt-2">
        <h2 className="mb-4 text-xl font-bold text-main">Echa un vistazo a Tus Últimos Registros:</h2>
        
        {registros.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-surface">
            <p className="text-main/50">Aún no hay registros recientes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {registros.map((registro) => (
              <div key={registro.id} className="flex flex-col items-center rounded-2xl border border-gray-200 dark:border-gray-800 bg-surface py-6 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
                <span className="text-sm font-semibold text-main/60">{formatearFecha(registro.fechaAsignada)}</span>
                
                {/* Visualización de la puntuación en un círculo estético */}
                <div className={`mt-5 flex h-16 w-16 items-center justify-center rounded-full text-3xl font-black ${colorPuntuacion(registro.puntuacionGlobal)}`}>
                  {registro.puntuacionGlobal}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE REGISTRO */}
      <RegistroModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={cargarDatos} 
        registrosPrevios={registros} 
      />
    </div>
  );
}