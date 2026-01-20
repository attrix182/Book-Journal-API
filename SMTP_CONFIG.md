# Configuración SMTP para Notificaciones por Email

Este documento explica cómo configurar SMTP para enviar notificaciones por email en Book Journal API.

## Variables de Entorno Requeridas

Agrega las siguientes variables de entorno en tu plataforma de despliegue (Render, Heroku, etc.) o en tu archivo `.env` local:

### Variables Obligatorias

- `SMTP_HOST`: El servidor SMTP (ej: `smtp.gmail.com`, `smtp.outlook.com`, `smtp.mailgun.org`)
- `SMTP_USER`: Usuario/email para autenticación SMTP
- `SMTP_PASSWORD`: Contraseña o token de aplicación para autenticación SMTP

### Variables Opcionales

- `SMTP_PORT`: Puerto SMTP (default: `587` para TLS, usa `465` para SSL)
- `SMTP_FROM`: Email remitente (default: usa `SMTP_USER`)
- `SMTP_SECURE`: `true` para SSL (puerto 465) o `false` para TLS (puerto 587) (default: `false`)

## Ejemplos de Configuración

### Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-contraseña-de-aplicacion
SMTP_FROM=tu-email@gmail.com
SMTP_SECURE=false
```

**Nota**: Para Gmail, necesitas usar una "Contraseña de aplicación" en lugar de tu contraseña normal. Genera una en: https://myaccount.google.com/apppasswords

### Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=tu-email@outlook.com
SMTP_PASSWORD=tu-contraseña
SMTP_FROM=tu-email@outlook.com
SMTP_SECURE=false
```

### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@tu-dominio.mailgun.org
SMTP_PASSWORD=tu-api-key
SMTP_FROM=noreply@tu-dominio.com
SMTP_SECURE=false
```

### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=tu-sendgrid-api-key
SMTP_FROM=noreply@tu-dominio.com
SMTP_SECURE=false
```

## Verificación

Cuando el servidor inicia, verás en los logs:

- `[SMTP] Transporter de email configurado correctamente` - Si la configuración es correcta
- `[SMTP] Configuración SMTP incompleta...` - Si faltan variables requeridas

Si la configuración está incompleta, el sistema seguirá funcionando pero solo enviará notificaciones push, no emails.

## Instalación de Dependencias

Asegúrate de instalar `nodemailer`:

```bash
npm install
```

O manualmente:

```bash
npm install nodemailer
```

## Funcionamiento

1. El sistema verifica usuarios con notificaciones por email activas cada 15 minutos
2. Si un usuario tiene `notificationConfig.tipo === 'email'` y `notificationConfig.activa === true`
3. Y la hora y día coinciden con su configuración
4. Se envía un email al `notificationConfig.email` configurado

El email incluye:
- Asunto: "📖 Recordatorio de Lectura"
- Cuerpo: "Es hora de leer tu lectura diaria. ¡No te olvides!"
- Formato HTML con estilo básico
