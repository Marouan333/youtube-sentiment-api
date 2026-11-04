"""API FastAPI pour servir le modele de sentiment."""
import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="YouTube Sentiment API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load("models/model.joblib")
vectorizer = joblib.load("models/vectorizer.joblib")


class CommentBatch(BaseModel):
    comments: list[str]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict_batch")
def predict_batch(batch: CommentBatch):
    if not batch.comments:
        return {"predictions": [], "stats": {"positive": 0, "neutral": 0, "negative": 0}}

    X = vectorizer.transform(batch.comments)
    predictions = model.predict(X).tolist()
    counts = {
        "positive": predictions.count(1),
        "neutral": predictions.count(0),
        "negative": predictions.count(-1),
    }
    return {"predictions": predictions, "stats": counts}
