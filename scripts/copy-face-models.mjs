// Copies the face-api browser build and the model weights it needs into public/models/face-api,
// so the browser loads them from our own site (cached, no CDN, nothing in the Worker bundle).
// Runs automatically before `npm run dev` and `npm run build` (and so before cf:deploy).
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const pkg = path.resolve("node_modules/@vladmandic/face-api");
const out = path.resolve("public/models/face-api");
if (!existsSync(pkg)) {
  console.warn("[face-models] @vladmandic/face-api isn't installed; AI Face Search won't work. Run npm install.");
  process.exit(0);
}
mkdirSync(out, { recursive: true });
copyFileSync(path.join(pkg, "dist/face-api.esm.js"), path.join(out, "face-api.esm.js"));
for (const m of ["tiny_face_detector", "ssd_mobilenetv1", "face_landmark_68", "face_recognition"]) {
  for (const f of [`${m}_model-weights_manifest.json`, `${m}_model.bin`]) copyFileSync(path.join(pkg, "model", f), path.join(out, f));
}
console.log("[face-models] copied to public/models/face-api");
