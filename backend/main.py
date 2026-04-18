from api import app
from api.auth.routes import auth_endpoints

app.include_router(auth_endpoints)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=3000)
