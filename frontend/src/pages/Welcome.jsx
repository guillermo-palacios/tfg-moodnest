import { Link } from 'react-router-dom';

export default function Welcome() {
  return (
    <div className="text-center max-w-3xl py-10">
      <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-gray-900 md:text-6xl">
        Toma el control de tu <span className="text-indigo-600">bienestar emocional</span>
      </h1>
      <p className="mb-10 text-lg text-gray-600 md:text-xl">
        MoodNest te ayuda a registrar tu estado de ánimo diario, descubrir qué actividades te hacen sentir mejor y visualizar tu progreso a lo largo del tiempo.
      </p>
      <Link to="/register" className="inline-block rounded-full bg-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:-translate-y-1 hover:bg-indigo-700">
        Comienza tu diario gratis
      </Link>
    </div>
  );
}