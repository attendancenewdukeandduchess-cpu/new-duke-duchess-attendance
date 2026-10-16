// face-api.ts — all face-api calls are browser-only
// This file uses dynamic imports and cached model loading to prevent SSR breakage.

let faceapi: any = null;
let modelsLoaded = false;
let modelsLoadingPromise: Promise<void> | null = null;

export async function getFaceApi() {
  if (!faceapi) {
    faceapi = await import('@vladmandic/face-api');
  }
  return faceapi;
}

export async function loadFaceModels() {
  if (modelsLoaded) return;
  if (typeof window === 'undefined') return;

  if (modelsLoadingPromise) {
    return modelsLoadingPromise;
  }

  modelsLoadingPromise = (async () => {
    const fa = await getFaceApi();
    const MODEL_URL = '/models';
    try {
      // Load Tiny Face Detector first (fastest, lightweight)
      await fa.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    } catch (e) {
      console.warn('TinyFaceDetector load notice:', e);
    }

    try {
      // Load 68 Landmark model
      await fa.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    } catch (e) {
      console.warn('faceLandmark68Net load notice:', e);
    }

    try {
      // Load Face Recognition model for 128-d biometric embeddings
      await fa.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    } catch (e) {
      console.warn('faceRecognitionNet load notice:', e);
    }

    try {
      // Also load SSD MobileNet if available for fallback
      await fa.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    } catch (e) {
      console.warn('ssdMobilenetv1 load notice:', e);
    }

    modelsLoaded = true;
    console.log('Biometric face recognition models initialized successfully');
  })();

  return modelsLoadingPromise;
}

export interface DetectedFaceData {
  box: { x: number; y: number; width: number; height: number };
  landmarks: { x: number; y: number }[];
  score: number;
}

/**
 * Real-time fast face landmark detection for live video frames (runs at high FPS)
 */
export async function detectLiveFace(
  element: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
): Promise<DetectedFaceData | null> {
  if (typeof window === 'undefined') return null;
  await loadFaceModels();
  const fa = await getFaceApi();

  try {
    let detection: any = null;

    // First attempt with TinyFaceDetector for maximum frame rate
    if (fa.nets.tinyFaceDetector.isLoaded) {
      const options = new fa.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.35 });
      detection = await fa.detectSingleFace(element, options).withFaceLandmarks();
    }

    // Fallback to SSD if Tiny is not available or missed
    if (!detection && fa.nets.ssdMobilenetv1.isLoaded) {
      const options = new fa.SsdMobilenetv1Options({ minConfidence: 0.35 });
      detection = await fa.detectSingleFace(element, options).withFaceLandmarks();
    }

    if (!detection) return null;

    const box = detection.detection.box;
    const landmarks = detection.landmarks.positions.map((p: any) => ({ x: p.x, y: p.y }));

    return {
      box: { x: box.x, y: box.y, width: box.width, height: box.height },
      landmarks,
      score: detection.detection.score || 0.95
    };
  } catch (err) {
    console.error('Error during live face detection:', err);
    return null;
  }
}

export async function getFaceDescriptor(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<Float32Array | null> {
  if (typeof window === 'undefined') return null;
  await loadFaceModels();
  const fa = await getFaceApi();

  try {
    // Try SSD first for highest accuracy descriptor
    if (fa.nets.ssdMobilenetv1.isLoaded && fa.nets.faceRecognitionNet.isLoaded) {
      const detection = await fa
        .detectSingleFace(imageElement, new fa.SsdMobilenetv1Options({ minConfidence: 0.35 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (detection?.descriptor) return detection.descriptor;
    }

    // Fallback to TinyFaceDetector
    if (fa.nets.tinyFaceDetector.isLoaded && fa.nets.faceRecognitionNet.isLoaded) {
      const detection = await fa
        .detectSingleFace(imageElement, new fa.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (detection?.descriptor) return detection.descriptor;
    }
  } catch (err) {
    console.error('Error getting face descriptor:', err);
  }

  return null;
}

export function compareFaceDescriptors(
  descriptor1: Float32Array | number[],
  descriptor2: Float32Array | number[],
  threshold = 0.55
): boolean {
  if (typeof window === 'undefined') return false;
  if (!faceapi) return false;
  const arr1 = new Float32Array(descriptor1);
  const arr2 = new Float32Array(descriptor2);
  const distance = faceapi.euclideanDistance(arr1, arr2);
  return distance < threshold;
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
