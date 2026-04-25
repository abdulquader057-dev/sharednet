import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Plus, 
  Scan, 
  Trash2, 
  Info, 
  History, 
  Radio, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle2,
  Share2,
  Activity
} from 'lucide-react';
import { useStore } from './store/useStore';
import { agentService } from './services/agentService';
import MessageCreator from './components/MessageCreator';
import QRScanner from './components/QRScanner';
import MessageList from './components/MessageList';
import ShardViewer from './components/ShardViewer';
import Onboarding from './components/Onboarding';
import PassiveNode from './components/PassiveNode';
import BluetoothManager from './components/BluetoothManager';
import { cn } from './lib/utils';

export default function App() {
  const { 
    init, 
    loading, 
    messages, 
    shards, 
    wipeData, 
    settings, 
    setSetting, 
    notifications,
    stats,
    scanHistory,
    bluetoothStatus,
    simulateHop
  } = useStore();
  const [view, setView] = useState('dashboard'); 
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('shardnet_onboarded'));
  
  useEffect(() => {
    init();
  }, [init]);

  const suggestions = agentService.analyzeNetwork(messages, shards);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 font-mono italic">
        <div className="relative mb-6">
          <Shield className="w-16 h-16 text-emerald-500 animate-pulse" />
          <div className="absolute inset-0 glow-emerald opacity-20 bg-emerald-500 rounded-full scale-150 blur-2xl" />
        </div>
        <p className="animate-pulse tracking-[0.4em] font-black text-xs uppercase">Initialising_Protocol_Zero...</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen bg-zinc-950 text-zinc-300 font-mono tracking-tight selection:bg-emerald-500/30 overflow-x-hidden transition-all duration-700",
      settings.stealthMode && "brightness-[0.4] grayscale contrast-125"
    )}>
      {!settings.lowPower && <div className={cn("scanline", settings.stealthMode && "opacity-10")} />}
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('dashboard')}>
          <div className="relative group">
            <div className="w-8 h-8 bg-emerald-500 rounded-sm flex items-center justify-center text-black font-black text-xs group-hover:bg-cyan-400 transition-colors duration-300 glow-emerald">
              S#
            </div>
            {!settings.lowPower && <div className="absolute -inset-1 border border-emerald-500/20 rounded-sm animate-ping pointer-events-none" />}
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase leading-none italic">ShardNet</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn("w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]", !settings.lowPower && "animate-pulse")} />
              <p className="text-[8px] text-zinc-500 uppercase tracking-[0.2em] font-black">Node_Alpha_7_Active</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 mr-4">
            <button 
              onClick={() => setSetting('demoMode', !settings.demoMode)}
              className={cn("px-2 py-0.5 rounded text-[8px] font-black border transition-all", settings.demoMode ? "bg-cyan-500 border-cyan-400 text-black shadow-[0_0_10px_rgba(34,211,238,0.3)]" : "bg-zinc-900 border-zinc-800 text-zinc-600")}
            >DEMO</button>
            <button 
              onClick={() => setSetting('stealthMode', !settings.stealthMode)}
              className={cn("px-2 py-0.5 rounded text-[8px] font-black border transition-all", settings.stealthMode ? "bg-amber-500 border-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.3)]" : "bg-zinc-900 border-zinc-800 text-zinc-600")}
            >STEALTH</button>
            <button 
              onClick={() => setSetting('lowPower', !settings.lowPower)}
              className={cn("px-2 py-0.5 rounded text-[8px] font-black border transition-all", settings.lowPower ? "bg-emerald-500 border-emerald-400 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-zinc-900 border-zinc-800 text-zinc-600")}
            >ECO</button>
            <button 
              onClick={() => setSetting('passiveRelay', !settings.passiveRelay)}
              className={cn("px-2 py-0.5 rounded text-[8px] font-black border transition-all", settings.passiveRelay ? "bg-cyan-500 border-cyan-400 text-black shadow-[0_0_10px_rgba(34,211,238,0.3)]" : "bg-zinc-900 border-zinc-800 text-zinc-600")}
            >PASSIVE</button>
            <button 
              onClick={() => setSetting('crisisMode', !settings.crisisMode)}
              className={cn("px-2 py-0.5 rounded text-[8px] font-black border transition-all", settings.crisisMode ? "bg-red-500 border-red-400 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "bg-zinc-900 border-zinc-800 text-zinc-600")}
            >CRISIS</button>
          </div>

          <button 
            onClick={() => {
              if (confirm('CRITICAL: INITIATE CORE WIPE SEQUENCE?')) {
                wipeData();
              }
            }}
            className="p-2 text-zinc-700 hover:text-red-500 transition-all rounded hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
            title="Wipe Device"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Explanatory Banner */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-2">
        <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
           <Radio className="w-3 h-3 text-cyan-400" />
           Peer-to-Peer Mesh Active // Offline Security Mode Engaged
        </p>
      </div>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pt-4 pb-28">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-6"
            >
              {/* Demo Controls */}
              {settings.demoMode && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-sm space-y-3">
                  <div className="flex items-center gap-2 text-amber-500">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Demo_Command_Console</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <button 
                      onClick={simulateHop}
                      className="w-full py-2 bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all"
                    >
                      Trigger_Multi_Hop_0xABC
                    </button>
                    <p className="text-[8px] text-amber-500/50 uppercase italic text-center">
                      Simulates: Node A -&gt; Node B -&gt; Node C (Local)
                    </p>
                  </div>
                </div>
              )}

              {/* Mission Statement Banner */}
              <div className="bg-cyan-500/5 border border-cyan-500/20 p-4 rounded-sm">
                <p className="text-[10px] text-cyan-400 font-black uppercase leading-relaxed tracking-wider">
                  "This device stores fragments of encrypted messages. Collect 100% of fragments to reconstruct data packets locally."
                </p>
              </div>

              {/* Tactical Overview */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Active_Frags", val: shards.length, color: "emerald text-emerald-500" },
                  { label: "Stability", val: "STABLE", color: "white text-white" },
                  { label: "BT_Link", val: bluetoothStatus.toUpperCase(), color: bluetoothStatus === 'connected' ? "cyan text-cyan-400" : "zinc text-zinc-600" }
                ].map((stat, i) => (
                  <div key={i} className="bg-zinc-900/40 border border-zinc-900 p-3 rounded-sm relative overflow-hidden group">
                    <div className={cn("absolute inset-x-0 bottom-0 h-[1px] bg-current opacity-20", stat.color.split(' ')[1])} />
                    <span className="text-[8px] font-black text-zinc-600 block uppercase mb-1">{stat.label}</span>
                    <span className={cn("text-lg font-black truncate block", stat.color.split(' ')[1])}>{stat.val}</span>
                  </div>
                ))}
              </div>

              {/* Bluetooth Component */}
              <BluetoothManager />

              {/* Network Stats Section */}
              <div className="bg-zinc-900/40 border border-zinc-900 rounded-sm p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h2 className="text-[10px] font-black text-white tracking-[0.2em] uppercase italic">Local_Mesh_Analytics</h2>
                  <Activity className="w-3 h-3 text-emerald-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[7px] text-zinc-600 font-black uppercase">Relays_Performed</p>
                    <p className="text-xl font-black text-white tabular-nums">{stats.relaysPerformed}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[7px] text-zinc-600 font-black uppercase">Recovered_Packets</p>
                    <p className="text-xl font-black text-white tabular-nums">{stats.messagesReconstructed}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-800">
                  <p className="text-[7px] text-zinc-700 font-black uppercase mb-2">Recent_Scan_Log</p>
                  <div className="space-y-1">
                    {(scanHistory || []).map((scan, i) => (
                      <div key={i} className="flex items-center justify-between text-[7px] font-bold text-zinc-500">
                         <span className="truncate w-32">FRAGMENT_0x{scan.shardId?.substring(0, 10) || 'UNKNOWN'}</span>
                         <span className="tabular-nums opacity-50">{scan.timestamp ? new Date(scan.timestamp).toLocaleTimeString() : 'N/A'}</span>
                      </div>
                    )).slice(0, 3)}
                  </div>
                </div>
              </div>

              {/* Passive Relay Section */}
              {settings.passiveRelay && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <h2 className="text-[10px] font-black text-white tracking-[0.2em] uppercase italic">Passive_Broadcasting</h2>
                    <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                  </div>
                  <PassiveNode shards={shards} lowPower={settings.lowPower} />
                </motion.div>
              )}

              {/* Simple Network Viz */}
              <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-sm relative overflow-hidden">
                <div className="absolute inset-0 shard-grid opacity-5" />
                <div className="relative flex items-center justify-between">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-900">
                      <Shield className="w-5 h-5 text-zinc-500" />
                    </div>
                    <span className="text-[8px] font-black text-zinc-600 uppercase">A_Node</span>
                  </div>
                  <div className="flex-1 h-px bg-zinc-900 relative">
                    <motion.div 
                      animate={{ 
                        left: ["0%", "100%"],
                        opacity: [0, 1, 0]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-[1px] bg-cyan-400 glow-cyan"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full border border-emerald-500 flex items-center justify-center bg-emerald-500/10 glow-emerald">
                      <Shield className="w-5 h-5 text-emerald-500" />
                    </div>
                    <span className="text-[8px] font-black text-emerald-500 uppercase">You (Node_7)</span>
                  </div>
                  <div className="flex-1 h-px bg-zinc-900 relative">
                    <motion.div 
                      animate={{ 
                        left: ["0%", "100%"],
                        opacity: [0, 1, 0]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity,
                        ease: "linear",
                        delay: 1.5
                      }}
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-[1px] bg-cyan-400 glow-cyan"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-900">
                      <Shield className="w-5 h-5 text-zinc-500" />
                    </div>
                    <span className="text-[8px] font-black text-zinc-600 uppercase">C_Node</span>
                  </div>
                </div>
              </div>

              {/* Agent Suggestions */}
              {suggestions.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-[10px] font-black text-zinc-600 tracking-[0.2em] uppercase flex items-center gap-2">
                    <Radio className="w-3 h-3 text-cyan-400" />
                    Agent_Alerts
                  </h2>
                  <div className="space-y-1.5">
                    {suggestions.map((s) => (
                      <div 
                        key={s.id}
                        className={cn(
                          "px-4 py-3 rounded border text-[11px] flex items-center gap-3 shadow-sm font-bold uppercase tracking-tight relative overflow-hidden",
                          s.priority === 'emergency' 
                            ? "bg-red-950/20 border-red-500/30 text-red-500" 
                            : "bg-cyan-950/20 border-cyan-500/30 text-cyan-400"
                        )}
                      >
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1", s.priority === 'emergency' ? "bg-red-500" : "bg-cyan-400")} />
                        {s.priority === 'emergency' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                        {s.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <h2 className="text-[10px] font-black text-zinc-600 tracking-[0.2em] uppercase italic">Local_Buffer</h2>
                  <span className="text-[9px] font-black bg-zinc-900 text-zinc-500 px-3 py-1 rounded shadow-inner">0X{messages.length} Records</span>
                </div>
                <MessageList messages={messages} shards={shards} />
              </div>
            </motion.div>
          )}

          {view === 'create' && (
            <motion.div 
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <MessageCreator onComplete={() => setView('dashboard')} />
            </motion.div>
          )}

          {view === 'scan' && (
            <motion.div 
              key="scan"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <QRScanner onComplete={() => setView('dashboard')} />
            </motion.div>
          )}

          {view === 'shards' && (
            <motion.div 
              key="shards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ShardViewer />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Notifications Overlay */}
      <div className="fixed top-24 right-4 z-[100] space-y-2 max-w-[200px]">
        {notifications.map(n => (
          <motion.div 
            key={n.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={cn(
              "p-3 rounded-sm border shadow-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2",
              n.type === 'success' ? "bg-emerald-950/90 border-emerald-500 text-emerald-400" : "bg-zinc-900/90 border-zinc-800 text-zinc-400"
            )}
          >
            {n.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <Info className="w-3 h-3" />}
            {n.message}
          </motion.div>
        ))}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-900 p-3 max-w-md mx-auto flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
        <button 
          onClick={() => setView('dashboard')}
          className={cn("flex flex-col items-center gap-1 transition-all duration-300", view === 'dashboard' ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" : "text-zinc-600")}
        >
          <History className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase tracking-tighter">Local_Net</span>
        </button>
        
        <button 
          onClick={() => setView('scan')}
          className={cn("flex flex-col items-center gap-1 transition-all duration-300", view === 'scan' ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" : "text-zinc-600")}
        >
          <Scan className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase tracking-tighter">Intercept</span>
        </button>

        <div className="relative -top-7">
          <button 
            onClick={() => setView('create')}
            className={cn(
              "w-14 h-14 bg-emerald-500 rounded-sm flex items-center justify-center shadow-lg active:scale-95 transition-all glow-emerald",
              view === 'create' ? "bg-cyan-400 glow-cyan rotate-45" : "bg-emerald-500"
            )}
          >
            <Plus className={cn("w-8 h-8 text-black font-black transition-transform", view === 'create' && "-rotate-45")} />
          </button>
        </div>

        <button 
          onClick={() => setView('shards')}
          className={cn("flex flex-col items-center gap-1 transition-all duration-300", view === 'shards' ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" : "text-zinc-600")}
        >
          <Share2 className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase tracking-tighter">Inventory</span>
        </button>

        <div className="flex flex-col items-center gap-1 text-zinc-800">
          <WifiOff className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase tracking-tighter">Offline</span>
        </div>
      </nav>

      {/* Overlays */}
      <AnimatePresence>
        {showOnboarding && (
          <Onboarding onClose={() => {
            setShowOnboarding(false);
            localStorage.setItem('shardnet_onboarded', 'true');
          }} />
        )}
      </AnimatePresence>
    </div>
  );
}
