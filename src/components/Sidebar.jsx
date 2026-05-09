import React from 'react';
import { LayoutDashboard, CheckCircle, Wallet, Keyboard, Mic, CalendarDays } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
    const links = [
        { name: 'Overview', path: '/', icon: <LayoutDashboard size={20} /> },
        { name: 'Habits', path: '/habits', icon: <CheckCircle size={20} /> },
        { name: 'Savings', path: '/savings', icon: <Wallet size={20} /> },
        { name: 'Events', path: '/events', icon: <CalendarDays size={20} /> },
        { name: 'Typing', path: '/typing', icon: <Keyboard size={20} /> },
        { name: 'AI Voice', path: '/ai', icon: <Mic size={20} /> },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 glass-panel m-4 border-r-0 flex flex-col p-6">
            <h2 className="premium-gradient text-2xl font-bold mb-10 px-2">NexTrack</h2>
            <nav className="flex flex-col gap-2">
                {links.map((link) => (
                    <NavLink
                        key={link.name}
                        to={link.path}
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(139,92,246,0.2)]' : 'text-[#94a3b8] hover:bg-white/5 hover:text-white'
                            }`
                        }
                    >
                        {link.icon}
                        <span className="font-medium">{link.name}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;