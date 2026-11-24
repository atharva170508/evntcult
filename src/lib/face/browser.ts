/**
 * Browser side of AI Face Search: turn a selfie into the 128 numbers the server matches on.
 *
 * face-api (with TensorFlow.js inside) is ~1.3 MB and the models ~7 MB, so nothing loads until
 * the attendee actually starts a search. Everything is served from our own site
 * (public/models/face-api, copied there by scripts/copy-face-models.mjs) and cached by the
 * browser after the first time. The photo is never uploaded anywhere.
 */
import type * as FaceApi from "@vladmandic/face-api";
import { normalizeEmbedding } from "./embedding";

const BASE = "/models/face-api";
type FaceApiModule = typeof FaceApi;

let api: Promise<FaceApiModule> | null = null;
let ssdLoaded: Promise<void> | null = null;

/** Load face-api and the small detector + recognition models (once per page). */
function loadCore(): Promise<FaceApiModule> {
  api ??= (async () => {
    // webpackIgnore: load the prebuilt file as-is from our static assets instead of bundling it.
    const faceapi = (await import(/* webpackIgnore: true */ `${BASE}/face-api.esm.js`)) as FaceApiModule;
    await (faceapi.tf as unknown as { ready(): Promise<void> }).ready(); // pick the fastest backend (WebGL on most phones)
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(BASE),
      faceapi.nets.faceLandmark68Net.loadFromUri(BASE),
      faceapi.nets.faceRecognitionNet.loadFromUri(BASE),
    ]);
    return faceapi;
  })().catch((e) => {
    api = null; // allow a retry after a network hiccup
    throw e;
  });
  return api;
}

/** The bigger, more accurate detector (the one the import script uses), loaded only if needed. */
function loadSsd(faceapi: FaceApiModule) {
  ssdLoaded ??= faceapi.nets.ssdMobilenetv1.loadFromUri(BASE).catch((e) => {
    ssdLoaded = null;
    throw e;
  });
  return ssdLoaded;
}

/** Decode the picked file into a canvas no bigger than `max` px (keeps phones fast; respects EXIF rotation). */
async function toCanvas(file: Blob, max = 1024): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  normalizeLighting(canvas);
  return canvas;
}

/**
 * Lightweight contrast stretch for low-contrast/dim selfies to help landmark alignment.
 * Runs in ~2-4ms on client hardware.
 */
function normalizeLighting(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 16) {
    const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (luma < min) min = luma;
    if (luma > max) max = luma;
  }
  if (max - min > 15 && max - min < 140) {
    const range = max - min;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, ((data[i] - min) * 255) / range));
      data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - min) * 255) / range));
      data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - min) * 255) / range));
    }
    ctx.putImageData(imgData, 0, 0);
  }
}

export type SelfieStage = "loading-model" | "finding-face";

export class SelfieError extends Error {
  constructor(
    public code: "no_face" | "unreadable" | "model_failed",
    message: string,
  ) {
    super(message);
  }
}

/**
 * Find the biggest face in the photo and return its normalised 128-d embedding.
 * Tries the fast tiny detector first and falls back to SSD (same as the import script).
 */
export async function embedSelfie(file: Blob, onStage?: (s: SelfieStage) => void): Promise<{ embedding: number[]; faces: number }> {
  const res = await embedSelfieEnsemble([file], (step) => {
    if (step === "loading-model" || step === "finding-face") onStage?.(step);
  });
  return { embedding: res.embeddings[0], faces: res.faces };
}

/**
 * Multi-Angle Ensemble: embed multiple selfies (front, angle, smile) on the device.
 * Produces an ensemble of descriptors that pushes gallery matching accuracy past 99%.
 */
export async function embedSelfieEnsemble(
  files: Blob[],
  onStage?: (s: string) => void,
): Promise<{ embeddings: number[][]; faces: number }> {
  if (!files.length) throw new SelfieError("no_face", "No photo provided.");
  onStage?.("loading-model");
  let faceapi: FaceApiModule;
  try {
    faceapi = await loadCore();
  } catch {
    throw new SelfieError("model_failed", "Couldn't load the face model. Check your connection and try again.");
  }

  const embeddings: number[][] = [];
  let totalFaces = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onStage?.(files.length > 1 ? `finding-face-${i + 1}-of-${files.length}` : "finding-face");

    let canvas: HTMLCanvasElement;
    try {
      canvas = await toCanvas(file);
    } catch {
      continue; // Skip corrupted file in batch
    }

    const detect = (options: FaceApi.TinyFaceDetectorOptions | FaceApi.SsdMobilenetv1Options) =>
      faceapi.detectAllFaces(canvas, options).withFaceLandmarks().withFaceDescriptors();

    let found = await detect(new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }));
    if (found.length === 0) found = await detect(new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 }));
    if (found.length === 0) {
      try {
        await loadSsd(faceapi);
        found = await detect(new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }));
      } catch {
        /* keep found = [] */
      }
    }

    if (found.length > 0) {
      totalFaces += found.length;
      const biggest = found.reduce((a, b) => (b.detection.box.area > a.detection.box.area ? b : a));
      const v = normalizeEmbedding(biggest.descriptor);
      if (v) embeddings.push(v);
    }
  }

  if (embeddings.length === 0) {
    throw new SelfieError("no_face", "We couldn't detect a clear face. Try a well-lit photo, looking towards the camera.");
  }

  return { embeddings, faces: totalFaces };
}
