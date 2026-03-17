import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Star, BarChart2 } from 'lucide-react';

const CATEGORY_COLORS = [
    { bar: 'from-indigo-500 to-violet-500', glow: 'shadow-indigo-500/30' },
    { bar: 'from-sky-500 to-cyan-400', glow: 'shadow-sky-500/30' },
    { bar: 'from-emerald-500 to-teal-400', glow: 'shadow-emerald-500/30' },
    { bar: 'from-amber-500 to-orange-400', glow: 'shadow-amber-500/30' },
    { bar: 'from-rose-500 to-pink-400', glow: 'shadow-rose-500/30' },
    { bar: 'from-purple-500 to-fuchsia-400', glow: 'shadow-purple-500/30' },
    { bar: 'from-lime-500 to-green-400', glow: 'shadow-lime-500/30' },
];

const GlobalStats = ({ categoryStats, totalWords, totalLearned }) => {
    if (!categoryStats || categoryStats.length === 0) return null;

    const globalPct = totalWords > 0 ? (totalLearned / totalWords) * 100 : 0;

    return (
        <motion.section
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mt-10 mb-6"
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-5">
                <BarChart2 size={18} className="text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Genel İlerleme
                </h3>
            </div>

            {/* Top totals row */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="dark-glass rounded-2xl px-5 py-4 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <BookOpen size={15} className="text-sky-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Toplam Kelime</span>
                    </div>
                    <span className="text-3xl font-black text-white">{totalWords.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500">tüm kategoriler</span>
                </div>
                <div className="dark-glass rounded-2xl px-5 py-4 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Star size={15} className="text-yellow-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Öğrenilen</span>
                    </div>
                    <span className="text-3xl font-black text-white">{totalLearned.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500">
                        {globalPct.toFixed(1)}% tamamlandı
                    </span>
                </div>
            </div>

            {/* Global mega-bar */}
            <div className="mb-6">
                <div className="relative h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${globalPct}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 via-violet-500 to-pink-500 rounded-full"
                    />
                </div>
                <div className="flex justify-between mt-1.5 px-0.5">
                    <span className="text-[10px] text-indigo-400 font-bold">%{globalPct.toFixed(1)} Tamamlandı</span>
                    <span className="text-[10px] text-slate-500 font-bold">{totalLearned} / {totalWords}</span>
                </div>
            </div>

            {/* Per-category bars */}
            <div className="dark-glass rounded-3xl p-5 flex flex-col gap-4">
                {categoryStats.map((cat, i) => {
                    const pct = cat.total > 0 ? (cat.learned / cat.total) * 100 : 0;
                    const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                    return (
                        <div key={cat.id}>
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-xs font-semibold text-slate-300">{cat.name}</span>
                                <span className="text-[10px] font-bold text-slate-500">
                                    {cat.learned} / {cat.total}
                                    {cat.total > 0 && (
                                        <span className="ml-1.5 text-slate-600">%{pct.toFixed(0)}</span>
                                    )}
                                </span>
                            </div>
                            <div className="relative h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.9, ease: 'easeOut', delay: i * 0.07 }}
                                    className={`absolute top-0 left-0 h-full bg-gradient-to-r ${color.bar} rounded-full shadow-sm ${color.glow}`}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.section>
    );
};

export default GlobalStats;
