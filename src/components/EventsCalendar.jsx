import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval,
    startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday, addMonths, subMonths
} from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Plus, X, Trash2, Clock } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';

const EVENT_COLORS = [
    { label: 'Purple', value: '#8b5cf6' },
    { label: 'Blue', value: '#3b82f6' },
    { label: 'Green', value: '#10b981' },
    { label: 'Orange', value: '#f59e0b' },
    { label: 'Pink', value: '#ec4899' },
    { label: 'Red', value: '#ef4444' },
];

const EventsCalendar = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', description: '', color: '#8b5cf6' });
    const [selectedDayEvents, setSelectedDayEvents] = useState([]);

    // Firestore listener
    useEffect(() => {
        const eventsRef = collection(db, 'events');
        const unsubscribe = onSnapshot(eventsRef, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setEvents(data);
            setIsLoading(false);
        }, (err) => {
            console.error('Events fetch error:', err);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Update right-panel events when selectedDate or events change
    useEffect(() => {
        if (!selectedDate) return;
        const dayStr = format(selectedDate, 'yyyy-MM-dd');
        setSelectedDayEvents(events.filter(e => e.date === dayStr));
    }, [selectedDate, events]);

    // Build calendar grid days
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

    const getEventsForDay = (day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        return events.filter(e => e.date === dayStr);
    };

    const handleDayClick = (day) => {
        setSelectedDate(day);
        setShowForm(false);
        setNewEvent({ title: '', description: '', color: '#8b5cf6' });
    };

    const handleAddEvent = async (e) => {
        e.preventDefault();
        if (!newEvent.title.trim() || !selectedDate) return;
        try {
            await addDoc(collection(db, 'events'), {
                title: newEvent.title,
                description: newEvent.description,
                color: newEvent.color,
                date: format(selectedDate, 'yyyy-MM-dd'),
                createdAt: new Date().toISOString(),
            });
            setNewEvent({ title: '', description: '', color: '#8b5cf6' });
            setShowForm(false);
        } catch (err) {
            console.error('Error adding event:', err);
            alert('Could not save event. Check Firebase configuration.');
        }
    };

    const handleDeleteEvent = async (id) => {
        try {
            await deleteDoc(doc(db, 'events', id));
        } catch (err) {
            console.error('Error deleting event:', err);
        }
    };

    const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div className="max-w-6xl mx-auto mt-10 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-accent/20 rounded-2xl">
                    <Calendar className="text-accent" size={28} />
                </div>
                <h2 className="text-3xl font-bold premium-gradient">Events Calendar</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar Grid */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-3xl">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <h3 className="text-xl font-bold text-white">
                            {format(currentMonth, 'MMMM yyyy')}
                        </h3>
                        <button
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 mb-2">
                        {WEEKDAYS.map(day => (
                            <div key={day} className="text-center text-xs text-text-dim uppercase tracking-wider py-2 font-medium">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calDays.map((day) => {
                            const dayEvents = getEventsForDay(day);
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isTodayDay = isToday(day);
                            const isSelected = selectedDate && isSameDay(day, selectedDate);

                            return (
                                <motion.button
                                    key={day.toISOString()}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDayClick(day)}
                                    className={`
                                        relative min-h-[72px] p-2 rounded-xl flex flex-col items-center transition-all text-left
                                        ${!isCurrentMonth ? 'opacity-25' : ''}
                                        ${isSelected ? 'bg-accent/30 border border-accent/60 shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'bg-white/5 hover:bg-white/10 border border-white/5'}
                                        ${isTodayDay && !isSelected ? 'border-accent/30' : ''}
                                    `}
                                >
                                    <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full
                                        ${isTodayDay ? 'bg-accent text-white' : isSelected ? 'text-white' : 'text-gray-300'}
                                    `}>
                                        {format(day, 'd')}
                                    </span>
                                    {/* Event dots */}
                                    <div className="flex flex-wrap gap-1 mt-1 justify-center">
                                        {dayEvents.slice(0, 3).map((ev) => (
                                            <span
                                                key={ev.id}
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: ev.color }}
                                                title={ev.title}
                                            />
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <span className="text-[9px] text-text-dim">+{dayEvents.length - 3}</span>
                                        )}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>

                    {isLoading && (
                        <p className="text-center text-text-dim mt-4 text-sm">Loading events...</p>
                    )}
                </div>

                {/* Right Panel — Selected Day */}
                <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4">
                    {selectedDate ? (
                        <>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-text-dim text-xs uppercase tracking-wider mb-1">Selected Date</p>
                                    <h4 className="text-xl font-bold text-white">
                                        {format(selectedDate, 'EEE, d MMM yyyy')}
                                    </h4>
                                </div>
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="p-2 bg-accent/20 rounded-xl hover:bg-accent/40 transition-all"
                                    title="Add event"
                                >
                                    <Plus className="text-accent" size={20} />
                                </button>
                            </div>

                            {/* Add Event Form */}
                            <AnimatePresence>
                                {showForm && (
                                    <motion.form
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        onSubmit={handleAddEvent}
                                        className="space-y-3 overflow-hidden"
                                    >
                                        <input
                                            type="text"
                                            value={newEvent.title}
                                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                            placeholder="Event title *"
                                            autoFocus
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-accent/50 transition-all"
                                        />
                                        <textarea
                                            value={newEvent.description}
                                            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                            placeholder="Notes / description (optional)"
                                            rows={2}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-accent/50 transition-all resize-none"
                                        />
                                        {/* Color Picker */}
                                        <div>
                                            <p className="text-xs text-text-dim mb-2 uppercase tracking-wider">Color</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {EVENT_COLORS.map(c => (
                                                    <button
                                                        key={c.value}
                                                        type="button"
                                                        onClick={() => setNewEvent({ ...newEvent, color: c.value })}
                                                        title={c.label}
                                                        className={`w-7 h-7 rounded-full transition-all ${newEvent.color === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent scale-110' : 'opacity-70 hover:opacity-100'}`}
                                                        style={{ backgroundColor: c.value }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button type="submit" className="flex-1 py-2 bg-accent rounded-xl text-white text-sm font-bold hover:scale-105 transition-all">
                                                Save Event
                                            </button>
                                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-white/5 rounded-xl text-text-dim text-sm hover:bg-white/10 transition-all">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>

                            {/* Events for selected day */}
                            <div className="flex-1 space-y-3 overflow-y-auto">
                                {selectedDayEvents.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Calendar size={32} className="text-text-dim mx-auto mb-2 opacity-30" />
                                        <p className="text-text-dim text-sm">No events. Click + to add one.</p>
                                    </div>
                                ) : (
                                    selectedDayEvents.map(ev => (
                                        <motion.div
                                            key={ev.id}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="p-3 rounded-xl border bg-white/5 group relative overflow-hidden"
                                            style={{ borderColor: ev.color + '40' }}
                                        >
                                            <div
                                                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                                                style={{ backgroundColor: ev.color }}
                                            />
                                            <div className="pl-3">
                                                <div className="flex items-start justify-between">
                                                    <p className="text-white font-semibold text-sm">{ev.title}</p>
                                                    <button
                                                        onClick={() => handleDeleteEvent(ev.id)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-400 text-text-dim"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                {ev.description && (
                                                    <p className="text-text-dim text-xs mt-1">{ev.description}</p>
                                                )}
                                                <div className="flex items-center gap-1 mt-1 text-text-dim text-xs">
                                                    <Clock size={10} />
                                                    <span>{ev.createdAt ? format(new Date(ev.createdAt), 'h:mm a') : ''}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <Calendar size={48} className="text-text-dim mb-4 opacity-30" />
                            <p className="text-text-dim text-sm">Click on a date to view or add events</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Upcoming Events Strip */}
            <div className="glass-panel p-6 rounded-3xl">
                <h3 className="text-lg font-bold text-white mb-4">Upcoming Events</h3>
                {events.length === 0 ? (
                    <p className="text-text-dim text-sm">No events scheduled yet.</p>
                ) : (
                    <div className="flex gap-3 flex-wrap">
                        {events
                            .filter(e => new Date(e.date) >= new Date(format(new Date(), 'yyyy-MM-dd')))
                            .sort((a, b) => a.date.localeCompare(b.date))
                            .slice(0, 8)
                            .map(ev => (
                                <div
                                    key={ev.id}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border"
                                    style={{ borderColor: ev.color + '50' }}
                                >
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                                    <div>
                                        <p className="text-white text-xs font-semibold">{ev.title}</p>
                                        <p className="text-text-dim text-xs">{format(new Date(ev.date + 'T00:00:00'), 'MMM d')}</p>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventsCalendar;
