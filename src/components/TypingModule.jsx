import React, { useState, useEffect } from 'react';
import { Keyboard, RotateCcw, Play, CheckCircle2, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LEVELS = [
    "Success is the sum of small efforts repeated day in and day out.",
    "The only way to do great work is to love what you do. If you haven't found it yet, keep looking.",
    "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.",
    "Your time is limited, so don't waste it living someone else's life. Don't be trapped by dogma."
];

const TypingModule = () => {
    const [currentLevel, setCurrentLevel] = useState(0);
    const targetText = LEVELS[currentLevel];
    
    const [input, setInput] = useState("");
    const [startTime, setStartTime] = useState(null);
    const [wpm, setWpm] = useState(0);
    const [accuracy, setAccuracy] = useState(100);
    const [mistakes, setMistakes] = useState(0);
    
    // Status: 'idle', 'typing', 'finished', 'stopped'
    const [status, setStatus] = useState('idle');

    useEffect(() => {
        if (status === 'typing' && startTime && input.length > 0) {
            const timeElapsed = (Date.now() - startTime) / 60000; // minutes
            const wordsTyped = input.length / 5;
            setWpm(Math.round(wordsTyped / timeElapsed) || 0);

            // Calculate accuracy
            let currentMistakes = 0;
            for (let i = 0; i < input.length; i++) {
                if (input[i] !== targetText[i]) currentMistakes++;
            }
            setMistakes(currentMistakes);
            const acc = Math.max(0, Math.round(((input.length - currentMistakes) / input.length) * 100));
            setAccuracy(acc || 100);
        }

        if (status === 'typing' && input === targetText) {
            setStatus('finished');
        }
    }, [input, status]);

    const handleInput = (e) => {
        if (status !== 'typing' && status !== 'idle') return;
        
        if (status === 'idle') {
            setStartTime(Date.now());
            setStatus('typing');
        }
        
        const val = e.target.value;
        // Don't allow typing past the length
        if (val.length <= targetText.length) {
            setInput(val);
        }
    };

    const reset = () => {
        setInput("");
        setStartTime(null);
        setWpm(0);
        setAccuracy(100);
        setMistakes(0);
        setStatus('idle');
    };

    const nextLevel = () => {
        if (currentLevel < LEVELS.length - 1) {
            setCurrentLevel(prev => prev + 1);
            reset();
        }
    };
    
    const stopSession = () => {
        setStatus('stopped');
    };

    const finalScore = Math.round(wpm * (accuracy / 100));

    return (
        <div className="max-w-3xl mx-auto mt-10 p-8 glass-panel border border-white/10">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-accent/20 rounded-2xl">
                        <Keyboard className="text-accent" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold premium-gradient">Typing Practice</h2>
                        <p className="text-text-dim text-sm">Level {currentLevel + 1} of {LEVELS.length}</p>
                    </div>
                </div>
                
                {status === 'typing' && (
                    <button onClick={stopSession} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all font-medium border border-red-500/20">
                        Stop Session
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {(status === 'finished' || status === 'stopped') ? (
                    <motion.div 
                        key="score"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white/5 p-8 rounded-3xl border border-white/10 text-center py-12"
                    >
                        <Trophy className="w-16 h-16 text-accent mx-auto mb-6" />
                        <h3 className="text-3xl font-bold text-white mb-2">
                            {status === 'finished' ? 'Level Completed!' : 'Session Stopped'}
                        </h3>
                        <p className="text-gray-400 mb-8">Here is your performance breakdown.</p>
                        
                        <div className="flex justify-center gap-12 mb-10">
                            <div>
                                <p className="text-text-dim text-sm uppercase tracking-wider mb-2">Final Speed</p>
                                <p className="text-4xl font-bold text-white">{wpm} <span className="text-lg text-accent">WPM</span></p>
                            </div>
                            <div>
                                <p className="text-text-dim text-sm uppercase tracking-wider mb-2">Accuracy</p>
                                <p className="text-4xl font-bold text-white">{accuracy}%</p>
                            </div>
                            <div>
                                <p className="text-text-dim text-sm uppercase tracking-wider mb-2">Score</p>
                                <p className="text-4xl font-bold text-green-400">{finalScore}</p>
                            </div>
                        </div>

                        <div className="flex justify-center gap-4">
                            <button onClick={reset} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-medium flex items-center gap-2">
                                <RotateCcw size={18} /> Retry Level
                            </button>
                            {(status === 'finished' && currentLevel < LEVELS.length - 1) && (
                                <button onClick={nextLevel} className="px-6 py-3 bg-accent hover:bg-accent/80 text-white rounded-xl transition-all font-medium shadow-[0_0_20px_rgba(170,59,255,0.4)] flex items-center gap-2">
                                    Next Level <Play size={18} />
                                </button>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="typing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="bg-white/5 p-8 rounded-3xl mb-6 font-mono text-xl leading-relaxed select-none border border-white/5 relative overflow-hidden">
                            {/* Focus blur overlay if idle */}
                            {status === 'idle' && (
                                <div className="absolute inset-0 z-10 bg-[#0a0a0c]/40 backdrop-blur-sm flex items-center justify-center">
                                    <div className="px-6 py-3 bg-accent text-white rounded-full font-sans font-medium flex items-center gap-2 animate-bounce">
                                        Start typing to begin
                                    </div>
                                </div>
                            )}

                            {targetText.split("").map((char, i) => {
                                let color = "text-text-dim";
                                if (i < input.length) {
                                    color = input[i] === char ? "text-green-400" : "text-red-400 bg-red-400/20 rounded-sm";
                                } else if (i === input.length && status === 'typing') {
                                    color = "text-white border-b-2 border-accent animate-pulse";
                                }
                                return <span key={i} className={color}>{char}</span>;
                            })}
                        </div>

                        <textarea
                            value={input}
                            onChange={handleInput}
                            disabled={status !== 'idle' && status !== 'typing'}
                            className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-6 focus:outline-none focus:border-accent/50 transition-all text-white text-lg font-mono mb-6 resize-none shadow-inner"
                            placeholder=""
                            autoFocus
                        />

                        <div className="flex justify-between items-center px-2">
                            <div className="flex gap-10">
                                <div>
                                    <p className="text-text-dim text-xs uppercase tracking-widest mb-1">Speed</p>
                                    <p className="text-2xl font-bold">{wpm} <span className="text-sm text-accent">WPM</span></p>
                                </div>
                                <div>
                                    <p className="text-text-dim text-xs uppercase tracking-widest mb-1">Accuracy</p>
                                    <p className="text-2xl font-bold">{accuracy}%</p>
                                </div>
                            </div>
                            <button onClick={reset} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all group" title="Restart">
                                <RotateCcw size={20} className="text-text-dim group-hover:text-white transition-colors group-hover:-rotate-180 duration-500" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TypingModule;