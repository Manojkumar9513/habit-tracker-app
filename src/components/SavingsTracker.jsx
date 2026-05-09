import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Target, TrendingUp, Plus, X, IndianRupee, Edit2, Trash2, ShoppingBag, ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';

const SavingsTracker = () => {
    const [goals, setGoals] = useState([]);
    const [spends, setSpends] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isAdding, setIsAdding] = useState(false);
    const [newGoal, setNewGoal] = useState({ name: '', target: '' });

    // For updating progress
    const [activeEditId, setActiveEditId] = useState(null);
    const [editValues, setEditValues] = useState({ current: '', target: '' });

    // Spends
    const [isAddingSpend, setIsAddingSpend] = useState(false);
    const [newSpend, setNewSpend] = useState({ goalId: '', amount: '', reason: '' });
    const [showSpendsLog, setShowSpendsLog] = useState(true);

    // --- Firestore listeners ---
    useEffect(() => {
        const goalsRef = collection(db, 'savings_goals');
        const unsubscribeGoals = onSnapshot(goalsRef, (snapshot) => {
            const goalsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setGoals(goalsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching goals:", error);
            setIsLoading(false);
        });

        const spendsRef = collection(db, 'spends');
        const unsubscribeSpends = onSnapshot(spendsRef, (snapshot) => {
            const data = snapshot.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setSpends(data);
        }, (error) => {
            console.error("Error fetching spends:", error);
        });

        return () => {
            unsubscribeGoals();
            unsubscribeSpends();
        };
    }, []);

    // --- Goal handlers ---
    const handleAddGoal = async (e) => {
        e.preventDefault();
        if (!newGoal.name || !newGoal.target) return;
        const colors = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ec4899'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        try {
            await addDoc(collection(db, 'savings_goals'), {
                name: newGoal.name,
                current: 0,
                target: parseInt(newGoal.target),
                color: randomColor,
                createdAt: new Date().toISOString(),
            });
            setNewGoal({ name: '', target: '' });
            setIsAdding(false);
        } catch (error) {
            console.error("Error adding goal:", error);
            alert("Firebase configuration might be missing or invalid.");
        }
    };

    const handleUpdateGoal = async (e, id) => {
        e.preventDefault();
        try {
            const goalRef = doc(db, 'savings_goals', id);
            await updateDoc(goalRef, {
                current: parseInt(editValues.current) || 0,
                target: parseInt(editValues.target) || 0,
            });
            setActiveEditId(null);
        } catch (error) {
            console.error("Error updating goal:", error);
        }
    };

    const handleDeleteGoal = async (id) => {
        if (window.confirm("Are you sure you want to delete this goal?")) {
            try {
                await deleteDoc(doc(db, 'savings_goals', id));
            } catch (error) {
                console.error("Error deleting goal:", error);
            }
        }
    };

    // --- Spend handlers ---
    const handleAddSpend = async (e) => {
        e.preventDefault();
        if (!newSpend.goalId || !newSpend.amount || !newSpend.reason.trim()) return;
        const amount = parseInt(newSpend.amount);
        if (isNaN(amount) || amount <= 0) return;

        const selectedGoal = goals.find(g => g.id === newSpend.goalId);
        if (!selectedGoal) return;

        try {
            // 1. Save the spend record
            await addDoc(collection(db, 'spends'), {
                goalId: newSpend.goalId,
                goalName: selectedGoal.name,
                amount,
                reason: newSpend.reason,
                createdAt: new Date().toISOString(),
            });
            // 2. Deduct from the goal's current savings
            const newCurrent = Math.max((selectedGoal.current || 0) - amount, 0);
            await updateDoc(doc(db, 'savings_goals', newSpend.goalId), {
                current: newCurrent,
            });
            setNewSpend({ goalId: '', amount: '', reason: '' });
            setIsAddingSpend(false);
        } catch (error) {
            console.error("Error adding spend:", error);
            alert("Could not log the spend. Check Firebase configuration.");
        }
    };

    const handleDeleteSpend = async (spendId, goalId, amount) => {
        if (!window.confirm("Delete this spend entry? This will NOT restore the savings balance.")) return;
        try {
            await deleteDoc(doc(db, 'spends', spendId));
        } catch (error) {
            console.error("Error deleting spend:", error);
        }
    };

    const totalSaved = goals.reduce((acc, curr) => acc + (curr.current || 0), 0);
    const totalSpent = spends.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    if (isLoading) {
        return <div className="max-w-4xl mx-auto mt-10 p-8 glass-panel text-center text-gray-400">Loading savings goals...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto mt-10 space-y-6">
            {/* ── Savings Goals Panel ── */}
            <div className="p-8 glass-panel">
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-accent/20 rounded-2xl">
                            <Wallet className="text-accent" size={28} />
                        </div>
                        <h2 className="text-3xl font-bold premium-gradient">Savings & Goals</h2>
                    </div>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="p-2 bg-accent/20 rounded-full hover:bg-accent/40 transition-all"
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
                            className="mb-8 overflow-hidden"
                        >
                            <form onSubmit={handleAddGoal} className="flex gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl">
                                <input
                                    type="text"
                                    value={newGoal.name}
                                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                                    placeholder="Goal Name (e.g., Car Deposit)"
                                    autoFocus
                                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-accent/50 transition-all text-white"
                                />
                                <div className="relative w-48">
                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
                                    <input
                                        type="number"
                                        value={newGoal.target}
                                        onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                                        placeholder="Target"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-accent/50 transition-all text-white"
                                    />
                                </div>
                                <button type="submit" className="px-8 py-4 bg-accent rounded-2xl font-bold text-white hover:scale-105 transition-all">Create</button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid gap-8">
                    {goals.length === 0 ? (
                        <p className="text-center text-gray-400 py-8">No goals set yet. Click + to start tracking your savings!</p>
                    ) : (
                        goals.map((goal) => {
                            const percentage = Math.min(((goal.current || 0) / goal.target) * 100, 100);
                            const goalSpends = spends.filter(s => s.goalId === goal.id);

                            return (
                                <div key={goal.id} className="bg-white/5 p-6 rounded-3xl border border-white/5 group relative overflow-hidden">
                                    <div className="flex justify-between items-end mb-4 relative z-10">
                                        <div>
                                            <p className="text-text-dim text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
                                                {goal.name}
                                                <button onClick={() => handleDeleteGoal(goal.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-400">
                                                    <Trash2 size={14} />
                                                </button>
                                            </p>
                                            <h3 className="text-2xl font-bold text-white">
                                                ₹{(goal.current || 0).toLocaleString()} <span className="text-text-dim text-lg font-normal">/ ₹{goal.target.toLocaleString()}</span>
                                            </h3>
                                            {goalSpends.length > 0 && (
                                                <p className="text-xs text-red-400 mt-1">
                                                    ₹{goalSpends.reduce((a, s) => a + s.amount, 0).toLocaleString()} spent from this goal
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold" style={{ color: goal.color }}>{Math.round(percentage)}%</p>
                                        </div>
                                    </div>

                                    <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden relative z-10">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)] relative"
                                            style={{ backgroundColor: goal.color }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
                                        </motion.div>
                                    </div>

                                    {/* Edit Overlay */}
                                    <AnimatePresence>
                                        {activeEditId === goal.id ? (
                                            <motion.form
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                onSubmit={(e) => handleUpdateGoal(e, goal.id)}
                                                className="mt-6 flex gap-3 bg-black/40 p-4 rounded-2xl border border-white/5"
                                            >
                                                <div className="flex-1 space-y-2">
                                                    <label className="text-xs text-text-dim uppercase pl-1">Actual Savings</label>
                                                    <div className="relative">
                                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={14} />
                                                        <input
                                                            type="number"
                                                            value={editValues.current}
                                                            onChange={(e) => setEditValues({ ...editValues, current: e.target.value })}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-8 pr-4 text-white focus:outline-none focus:border-accent/50 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <label className="text-xs text-text-dim uppercase pl-1">Target Goal</label>
                                                    <div className="relative">
                                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={14} />
                                                        <input
                                                            type="number"
                                                            value={editValues.target}
                                                            onChange={(e) => setEditValues({ ...editValues, target: e.target.value })}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-8 pr-4 text-white focus:outline-none focus:border-accent/50 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col justify-end gap-2">
                                                    <button type="submit" className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl hover:bg-green-500/30 transition-all font-medium text-sm flex-1">Save</button>
                                                    <button type="button" onClick={() => setActiveEditId(null)} className="px-4 py-2 bg-white/5 text-text-dim rounded-xl hover:bg-white/10 transition-all text-sm flex-1">Cancel</button>
                                                </div>
                                            </motion.form>
                                        ) : (
                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                                                <button
                                                    onClick={() => {
                                                        setEditValues({ current: goal.current || 0, target: goal.target });
                                                        setActiveEditId(goal.id);
                                                    }}
                                                    className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all"
                                                >
                                                    <Edit2 size={16} /> Edit Values
                                                </button>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Summary Bar */}
                <div className="mt-10 grid grid-cols-2 gap-4">
                    <div className="p-6 rounded-3xl bg-gradient-to-r from-accent/20 to-transparent border border-accent/20 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <TrendingUp className="text-accent" />
                            <span className="text-white font-medium">Total Saved</span>
                        </div>
                        <span className="text-2xl font-bold text-green-400">₹{totalSaved.toLocaleString()}</span>
                    </div>
                    <div className="p-6 rounded-3xl bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <ArrowUpRight className="text-red-400" />
                            <span className="text-white font-medium">Total Spent</span>
                        </div>
                        <span className="text-2xl font-bold text-red-400">₹{totalSpent.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* ── Spends Log Panel ── */}
            <div className="p-8 glass-panel">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/20 rounded-2xl">
                            <ShoppingBag className="text-red-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Spends Log</h2>
                            <p className="text-text-dim text-xs mt-1">Track money spent from your savings</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setIsAddingSpend(!isAddingSpend); }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 rounded-xl hover:bg-red-500/30 transition-all text-red-400 text-sm font-medium"
                        >
                            {isAddingSpend ? <X size={16} /> : <Plus size={16} />}
                            {isAddingSpend ? 'Cancel' : 'Log Spend'}
                        </button>
                        <button
                            onClick={() => setShowSpendsLog(!showSpendsLog)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-dim transition-all"
                        >
                            {showSpendsLog ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                    </div>
                </div>

                {/* Add Spend Form */}
                <AnimatePresence>
                    {isAddingSpend && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 overflow-hidden"
                        >
                            <form onSubmit={handleAddSpend} className="p-6 bg-white/5 border border-red-500/20 rounded-3xl space-y-4">
                                <h3 className="text-white font-semibold text-sm uppercase tracking-wider">New Spend Entry</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Goal selector */}
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="text-xs text-text-dim uppercase tracking-wider mb-1 block pl-1">From Which Savings Goal?</label>
                                        <select
                                            value={newSpend.goalId}
                                            onChange={(e) => setNewSpend({ ...newSpend, goalId: e.target.value })}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-red-400/50 transition-all text-sm"
                                        >
                                            <option value="" className="bg-[#1a1a2e]">-- Select Goal --</option>
                                            {goals.map(g => (
                                                <option key={g.id} value={g.id} className="bg-[#1a1a2e]">
                                                    {g.name} (₹{(g.current || 0).toLocaleString()} saved)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* Amount */}
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="text-xs text-text-dim uppercase tracking-wider mb-1 block pl-1">Amount Spent (₹)</label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={16} />
                                            <input
                                                type="number"
                                                value={newSpend.amount}
                                                onChange={(e) => setNewSpend({ ...newSpend, amount: e.target.value })}
                                                placeholder="e.g. 500"
                                                required
                                                min="1"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-red-400/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                    {/* Reason */}
                                    <div className="col-span-2">
                                        <label className="text-xs text-text-dim uppercase tracking-wider mb-1 block pl-1">Reason / Note</label>
                                        <input
                                            type="text"
                                            value={newSpend.reason}
                                            onChange={(e) => setNewSpend({ ...newSpend, reason: e.target.value })}
                                            placeholder="e.g. Bought groceries, Emergency repair..."
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-red-400/50 transition-all"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl font-bold hover:bg-red-500/30 hover:scale-[1.01] transition-all"
                                >
                                    Log This Spend
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Spends List */}
                <AnimatePresence>
                    {showSpendsLog && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {spends.length === 0 ? (
                                <div className="text-center py-10">
                                    <ShoppingBag size={40} className="text-text-dim mx-auto mb-3 opacity-20" />
                                    <p className="text-text-dim text-sm">No spends logged yet. Click "Log Spend" to track your expenses.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {spends.map((spend) => {
                                        const goal = goals.find(g => g.id === spend.goalId);
                                        return (
                                            <motion.div
                                                key={spend.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-red-500/20 transition-all"
                                            >
                                                {/* Color dot from goal */}
                                                <div
                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: goal?.color || '#ef4444' }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-semibold text-sm truncate">{spend.reason}</p>
                                                    <p className="text-text-dim text-xs mt-0.5">
                                                        From: <span className="text-gray-400">{spend.goalName || 'Unknown Goal'}</span>
                                                        <span className="mx-2">·</span>
                                                        {spend.createdAt ? format(new Date(spend.createdAt), 'MMM d, yyyy • h:mm a') : ''}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    <span className="text-red-400 font-bold text-lg">-₹{spend.amount.toLocaleString()}</span>
                                                    <button
                                                        onClick={() => handleDeleteSpend(spend.id, spend.goalId, spend.amount)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-400 text-text-dim"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SavingsTracker;