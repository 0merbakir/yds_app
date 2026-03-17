import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Plus, Trophy, Info, Music, Coffee, Wind, Speaker } from 'lucide-react';
import Flashcard from './components/Flashcard';
import WordManager from './components/WordManager';
import Dashboard from './components/Dashboard';
import GlobalStats from './components/GlobalStats';
import {
  loadStreaks,
  saveStreaks as dbSaveStreaks,
  clearStreaks,
  loadAllStreaks,
  migrateFromLocalStorage,
} from './db';

const AMBIENCES = [
  { id: 'focus', name: 'Odak', icon: Music, color: 'text-indigo-400', activeBg: 'bg-indigo-500/20', activeBorder: 'border-indigo-500/50', src: '/focus.mp3' },
  { id: 'nature', name: 'Doğa', icon: Wind, color: 'text-emerald-400', activeBg: 'bg-emerald-500/20', activeBorder: 'border-emerald-500/50', src: '/nature.mp3' },
  { id: 'cafe', name: 'Atmosfer', icon: Coffee, color: 'text-amber-400', activeBg: 'bg-amber-500/20', activeBorder: 'border-amber-500/50', src: '/atmosphare.mp3' },
];

const CATEGORIES = [
  { id: 'verbs', name: 'Fiiller', file: '/yds_verbs.json' },
  { id: 'nouns', name: 'İsimler', file: '/yds_nouns.json' },
  { id: 'adjectives', name: 'Sıfatlar', file: '/yds_adjectives.json' },
  { id: 'adverbs', name: 'Zarflar', file: '/yds_adverbs.json' },
  { id: 'conjunctions', name: 'Bağlaçlar', file: '/yds_conjunctions.json' },
  { id: 'phrasal_verbs', name: 'Deyimsel Fiiller', file: '/yds_phrasal_verbs.json' },
  { id: 'prepositions', name: 'Edatlar', file: '/yds_prepositions.json' },
];

