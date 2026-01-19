const express = require('express');
const cors = require('cors'); 
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const fs = require('fs');
const https = require('https');
const http = require('http');
const cron = require('node-cron');

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

// Función para obtener usuarios que deben recibir notificaciones
async function obtenerUsuariosParaNotificar() {
  const db = admin.firestore();
  const now = new Date();
  const currentDay = now.getDay(); // 0 = domingo, 1 = lunes, etc.
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

  try {
    const usersSnapshot = await db.collection('users').get();
    const usersToNotify = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const config = userData.notificationConfig;
      const pushToken = userData.pushToken;

      // Verificar si el usuario tiene notificaciones activas
      if (config && config.activa && config.tipo === 'push' && pushToken) {
        // Verificar si el día actual está en los días configurados
        if (config.dias && config.dias.includes(currentDay)) {
          // Verificar si la hora coincide
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
  } catch (error) {
    console.error('Error al obtener usuarios para notificar:', error);
    return [];
  }
}

// Función para enviar notificaciones a usuarios
async function enviarNotificacionesProgramadas() {
  console.log(`[${new Date().toISOString()}] Verificando usuarios para notificar...`);
  
  const usersToNotify = await obtenerUsuariosParaNotificar();
  
  if (usersToNotify.length === 0) {
    console.log('No hay usuarios para notificar en este momento');
    return;
  }

  console.log(`Encontrados ${usersToNotify.length} usuarios para notificar`);

  const tokens = usersToNotify.map(u => u.token).filter(t => t); // Filtrar tokens nulos
  
  if (tokens.length === 0) {
    console.log('No hay tokens válidos para enviar');
    return;
  }

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
      console.log(`Notificaciones enviadas a ${response.successCount} de ${chunk.length} dispositivos`);
    } catch (error) {
      console.error('Error enviando batch de notificaciones:', error);
      responses.push({ success: false, error });
    }
  }

  console.log(`Proceso de notificaciones completado. Total: ${tokens.length} tokens`);
}

// Configurar cron job para verificar cada minuto
// El formato es: segundo minuto hora día mes día-semana
// '* * * * *' = cada minuto
cron.schedule('* * * * *', async () => {
  await enviarNotificacionesProgramadas();
}, {
  scheduled: true,
  timezone: "America/Argentina/Buenos_Aires" // Ajustar según tu zona horaria
});

console.log('Cron job configurado para verificar notificaciones cada minuto');

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
