import Dexie from 'dexie';

export const db = new Dexie('ShardNetDB');

db.version(3).stores({
  shards: '++id, shardId, messageId, index, totalShards, expiry, priority, fingerprint, tag',
  messages: 'messageId, timestamp, priority, status, reconstructedAt, tag, location',
  scans: '++id, timestamp, shardId, messageId',
  settings: 'key, value',
  trust: 'entityId, score, relayCount, deviceCount, lastUpdated'
});

export const storageService = {
  async saveShard(shard) {
    const existing = await db.shards.where('shardId').equals(shard.shardId).first();
    if (existing) return false;
    
    // Limit total shards to 100 as per optimization request
    const count = await db.shards.count();
    if (count >= 100) {
      const oldest = await db.shards.orderBy('timestamp').first();
      if (oldest) await db.shards.delete(oldest.id);
    }

    await db.shards.add({
      ...shard,
      createdAt: shard.timestamp || Date.now()
    });
    return true;
  },

  async getShardsByMessage(messageId) {
    return await db.shards.where('messageId').equals(messageId).toArray();
  },

  async saveMessage(msg) {
    const data = {
      ...msg,
      reconstructedAt: msg.status === 'completed' ? Date.now() : null
    };
    await db.messages.put(data);
  },

  async getMessage(messageId) {
    return await db.messages.get(messageId);
  },

  async getAllMessages() {
    return await db.messages.orderBy('timestamp').reverse().toArray();
  },

  async deleteMessage(messageId) {
    await db.messages.delete(messageId);
    await db.shards.where('messageId').equals(messageId).delete();
  },

  async setSetting(key, value) {
    await db.settings.put({ key, value });
  },

  async getSetting(key) {
    const entry = await db.settings.get(key);
    return entry ? entry.value : null;
  },

  async wipe() {
    await db.messages.clear();
    await db.shards.clear();
    await db.trust.clear();
    await db.settings.clear();
  },

  async cleanupExpired() {
    const now = Date.now();
    await db.shards.where('expiry').below(now).delete();
  }
};
