# Solución de Problemas

## Error: Failed to build 'psycopg2-binary'

Este error es común en macOS, especialmente con chips Apple Silicon (M1/M2/M3).

### Solución Rápida: Usar psycopg3 (Ya configurado)

El proyecto ya está configurado para usar `psycopg3` en lugar de `psycopg2-binary`. Solo necesitas:

```bash
cd backend
pip install -r requirements.txt
```

Si aún tienes problemas, prueba estas soluciones:

---

## Opción 1: Instalar PostgreSQL con Homebrew

```bash
# Instalar PostgreSQL
brew install postgresql@15

# Agregar al PATH
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verificar instalación
which pg_config

# Instalar dependencias de Python
cd backend
pip install -r requirements.txt
```

---

## Opción 2: Usar psycopg2 (en lugar de psycopg3)

Si prefieres usar `psycopg2-binary` en lugar de `psycopg3`:

### 1. Modificar requirements.txt

```bash
cd backend
```

Edita `requirements.txt` y cambia:

```diff
# Base de datos
SQLAlchemy==2.0.23
- psycopg[binary]==3.1.18
+ psycopg2-binary==2.9.9
```

### 2. Modificar la URL de base de datos

En `backend/.env`:

```diff
- DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/finanzas_personales
+ DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finanzas_personales
```

### 3. Instalar con brew primero

```bash
# Instalar PostgreSQL
brew install postgresql@15

# Configurar variables de entorno
export LDFLAGS="-L/opt/homebrew/opt/postgresql@15/lib"
export CPPFLAGS="-I/opt/homebrew/opt/postgresql@15/include"

# Instalar psycopg2
pip install psycopg2-binary
```

---

## Opción 3: Usar Docker (Sin problemas de dependencias)

La forma más fácil es usar Docker Compose, que no requiere instalar PostgreSQL localmente:

```bash
# Desde la raíz del proyecto
docker-compose up -d

# Ver logs
docker-compose logs -f backend
```

Con Docker no necesitas instalar ni PostgreSQL ni las dependencias de Python en tu máquina.

---

## Verificar que funciona

### Verificar instalación de psycopg

```bash
cd backend
source venv/bin/activate  # Si usas venv
python -c "import psycopg; print(psycopg.__version__)"
# Debería mostrar: 3.1.18 (o similar)
```

### Verificar conexión a la base de datos

```bash
# Crear la base de datos si no existe
createdb finanzas_personales

# O con PostgreSQL instalado por Homebrew
/opt/homebrew/opt/postgresql@15/bin/createdb finanzas_personales

# Probar conexión
psql -h localhost -U postgres -d finanzas_personales -c "SELECT version();"
```

### Iniciar el backend

```bash
cd backend
python -m app.main
```

Si ves: `✅ Base de datos inicializada correctamente`, todo está funcionando.

---

## Otros Problemas Comunes

### Error: "role 'postgres' does not exist"

```bash
# Crear el rol postgres
createuser -s postgres

# O con Homebrew
/opt/homebrew/opt/postgresql@15/bin/createuser -s postgres
```

### Error: "could not connect to server"

```bash
# Iniciar PostgreSQL
brew services start postgresql@15

# Verificar que está corriendo
brew services list | grep postgresql
```

### Error: "database 'finanzas_personales' does not exist"

```bash
# Crear la base de datos
createdb finanzas_personales

# O especificar usuario
createdb -U postgres finanzas_personales
```

### Frontend no puede conectar al backend

Verifica que el backend esté corriendo en el puerto 8000:

```bash
curl http://localhost:8000/api/health
```

Debería responder:
```json
{
  "success": true,
  "message": "API de Finanzas Personales funcionando correctamente",
  "version": "1.0.0"
}
```

---

## Resumen de Recomendaciones

### Para desarrollo local (macOS):

1. **Opción más fácil**: Usar Docker Compose
   ```bash
   docker-compose up -d
   ```

2. **Opción Python nativo**: Usar psycopg3 (ya configurado)
   ```bash
   brew install postgresql@15
   pip install -r requirements.txt
   ```

### Para producción:

- Usar Docker siempre que sea posible
- Variables de entorno configuradas correctamente
- `psycopg3` es más moderno y recomendado para nuevos proyectos

---

## Contacto para Ayuda

Si ninguna solución funciona, por favor abre un issue con:

1. Tu sistema operativo y versión
2. Versión de Python (`python --version`)
3. El error completo
4. Lo que ya intentaste
