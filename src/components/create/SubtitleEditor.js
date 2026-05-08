import React, { useState, useCallback } from 'react';
import styles from './SubtitleEditor.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Subtitles, Plus, Trash2, Wand2 } from 'lucide-react';

const FONTS = [
    { id: 'sans', name: 'Clean', family: "'Inter', sans-serif" },
    { id: 'serif', name: 'Classic', family: "'Georgia', serif" },
    { id: 'mono', name: 'Tech', family: "'Courier New', monospace" },
    { id: 'display', name: 'Bold', family: "'Impact', sans-serif" },
];

const COLORS = ['#ffffff','#000000','#f59e0b','#ef4444','#10b981','#3b82f6','#8b5cf6','#ec4899'];

const SubtitleEditor = ({ subtitles = [], onUpdateSubtitles, duration = 0 }) => {
    const [newText, setNewText] = useState('');
    const [font, setFont] = useState('sans');
    const [color, setColor] = useState('#ffffff');
    const [position, setPosition] = useState('bottom');
    const [isGenerating, setIsGenerating] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const addSubtitle = useCallback(() => {
        if (!newText.trim()) return;
        const start = subtitles.length > 0 ? subtitles[subtitles.length - 1].endTime : 0;
        const sub = {
            id: `sub_${Date.now()}`, text: newText.trim(),
            startTime: start, endTime: Math.min(start + 3, duration || 60),
            font, color, bgColor: 'rgba(0,0,0,0.6)', position, alignment: 'center', fontSize: 16
        };
        onUpdateSubtitles([...subtitles, sub]);
        setNewText('');
    }, [newText, subtitles, font, color, position, duration, onUpdateSubtitles]);

    const removeSubtitle = (id) => onUpdateSubtitles(subtitles.filter(s => s.id !== id));
    const updateSubtitle = (id, u) => onUpdateSubtitles(subtitles.map(s => s.id === id ? { ...s, ...u } : s));
    const fmt = (s) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

    const handleAutoGen = () => {
        setIsGenerating(true);
        setTimeout(() => {
            onUpdateSubtitles([...subtitles, {
                id: `sub_a_${Date.now()}`, text: 'Auto-generated subtitle', startTime: 0, endTime: 3,
                font, color, bgColor: 'rgba(0,0,0,0.6)', position: 'bottom', alignment: 'center', fontSize: 16
            }]);
            setIsGenerating(false);
        }, 2000);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}><Subtitles size={16}/><span>Subtitles</span><span className={styles.count}>{subtitles.length}</span></div>

            <motion.button className={styles.autoBtn} onClick={handleAutoGen} disabled={isGenerating} whileTap={{scale:0.98}}>
                <Wand2 size={16} className={isGenerating ? styles.spin : ''}/><span>{isGenerating ? 'Generating...' : 'Auto-Generate from Speech'}</span>
            </motion.button>

            <div className={styles.addSection}>
                <div className={styles.inputRow}>
                    <input value={newText} onChange={e=>setNewText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addSubtitle()}
                        placeholder="Type subtitle text..." className={styles.textInput}
                        style={{fontFamily: FONTS.find(f=>f.id===font)?.family}}/>
                    <button className={styles.addBtn} onClick={addSubtitle} disabled={!newText.trim()}><Plus size={18}/></button>
                </div>
                <div className={styles.styleRow}>
                    <div className={styles.fonts}>{FONTS.map(f=>(
                        <button key={f.id} className={`${styles.fontBtn} ${font===f.id?styles.active:''}`}
                            onClick={()=>setFont(f.id)} style={{fontFamily:f.family}}>Aa</button>
                    ))}</div>
                    <div className={styles.colors}>{COLORS.map(c=>(
                        <button key={c} className={`${styles.colorBtn} ${color===c?styles.colorActive:''}`}
                            style={{background:c}} onClick={()=>setColor(c)}/>
                    ))}</div>
                    <div className={styles.positions}>
                        {['top','center','bottom'].map(p=>(
                            <button key={p} className={`${styles.posBtn} ${position===p?styles.posActive:''}`} onClick={()=>setPosition(p)}>{p}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className={styles.list}>
                <AnimatePresence>
                    {subtitles.map((s,i)=>(
                        <motion.div key={s.id} className={styles.item} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:20}}
                            onClick={()=>setEditingId(s.id===editingId?null:s.id)}>
                            <div className={styles.itemHeader}>
                                <span className={styles.idx}>#{i+1}</span>
                                <span className={styles.time}>{fmt(s.startTime)} → {fmt(s.endTime)}</span>
                                <button className={styles.delBtn} onClick={e=>{e.stopPropagation();removeSubtitle(s.id);}}><Trash2 size={14}/></button>
                            </div>
                            <p className={styles.text} style={{fontFamily:FONTS.find(f=>f.id===s.font)?.family, color:s.color}}>{s.text}</p>
                            {editingId===s.id&&(
                                <motion.div className={styles.timeEdit} initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}}>
                                    <label>Start<input type="number" value={s.startTime} onChange={e=>updateSubtitle(s.id,{startTime:parseFloat(e.target.value)||0})}
                                        min={0} max={duration} step={0.1} className={styles.timeInput} onClick={e=>e.stopPropagation()}/></label>
                                    <label>End<input type="number" value={s.endTime} onChange={e=>updateSubtitle(s.id,{endTime:parseFloat(e.target.value)||0})}
                                        min={0} max={duration} step={0.1} className={styles.timeInput} onClick={e=>e.stopPropagation()}/></label>
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
                {subtitles.length===0&&<div className={styles.empty}><Subtitles size={24}/><p>No subtitles yet</p></div>}
            </div>
        </div>
    );
};

export default SubtitleEditor;
