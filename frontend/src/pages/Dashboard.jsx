import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import RegistroModal from '../components/RegistroModal';

export default function Dashboard() {
  const [registros, setRegistros] = useState([]);
  const [racha, setRacha] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Extraemos cargarDatos para poder reutilizarla
  const cargarDatos = async () => {
    try {
      const resEstadisticas = await api.get('/estadisticas');
      if (resEstadisticas.data) setRacha(resEstadisticas.data.rachaActual || 0);

      const hoy = new Date();
      const haceUnaSemana = new Date();
      haceUnaSemana.setDate(hoy.getDate() - 7);
      const inicio = haceUnaSemana.toISOString().split('.')[0];
      const fin = hoy.toISOString().split('.')[0];

      const resRegistros = await api.get(`/registros?inicio=${inicio}&fin=${fin}`);
      setRegistros(resRegistros.data || []);
    } catch (error) {
      console.error("Error al cargar el panel:", error);
    } finally {
      setCargando(false);
    }
  };

  // Ahora el useEffect solo llama a la función
  useEffect(() => {
    cargarDatos();
  }, []);

  // Lógica de colores según la nota (basada en tu wireframe)
  const colorPuntuacion = (nota) => {
    if (nota >= 9) return 'bg-indigo-500 shadow-indigo-200';
    if (nota >= 7) return 'bg-green-500 shadow-green-200';
    if (nota >= 5) return 'bg-yellow-400 shadow-yellow-200';
    if (nota >= 3) return 'bg-orange-500 shadow-orange-200';
    return 'bg-red-500 shadow-red-200';
  };

  // Formateador para que la fecha se vea como "06/06"
  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (cargando) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Cargando tu panel...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">

      {/* 1. SECCIÓN SUPERIOR: Bienvenida y Racha */}
      <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">¡Hola de nuevo! 👋</h1>
          <p className="mt-1 text-lg font-medium text-gray-600">
            {racha > 0
              ? `¡Llevas ${racha} ${racha === 1 ? 'día' : 'días'} en racha, sigue así!`
              : 'Registra tu primer día para empezar tu racha.'}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-500 shadow-inner">
            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.08-3.61 5.75-2.39 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.22.1-.46.04-.64-.12a7.3 7.3 0 0 1-1.38-1.66c-.34-.55-.65-1.15-.9-1.77-.38 1.44-.2 3.03.49 4.34.8 1.5 2.1 2.65 3.73 3.12 1.35.39 2.84.28 4.1-.25 1.54-.64 2.76-1.87 3.4-3.4.63-1.54.5-3.29-.24-4.75z" /></svg>
          </div>
          <span className="mt-1 font-bold text-gray-800">{racha} {racha === 1 ? 'día' : 'días'}</span>
        </div>
      </div>

      {/* 2. ZONA DEL BOTÓN PRINCIPAL */}
      <div className="flex flex-col items-center justify-center py-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center justify-center space-x-3 rounded-full bg-indigo-600 px-10 py-4 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-lg"
        >
          <svg className="h-7 w-7 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xl font-bold tracking-wide">Registrar mi Día</span>
        </button>
        <span className="mt-4 text-sm font-medium text-gray-500">
          Tómate un momento para ti
        </span>
      </div>

      {/* 3. HISTORIAL RECIENTE EN CUADRÍCULA */}
      <div className="pt-2">
        <h2 className="mb-4 text-xl font-bold text-gray-800">Echa un vistazo a Tus Últimos Registros:</h2>

        {registros.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
            <p className="text-gray-500">Aún no hay registros recientes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {registros.map((registro) => (
              <div key={registro.id} className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white py-5 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
                <span className="text-sm font-semibold text-gray-600">{formatearFecha(registro.fechaAsignada)}</span>
                <span className="my-3 text-4xl font-black text-gray-800">{registro.puntuacionGlobal}</span>
                <div className={`h-10 w-10 rounded-full shadow-md ${colorPuntuacion(registro.puntuacionGlobal)}`}></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <RegistroModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={cargarDatos} 
        registrosPrevios={registros} 
      />

    </div>
  );
}