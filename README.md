
# 2.3 Agente documental con Google Drive — Archivo TIC IA

# **Instituto Tecnológico de Pachuca**

## Ingeniería en Tecnologías de la Información y Comunicaciones

### Inteligencia Artificial Aplicada a las TIC

### **Proyecto:** Archivo TIC IA — Agente documental inteligente con Google Drive y RAG

### **Autor:** Derek Alejandro Vargas Meneses

### **Número de control:** 22200792

### **Fecha:** 15 de octubre de 2026

---

## Descripción

**Archivo TIC IA** es una aplicación web académica que permite consultar documentos autorizados de Google Drive mediante inteligencia artificial.

Utiliza **OpenAI Responses API**, **File Search** y un **Vector Store** para recuperar información relevante de archivos indexados y responder preguntas con referencias a los documentos de origen.

La aplicación cuenta con una interfaz responsiva publicada en **GitHub Pages** y un backend **FastAPI** desplegado en **Vercel**.

La conexión y sincronización con Google Drive se realizan localmente mediante **OAuth 2.0**.

## Objetivo

Desarrollar un agente documental capaz de sincronizar archivos desde una carpeta autorizada de Google Drive, indexar su contenido para recuperación semántica y comparar respuestas de inteligencia artificial **con y sin RAG** (*Retrieval-Augmented Generation*), mostrando fuentes cuando existan citas verificables.

## Funcionalidades principales

- Autenticación local con Google Drive mediante OAuth 2.0.
- Sincronización de documentos PDF, TXT y Google Docs hacia un Vector Store de OpenAI.
- Detección de documentos agregados, modificados, eliminados y sin cambios.
- Biblioteca documental con búsqueda y filtro por tipo de archivo.
- Chat de preguntas y respuestas usando OpenAI Responses API.
- Activación o desactivación de File Search (RAG).
- Comparador que ejecuta la misma pregunta con y sin RAG.
- Visualización de referencias documentales cuando OpenAI devuelve citas.
- Copia de respuestas, nueva conversación y exportación del historial a TXT.
- Interfaz adaptable a computadora, tableta y teléfono.
- Backend publicado en Vercel.
- Frontend publicado en GitHub Pages.
- Protección de credenciales mediante variables de entorno del servidor.

## Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| Python 3.12 | Lenguaje del backend |
| FastAPI y Uvicorn | API REST y servidor local |
| OpenAI Responses API | Generación de respuestas |
| OpenAI File Search | Recuperación de información documental |
| OpenAI Vector Stores | Almacenamiento e indexación de documentos |
| Google Drive API | Lectura de archivos autorizados |
| Google OAuth 2.0 | Autorización de Google Drive en localhost |
| HTML5 | Estructura de la interfaz |
| CSS3 | Diseño responsivo |
| JavaScript | Interacción con el backend |
| GitHub Pages | Hospedaje del frontend |
| Vercel | Despliegue del backend |
| Git y GitHub | Control de versiones |

## Arquitectura del sistema

El proyecto utiliza una arquitectura separada entre frontend y backend.

**Frontend:**

La aplicación web se encuentra alojada en GitHub Pages. Se encarga de mostrar la interfaz, enviar preguntas, visualizar documentos, consultar fuentes y comparar respuestas con y sin RAG.

**Backend:**

El servidor FastAPI se encuentra desplegado en Vercel. Procesa las solicitudes del frontend y se comunica con OpenAI Responses API.

**Inteligencia artificial:**

OpenAI procesa las preguntas y utiliza File Search para recuperar información del Vector Store que contiene los documentos indexados.

**Google Drive:**

La sincronización se realiza desde localhost. Los documentos autorizados se indexan en OpenAI y sus metadatos se almacenan en un manifiesto local.

### Diagrama de arquitectura

```text
                 USUARIO
                    |
                    v
          +-------------------+
          |   GitHub Pages    |
          |   HTML, CSS, JS   |
          +-------------------+
                    |
                    | HTTPS / REST API
                    v
          +-------------------+
          |      Vercel       |
          |  Backend FastAPI  |
          +-------------------+
                    |
                    | OpenAI API
                    v
          +-------------------+
          | OpenAI Responses  |
          |       API         |
          +-------------------+
                    |
                    v
          +-------------------+
          |    File Search    |
          |    Vector Store   |
          +-------------------+
                    |
                    v
             Documentos
              indexados


        SINCRONIZACIÓN LOCAL
        -------------------

           Google Drive
                |
                v
             OAuth 2.0
                |
                v
           FastAPI local
                |
                v
          OpenAI Vector Store
                |
                v
         data/manifest.json
                |
                v
       Metadatos exportados
          hacia Vercel
```

