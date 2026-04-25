import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, Share2, AlertTriangle, Zap } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '../lib/utils';
import { shardService } from '../services/shardService';

export default function PassiveNode({ shards, lowPower }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayType, setDisplayType] = useState('single'); // 'single', 'bundle'

  // Filter shards we should relay (prefer emergency or relayed ones)
  const relayCandidates = shards.filter(s => s.priority === 'emergency' || s.relayed)
    .sort((a, b) => b.timestamp - a.timestamp);
  
  const currentShard = relayCandidates[currentIndex];

  useEffect(() => {
    if (lowPower || relayCandidates.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % relayCandidates.length);
      setDisplayType(prev => Math.random() > 0.7 ? 'bundle' : 'single');
    }, 8000);

    return () => clearInterval(timer);
  }, [relayCandidates.length, lowPower]);

  if (relayCandidates.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-sm text-center">
        <Radio className="w-8 h-8 text-zinc-700 mx-auto mb-4 opacity-20" />
        <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest leading-relaxed">
          Passive_Node_Idle // No high-priority packets detected for relay
        </p>
      </div>
    );
  }

  // Get all shards for this message for potential bundling
  const msgShards = shards.filter(s => s.messageId === currentShard.messageId);
  const bundle = shardService.createBundle(msgShards);

  return (
    <div className="relative group overflow-hidden bg-zinc-950 border-2 border-cyan-400 p-6 rounded-sm glow-cyan">
      <div className="absolute top-0 right-0 p-2 opacity-50">
        <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
             <div className="px-1.5 py-0.5 bg-cyan-400 text-black text-[8px] font-black uppercase tracking-tighter">Passive_Beacon</div>
             {displayType === 'bundle' && (
                <div className="px-1.5 py-0.5 bg-amber-500 text-black text-[8px] font-black uppercase tracking-tighter">Bundle_Mode</div>
             )}
          </div>
          <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] italic">
            {displayType === 'single' ? `Fragment_0x${currentShard.shardId.substring(0, 10)}` : `Protocol_0x${currentShard.messageId.substring(0, 10)}`}
          </h3>
          <div className="flex items-center justify-center gap-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
            <span className="flex items-center gap-1">
               <Zap className={cn("w-3 h-3", currentShard.priority === 'emergency' ? "text-red-500" : "text-cyan-400")} />
               {currentShard.priority}
            </span>
            <span className="flex items-center gap-1">
               <Share2 className="w-3 h-3" />
               Index: {currentShard.index + 1}/{currentShard.totalShards}
            </span>
          </div>
        </div>

        <motion.div 
          key={currentIndex + displayType}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-white rounded-sm shadow-[0_0_50px_rgba(34,211,238,0.2)]"
        >
          <QRCodeSVG 
            value={displayType === 'single' ? JSON.stringify(currentShard) : JSON.stringify(bundle)} 
            size={200}
            level="L"
          />
        </motion.div>

        <p className="text-[9px] text-zinc-500 font-bold uppercase italic animate-pulse">
           Beacon_Active... Neighbors_Can_Sync_Automatically
        </p>
      </div>
      
      {/* Background decoration */}
      <div className="absolute inset-0 shard-grid opacity-10 pointer-events-none" />
    </div>
  );
}
