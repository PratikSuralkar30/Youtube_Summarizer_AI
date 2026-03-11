import sys
print(sys.executable)
try:
    from youtube_transcript_api import YouTubeTranscriptApi
    
    api = YouTubeTranscriptApi()
    transcript = api.fetch('dQw4w9WgXcQ')
    sys.stdout.reconfigure(encoding='utf-8')  # type: ignore
    print(" ".join([item.text for item in transcript]))
except Exception as e:
    import traceback
    traceback.print_exc()