const App = () => {
  const [currentCategory, setCurrentCategory] = useState(() => {
    return localStorage.getItem('yds_current_category') || 'verbs';
  });

  const [words, setWords] = useState([]);

  const [currentWord, setCurrentWord] = useState(null);
  const [showManager, setShowManager] = useState(false);
  const [showAmbience, setShowAmbience] = useState(false);
  const [activeAmbience, setActiveAmbience] = useState(() => {
    return localStorage.getItem('yds_active_ambience') || null;
  });
  const [activeSessionIds, setActiveSessionIds] = useState(() => {
    const saved = localStorage.getItem(`yds_active_session_${currentCategory}`);
    return saved ? JSON.parse(saved) : [];
  });

  const audioRefs = useRef({});

  // Sync category
  useEffect(() => {
    localStorage.setItem('yds_current_category', currentCategory);
  }, [currentCategory]);

  // One-time migration from localStorage → IndexedDB on first mount
  useEffect(() => {
    migrateFromLocalStorage(CATEGORIES.map(c => c.id));
  }, []);

  // Load category: always fetch from JSON, restore saved streaks from IndexedDB
  useEffect(() => {
    const categoryFile = CATEGORIES.find(c => c.id === currentCategory)?.file;
    if (!categoryFile) return;

    // Reset immediately so chart updates at once
    setWords([]);
    setCurrentWord(null);

    const loadCategory = async () => {
      try {
        const res = await fetch(categoryFile);
        const freshData = await res.json();
        const streakMap = await loadStreaks(currentCategory);
        const merged = freshData.map(w => ({
          ...w,
          streak: streakMap[w.word] || 0,
        }));
        setWords(merged);
        const savedSession = localStorage.getItem(`yds_active_session_${currentCategory}`);
        setActiveSessionIds(savedSession ? JSON.parse(savedSession) : []);
      } catch (err) {
        console.error('Error loading category:', err);
      }
    };
    loadCategory();
  }, [currentCategory]);


  // Save streaks to IndexedDB (words always come from JSON)
  const saveStreaks = (updatedWords) => {
    const streakMap = {};
    updatedWords.forEach(w => { if (w.streak) streakMap[w.word] = w.streak; });
    dbSaveStreaks(currentCategory, streakMap);
  };


  useEffect(() => {
    localStorage.setItem(`yds_active_session_${currentCategory}`, JSON.stringify(activeSessionIds));
  }, [activeSessionIds, currentCategory]);

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
    const unlearned = words.filter(w => (w.streak || 0) < 1);
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

  const handleResetWord = (wordValue) => {
    const updatedWords = words.map(w =>
      w.word === wordValue ? { ...w, streak: 0 } : w
    );
    setWords(updatedWords);
    saveStreaks(updatedWords);
  };

  const handleResetCategory = () => {
    if (window.confirm(`Kategoriyi sıfırlamak istediğinize emin misiniz? Tüm ilerlemeniz silinecektir.`)) {
      const categoryFile = CATEGORIES.find(c => c.id === currentCategory)?.file;
      if (categoryFile) {
        fetch(categoryFile)
          .then(res => res.json())
          .then(async (data) => {
            setWords(data);
            await clearStreaks(currentCategory);
            setActiveSessionIds([]);
          })
          .catch(err => console.error('Error resetting category:', err));
      }
    }
  };

  const handleEvaluation = (isCorrect) => {
    if (!currentWord) return;

    const updatedWords = words.map(w => {
      if (w.word === currentWord.word) {
        const newStreak = isCorrect ? (w.streak || 0) + 1 : 0;
        if (newStreak === 1) {
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
    saveStreaks(updatedWords);
    selectNewWord();
  };

  useEffect(() => {
    if (!currentWord && words.length > 0) {
      selectNewWord();
    }
  }, [words, currentWord, selectNewWord]);

  const masteredCount = words.filter(w => (w.streak || 0) >= 1).length;

  // Global stats: load all categories from JSON + localStorage
  const [globalStats, setGlobalStats] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const loadAll = async () => {
      const allStreakMaps = await loadAllStreaks(CATEGORIES.map(c => c.id));
      const results = await Promise.all(
        CATEGORIES.map(async (cat) => {
          try {
            const res = await fetch(cat.file);
            const data = await res.json();
            const streakMap = allStreakMaps[cat.id] || {};
            const learned = data.filter(w => (streakMap[w.word] || 0) >= 1).length;
            return { id: cat.id, name: cat.name, total: data.length, learned };
          } catch {
            return { id: cat.id, name: cat.name, total: 0, learned: 0 };
          }
        })
      );
      if (!cancelled) setGlobalStats(results);
    };
    loadAll();
    return () => { cancelled = true; };
    // Re-run every time user evaluates a word (words state changes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

  const totalWords = globalStats.reduce((s, c) => s + c.total, 0);
  const totalLearned = globalStats.reduce((s, c) => s + c.learned, 0);

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

      {/* Category Selector - Top Horizontal Scroll */}
      <div className="flex overflow-x-auto gap-2 py-4 mb-2 no-scrollbar scroll-smooth">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCurrentCategory(cat.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border ${currentCategory === cat.id
              ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Ambience Controls - Top Right Toggle & horizontal menu */}
      <div className="fixed top-6 right-6 z-50 flex flex-col items-end gap-2">
        <button
          onClick={() => setShowAmbience(!showAmbience)}
          className={`p-3 rounded-2xl transition-all shadow-2xl border ${activeAmbience || showAmbience
            ? 'bg-indigo-500 border-indigo-400 text-white'
            : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-200'
            }`}
          title="Çalışma Atmosferi"
        >
          <Speaker size={20} className={activeAmbience ? 'animate-pulse' : ''} />
        </button>

        <AnimatePresence>
          {showAmbience && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-2 shadow-2xl flex gap-1"
            >
              {AMBIENCES.map(amb => {
                const Icon = amb.icon;
                const isActive = activeAmbience === amb.id;
                return (
                  <button
                    key={amb.id}
                    onClick={() => toggleAmbience(amb.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 min-w-[64px] rounded-2xl transition-all duration-300 border ${isActive
                      ? `${amb.activeBg} ${amb.activeBorder} ${amb.color} scale-105 shadow-lg`
                      : 'bg-slate-950/50 border-transparent text-slate-500 hover:text-slate-300'
                      }`}
                  >
                    <Icon size={18} className={isActive ? 'animate-pulse' : ''} />
                    <span className="text-[9px] font-bold uppercase tracking-tight">{amb.name}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dashboard
        masteredCount={masteredCount}
        totalCount={words.length}
        progress={(masteredCount / words.length) * 100 || 0}
        categoryName={CATEGORIES.find(c => c.id === currentCategory)?.name || ''}
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
              <h2 className="text-2xl font-bold mb-4">Henüz kelime yok!</h2>
              <p className="text-slate-400 mb-8">
                Bu kategori için kelime listeniz boş görünüyor.
              </p>
              <button
                onClick={() => setShowManager(true)}
                className="btn-primary flex items-center gap-2 mx-auto"
              >
                <Plus size={20} /> Kelime Ekle
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
                <h2 className="text-3xl font-bold mb-2">Harika!</h2>
                <p className="text-slate-400">Bu kategorideki tüm kelimeleri fethettin.</p>
                <button
                  onClick={() => setShowManager(true)}
                  className="mt-6 text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Daha fazla kelime ekle
                </button>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </main>

      <GlobalStats
        categoryStats={globalStats}
        totalWords={totalWords}
        totalLearned={totalLearned}
      />

      <div className="mt-auto pt-4 pb-2 flex flex-col items-center gap-4">
        <button
          onClick={() => setShowManager(!showManager)}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-slate-400 hover:text-slate-100 font-bold"
        >
          {showManager ? 'Kapat' : 'Kelimeleri Yönet'}
        </button>
      </div>

      <AnimatePresence>
        {showManager && (
          <WordManager
            words={words}
            setWords={setWords}
            onResetWord={handleResetWord}
            onResetCategory={handleResetCategory}
            onClose={() => setShowManager(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
