import React, { useState, useEffect } from 'react';
import { Plus, Check, Trash2, X, Calendar as CalendarIcon, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';

const HabitTracker = () => {
    const [habits, setHabits] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newHabitText, setNewHabitText] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const todayDateStr = format(new Date(), 'yyyy-MM-dd');

    useEffect(() => {
        // Fetch habits from Firestore in real-time
        const habitsRef = collection(db, 'habits');
        const unsubscribe = onSnapshot(habitsRef, (snapshot) => {
            const habitsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setHabits(habitsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching habits:", error);
            // Fallback for when Firebase isn't configured yet
            if (error.code === 'permission-denied' || error.code === 'invalid-argument') {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const toggleHabit = async (habit) => {
        try {
            const habitRef = doc(db, 'habits', habit.id);
            const currentDates = habit.completedDates || [];
            
            let updatedDates;
            if (currentDates.includes(todayDateStr)) {
                // Uncheck: remove today's date
                updatedDates = currentDates.filter(date => date !== todayDateStr);
            } else {
                // Check: add today's date
                updatedDates = [...currentDates, todayDateStr];
            }
            
            await updateDoc(habitRef, { completedDates: updatedDates });
        } catch (error) {
            console.error("Error updating habit:", error);
        }
    };

    const deleteHabit = async (id) => {
        if(window.confirm("Delete this habit permanently?")) {
            try {
                await deleteDoc(doc(db, 'habits', id));
            } catch (error) {
                console.error("Error deleting habit:", error);
            }
        }
    };

    const addHabit = async (e) => {
        e.preventDefault();
        if (!newHabitText.trim()) return;
        
        try {
            await addDoc(collection(db, 'habits'), {
                text: newHabitText,
                completedDates: [],
                createdAt: new Date()
            });
            setNewHabitText("");
            setIsAdding(false);
        } catch (error) {
            console.error("Error adding habit:", error);
            alert("Firebase configuration might be missing or invalid.");
        }
    };

    if (isLoading) {
        return <div className="max-w-2xl mx-auto mt-10 p-6 glass-panel text-center text-gray-400">Loading habits...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto mt-10 p-6 glass-panel">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold premium-gradient">Daily Habits</h2>
                    <p className="text-text-dim text-sm mt-1 flex items-center gap-2">
                        <CalendarIcon size={14} /> {format(new Date(), 'EEEE, MMMM do')}
                    </p>
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-3 bg-accent/20 rounded-2xl hover:bg-accent/40 transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                >
                    {isAdding ? <X className="text-accent" /> : <Plus className="text-accent" />}
                </button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 overflow-hidden"
                    >
                        <form onSubmit={addHabit} className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-3xl">
                            <input 
                                type="text" 
                                value={newHabitText}
                                onChange={(e) => setNewHabitText(e.target.value)}
                                placeholder="E.g., Drink 2L of Water"
                                autoFocus
                                className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent/50 transition-all text-white"
                            />
                            <button type="submit" className="px-6 py-4 bg-accent rounded-2xl font-bold text-white hover:scale-105 transition-all">Add</button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-4">
                <AnimatePresence>
                    {habits.length === 0 ? (
                        <p className="text-center text-gray-400 py-8">No habits yet. Click + to add one!</p>
                    ) : (
                        habits.map((habit) => {
                            const completedDates = habit.completedDates || [];
                            const isCompletedToday = completedDates.includes(todayDateStr);
                            const streak = completedDates.length; // Simple lifetime total for now

                            return (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    key={habit.id}
                                    className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-accent/30 transition-all group relative overflow-hidden"
                                >
                                    <div className="flex items-center gap-5 relative z-10">
                                        <button
                                            onClick={() => toggleHabit(habit)}
                                            className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${isCompletedToday ? 'bg-accent border-accent shadow-[0_0_15px_rgba(139,92,246,0.4)]' : 'border-text-dim/50 hover:border-accent/50'
                                                }`}
                                        >
                                            <AnimatePresence>
                                                {isCompletedToday && (
                                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                                        <Check size={18} className="text-white" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </button>
                                        <div>
                                            <span className={`text-lg font-medium transition-colors ${isCompletedToday ? 'text-white' : 'text-gray-300'}`}>
                                                {habit.text}
                                            </span>
                                            {streak > 0 && (
                                                <p className="text-xs text-text-dim flex items-center gap-1 mt-1">
                                                    <Flame size={12} className={isCompletedToday ? "text-orange-400" : "text-text-dim"} /> 
                                                    {streak} completions total
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={() => deleteHabit(habit.id)} className="p-2 opacity-0 group-hover:opacity-100 transition-all relative z-10">
                                        <Trash2 size={20} className="text-text-dim hover:text-red-400" />
                                    </button>

                                    {/* Completion background fill */}
                                    {isCompletedToday && (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent z-0"
                                        />
                                    )}
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default HabitTracker;