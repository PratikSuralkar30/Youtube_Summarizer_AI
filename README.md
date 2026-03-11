# YouTube Summarizer AI

A full-stack web application that takes any YouTube video URL and generates a concise, bulleted summary and key takeaways using the **YouTube Transcript API** and **Google Gemini 2.5 Flash**.

## Features

- **Instant Summarization**: Get a summary of any YouTube video without watching it.
- **Streaming Responses**: Built with Server-Sent Events (SSE) so you can see the AI generating the summary in real-time.
- **Modern Tech Stack**:
  - **Frontend**: Next.js, React, Tailwind CSS
  - **Backend**: FastAPI, Python, Google GenAI
- **Easy to Use**: Simply paste a YouTube URL and get the insights.

---

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [Python 3.8+](https://www.python.org/downloads/)
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

---

## 🚀 Getting Started

Follow these steps to run the application locally.

### 1. Set up the Backend (FastAPI)

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # On Windows:
   .\.venv\Scripts\activate
   # On macOS/Linux:
   source .venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend` directory and add your Gemini API key:
   ```ini
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
5. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```
   *The backend will be running at `http://127.0.0.1:8000`.*

### 2. Set up the Frontend (Next.js)

1. Open a **new** terminal window and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The frontend will be running at `http://localhost:3000`.*

---

## Usage

1. Open your browser and go to `http://localhost:3000`.
2. Paste a valid YouTube video URL into the input field.
3. Click "Summarize" and watch the AI generate the key takeaways in real-time.

---

## Technologies Used

- **FastAPI**: High-performance backend framework for Python.
- **Next.js & React**: Framework for a robust frontend interface.
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
- **youtube-transcript-api**: To fetch transcripts from YouTube without requiring authentication.
- **Google GenAI SDK**: To interact with the Gemini 2.5 Flash model for lightning-fast summarization.
- **sse-starlette**: For streaming the response back to the client via Server-Sent Events.

## License

This project is open-source and available under the [MIT License](LICENSE).
