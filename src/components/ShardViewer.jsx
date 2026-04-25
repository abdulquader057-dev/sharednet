import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Box, 
  Share2, 
  Search, 
  ChevronRight, 
  ArrowLeft,
  Filter,
  Copy,
  Download,
  QrCode,
  Bluetooth
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { QRCodeSVG } from 'qrcode.react';

import { shardService } from '../services/shardService';

export default function ShardViewer() {
  const { shards, bluetoothStatus, sendBluetoothShard } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShard, setSelectedShard] = useState(null);
  const [bundleData, setBundleData] = useState(null);

  // Group shards by messageId
  const groupedShards = shards.reduce((acc, shard) => {
    if (!acc[shard.messageId]) acc[shard.messageId] = [];
    acc[shard.messageId].push(shard);
    return acc;
  }, {});

  const messageIds = Object.keys(groupedShards).filter(id => 
    id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShareBundle = (msgId) => {
    const bundle = shardService.createBundle(groupedShards[msgId]);
    setBundleData({ 
        messageId: msgId, 
        qr: JSON.stringify(bundle),
        count: groupedShards[msgId].length
    });
  };

  return (
    <div className="space-y-6 pb-4">
      <div className="space-y-1">
        <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">Inventory.mesh</h2>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Storage_Allocation: {shards.length}/1024_Sectors</p>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-zinc-600 group-focus-within:text-cyan-400 transition-colors" />
        </div>
        <input 
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="QUERY_DATA_INDEX..."
          className="w-full bg-zinc-950 border border-zinc-900 rounded-sm py-4 pl-12 pr-4 text-xs text-zinc-200 focus:outline-none focus:border-cyan-400 transition-all uppercase font-black tracking-widest shadow-inner"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <Filter className="w-3.5 h-3.5 text-zinc-700" />
        </div>
      </div>

      <div className="space-y-4">
        {messageIds.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-900 rounded-sm bg-zinc-950/50">
            <div className="mb-4 flex justify-center">
              <Share2 className="w-12 h-12 text-zinc-900 animate-pulse" />
            </div>
            <p className="text-[10px] font-black text-zinc-800 tracking-[0.3em] uppercase">
              // NO_FRAGMENTS_DETECTED_IN_LOCAL_GRID
            </p>
          </div>
        ) : (
          messageIds.map(msgId => (
            <div key={msgId} className="space-y-3 p-5 bg-zinc-900/20 border border-zinc-900 rounded-sm relative overflow-hidden group hover:border-cyan-400/30 transition-all">
              <div className="absolute inset-0 shard-grid opacity-[0.03] group-hover:opacity-[0.07] transition-opacity" />
              
              <div className="flex items-center justify-between px-1 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 glow-cyan animate-pulse" />
                  <h3 className="text-[10px] font-black text-white tracking-widest uppercase italic">
                    Grid://0X{msgId.substring(0, 12)}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleShareBundle(msgId)}
                    className="p-1 text-zinc-600 hover:text-cyan-400 transition-colors flex items-center gap-2 pr-2"
                    title="Share Bundle"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="text-[8px] font-black uppercase">Bundle</span>
                  </button>
                  <span className="text-[8px] font-black text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-400/20 tabular-nums">
                    {groupedShards[msgId].length} UNITS
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-1.5 relative z-10">
                {Array.from({ length: groupedShards[msgId][0].totalShards }).map((_, idx) => {
                  const shard = groupedShards[msgId].find(s => s.index === idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => shard && setSelectedShard(shard)}
                      className={cn(
                        "aspect-square rounded-sm border flex items-center justify-center transition-all duration-300",
                        shard 
                          ? "bg-cyan-500/5 border-cyan-500/40 text-cyan-400 hover:bg-cyan-400 hover:text-black glow-cyan active:scale-90" 
                          : "bg-zinc-950/50 border-zinc-900 text-zinc-800 cursor-not-allowed"
                      )}
                    >
                      {shard ? <Box className="w-5 h-5 opacity-60 group-hover:opacity-100" /> : <div className="w-1 h-1 rounded-full bg-zinc-900" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {bundleData && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBundleData(null)}
              className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-sm p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 shard-grid opacity-10 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center gap-8">
                <div className="text-center space-y-3">
                  <div className="text-[10px] bg-cyan-400 text-black font-black px-3 py-1 inline-block mx-auto uppercase tracking-widest">ENCRYPTED_BUNDLE</div>
                  <h3 className="text-white font-black uppercase tracking-[0.3em] text-sm italic">PKT_GROUP_0X{bundleData.messageId.substring(0, 10)}</h3>
                  <p className="text-zinc-500 font-black text-[9px] uppercase">CONTAINING: {bundleData.count} FRAGMENTS</p>
                </div>
                
                <div className="p-4 bg-white rounded-sm shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                  <QRCodeSVG value={bundleData.qr} size={240} />
                </div>

                <div className="grid grid-cols-2 gap-2 w-full">
                  {bluetoothStatus === 'connected' && (
                    <button 
                      onClick={() => {
                        const bundle = JSON.parse(bundleData.qr);
                        sendBluetoothShard(bundle);
                        setBundleData(null);
                      }}
                      className="py-4 bg-emerald-500 text-black hover:bg-emerald-400 transition-all font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-3 h-3" />
                      SYNC_VIA_BT
                    </button>
                  )}
                  <button 
                    onClick={() => setBundleData(null)}
                    className={cn(
                      "py-4 bg-cyan-500 text-black hover:bg-cyan-400 transition-all font-black uppercase text-[10px] tracking-[0.2em]",
                      bluetoothStatus !== 'connected' && "col-span-2"
                    )}
                  >
                    CLOSE_TRANSMISSION
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {selectedShard && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedShard(null)}
              className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-sm p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 shard-grid opacity-5 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center gap-8">
                <div className="text-center space-y-3">
                  <div className="text-[10px] bg-cyan-400 text-black font-black px-3 py-1 inline-block mx-auto uppercase tracking-widest">TRANSMISSION_NODE</div>
                  <h3 className="text-white font-black uppercase tracking-[0.3em] text-sm italic">PROTOCOL_0X{selectedShard.messageId.substring(0, 10)}</h3>
                  <div className="flex items-center justify-center gap-4 text-zinc-500 font-black text-[9px] uppercase">
                    <span>INDEX: {selectedShard.index + 1}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-800" />
                    <span>PRIORITY: {selectedShard.priority}</span>
                  </div>
                  <div className="flex items-center gap-2 border-l border-zinc-800 pl-3">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Trust_Index:</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[8px] font-black uppercase",
                      (selectedShard.deviceCount || 1) >= 3 ? "bg-emerald-500/10 text-emerald-500" :
                      (selectedShard.deviceCount || 1) >= 2 ? "bg-cyan-500/10 text-cyan-500" : "bg-zinc-800 text-zinc-500"
                    )}>
                      {(selectedShard.deviceCount || 1) >= 3 ? 'HIGH' : (selectedShard.deviceCount || 1) >= 2 ? 'MEDIUM' : 'LOW'}
                    </span>
                  </div>
                  {selectedShard.relayed && (
                    <div className="text-[8px] text-amber-500 font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-1.5 pt-2">
                       <Share2 className="w-2.5 h-2.5" />
                       Packet_Relayed
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-white rounded-sm shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                  <QRCodeSVG value={JSON.stringify(selectedShard)} size={220} />
                </div>

                <div className="w-full grid grid-cols-2 gap-2">
                  {bluetoothStatus === 'connected' ? (
                    <button 
                      onClick={() => {
                        sendBluetoothShard(selectedShard);
                        setSelectedShard(null);
                      }}
                      className="col-span-2 py-4 bg-emerald-500 text-black hover:bg-emerald-400 transition-all font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2"
                    >
                      <Bluetooth className="w-4 h-4" />
                      RELAY_VIA_BLUETOOTH
                    </button>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-4 bg-zinc-950 border border-zinc-800 text-zinc-400 font-black uppercase text-[9px] tracking-[0.2em] px-2 text-center">
                      <span className="text-[7px] text-zinc-600">FRAGMENT_SAMPLE</span>
                      <span className="truncate w-full italic">
                        {(() => {
                          try {
                            const decoded = atob(selectedShard.content);
                            return decoded.substring(0, 15) + (decoded.length > 15 ? '...' : '');
                          } catch (e) {
                            return 'BINARY_DATA';
                          }
                        })()}
                      </span>
                    </div>
                  )}
                  <button 
                    onClick={() => setSelectedShard(null)}
                    className={cn(
                      "flex flex-col items-center gap-2 py-4 bg-cyan-500 text-black hover:bg-cyan-400 transition-all font-black uppercase text-[9px] tracking-[0.2em] shadow-lg shadow-cyan-500/20",
                      bluetoothStatus === 'connected' && "col-span-2"
                    )}
                  >
                    <QrCode className="w-4 h-4" />
                    Terminate
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
