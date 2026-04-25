import { create } from 'zustand';
import { db, storageService } from '../services/storage';
import { shardService } from '../services/shardService';

export const useStore = create((set, get) => ({
  messages: [],
  shards: [],
  loading: true,
  settings: {
    lowPower: false,
    demoMode: false,
    stealthMode: false,
    passiveRelay: false,
    bluetoothEnabled: false,
    syncMode: 'auto', // 'auto', 'qr', 'bluetooth'
    crisisMode: false
  },
  stats: {
    shardsStored: 0,
    messagesReconstructed: 0,
    relaysPerformed: 0,
    nodesInteracted: 0
  },
  scanHistory: [],
  notifications: [],
  bluetoothDevice: null,
  bluetoothStatus: 'disconnected', // 'disconnected', 'scanning', 'connecting', 'connected'

  init: async () => {
    await storageService.cleanupExpired();
    
    // Load stored settings
    const savedSettings = await storageService.getSetting('app_settings');
    if (savedSettings) {
      set(state => ({ settings: { ...state.settings, ...savedSettings } }));
    }

    // Load stats
    const savedStats = await storageService.getSetting('app_stats');
    if (savedStats && typeof savedStats === 'object') {
      set(state => ({ stats: { ...state.stats, ...savedStats } }));
    }

    const messages = await storageService.getAllMessages() || [];
    const shards = await db.shards?.toArray() || [];
    
    let scanHistory = [];
    try {
      if (db.scans) {
        scanHistory = await db.scans.orderBy('timestamp').reverse().limit(10).toArray();
      }
    } catch (e) {
      console.warn("Could not load scan history", e);
    }
    
    set({ messages, shards, scanHistory, loading: false });

    // Auto-cleanup interval
    setInterval(async () => {
      await storageService.cleanupExpired();
      const shards = await db.shards.toArray();
      set({ shards });
    }, 60000); // Every minute
  },

  incrementStat: async (key) => {
    set(state => {
      const newStats = { ...state.stats, [key]: state.stats[key] + 1 };
      storageService.setSetting('app_stats', newStats);
      return { stats: newStats };
    });
  },

  setSyncMode: (mode) => {
    get().setSetting('syncMode', mode);
  },

  connectBluetooth: async () => {
    const { bluetoothService } = await import('../services/bluetoothService');
    set({ bluetoothStatus: 'scanning' });
    try {
      const device = await bluetoothService.requestConnection();
      set({ bluetoothDevice: device, bluetoothStatus: 'connected' });
      get().addNotification(`Connected: ${device.name || 'Unknown Node'}`, 'success');

      // Simulate an incoming shard after connection in Demo Mode
      if (get().settings.demoMode) {
        setTimeout(async () => {
          get().addNotification("Incoming Bluetooth Data...", "info");
          const demoShard = {
            shardId: "BT-DEMO-SHARD-001",
            messageId: "BT-MESSAGE-01",
            index: 0,
            totalShards: 1,
            content: "SGVsbG8gZnJvbSBCbHVldG9vdGggUGVlciE=",
            checksum: "mock",
            timestamp: Date.now(),
            priority: "normal",
            relayed: true
          };
          await get().addShard(demoShard);
        }, 5000);
      }
    } catch (e) {
      set({ bluetoothStatus: 'disconnected' });
      if (e.name !== 'NotFoundError') {
        get().addNotification("Bluetooth Connection Failed", "error");
      }
    }
  },

  disconnectBluetooth: () => {
    set({ bluetoothDevice: null, bluetoothStatus: 'disconnected' });
    get().addNotification("Bluetooth Node Released", "info");
  },

  sendBluetoothShard: async (shard) => {
    if (get().bluetoothStatus !== 'connected') {
      get().addNotification("No Bluetooth Peer Connected", "error");
      return false;
    }
    
    const { bluetoothService } = await import('../services/bluetoothService');
    get().addNotification(`Transmitting Fragment to BT Peer...`, 'info');
    
    try {
      await bluetoothService.sendShard(get().bluetoothDevice, shard);
      get().incrementStat('relaysPerformed');
      get().addNotification("BT Transmission Successful", "success");
      return true;
    } catch (e) {
      get().addNotification("BT Transfer Interrupted", "error");
      return false;
    }
  },

  simulateHop: async () => {
    get().addNotification("Simulating Multi-Hop Transfer...", "info");
    
    // Create a demo message
    const { shards } = shardService.createShards(
      "DEMO_CORE_DATA: Alpha sequence 104-B activated.",
      "emergency",
      false
    );

    // Simulate Device A -> B (Device B receives 1 shard)
    setTimeout(() => {
      get().addNotification("NODE_A -> NODE_B: Transferring Packet 1", "info");
      get().processSingleShard(shards[0]);
    }, 1000);

    // Simulate Device B -> C (Device C receives Packet 1 and eventually Packet 2)
    setTimeout(() => {
      get().addNotification("NODE_B -> NODE_C: Relaying Packet 1", "info");
      // Current node is Device C in this simulation context
    }, 3000);

    setTimeout(() => {
      get().addNotification("NODE_C: Intercepted Packet 2", "success");
      get().processSingleShard(shards[1]);
    }, 5000);
  },

  setSetting: async (key, value) => {
    set(state => {
      const newSettings = { ...state.settings, [key]: value };
      storageService.setSetting('app_settings', newSettings);
      return { settings: newSettings };
    });
  },

  addNotification: (message, type = 'info') => {
    const id = Date.now();
    set(state => ({
      notifications: [...state.notifications, { id, message, type }]
    }));
    setTimeout(() => {
      set(state => {
        const remaining = state.notifications.filter(n => n.id !== id);
        return { notifications: remaining };
      });
    }, 3000);
  },

  addShard: async (data) => {
    const completedMessageIds = [];
    let maxProgress = 0;

    // Check if it's a bundle
    if (data.type === 'bundle' && Array.isArray(data.shards)) {
      get().addNotification(`Bundle Detected: ${data.shards.length} Packets`, 'info');
      for (const shard of data.shards) {
        const result = await get().processSingleShard(shard);
        if (result?.completed) completedMessageIds.push(shard.messageId);
        if (result?.progress > maxProgress) maxProgress = result.progress;
      }
    } else {
      const result = await get().processSingleShard(data);
      if (result?.completed) completedMessageIds.push(data.messageId);
      if (result?.progress > maxProgress) maxProgress = result.progress;
    }

    // Log scan history
    if (data.shardId || data.type === 'bundle') {
      try {
        const idToLog = data.shardId || (data.shards?.[0]?.shardId);
        const msgIdToLog = data.messageId || (data.shards?.[0]?.messageId);
        
        const scanEntry = { timestamp: Date.now(), shardId: idToLog, messageId: msgIdToLog };
        if (db.scans) await db.scans.add(scanEntry);
        const scanHistory = db.scans ? await db.scans.orderBy('timestamp').reverse().limit(10).toArray() : [];
        set({ scanHistory });
      } catch (e) {
        console.error("Scan log failed", e);
      }
    }

    const messages = await storageService.getAllMessages();
    const shards = await db.shards.toArray();
    set({ messages, shards });
    
    return { completedMessageIds, maxProgress };
  },

  processSingleShard: async (shard) => {
    // Validate shard structure
    if (!shard.shardId || !shard.messageId || !shard.content) {
       console.error("Invalid shard received", shard);
       return { success: false };
    }

    const isNew = await storageService.saveShard(shard);
    
    if (isNew) {
      get().incrementStat('shardsStored');
      if (get().settings.stealthMode) {
        // Less noisy notifications in stealth
      } else {
        get().addNotification(`Packet Recvd: ${shard.messageId.substring(0, 8)}`, 'success');
      }
    } else {
      // Update metadata for existing shard (trust scoring)
      await db.shards.where('shardId').equals(shard.shardId).modify(s => {
        s.relayCount = (s.relayCount || 0) + 1;
        s.deviceCount = (s.deviceCount || 1) + 1;
      });
      // Even if not new, we might still be able to reconstruct if we have other shards now
    }
    
    // Check for message metadata
    let msg = await storageService.getMessage(shard.messageId);
    if (!msg) {
      msg = {
        messageId: shard.messageId,
        timestamp: shard.timestamp,
        priority: shard.priority,
        tag: shard.tag || 'general',
        location: shard.location || '',
        status: 'in-progress',
        content: null
      };
      await storageService.saveMessage(msg);
    }

    // Skip reconstruction if already done, but still return completed status for UI feedback
    if (msg.status === 'completed') return { success: true, completed: true, content: msg.content, progress: 100 };

    // Try reconstruction
    const messageShards = await storageService.getShardsByMessage(shard.messageId);
    const result = shardService.reconstruct(messageShards);

    if (result.success && result.content) {
      msg.status = 'completed';
      msg.content = result.content;
      await storageService.saveMessage(msg);
      
      // Check for previous versions
      const previousFragment = messageShards.find(s => s.previousMessageId);
      if (previousFragment) {
        msg.previousMessageId = previousFragment.previousMessageId;
        await storageService.saveMessage(msg);
      }

      get().incrementStat('messagesReconstructed');
      get().addNotification("Message Reconstructed", "success");
      return { success: true, completed: true, content: result.content, progress: 100 };
    }

    return { success: true, completed: false, progress: result.progress };
  },

  createMessage: async (text, priority, encrypt = false, options = {}) => {
    const { shards, messageId, timestamp } = shardService.createShards(text, priority, encrypt, options);
    
    // Save metadata locally
    await storageService.saveMessage({
      messageId,
      timestamp,
      priority,
      tag: options.tag || 'general',
      location: options.location || '',
      status: 'completed',
      content: text
    });

    // Save shards locally
    for (const s of shards) {
      await storageService.saveShard(s);
    }

    const messages = await storageService.getAllMessages();
    const allShards = await db.shards.toArray();
    set({ messages, shards: allShards });
    return { shards, messageId };
  },

  wipeData: async () => {
    await storageService.wipe();
    localStorage.clear();
    set({ messages: [], shards: [] });
  },

  deleteMessage: async (id) => {
    await storageService.deleteMessage(id);
    const messages = await storageService.getAllMessages();
    const shards = await db.shards.toArray();
    set({ messages, shards });
  }
}));
