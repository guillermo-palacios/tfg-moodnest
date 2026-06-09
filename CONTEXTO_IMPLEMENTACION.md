# MoodNest — Contexto de Implementación Completo

> **Propósito de este documento:** Proporcionar a otra IA (o a cualquier desarrollador) un contexto exhaustivo y autocontenido sobre qué es MoodNest, qué está implementado, cómo está estructurado el código, qué hace cada función relevante, y qué patrones arquitectónicos se utilizan. Este documento refleja el estado real del repositorio en `/tfg-moodnest`.

---

## 1. Visión general del proyecto

**MoodNest** es una aplicación web de seguimiento diario del estado de ánimo personal. Permite a los usuarios:

- Registrarse e iniciar sesión de forma segura.
- Registrar su estado de ánimo diario en una escala del 1 al 10.
- Asociar actividades (etiquetas) a cada registro con puntuaciones opcionales.
- Consultar un historial en formato calendario.
- Visualizar estadísticas y análisis de impacto emocional de sus actividades.
- Personalizar la interfaz (tema claro/oscuro, color primario).
- Gestionar su perfil y catálogo de etiquetas.
- Mantener una racha de días consecutivos registrando su ánimo.

### Stack tecnológico global

| Capa | Tecnología |
|------|-----------|
| Backend | Java 17, Spring Boot 4.0.6, Spring Security, Spring Data MongoDB |
| Base de datos | MongoDB (`moodnest_db`) |
| Autenticación | JWT (JJWT 0.11.5, HS256) |
| Frontend | React 18.3, Vite 5.4, React Router 6.30 |
| HTTP Client | Axios 1.16 |
| Gráficos | Chart.js 4.5 + react-chartjs-2 5.3 |
| Estilos | Tailwind CSS 3.4 |
| Notificaciones | react-hot-toast 2.6 |
| Despliegue | Docker Compose (MongoDB + Backend + Frontend/Nginx) |
| Documentación académica | LaTeX en `/memoria` |

### Estructura del repositorio

```
tfg-moodnest/
├── backend/          # API REST Spring Boot
├── frontend/         # SPA React servida por Nginx
├── memoria/          # Memoria del TFG en LaTeX
├── docker-compose.yml
├── README.md
└── CONTEXTO_IMPLEMENTACION.md  # Este documento
```

### Despliegue

