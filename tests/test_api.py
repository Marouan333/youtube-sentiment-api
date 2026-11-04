"""Tests de l'API : endpoints, gestion d'erreurs, temps de reponse."""
import time
from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_predict_batch_small():
    response = client.post("/predict_batch", json={"comments": ["i love it", "i hate it"]})
    assert response.status_code == 200
    data = response.json()
    assert len(data["predictions"]) == 2
    assert set(data["stats"].keys()) == {"positive", "neutral", "negative"}


def test_predict_batch_large():
    comments = ["great video"] * 50
    response = client.post("/predict_batch", json={"comments": comments})
    assert response.status_code == 200
    assert len(response.json()["predictions"]) == 50


def test_predict_batch_empty():
    response = client.post("/predict_batch", json={"comments": []})
    assert response.status_code == 200
    assert response.json()["predictions"] == []


def test_predict_batch_invalid_payload():
    response = client.post("/predict_batch", json={"wrong_field": "oops"})
    assert response.status_code == 422


def test_response_time_under_1s_for_50_comments():
    comments = ["great video"] * 50
    start = time.perf_counter()
    client.post("/predict_batch", json={"comments": comments})
    elapsed = time.perf_counter() - start
    assert elapsed < 1
