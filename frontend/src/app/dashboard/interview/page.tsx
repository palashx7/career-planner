"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User as UserIcon, Loader2, Target } from "lucide-react";
import api from "@/lib/api";

type Message = {
    role: "user" | "model";
    text: string;
};

export default function InterviewChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "model",
            text: "Hello! I act as the Senior Technical Hiring Manager for your target role. I've reviewed your self-assessment and I'll be explicitly testing some of your reported weak points today. We can start whenever you're ready. Simply type 'Hello' or introduce yourself to begin the interview."
        }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isTyping) return;

        const newMsg = inputValue.trim();
        const currentHistory = [...messages];

        // Optimistically add user message
        setMessages([...currentHistory, { role: "user", text: newMsg }]);
        setInputValue("");
        setIsTyping(true);

        try {
            const res = await api.post("/workflow/interview/chat", {
                history: currentHistory, // send history *before* this new message is added so backend AI builds it correctly
                newMessage: newMsg
            });

            // Add AI response
            setMessages(prev => [...prev, { role: "model", text: res.data.reply }]);
        } catch (err) {
            console.error("Chat Error:", err);
            setMessages(prev => [...prev, { role: "model", text: "I'm sorry, I'm having trouble connecting to the network. Could you repeat that?" }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto h-[calc(100vh-6rem)] flex flex-col">

            <header className="mb-6 shrink-0">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Target className="h-8 w-8 text-rose-500" /> Technical Mock Interview
                </h1>
                <p className="text-slate-400 mt-2">
                    A real-time dialogue with an AI Hiring Manager specifically trained to drill into your identified skill gaps.
                </p>
            </header>

            {/* Chat Container */}
            <div className="flex-1 glass-panel border-slate-800/50 flex flex-col overflow-hidden mb-6">

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map((m, idx) => (
                        <div key={idx} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex max-w-[80%] gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                                {/* Avatar */}
                                <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-blue-600' : 'bg-rose-900/50 border border-rose-500/30 text-rose-400'
                                    }`}>
                                    {m.role === 'user' ? <UserIcon className="h-5 w-5 text-white" /> : <Bot className="h-6 w-6" />}
                                </div>

                                {/* Message Bubble */}
                                <div className={`px-5 py-3.5 rounded-2xl ${m.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-sm'
                                        : 'bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-tl-sm'
                                    }`}>
                                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{m.text}</p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="flex w-full justify-start">
                            <div className="flex max-w-[80%] gap-4 flex-row">
                                <div className="shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-rose-900/50 border border-rose-500/30 text-rose-400">
                                    <Bot className="h-6 w-6" />
                                </div>
                                <div className="px-5 py-4 rounded-2xl bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-tl-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-rose-500/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-rose-500/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-rose-500/50 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-slate-900/80 border-t border-slate-800/50 shrink-0">
                    <div className="max-w-3xl mx-auto relative flex items-center">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Type your response... (Press Enter to send)"
                            className="w-full bg-slate-950 border border-slate-700 rounded-full py-4 pl-6 pr-16 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none overflow-hidden h-[56px] leading-[24px]"
                            rows={1}
                            disabled={isTyping}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || isTyping}
                            className="absolute right-2 top-2 h-[40px] w-[40px] rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white disabled:bg-slate-800 disabled:text-slate-600 transition-colors"
                        >
                            <Send className="h-4 w-4 ml-[-2px]" />
                        </button>
                    </div>
                    <div className="text-center mt-2">
                        <p className="text-[11px] text-slate-500">AI Hiring Manager may make mistakes. Treat this as practice.</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