**Importante:** Google Drive no se sincroniza directamente desde Vercel. El backend publicado utiliza el Vector Store existente y una copia de los metadatos documentales exportada desde el equipo local.

## Enlaces del proyecto

**Aplicación web — GitHub Pages:**

https://derek-alejandro.github.io/agente-documental-tic/

**Backend — Vercel:**

https://agente-documental-tic-two.vercel.app/

**Estado de la API:**

https://agente-documental-tic-two.vercel.app/api/health

**Repositorio GitHub:**

https://github.com/Derek-Alejandro/agente-documental-tic

## Estructura del proyecto

```text
agente-documental-tic/
│
├── app/
│   ├── core/
│   │   └── config.py
│   │
│   ├── models/
│   │   └── documento.py
│   │
│   ├── services/
│   │   ├── agent_service.py
│   │   ├── document_index.py
│   │   ├── drive_service.py
│   │   └── sync_service.py
│   │
│   └── main.py
│
├── assets/
│   ├── css/
│   │   └── styles.css
│   │
│   └── js/
│       ├── api.js
│       ├── app.js
│       └── config.js
│
├── data/
│   └── manifest.json
│
├── scripts/
│   └── export_vercel_vars.py
│
├── tests/
│
├── .env
├── .env.example
├── .gitignore
├── .python-version
├── credentials.json
├── token.json
├── index.html
├── pyproject.toml
├── requirements.txt
├── run_local.py
└── README.md
```

**Nota:** Los archivos `.env`, `credentials.json`, `token.json` y `data/manifest.json` contienen información privada o de configuración local y no deben publicarse en GitHub.

## Instalación y ejecución local

### 1. Requisitos

- Python 3.12.
- Visual Studio Code o un editor compatible.
- Git.
- Cuenta de Google con acceso a Google Drive.
- Proyecto configurado en Google Cloud.
- Credenciales OAuth 2.0 de Google.
- API Key de OpenAI con saldo disponible.
- Carpeta de Google Drive con documentos autorizados.

### 2. Crear el entorno virtual

Desde PowerShell, en la carpeta del proyecto:

```powershell
py -3.12 -m venv .venv
```

Activar el entorno virtual:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 3. Instalar las dependencias

```powershell
python -m pip install -r requirements.txt
```

### 4. Configurar Google Drive

1. Ingresar a Google Cloud Console.
2. Crear o seleccionar un proyecto.
3. Habilitar Google Drive API.
4. Configurar la pantalla de consentimiento OAuth.
5. Crear credenciales OAuth 2.0 de tipo Aplicación de escritorio.
6. Descargar el archivo de credenciales.
7. Guardarlo en el proyecto como `credentials.json`.
8. Crear una carpeta de Google Drive con los documentos autorizados.
9. Obtener el identificador de la carpeta.

### 5. Configurar las variables de entorno

Crear el archivo `.env` en la raíz del proyecto.

Ejemplo:

```dotenv
OPENAI_API_KEY=TU_API_KEY_PRIVADA
OPENAI_MODEL=gpt-4.1-mini
GOOGLE_DRIVE_FOLDER_ID=ID_DE_TU_CARPETA
VECTOR_STORE_ID=
LOCAL_ADMIN_KEY=
```

El identificador `VECTOR_STORE_ID` puede permanecer vacío durante la primera sincronización.

La variable `LOCAL_ADMIN_KEY` es opcional. Si se configura, las solicitudes de sincronización deberán incluir la cabecera `X-Admin-Key`.

### 6. Ejecutar el servidor local

```powershell
python run_local.py
```

Abrir en el navegador:

http://127.0.0.1:5000/

Desde la interfaz, utilizar el botón **Sincronizar Drive** para iniciar el proceso de indexación.

Durante la primera ejecución puede solicitarse autorización de Google mediante OAuth 2.0.

## Sincronización con Google Drive