```bash
sudo docker-compose up -d --build
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8080/api
- **MongoDB:** localhost:27017

**Flujo de red en producción Docker:**
```
Navegador → frontend:5173 (Nginx:80)
              ├── /api/* → proxy → backend:8080
              └── /*     → SPA React (try_files)
```

---

## 2. Arquitectura global del sistema

### 2.1 Diagrama de capas

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React SPA)                      │
│  Pages → Components → AuthContext → api.js (Axios)          │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP + JWT Bearer
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Spring Boot)                     │
│  Controllers → Services → Repositories → MongoDB            │
│  Security: JwtAuthenticationFilter + SecurityConfig          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB (moodnest_db)                     │
│  Colecciones: usuarios, registros_diarios, etiquetas        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Módulos funcionales

| Módulo | Backend | Frontend | Descripción |
|--------|---------|----------|-------------|
| **Auth** | `AuthController`, `AuthService` | `Login`, `Register`, `AuthContext` | Registro, login, JWT |
| **Usuario** | `UsuarioController`, `UsuarioService` | `Perfil` | Perfil, preferencias, baja de cuenta |
| **Registros** | `RegistroDiarioController`, `RegistroDiarioService` | `Dashboard`, `Historial`, `RegistroModal` | CRUD de estados de ánimo |
| **Etiquetas** | `EtiquetaController`, `EtiquetaService` | `Perfil`, `RegistroModal`, `Historial` | Catálogo de actividades |
| **Estadísticas** | `EstadisticasController`, `EstadisticasService` | `Estadisticas` | BI y gráficos |

### 2.3 Patrones de diseño globales

| Patrón | Dónde |
|--------|-------|
| **Arquitectura en capas** | Backend: Controller → Service → Repository |
| **Repository Pattern** | Spring Data `MongoRepository` |
| **DTO Pattern** | `backend/dto/*` desacopla API de entidades |
| **Dependency Injection** | `@RequiredArgsConstructor` + inyección por constructor |
| **JWT Stateless Auth** | Sin sesión en servidor; token en `localStorage` |
| **Provider/Context** | `AuthProvider` en frontend |
| **Protected Route Guard** | `ProtectedRoute` |
| **HTTP Interceptor** | Axios request/response |
| **Soft Delete** | Etiquetas con `activa=false` |
| **Embedded Documents** | `EtiquetaAsociada` en registros; `PreferenciasSistema` en usuario |
| **Ownership Validation** | `findByIdAndIdUsuario` en servicios |
| **Cascade Delete manual** | `UsuarioService.eliminarCuenta()` |

---

## 3. Backend — Implementación detallada

### 3.1 Estructura de carpetas

```
backend/src/main/java/com/palacios/moodnest/
├── MoodnestApplication.java       # Punto de entrada Spring Boot
├── config/
│   ├── MongoConfig.java           # Conexión MongoDB
│   └── SecurityConfig.java        # Spring Security + CORS + JWT
├── controllers/                   # 5 controladores REST
├── dto/                           # 9 DTOs de entrada/salida
├── models/                        # 3 entidades MongoDB
├── repositories/                  # 3 repositorios Spring Data
├── security/
│   ├── JwtService.java            # Generación y parseo de tokens
│   └── JwtAuthenticationFilter.java  # Filtro HTTP por petición
└── services/                      # 5 servicios de negocio
```

**Paquete raíz:** `com.palacios.moodnest`

### 3.2 Modelo de datos (MongoDB)

#### Colección `usuarios` — `models/Usuario.java`

| Campo Java | Campo MongoDB | Tipo | Notas |
|------------|---------------|------|-------|
| `id` | `_id` | String | PK auto-generada |
| `nombre` | `nombre` | String | |
| `email` | `email` | String | `@Indexed(unique=true)` |
| `password` | `password` | String | BCrypt, `@JsonIgnore` |
| `preferenciasSistema` | `preferencias_sistema` | Objeto embebido | tema, colorPrincipal, familiaIconos |
| `escalaPersonalizada` | `escala_personalizada` | Map<String,String> | Etiquetas 1-10 personalizadas |
| `rachaActual` | `racha_actual` | Integer | Días consecutivos |
| `fechaRegistro` | `fecha_registro` | LocalDateTime | Alta de cuenta |
| `fechaUltimoRegistro` | `fecha_ultimo_registro` | LocalDateTime | Último registro de ánimo |

**Subdocumento `PreferenciasSistema`:**
- `tema`: `"claro"` | `"oscuro"`
- `colorPrincipal`: `"indigo"` | `"emerald"` | `"rose"` | `"amber"` | `"blue"`
- `familiaIconos`: familia de iconos de la escala (ej. `"default"`)

#### Colección `registros_diarios` — `models/RegistroDiario.java`

| Campo Java | Campo MongoDB | Tipo | Notas |
|------------|---------------|------|-------|
| `id` | `_id` | String | PK |
| `idUsuario` | `id_usuario` | String | FK lógica → usuarios |
| `fechaAsignada` | `fecha_asignada` | LocalDateTime | Día del estado de ánimo |
| `puntuacionGlobal` | `puntuacion_global` | Integer | Escala 1-10 |
| `comentario` | `comentario` | String | Opcional |
| `etiquetasAsociadas` | `etiquetas_asociadas` | List<EtiquetaAsociada> | Embebido |
| `fechaCreacion` | `fecha_creacion` | LocalDateTime | |
| `fechaModificacion` | `fecha_modificacion` | LocalDateTime | |

**Subdocumento `EtiquetaAsociada`:**
- `idEtiqueta` → `id_etiqueta`
- `puntuacion` (opcional, impacto de la actividad ese día)

#### Colección `etiquetas` — `models/Etiqueta.java`

| Campo Java | Campo MongoDB | Tipo | Notas |
|------------|---------------|------|-------|
| `id` | `_id` | String | PK |
| `idUsuario` | `id_usuario` | String | FK lógica |
| `nombre` | `nombre` | String | |
| `color` | `color` | String | Hex, ej. `#6366f1` |
| `activa` | `activa` | Boolean | `false` = borrado lógico |
| `fechaCreacion` | `fecha_creacion` | LocalDateTime | |
| `fechaUltimoUso` | `fecha_ultimo_uso` | LocalDateTime | |

#### Relaciones

```
USUARIOS (1) ──→ (N) REGISTROS_DIARIOS
USUARIOS (1) ──→ (N) ETIQUETAS
REGISTROS_DIARIOS (N) ──→ (N) ETIQUETAS  [vía etiquetas_asociadas embebidas]
```

### 3.3 DTOs (Data Transfer Objects)

| DTO | Campos | Uso |
|-----|--------|-----|
| `AuthRequest` | `nombre`, `email`, `password` | Registro y login |
| `AuthResponse` | `token` | Respuesta de auth |
| `RegistroDiarioRequest` | `fechaAsignada`, `puntuacionGlobal`, `comentario`, `etiquetasAsociadas` | Crear/editar registro |
| `EtiquetaRequest` | `nombre`, `color` | Crear/editar etiqueta |
| `EscalaRequest` | `escalaPersonalizada`, `familiaIconos` | Personalizar escala 1-10 |
| `InterfazRequest` | `tema`, `colorPrincipal` | Personalizar UI |
| `PerfilUpdateRequest` | `nombre`, `passwordActual`, `nuevaPassword` | Actualizar perfil |
| `EliminarCuentaRequest` | `password` | Confirmar baja |
| `EstadisticasResponse` | Ver sección 3.8 | Panel analítico |

### 3.4 API REST — Inventario completo de endpoints

**Prefijo base:** `/api`  
**Autenticación:** `Authorization: Bearer <token>` (excepto `/api/auth/**`)

#### Auth — `AuthController` (`/api/auth`)

| Método | Ruta | Auth | Body | Respuesta | Método controlador |
|--------|------|------|------|-----------|-------------------|
| POST | `/api/auth/register` | No | `AuthRequest` | `200` → `{ token }` / `400` → `{ message }` | `registrar()` |
| POST | `/api/auth/login` | No | `AuthRequest` | `200` → `{ token }` / `401` → `{ message }` | `login()` |

#### Usuario — `UsuarioController` (`/api/usuario`)

| Método | Ruta | Auth | Body/Params | Respuesta | Método controlador |
|--------|------|------|-------------|-----------|-------------------|
| GET | `/api/usuario/me` | Sí | — | `200` → `Usuario` / `404` | `obtenerUsuarioActual()` |
| PUT | `/api/usuario/escala` | Sí | `EscalaRequest` | `200` → `Usuario` / `400` | `personalizarEscala()` |
| PUT | `/api/usuario/interfaz` | Sí | `InterfazRequest` | `200` → `Usuario` / `400` | `personalizarInterfaz()` |
| PUT | `/api/usuario/perfil` | Sí | `PerfilUpdateRequest` | `200` → `Usuario` / `400` | `actualizarPerfil()` |
| DELETE | `/api/usuario/cuenta` | Sí | `EliminarCuentaRequest` | `200` → `{ message }` / `400` | `eliminarCuenta()` |

#### Registros — `RegistroDiarioController` (`/api/registros`)

| Método | Ruta | Auth | Body/Params | Respuesta | Método controlador |
|--------|------|------|-------------|-----------|-------------------|
| GET | `/api/registros` | Sí | Query: `inicio`, `fin` (ISO-8601) | `200` → `List<RegistroDiario>` / `400` | `obtenerRegistrosMes()` |
| POST | `/api/registros` | Sí | `RegistroDiarioRequest` | `200` → `RegistroDiario` / `400` | `crearRegistro()` |
| PUT | `/api/registros/{id}` | Sí | Path: `id`, Body: `RegistroDiarioRequest` | `200` → `RegistroDiario` / `400` | `actualizarRegistro()` |
| DELETE | `/api/registros/{id}` | Sí | Path: `id` | `200` → `{ message }` / `400` | `eliminarRegistro()` |

#### Etiquetas — `EtiquetaController` (`/api/etiquetas`)

| Método | Ruta | Auth | Body/Params | Respuesta | Método controlador |
|--------|------|------|-------------|-----------|-------------------|
| GET | `/api/etiquetas` | Sí | — | `200` → `List<Etiqueta>` (activas) / `400` | `obtenerEtiquetas()` |
| GET | `/api/etiquetas/todas` | Sí | — | `200` → `List<Etiqueta>` (activas+archivadas) / `400` | `obtenerTodasLasEtiquetas()` |
| POST | `/api/etiquetas` | Sí | `EtiquetaRequest` | `200` → `Etiqueta` / `400` | `crearEtiqueta()` |
| PUT | `/api/etiquetas/{id}` | Sí | Path: `id`, Body: `EtiquetaRequest` | `200` → `Etiqueta` / `400` | `actualizarEtiqueta()` |
| DELETE | `/api/etiquetas/{id}` | Sí | Path: `id` | `200` → `{ message }` / `400` | `eliminarEtiqueta()` |

#### Estadísticas — `EstadisticasController` (`/api/estadisticas`)

| Método | Ruta | Auth | Respuesta | Método controlador |
|--------|------|------|-----------|-------------------|
| GET | `/api/estadisticas` | Sí | `200` → `EstadisticasResponse` / `400` | `obtenerEstadisticas()` |

**Total: 17 endpoints REST.**

### 3.5 Servicios — Funciones y lógica de negocio

#### `AuthService`

| Método | Visibilidad | Qué hace |
|--------|-------------|----------|
| `registrar(AuthRequest)` | public | Valida email único, hashea password con BCrypt, crea usuario con preferencias por defecto, genera JWT |
| `login(AuthRequest)` | public | Valida credenciales, actualiza `fechaUltimoRegistro`, genera JWT |
| `inicializarPreferenciasPorDefecto(Usuario)` | private | Tema `claro`, color `indigo`, iconos `default`, racha `0`, escala vacía |

#### `UsuarioService`

| Método | Visibilidad | Qué hace |
|--------|-------------|----------|
| `guardarEscalaPersonalizada(email, EscalaRequest)` | public | Guarda mapa escala 1-10 (máx. 30 chars por nivel) y familia de iconos |
| `guardarInterfazPersonalizada(email, InterfazRequest)` | public | Guarda tema y color principal |
| `actualizarPerfil(email, PerfilUpdateRequest)` | public | Actualiza nombre; cambia password validando la actual |
| `eliminarCuenta(email, passwordConfirmacion)` | public | Borrado en cascada: registros → etiquetas → usuario |
| `obtenerUsuarioActual(email)` | private | Busca usuario por email |

#### `RegistroDiarioService`

| Método | Visibilidad | Qué hace |
|--------|-------------|----------|
| `crearRegistro(email, RegistroDiarioRequest)` | public | Crea registro, valida fecha no futura, actualiza racha del usuario |
| `actualizarRegistro(email, idRegistro, RegistroDiarioRequest)` | public | Actualiza registro propio (ownership check) |
| `eliminarRegistro(email, idRegistro)` | public | Borrado físico; **no recalcula racha** |
| `obtenerRegistrosPorMes(email, inicio, fin)` | public | Lista registros en rango temporal |
| `validarFechaNoFutura(LocalDate)` | private | Lanza excepción si fecha > hoy |
| `actualizarRacha(Usuario, fechaAsignada)` | private | Lógica de racha consecutiva (ver reglas abajo) |

**Reglas de racha (`actualizarRacha`):**
- Si es el primer registro → racha = 1
- Si el nuevo registro es exactamente al día siguiente del último → racha + 1
- Si hay más de 1 día de diferencia → racha = 1 (se reinicia)
- Si es el mismo día y racha era 0 → racha = 1
- Eliminar un registro **no** recalcula la racha retroactivamente

#### `EtiquetaService`

| Método | Visibilidad | Qué hace |
|--------|-------------|----------|
| `obtenerEtiquetasActivas(email)` | public | Solo etiquetas con `activa=true` |
| `obtenerTodasLasEtiquetas(email)` | public | Activas + archivadas (para historial) |
| `crearEtiqueta(email, EtiquetaRequest)` | public | Valida nombre no vacío, unicidad case-insensitive, crea activa |
| `actualizarEtiqueta(email, idEtiqueta, EtiquetaRequest)` | public | Actualiza con validación de duplicados |
| `eliminarEtiqueta(email, idEtiqueta)` | public | Borrado lógico (`activa=false`) |
| `validarNombre(nombre)` | private | No vacío, trim |
| `comprobarDuplicado(usuarioId, nombreLimpio)` | private | Unicidad case-insensitive entre activas |

#### `EstadisticasService`

| Método | Visibilidad | Qué hace |
|--------|-------------|----------|
| `calcularEstadisticasUsuario(email)` | public | Orquesta todos los cálculos BI del usuario |
| `calcularImpactoEtiquetas(usuarioId, registros, stats)` | private | Impacto diferencial por etiqueta |
| `obtenerUsuario(email)` | private | Helper |
| `redondear(valor)` | private | 2 decimales |
| `traducirDia(diaIngles)` | private | Días de semana en español |

**Métricas calculadas en `calcularEstadisticasUsuario`:**

1. **totalRegistros** — Conteo total
2. **promedioGlobal** — Media histórica de puntuaciones
3. **evolucionTemporal** — Lista `{ fecha, puntuacion }` ordenada cronológicamente
4. **promediosPorDiaSemana** — Media por Lunes, Martes, etc.
5. **distribucionRangos** — Clasificación heurística:
   - ≤2 → "Días Terribles"
   - ≤4 → "Días Malos"
   - ≤6 → "Días Normales"
   - ≤8 → "Días Buenos"
   - >8 → "Días Increíbles"
6. **impactoEtiquetas** — Por cada etiqueta activa con muestras suficientes:
   - `promedioConEtiqueta` — Media en días CON la actividad
   - `promedioSinEtiqueta` — Media en días SIN la actividad
   - `diferencia` — `promCon - promSin` (impacto neto)
7. **mejorAliado** — Etiqueta con mayor impacto positivo
8. **peorAliado** — Etiqueta con mayor impacto negativo

### 3.6 Repositorios (Spring Data MongoDB)

#### `UsuarioRepository` — extiende `MongoRepository<Usuario, String>`

| Método derivado | Descripción |
|----------------|-------------|
| `findByEmail(String email)` | Búsqueda por email único |

#### `RegistroDiarioRepository` — extiende `MongoRepository<RegistroDiario, String>`

| Método derivado | Descripción |
|----------------|-------------|
| `findByIdUsuarioAndFechaAsignadaBetween(id, inicio, fin)` | Rango temporal |
| `findByIdAndIdUsuario(id, idUsuario)` | Ownership check |
| `findByIdUsuario(idUsuario)` | Histórico completo |
| `deleteByIdUsuario(idUsuario)` | Borrado en cascada |

#### `EtiquetaRepository` — extiende `MongoRepository<Etiqueta, String>`

| Método derivado | Descripción |
|----------------|-------------|
| `findByIdUsuarioAndActivaTrue(idUsuario)` | Etiquetas activas |
| `findByIdUsuario(idUsuario)` | Todas las etiquetas |
| `findByIdAndIdUsuario(id, idUsuario)` | Ownership check |
| `findByIdUsuarioAndNombreIgnoreCaseAndActivaTrue(id, nombre)` | Unicidad nombre |
| `deleteByIdUsuario(idUsuario)` | Borrado en cascada |

### 3.7 Seguridad y autenticación

#### Flujo JWT

```
1. POST /api/auth/login o /register
   → AuthService genera token con JwtService.generarToken(email)

2. Cliente almacena token en localStorage

3. Cada petición incluye: Authorization: Bearer <token>

4. JwtAuthenticationFilter (OncePerRequestFilter):
   - Extrae token de cabecera Bearer
   - Parsea email con jwtService.extraerEmail(jwt)
   - Crea UsernamePasswordAuthenticationToken(email, null, [])
   - Lo inyecta en SecurityContextHolder
   - Si falla el parseo → SecurityContextHolder.clearContext()

5. Controladores obtienen identidad: auth.getName() = email del usuario
```

#### `JwtService`

| Método | Qué hace |
|--------|----------|
| `generarToken(email)` | Crea JWT HS256 con expiración configurable |
| `extraerEmail(token)` | Extrae subject (email) |
| `esTokenValido(token, email)` | Valida subject y expiración (**existe pero no se usa en el filtro**) |
| `isTokenExpired(token)` | Comprueba expiración |
| `extractAllClaims(token)` | Parsea y verifica firma HMAC |

#### `SecurityConfig`

- **PasswordEncoder:** BCrypt
- **Sesión:** STATELESS (sin sesión servidor)
- **CSRF:** Desactivado (API REST con JWT)
- **Rutas públicas:** `/api/auth/**`
- **Resto:** `authenticated()`
- **CORS:** Orígenes `*`, métodos GET/POST/PUT/DELETE/OPTIONS, headers Authorization/Content-Type/Accept

#### Autorización

- Solo autenticación binaria (autenticado vs anónimo)
- **Sin roles** (`ROLE_USER`, `@PreAuthorize`, etc.)
- Aislamiento de datos por usuario implementado en servicios via `idUsuario`

### 3.8 Estructura de `EstadisticasResponse`

```json
{
  "totalRegistros": 42,
  "promedioGlobal": 6.75,
  "promediosPorDiaSemana": { "Lunes": 5.2, "Martes": 7.1, ... },
  "distribucionRangos": { "Días Buenos": 15, "Días Normales": 10, ... },
  "evolucionTemporal": [
    { "fecha": "2026-05-01", "puntuacion": 7 },
    { "fecha": "2026-05-02", "puntuacion": 5 }
  ],
  "impactoEtiquetas": {
    "Ejercicio": {
      "promedioConEtiqueta": 7.5,
      "promedioSinEtiqueta": 5.2,
      "diferencia": 2.3
    }
  },
  "mejorAliado": { "nombre": "Ejercicio", "impacto": 2.3 },
  "peorAliado": { "nombre": "Redes sociales", "impacto": -1.8 }
}
```

### 3.9 Configuración

**`application.properties`:**
```properties
spring.application.name=moodnest
spring.data.mongodb.uri=mongodb://mongo-server:27017/moodnest_db
jwt.secret=MoodNestTFG2026ClaveSecretaSuperSeguraParaFirmarTokens123456789
jwt.expiration=86400000  # 24 horas
```

**`MongoConfig`:** URI con fallback, base de datos forzada `moodnest_db`, `@EnableMongoRepositories`.

### 3.10 Gestión de errores

- **Sin `@ControllerAdvice` global**
- Cada controlador usa `try/catch` y devuelve `ResponseEntity` con códigos HTTP apropiados
- Errores de negocio como `RuntimeException` con mensajes descriptivos

### 3.11 Tests

Único test: `MoodnestApplicationTests.contextLoads()` — verifica que el contexto Spring arranca.

---

## 4. Frontend — Implementación detallada

### 4.1 Estructura de carpetas

```
frontend/src/
├── main.jsx                  # Bootstrap React (createRoot + StrictMode)
├── App.jsx                   # Router raíz + AuthProvider + Toaster
├── index.css                 # Tailwind + variables CSS + tema oscuro
├── context/
│   └── AuthContext.jsx       # Estado global auth + tema visual
├── services/
│   └── api.js                # Cliente Axios + interceptores
├── components/
│   ├── Layout.jsx            # Shell privado (nav, header, logout)
│   ├── PublicLayout.jsx      # Shell público (landing, auth)
│   ├── ProtectedRoute.jsx    # Guard de rutas autenticadas
│   └── RegistroModal.jsx     # Modal CRUD de registros diarios
└── pages/
    ├── Welcome.jsx           # Landing /
    ├── Login.jsx             # /login
    ├── Register.jsx          # /register
    ├── Dashboard.jsx         # /dashboard
    ├── Historial.jsx         # /historial
    ├── Estadisticas.jsx      # /estadisticas
    └── Perfil.jsx            # /perfil
```

**Lenguaje:** JavaScript (JSX). **No hay TypeScript** en el código fuente.

### 4.2 Jerarquía de renderizado

```
main.jsx
└── App.jsx
    ├── AuthProvider (context/AuthContext.jsx)
    ├── Toaster (react-hot-toast)
    └── BrowserRouter
        └── Routes
            ├── [Públicas] PublicLayout → Welcome | Login | Register
            ├── [Privadas] ProtectedRoute → Layout → Dashboard | Historial | Estadisticas | Perfil
            └── Catch-all → Navigate("/")
```

### 4.3 Rutas del frontend

| Ruta | Componente | Layout | Protegida | Descripción |
|------|------------|--------|-----------|-------------|
| `/` | `Welcome` | `PublicLayout` | No | Landing con CTA |
| `/login` | `Login` | `PublicLayout` | No | Formulario de acceso |
| `/register` | `Register` | `PublicLayout` | No | Alta de usuario |
| `/dashboard` | `Dashboard` | `Layout` | Sí | Panel principal |
| `/historial` | `Historial` | `Layout` | Sí | Calendario mensual |
| `/estadisticas` | `Estadisticas` | `Layout` | Sí | Gráficos y análisis |
| `/perfil` | `Perfil` | `Layout` | Sí | Configuración de cuenta |
| `*` | — | — | — | Redirección a `/` |

### 4.4 Componentes — Funciones detalladas

#### `App.jsx`
- **Export:** `export default function App()`
- Configura `AuthProvider`, `Toaster` (top-center, clase `nitido-toast`), `BrowserRouter` y árbol de rutas.

#### `PublicLayout.jsx`
- **Export:** `export default function PublicLayout({ children })`
- Navbar pública (logo, links Login/Register), área central centrada, footer con copyright.

#### `Layout.jsx`
- **Export:** `export default function Layout({ children })`
- Shell autenticado: header sticky, submenú desktop, bottom nav móvil, modal de confirmación de logout.
- **Estado:** `isLogoutModalOpen`
- **Funciones:**
  - `isActive(path)` — resalta ruta activa en navegación
  - `handleConfirmLogout()` — `logout()` + toast + `navigate('/')`
- **Navegación desktop:** Dashboard, Calendario, Estadísticas
- **Header:** icono usuario → `/perfil`, botón cerrar sesión

#### `ProtectedRoute.jsx`
- **Export:** `export default function ProtectedRoute({ children })`
- Mientras `loading` → muestra "Cargando sistema..."
- Si no hay `user` → redirige a `/login`
- Si hay sesión → renderiza `children`

#### `RegistroModal.jsx`
- **Export:** `export default function RegistroModal({ isOpen, onClose, onSuccess, registrosPrevios, registroAEditar, fechaPorDefecto })`
- Modal con React Portal (`createPortal` → `document.body`)
- **Estado:** `cargando`, `etiquetasCatalogo`, `fecha`, `puntuacionGlobal`, `comentario`, `etiquetasSeleccionadas`, `creandoEtiqueta`, `nuevaEtiquetaNombre`
- **Funciones:**
  - `colorPuntuacion(nota)` — clases Tailwind por escala 1-10
  - `cargarEtiquetas()` — `GET /etiquetas`
  - `toggleEtiqueta(id)` — selección/deselección
  - `setPuntuacionEtiqueta(id, nota)` — puntuación por etiqueta
  - `handleCrearEtiqueta()` — `POST /etiquetas` inline
  - `handleSubmit(e)` — valida duplicado por fecha + `POST/PUT /registros`
- **Usado en:** `Dashboard`, `Historial`

### 4.5 Páginas — Funciones detalladas

#### `Welcome.jsx`
- Landing con propuesta de valor y botón "Comienza tu diario gratis" → `/register`

#### `Login.jsx`
- **Estado:** `email`, `password`, `error`
- **Función:** `handleSubmit(e)` → `login(email, password)` del contexto → `/dashboard`

#### `Register.jsx`
- **Estado:** `nombre`, `email`, `password`, `error`
- **Función:** `handleSubmit(e)` → `registerUser(nombre, email, password)` → `/dashboard`

#### `Dashboard.jsx`
- **Estado:** `registros`, `racha`, `nombreUsuario`, `cargando`, `isModalOpen`
- **Funciones:**
  - `cargarDatos()` — `GET /usuario/me` + `GET /registros?inicio=&fin=` (últimos 7 días)
  - `colorPuntuacion(nota)` — color por puntuación
  - `formatearFecha(fechaISO)` — formato legible
- **UI:** Saludo horario, racha actual, botón "Registrar mi Día", grid de últimos registros, `RegistroModal`

#### `Historial.jsx`
- **Estado:** `fechaActual`, `registros`, `etiquetasCatalogo`, `cargando`, `diaSeleccionado`, `isModalOpen`
- **Funciones:**
  - `cargarRegistrosMes()` — `GET /registros` del mes visible + `GET /etiquetas/todas`
  - `eliminarRegistro(id)` — `DELETE /registros/:id` con confirmación
  - `mesAnterior()`, `mesSiguiente()` — navegación calendario
  - `obtenerDiasDelMes()` — cuadrícula (lunes como primer día)
  - `obtenerRegistroDelDia(fechaDia)` — busca registro del día
  - `colorPuntuacion(nota)`, `borderColorPuntuacion(nota)`
- **UI:** Calendario interactivo + panel lateral de detalle/edición/borrado

#### `Estadisticas.jsx`
- **Estado:** `filtroTiempo`, `statsGenerales`, `datosGraficoLineas`, `datosDiasSemana`, `datosDistribucion`, `etiquetaSeleccionada`, `cargando`
- **Funciones:**
  - `obtenerColorNota(nota)`, `formatoLocal(d)`
  - `procesarGraficoLineas(evolucionCompleta)` — filtro semana/mes/año
  - `procesarDiasSemana(evolucionCompleta)` — media por día de semana
  - `procesarDistribucion(distRangos)` — doughnut por rangos emocionales
- **Gráficos:** `Line`, `Bar`, `Doughnut` (react-chartjs-2)
- **Datos:** `GET /estadisticas`
- **UI:** Filtro temporal, "Tus Aliados" (mejor/peor etiqueta), selector de etiqueta con comparativa CON vs SIN

#### `Perfil.jsx`
- **Estado:** `faseBorrado`, `usuario`, `perfilForm`, `etiquetas`, `cargando`, campos CRUD etiquetas, `passwordBorrado`, `cargandoAccion`
- **Funciones:**
  - `cargarUsuario()` — `GET /usuario/me`
  - `cargarEtiquetas()` — `GET /etiquetas`
  - `handleCrear(e)` — `POST /etiquetas`
  - `handleActivarEdicion(tag)`, `handleGuardarEdicion(id)` — `PUT /etiquetas/:id`
  - `handleEliminar(id)` — `DELETE /etiquetas/:id`
  - `handleCambiarInterfaz(nuevoTema, nuevoColor)` — aplica DOM + `PUT /usuario/interfaz`
  - `handleActualizarPerfil(e)` — `PUT /usuario/perfil`
  - `handleEliminarCuenta(e)` — flujo multi-paso + `DELETE /usuario/cuenta`
- **Secciones:** Personalización visual, cuenta, zona de peligro (borrado), catálogo de etiquetas

### 4.6 Estado global — `AuthContext.jsx`

**Exporta:** `AuthContext`, `AuthProvider`

**Estado:**
| Variable | Tipo | Descripción |
|----------|------|-------------|
| `user` | `{ token }` \| `null` | Sesión activa |
| `loading` | boolean | Carga inicial de sesión |
| `temaColor` | string | Color primario actual |

**Funciones expuestas via Provider:**

| Función | Qué hace |
|---------|----------|
| `aplicarPreferenciasVisuales(preferencias)` | Toggle clase `dark` en `<html>`, inyecta `--color-primary` CSS |
| `login(email, password)` | `POST /auth/login` → guarda token → `GET /usuario/me` → aplica tema |
| `registerUser(nombre, email, password)` | `POST /auth/register` → guarda token → tema default claro/indigo |
| `logout()` | Borra token, resetea tema a claro/indigo |

**Inicialización (`useEffect`):**
1. Lee `localStorage.token`
2. Si existe → `GET /usuario/me` para validar y cargar preferencias
3. Si falla → limpia token y sesión

**Mapa de colores (`DICCIONARIO_COLORES`):**
```javascript
{ indigo: '91 97 196', emerald: '16 185 129', rose: '244 63 94', amber: '245 158 11', blue: '59 130 246' }
```

### 4.7 Cliente HTTP — `api.js`

**Configuración Axios:**
- `baseURL: '/api'`
- `timeout: 5000` ms
- `Content-Type: application/json`

**Interceptor request:** Adjunta `Authorization: Bearer {token}` desde `localStorage`

**Interceptor response:**
- Timeout/red → toast "Error de conexión"
- 401/403 (excepto `/auth/login`) → toast "Sesión expirada", borra token, redirige a `/login`

### 4.8 Mapa Frontend → API

| Método | Endpoint | Usado en |
|--------|----------|----------|
| POST | `/auth/login` | `AuthContext.login` |
| POST | `/auth/register` | `AuthContext.registerUser` |
| GET | `/usuario/me` | `AuthContext`, `Dashboard`, `Perfil` |
| PUT | `/usuario/interfaz` | `Perfil.handleCambiarInterfaz` |
| PUT | `/usuario/perfil` | `Perfil.handleActualizarPerfil` |
| DELETE | `/usuario/cuenta` | `Perfil.handleEliminarCuenta` |
| GET | `/etiquetas` | `RegistroModal`, `Perfil` |
| GET | `/etiquetas/todas` | `Historial` |
| POST | `/etiquetas` | `RegistroModal`, `Perfil` |
| PUT | `/etiquetas/:id` | `Perfil` |
| DELETE | `/etiquetas/:id` | `Perfil` |
| GET | `/registros?inicio=&fin=` | `Dashboard`, `Historial` |
| POST | `/registros` | `RegistroModal` |
| PUT | `/registros/:id` | `RegistroModal` |
| DELETE | `/registros/:id` | `Historial` |
| GET | `/estadisticas` | `Estadisticas` |

### 4.9 Estilos y theming

**Tailwind CSS** con `darkMode: 'class'`

**Variables CSS (`index.css`):**

| Variable | Tema claro | Tema oscuro |
|----------|------------|-------------|
| `--color-primary` | `91 97 196` (indigo) | `129 140 248` |
| `--color-text` | `30 30 47` | `248 249 250` |
| `--color-bg` | `248 249 250` | `15 23 42` |
| `--color-surface` | `255 255 255` | `30 41 59` |

**Escala emocional (clases `mood-1` a `mood-10`):**

| Rango | Color | Hex aprox. |
|-------|-------|------------|
| 1-2 | mood-1 | #EF4444 (rojo) |
| 3-4 | mood-3 | #F97316 (naranja) |
| 5-6 | mood-5 | #EAB308 (amarillo) |
| 7-8 | mood-7 | #84CC16 (verde) |
| 9-10 | mood-9 | #5B61C4 (índigo) |

**Fuentes:** Lato (sans), PT Serif (headings)

**Sin librería de componentes** (MUI, shadcn, etc.). Iconos SVG inline.

### 4.10 Contratos de datos implícitos (Frontend ↔ Backend)

**Usuario (`GET /usuario/me`):**
```javascript
{
  nombre: string,
  email: string,
  rachaActual: number,
  preferenciasSistema: {
    tema: 'claro' | 'oscuro',
    colorPrincipal: 'indigo' | 'emerald' | 'rose' | 'amber' | 'blue',
    familiaIconos?: string
  }
}
```

**Registro diario:**
```javascript
{
  id: string,
  fechaAsignada: string,       // ISO: "2026-06-08T12:00:00"
  puntuacionGlobal: number,    // 1-10
  comentario: string | null,
  etiquetasAsociadas: [{ idEtiqueta: string, puntuacion: number | null }]
}
```

**Etiqueta:**
```javascript
{ id: string, nombre: string, color?: string, activa?: boolean }
```

**Payload registro (POST/PUT):**
```javascript
{
  fechaAsignada: string,
  puntuacionGlobal: number,
  comentario: string | null,
  etiquetasAsociadas: [{ idEtiqueta, puntuacion }]
}
```

---

## 5. Flujos de usuario implementados

### 5.1 Onboarding (usuario nuevo)

```
/ (Welcome) → /register → POST /auth/register
  → token en localStorage
  → tema por defecto (claro/indigo)
  → /dashboard
```

### 5.2 Autenticación (usuario existente)

```
/login → POST /auth/login → GET /usuario/me
  → aplicarPreferenciasVisuales → /dashboard
```

Sesión persistente: al recargar, `AuthContext` lee token y valida con `GET /usuario/me`.

### 5.3 Registro diario (flujo central)

```
/dashboard → "Registrar mi Día" → RegistroModal
  → seleccionar fecha, puntuación 1-10, etiquetas opcionales, comentario
  → POST /registros → onSuccess recarga datos → cierra modal
```

Alternativa desde Historial: seleccionar día sin registro → "Añadir Registro" → mismo modal.

### 5.4 Consulta y gestión histórica

```
/historial → calendario mensual (GET /registros por mes)
  → clic en día → panel detalle
  → [sin registro] Añadir | [con registro] Editar / Eliminar
```

### 5.5 Análisis emocional

```
/estadisticas → GET /estadisticas
  → filtro semana/mes/año en gráfico de líneas
  → "Tus Aliados" (mejor/peor etiqueta por impacto)
  → selector de etiqueta → comparativa CON vs SIN
  → gráficos días de semana y distribución global
```

### 5.6 Personalización y cuenta

```
/perfil → cambiar tema/color → PUT /usuario/interfaz + DOM
  → editar nombre/contraseña → PUT /usuario/perfil
  → CRUD catálogo etiquetas
  → eliminar cuenta (multi-paso con confirmación de password) → DELETE /usuario/cuenta → logout → /
```

### 5.7 Cierre de sesión

```
Layout → "Cerrar Sesión" → modal confirmación
  → logout() → borra token → tema default → navigate('/')
```

### 5.8 Protección de rutas y expiración

```
Acceso a ruta privada sin token → ProtectedRoute → /login
Token expirado (401/403) → interceptor Axios → /login
URL desconocida → redirect /
```

---

## 6. Reglas de negocio consolidadas

| Regla | Dónde se aplica |
|-------|-----------------|
| No registrar fechas futuras | `RegistroDiarioService.validarFechaNoFutura` |
| Un registro por fecha (validación frontend) | `RegistroModal.handleSubmit` |
| Racha solo incrementa si registro es al día siguiente | `RegistroDiarioService.actualizarRacha` |
| Eliminar registro no recalcula racha | `RegistroDiarioService.eliminarRegistro` |
| Etiquetas archivadas visibles en historial | `GET /etiquetas/todas` en Historial |
| Borrado lógico de etiquetas | `EtiquetaService.eliminarEtiqueta` → `activa=false` |
| Unicidad de nombre de etiqueta (case-insensitive) | `EtiquetaService.comprobarDuplicado` |
| Impacto de etiqueta requiere muestras CON y SIN | `EstadisticasService.calcularImpactoEtiquetas` |
| Distribución de rangos emocionales | ≤2 Terribles, ≤4 Malos, ≤6 Normales, ≤8 Buenos, >8 Increíbles |
| Password nunca expuesto en API | `@JsonIgnore` en `Usuario.password` |
| Borrado de cuenta en cascada | registros → etiquetas → usuario |
| JWT expira en 24 horas | `jwt.expiration=86400000` |
| Timeout de peticiones frontend: 5s | `api.js timeout: 5000` |

---

## 7. Despliegue e infraestructura

### Docker Compose (`docker-compose.yml`)

| Servicio | Contenedor | Puerto host | Dependencias |
|----------|------------|-------------|--------------|
| `mongo-server` | `moodnest_db` | 27017 | Volumen `moodnest_data` |
| `backend` | `moodnest_backend` | 8080 | `mongo-server` |
| `frontend` | `moodnest_frontend` | 5173→80 | `backend` |

Red: `moodnest_net`

### Backend Dockerfile
- **Build:** `maven:3.9.6-eclipse-temurin-17` → `mvn clean package -DskipTests`
- **Run:** `eclipse-temurin:17-jre-alpine`, puerto 8080, `java -jar app.jar`

### Frontend Dockerfile
- **Build:** Node 18 → `npm run build`
- **Run:** Nginx Alpine sirviendo `dist/`

### Nginx (`frontend/nginx.conf`)
- `/api/*` → proxy a `http://backend:8080`
- `/*` → SPA fallback (`try_files`)

---

## 8. Deuda técnica y limitaciones conocidas

| Área | Detalle |
|------|---------|
| **Duplicación frontend** | `colorPuntuacion(nota)` repetida en Dashboard, Historial, RegistroModal |
| **Sin TypeScript** | Contratos de datos implícitos, sin validación en compile-time |
| **Sin custom hooks** | No hay `hooks/` ni `useAuth()`; lógica en páginas |
| **Sin state management externo** | Solo Context API; cada página gestiona su estado local |
| **Sin `@ControllerAdvice`** | Errores gestionados con try/catch por controlador |
| **Sin `@Valid`** | Spring Validation presente pero no usado en controladores |
| **Sin refresh tokens** | JWT de 24h sin renovación automática |
| **Secreto JWT hardcodeado** | En `application.properties`, no en variables de entorno |
| **`esTokenValido()` sin usar** | Existe en JwtService pero el filtro solo parsea |
| **Sin rate limiting** | No hay protección contra fuerza bruta |
| **Tests mínimos** | Solo `contextLoads()` en backend; sin tests frontend |
| **Logos estáticos** | Referenciados (`/logo-indigo.png`) pero no en repositorio |

---

## 9. Qué NO está implementado

Para evitar suposiciones incorrectas por parte de otra IA:

- **No hay** roles de usuario (admin, moderador, etc.)
- **No hay** recuperación de contraseña / reset por email
- **No hay** OAuth / login social (Google, etc.)
- **No hay** notificaciones push o recordatorios
- **No hay** exportación de datos (CSV, PDF)
- **No hay** modo offline / PWA
- **No hay** internacionalización (i18n) — todo en español
- **No hay** WebSockets ni tiempo real
- **No hay** caché (Redis, etc.)
- **No hay** paginación en endpoints de listado
- **No hay** validación de un registro por fecha en backend (solo frontend)
- **No hay** personalización de escala 1-10 desde el frontend actual (endpoint existe: `PUT /usuario/escala`)
- **No hay** Swagger/OpenAPI documentado

---

## 10. Glosario

| Término | Significado en MoodNest |
|---------|------------------------|
| **Registro diario** | Entrada de estado de ánimo para un día concreto (puntuación 1-10) |
| **Etiqueta** | Actividad o factor del usuario (ej. "Ejercicio", "Meditación") |
| **Racha** | Días consecutivos registrando el estado de ánimo |
| **Impacto de etiqueta** | Diferencia entre el ánimo promedio CON vs SIN una actividad |
| **Aliado** | Etiqueta con mayor impacto positivo en el bienestar |
| **Borrado lógico** | Etiqueta marcada como `activa=false` pero conservada en BD |
| **Ownership** | Validación de que un recurso pertenece al usuario autenticado |

---

## 11. Resumen ejecutivo para IA

**MoodNest** es una SPA React 18 + API REST Spring Boot 4 para seguimiento emocional diario. Usa MongoDB como BD NoSQL, JWT para auth stateless, y Docker Compose para despliegue.

**Backend:** 5 controladores, 17 endpoints, 5 servicios de negocio, 3 repositorios, 3 modelos, arquitectura en capas con DTOs.

**Frontend:** 7 páginas, 4 componentes reutilizables, 1 contexto global (AuthContext), 1 cliente Axios. Tailwind CSS con tema dinámico, Chart.js para estadísticas.

**Flujo principal:** Usuario se registra → registra su ánimo diario con etiquetas → consulta historial en calendario → analiza estadísticas de impacto → personaliza interfaz.

**Decisiones arquitectónicas clave:** Simplicidad deliberada (sin TypeScript, sin Redux, sin roles), lógica de negocio en servicios backend, estado local por página en frontend, soft delete para etiquetas, borrado en cascada para cuentas.

---

*Documento generado a partir del análisis exhaustivo del código fuente en `/tfg-moodnest`. Última revisión: junio 2026.*
