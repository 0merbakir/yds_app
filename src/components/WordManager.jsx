import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Plus, Trash2, BookOpen, RotateCcw } from 'lucide-react';

const WordManager = ({ words, setWords, onResetWord, onResetCategory, onClose }) => {
    const [newWord, setNewWord] = useState({ word: '', meaning: '', sentence: '' });
    const [isDragging, setIsDragging] = useState(false);

    const handleAddWord = (e) => {
        e.preventDefault();
        if (!newWord.word || !newWord.meaning) return;

        // Check if word already exists
        if (words.some(w => w.word.toLowerCase() === newWord.word.toLowerCase())) {
            alert('Bu kelime zaten kasanızda mevcut!');
            return;
        }

        setWords([...words, { ...newWord, streak: 0, status: 'Learning' }]);
        setNewWord({ word: '', meaning: '', sentence: '' });
    };

    const handleDelete = (wordToDelete) => {
        setWords(words.filter(w => w.word !== wordToDelete));
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                if (Array.isArray(json)) {
                    const existingWords = new Set(words.map(w => w.word.toLowerCase()));
                    const newWords = json.filter(w => {
                        const isDuplicate = existingWords.has(w.word.toLowerCase());
                        if (isDuplicate) return false;
                        existingWords.add(w.word.toLowerCase());
                        return true;
                    });

                    setWords([...words, ...newWords.map(w => ({
                        ...w,
                        streak: w.streak || 0,
                        status: w.status || 'Learning'
                    }))]);
                }
            } catch (err) {
                alert('Geçersiz JSON dosyası!');
            }
        };
        reader.readAsText(file);
    };

    const learningWords = words.filter(w => (w.streak || 0) < 1);
    const masteredWords = words.filter(w => (w.streak || 0) >= 1);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <BookOpen className="text-indigo-400" />
                        Kelime Kasası ({words.length})
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onResetCategory}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-indigo-400 flex items-center gap-2 text-xs font-bold"
                            title="Kategoriyi Sıfırla ve Yenile"
                        >
                            <RotateCcw size={16} />
                            <span className="hidden sm:inline">Kategoriyi Yenile</span>
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Bulk Upload */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2 uppercase tracking-widest">Toplu Yükleme</label>
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setIsDragging(false);
                                const file = e.dataTransfer.files[0];
                                if (file) handleFileUpload({ target: { files: [file] } });
                            }}
                            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 hover:border-slate-700'
                                }`}
                        >
                            <Upload className="w-10 h-10 mx-auto mb-4 text-slate-500" />
                            <p className="text-slate-400 mb-4">JSON dosyasını buraya sürükleyin veya seçin</p>
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="json-upload"
                            />
                            <label
                                htmlFor="json-upload"
                                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors text-sm font-medium"
                            >
                                Dosya Seç
                            </label>
                        </div>
                    </div>

                    {/* Manual Entry */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2 uppercase tracking-widest">Yeni Kelime Ekle</label>
                        <form onSubmit={handleAddWord} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                placeholder="Kelime"
                                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={newWord.word}
                                onChange={e => setNewWord({ ...newWord, word: e.target.value })}
                            />
                            <input
                                placeholder="Anlamı"
                                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={newWord.meaning}
                                onChange={e => setNewWord({ ...newWord, meaning: e.target.value })}
                            />
                            <input
                                placeholder="Örnek Cümle"
                                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none md:col-span-2"
                                value={newWord.sentence}
                                onChange={e => setNewWord({ ...newWord, sentence: e.target.value })}
                            />
                            <button className="md:col-span-2 btn-primary flex items-center justify-center gap-2">
                                <Plus size={18} /> Ekle
                            </button>
                        </form>
                    </div>

                    {/* Categorized Lists */}
                    <div className="space-y-6">
                        {learningWords.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-indigo-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                                    Öğreniliyor ({learningWords.length})
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {learningWords.map((w, i) => (
                                        <WordRow key={w.word} w={w} onDelete={() => handleDelete(w.word)} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {masteredWords.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-green-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    Feshedilen Kelimeler ({masteredWords.length})
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {masteredWords.map((w, i) => (
                                        <WordRow
                                            key={w.word}
                                            w={w}
                                            onDelete={() => handleDelete(w.word)}
                                            onReset={() => onResetWord(w.word)}
                                            isMastered
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const WordRow = ({ w, onDelete, onReset, isMastered }) => (
    <div className={`flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-xl group hover:border-slate-700 transition-all ${isMastered ? 'opacity-60 hover:opacity-100' : ''}`}>
        <div className="flex-1">
            <span className={`font-bold ${isMastered ? 'text-green-400' : 'text-slate-100'}`}>{w.word}</span>
            <span className="mx-2 text-slate-600">→</span>
            <span className="text-slate-400">{w.meaning}</span>
            <div className="flex gap-1 mt-1">
                <div className={`w-8 h-1 rounded-full ${(w.streak || 0) >= 1 ? (isMastered ? 'bg-green-500' : 'bg-indigo-500') : 'bg-slate-800'}`} />
            </div>
        </div>
        <div className="flex items-center gap-1">
            {isMastered && (
                <button
                    onClick={onReset}
                    className="p-2 text-slate-600 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 text-xs font-bold"
                    title="Tekrar Öğren"
                >
                    <RotateCcw size={14} />
                    <span className="hidden sm:inline">Tekrar Öğren</span>
                </button>
            )}
            <button
                onClick={onDelete}
                className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                title="Sil"
            >
                <Trash2 size={16} />
            </button>
        </div>
    </div>
);

export default WordManager;
