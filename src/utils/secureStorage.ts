// Secure storage utilities (Web demo - NOT production hardened)

/**
 * Structure d'une charge utile chiffrée (Version 1).
 */
export interface EncryptedPayload {
  /** Le texte chiffré encodé en Base64. */
  cipherBase64: string;
  /** Le vecteur d'initialisation (IV) encodé en Base64. */
  ivBase64: string;
  /** Le sel cryptographique encodé en Base64. */
  saltBase64: string;
  /** La version du protocole de chiffrement (1 ou 2). */
  version: 1 | 2;
}

/**
 * Structure d'une charge utile chiffrée (Version 2 avec Argon2id et intégrité).
 */
interface EncryptedPayloadV2 extends EncryptedPayload {
  /** La fonction de dérivation de clé utilisée (toujours 'argon2id' pour v2). */
  kdf: 'argon2id';
  /** Hash de vérification de l'intégrité des données. */
  integrity: string;
}

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

/**
 * Convertit un tampon ou un tableau d'octets en chaîne Base64.
 *
 * @param {ArrayBuffer | Uint8Array} buf - Les données binaires à convertir.
 * @returns {string} La représentation Base64.
 */
function toBase64(buf: ArrayBuffer | Uint8Array) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/**
 * Convertit une chaîne Base64 en tableau d'octets.
 *
 * @param {string} b64 - La chaîne Base64 à décoder.
 * @returns {Uint8Array} Les données binaires décodées.
 */
function fromBase64(b64: string) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Storage keys
const KEY_ENCRYPTED = 'wallet.encryptedMnemonic.v';

// ------------------------------------------------------------------
// PBKDF2 (Version 1) - Legacy
// ------------------------------------------------------------------

/**
 * Dérive une clé de chiffrement à partir d'un mot de passe et d'un sel (PBKDF2).
 * Utilisé pour la compatibilité avec la version 1.
 *
 * @param {string} password - Le mot de passe de l'utilisateur.
 * @param {Uint8Array} salt - Le sel cryptographique.
 * @returns {Promise<CryptoKey>} La clé dérivée pour AES-GCM.
 */
export async function deriveKey(password: string, salt: Uint8Array) {
  const passKey = await crypto.subtle.importKey(
    'raw',
    TEXT_ENCODER.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Chiffre une phrase mnémonique avec un mot de passe (Version 1 - PBKDF2).
 *
 * @param {string} plaintext - La phrase mnémonique à chiffrer.
 * @param {string} password - Le mot de passe de chiffrement.
 * @returns {Promise<EncryptedPayload>} La charge utile chiffrée.
 */
export async function encryptMnemonic(plaintext: string, password: string): Promise<EncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt);
  const data = TEXT_ENCODER.encode(plaintext);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  return {
    cipherBase64: toBase64(cipher),
    ivBase64: toBase64(iv),
    saltBase64: toBase64(salt),
    version: 1,
  };
}

/**
 * Déchiffre une charge utile chiffrée avec un mot de passe (Version 1).
 *
 * @param {EncryptedPayload} payload - La charge utile chiffrée.
 * @param {string} password - Le mot de passe de déchiffrement.
 * @returns {Promise<string>} La phrase mnémonique déchiffrée.
 */
export async function decryptMnemonic(payload: EncryptedPayload, password: string): Promise<string> {
  const iv = fromBase64(payload.ivBase64);
  const salt = fromBase64(payload.saltBase64);
  const cipher = fromBase64(payload.cipherBase64);
  const key = await deriveKey(password, salt);
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return TEXT_DECODER.decode(plainBuf);
}

// ------------------------------------------------------------------
// Argon2id (Version 2) - Upgraded
// ------------------------------------------------------------------

/**
 * Vérifie si une migration vers la version 2 du chiffrement est nécessaire.
 *
 * @param {EncryptedPayload | null} payload - La charge utile actuelle.
 * @returns {boolean} True si la charge utile est en version 1, sinon False.
 */
export function isMigrationNeeded(payload: EncryptedPayload | null) {
  return !!payload && payload.version === 1;
}

/**
 * Calcule le hash SHA-256 des données fournies.
 *
 * @param {Uint8Array} data - Les données à hasher.
 * @returns {Promise<string>} Le hash encodé en Base64.
 */
