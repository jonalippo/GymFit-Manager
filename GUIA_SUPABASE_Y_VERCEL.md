# Guía Definitiva: Conexión con Supabase, Visual Studio Code y Despliegue en Vercel

Esta guía te explica detalladamente, paso a paso, cómo abrir este proyecto en **Visual Studio Code**, conectarlo con tu base de datos en **Supabase** y desplegarlo en producción con **Vercel**.

---

## 1. Cómo abrir y ejecutar el proyecto en Visual Studio Code

### Requisitos previos
- **Node.js** (versión 18 o superior) instalado en tu computadora. Puedes descargarlo gratis desde [nodejs.org](https://nodejs.org/).
- **Visual Studio Code** instalado.

### Pasos:
1. **Descomprimir o clonar** la carpeta del proyecto en tu computadora.
2. Abre **Visual Studio Code**, ve a `Archivo > Abrir carpeta...` y selecciona la carpeta del proyecto.
3. Abre la terminal integrada de VS Code (`Ctrl + \`` o `Terminal > Nueva terminal`).
4. Instala todas las dependencias del proyecto ejecutando:
   ```bash
   npm install
   ```
5. Crea un archivo llamado `.env` en la raíz del proyecto (junto a `.env.example`).
6. Inicia el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
7. Abre tu navegador en `http://localhost:3000`. ¡La aplicación ya estará funcionando!

---

## 2. Configuración Paso a Paso de Supabase

Supabase te proporciona la base de datos PostgreSQL, autenticación de usuarios y almacenamiento en la nube.

### Paso 1: Crear tu proyecto en Supabase
1. Ingresa a [supabase.com](https://supabase.com/) e inicia sesión con GitHub o tu correo.
2. Haz clic en **"New Project"**.
3. Completa los datos:
   - **Name**: `gymfitpro-manager` (o el nombre de tu gimnasio).
   - **Database Password**: Genera una contraseña segura y **anótala**.
   - **Region**: Selecciona la región más cercana a tus usuarios (por ejemplo, `South America (São Paulo) - sa-east-1`).
   - **Pricing Plan**: Free tier (100% gratuito).
4. Haz clic en **"Create new project"** y espera 1 a 2 minutos mientras se aprovisiona la base de datos.

---

### Paso 2: Crear todas las tablas y seguridad con el Script SQL
Este proyecto incluye un archivo SQL completo con todas las tablas, índices, triggers y políticas de seguridad RLS.

1. En el panel izquierdo de Supabase, haz clic en el ícono de **SQL Editor** (parece una consola de comandos `>_`).
2. Haz clic en **"New query"**.
3. Abre el archivo `supabase/schema.sql` que ya tienes en este proyecto, copia todo su contenido y pégalo en el editor de Supabase.
4. Haz clic en el botón verde **"Run"** (o presiona `Ctrl + Enter`).
5. Verás el mensaje `Success. No rows returned`. ¡Listo! Se habrán creado todas las siguientes tablas:
   - `organizaciones`: Gestión multi-gimnasio.
   - `profesores`: Vinculados a la autenticación de Supabase.
   - `grupos`: Gestión de turnos y grupos de sala.
   - `alumnos`: Fichas completas, datos de contacto, apto médico y **cuotas mensuales**.
   - `evaluaciones_clinicas`: Evaluaciones biopsicosociales (Pilar 1 a 5).
   - `rutinas`: Fases y ciclos de entrenamiento.
   - `bloques_rutina`: Días de entrenamiento (Día 1, Día 2, etc.).
   - `ejercicios_rutina`: Series, reps, **carga (Kg)**, pausa y observaciones.
   - `seguimiento_diario`: RPE y dolor en sala.

---

### Paso 3: Obtener tus Claves de API
1. En tu panel de Supabase, haz clic en el engranaje de **Project Settings** (abajo a la izquierda).
2. Ve a la sección **API** (bajo la categoría *Configuration*).
3. Copia dos valores clave:
   - **Project URL**: Ejemplo: `https://xyzcompany.supabase.co`
   - **Project API Keys** -> `anon` `public`: Ejemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

### Paso 4: Configurar tu archivo `.env` local
En la raíz de tu proyecto en Visual Studio Code, edita tu archivo `.env`:

```env
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY="tu-anon-public-key-aqui"
```

> **IMPORTANTE**: Las variables deben comenzar con `VITE_` para que Vite las exponga de forma segura en el frontend.

---

### Paso 5: Configurar la Autenticación en Supabase
1. En el panel izquierdo de Supabase, haz clic en **Authentication** > **Providers**.
2. Asegúrate de que **Email** esté marcado como **Enabled**.
3. En **Authentication** > **URL Configuration**:
   - **Site URL**: Durante desarrollo pon `http://localhost:3000`. Al publicar en Vercel, coloca tu dominio de Vercel (por ejemplo `https://gymfitpro.vercel.app`).
   - En **Redirect URLs**, agrega `http://localhost:3000/**` y la URL de Vercel.

---

## 3. Seguridad y Prevención de Hackeos (Seguridad de Nivel Bancario)

Este proyecto está diseñado siguiendo las mejores prácticas de seguridad de aplicaciones web:

1. **Row Level Security (RLS) Activado en Todas las Tablas**:
   - Cada tabla de la base de datos tiene habilitado RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
   - Esto significa que ningún usuario puede consultar o modificar datos pertenecientes a otro gimnasio o profesor, incluso si intentan manipular las peticiones de red o la consola del navegador.

2. **Diferencia entre `anon` key y `service_role` key**:
   - **NUNCA utilices la clave `service_role` en el frontend**. La clave `service_role` salta todas las políticas de seguridad RLS y solo debe usarse en servidores backend privados.
   - En tu app cliente solo se utiliza `anon public key`, la cual respeta estrictamente las políticas RLS de PostgreSQL.

3. **Protección de Datos Médicos (Cumplimiento GDPR / Ley de Datos Personales)**:
   - La tabla `evaluaciones_clinicas` requiere que el usuario autenticado pertenezca a la misma organización del alumno. Cualquier acceso no autorizado es rechazado a nivel de motor de base de datos PostgreSQL.

4. **Sanitización de Entradas**:
   - Los campos numéricos y de teléfonos filtran caracteres no permitidos (`replace(/[^0-9+() -]/g, '')`), evitando inyecciones de código malicioso o errores de formato.

---

## 4. Despliegue en Producción en Vercel (Paso a Paso)

Vercel es la plataforma ideal y recomendada para publicar esta aplicación web progresiva (PWA):

### Paso 1: Subir tu código a GitHub
1. Crea un repositorio en [github.com](https://github.com/) (puedes elegirlo público o privado).
2. En la terminal de tu proyecto en VS Code, inicializa git y sube tu código:
   ```bash
   git init
   git add .
   git commit -m "GymFitPro Manager v1.0"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/tu-repositorio.git
   git push -u origin main
   ```

### Paso 2: Importar el proyecto en Vercel
1. Entra a [vercel.com](https://vercel.com/) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New..."** > **"Project"**.
3. Selecciona tu repositorio de GitHub y haz clic en **"Import"**.

### Paso 3: Configurar Variables de Entorno en Vercel
Antes de hacer clic en Deploy:
1. En la sección **Environment Variables**, añade las dos variables de Supabase:
   - Key: `VITE_SUPABASE_URL` | Value: Tu URL de Supabase
   - Key: `VITE_SUPABASE_ANON_KEY` | Value: Tu clave anónima pública
2. Verifica los ajustes de Build:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Haz clic en **"Deploy"**.

¡En menos de un minuto tu aplicación estará publicada y accesible en todo el mundo con certificado SSL gratuito (HTTPS), conexión en vivo a Supabase y soporte para instalación PWA en celulares Android y iPhone!
