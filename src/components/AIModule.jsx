import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, Bot, User, Sparkles, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini (Will fallback gracefully if key is missing)
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "dummy_key");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const AIModule = () => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', text: 'Hello Manoj! I am NexTrack AI. How can I help you with your goals today?' }
    ]);
    
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            // interimResults can cause jumpy text if speaking fast, keeping it false for smoother input
            recognitionRef.current.interimResults = false;
            
            recognitionRef.current.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');
                
                setInputText(prev => prev ? `${prev} ${transcript}` : transcript);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
        
        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
            if (synthRef.current) synthRef.current.cancel();
        };
    }, []);

    const toggleListening = () => {
        if (!SpeechRecognition) {
            alert("Your browser does not support Speech Recognition.");
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current?.start();
                setIsListening(true);
            } catch(e) {
                console.error(e);
                setIsListening(false);
            }
        }
    };

    const speakText = (text) => {
        if (isMuted || !synthRef.current) return;
        
        // Cancel any ongoing speech
        synthRef.current.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        const voices = synthRef.current.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google UK English Female')) || 
                               voices.find(v => v.name.includes('Female')) ||
                               voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;
        
        utterance.rate = 1.0;
        utterance.pitch = 1.1; // Slightly higher pitch for a friendlier AI tone
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        synthRef.current.speak(utterance);
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;
        
        const userMsg = inputText;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInputText("");
        setIsLoading(true);
        
        // Stop listening if it was on
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        }

        try {
            // Build conversation history for context
            const history = messages.map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.text}`).join('\n');
            const prompt = `You are NexTrack AI, a highly intelligent, concise, and motivating personal productivity assistant. Keep responses under 3 sentences if possible. Respond conversationally.\n\nHere is the conversation history:\n${history}\nUser: ${userMsg}\nAI:`;
            
            const result = await model.generateContent(prompt);
            const responseText = result.response.text().replace(/\*/g, ''); // Clean out markdown bolding for speech
            
            setMessages(prev => [...prev, { role: 'bot', text: responseText }]);
            speakText(responseText);
        } catch (error) {
            console.error("Gemini API Error:", error);
            let errorMsg;
            if (!import.meta.env.VITE_GEMINI_API_KEY) {
                errorMsg = "My Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file.";
            } else if (error?.message) {
                // Show the real error so it's easy to debug (quota, invalid key, etc.)
                errorMsg = `API Error: ${error.message}`;
            } else {
                errorMsg = "I'm having trouble connecting right now. Please check your internet connection and API key.";
            }
            setMessages(prev => [...prev, { role: 'bot', text: errorMsg }]);
            speakText(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMute = () => {
        if (!isMuted) {
            synthRef.current?.cancel();
            setIsSpeaking(false);
        }
        setIsMuted(!isMuted);
    };

    return (
        <div className="max-w-4xl mx-auto h-[85vh] flex flex-col glass-panel overflow-hidden border border-white/5">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent/20 rounded-2xl shadow-[0_0_15px_rgba(139,92,246,0.2)] relative">
                        <Bot className="text-accent" size={24} />
                        {isSpeaking && (
                            <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></span>
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">NexTrack AI</h2>
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></span>
                            <p className="text-xs text-text-dim uppercase tracking-widest">
                                {isLoading ? 'Processing...' : isSpeaking ? 'Speaking...' : 'Neural Interface Active'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <button 
                        onClick={toggleMute}
                        className="p-2 text-text-dim hover:text-white transition-colors"
                        title={isMuted ? "Unmute AI" : "Mute AI"}
                    >
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <Sparkles className="text-accent/40" size={20} />
                </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                <AnimatePresence>
                    {messages.map((msg, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={i}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-accent' : 'bg-white/10 border border-white/10'
                                    }`}>
                                    {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-accent" />}
                                </div>
                                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-accent/10 text-white border border-accent/20 rounded-tr-none'
                                    : 'bg-white/5 text-gray-300 border border-white/10 rounded-tl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start"
                        >
                            <div className="flex gap-3 max-w-[80%] flex-row">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/10 border border-white/10">
                                    <Loader2 size={16} className="text-accent animate-spin" />
                                </div>
                                <div className="p-4 rounded-2xl text-sm bg-white/5 border border-white/10 rounded-tl-none flex items-center gap-2">
                                    <span className="w-2 h-2 bg-text-dim rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-text-dim rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                    <span className="w-2 h-2 bg-text-dim rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Section */}
            <div className="p-6 bg-[#0a0a0c] border-t border-white/10">
                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5 focus-within:border-accent/50 transition-all">
                    <button
                        onClick={toggleListening}
                        className="relative p-3 rounded-xl hover:bg-white/5 transition-all group"
                        title={isListening ? "Stop listening" : "Start speaking"}
                    >
                        {isListening ? <MicOff className="text-red-400" size={22} /> : <Mic className="text-accent group-hover:scale-110 transition-transform" size={22} />}
                        {isListening && (
                            <motion.div
                                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute inset-0 bg-red-400 rounded-xl"
                            />
                        )}
                    </button>

                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isListening ? "Listening..." : "Describe your progress or ask for advice..."}
                        disabled={isLoading}
                        className="flex-1 bg-transparent border-none py-3 text-white placeholder:text-text-dim focus:outline-none disabled:opacity-50"
                    />

                    <button
                        onClick={handleSend}
                        disabled={isLoading || !inputText.trim()}
                        className="p-3 bg-accent rounded-xl hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                    >
                        <Send size={18} className="text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIModule;