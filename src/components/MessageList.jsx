import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  ShieldQuestion, 
  Clock, 
  Trash2,
  Lock,
  Unlock,
  Share2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { useState } from 'react';

export default function MessageList({ messages, shards }) {
  const { deleteMessage, settings } = useStore();
  const [filter, setFilter] = useState('all');

  const filteredMessages = messages.filter(m => {
    if (filter === 'all') return true;
    return m.tag === filter || m.priority === filter;
  }).sort((a, b) => b.timestamp - a.timestamp);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-700 border border-zinc-800 rounded-lg bg-zinc-900/20 shadow-inner">
        <Clock className="w-10 h-10 mb-4 opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-widest">No Encrypted Records Found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
        <h2 className="text-[10px] font-black text-white tracking-[0.2em] uppercase italic">Recovered_Data_Stream</h2>
        <div className="flex gap-2">
          {['all', 'emergency', 'medical', 'safety'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "text-[7px] font-black uppercase px-2 py-0.5 border rounded-sm transition-all",
                filter === f ? "border-cyan-500 text-cyan-400 bg-cyan-500/10" : "border-zinc-800 text-zinc-600"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filteredMessages.map((msg) => {
          const msgShards = shards.filter((s) => s.messageId === msg.messageId);
          const totalShards = msgShards.length > 0 ? msgShards[0].totalShards : 1;
          
          return (
            <MessageCard 
              key={msg.messageId} 
              msg={msg} 
              collectedCount={msgShards.length}
              totalCount={totalShards}
              onDelete={() => deleteMessage(msg.messageId)}
              settings={settings}
            />
          );
        })}
      </div>
    </div>
  );
}

function MessageCard({ msg, onDelete, collectedCount, totalCount, settings }) {
  const isCompleted = msg.status === 'completed';
  const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const progressPercent = (collectedCount / totalCount) * 100;

  const priorityConfig = {
    emergency: { label: 'CRITICAL', color: 'red', text: 'red-400' },
    important: { label: 'PRIORITY', color: 'amber', text: 'amber-400' },
    normal: { label: 'ROUTINE', color: 'cyan', text: 'cyan-400' },
  };

  const config = priorityConfig[msg.priority] || priorityConfig.normal;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "bg-zinc-900/30 border-l-2 p-4 transition-all group relative overflow-hidden",
        isCompleted ? "border-emerald-500 bg-emerald-950/5" : `border-${config.color}-500/50`,
        settings?.crisisMode && msg.priority === 'emergency' && "ring-1 ring-red-500 animate-pulse-subtle bg-red-950/10"
      )}
    >
      {settings?.crisisMode && msg.priority === 'emergency' && (
        <div className="absolute top-0 right-0 p-1 bg-red-500 text-white text-[6px] font-black uppercase tracking-tighter">
          CRITICAL_URGENCY
        </div>
      )}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isCompleted ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : `bg-${config.color}-500`)} />
            <span className={cn("text-[9px] font-black uppercase tracking-widest", `text-${config.text}`)}>
              {config.label}
            </span>
            {msg.previousMessageId && (
              <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-sm font-black border border-amber-500/20">VERSION_UPDATE</span>
            )}
            {isCompleted && (
              <span className="text-[8px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-sm font-black border border-emerald-500/20">RECONSTRUCTED</span>
            )}
            <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">{msg.tag}</span>
            {msg.location && (
              <span className="text-[8px] text-zinc-700 font-bold italic truncate">@ {msg.location}</span>
            )}
            {collectedCount > 0 && totalCount > 0 && (
              <span className="text-[8px] text-amber-500/50 font-black uppercase tracking-widest flex items-center gap-1">
                <Share2 className="w-2.5 h-2.5" />
                RELAY_AVAIL [{collectedCount}/{totalCount}]
              </span>
            )}
          </div>
          <span className="text-[9px] text-zinc-700 font-bold tabular-nums">[{timeStr}]</span>
        </div>
        
        <div className="flex-1 min-h-[1.5rem]">
          {isCompleted ? (
            <p className="text-zinc-200 text-sm leading-snug font-medium selection:bg-emerald-500/20">{msg.content}</p>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em] animate-pulse">
                  Recovering_Packet_Headers...
                </p>
                <span className="text-[9px] font-black text-white">{collectedCount}/{totalCount}</span>
              </div>
              <div className="h-1 w-full bg-zinc-800/50 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className={cn("h-full", progressPercent >= 100 ? "bg-emerald-500" : "bg-amber-500")}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-1 pt-2 border-t border-zinc-900/50">
          <span className="text-[8px] text-zinc-700 font-black uppercase tracking-widest">Hash: 0x{msg.messageId.substring(0, 12)}</span>
          <button 
            onClick={onDelete}
            className="p-1 text-zinc-800 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
