import os
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from youtube_transcript_api import YouTubeTranscriptApi
from google import genai
from sse_starlette.sse import EventSourceResponse
from dotenv import load_dotenv
import re

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SummarizeRequest(BaseModel):
    url: str

from typing import Optional

def extract_video_id(url: str) -> Optional[str]:
    youtube_regex = (
        r'(https?://)?(www\.)?'
        r'(youtube|youtu|youtube-nocookie)\.(com|be)/'
        r'(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})')
    match = re.match(youtube_regex, url)
    if match:
        return match.group(6)
    return None

def fetch_transcript(video_id: str) -> str:
    try:
        api = YouTubeTranscriptApi()
        transcript_list = api.list(video_id)
        # Try to find english transcript first, or just grab the first one
        transcript_obj = transcript_list.find_transcript(['en', 'en-US', 'en-GB'])
        if not transcript_obj:
             transcript_obj = list(transcript_list)[0]

        transcript_data = transcript_obj.fetch()
        return " ".join([item['text'] if isinstance(item, dict) else item.text for item in transcript_data])
    except Exception as e:
        raise Exception(f"Failed to fetch transcript: {str(e)}")
@app.post("/api/summarize")
async def summarize_video(request: SummarizeRequest):
    video_id = extract_video_id(request.url)
    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    try:
        # Run sync function in a thread to avoid blocking event loop
        loop = asyncio.get_running_loop()
        transcript = await loop.run_in_executor(None, fetch_transcript, video_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")

    client = genai.Client(api_key=api_key)

    async def event_generator():
        prompt = f"""
You are an expert transcriber and summarizer.
Please provide a concise, bulleted summary and a "Key Takeaways" section for the following video transcript.

Transcript: 
{transcript}
"""
        try:
            response = await client.aio.models.generate_content_stream(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            async for chunk in response:
                if chunk.text:
                    # Replace newlines with a string literal \n so we can parse it in one block.
                    text_safe = chunk.text.replace('\n', '\\n')
                    yield {"data": text_safe}
        except Exception as e:
            yield {"event": "error", "data": str(e)}
        finally:
            yield {"event": "done", "data": "[DONE]"}

    return EventSourceResponse(event_generator())

@app.get("/")
def read_root():
    return {"message": "Instant YouTube Summarizer API"}
