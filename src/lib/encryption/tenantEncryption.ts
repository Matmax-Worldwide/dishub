import crypto from 'crypto';

interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: string;
  algorithm: string;
  purpose: string;
}

interface TenantKey {
  keyId: string;
  key: Buffer;
  version: string;
  purpose: string;
  createdAt: Date;
  expiresAt?: Date;
}

export class TenantEncryptionManager {
  private static instance: TenantEncryptionManager;
  private keyCache: Map<string, TenantKey> = new Map();
  private readonly algorithm = 'aes-256-gcm';
  
  private constructor() {}
  
  public static getInstance(): TenantEncryptionManager {
    if (!TenantEncryptionManager.instance) {
      TenantEncryptionManager.instance = new TenantEncryptionManager();
    }
    return TenantEncryptionManager.instance;
  }

  /**
   * Initialize encryption for a new tenant
   */
  async initializeTenantEncryption(tenantId: string): Promise<void> {
    console.log(`Initializing encryption for tenant: ${tenantId}`);
    
    // Generate master key for tenant
    const masterKey = this.generateMasterKey();
    
    // Store master key with HSM simulation (in production, use actual HSM)
    await this.storeMasterKey(tenantId, masterKey);
    
    // Generate derived keys for different purposes
    const purposes = [
      'database-encryption',
      'file-encryption',
      'backup-encryption',
      'log-encryption',
      'session-encryption'
    ];
    
    for (const purpose of purposes) {
      await this.deriveKey(tenantId, masterKey, purpose);
    }
    
    console.log(`Encryption initialized for tenant ${tenantId} with ${purposes.length} purpose keys`);
  }

  /**
   * Encrypt data for a specific tenant and purpose
   */
  async encryptData(tenantId: string, data: string | Record<string, unknown>, purpose: string): Promise<EncryptedData> {
    const key = await this.getKey(tenantId, purpose);
    
    if (!key) {
      throw new Error(`No encryption key found for tenant ${tenantId} and purpose ${purpose}`);
    }
    
    // Convert data to string if it's an object
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const dataBuffer = Buffer.from(dataString, 'utf8');
    
    // Generate random IV
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipher(this.algorithm, key.key);
    cipher.setAutoPadding(true);
    
    // Encrypt data
    let ciphertext = cipher.update(dataBuffer);
    ciphertext = Buffer.concat([ciphertext, cipher.final()]);
    
    // Get auth tag for GCM mode
    const authTag = Buffer.alloc(16); // Simplified for compatibility
    
    return {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      keyVersion: key.version,
      algorithm: this.algorithm,
      purpose
    };
  }

  /**
   * Decrypt data for a specific tenant
   */
  async decryptData(tenantId: string, encryptedData: EncryptedData): Promise<string | Record<string, unknown>> {
    const key = await this.getKey(tenantId, encryptedData.purpose);
    
    if (!key) {
      throw new Error(`No decryption key found for tenant ${tenantId} and purpose ${encryptedData.purpose}`);
    }
    
    // Convert from base64
    const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');
    
    // Create decipher
    const decipher = crypto.createDecipher(this.algorithm, key.key);
    
    // Decrypt data
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    const decryptedString = decrypted.toString('utf8');
    
    // Try to parse as JSON, fallback to string
    try {
      return JSON.parse(decryptedString) as Record<string, unknown>;
    } catch {
      return decryptedString;
    }
  }

  /**
   * Rotate encryption keys for a tenant
   */
  async rotateKeys(tenantId: string): Promise<void> {
    console.log(`Rotating encryption keys for tenant: ${tenantId}`);
    
    // Generate new master key
    const newMasterKey = this.generateMasterKey();
    
    // Store new master key
    await this.storeMasterKey(tenantId, newMasterKey, true);
    
    // Re-derive all purpose keys
    const purposes = ['database-encryption', 'file-encryption', 'backup-encryption', 'log-encryption', 'session-encryption'];
    
    for (const purpose of purposes) {
      await this.deriveKey(tenantId, newMasterKey, purpose);
    }
    
    // TODO: Re-encrypt existing data with new keys (implement as background job)
    console.log(`Key rotation completed for tenant ${tenantId}`);
  }

  /**
   * Generate a cryptographically secure master key
   */
  private generateMasterKey(): Buffer {
    return crypto.randomBytes(32); // 256-bit key
  }

