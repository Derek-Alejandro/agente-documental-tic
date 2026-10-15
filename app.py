
"""
Archivo TIC IA
Punto de entrada para localhost y Vercel.
"""

from app.main import app


if __name__ == "__main__":

    import os
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=int(os.getenv("PORT", "5000")),
        reload=False
    )
