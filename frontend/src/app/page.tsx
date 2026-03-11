"use client";

import { useState, useRef, useEffect } from "react";
import { Youtube, Sparkles, AlertCircle, Loader2, Send, Bot, User } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "ai" | "error";
  content: string;
  isStreaming?: boolean;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || isLoading) return;

    const currentUrl = url;
    setUrl(""); // Clear input
    
    // Add user message
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, role: "user", content: `Summarize: ${currentUrl}` }]);
    
    setIsLoading(true);

    // Add empty AI message placeholder
    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMsgId, role: "ai", content: "", isStreaming: true }]);

    try {
      const response = await fetch("http://localhost:8000/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: currentUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to fetch summary");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let done = false;
      let fullContent = "";
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunkString = decoder.decode(value, { stream: true });
          
          const lines = chunkString.split("\n");
          for (const line of lines) {
            if (line.startsWith("data:")) {
              const data = line.slice(5).trim();
              if (data === "[DONE]") {
                done = true;
                break;
              }
              if (data) {
                 const parsedData = data.replace(/\\n/g, '\n');
                 fullContent += parsedData;
                 // Update the last AI message
                 setMessages(prev => 
                   prev.map(msg => 
                     msg.id === aiMsgId ? { ...msg, content: fullContent } : msg
                   )
                 );
              }
            } else if (line.startsWith("event: error")) {
                // Ignore for now
            }
          }
        }
      }
      
      // Mark as done streaming
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
        )
      );

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      // Update the placeholder with error or add a new error message
      setMessages(prev => {
        // Remove the empty streaming message if it's still empty
        const filtered = prev.filter(msg => !(msg.id === aiMsgId && msg.content === ""));
        return [...filtered, { id: Date.now().toString(), role: "error", content: errorMessage }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="h-screen flex flex-col bg-slate-950 text-slate-200 relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="flex-shrink-0 z-10 glass border-b border-white/5 py-4 px-6 flex items-center justify-center sm:justify-start gap-3 shadow-md">
        <div className="bg-gradient-to-br from-red-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-purple-500/20">
          <Youtube className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          YT AI Summarizer
        </h1>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto w-full mx-auto z-10 scroll-smooth pb-8 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-500 px-4 mt-8">
             <div className="bg-gradient-to-br from-indigo-500/20 to-purple-600/20 p-5 rounded-3xl mb-8 border border-white/5 shadow-2xl shadow-purple-500/10">
                <Youtube className="w-12 h-12 sm:w-16 sm:h-16 text-slate-200" />
             </div>
             <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 text-center tracking-tight">What video can I summarize for you?</h2>
             <p className="text-slate-400 text-base sm:text-lg max-w-md text-center font-medium px-2">Paste a YouTube URL below to instantly generate a detailed summary and key takeaways.</p>
          </div>
        ) : (
          messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`w-full py-6 sm:py-8 ${msg.role === 'ai' || msg.role === 'error' ? 'bg-slate-900/40 border-y border-white/5' : ''} animate-in fade-in duration-300`}
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 flex gap-4 sm:gap-6">
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-md mt-1
                ${msg.role === 'user' ? 'bg-indigo-600' : msg.role === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-gradient-to-br from-purple-500 to-indigo-600'}
              `}>
                {msg.role === 'user' ? <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : 
                 msg.role === 'error' ? <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : 
                 <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
              </div>
              
              {/* Message Content */}
              <div className="flex-1 min-w-0 text-sm sm:text-base text-slate-200 mt-1 sm:mt-1.5 font-medium leading-relaxed">
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                ) : msg.role === 'error' ? (
                  <p className="whitespace-pre-wrap text-red-300">{msg.content}</p>
                ) : (
                  <div className="overflow-hidden">
                    {msg.content === "" && msg.isStreaming ? (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Sparkles className="w-4 h-4 animate-pulse text-purple-400" />
                        <span className="animate-pulse">Analyzing video...</span>
                      </div>
                    ) : (
                      <>
                        <div 
                          dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} 
                          className="markdown-content space-y-4 [&>ul]:list-disc [&>ul]:ml-5 [&>ul>li]:pl-2 [&>ul>li]:mb-2 [&>h3]:text-white [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-3 [&>h2]:text-[1.2rem] md:[&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-8 [&>h2]:mb-4 [&>h1]:text-2xl md:[&>h1]:text-3xl [&>h1]:font-bold [&>h1]:text-white [&>h1]:mt-8 [&>h1]:mb-6 [&>strong]:text-white"
                        />
                        {msg.isStreaming && (
                          <span className="inline-block w-2 h-5 bg-purple-400 ml-1 translate-y-1 animate-pulse rounded-sm" />
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          ))
        )}
        <div ref={messagesEndRef} className="flex-shrink-0 h-4 w-full" />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 z-20 pb-4 pt-4 px-4 sm:pb-8 w-full">
        <div className="max-w-4xl mx-auto relative group">
          <form 
            onSubmit={handleSubmit}
            className="relative flex items-center justify-between gap-2 bg-slate-900/80 border border-white/10 rounded-2xl p-1.5 focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/50 transition-all shadow-2xl backdrop-blur-md"
          >
            <div className="flex-1 min-h-[48px] sm:min-h-[56px] flex items-center pl-3 sm:pl-4">
              <input
                type="url"
                required
                placeholder="Paste YouTube URL here..."
                className="w-full bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 text-sm sm:text-base font-medium"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !url}
              className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-white/10"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 animate-spin" />
              ) : (
                <Send className="w-4 h-4 sm:w-5 sm:h-5 sm:ml-1 text-slate-200" />
              )}
            </button>
          </form>
          <div className="text-center mt-3 hidden sm:block">
            <p className="text-xs text-slate-500 font-medium tracking-wide">
              AI Summaries powered by Gemini
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

// Simple and safe markdown parser for basic formatting
function formatMarkdown(text: string) {
  let html = text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
    .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>');
    
  html = html.replace(/<\/ul>\n?<ul>/gim, '\n');
  html = html.replace(/<\/ul><ul>/gim, '');
  
  html = html.split('\n').join('<br />');
  
  html = html.replace(/(<\/li>)<br \/>/gim, '$1');
  html = html.replace(/<br \/>(<ul>)/gim, '$1');
  html = html.replace(/<br \/>(<\/ul>)/gim, '$1');
  html = html.replace(/<br \/>(<h2>)/gim, '$1');
  html = html.replace(/<br \/>(<h3>)/gim, '$1');
  html = html.replace(/(<\/h2>)<br \/>/gim, '$1');
  html = html.replace(/(<\/h3>)<br \/>/gim, '$1');
  
  html = html.replace(/<br \/>(<h1>)/gim, '$1');
  
  return html;
}