El sistema permite sincronizar documentos de una carpeta autorizada de Google Drive.

El proceso consiste en:

1. Conectarse a Google Drive mediante OAuth 2.0.
2. Obtener los documentos de la carpeta configurada.
3. Identificar archivos nuevos, modificados o eliminados.
4. Preparar los documentos para su indexación.
5. Enviar los archivos a OpenAI.
6. Incorporarlos al Vector Store.
7. Actualizar el manifiesto documental local.
8. Mostrar los resultados de la sincronización.

El sistema permite trabajar con documentos PDF, TXT y Google Docs.

La sincronización se realiza únicamente desde localhost.

## Implementación de RAG

**RAG** significa *Retrieval-Augmented Generation*, o generación aumentada por recuperación.

Esta técnica permite que un modelo de inteligencia artificial recupere información relevante de una fuente documental antes de generar su respuesta.

En este proyecto se utiliza OpenAI File Search y un Vector Store para implementar RAG.

### Consulta con RAG

Cuando File Search está activado:

1. El usuario escribe una pregunta.
2. El frontend envía la solicitud al backend.
3. FastAPI consulta OpenAI Responses API.
4. File Search recupera información relevante de los documentos indexados.
5. El modelo genera una respuesta basada en la información encontrada.
6. La interfaz muestra la respuesta y las referencias disponibles.

### Consulta sin RAG

Cuando File Search está desactivado:

1. El usuario escribe una pregunta.
2. El backend envía la consulta sin habilitar File Search.
3. El modelo responde sin consultar el Vector Store.
4. La interfaz muestra la respuesta sin fuentes documentales recuperadas.

### Comparador RAG

La aplicación incorpora una herramienta que realiza dos consultas independientes utilizando la misma pregunta.

La primera consulta se realiza sin File Search y la segunda con File Search habilitado.

Los resultados se presentan de forma comparativa para observar diferencias en el contenido, el contexto y la disponibilidad de referencias documentales.

La utilización de RAG no garantiza automáticamente una mayor precisión; las respuestas deben verificarse con sus fuentes originales.

## Despliegue en Vercel

El backend del proyecto está desarrollado con FastAPI y se encuentra desplegado en Vercel.

La configuración utiliza Python 3.12 y el punto de entrada:

```toml
[tool.vercel]
entrypoint = "app.main:app"
```

Las dependencias se encuentran declaradas en `pyproject.toml`.

### Variables de entorno

Las variables utilizadas en Vercel son:

| Variable | Descripción |
|---|---|
| `OPENAI_API_KEY` | API Key privada de OpenAI |
| `OPENAI_MODEL` | Modelo de inteligencia artificial |
| `VECTOR_STORE_ID` | Identificador del Vector Store |
| `DOCUMENT_MANIFEST_B64` | Metadatos documentales codificados en Base64 |
| `FRONTEND_ORIGIN` | Origen permitido de GitHub Pages |

Para este proyecto, el origen permitido es:

```text
https://derek-alejandro.github.io
```

No debe incluirse la ruta del repositorio en el valor de CORS.

### Exportación del índice documental

Después de sincronizar Google Drive localmente, ejecutar:

```powershell
python scripts/export_vercel_vars.py
```

El script genera los valores:

```text
VECTOR_STORE_ID
DOCUMENT_MANIFEST_B64
```

Estos valores se configuran en las variables de entorno privadas de Vercel.

Cuando se modifica el inventario documental, deben actualizarse los metadatos en Vercel y realizarse un nuevo despliegue.

La codificación Base64 no representa un mecanismo de cifrado.

## Despliegue en GitHub Pages

El frontend está desarrollado con HTML, CSS y JavaScript.

Se encuentra publicado mediante GitHub Pages utilizando la rama principal del repositorio.

El archivo `app.js` detecta automáticamente el entorno de ejecución.

**En localhost:**

Utiliza el backend FastAPI local.

**En GitHub Pages:**

Utiliza el backend publicado en:

```text
https://agente-documental-tic-two.vercel.app
```

La sincronización de Google Drive se mantiene deshabilitada desde la interfaz publicada, ya que solo está permitida localmente.

## Endpoints REST

