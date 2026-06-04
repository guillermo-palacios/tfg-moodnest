import { Link } from 'react-router-dom';

export default function Welcome() {
  return (
    <div className="flex flex-col items-center text-center max-w-3xl py-10">
      
      {/* LOGO GIGANTE EN EL CENTRO */}
      <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-3xl bg-surface shadow-md border border-gray-100 dark:border-gray-800">
        <img 
          src="/logo-indigo.png" 
          alt="MoodNest" 
          className="h-20 w-auto object-contain drop-shadow-lg animate-in zoom-in duration-500" 
        />
      </div>

      <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-main md:text-6xl">
        Toma el control de tu <span className="text-primary">bienestar emocional</span>
      </h1>
      <p className="mb-10 text-lg text-main/70 md:text-xl max-w-2xl">
        MoodNest te ayuda a registrar tu estado de ánimo diario, descubrir qué actividades te hacen sentir mejor y visualizar tu progreso a lo largo del tiempo.
      </p>
      <Link to="/register" className="inline-block rounded-full bg-primary px-10 py-4 text-lg font-bold text-white shadow-lg transition hover:-translate-y-1 hover:opacity-90 hover:shadow-xl">
        Comienza tu diario gratis
      </Link>
    </div>
  );
}