async function sha256(data: Uint8Array) {
  const h = await crypto.subtle.digest('SHA-256', data);
  return toBase64(h);
}

/**
 * Dérive une clé de chiffrement en utilisant Argon2id.
 *
 * @param {string} password - Le mot de passe de l'utilisateur.
 * @param {Uint8Array} salt - Le sel cryptographique.
 * @returns {Promise<CryptoKey>} La clé importée pour AES-GCM.
 */
export async function deriveKeyArgon2(password: string, salt: Uint8Array) {
  const { hash } = await import('argon2-browser');
  const passBuf = TEXT_ENCODER.encode(password);
  const argon = await hash({
    pass: passBuf,
    salt,
    time: 3,
    mem: 65536,
    hashLen: 32,
    parallelism: 2,
    type: 2, // Argon2id
  });
  return crypto.subtle.importKey('raw', argon.hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

/**
 * Chiffre une phrase mnémonique avec Argon2id (Version 2).
 * Inclut une vérification d'intégrité.
 *
 * @param {string} plaintext - La phrase mnémonique à chiffrer.
 * @param {string} password - Le mot de passe de chiffrement.
 * @returns {Promise<EncryptedPayloadV2>} La charge utile chiffrée V2.
 */
export async function encryptMnemonicV2(plaintext: string, password: string): Promise<EncryptedPayloadV2> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKeyArgon2(password, salt);
  const data = TEXT_ENCODER.encode(plaintext);
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const integrity = await sha256(new Uint8Array([...data, ...salt]));
  return {
    cipherBase64: toBase64(cipherBuf),
    ivBase64: toBase64(iv),
    saltBase64: toBase64(salt),
    version: 2,
    kdf: 'argon2id',
    integrity,
  };
}

/**
 * Déchiffre une charge utile (V1 ou V2) avec le mot de passe fourni.
 * Gère automatiquement la méthode de dérivation de clé appropriée (PBKDF2 ou Argon2id).
 *
 * @param {EncryptedPayload | EncryptedPayloadV2} payload - La charge utile chiffrée.
 * @param {string} password - Le mot de passe de déchiffrement.
 * @returns {Promise<string>} La phrase mnémonique déchiffrée.
 * @throws {Error} Si la vérification d'intégrité échoue (V2).
 */
export async function decryptMnemonicAny(
  payload: EncryptedPayload | EncryptedPayloadV2,
  password: string
): Promise<string> {
  const iv = fromBase64(payload.ivBase64);
  const salt = fromBase64(payload.saltBase64);
  const cipher = fromBase64(payload.cipherBase64);
  let key: CryptoKey;
  if ((payload as any).kdf === 'argon2id') {
    key = await deriveKeyArgon2(password, salt);
  } else {
    key = await deriveKey(password, salt);
  }
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  const text = TEXT_DECODER.decode(plainBuf);
  if ((payload as any).kdf === 'argon2id') {
    const integrityCheck = await sha256(new Uint8Array([...TEXT_ENCODER.encode(text), ...salt]));
    if (integrityCheck !== (payload as any).integrity) throw new Error('Integrity failed');
  }
  return text;
}

// ------------------------------------------------------------------
// Storage helpers
// ------------------------------------------------------------------

/**
 * Stocke la mnémonique chiffrée dans le stockage local (localStorage).
 *
 * @param {EncryptedPayload | EncryptedPayloadV2} payload - La charge utile à stocker.
 */
export function storeEncryptedMnemonic(payload: EncryptedPayload | EncryptedPayloadV2) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(KEY_ENCRYPTED, JSON.stringify(payload));
  }
}

/**
 * Charge la mnémonique chiffrée depuis le stockage local.
 *
 * @returns {EncryptedPayload | EncryptedPayloadV2 | null} La charge utile chiffrée ou null si non trouvée.
 */
export function loadEncryptedMnemonic(): EncryptedPayload | EncryptedPayloadV2 | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(KEY_ENCRYPTED);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Supprime la mnémonique chiffrée du stockage local.
 */
export function clearEncryptedMnemonic() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(KEY_ENCRYPTED);
  }
}
