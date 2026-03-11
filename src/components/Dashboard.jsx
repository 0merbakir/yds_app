import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

const Dashboard = ({ masteredCount, totalCount, progress }) => {
    return (
        <header className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-sm font-medium text-indigo-400 tracking-widest uppercase mb-2">YDS Word Master</h1>
                    <h2 className="text-4xl font-extrabold tracking-tight">
                        Welcome Emperor, <br />
                        <span className="text-slate-400 font-normal italic text-2xl">how many words will we conquer today?</span>
                    </h2>
                </div>

                <div className="text-right">
                    <div className="flex items-center gap-3 justify-end mb-1">
                        <Trophy className="text-yellow-500 w-6 h-6" />
                        <span className="text-5xl font-black text-white">{masteredCount}</span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium tracking-wider uppercase">Mastered Words</p>
                </div>
            </div>

            <div className="relative h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-400 rounded-full"
                />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                <span>0%</span>
                <span>{Math.round(progress)}% Complete ({masteredCount}/{totalCount})</span>
                <span>100%</span>
            </div>
        </header>
    );
};

export default Dashboard;
