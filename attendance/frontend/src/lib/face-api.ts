// face-api.ts — all face-api calls are browser-only
// This file uses dynamic imports to prevent SSR breakage.

let faceapi: any = null;
let modelsLoaded = false;

async function getFaceApi() {
  if (!faceapi) {
    faceapi = await import('@vladmandic/face-api');
  }
  return faceapi;
}

export async function loadFaceModels() {
  if (modelsLoaded) return;
  if (typeof window === 'undefined') return; // Server-side: do nothing
  const fa = await getFaceApi();
  const MODEL_URL = '/models';
  await Promise.all([
    fa.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    fa.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    fa.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
  ]);
  modelsLoaded = true;
  console.log('Face models loaded successfully');
}

export async function getFaceDescriptor(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<Float32Array | null> {
  if (typeof window === 'undefined') return null;
  await loadFaceModels();
  const fa = await getFaceApi();
  const detection = await fa
    .detectSingleFace(imageElement)
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!detection) return null;
  return detection.descriptor;
}

export function compareFaceDescriptors(
  descriptor1: Float32Array | number[],
  descriptor2: Float32Array | number[]
): boolean {
  if (typeof window === 'undefined') return false;
  if (!faceapi) return false;
  const arr1 = new Float32Array(descriptor1);
  const arr2 = new Float32Array(descriptor2);
  const distance = faceapi.euclideanDistance(arr1, arr2);
  // 0.55 threshold: lower is more strict
  return distance < 0.55;
}

export function distanceFaceDescriptors(
  descriptor1: Float32Array | number[],
  descriptor2: Float32Array | number[]
): number {
  if (!faceapi) return 999;
  const arr1 = new Float32Array(descriptor1);
  const arr2 = new Float32Array(descriptor2);
  return faceapi.euclideanDistance(arr1, arr2);
}
