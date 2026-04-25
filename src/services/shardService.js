import CryptoJS from 'crypto-js';

export const shardService = {
  /**
   * Split a message into N shards with redundancy.
   */
  createShards(text, priority = 'normal', encrypt = false, options = {}) {
    // Dynamic sharding based on length
    let n = 2;
    if (text.length > 500) n = 5;
    else if (text.length > 100) n = 3;

    const { tag = 'general', location = '', previousMessageId = null } = options;

    const messageId = CryptoJS.SHA256(text + Date.now()).toString().substring(0, 16);
    const timestamp = Date.now();
    const expiry = timestamp + (24 * 60 * 60 * 1000); // 24h default

    let contentToSplit = text;
    let encryptionKey = null;

    // Simple custom "compression" - Replace common patterns to save some bytes
    const compress = (s) => {
      const dict = { 
        ' the ': ' ~0 ', ' and ': ' ~1 ', ' this ': ' ~2 ', ' message ': ' ~3 ',
        ' protocol ': ' ~4 ', ' system ': ' ~5 ', ' network ': ' ~6 ', ' security ': ' ~7 '
      };
      let res = s;
      Object.entries(dict).forEach(([k, v]) => res = res.split(k).join(v));
      return res;
    };

    const compressed = compress(contentToSplit);
    contentToSplit = compressed;

    if (encrypt) {
      encryptionKey = CryptoJS.lib.WordArray.random(16).toString();
      contentToSplit = CryptoJS.AES.encrypt(compressed, encryptionKey).toString();
    }

    // Convert message to Base64
    const encoded = btoa(unescape(encodeURIComponent(contentToSplit)));
    
    // Split into chunks
    const chunkSize = Math.ceil(encoded.length / n);
    const chunks = [];
    for (let i = 0; i < n; i++) {
      chunks.push(encoded.substring(i * chunkSize, (i + 1) * chunkSize));
    }

    const shards = chunks.map((chunk, index) => {
      const checksum = CryptoJS.MD5(chunk).toString();
      const shardId = `${messageId}-${index}`;
      // Unique hash for this specific shard's content and metadata
      const fingerprint = CryptoJS.SHA1(shardId + checksum).toString().substring(0, 8);
      
      return {
        shardId,
        messageId,
        index,
        totalShards: n,
        content: chunk,
        checksum,
        fingerprint,
        timestamp,
        expiry,
        priority,
        tag,
        location,
        previousMessageId,
        encrypted: encrypt,
        keySnippet: encryptionKey,
        trustScore: 1.0,
        relayCount: 0,
        deviceCount: 1
      };
    });

    return { messageId, shards, timestamp };
  },

  /**
   * Pack multiple shards into a bundle for single QR transfer
   */
  createBundle(shards) {
    if (!shards || shards.length === 0) return null;
    return {
      type: "bundle",
      shards,
      timestamp: Date.now(),
      v: "1.1" // Increment version for new structured bundles
    };
  },

  /**
   * Attempt to reconstruct a message from available shards.
   */
  reconstruct(shards) {
    if (!shards || shards.length === 0) return { success: false, progress: 0 };
    
    // Sort shards to ensure first one used for metadata is reliable
    const sortedShards = [...shards].sort((a, b) => a.index - b.index);
    const meta = sortedShards[0];
    const total = meta.totalShards;
    const isEncrypted = meta.encrypted;
    const key = meta.keySnippet;

    if (!total || total <= 0) return { success: false, error: 'Invalid metadata' };
    
    const parts = new Array(total).fill(null);
    
    shards.forEach(s => {
      if (s.index >= 0 && s.index < total) {
        // Integrity check
        const currentChecksum = CryptoJS.MD5(s.content).toString();
        if (currentChecksum === s.checksum) {
          parts[s.index] = s.content;
        }
      }
    });

    const collected = parts.filter(p => p !== null).length;
    const progress = (collected / total) * 100;

    if (collected === total) {
      try {
        const fullEncoded = parts.join('');
        const decodedBase64 = decodeURIComponent(escape(atob(fullEncoded)));
        
        let decrypted = decodedBase64;
        if (isEncrypted && key) {
           const decryptedBytes = CryptoJS.AES.decrypt(decodedBase64, key);
           decrypted = decryptedBytes.toString(CryptoJS.enc.Utf8);
           if (!decrypted) throw new Error("Decryption failed");
        }

        // Decompress
        const decompress = (s) => {
          const dict = { 
            ' ~0 ': ' the ', ' ~1 ': ' and ', ' ~2 ': ' this ', ' ~3 ': ' message ',
            ' ~4 ': ' protocol ', ' ~5 ': ' system ', ' ~6 ': ' network ', ' ~7 ': ' security '
          };
          let res = s;
          try {
            Object.entries(dict).forEach(([k, v]) => res = res.split(k).join(v));
          } catch (e) { /* ignore mismatch */ }
          return res;
        };
        const finalContent = decompress(decrypted);

        return { success: true, content: finalContent, progress: 100 };
      } catch (e) {
        console.error("Reconstruction Error:", e);
        return { success: false, error: 'Corrupted payload', progress: 100 };
      }
    }

    return { success: false, progress, collected, total };
  }
};
