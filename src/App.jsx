import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Plus, Trophy, Info, Music, Coffee, Wind, Speaker } from 'lucide-react';
import Flashcard from './components/Flashcard';
import WordManager from './components/WordManager';
import Dashboard from './components/Dashboard';

const AMBIENCES = [
  { id: 'focus', name: 'Focus', icon: Music, color: 'text-indigo-400', activeBg: 'bg-indigo-500/20', activeBorder: 'border-indigo-500/50', src: '/focus.mp3' },
  { id: 'nature', name: 'Nature', icon: Wind, color: 'text-emerald-400', activeBg: 'bg-emerald-500/20', activeBorder: 'border-emerald-500/50', src: '/nature.mp3' },
  { id: 'cafe', name: 'Atmosphere', icon: Coffee, color: 'text-amber-400', activeBg: 'bg-amber-500/20', activeBorder: 'border-amber-500/50', src: '/atmosphare.mp3' },
];

const App = () => {
  const [words, setWords] = useState(() => {
    const saved = localStorage.getItem('yds_words');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentWord, setCurrentWord] = useState(() => {
    const savedId = localStorage.getItem('yds_current_word_id');
    const savedWords = localStorage.getItem('yds_words');
    if (savedId && savedWords) {
      const parsedWords = JSON.parse(savedWords);
      return parsedWords.find(w => w.word === savedId && (w.streak || 0) < 3) || null;
    }
    return null;
  });
  const [showManager, setShowManager] = useState(false);
  const [activeAmbience, setActiveAmbience] = useState(() => {
    return localStorage.getItem('yds_active_ambience') || null;
  });
  const [activeSessionIds, setActiveSessionIds] = useState(() => {
    const saved = localStorage.getItem('yds_active_session');
    return saved ? JSON.parse(saved) : [];
  });

  const audioRefs = useRef({});

  useEffect(() => {
    localStorage.setItem('yds_words', JSON.stringify(words));
  }, [words]);

  useEffect(() => {
    localStorage.setItem('yds_active_session', JSON.stringify(activeSessionIds));
  }, [activeSessionIds]);

  useEffect(() => {
    if (currentWord) {
      localStorage.setItem('yds_current_word_id', currentWord.word);
    } else {
      localStorage.removeItem('yds_current_word_id');
    }
  }, [currentWord]);

  useEffect(() => {
    if (activeAmbience) {
      localStorage.setItem('yds_active_ambience', activeAmbience);
      Object.keys(audioRefs.current).forEach(id => {
        if (id === activeAmbience) {
          audioRefs.current[id]?.play().catch(e => console.log("Autoplay prevented:", e));
        } else {
          audioRefs.current[id]?.pause();
          if (audioRefs.current[id]) audioRefs.current[id].currentTime = 0;
        }
      });
    } else {
      localStorage.removeItem('yds_active_ambience');
      Object.values(audioRefs.current).forEach(audio => {
        audio?.pause();
        if (audio) audio.currentTime = 0;
      });
    }
  }, [activeAmbience]);

  const toggleAmbience = (id) => {
    setActiveAmbience(prev => prev === id ? null : id);
  };

  const replenishSession = useCallback((allUnlearned) => {
    const shuffled = [...allUnlearned].sort(() => 0.5 - Math.random());
    const newSession = shuffled.slice(0, 20).map(w => w.word);
    setActiveSessionIds(newSession);
    return newSession;
  }, []);

  const selectNewWord = useCallback(() => {
    const unlearned = words.filter(w => (w.streak || 0) < 3);
    if (unlearned.length === 0) {
      setCurrentWord(null);
      setActiveSessionIds([]);
      return;
    }

    let currentSession = activeSessionIds.filter(id =>
      unlearned.some(w => w.word === id)
    );

    if (currentSession.length === 0) {
      currentSession = replenishSession(unlearned);
    } else if (activeSessionIds.length !== currentSession.length) {
      setActiveSessionIds(currentSession);
    }

    const availableWords = unlearned.filter(w => currentSession.includes(w.word));

    if (availableWords.length === 0) {
      setCurrentWord(null);
      return;
    }

    let nextWord;
    if (currentWord && availableWords.some(w => w.word === currentWord.word)) {
      const currentIndex = availableWords.findIndex(w => w.word === currentWord.word);
      nextWord = availableWords[(currentIndex + 1) % availableWords.length];
    } else {
      nextWord = availableWords[0];
    }

    setCurrentWord(nextWord);
  }, [words, currentWord, activeSessionIds, replenishSession]);

  const handleEvaluation = (isCorrect) => {
    if (!currentWord) return;

    const updatedWords = words.map(w => {
      if (w.word === currentWord.word) {
        const newStreak = isCorrect ? (w.streak || 0) + 1 : 0;
        if (newStreak === 3) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#a855f7', '#ec4899']
          });
        }
        return { ...w, streak: newStreak };
      }
      return w;
    });
    setWords(updatedWords);
    selectNewWord();
  };

  useEffect(() => {
    if (!currentWord && words.length > 0) {
      selectNewWord();
    }
  }, [words, currentWord, selectNewWord]);

  const masteredCount = words.filter(w => (w.streak || 0) >= 3).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen flex flex-col relative">
      {AMBIENCES.map(amb => (
        <audio
          key={amb.id}
          ref={el => audioRefs.current[amb.id] = el}
          src={amb.src}
          loop
          onCanPlay={() => {
            if (activeAmbience === amb.id) audioRefs.current[amb.id]?.play().catch(() => { });
          }}
        />
      ))}

      {/* Ambience Controls - Bottom Left */}
      <div className="fixed bottom-32 left-8 z-40 hidden lg:flex flex-col gap-4">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 shadow-2xl">
          <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4 flex items-center gap-2">
            <Speaker size={12} /> Study Ambiences
          </h3>
          <div className="flex flex-col gap-3">
            {AMBIENCES.map(amb => {
              const Icon = amb.icon;
              const isActive = activeAmbience === amb.id;
              return (
                <button
                  key={amb.id}
                  onClick={() => toggleAmbience(amb.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 border ${isActive
                    ? `${amb.activeBg} ${amb.activeBorder} ${amb.color} scale-105 shadow-lg`
                    : 'bg-slate-950/50 border-transparent text-slate-500 hover:border-slate-800 hover:text-slate-300'
                    }`}
                  title={amb.name}
                >
                  <Icon size={20} className={isActive ? 'animate-pulse' : ''} />
                  <span className="text-xs font-medium">{amb.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Dashboard
        masteredCount={masteredCount}
        totalCount={words.length}
        progress={(masteredCount / words.length) * 100 || 0}
      />

      <main className="flex-1 flex flex-col items-center justify-center py-12">
        <AnimatePresence mode="wait">
          {words.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="dark-glass p-12 rounded-2xl text-center max-w-md"
            >
              <Info className="w-16 h-16 mx-auto mb-6 text-indigo-400" />
              <h2 className="text-2xl font-bold mb-4">No words yet!</h2>
              <p className="text-slate-400 mb-8">
                Add new words or upload a JSON file to begin.
              </p>
              <button
                onClick={() => setShowManager(true)}
                className="btn-primary flex items-center gap-2 mx-auto"
              >
                <Plus size={20} /> Add Word
              </button>
            </motion.div>
          ) : (
            currentWord ? (
              <Flashcard
                key={currentWord.word}
                word={currentWord}
                onEvaluate={handleEvaluation}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <Trophy className="w-20 h-20 mx-auto mb-4 text-yellow-500" />
                <h2 className="text-3xl font-bold mb-2">Excellent!</h2>
                <p className="text-slate-400">You've conquered all the words.</p>
                <button
                  onClick={() => setShowManager(true)}
                  className="mt-6 text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Add more words
                </button>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </main>

      <div className="mt-auto pt-8 flex flex-col items-center gap-4">
        <a
          href="/yds_master_list.json"
          download="yds_master_list.json"
          className="text-[10px] uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors font-bold flex items-center gap-2"
        >
          <Info size={12} /> Download YDS Master List (.json)
        </a>
        <button
          onClick={() => setShowManager(!showManager)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-slate-400 hover:text-slate-100"
        >
          {showManager ? 'Close' : 'Manage Words'}
        </button>
      </div>

      <AnimatePresence>
        {showManager && (
          <WordManager
            words={words}
            setWords={setWords}
            onClose={() => setShowManager(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
