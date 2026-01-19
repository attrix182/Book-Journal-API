# Book Journal API

API para enviar notificaciones push programadas a los usuarios de Book Journal.

## Características

- Envío de notificaciones push programadas usando Firebase Cloud Messaging
- Cron jobs para verificar y enviar notificaciones cada minuto
- Endpoint para envío manual de notificaciones

## Configuración Local

1. Instalar dependencias:
```bash
npm install
```

2. Configurar Firebase:
   - Coloca tu archivo `firebase-config.json` en la raíz del proyecto
   - Este archivo debe contener las credenciales de Firebase Admin SDK

3. Configurar SSL (solo para desarrollo local):
   - Coloca tus certificados SSL en la carpeta `ssl/`:
     - `ssl/key.key`
     - `ssl/cert.crt`

4. Ejecutar:
```bash
npm start
```

## Despliegue en Render

### Opción 1: Desde GitHub (Recomendado)

1. Sube tu código a un repositorio de GitHub
2. Ve a [Render Dashboard](https://dashboard.render.com)
3. Click en "New +" → "Web Service"
4. Conecta tu repositorio de GitHub
5. Configura:
   - **Name**: `book-journal-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

6. Variables de entorno:
   - `NODE_ENV`: `production`
   - Agrega el contenido de `firebase-config.json` como variable de entorno `FIREBASE_CONFIG` (JSON string)

7. Click en "Create Web Service"

### Opción 2: Usando render.yaml

1. Sube tu código a GitHub
2. En Render Dashboard, click en "New +" → "Blueprint"
3. Conecta tu repositorio
4. Render detectará automáticamente el archivo `render.yaml`

### Importante para Render

- **No necesitas certificados SSL**: Render maneja HTTPS automáticamente
- **El puerto se configura automáticamente**: Render usa la variable `PORT`
- **Cron jobs funcionan**: Los cron jobs de node-cron funcionan mientras la instancia esté activa

### Limitaciones del Plan Gratuito de Render

- ⚠️ **Sleep después de 15 minutos de inactividad**: La instancia se "duerme" si no recibe peticiones
- ⚠️ **Wake-up delay**: Puede tardar hasta 1 minuto en despertarse
- ⚠️ **750 horas/mes**: Límite de horas de ejecución

### Solución para mantener la instancia activa

Para evitar que la instancia se duerma, puedes:

1. **Usar un servicio de ping externo** (gratuito):
   - [UptimeRobot](https://uptimerobot.com) - Ping cada 5 minutos
   - [Cronitor](https://cronitor.io) - Monitoreo gratuito
   - [Pingdom](https://www.pingdom.com) - Plan gratuito disponible

2. **Agregar un endpoint de health check**:
   ```javascript
   app.get('/health', (req, res) => {
     res.json({ status: 'ok', timestamp: new Date().toISOString() });
   });
   ```

## Alternativas Gratuitas

### Railway.app
- ✅ Plan gratuito con $5 de crédito mensual
- ✅ No se duerme automáticamente
- ✅ Más recursos que Render
- ⚠️ Requiere tarjeta de crédito (no se cobra si no excedes el crédito)

### Fly.io
- ✅ Plan gratuito generoso
- ✅ No se duerme
- ⚠️ Configuración más compleja

### Cyclic.sh
- ✅ Plan gratuito
- ✅ No se duerme
- ⚠️ Límites de memoria más bajos

## Estructura del Proyecto

```
Book-Journal-API/
├── index.js              # Servidor principal
├── package.json          # Dependencias
├── firebase-config.json  # Configuración de Firebase (no subir a Git)
├── render.yaml          # Configuración para Render
├── .renderignore        # Archivos a ignorar en Render
└── ssl/                 # Certificados SSL (solo local, no subir a Git)
    ├── key.key
    └── cert.crt
```

## Variables de Entorno

- `PORT`: Puerto del servidor (automático en Render)
- `NODE_ENV`: `production` en Render, `development` local
- `FIREBASE_CONFIG`: JSON string con la configuración de Firebase (alternativa a firebase-config.json)

## Endpoints

### GET /
Health check endpoint

### POST /sendNotification
Envía notificaciones push manualmente

**Body:**
```json
{
  "token": ["token1", "token2"],
  "title": "Título",
  "body": "Mensaje"
}
```

## Notas

- Los cron jobs se ejecutan cada minuto para verificar usuarios que deben recibir notificaciones
- La zona horaria está configurada como "America/Argentina/Buenos_Aires" - ajusta según necesites
- Las notificaciones se envían automáticamente según la configuración guardada en Firestore
