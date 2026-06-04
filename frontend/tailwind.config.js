/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Activamos el modo oscuro manual por clases
  theme: {
    extend: {
      fontFamily: {
        // Asignamos tus fuentes elegidas a las clases por defecto de Tailwind
        sans: ['Lato', 'sans-serif'],
        serif: ['"PT Serif"', 'serif'],
      },
      colors: {
        // Enlazamos las clases de Tailwind con nuestras futuras variables CSS
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        main: 'rgb(var(--color-text) / <alpha-value>)',
        canvas: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        
        // Dejamos preparada tu escala de color por defecto
        mood: {
          1: '#EF4444', 2: '#EF4444', // Rojo
          3: '#F97316', 4: '#F97316', // Naranja
          5: '#EAB308', 6: '#EAB308', // Amarillo
          7: '#84CC16', 8: '#84CC16', // Verde Lima
          9: '#5B61C4', 10: '#5B61C4',// Índigo Primario
        }
      }
    },
  },
  plugins: [],
}