El backend expone los siguientes endpoints:

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/health` | Verifica el estado y la configuración del servidor |
| GET | `/api/documents` | Recupera el inventario documental |
| POST | `/api/ask` | Procesa preguntas con o sin RAG |
| POST | `/api/sync` | Sincroniza documentos desde localhost |

### Ejemplo de solicitud a OpenAI

Endpoint:

```text
POST /api/ask
```

Cuerpo JSON:

```json
{
  "question": "¿Cuáles son los temas principales de mis documentos?",
  "use_search": true
}
```

Cuando `use_search` es `true`, el backend habilita File Search.

Cuando `use_search` es `false`, realiza la consulta sin utilizar File Search.

## Pruebas y validación

Durante el desarrollo se realizaron pruebas de:

- Conexión y autenticación con Google Drive.
- Sincronización e indexación de archivos.
- Recuperación del inventario documental.
- Consultas con RAG activado.
- Consultas sin RAG.
- Comparación de respuestas.
- Visualización de citas documentales.
- Comunicación entre GitHub Pages y Vercel.
- Configuración CORS.
- Ejecución de FastAPI en Vercel.
- Exportación de conversaciones a TXT.
- Visualización responsiva de la interfaz.

### Pruebas automatizadas

Para ejecutar las pruebas incluidas en el proyecto:

```powershell
python -m pytest -q
```

### Verificar el backend publicado

Consultar:

https://agente-documental-tic-two.vercel.app/api/health

La respuesta esperada es:

```json
{
  "status": "ok",
  "configured": true
}
```

Para visualizar los documentos indexados:

https://agente-documental-tic-two.vercel.app/api/documents

## Seguridad

El proyecto aplica medidas básicas de protección de credenciales:

- La API Key de OpenAI se almacena en variables de entorno del servidor.
- La API Key no se incluye en el código JavaScript público.
- Las credenciales de Google OAuth permanecen en el entorno local.
- Los archivos privados deben excluirse mediante `.gitignore`.
- La sincronización de Google Drive se restringe a localhost.
- Se configura CORS para permitir solicitudes desde GitHub Pages.

### Consideraciones importantes

**CORS no es un sistema de autenticación.**

Aunque las solicitudes del navegador se limitan al origen configurado, los endpoints públicos pueden recibir solicitudes directas de terceros.

Por ello, esta implementación se considera un prototipo académico y no un sistema de producción completamente protegido.

Se recomienda:

- Utilizar documentos autorizados y no confidenciales.
- No publicar credenciales en GitHub.
- Establecer límites de consumo en OpenAI.
- Verificar las fuentes documentales.
- Desactivar el servicio público cuando termine la demostración, si ya no se necesita.
- Implementar autenticación y controles de uso antes de ofrecer el sistema a usuarios externos.

## Limitaciones del sistema

- La sincronización de Google Drive requiere ejecutar el backend localmente.
- Los metadatos publicados en Vercel deben actualizarse manualmente después de una sincronización.
- La calidad de las respuestas depende de los documentos indexados y de la recuperación de contexto.
- File Search puede devolver respuestas sin citas verificables cuando no encuentra información suficiente.
- Los enlaces originales de Google Drive mantienen sus propias restricciones de acceso.
- La aplicación requiere conexión a internet para consultar OpenAI.
- El backend público no incorpora autenticación de usuarios.

## Conclusión

El desarrollo de **Archivo TIC IA** permitió implementar un agente documental inteligente mediante la integración de Google Drive API, Google OAuth 2.0, OpenAI Responses API, File Search y Vector Stores.

El sistema permite sincronizar archivos desde Google Drive, indexar su información y realizar consultas mediante recuperación aumentada por generación.

La implementación del comparador con y sin RAG permite analizar las diferencias entre las respuestas generadas utilizando conocimiento general del modelo y aquellas fundamentadas en documentos propios.

Asimismo, el despliegue mediante GitHub Pages y Vercel permitió aplicar conceptos de desarrollo web, separación entre frontend y backend, consumo de APIs REST, manejo de variables de entorno, configuración CORS y protección básica de credenciales.

En conjunto, el proyecto demuestra cómo integrar servicios de inteligencia artificial y almacenamiento documental para facilitar la consulta, recuperación y análisis de información académica.

---

**Desarrollado por Derek Alejandro Vargas Meneses — ITIC — 22200792 — Instituto Tecnológico de Pachuca.**
