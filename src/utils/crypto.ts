import { ec as EC } from 'elliptic';
import { keccak256 } from 'js-sha3';
import { blake2bHex } from 'blakejs';

// Import bs58 - handling browser environment
import bs58 from 'bs58';

const secp256k1 = new EC('secp256k1');

export interface KeyPair {
  privateKey: string;
  publicKey: string;
  ethAddress: string;
  revAddress: string;
}

const prefix = { coinId: "000000", version: "00" };

// Helper functions for encoding/decoding
const decodeBase16 = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
};

const encodeBase58 = (hex: string): string => {
  const bytes = decodeBase16(hex);
  return bs58.encode(Buffer.from(bytes));
};

// Generate new keypair
export const generateKeyPair = (): KeyPair => {
  try {
    const keyPair = secp256k1.genKeyPair();
    const privateKey = keyPair.getPrivate('hex').padStart(64, '0');
    const publicKey = keyPair.getPublic('hex');
    const ethAddress = deriveEthAddress(publicKey);
    const revAddress = deriveRevAddress(ethAddress);

    return {
      privateKey,
      publicKey,
      ethAddress,
      revAddress
    };
  } catch (error) {
    throw new Error('Failed to generate key pair');
  }
};

// Derive ETH address from public key (like F1R3FLY wallet)
export const deriveEthAddress = (publicKey: string): string => {
  // Decode public key to bytes
  const pubKeyBytes = decodeBase16(publicKey);
  // Remove first byte and hash (matching f1r3wallet implementation)
  const hash = keccak256(pubKeyBytes.slice(1));
  // Take last 40 characters from hash (20 bytes)
  const ethAddress = hash.slice(-40);
  return `0x${ethAddress}`;
};

export const deriveRevAddress = (ethAddress: string): string => {
  try {
    const ethAddr = ethAddress.replace(/^0x/, '');
    if (!ethAddr || ethAddr.length !== 40) {
      throw new Error('Invalid ETH address length');
    }

    // Hash ETH address with keccak256
    const ethAddrBytes = decodeBase16(ethAddr);
    const ethHash = keccak256(ethAddrBytes);

    // Add prefix with hash and calculate checksum (blake2b-256 hash)
    const payload = `${prefix.coinId}${prefix.version}${ethHash}`;
    const payloadBytes = decodeBase16(payload);
    const checksum = blake2bHex(payloadBytes, undefined, 32).slice(0, 8);

    return encodeBase58(`${payload}${checksum}`);
  } catch (error) {
    console.error('Error deriving ASI address:', error);
    throw new Error(`Failed to derive ASI address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Import private key
export const importPrivateKey = (privateKey: string): KeyPair => {
  try {
    const keyPair = secp256k1.keyFromPrivate(privateKey, 'hex');
    const publicKey = keyPair.getPublic('hex');
    const ethAddress = deriveEthAddress(publicKey);
    const revAddress = deriveRevAddress(ethAddress);

    return {
      privateKey,
      publicKey,
      ethAddress,
      revAddress
    };
  } catch (error) {
    throw new Error('Invalid private key');
  }
};
