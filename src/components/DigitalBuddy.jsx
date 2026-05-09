import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Power, Play, Pause, Square, Plus, X, ListTodo, Timer, Clock } from 'lucide-react';

// Kaomoji Faces
const FACES = {
    sleep: "( -_ - ) zZ",
    idle: "( • ‿ • )",
    happy: "( ˘ ▽ ˘ )",
    focused: "( Ò_Ó )",
    angry: "( ಠ_ಠ )",
    celebrate: "\\( ﾟヮﾟ)/"
};

const DigitalBuddy = () => {
    // Master Toggle
    const [isOn, setIsOn] = useState(true);

    // Timer State
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [sessionType, setSessionType] = useState('focus'); // 'focus' or 'break'
    
    // Reminders State
    const [reminders, setReminders] = useState([]);
    const [newReminder, setNewReminder] = useState("");

    // Emotion State
    const [emotion, setEmotion] = useState(FACES.idle);
    const [emotionMsg, setEmotionMsg] = useState("I'm ready when you are!");

    const timerRef = useRef(null);

    // Emotion Engine
    useEffect(() => {
        if (!isOn) {
            setEmotion(FACES.sleep);
            setEmotionMsg("Zzz... Wake me up to start.");
            return;
        }

        if (isTimerActive) {
            if (sessionType === 'focus') {
                setEmotion(FACES.focused);
                setEmotionMsg("Stay focused! You got this.");
            } else {
                setEmotion(FACES.happy);
                setEmotionMsg("Enjoy your break! Relax.");
            }
        } else if (timeLeft === 0) {
            setEmotion(FACES.celebrate);
            setEmotionMsg("Session complete! Great job!");
        } else {
            setEmotion(FACES.idle);
            setEmotionMsg("I'm ready when you are!");
        }
    }, [isOn, isTimerActive, sessionType, timeLeft]);

    // Timer Logic
    useEffect(() => {
        if (isTimerActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isTimerActive) {
            setIsTimerActive(false);
            clearInterval(timerRef.current);
            // Auto switch session type logic could go here
        }

        return () => clearInterval(timerRef.current);
    }, [isTimerActive, timeLeft]);

    // Timer Controls
    const toggleTimer = () => {
        if (!isOn) return;
        setIsTimerActive(!isTimerActive);
    };

    const stopTimer = () => {
        if (!isOn) return;
        if (isTimerActive) {
            // Stopped early
            setIsTimerActive(false);
            setEmotion(FACES.angry);
            setEmotionMsg("Why did you stop early? Focus!");
            
            // Revert back to idle after 3 seconds
            setTimeout(() => {
                if (isOn) {
                    setEmotion(FACES.idle);
                    setEmotionMsg("Ready to try again?");
                }
            }, 3000);
        }
        clearInterval(timerRef.current);
        setTimeLeft(sessionType === 'focus' ? 25 * 60 : 5 * 60);
    };

    const setSession = (type) => {
        if (!isOn) return;
        setIsTimerActive(false);
        setSessionType(type);
        setTimeLeft(type === 'focus' ? 25 * 60 : 5 * 60);
    };

    // Reminders Logic
    const addReminder = (e) => {
        e.preventDefault();
        if (!newReminder.trim() || !isOn) return;
        setReminders([...reminders, { id: Date.now(), text: newReminder }]);
        setNewReminder("");
    };

    const removeReminder = (id) => {
        if (!isOn) return;
        setReminders(reminders.filter(r => r.id !== id));
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="max-w-5xl mx-auto mt-10 space-y-6">
            {/* Header & Master Toggle */}
            <div className="flex justify-between items-center bg-[#0a0a0c] p-6 rounded-3xl border border-white/10 glass-panel">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent/20 rounded-2xl">
                        <Bot className="text-accent" size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold premium-gradient">Digital Buddy</h2>
                        <p className="text-text-dim text-sm mt-1">Your interactive productivity companion</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                    <span className="text-sm font-medium text-text-dim uppercase tracking-wider">Buddy Power</span>
                    <button 
                        onClick={() => setIsOn(!isOn)}
                        className={`w-14 h-8 rounded-full transition-colors relative flex items-center ${isOn ? 'bg-accent' : 'bg-white/10'}`}
                    >
                        <motion.div 
                            animate={{ x: isOn ? 28 : 4 }}
                            className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md"
                        >
                            <Power size={12} className={isOn ? 'text-accent' : 'text-gray-400'} />
                        </motion.div>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* ── Buddy Avatar Card ── */}
                <div className={`col-span-1 lg:col-span-3 xl:col-span-1 glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all ${!isOn ? 'opacity-50 grayscale' : ''}`}>
                    <motion.div 
                        animate={{ y: isOn && !isTimerActive ? [0, -10, 0] : 0 }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        className="w-48 h-48 bg-gradient-to-b from-white/10 to-transparent rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.15)] mb-6 relative"
                    >
                        {isOn && isTimerActive && (
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                                className="absolute inset-[-2px] rounded-full border-t-2 border-accent opacity-50"
                            />
                        )}
                        <h1 className="text-5xl font-mono font-bold text-white tracking-widest">{emotion}</h1>
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-2">Mimo</h3>
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-sm text-text-dim">{emotionMsg}</p>
                    </div>
                </div>

                {/* ── Focus Timer ── */}
                <div className={`col-span-1 lg:col-span-2 xl:col-span-1 glass-panel rounded-3xl p-8 flex flex-col transition-all ${!isOn ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-3 mb-8">
                        <Timer className="text-accent" />
                        <h3 className="text-xl font-bold text-white">Focus Timer</h3>
                    </div>

                    <div className="flex justify-center gap-2 mb-8 bg-[#0a0a0c] p-1.5 rounded-2xl border border-white/10 self-center">
                        <button 
                            onClick={() => setSession('focus')}
                            className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${sessionType === 'focus' ? 'bg-accent text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'text-text-dim hover:text-white'}`}
                        >
                            Pomodoro
                        </button>
                        <button 
                            onClick={() => setSession('break')}
                            className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${sessionType === 'break' ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-text-dim hover:text-white'}`}
                        >
                            Short Break
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center">
                        <h1 className="text-7xl font-bold text-white tracking-tight mb-8 font-mono">
                            {formatTime(timeLeft)}
                        </h1>
                        
                        <div className="flex gap-4">
                            <button 
                                onClick={toggleTimer}
                                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isTimerActive ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 'bg-accent text-white hover:scale-105 shadow-[0_0_20px_rgba(139,92,246,0.4)]'}`}
                            >
                                {isTimerActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                            </button>
                            <button 
                                onClick={stopTimer}
                                className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 text-text-dim hover:bg-white/10 hover:text-white transition-all"
                            >
                                <Square size={20} fill="currentColor" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Quick Reminders ── */}
                <div className={`col-span-1 lg:col-span-3 xl:col-span-1 glass-panel rounded-3xl p-8 flex flex-col transition-all ${!isOn ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-3 mb-6">
                        <ListTodo className="text-accent" />
                        <h3 className="text-xl font-bold text-white">Session Notes</h3>
                    </div>

                    <form onSubmit={addReminder} className="mb-6 relative">
                        <input 
                            type="text" 
                            value={newReminder}
                            onChange={(e) => setNewReminder(e.target.value)}
                            placeholder="Add a quick reminder..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-white text-sm focus:outline-none focus:border-accent/50 transition-all"
                        />
                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-accent/20 rounded-xl text-accent hover:bg-accent/40 transition-all">
                            <Plus size={16} />
                        </button>
                    </form>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        <AnimatePresence>
                            {reminders.length === 0 ? (
                                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center py-8 text-text-dim">
                                    <p className="text-sm">No notes. Keep your mind clear!</p>
                                </motion.div>
                            ) : (
                                reminders.map(reminder => (
                                    <motion.div 
                                        key={reminder.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                                            <span className="text-sm text-gray-300 truncate">{reminder.text}</span>
                                        </div>
                                        <button 
                                            onClick={() => removeReminder(reminder.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-text-dim hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                        >
                                            <X size={14} />
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DigitalBuddy;
