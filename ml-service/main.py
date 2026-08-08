from fastapi import FastAPI

app = FastAPI(title="BizLens-AI ML Service")


@app.get("/")
def home():
    return {
        "message": "BizLens-AI ML Service is running"
    }