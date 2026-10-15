
"""
Archivo TIC IA - Práctica 2.3

Backend FastAPI compatible con:
- Localhost: Google Drive, OAuth y sincronización.
- Vercel: consultas de OpenAI y File Search.

La sincronización con Google Drive permanece
disponible únicamente en localhost.
"""

from pathlib import Path
from ipaddress import ip_address

from fastapi import (
    FastAPI,
    HTTPException,
    Request,
    Depends
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.models.documento import AskRequest, AskResponse
from app.services.document_index import load_document_index
from app.services.agent_service import AgentService


# ==========================================
# CONFIGURACION GENERAL
# ==========================================

ROOT = Path(__file__).resolve().parents[1]

app = FastAPI(
    title="Archivo TIC IA",
    description=(
        "Agente documental con Google Drive, "
        "OpenAI Responses API y File Search"
    ),
    version="1.1.0"
)


# ==========================================
# CORS PARA GITHUB PAGES
# ==========================================

if settings.frontend_origin:

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            settings.frontend_origin
        ],
        allow_methods=[
            "GET",
            "POST",
            "OPTIONS"
        ],
        allow_headers=[
            "Content-Type"
        ],
        allow_credentials=False
    )


# ==========================================
# ARCHIVOS ESTATICOS
# ==========================================

# En localhost FastAPI sirve la interfaz.
# En Vercel solo necesitamos los endpoints API.

if not settings.is_vercel:

    app.mount(
        "/assets",
        StaticFiles(
            directory=ROOT / "assets"
        ),
        name="assets"
    )


# ==========================================
# EVITAR CACHE EN ENDPOINTS API
# ==========================================

@app.middleware("http")
async def no_api_cache(
    request: Request,
    call_next
):

    response = await call_next(request)

    if request.url.path.startswith("/api/"):
        response.headers[
            "Cache-Control"
        ] = "no-store"

    return response


# ==========================================
# PROTECCION DE SINCRONIZACION LOCAL
# ==========================================

def local_only(request: Request):

    # Vercel no debe iniciar Google OAuth.
    if settings.is_vercel:

        raise HTTPException(
            status_code=404,
            detail=(
                "Sincronización disponible "
                "solo en localhost"
            )
        )

    host = (
        request.client.host
        if request.client
        else ""
    )

    try:

        if not ip_address(host).is_loopback:
            raise ValueError()

    except ValueError:

        raise HTTPException(
            status_code=403,
            detail=(
                "Sincronización disponible "
                "solo desde localhost"
            )
        )

    # Clave administrativa opcional.
    key = settings.local_admin_key

    if key:

        provided_key = request.headers.get(
            "X-Admin-Key"
        )

        if provided_key != key:

            raise HTTPException(
                status_code=401,
                detail=(
                    "Clave administrativa incorrecta"
                )
            )


# ==========================================
# ENDPOINT PRINCIPAL
# ==========================================

@app.get("/")
def index():

    if settings.is_vercel:

        return {
            "service": "Archivo TIC IA API",
            "status": "ok"
        }

    return FileResponse(
        ROOT / "index.html"
    )


# ==========================================
# VERIFICACION DEL SERVIDOR
# ==========================================

@app.get("/api/health")
def health():

    if settings.is_vercel:

        configured = bool(
            settings.openai_api_key
            and settings.vector_store_id
            and settings.document_manifest_b64
        )

    else:

        configured = bool(
            settings.openai_api_key
            and settings.drive_folder_id
        )

    return {
        "status": "ok",
        "configured": configured
    }


# ==========================================
# DOCUMENTOS INDEXADOS
# ==========================================

@app.get("/api/documents")
def documents():

    try:

        manifest = load_document_index()

    except ValueError as exc:

        raise HTTPException(
            status_code=503,
            detail=str(exc)
        ) from exc

    docs = list(
        manifest.get(
            "documents",
            {}
        ).values()
    )

    vector_store_configured = bool(
        settings.vector_store_id
        or manifest.get("vector_store_id")
    )

    return {
        "documents": docs,
        "indexed": len(docs),
        "vector_store_configured": (
            vector_store_configured
        )
    }


# ==========================================
# PREGUNTAS A OPENAI
# ==========================================

@app.post(
    "/api/ask",
    response_model=AskResponse
)
def ask(payload: AskRequest):

    try:

        if not settings.openai_api_key:

            raise ValueError(
                "Falta OPENAI_API_KEY"
            )

        agent = AgentService()

        return agent.ask(
            payload.question,
            payload.use_search
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc)
        ) from exc

    except Exception as exc:

        raise HTTPException(
            status_code=502,
            detail=(
                "Error al consultar OpenAI"
            )
        ) from exc


# ==========================================
# SINCRONIZAR GOOGLE DRIVE
# ==========================================

@app.post(
    "/api/sync",
    dependencies=[
        Depends(local_only)
    ]
)
def sync():

    # Importación diferida: no se inicia
    # Google OAuth en Vercel.

    from app.services.sync_service import SyncService

    try:

        if not settings.openai_api_key:

            raise ValueError(
                "Falta OPENAI_API_KEY"
            )

        service = SyncService()

        return service.sync()

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc)
        ) from exc

    except Exception as exc:

        raise HTTPException(
            status_code=502,
            detail=(
                f"Sincronización fallida: {exc}"
            )
        ) from exc
