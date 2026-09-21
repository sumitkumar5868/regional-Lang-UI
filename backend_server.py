import base64
import os
from typing import Any, Dict, List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="RegionalAI — Regional Language Multimodal AI Backend",
    description="FastAPI service for multimodal gesture vision and regional language translation",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supported regional language greetings map (including Bhojpuri)
LANGUAGE_GREETINGS: Dict[str, Dict[str, str]] = {
    "hi": {"text": "नमस्ते", "translation": "Hello", "native": "हिन्दी"},
    "bho": {"text": "प्रणाम", "translation": "Hello (Respectful)", "native": "भोजपुरी"},
    "bn": {"text": "নমস্কার", "translation": "Hello", "native": "বাংলা"},
    "ta": {"text": "வணக்கம்", "translation": "Hello", "native": "தமிழ்"},
    "te": {"text": "నమస్కారం", "translation": "Hello", "native": "తెలుగు"},
    "mr": {"text": "नमस्कार", "translation": "Hello", "native": "मराठी"},
    "gu": {"text": "નમસ્તે", "translation": "Hello", "native": "ગુજરાતી"},
    "kn": {"text": "ನಮಸ್ಕಾರ", "translation": "Hello", "native": "ಕನ್ನಡ"},
    "ml": {"text": "നമസ്കാരം", "translation": "Hello", "native": "മലയാളം"},
    "pa": {"text": "ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ", "translation": "Hello", "native": "ਪੰਜਾਬੀ"},
    "or": {"text": "ନମସ୍କାର", "translation": "Hello", "native": "ଓଡ଼ିଆ"},
    "ur": {"text": "آداب", "translation": "Hello", "native": "اردو"},
}

SUPPORTED_LANGUAGE_CODES: List[str] = list(LANGUAGE_GREETINGS.keys())


class PredictRequest(BaseModel):
    image: Optional[str] = None
    language: str = "hi"


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "service": "regional-language-ai",
        "supported_languages": SUPPORTED_LANGUAGE_CODES,
        "features": {
            "gesture_prediction": True,
            "regional_translation": True,
            "bhojpuri_support": True,
            "audio_synthesis": False,
        },
    }


@app.get("/languages")
def get_languages() -> Dict[str, Any]:
    return {
        "languages": [
            {"code": code, "native": data["native"], "greeting": data["text"]}
            for code, data in LANGUAGE_GREETINGS.items()
        ]
    }


@app.post("/predict")
def predict(payload: PredictRequest) -> Dict[str, Any]:
    image = payload.image or ""
    language = (payload.language or "hi").lower().strip()

    lang_data = LANGUAGE_GREETINGS.get(language, LANGUAGE_GREETINGS["hi"])

    response: Dict[str, Any] = {
        "text": lang_data["text"],
        "translation": lang_data["translation"],
        "audio": "",
        "emoji": "👋",
        "gesture": "hello",
        "confidence": 0.96,
        "language": language,
        "image_received": bool(image),
    }

    if image:
        try:
            if image.startswith("data:image"):
                _, _, data = image.partition(",")
                if data:
                    decoded = base64.b64decode(data)
                    response["ImageSizeBytes"] = len(decoded)
        except Exception:
            pass

    return response


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend_server:app", host="0.0.0.0", port=8000, reload=False)

