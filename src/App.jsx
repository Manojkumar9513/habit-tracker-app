import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, subDays } from 'date-fns';
import { Activity, Target, Trophy, Flame } from 'lucide-react';
import Sidebar from './components/Sidebar';
import HabitTracker from './components/HabitTracker';
import TypingModule from './components/TypingModule';
import SavingsTracker from './components/SavingsTracker';
import AIModule from './components/AIModule';
import EventsCalendar from './components/EventsCalendar';
import DigitalBuddy from './components/DigitalBuddy';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const Dashboard = () => {
    const [habits, setHabits] = useState([]);
    const [savings, setSavings] = useState([]);

    useEffect(() => {
        const unsubscribeHabits = onSnapshot(collection(db, 'habits'), (snapshot) => {
            setHabits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => console.log("Habits fetch error:", error));
        
        const unsubscribeSavings = onSnapshot(collection(db, 'savings_goals'), (snapshot) => {
            setSavings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => console.log("Savings fetch error:", error));

        return () => {
            unsubscribeHabits();
            unsubscribeSavings();
        };
    }, []);

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    // Habits Analytics
    const totalHabits = habits.length;
    const completedToday = habits.filter(h => (h.completedDates || []).includes(todayStr)).length;
    const habitProgress = totalHabits === 0 ? 0 : Math.round((completedToday / totalHabits) * 100);

    // Savings Analytics
    const totalSaved = savings.reduce((acc, curr) => acc + (curr.current || 0), 0);
    const totalTarget = savings.reduce((acc, curr) => acc + (curr.target || 0), 0);
    const savingsProgress = totalTarget === 0 ? 0 : Math.round((totalSaved / totalTarget) * 100);

    // 7-Day Activity Chart Data
    const activityData = Array.from({ length: 7 }).map((_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const count = habits.filter(h => (h.completedDates || []).includes(dateStr)).length;
        return {
            name: format(date, 'EEE'), // Mon, Tue, etc.
            completed: count,
            date: dateStr
        };
    });

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            {/* Header Banner */}
            <div className="p-10 glass-panel border border-white/5 relative overflow-hidden rounded-[2rem]">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/20 rounded-full blur-[100px] -z-10"></div>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#020203] to-transparent -z-10"></div>
                
                <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
                    Welcome back, <span className="premium-gradient">Manoj</span>
                </h1>
                <p className="text-gray-400 text-lg max-w-lg">Here's your productivity overview. Let's make today count.</p>
                
                <div className="mt-10 grid grid-cols-3 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:border-accent/30 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <Activity className="text-green-400" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-text-dim uppercase tracking-wider">Today's Habits</p>
                            <h3 className="text-2xl font-bold text-white">{completedToday} / {totalHabits}</h3>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:border-accent/30 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Target className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-text-dim uppercase tracking-wider">Total Saved</p>
                            <h3 className="text-2xl font-bold text-white">₹{totalSaved.toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:border-accent/30 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                            <Flame className="text-accent" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-text-dim uppercase tracking-wider">Current Streak</p>
                            <h3 className="text-2xl font-bold text-white">{completedToday > 0 ? 'Active' : 'Pending'}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* 7-Day Habit Activity */}
                <div className="p-8 glass-panel border border-white/5 rounded-[2rem] flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold text-white">7-Day Activity</h3>
                        <div className="px-3 py-1 bg-white/5 rounded-full text-xs text-text-dim border border-white/10">Last 7 Days</div>
                    </div>
                    <div className="flex-1 min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activityData}>
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    contentStyle={{ backgroundColor: '#0a0a0c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    labelStyle={{ color: '#888' }}
                                />
                                <XAxis dataKey="name" stroke="#555" axisLine={false} tickLine={false} />
                                <Bar dataKey="completed" radius={[6, 6, 6, 6]}>
                                    {activityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.date === todayStr ? '#8b5cf6' : '#8b5cf680'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Progress Overview */}
                <div className="space-y-8">
                    {/* Habit Progress Ring Equivalent */}
                    <div className="p-8 glass-panel border border-white/5 rounded-[2rem]">
                        <h3 className="text-xl font-bold text-white mb-6">Daily Completion</h3>
                        <div className="relative pt-2">
                            <div className="flex mb-2 items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-accent bg-accent/20">
                                        Progress
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xl font-bold inline-block text-white">
                                        {habitProgress}%
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-white/10 relative">
                                <div style={{ width: `${habitProgress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-accent transition-all duration-1000 ease-out relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
                                </div>
                            </div>
                            <p className="text-sm text-text-dim text-center mt-4">
                                {habitProgress === 100 ? "Perfect day! All habits complete." : habitProgress > 50 ? "Over halfway there, keep pushing!" : "Start checking off your habits."}
                            </p>
                        </div>
                    </div>

                    {/* Savings Progress */}
                    <div className="p-8 glass-panel border border-white/5 rounded-[2rem]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Savings Target</h3>
                            <Trophy className={savingsProgress >= 100 ? "text-yellow-400" : "text-text-dim"} size={20} />
                        </div>
                        <div className="relative pt-2">
                            <div className="flex mb-2 items-center justify-between">
                                <span className="text-text-dim text-sm">₹{totalSaved.toLocaleString()}</span>
                                <span className="text-text-dim text-sm">₹{totalTarget.toLocaleString()}</span>
                            </div>
                            <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-white/10 relative">
                                <div style={{ width: `${savingsProgress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-1000 ease-out relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
                                </div>
                            </div>
                            <p className="text-center font-bold text-blue-400 mt-2">{savingsProgress}% to Goal</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

function App() {
  return (
    <Router>
      <div className="flex bg-[#020203] min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/habits" element={<HabitTracker />} />
            <Route path="/savings" element={<SavingsTracker />} />
            <Route path="/events" element={<EventsCalendar />} />
            <Route path="/typing" element={<TypingModule />} />
            <Route path="/ai" element={<AIModule />} />
            <Route path="/buddy" element={<DigitalBuddy />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;