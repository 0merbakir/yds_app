import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, RotateCcw } from 'lucide-react';

const Flashcard = ({ word, onEvaluate }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [shake, setShake] = useState(false);
    const [exitDirection, setExitDirection] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        setIsFlipped(false);
        setExitDirection(null);
        setShake(false);
        setIsProcessing(false);
    }, [word]);

    const handleFlip = () => {
        if (isProcessing) return;
        setIsFlipped(!isFlipped);
    };

    const handleChoice = (isCorrect) => {
        if (isProcessing) return;
        setIsProcessing(true);

        if (!isCorrect) {
            setShake(true);
            setTimeout(() => {
                setShake(false);
                onEvaluate(false);
            }, 500);
        } else {
            setExitDirection('up');
            setTimeout(() => {
                onEvaluate(true);
            }, 600);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isProcessing) return;

            if (e.code === 'Space') {
                e.preventDefault();
                handleFlip();
            } else if (isFlipped) {
                if (e.code === 'ArrowRight') {
                    handleChoice(true);
                } else if (e.code === 'ArrowLeft') {
                    handleChoice(false);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFlipped, isProcessing, word]);

    return (
        <div className="relative w-full max-w-sm aspect-[3/4] perspective-1000">
            <motion.div
                animate={{
                    rotateY: isFlipped ? 180 : 0,
                    x: shake ? [-10, 10, -10, 10, 0] : 0,
                    y: exitDirection === 'up' ? -1000 : 0,
                    opacity: exitDirection === 'up' ? 0 : 1
                }}
                transition={{
                    duration: 0.6,
                    rotateY: { type: 'spring', stiffness: 260, damping: 20 },
                    x: { duration: 0.4 }
                }}
                style={{ transformStyle: 'preserve-3d' }}
                className="w-full h-full cursor-pointer relative"
                onClick={handleFlip}
            >
                {/* Front */}
                <div className="absolute inset-0 w-full h-full dark-glass rounded-3xl p-8 flex flex-col items-center justify-center backface-hidden shadow-2xl">
                    <span className="text-slate-500 text-sm font-medium mb-4 tracking-widest uppercase">Target Word</span>
                    <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent italic">
                        {word.word}
                    </h1>
                    <div className="text-center">
                        <p className="text-slate-400 leading-relaxed italic border-t border-slate-800 pt-6">
                            "{word.sentence}"
                        </p>
                    </div>
                    <p className="mt-8 text-xs text-slate-600 animate-pulse">Click or Space to Flip</p>
                </div>

                {/* Back */}
                <div className="absolute inset-0 w-full h-full dark-glass rounded-3xl p-8 flex flex-col items-center justify-center backface-hidden shadow-2xl [transform:rotateY(180deg)] bg-indigo-950/20">
                    <span className="text-indigo-400 text-sm font-medium mb-4 tracking-widest uppercase">Meaning</span>
                    <h2 className="text-3xl font-bold mb-6 text-center text-white">
                        {word.meaning}
                    </h2>
                    <div className="flex gap-4 w-full mt-auto" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => handleChoice(false)}
                            className="flex-1 flex items-center justify-center gap-2 py-4 bg-red-900/20 hover:bg-red-900/40 border border-red-900/30 text-red-400 rounded-xl transition-all"
                            title="I Don't Know (Left Arrow)"
                        >
                            <X size={20} /> I Don't Know
                        </button>
                        <button
                            onClick={() => handleChoice(true)}
                            className="flex-1 flex items-center justify-center gap-2 py-4 bg-green-900/20 hover:bg-green-900/40 border border-green-900/30 text-green-400 rounded-xl transition-all font-bold"
                            title="I Know (Right Arrow)"
                        >
                            <Check size={20} /> I Know
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Persistence Info */}
            <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-2">
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${i < (word.streak || 0) ? 'bg-indigo-500 scale-110' : 'bg-slate-800'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default Flashcard;
