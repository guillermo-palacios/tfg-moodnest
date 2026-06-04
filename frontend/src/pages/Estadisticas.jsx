import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Estadisticas() {
  const [filtroTiempo, setFiltroTiempo] = useState('semana');
  const [statsGenerales, setStatsGenerales] = useState(null);
  
  const [datosGraficoLineas, setDatosGraficoLineas] = useState(null);
  const [datosDiasSemana, setDatosDiasSemana] = useState(null);
  const [datosDistribucion, setDatosDistribucion] = useState(null);
  
  const [etiquetaSeleccionada, setEtiquetaSeleccionada] = useState('');
  const [cargando, setCargando] = useState(true);

  const obtenerColorNota = (nota) => {
    if (nota >= 9) return '#5B61C4'; 
    if (nota >= 7) return '#84CC16'; 
    if (nota >= 5) return '#EAB308'; 
    if (nota >= 3) return '#F97316'; 
    return '#EF4444';                
  };

  const formatoLocal = (d) => {
    const anio = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`; 
  };

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        const res = await api.get('/estadisticas');
        setStatsGenerales(res.data);
        
        if (res.data.impactoEtiquetas) {
            const keys = Object.keys(res.data.impactoEtiquetas);
            if (keys.length > 0) setEtiquetaSeleccionada(keys[0]);
        }
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarEstadisticas();
  }, []);

  useEffect(() => {
    if (statsGenerales && statsGenerales.evolucionTemporal) {
      procesarGraficoLineas(statsGenerales.evolucionTemporal);
      procesarDiasSemana(statsGenerales.evolucionTemporal);
      procesarDistribucion(statsGenerales.distribucionRangos);
    }
  }, [filtroTiempo, statsGenerales]);

  const procesarGraficoLineas = (evolucionCompleta) => {
    const hoy = new Date();
    let etiquetasEjeX = [];
    let notasEjeY = [];

    if (filtroTiempo === 'año') {
      const mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        etiquetasEjeX.push(mesesNombres[d.getMonth()]);
        const registrosDelMes = evolucionCompleta.filter(r => {
          const rd = new Date(r.fecha);
          return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
        });
        if (registrosDelMes.length > 0) {
          const media = registrosDelMes.reduce((sum, r) => sum + r.puntuacion, 0) / registrosDelMes.length;
          notasEjeY.push(parseFloat(media.toFixed(1)));
        } else {
          notasEjeY.push(null);
        }
      }
    } else {
      const dias = filtroTiempo === 'semana' ? 7 : 30;
      for (let i = dias - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        etiquetasEjeX.push(d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }));
        const fechaBuscada = formatoLocal(d);
        const registro = evolucionCompleta.find(r => r.fecha.startsWith(fechaBuscada));
        notasEjeY.push(registro ? registro.puntuacion : null);
      }
    }

    setDatosGraficoLineas({
      labels: etiquetasEjeX,
      datasets: [{
        label: filtroTiempo === 'año' ? 'Nota Media' : 'Estado de ánimo',
        data: notasEjeY,
        borderColor: '#5B61C4', backgroundColor: 'rgba(91, 97, 196, 0.15)', 
        fill: true, tension: 0.4, spanGaps: false, pointBackgroundColor: '#ffffff', pointBorderColor: '#5B61C4', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 7,
      }]
    });
  };

  const procesarDiasSemana = (evolucionCompleta) => {
    const diasNombres = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    const sumas = [0, 0, 0, 0, 0, 0, 0];
    const conteos = [0, 0, 0, 0, 0, 0, 0];

    evolucionCompleta.forEach(item => {
      const d = new Date(item.fecha);
      let dayIdx = d.getDay() - 1;
      if (dayIdx === -1) dayIdx = 6;
      sumas[dayIdx] += item.puntuacion;
      conteos[dayIdx] += 1;
    });

    const promedios = sumas.map((s, i) => conteos[i] ? parseFloat((s / conteos[i]).toFixed(1)) : 0);
    const coloresBarras = promedios.map(p => p > 0 ? obtenerColorNota(p) : 'rgba(156, 163, 175, 0.2)');

    setDatosDiasSemana({
      labels: diasNombres,
      datasets: [{ label: 'Media histórica', data: promedios, backgroundColor: coloresBarras, borderRadius: 6 }]
    });
  };

  const procesarDistribucion = (distRangos) => {
    if (!distRangos) return;
    const categorias = [
      { id: 'increible', nombre: 'Días Increíbles', color: '#5B61C4', valor: 0 },
      { id: 'bueno',     nombre: 'Días Buenos',     color: '#84CC16', valor: 0 },
      { id: 'normal',    nombre: 'Días Normales',   color: '#EAB308', valor: 0 },
      { id: 'malo',      nombre: 'Días Malos',      color: '#F97316', valor: 0 },
      { id: 'terrible',  nombre: 'Días Terribles',  color: '#EF4444', valor: 0 }
    ];

    Object.keys(distRangos).forEach(key => {
      const k = key.toLowerCase();
      if (k.includes('incre') || k.includes('9') || k.includes('10')) categorias[0].valor += distRangos[key];
      else if (k.includes('buen') || k.includes('7') || k.includes('8')) categorias[1].valor += distRangos[key];
      else if (k.includes('normal') || k.includes('neutro') || k.includes('5') || k.includes('6')) categorias[2].valor += distRangos[key];
      else if (k.includes('malo') || k.includes('3') || k.includes('4')) categorias[3].valor += distRangos[key];
      else if (k.includes('terrible') || k.includes('1') || k.includes('2')) categorias[4].valor += distRangos[key];
    });

    setDatosDistribucion({
      labels: categorias.map(c => c.nombre),
      datasets: [{ data: categorias.map(c => c.valor), backgroundColor: categorias.map(c => c.color), borderWidth: 0, hoverOffset: 6 }]
    });
  };

  const configEjes = { y: { min: 1, max: 10, ticks: { stepSize: 1, color: '#9CA3AF' }, grid: { color: 'rgba(156, 163, 175, 0.1)' } }, x: { ticks: { color: '#9CA3AF' }, grid: { display: false } } };
  const configTooltip = { backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12, titleFont: { family: 'Lato' }, bodyFont: { weight: 'bold', family: 'Lato' }, displayColors: false };

  const opcionesGraficoLineas = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: configTooltip }, scales: configEjes };
  const opcionesDiasSemana = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: configTooltip }, scales: { y: { min: 0, max: 10, ticks: { color: '#9CA3AF' }, grid: { color: 'rgba(156, 163, 175, 0.1)' } }, x: { ticks: { color: '#9CA3AF' }, grid: { display: false } } } };
  const opcionesDistribucion = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#9CA3AF', font: { family: 'Lato', size: 13 }, padding: 15 } }, tooltip: configTooltip }, cutout: '75%' };

  let datosImpactoIndividual = null;
  let datosTextoImpacto = null;
  const etiquetasDisponibles = statsGenerales?.impactoEtiquetas ? Object.keys(statsGenerales.impactoEtiquetas) : [];

  if (etiquetaSeleccionada && statsGenerales?.impactoEtiquetas[etiquetaSeleccionada]) {
      const tagData = statsGenerales.impactoEtiquetas[etiquetaSeleccionada];
      datosImpactoIndividual = {
          labels: [`Días SIN #${etiquetaSeleccionada}`, `Días CON #${etiquetaSeleccionada}`],
          datasets: [{
              label: 'Nota media',
              data: [tagData.promedioSinEtiqueta, tagData.promedioConEtiqueta],
              backgroundColor: [obtenerColorNota(tagData.promedioSinEtiqueta), obtenerColorNota(tagData.promedioConEtiqueta)],
              borderRadius: 6
          }]
      };

      const esPositivo = tagData.diferencia > 0;
      const esNegativo = tagData.diferencia < 0;
      
      datosTextoImpacto = {
          texto: tagData.diferencia === 0 ? "SE MANTIENEN IGUAL" : (esPositivo ? "MEJORAN" : "EMPEORAN"),
          valor: (esPositivo ? "+" : "") + tagData.diferencia.toFixed(1),
          colorTexto: esPositivo ? 'text-green-600 dark:text-green-400' : (esNegativo ? 'text-red-600 dark:text-red-400' : 'text-gray-500'),
          colorBorde: esPositivo ? 'border-green-400' : (esNegativo ? 'border-red-400' : 'border-gray-300')
      };
  }
  const opcionesImpactoIndiv = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: configTooltip }, scales: configEjes };


  if (cargando) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-primary">
        <svg className="h-10 w-10 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p className="mt-4 font-semibold text-main/60">Analizando tus datos...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in duration-300">
      
      <div>
        <h1 className="text-3xl font-extrabold text-main">Análisis y Estadísticas</h1>
        <p className="mt-1 text-main/70">Descubre patrones en tu bienestar a lo largo del tiempo.</p>
      </div>

      {/* 1. GRÁFICO DE LÍNEAS (Ancho completo) */}
      <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-surface p-6 shadow-sm lg:p-8 transition-colors duration-300">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-main">Evolución de tu Estado de Ánimo</h2>
            <p className="text-sm text-main/50">{filtroTiempo === 'año' ? 'Puntuación media mensual' : 'Puntuación global por registro'}</p>
          </div>
          <div className="flex overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-canvas p-1">
            {['semana', 'mes', 'año'].map((filtro) => (
              <button
                key={filtro}
                onClick={() => setFiltroTiempo(filtro)}
                className={`px-4 py-1.5 text-sm font-semibold capitalize transition-all ${
                  filtroTiempo === filtro ? 'rounded-lg bg-surface text-primary shadow-sm' : 'text-main/50 hover:text-main'
                }`}
              >
                {filtro}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72 w-full sm:h-80">
          {datosGraficoLineas && datosGraficoLineas.datasets[0].data.some(d => d !== null) ? (
            <Line data={datosGraficoLineas} options={opcionesGraficoLineas} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-canvas p-6 text-center">
              <p className="font-medium text-main/50">Aún no hay registros en este periodo.</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. ZONA DE IMPACTO Y ALIADOS (Ahora a ancho completo) */}
      <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-surface p-6 shadow-sm lg:p-8 transition-colors duration-300">
        <h2 className="mb-1 text-xl font-bold text-main">Tus Aliados</h2>
        <p className="mb-6 text-sm text-main/50">Descubre qué actividades influyen en tu día.</p>
        
        {etiquetasDisponibles.length > 0 ? (
          <div className="space-y-8">
            
            {/* RECUADROS MEJOR Y PEOR ALIADO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {statsGenerales?.mejorAliado && statsGenerales.mejorAliado.impacto > 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-green-500 p-6 text-center text-white shadow-md">
                  <span className="text-sm font-bold uppercase tracking-wide opacity-90">Tu Mejor Aliado</span>
                  <span className="mt-2 text-2xl font-black leading-tight">#{statsGenerales.mejorAliado.nombre}</span>
                  <span className="mt-3 text-sm font-bold bg-white/20 px-3 py-1.5 rounded-full">+ {statsGenerales.mejorAliado.impacto.toFixed(1)} PTOS</span>
                </div>
              )}
              {statsGenerales?.peorAliado && statsGenerales.peorAliado.impacto < 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-red-500 p-6 text-center text-white shadow-md">
                  <span className="text-sm font-bold uppercase tracking-wide opacity-90">Tu Peor Aliado</span>
                  <span className="mt-2 text-2xl font-black leading-tight">#{statsGenerales.peorAliado.nombre}</span>
                  <span className="mt-3 text-sm font-bold bg-white/20 px-3 py-1.5 rounded-full">{statsGenerales.peorAliado.impacto.toFixed(1)} PTOS</span>
                </div>
              )}
            </div>

            {/* SEPARADOR Y SELECTOR */}
            <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                  <span className="text-base font-semibold text-main/80">Analiza una etiqueta al detalle:</span>
                  <select 
                      className="rounded-xl border border-gray-300 dark:border-gray-700 bg-canvas px-4 py-2 text-base font-bold text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={etiquetaSeleccionada}
                      onChange={(e) => setEtiquetaSeleccionada(e.target.value)}
                  >
                      {etiquetasDisponibles.map(tag => (
                          <option key={tag} value={tag}>#{tag}</option>
                      ))}
                  </select>
              </div>

              {/* GRÁFICO DE BARRAS VS TEXTO DE IMPACTO */}
              {datosImpactoIndividual && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div className="h-48 w-full">
                          <Bar data={datosImpactoIndividual} options={opcionesImpactoIndiv} />
                      </div>
                      <div className={`flex h-48 flex-col items-center justify-center rounded-3xl border-4 bg-canvas p-6 text-center shadow-sm ${datosTextoImpacto.colorBorde}`}>
                          <span className="text-sm font-bold uppercase text-main/60">Tus días con #{etiquetaSeleccionada}</span>
                          <span className={`mt-3 text-3xl font-black ${datosTextoImpacto.colorTexto}`}>
                              {datosTextoImpacto.texto}
                          </span>
                          <span className={`mt-1 text-3xl font-black ${datosTextoImpacto.colorTexto}`}>
                              {datosTextoImpacto.valor} PTOS
                          </span>
                      </div>
                  </div>
              )}
            </div>

          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-canvas text-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-700">
              <svg className="mb-4 h-12 w-12 text-main/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
              <p className="font-bold text-main/60">No hay datos de etiquetas.</p>
              <p className="mt-1 text-sm text-main/40">Añade etiquetas a tus registros diarios para ver cómo influyen en tu estado de ánimo.</p>
          </div>
        )}
      </div>

      {/* 3. GRÁFICOS INFERIORES: DÍAS DE LA SEMANA Y DISTRIBUCIÓN GLOBAL */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        
        {/* GRÁFICO: DÍAS DE LA SEMANA */}
        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-surface p-6 shadow-sm transition-colors duration-300">
          <h2 className="mb-1 text-lg font-bold text-main">Días de la Semana</h2>
          <p className="mb-6 text-sm text-main/50">¿Qué días sueles sentirte mejor o peor?</p>
          <div className="h-64 w-full">
            {datosDiasSemana && datosDiasSemana.datasets[0].data.some(d => d > 0) ? (
              <Bar data={datosDiasSemana} options={opcionesDiasSemana} />
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl bg-canvas text-main/50">
                No hay suficientes datos históricos.
              </div>
            )}
          </div>
        </div>

        {/* DISTRIBUCIÓN GLOBAL (Circular) */}
        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-surface p-6 shadow-sm transition-colors duration-300">
          <h2 className="mb-1 text-lg font-bold text-main">Distribución Global</h2>
          <p className="mb-6 text-sm text-main/50">Porcentaje de días según la nota</p>
          <div className="h-64 w-full flex items-center justify-center">
            {datosDistribucion?.labels.length > 0 ? (
              <Doughnut data={datosDistribucion} options={opcionesDistribucion} />
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl bg-canvas text-main/50">
                Faltan registros
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}