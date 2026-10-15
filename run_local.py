
"""
Archivo TIC IA - Práctica 2.3

Punto de entrada exclusivo para localhost.
En Vercel se utiliza app.main:app.
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
