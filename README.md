# NodeJS Backend Clean

Proyecto base minimalista para iniciar un backend con **Node.js + Express 5**.

## Características
- Express 5.x
- CORS habilitado
- Carga de variables de entorno con dotenv
- Scripts de desarrollo con nodemon
- Estructura inicial escalable

## Requisitos previos
- Node.js >= 18 (recomendado 20+)
- npm >= 9

## Instalación
```bash
npm install
```

## Variables de entorno
Copia el archivo `.env.example` a `.env` y ajusta los valores necesarios.

```bash
cp .env.example .env
```
En Windows (PowerShell):
```powershell
Copy-Item .env.example .env
```

## Scripts disponibles
- `npm start` -> Ejecuta el servidor en modo producción.
- `npm run dev` -> Inicia el servidor con recarga automática (nodemon).

## Ejecutar en desarrollo
```bash
npm run dev
```

## Endpoints iniciales
| Método | Ruta      | Descripción                           |
|--------|-----------|---------------------------------------|
| GET    | `/`       | Mensaje de estado básico              |
| GET    | `/health` | Información de salud y uptime         |

## Manejo de errores
- 404: Cualquier ruta no definida devuelve JSON con mensaje.
- 500: Errores internos capturados por middleware.

## Estructura de carpetas
```
src/
  app.js          # Configuración principal de Express
  routes/         # Definición de rutas (futuro)
  controllers/    # Controladores (futuro)
  models/         # Modelos / schemas (futuro)
  middlewares/    # Middlewares personalizados (futuro)
  config/         # Configuración (DB, etc.)
index.js          # Punto de entrada
```

## Próximos pasos sugeridos
1. Añadir logger (morgan / pino / winston).
2. Añadir validación de datos (celebrate / zod / joi).
3. Integrar base de datos (PostgreSQL, MongoDB, etc.).
4. Añadir autenticación (JWT / sesiones / OAuth).
5. Tests (Jest / Vitest / Supertest).

## Licencia
Libre uso interno / ajustar según necesidad.
