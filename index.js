const express = require('express');
const cors = require('cors'); 
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const fs = require('fs');
const https = require('https');
const http = require('http');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

// Inicializar la app de Firebase
// Intentar leer desde variable de entorno (Render) o archivo local
let serviceAccount;

if (process.env.FIREBASE_CONFIG) {
  // En producción (Render), leer desde variable de entorno
  serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
} else {
  // En desarrollo local, leer desde archivo
  try {
    serviceAccount = require('./firebase-config.json');
  } catch (error) {
    console.error('Error: No se encontró firebase-config.json ni FIREBASE_CONFIG en variables de entorno');
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Configurar transporter de nodemailer para SMTP
// Las credenciales se obtienen de variables de entorno
let emailTransporter = null;

function inicializarEmailTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || smtpUser; // Email remitente (por defecto el mismo usuario)
  const smtpSecure = process.env.SMTP_SECURE === 'true'; // true para puerto 465, false para 587

  if (!smtpHost || !smtpUser || !smtpPassword) {
    console.warn('[SMTP] Configuración SMTP incompleta. Variables requeridas: SMTP_HOST, SMTP_USER, SMTP_PASSWORD');
    console.warn('[SMTP] Variables opcionales: SMTP_PORT (default: 587), SMTP_FROM, SMTP_SECURE (default: false)');
    return null;
  }

  try {
    emailTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure, // true para 465, false para otros puertos
      auth: {
        user: smtpUser,
        pass: smtpPassword
      }
    });

    console.log('[SMTP] Transporter de email configurado correctamente');
    console.log(`[SMTP] Host: ${smtpHost}, Port: ${smtpPort}, From: ${smtpFrom}`);
    return emailTransporter;
  } catch (error) {
    console.error('[SMTP] Error al configurar transporter:', error);
    return null;
  }
}

// Inicializar transporter al arrancar
inicializarEmailTransporter();

const app = express();

// Configurar CORS
const corsOptions = {
  origin: [
    'http://localhost:4200',
    'http://localhost:8100',
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'https://localhost'
  ],
  methods: ['POST', 'OPTIONS'], 
  allowedHeaders: ['Authorization', 'Content-Type'], 
};

// Usar el middleware CORS
app.use(cors(corsOptions));

// Body parser para manejar JSON
app.use(bodyParser.json());

// Health check endpoint (útil para mantener la instancia activa en Render)
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Book Journal API'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString()
  });
});

// Endpoint para enviar notificaciones
app.post('/sendNotification', async (req, res) => {
  const { token, title, body } = req.body;

  if (!token || !Array.isArray(token) || token.length === 0 || !title || !body) {
    return res.status(400).json({ error: 'Missing required fields: tokens (array), title, body' });
  }

  const MAX_TOKENS_PER_BATCH = 500;
  const message = {
    notification: {
      title: title,
      body: body
    }
  };

  const chunks = [];
  for (let i = 0; i < token.length; i += MAX_TOKENS_PER_BATCH) {
    chunks.push(token.slice(i, i + MAX_TOKENS_PER_BATCH));
  }

  const responses = [];
  for (const chunk of chunks) {
    try {
      const response = await admin.messaging().sendEachForMulticast({
        ...message,
        tokens: chunk
      });
      responses.push(response);
    } catch (error) {
      console.error('Error sending batch:', error);
      responses.push({ success: false, error });
    }
  }

  res.status(200).json({
    success: true,
    responses
  });
});