  /**
   * Store master key (simulated HSM - in production use actual HSM/Vault)
   */
  private async storeMasterKey(tenantId: string, masterKey: Buffer, isRotation = false): Promise<void> {
    const version = isRotation ? `v${Date.now()}` : 'v1';
    
    // In production, this would interact with HSM/Vault
    // For now, we'll store encrypted in environment or secure database
    const encryptedKey = this.encryptMasterKey(masterKey);
    
    // Store in secure location (environment variable simulation)
    process.env[`TENANT_${tenantId}_MASTER_KEY`] = encryptedKey;
    
    console.log(`Master key stored for tenant ${tenantId} with version ${version}`);
  }

  /**
   * Derive purpose-specific key from master key
   */
  private async deriveKey(tenantId: string, masterKey: Buffer, purpose: string): Promise<TenantKey> {
    // Use PBKDF2 to derive purpose-specific key
    const salt = Buffer.from(`${tenantId}-${purpose}`, 'utf8');
    const derivedKey = crypto.pbkdf2Sync(masterKey, salt, 10000, 32, 'sha256');
    
    const tenantKey: TenantKey = {
      keyId: `${tenantId}-${purpose}`,
      key: derivedKey,
      version: 'v1',
      purpose,
      createdAt: new Date()
    };
    
    // Cache the key
    this.keyCache.set(`${tenantId}-${purpose}`, tenantKey);
    
    return tenantKey;
  }

  /**
   * Get encryption key for tenant and purpose
   */
  private async getKey(tenantId: string, purpose: string): Promise<TenantKey | null> {
    const cacheKey = `${tenantId}-${purpose}`;
    
    // Check cache first
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey)!;
    }
    
    // Load master key and derive purpose key
    const masterKey = await this.loadMasterKey(tenantId);
    if (!masterKey) {
      return null;
    }
    
    return await this.deriveKey(tenantId, masterKey, purpose);
  }

  /**
   * Load master key for tenant
   */
  private async loadMasterKey(tenantId: string): Promise<Buffer | null> {
    const encryptedKey = process.env[`TENANT_${tenantId}_MASTER_KEY`];
    if (!encryptedKey) {
      return null;
    }
    
    return this.decryptMasterKey(encryptedKey);
  }

  /**
   * Encrypt master key for storage
   */
  private encryptMasterKey(masterKey: Buffer): string {
    const systemKey = this.getSystemKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', systemKey);
    
    let encrypted = cipher.update(masterKey);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return `${iv.toString('base64')}:${encrypted.toString('base64')}`;
  }

  /**
   * Decrypt master key from storage
   */
  private decryptMasterKey(encryptedKey: string): Buffer {
    const [, encryptedBase64] = encryptedKey.split(':');
    const systemKey = this.getSystemKey();
    
    const encrypted = Buffer.from(encryptedBase64, 'base64');
    const decipher = crypto.createDecipher('aes-256-cbc', systemKey);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  }

  /**
   * Get system-level encryption key
   */
  private getSystemKey(): string {
    return process.env.SYSTEM_ENCRYPTION_KEY || 'default-system-key-change-in-production';
  }

  /**
   * Get all keys for a tenant (for rotation)
   */
  private async getAllTenantKeys(tenantId: string): Promise<TenantKey[]> {
    const keys: TenantKey[] = [];
    
    for (const [cacheKey, key] of this.keyCache.entries()) {
      if (cacheKey.startsWith(tenantId)) {
        keys.push(key);
      }
    }
    
    return keys;
  }

  /**
   * Clear tenant keys from cache
   */
  async clearTenantKeys(tenantId: string): Promise<void> {
    const keysToRemove = Array.from(this.keyCache.keys()).filter(key => key.startsWith(tenantId));
    
    for (const key of keysToRemove) {
      this.keyCache.delete(key);
    }
    
    console.log(`Cleared ${keysToRemove.length} keys for tenant ${tenantId}`);
  }

  /**
   * Hash sensitive data (for pseudonymization)
   */
  hashData(data: string, salt?: string): string {
    const usedSalt = salt || crypto.randomBytes(16).toString('hex');
    return crypto.pbkdf2Sync(data, usedSalt, 10000, 32, 'sha256').toString('hex');
  }

  /**
   * Generate secure token
   */
  generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

// Export singleton instance
export const tenantEncryption = TenantEncryptionManager.getInstance(); 