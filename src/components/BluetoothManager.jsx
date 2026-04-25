import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bluetooth, BluetoothOff, Cpu, RefreshCw, Smartphone, Wifi, Loader2, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

export default function BluetoothManager() {
  const { 
    settings, 
    setSetting, 
    bluetoothStatus, 
    bluetoothDevice, 
    connectBluetooth, 
    disconnectBluetooth,
    setSyncMode 
  } = useStore();

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/40 border border-zinc-900 rounded-sm overflow-hidden">
        <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bluetooth className={cn("w-3 h-3", settings.bluetoothEnabled ? "text-cyan-400" : "text-zinc-600")} />
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Protocol_P2P_Wireless</h3>
          </div>
          <button 
            onClick={() => setSetting('bluetoothEnabled', !settings.bluetoothEnabled)}
            className={cn(
              "px-2 py-0.5 rounded text-[8px] font-black border transition-all",
              settings.bluetoothEnabled ? "bg-cyan-500 border-cyan-400 text-black shadow-glow-cyan" : "bg-zinc-800 border-zinc-700 text-zinc-500"
            )}
          >
            {settings.bluetoothEnabled ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>

        <AnimatePresence>
          {settings.bluetoothEnabled && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-4 space-y-4"
            >
              {/* Sync Mode Selector */}
              <div className="space-y-2">
                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1">Sync_Preference</label>
                <div className="grid grid-cols-3 gap-1">
                  {['auto', 'qr', 'bluetooth'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setSyncMode(mode)}
                      className={cn(
                        "py-2 rounded-sm text-[8px] font-black border transition-all uppercase",
                        settings.syncMode === mode 
                          ? "bg-cyan-500/10 border-cyan-500 text-cyan-400" 
                          : "bg-zinc-950 border-zinc-900 text-zinc-600"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discovery Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1">Proximity_Discovery</label>
                  {bluetoothStatus === 'scanning' && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />}
                </div>

                {bluetoothStatus === 'connected' ? (
                  <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white uppercase">{bluetoothDevice?.name || 'NODE_UNKNOWN'}</p>
                        <p className="text-[8px] font-bold text-cyan-500/50 uppercase tracking-widest">ACTIVE_LINK_STABLE</p>
                      </div>
                    </div>
                    <button 
                      onClick={disconnectBluetooth}
                      className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                    >
                      <BluetoothOff className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={connectBluetooth}
                    disabled={bluetoothStatus === 'scanning'}
                    className="w-full py-6 bg-zinc-950 border border-dashed border-zinc-800 rounded-sm border-emerald-500/20 group hover:border-cyan-400 transition-all flex flex-col items-center justify-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-full border border-zinc-900 flex items-center justify-center group-hover:border-cyan-400 transition-all">
                      <RefreshCw className={cn("w-6 h-6 text-zinc-700 group-hover:text-cyan-400", bluetoothStatus === 'scanning' && "animate-spin")} />
                    </div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest group-hover:text-cyan-400">
                      {bluetoothStatus === 'scanning' ? 'SEARCHING_FOR_NODES...' : 'INITIATE_P2P_DISCOVERY'}
                    </p>
                  </button>
                )}
              </div>

              {/* Status Info */}
              <div className="p-3 bg-zinc-950 border border-zinc-900 flex gap-3 items-start">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-[8px] leading-relaxed text-zinc-600 font-bold uppercase">
                  Nearby devices running ShardNet can synchronize fragments automatically when in range. Fallback to Optical (QR) is always active.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
