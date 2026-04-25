import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Send, 
  ShieldAlert, 
  ShieldCheck, 
  ShieldQuestion,
  ChevronRight,
  ChevronLeft,
  QrCode,
  Check,
  Zap
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '../lib/utils';

export default function MessageCreator({ onComplete }) {
  const { createMessage } = useStore();
  const [text, setText] = useState('');
  const [priority, setPriority] = useState('normal');
  const [tag, setTag] = useState('general');
  const [location, setLocation] = useState('');
  const [step, setStep] = useState('input'); // 'input', 'shards'
  const [generatedShards, setGeneratedShards] = useState([]);
  const [currentShardIndex, setCurrentShardIndex] = useState(0);
  const [encrypt, setEncrypt] = useState(false);

  const handleCreate = async () => {
    if (!text.trim()) return;
    const { shards } = await createMessage(text, priority, encrypt, { tag, location });
    setGeneratedShards(shards);
    setStep('shards');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onComplete} className="p-1 -ml-1 text-zinc-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-black text-white tracking-tighter uppercase">
          {step === 'input' ? 'Secure_Broadcast' : 'Distribute_Shards'}
        </h2>
      </div>

      <AnimatePresence mode="wait">
        {step === 'input' ? (
          <motion.div 
            key="input"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase ml-1">
                MESSAGE_CONTENT
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="INPUT DATA PACKET..."
                className="w-full h-40 bg-black border border-zinc-800 rounded-sm p-4 text-zinc-200 focus:outline-none focus:border-emerald-500 transition-all resize-none font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase ml-1">
                  CONTEXT_TAG
                </label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 text-zinc-300 p-4 rounded-sm text-[10px] font-black uppercase tracking-widest outline-none focus:border-cyan-500 transition-colors"
                >
                  <option value="general">GENERAL</option>
                  <option value="emergency">EMERGENCY</option>
                  <option value="medical">MEDICAL</option>
                  <option value="supply">SUPPLY</option>
                  <option value="safety">SAFETY</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase ml-1">
                  OFFLINE_LOCATION
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g Sector 7"
                  className="w-full bg-zinc-950 border border-zinc-900 text-zinc-300 p-4 rounded-sm text-[10px] font-black uppercase tracking-widest outline-none focus:border-cyan-500 transition-colors placeholder:text-zinc-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase ml-1">
                PRIORITY_LEVEL
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'normal', label: 'INFO', color: 'cyan', glow: 'glow-cyan' },
                  { id: 'important', label: 'SAFE', color: 'emerald', glow: 'glow-emerald' },
                  { id: 'emergency', label: 'URGENT', color: 'red', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPriority(p.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 border transition-all font-black uppercase text-[10px] tracking-widest",
                      priority === p.id 
                        ? `bg-${p.color}-500 text-black border-${p.color}-500 ${p.glow}`
                        : "bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase ml-1">
                SECURITY_ENHANCEMENT
              </label>
              <button 
                onClick={() => setEncrypt(!encrypt)}
                className={cn(
                  "w-full p-4 border rounded-sm flex items-center justify-between transition-all font-black uppercase text-[10px] tracking-widest",
                  encrypt ? "bg-amber-500/10 border-amber-500 text-amber-500" : "bg-zinc-950 border-zinc-800 text-zinc-600"
                )}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className={cn("w-4 h-4", encrypt ? "text-amber-500" : "text-zinc-700")} />
                  AES_256_ENCRYPTION
                </div>
                <div className={cn("w-8 h-4 rounded-full relative transition-colors", encrypt ? "bg-amber-500" : "bg-zinc-800")}>
                  <div className={cn("absolute top-0.5 bottom-0.5 w-3 bg-zinc-950 rounded-full transition-all", encrypt ? "right-0.5" : "left-0.5")} />
                </div>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleCreate}
                disabled={!text.trim()}
                className="w-full h-16 bg-cyan-400 text-black font-black uppercase flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30 transition-all shadow-lg shadow-cyan-400/20 tracking-[0.2em] glow-cyan"
              >
                Assemble_Matrix
                <Zap className="w-5 h-5 fill-black" />
              </button>

              <button
                onClick={async () => {
                  if (!text.trim()) return;
                  const { shards } = await createMessage(text, 'emergency', false, { tag: 'emergency', location });
                  setGeneratedShards(shards);
                  setStep('shards');
                }}
                disabled={!text.trim()}
                className="w-full h-16 bg-red-600 text-white font-black uppercase px-2 py-1 rounded-sm text-[10px] tracking-widest hover:bg-red-500 transition-all disabled:opacity-30 flex flex-col items-center justify-center border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                <span>QUICK_BROADCAST</span>
                <span className="text-[7px] opacity-70">EMERGENCY_OVERRIDE</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="shards"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8 flex flex-col items-center"
          >
            <div className="text-center space-y-3">
              <div className="text-[10px] bg-zinc-800 text-zinc-400 font-black px-3 py-1 inline-block uppercase tracking-[0.2em]">
                SHARD_SEQUENCE_ESTABLISHED
              </div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                TRANSMITTING {currentShardIndex + 1} OF {generatedShards.length}
              </p>
            </div>

            <div className="p-4 bg-white rounded-sm shadow-2xl">
              <QRCodeSVG 
                value={JSON.stringify(generatedShards[currentShardIndex])}
                size={220}
                level="L"
              />
            </div>

            <div className="w-full grid grid-cols-2 gap-2">
              <button
                onClick={() => setCurrentShardIndex(i => Math.max(0, i - 1))}
                disabled={currentShardIndex === 0}
                className="h-16 bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 disabled:opacity-10 transition-all"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              
              {currentShardIndex === generatedShards.length - 1 ? (
                <button
                  onClick={onComplete}
                  className="h-16 bg-cyan-400 flex items-center justify-center gap-2 text-black font-black uppercase tracking-widest text-[11px] glow-cyan"
                >
                  <Check className="w-6 h-6" />
                  COMPLETE
                </button>
              ) : (
                <button
                  onClick={() => setCurrentShardIndex(i => Math.min(generatedShards.length - 1, i + 1))}
                  className="h-16 bg-zinc-800 text-cyan-400 flex items-center justify-center transition-all hover:bg-zinc-700 hover:text-white border border-zinc-700"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              )}
            </div>
            
            <div className="flex gap-1.5">
              {generatedShards.map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "h-1.5 transition-all duration-300",
                    i === currentShardIndex ? "w-8 bg-cyan-400 glow-cyan" : "w-2 bg-zinc-800"
                  )} 
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