// Función para obtener la fecha/hora en una zona horaria específica
function getDateInTimezone(timezone = 'America/Argentina/Buenos_Aires') {
  const now = new Date();
  // Convertir a string en la zona horaria especificada
  const dateString = now.toLocaleString('en-US', { 
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Parsear la fecha string (formato: MM/DD/YYYY, HH:MM:SS)
  const [datePart, timePart] = dateString.split(', ');
  const [month, day, year] = datePart.split('/');
  const [hour, minute, second] = timePart.split(':');
  
  // Crear una fecha en UTC que represente la hora local en la zona horaria especificada
  const localDate = new Date(Date.UTC(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  ));
  
  return {
    date: localDate,
    day: localDate.getUTCDay(), // 0 = domingo, 1 = lunes, etc.
    hour: parseInt(hour),
    minute: parseInt(minute),
    timeString: `${hour}:${minute}`,
    fullString: dateString
  };
}

// Función para obtener usuarios que deben recibir notificaciones (push y email)
// Optimizada para usar campos calculados y consultas de Firestore más eficientes
// 
// OPTIMIZACIONES APLICADAS:
// 1. Cron job ejecuta cada hora (en :00 de cada hora, ej: 09:00, 10:00, 11:00)
//    - Reduce consultas de 1440/día a 24/día (98% menos)
//    - Solo permite horarios en punto (minutos = 00) - validado en frontend
// 2. Campos calculados (notificationActive, notificationType, notificationHour, notificationDays)
//    - Permiten filtrar en Firestore antes de traer documentos
// 3. Consultas con where() para filtrar usuarios activos
//    - Solo trae usuarios con notificaciones activas (push o email)
// 
// NOTA: Para mejor rendimiento, crear un índice compuesto en Firestore:
// Collection: users
// Fields: notificationActive (Ascending), notificationType (Ascending)
async function obtenerUsuariosParaNotificar() {
  const db = admin.firestore();
  const TIMEZONE = 'America/Argentina/Buenos_Aires';
  const timeInfo = getDateInTimezone(TIMEZONE);
  const currentDay = timeInfo.day;
  const currentTime = timeInfo.timeString;

  console.log(`[DEBUG] Zona horaria: ${TIMEZONE}`);
  console.log(`[DEBUG] Fecha/hora local: ${timeInfo.fullString}`);
  console.log(`[DEBUG] Día de la semana: ${currentDay} (0=Dom, 1=Lun, 2=Mar, etc.)`);
  console.log(`[DEBUG] Hora actual: ${currentTime}`);

  try {
    // OPTIMIZACIÓN: Usar consultas de Firestore para filtrar antes de traer datos
    // Obtener usuarios con notificaciones activas (tanto push como email)
    // Usamos los campos calculados: notificationActive
    // Nota: Firestore no permite múltiples where() con != null, así que filtramos pushToken/email después
    
    // Obtener usuarios con notificaciones activas (push o email)
    let usersQuery = db.collection('users')
      .where('notificationActive', '==', true);

    const usersSnapshot = await usersQuery.get();
    
    // Si no hay resultados con los campos calculados, hacer fallback a consulta completa
    // (para usuarios antiguos que no tienen los campos calculados)
    let usersToNotifyPush = [];
    let usersToNotifyEmail = [];
    let totalUsers = 0;
    let usersWithConfig = 0;
    let usersActive = 0;
    let usersWithToken = 0;
    let usersWithEmail = 0;
    let usersDayMatch = 0;
    let usersTimeMatch = 0;

    if (usersSnapshot.empty) {
      console.log('[DEBUG] No se encontraron usuarios con campos calculados, usando fallback...');
      // Fallback: consulta completa pero filtrada
      const allUsersSnapshot = await db.collection('users').get();
      
      for (const userDoc of allUsersSnapshot.docs) {
        totalUsers++;
        const userData = userDoc.data();
        const config = userData.notificationConfig;
        const pushToken = userData.pushToken;

        if (config && config.activa) {
          usersWithConfig++;
          usersActive++;
          
          // Verificar día y hora
          if (config.dias && Array.isArray(config.dias) && config.dias.includes(currentDay)) {
            usersDayMatch++;
            if (config.hora === currentTime) {
              usersTimeMatch++;
              
              // Push notifications
              if (config.tipo === 'push' && pushToken) {
                usersWithToken++;
                usersToNotifyPush.push({
                  userId: userDoc.id,
                  token: pushToken,
                  config: config
                });
              }
              
              // Email notifications
              if (config.tipo === 'email' && config.email) {
                usersWithEmail++;
                usersToNotifyEmail.push({
                  userId: userDoc.id,
                  email: config.email,
                  config: config
                });
              }
            }
          }
        }
      }
    } else {
      // Usar campos calculados para optimizar
      for (const userDoc of usersSnapshot.docs) {
        totalUsers++;
        const userData = userDoc.data();
        const pushToken = userData.pushToken;
        const config = userData.notificationConfig;
        const notificationType = userData.notificationType || config?.tipo;

        // Verificar si el día actual está en los días configurados
        const notificationDays = userData.notificationDays || (config?.dias || []);
        const notificationHour = userData.notificationHour || config?.hora;

        if (Array.isArray(notificationDays) && notificationDays.includes(currentDay)) {
          usersDayMatch++;
          
          // Verificar si la hora coincide
          if (notificationHour === currentTime) {
            usersTimeMatch++;
            
            // Push notifications
            if (notificationType === 'push' && pushToken && typeof pushToken === 'string' && pushToken.trim() !== '') {
              usersWithToken++;
              console.log(`[DEBUG] ✅ Usuario ${userDoc.id}: PUSH - HORA COINCIDE! (${notificationHour} === ${currentTime})`);
              usersToNotifyPush.push({
                userId: userDoc.id,
                token: pushToken,
                config: config || {}
              });
            }
            
            // Email notifications
            if (notificationType === 'email' && config?.email) {
              usersWithEmail++;
              console.log(`[DEBUG] ✅ Usuario ${userDoc.id}: EMAIL - HORA COINCIDE! (${notificationHour} === ${currentTime})`);
              usersToNotifyEmail.push({
                userId: userDoc.id,
                email: config.email,
                config: config || {}
              });
            }
          }
        }
      }
    }

    console.log(`[DEBUG] Resumen: Total usuarios consultados: ${totalUsers}, Con token: ${usersWithToken}, Con email: ${usersWithEmail}, Día match: ${usersDayMatch}, Hora match: ${usersTimeMatch}, Para notificar push: ${usersToNotifyPush.length}, Para notificar email: ${usersToNotifyEmail.length}`);

    return {
      push: usersToNotifyPush,
      email: usersToNotifyEmail
    };
  } catch (error) {
    console.error('Error al obtener usuarios para notificar:', error);
    // Si falla la consulta optimizada, intentar fallback
    try {
      console.log('[DEBUG] Intentando fallback sin campos calculados...');
      const allUsersSnapshot = await db.collection('users').get();
      const usersToNotify = [];
      
      for (const userDoc of allUsersSnapshot.docs) {
        const userData = userDoc.data();
        const config = userData.notificationConfig;
        const pushToken = userData.pushToken;
        
        if (config && config.activa && config.tipo === 'push' && pushToken) {
          if (config.dias && Array.isArray(config.dias) && config.dias.includes(currentDay)) {
            if (config.hora === currentTime) {
              usersToNotify.push({
                userId: userDoc.id,
                token: pushToken,
                config: config
              });
            }
          }
        }
      }
      
      return usersToNotify;
    } catch (fallbackError) {
      console.error('Error en fallback:', fallbackError);
      return { push: [], email: [] };
    }
  }
}

// Función para enviar emails
async function enviarEmails(usuariosEmail) {
  if (!emailTransporter) {
    console.warn('[EMAIL] Transporter de email no configurado. Saltando envío de emails.');
    return { enviados: 0, errores: usuariosEmail.length };
  }

  if (usuariosEmail.length === 0) {
    return { enviados: 0, errores: 0 };
  }

  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@bookjournal.com';
  const title = '📖 Recordatorio de Lectura';
  const body = 'Es hora de leer tu lectura diaria. ¡No te olvides!';
  
  let enviados = 0;
  let errores = 0;

  for (const usuario of usuariosEmail) {
    try {
      const mailOptions = {
        from: smtpFrom,
        to: usuario.email,
        subject: title,
        text: body,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">📖 Recordatorio de Lectura</h2>
            <p style="font-size: 16px; line-height: 1.6;">
              Es hora de leer tu lectura diaria. ¡No te olvides!
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Book Journal - Tu diario de lectura personal
            </p>
          </div>
        `
      };

      const info = await emailTransporter.sendMail(mailOptions);
      console.log(`[EMAIL] ✅ Email enviado a ${usuario.email}: ${info.messageId}`);
      enviados++;
    } catch (error) {
      console.error(`[EMAIL] ❌ Error al enviar email a ${usuario.email}:`, error.message);
      errores++;
    }
  }

  console.log(`[EMAIL] Proceso de emails completado. Enviados: ${enviados}, Errores: ${errores}`);
  return { enviados, errores };
}

// Función para enviar notificaciones a usuarios (push y email)
async function enviarNotificacionesProgramadas() {
  console.log(`[${new Date().toISOString()}] Verificando usuarios para notificar...`);
  
  const usersToNotify = await obtenerUsuariosParaNotificar();
  const usersPush = usersToNotify.push || [];
  const usersEmail = usersToNotify.email || [];
  
  if (usersPush.length === 0 && usersEmail.length === 0) {
    console.log('No hay usuarios para notificar en este momento');
    return;
  }

  console.log(`Encontrados ${usersPush.length} usuarios para notificar por push y ${usersEmail.length} por email`);

  // Enviar notificaciones push
  if (usersPush.length > 0) {
    const tokens = usersPush.map(u => u.token).filter(t => t); // Filtrar tokens nulos
    
    if (tokens.length > 0) {
      const title = '📖 Recordatorio de Lectura';
      const body = 'Es hora de leer tu lectura diaria. ¡No te olvides!';

      const MAX_TOKENS_PER_BATCH = 500;
      const chunks = [];
      for (let i = 0; i < tokens.length; i += MAX_TOKENS_PER_BATCH) {
        chunks.push(tokens.slice(i, i + MAX_TOKENS_PER_BATCH));
      }

      const responses = [];
      for (const chunk of chunks) {
        try {
          const response = await admin.messaging().sendEachForMulticast({
            notification: {
              title: title,
              body: body
            },
            tokens: chunk
          });
          responses.push(response);
          console.log(`[PUSH] Notificaciones enviadas a ${response.successCount} de ${chunk.length} dispositivos`);
        } catch (error) {
          console.error('[PUSH] Error enviando batch de notificaciones:', error);
          responses.push({ success: false, error });
        }
      }

      console.log(`[PUSH] Proceso de notificaciones push completado. Total: ${tokens.length} tokens`);
    }
  }

  // Enviar notificaciones por email
  if (usersEmail.length > 0) {
    const resultadoEmail = await enviarEmails(usersEmail);
    console.log(`[EMAIL] Proceso de emails completado. Enviados: ${resultadoEmail.enviados}, Errores: ${resultadoEmail.errores}`);
  }
}

// Configurar cron job para verificar cada hora (en :00 de cada hora)
// El formato es: segundo minuto hora día mes día-semana
// '0 0 * * * *' = cada hora en el minuto 0 (ej: 09:00, 10:00, 11:00, etc.)
// Esto reduce las consultas a Firestore de 1440/día a 24/día (98% menos)
// El frontend valida que solo se permitan horas en punto (minutos = 00)
cron.schedule('0 0 * * * *', async () => {
  await enviarNotificacionesProgramadas();
}, {
  scheduled: true,
  timezone: "America/Argentina/Buenos_Aires"
});

console.log('Cron job configurado para verificar notificaciones cada hora (en :00 de cada hora)');

// Obtener el puerto de la variable de entorno o usar 3000 por defecto
const PORT = process.env.PORT || 3000;

// Verificar si estamos en producción (Render) o desarrollo local
const isProduction = process.env.NODE_ENV === 'production' || !fs.existsSync('./ssl/key.key');

if (isProduction) {
  // En producción (Render), usar HTTP (Render maneja HTTPS automáticamente)
  app.listen(PORT, () => {
    console.log(`HTTP Server running on port ${PORT}`);
    console.log('Sistema de notificaciones programadas iniciado');
  });
} else {
  // En desarrollo local, usar HTTPS con certificados SSL
  try {
    const sslOptions = {
      key: fs.readFileSync('./ssl/key.key'), 
      cert: fs.readFileSync('./ssl/cert.crt'), 
    };
    https.createServer(sslOptions, app).listen(PORT, () => {
      console.log(`HTTPS Server running on port ${PORT}`);
      console.log('Sistema de notificaciones programadas iniciado');
    });
  } catch (error) {
    console.warn('No se encontraron certificados SSL, usando HTTP:', error.message);
    app.listen(PORT, () => {
      console.log(`HTTP Server running on port ${PORT}`);
      console.log('Sistema de notificaciones programadas iniciado');
    });
  }
}
