import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { ArrowLeft, Zap, Info, Scan, Terminal, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';

export default function QRScanner({ onComplete }) {
  const { addShard } = useStore();
  const [log, setLog] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [completedMessage, setCompletedMessage] = useState(null);
  const [partialProgress, setPartialProgress] = useState(null);
  const scannerRef = useRef(null);
  const regionId = "reader";

  const addLog = (msg) => {
    setLog(prev => [{ id: Date.now(), msg }, ...prev].slice(0, 5));
  };

  useEffect(() => {
    let html5QrCode;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode(regionId);
        setIsScanning(true);
        
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            try {
              const data = JSON.parse(decodedText);
              let scanResult;
              
              if (data.type === 'bundle') {
                scanResult = await addShard(data);
                addLog(`√ BUNDLE_INGEST: ${data.shards?.length || 0} SECTORS`);
              } else if (data.shardId && data.messageId) {
                data.relayed = true;
                scanResult = await addShard(data);
                addLog(`√ SHARD_SCAN: ${data.shardId.substring(0, 12)} [${Math.round(scanResult?.maxProgress || 0)}%]`);
              } else {
                addLog(`! UNRECOGNIZED PACKET FORMAT`);
              }

              if (scanResult?.completedMessageIds?.length > 0) {
                 const { messages } = useStore.getState();
                 const completedMsg = messages.find(m => m.messageId === scanResult.completedMessageIds[0]);
                 if (completedMsg) {
                    setCompletedMessage(completedMsg);
                    setPartialProgress(null);
                 }
              } else if (scanResult?.maxProgress > 0) {
                 setPartialProgress(scanResult.maxProgress);
                 setTimeout(() => setPartialProgress(null), 1500);
              }
              
              // Vibration feedback if supported
              if (window.navigator.vibrate) window.navigator.vibrate(100);
            } catch (e) {
              console.error("Invalid QR payload", e);
              addLog(`! CORRUPTED PACKET DETECTED`);
            }
          },
          (errorMessage) => {
            // silent fail for frame misses
          }
        );
      } catch (err) {
        console.error("Camera fail", err);
        addLog("! CAMERA ERROR: ACCESS DENIED");
        setIsScanning(false);
      }
    };

    startScanner();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
        }).catch(err => console.error("Scanner cleanup fail", err));
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onComplete} className="p-1 -ml-1 text-zinc-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-black text-white tracking-tighter uppercase">Intercept_Data</h2>
      </div>

      <div className="relative aspect-square w-full max-w-[300px] mx-auto rounded-lg overflow-hidden bg-black border border-zinc-800">
        <div id={regionId} className="w-full h-full" />
        
        {/* Overlay Decoration */}
        <div className="absolute inset-0 pointer-events-none border border-cyan-500/10 m-12 rounded">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-500" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-500" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-500" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-500" />
          
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-cyan-500/20 animate-pulse" />
        </div>

        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 text-cyan-500/50 gap-4 p-8 text-center">
            <Zap className="w-10 h-10 animate-pulse" />
            <p className="text-[10px] font-black tracking-[0.2em] uppercase">Initializing_Optical_Sensors...</p>
          </div>
        )}

        <AnimatePresence>
          {partialProgress && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-6 left-6 right-6 z-40 bg-zinc-950/90 border border-cyan-500/50 p-3 rounded-sm flex flex-col gap-2"
            >
              <div className="flex justify-between items-center">
                <span className="text-[7px] font-black text-cyan-400 uppercase tracking-widest">Collecting_Fragments</span>
                <span className="text-[7px] font-black text-white">{Math.round(partialProgress)}%</span>
              </div>
              <div className="h-1 bg-zinc-900 w-full overflow-hidden rounded-full">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${partialProgress}%` }}
                  className="h-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" 
                />
              </div>
            </motion.div>
          )}

          {completedMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-50 bg-emerald-500 p-6 flex flex-col items-center justify-center text-center gap-4"
            >
              <div className="w-16 h-16 bg-black flex items-center justify-center rounded-full mb-2">
                <Terminal className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-black font-black uppercase tracking-widest text-lg">PROTOCOL_COMPLETE</h3>
              <p className="text-black/80 text-[10px] font-black uppercase px-2 py-1 border border-black/20 rounded">
                Message_Identified_0x{completedMessage.messageId.substring(0, 8)}
              </p>
              <div className="bg-black/10 w-full p-3 rounded text-[10px] text-black font-mono italic break-words line-clamp-3">
                "{completedMessage.content}"
              </div>
              <button 
                onClick={() => setCompletedMessage(null)}
                className="mt-2 text-black font-black uppercase text-[10px] border-b-2 border-black pb-0.5"
              >
                DISMISS_AND_SCAN_MORE
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase">
          <Terminal className="w-3 h-3 text-cyan-400" />
          Ingestion_Log
        </div>
        
        <div className="bg-black border border-zinc-800 rounded-sm p-4 min-h-[140px] font-mono text-[10px] space-y-1 overflow-hidden">
          <AnimatePresence initial={false}>
            {log.length === 0 ? (
              <p className="text-zinc-800 italic uppercase tracking-widest">Waiting for packet ingress...</p>
            ) : (
              log.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-cyan-400 flex gap-2 font-bold"
                >
                  <span className="text-zinc-700">[{new Date(entry.id).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                  {entry.msg}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-sm flex gap-4 items-start">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <p className="text-[10px] leading-snug text-zinc-500 font-bold uppercase tracking-tight">
          <span className="text-red-400">Security Warning:</span> Standard mobile scanners cannot decode ShardNet fragments. You MUST use this terminal to reconstruct data.
        </p>
      </div>

      <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-sm flex gap-4 items-start shadow-inner">
        <Info className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
        <p className="text-[10px] leading-snug text-zinc-500 font-bold uppercase tracking-tight">
          Point optics at SHARDNET QR. Auto-merge logic active. Node will vibrate on successful packet capture.
        </p>
      </div>

      <button
        onClick={onComplete}
        className="w-full h-14 bg-zinc-900 border border-zinc-800 rounded-sm font-black text-zinc-400 active:scale-95 transition-all text-xs tracking-widest uppercase hover:bg-zinc-800 hover:text-white"
      >
        TERMINATE_SESSION
      </button>
    </div>
  );
}
