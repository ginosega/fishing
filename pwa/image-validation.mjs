import fs from 'node:fs/promises';
import path from 'node:path';

export function detectImageType(bytes, filename='image') {
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9) return 'jpeg';
  const pngSignature = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  const pngEnd = Buffer.from([0x49,0x45,0x4e,0x44,0xae,0x42,0x60,0x82]);
  if (bytes.length >= 20 && bytes.subarray(0,8).equals(pngSignature) && bytes.subarray(-8).equals(pngEnd)) return 'png';
  if (isStructurallyValidWebp(bytes)) return 'webp';
  const gif = bytes.subarray(0,6).toString('ascii');
  if ((gif === 'GIF87a' || gif === 'GIF89a') && bytes.at(-1) === 0x3b) return 'gif';
  throw new Error(`Unsupported or structurally invalid image: ${filename}`);
}

export function assertExtensionMatches(filename, detected) {
  const ext = path.extname(filename).toLowerCase();
  const expected = detected === 'jpeg' ? ['.jpg','.jpeg'] : [`.${detected}`];
  if (!expected.includes(ext)) throw new Error(`Image extension does not match content for ${filename}: detected ${detected}`);
}

export async function readValidatedImage(filename) {
  let bytes;
  try { bytes = await fs.readFile(filename); }
  catch (error) { if (error.code === 'ENOENT') throw new Error(`Missing required image asset ${filename}.`); throw error; }
  if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new Error(`Invalid image size for ${filename}: ${bytes.length}`);
  const detected = detectImageType(bytes, filename);
  assertExtensionMatches(filename, detected);
  return bytes;
}

export function imageExtension(filename, bytes) {
  const detected = detectImageType(bytes, filename);
  return detected === 'jpeg' ? 'jpg' : detected;
}

function isStructurallyValidWebp(bytes) {
  if (bytes.length < 20 || bytes.subarray(0,4).toString('ascii') !== 'RIFF' || bytes.subarray(8,12).toString('ascii') !== 'WEBP') return false;
  if (bytes.readUInt32LE(4) + 8 !== bytes.length) return false;
  let offset = 12;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) return false;
    const chunkLength = bytes.readUInt32LE(offset + 4);
    offset += 8 + chunkLength + (chunkLength % 2);
    if (offset > bytes.length) return false;
  }
  return offset === bytes.length;
}
