# Synced from repo root api/index.py. After editing api/, run: npm run sync-api (from frontend)
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import OpenAI
import os
import json
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS so the frontend can talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def root():
    return {"status": "ok"}

@app.post("/api/chat")
def chat(request: ChatRequest):
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    
    try:
        user_message = request.message
        response = client.chat.completions.create(
            model="gpt-5",
            messages=[
                {"role": "system", "content": "You are a supportive mental coach."},
                {"role": "user", "content": user_message}
            ]
        )
        return {"reply": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calling OpenAI API: {str(e)}")


def _stream_chat(message: str):
    """Generator that yields SSE events: data: {"content": "..."}\n\n for each token."""
    if not os.getenv("OPENAI_API_KEY"):
        yield f"data: {json.dumps({'error': 'OPENAI_API_KEY not configured'})}\n\n".encode()
        return
    try:
        stream = client.chat.completions.create(
            model="gpt-5",
            messages=[
                {"role": "system", "content": "You are a supportive mental coach."},
                {"role": "user", "content": message},
            ],
            stream=True,
        )
        for chunk in stream:
            if chunk.choices and len(chunk.choices) > 0:
                delta = chunk.choices[0].delta
                if hasattr(delta, "content") and delta.content:
                    yield f"data: {json.dumps({'content': delta.content})}\n\n".encode()
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n".encode()


@app.post("/api/chat/stream")
def chat_stream(request: ChatRequest):
    """Stream assistant reply as Server-Sent Events."""
    return StreamingResponse(
        _stream_chat(request.message),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# Vercel may invoke with path after /api stripped
@app.post("/chat/stream")
def chat_stream_alt(request: ChatRequest):
    return chat_stream(request)


@app.post("/chat")
def chat_alt(request: ChatRequest):
    return chat(request)
