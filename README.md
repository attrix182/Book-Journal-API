# Book Journal API

API REST construida con NestJS, PostgreSQL y Docker.

## Características

- ✅ Autenticación JWT (login/registro)
- ✅ CRUD completo de Libros
- ✅ Programas de Lectura
- ✅ Grupos de Lectura con notas
- ✅ PostgreSQL como base de datos
- ✅ Docker y Docker Compose para despliegue

## Instalación

### Desarrollo Local

1. Instalar dependencias:
```bash
cd backend
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

3. Ejecutar con Docker Compose:
```bash
# Desde la raíz del proyecto
docker-compose up -d
```

4. Ejecutar migraciones (si es necesario):
```bash
cd backend
npm run migration:run
```

5. Iniciar servidor de desarrollo:
```bash
npm run start:dev
```

La API estará disponible en `http://localhost:3000`

## Endpoints

### Autenticación
- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Login de usuario

### Libros
- `GET /libros` - Listar todos los libros del usuario
- `GET /libros/:id` - Obtener un libro
- `POST /libros` - Crear un libro
- `PATCH /libros/:id` - Actualizar un libro
- `DELETE /libros/:id` - Eliminar un libro

### Programas
- `GET /programas/libro/:libroId` - Obtener programa de un libro
- `POST /programas` - Crear programa
- `GET /programas/:id` - Obtener programa
- `DELETE /programas/:id` - Eliminar programa

### Grupos
- `GET /grupos/:id` - Obtener grupo
- `PATCH /grupos/:id` - Actualizar grupo (marcar completado, agregar notas)

## Producción

Para producción, usar Docker Compose:

```bash
docker-compose up -d
```

Asegúrate de cambiar las variables de entorno en `docker-compose.yml` para producción.
