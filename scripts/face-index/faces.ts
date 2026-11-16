/**
 * Face detection + 128-d embeddings in Node, with the SAME face-api weights the browser uses
 * (src/lib/face/browser.ts), so selfie and photo embeddings are directly comparable.
 *
 * Runs TensorFlow.js on its WebAssembly backend: pure npm packages, no native build, works the
 * same on Apple-silicon Macs, Intel Macs, Windows and Linux.
 */
import path from "node:path";
import * as tf from "@tensorflow/tfjs";
import { setWasmPaths } from "@tensorflow/tfjs-backend-wasm";
import * as faceapi from "@vladmandic/face-api/dist/face-api.node-wasm.js";
import jpeg from "jpeg-js";
import { normalizeEmbedding } from "../../src/lib/face/embedding";

const MODELS = path.resolve("node_modules/@vladmandic/face-api/model");
/** Longest side used for detection. Big enough for faces at the back of a group shot. */
const DETECT_MAX = 2400;
/** Longest side of the preview thumbnail (≈80–180 KB as JPEG). */
const THUMB_MAX = 800;
/** Faces smaller than this (in px, at DETECT_MAX scale) give unreliable embeddings, so they're skipped. */
const MIN_FACE_PX = 32;

let ready: Promise<void> | null = null;

export function initFaces(): Promise<void> {
  ready ??= (async () => {
    setWasmPaths(path.resolve("node_modules/@tensorflow/tfjs-backend-wasm/dist") + path.sep);
    await tf.setBackend("wasm");
    await tf.ready();
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS);
    await faceapi.nets.tinyFaceDetector.loadFromDisk(MODELS);
  })();
  return ready;
}

export interface AnalyzedPhoto {
  width: number;
  height: number;
  /** One normalised 128-d embedding per usable face. */
  faces: number[][];
  /** Faces found but skipped as too small. */
  skippedSmall: number;
  /** JPEG preview, THUMB_MAX px on the longest side. */
  thumbnail: Uint8Array;
}

export class UnsupportedImageError extends Error {}

function isJpeg(b: Uint8Array) {
  return b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
}

/** Decode a JPEG, find faces, embed them, and make the thumbnail. */
export async function analyzePhoto(bytes: Uint8Array, opts: { minConfidence?: number } = {}): Promise<AnalyzedPhoto> {
  await initFaces();
  if (!isJpeg(bytes)) throw new UnsupportedImageError("not a JPEG (export the album as JPEG; RAW/HEIC/PNG aren't supported)");
  const img = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: false, maxMemoryUsageInMB: 1536, maxResolutionInMP: 120 });

  const full = tf.tensor3d(img.data, [img.height, img.width, 3], "int32");
  const fit = (max: number) => {
    const s = Math.min(1, max / Math.max(img.width, img.height));
    return [Math.round(img.height * s), Math.round(img.width * s)] as [number, number];
  };
  try {
    const detectSize = fit(DETECT_MAX);
    const detectInput = tf.tidy(() => (detectSize[0] === img.height ? full.clone() : tf.cast(tf.image.resizeBilinear(full, detectSize), "int32"))) as tf.Tensor3D;
    let found;
    try {
      const run = (o: faceapi.SsdMobilenetv1Options | faceapi.TinyFaceDetectorOptions) =>
        faceapi.detectAllFaces(detectInput as unknown as faceapi.TNetInput, o).withFaceLandmarks().withFaceDescriptors();
      found = await run(new faceapi.SsdMobilenetv1Options({ minConfidence: opts.minConfidence ?? 0.5, maxResults: 200 }));
      // SSD often misses one big face filling the frame (close-ups, phone portraits); the tiny
      // detector (the one the website uses for selfies) catches those.
      if (found.length === 0) found = await run(new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }));
    } finally {
      detectInput.dispose();
    }
    const faces: number[][] = [];
    let skippedSmall = 0;
    for (const f of found) {
      const box = f.detection.box;
      if (Math.min(box.width, box.height) < MIN_FACE_PX) {
        skippedSmall++;
        continue;
      }
      const v = normalizeEmbedding(f.descriptor);
      if (v) faces.push(v);
    }

    const [th, tw] = fit(THUMB_MAX);
    const rgba = tf.tidy(() => {
      const small = tf.image.resizeBilinear(full, [th, tw]);
      const alpha = tf.fill([th, tw, 1], 255);
      return tf.cast(tf.concat([tf.clipByValue(small, 0, 255), alpha], 2), "int32");
    });
    const pixels = Buffer.from(Uint8Array.from(await rgba.data()));
    rgba.dispose();
    const thumbnail = new Uint8Array(jpeg.encode({ data: pixels, width: tw, height: th }, 76).data);

    return { width: img.width, height: img.height, faces, skippedSmall, thumbnail };
  } finally {
    full.dispose();
  }
}

/**
 * Embed a selfie exactly like the website does (src/lib/face/browser.ts): image scaled to 1024 px,
 * tiny detector at 320 then 224, then SSD as a last resort; the biggest face wins.
 * (SSD alone often misses faces that fill the frame, which selfies do.)
 */
export async function embedSelfieLikeBrowser(bytes: Uint8Array): Promise<{ embedding: number[]; faces: number } | null> {
  await initFaces();
  if (!isJpeg(bytes)) throw new UnsupportedImageError("not a JPEG");
  const img = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: false, maxMemoryUsageInMB: 1536, maxResolutionInMP: 120 });
  const s = Math.min(1, 1024 / Math.max(img.width, img.height));
  const input = tf.tidy(() => {
    const full = tf.tensor3d(img.data, [img.height, img.width, 3], "int32");
    return (s === 1 ? full : tf.cast(tf.image.resizeBilinear(full, [Math.round(img.height * s), Math.round(img.width * s)]), "int32")) as tf.Tensor3D;
  });
  try {
    const run = (o: faceapi.TinyFaceDetectorOptions | faceapi.SsdMobilenetv1Options) =>
      faceapi.detectAllFaces(input as unknown as faceapi.TNetInput, o).withFaceLandmarks().withFaceDescriptors();
    let found = await run(new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }));
    if (!found.length) found = await run(new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 }));
    if (!found.length) found = await run(new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }));
    if (!found.length) return null;
    const biggest = found.reduce((a, b) => (b.detection.box.area > a.detection.box.area ? b : a));
    const embedding = normalizeEmbedding(biggest.descriptor);
    return embedding ? { embedding, faces: found.length } : null;
  } finally {
    input.dispose();
  }
}
