# Despliegue con Docker en Render

## Configuración Docker

La API está configurada para funcionar con Docker en Render.

### Archivos Docker

- `Dockerfile`: Configuración de la imagen Docker
- `.dockerignore`: Archivos a excluir del build
- `render.yaml`: Configuración para Render usando Docker

## Despliegue en Render con Docker

### Opción 1: Usando render.yaml (Recomendado)

1. Sube tu código a GitHub
2. Ve a [Render Dashboard](https://dashboard.render.com)
3. Click en "New +" → "Blueprint"
4. Conecta tu repositorio de GitHub
5. Render detectará automáticamente el `render.yaml` y usará Docker

### Opción 2: Configuración Manual

1. Sube tu código a GitHub
2. Ve a [Render Dashboard](https://dashboard.render.com)
3. Click en "New +" → "Web Service"
4. Conecta tu repositorio
5. Configura:
   - **Name**: `book-journal-api`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Docker Context**: `.`
   - **Plan**: Free

6. Variables de entorno:
   - `NODE_ENV`: `production`
   - `PORT`: `3000` (Render lo configura automáticamente, pero puedes especificarlo)
   - `FIREBASE_CONFIG`: Contenido completo de `firebase-config.json` como JSON string

7. Health Check:
   - **Health Check Path**: `/health`

8. Click en "Create Web Service"

## Variables de Entorno Requeridas

### FIREBASE_CONFIG

Debes agregar el contenido completo de tu `firebase-config.json` como una variable de entorno en Render.

**Forma 1: Desde el Dashboard de Render**
1. Ve a tu servicio en Render
2. Settings → Environment
3. Agrega nueva variable:
   - Key: `FIREBASE_CONFIG`
   - Value: Pega el contenido JSON completo de `firebase-config.json` (como string)

**Forma 2: Desde la línea de comandos (Render CLI)**
```bash
render env:set FIREBASE_CONFIG '{"type":"service_account",...}'
```

## Probar Localmente con Docker

### Build de la imagen
```bash
docker build -t book-journal-api .
```

### Ejecutar el contenedor
```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e FIREBASE_CONFIG='{"type":"service_account",...}' \
  book-journal-api
```

O usando un archivo `.env`:
```bash
docker run -p 3000:3000 --env-file .env book-journal-api
```

## Verificar el Despliegue

Una vez desplegado, puedes verificar:

1. **Health Check**: `https://tu-app.onrender.com/health`
2. **Root**: `https://tu-app.onrender.com/`

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "service": "Book Journal API"
}
```

## Notas Importantes

- ✅ **No necesitas certificados SSL**: Render maneja HTTPS automáticamente
- ✅ **El puerto se configura automáticamente**: Render usa la variable `PORT`
- ✅ **Cron jobs funcionan**: Los cron jobs de node-cron funcionan mientras la instancia esté activa
- ⚠️ **Plan gratuito se duerme**: Usa un servicio de ping externo para mantenerla activa

## Solución para mantener activa la instancia

Para evitar que la instancia se duerma en el plan gratuito:

1. **Usar UptimeRobot** (gratuito):
   - Crea cuenta en [UptimeRobot](https://uptimerobot.com)
   - Agrega un monitor HTTP(S)
   - URL: `https://tu-app.onrender.com/health`
   - Intervalo: 5 minutos

2. **El endpoint `/health` ya está configurado** para este propósito
