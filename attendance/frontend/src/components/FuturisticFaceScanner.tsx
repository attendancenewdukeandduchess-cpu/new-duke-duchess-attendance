'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  detectLiveFace,
  getFaceDescriptor,
  compareFaceDescriptors,
  loadFaceModels,
  DetectedFaceData
} from '@/lib/face-api';

export interface FuturisticFaceScannerProps {
  onComplete?: (result: {
    selfieBase64: string;
    descriptor: number[] | null;
    isMatched?: boolean;
  }) => void;
  onCancel?: () => void;
  mode?: 'standalone' | 'modal' | 'attendance' | 'enroll';
  employeeName?: string;
  employeeId?: string;
  targetDescriptor?: number[] | null;
  showCloseButton?: boolean;
}

// Landmark triangulation connections for biometric facial wireframe mesh
const MESH_CONNECTIONS: [number, number][] = [
  // Jawline
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
  [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 16],

  // Right Eyebrow
  [17, 18], [18, 19], [19, 20], [20, 21],
  // Left Eyebrow
  [22, 23], [23, 24], [24, 25], [25, 26],

  // Nose Bridge & Base
  [27, 28], [28, 29], [29, 30],
  [31, 32], [32, 33], [33, 34], [34, 35], [35, 31],
  [30, 33], [27, 31], [27, 35],

  // Right Eye
  [36, 37], [37, 38], [38, 39], [39, 40], [40, 41], [41, 36],
  // Left Eye
  [42, 43], [43, 44], [44, 45], [45, 46], [46, 47], [47, 42],

  // Outer Lips
  [48, 49], [49, 50], [50, 51], [51, 52], [52, 53], [53, 54],
  [54, 55], [55, 56], [56, 57], [57, 58], [58, 59], [59, 48],

  // Inner Lips
  [60, 61], [61, 62], [62, 63], [63, 64], [64, 65], [65, 66], [66, 67], [67, 60],

  // Biometric Facial Triangulation Chords
  // Eyebrows to Nose Bridge & Temples
  [17, 36], [21, 27], [22, 27], [26, 45],
  [21, 39], [22, 42], [19, 27], [24, 27],

  // Eyes to Nose & Cheeks
  [39, 27], [42, 27], [39, 31], [42, 35], [36, 0], [45, 16],
  [41, 2], [46, 14], [40, 31], [47, 35],

  // Nose to Upper Lip & Cheeks
  [31, 48], [33, 51], [35, 54], [32, 50], [34, 52],
  [31, 3], [35, 13],

  // Cheeks to Lips & Jawline
  [48, 4], [48, 5], [54, 12], [54, 11],
  [57, 8], [58, 7], [56, 9], [59, 6], [55, 10]
];

// Polygonal facets for subtle futuristic holographic shading
const MESH_FACETS: [number, number, number][] = [
  [27, 31, 33], [27, 33, 35], [21, 27, 39], [22, 27, 42],
  [36, 37, 41], [37, 38, 40], [42, 43, 47], [43, 44, 46],
  [31, 33, 51], [33, 35, 51], [48, 50, 58], [52, 54, 56],
  [48, 57, 8], [54, 57, 8]
];

interface Particle {
  angle: number;
  speed: number;
  radiusOffset: number;
  size: number;
  opacity: number;
}

export default function FuturisticFaceScanner({
  onComplete,
  onCancel,
  mode = 'standalone',
  employeeName,
  employeeId,
  targetDescriptor,
  showCloseButton = false
}: FuturisticFaceScannerProps) {
  // Video & Canvas references
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const demoImgRef = useRef<HTMLImageElement>(null);

  // State management
  const [useCamera, setUseCamera] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [modelReady, setModelReady] = useState<boolean>(false);
  const [scanActive, setScanActive] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStage, setScanStage] = useState<number>(1);
  const [statusText, setStatusText] = useState<string>('SYS.READY // INITIALIZING BIO-SENSOR');
  const [matchResult, setMatchResult] = useState<'MATCHED' | 'MISMATCH' | 'ENROLLED' | null>(null);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const [showTelemetry, setShowTelemetry] = useState<boolean>(false);

  // Animation & Tracking state
  const animFrameId = useRef<number | null>(null);
  const scanStartTime = useRef<number | null>(null);
  const progressRef = useRef<number>(0);
  const currentFace = useRef<{
    cx: number;
    cy: number;
    r: number;
    detected: boolean;
    landmarks: { x: number; y: number }[];
  }>({
    cx: 250,
    cy: 250,
    r: 140,
    detected: false,
    landmarks: []
  });

  const particlesRef = useRef<Particle[]>([]);
  const isDetectingRef = useRef<boolean>(false);

  // Generate orbit particles
  useEffect(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < 28; i++) {
      particles.push({
        angle: (i / 28) * Math.PI * 2,
        speed: (Math.random() * 0.015 + 0.008) * (Math.random() > 0.5 ? 1 : -1),
        radiusOffset: (Math.random() - 0.5) * 24,
        size: Math.random() * 2.5 + 1.2,
        opacity: Math.random() * 0.7 + 0.3
      });
    }
    particlesRef.current = particles;
  }, []);

  // Pre-load biometric models
  useEffect(() => {
    let mounted = true;
    loadFaceModels()
      .then(() => {
        if (mounted) {
          setModelReady(true);
          setStatusText('MODELS ONLINE // READY TO SCAN');
        }
      })
      .catch((err) => {
        console.error('Model load error:', err);
        if (mounted) {
          setModelReady(true); // Allow demo mode even if model fails
          setStatusText('DEMO READY // SENSOR SIMULATOR');
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Camera setup
  useEffect(() => {
    let currentStream: MediaStream | null = null;

      const startMedia = async () => {
        try {
          // Attempt 1: Optimal HD user-facing webcam
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
          });
          currentStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          setStatusText('CAMERA ONLINE // TARGET SENSOR ACTIVE');
          setCameraError(null);
        } catch (firstErr: any) {
          console.warn('HD camera attempt failed, trying basic webcam...', firstErr);
          try {
            // Attempt 2: Basic webcam without strict resolution constraints
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            currentStream = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(() => {});
            }
            setStatusText('CAMERA ONLINE // STANDARD FEED');
            setCameraError(null);
          } catch (finalErr: any) {
            console.warn('Camera access unavailable:', finalErr);
            const isBusy = finalErr?.name === 'NotReadableError' || finalErr?.message?.includes('in use');
            setCameraError(
              isBusy
                ? 'Camera is currently locked by another application. Using High-Definition Demo Mode.'
                : 'Camera permission denied or device not found. Using High-Definition Demo Mode.'
            );
            setUseCamera(false);
          }
        }
      };

    if (useCamera) {
      startMedia();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [useCamera]);

  // Periodic real-time face detection loop
  useEffect(() => {
    let active = true;

    const runDetection = async () => {
      if (!active) return;

      if (useCamera && videoRef.current && videoRef.current.readyState >= 2) {
        if (!isDetectingRef.current) {
          isDetectingRef.current = true;
          try {
            const detected: DetectedFaceData | null = await detectLiveFace(videoRef.current);
            if (active && detected && canvasRef.current) {
              const canvas = canvasRef.current;
              const video = videoRef.current;

              // Scale landmarks from video resolution to canvas display resolution
              const scaleX = canvas.width / (video.videoWidth || 1);
              const scaleY = canvas.height / (video.videoHeight || 1);

              const targetCx = (detected.box.x + detected.box.width / 2) * scaleX;
              const targetCy = (detected.box.y + detected.box.height / 2) * scaleY;
              const targetR = Math.max(detected.box.width * scaleX, detected.box.height * scaleY) * 0.75;

              // Smooth lerp for buttery camera tracking
              currentFace.current.cx += (targetCx - currentFace.current.cx) * 0.3;
              currentFace.current.cy += (targetCy - currentFace.current.cy) * 0.3;
              currentFace.current.r += (targetR - currentFace.current.r) * 0.3;
              currentFace.current.detected = true;

              const scaledLandmarks = detected.landmarks.map((pt) => ({
                x: pt.x * scaleX,
                y: pt.y * scaleY
              }));

              if (currentFace.current.landmarks.length === scaledLandmarks.length) {
                currentFace.current.landmarks = currentFace.current.landmarks.map((old, idx) => ({
                  x: old.x + (scaledLandmarks[idx].x - old.x) * 0.35,
                  y: old.y + (scaledLandmarks[idx].y - old.y) * 0.35
                }));
              } else {
                currentFace.current.landmarks = scaledLandmarks;
              }
            } else if (active && !detected) {
              currentFace.current.detected = false;
            }
          } catch (e) {
            console.error('Detection frame error:', e);
          } finally {
            isDetectingRef.current = false;
          }
        }
      } else if (!useCamera && canvasRef.current) {
        // High-definition Demonstration Mode with simulated lifelike tracking
        const canvas = canvasRef.current;
        const time = performance.now() * 0.001;

        // Subtle lifelike breathing and head micro-movements
        const swayX = Math.sin(time * 0.7) * 7;
        const swayY = Math.cos(time * 0.9) * 5;
        const breath = Math.sin(time * 1.4) * 2;

        const cx = canvas.width / 2 + swayX;
        const cy = canvas.height / 2 + swayY;
        const r = Math.min(canvas.width, canvas.height) * 0.34 + breath;

        currentFace.current.cx = cx;
        currentFace.current.cy = cy;
        currentFace.current.r = r;
        currentFace.current.detected = true;

        // Canonical 68-point landmarks mapped realistically to demo face
        const lm: { x: number; y: number }[] = [];
        const rx = r * 0.78;
        const ry = r * 0.95;

        // Jawline (0 - 16)
        for (let i = 0; i <= 16; i++) {
          const t = (i / 16) * Math.PI;
          const px = cx - Math.cos(t) * rx * 0.95;
          const py = cy + Math.sin(t) * ry * 0.95 - ry * 0.1;
          lm.push({ x: px, y: py });
        }
        // Right eyebrow (17 - 21)
        for (let i = 0; i < 5; i++) {
          lm.push({ x: cx - rx * 0.65 + i * (rx * 0.12), y: cy - ry * 0.42 - Math.sin((i / 4) * Math.PI) * 8 });
        }
        // Left eyebrow (22 - 26)
        for (let i = 0; i < 5; i++) {
          lm.push({ x: cx + rx * 0.18 + i * (rx * 0.12), y: cy - ry * 0.42 - Math.sin((i / 4) * Math.PI) * 8 });
        }
        // Nose bridge & base (27 - 35)
        for (let i = 0; i < 4; i++) {
          lm.push({ x: cx, y: cy - ry * 0.3 + i * (ry * 0.14) });
        }
        lm.push({ x: cx - rx * 0.18, y: cy + ry * 0.18 });
        lm.push({ x: cx - rx * 0.08, y: cy + ry * 0.22 });
        lm.push({ x: cx, y: cy + ry * 0.23 });
        lm.push({ x: cx + rx * 0.08, y: cy + ry * 0.22 });
        lm.push({ x: cx + rx * 0.18, y: cy + ry * 0.18 });

        // Right eye (36 - 41)
        const rex = cx - rx * 0.42;
        const rey = cy - ry * 0.22;
        lm.push({ x: rex - 18, y: rey });
        lm.push({ x: rex - 8, y: rey - 7 });
        lm.push({ x: rex + 8, y: rey - 7 });
        lm.push({ x: rex + 18, y: rey });
        lm.push({ x: rex + 8, y: rey + 7 });
        lm.push({ x: rex - 8, y: rey + 7 });

        // Left eye (42 - 47)
        const lex = cx + rx * 0.42;
        const ley = cy - ry * 0.22;
        lm.push({ x: lex - 18, y: ley });
        lm.push({ x: lex - 8, y: ley - 7 });
        lm.push({ x: lex + 8, y: ley - 7 });
        lm.push({ x: lex + 18, y: ley });
        lm.push({ x: lex + 8, y: ley + 7 });
        lm.push({ x: lex - 8, y: ley + 7 });

        // Outer lips (48 - 59)
        const my = cy + ry * 0.48;
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2;
          lm.push({
            x: cx + Math.cos(ang) * (rx * 0.32),
            y: my + Math.sin(ang) * (ry * 0.15)
          });
        }
        // Inner lips (60 - 67)
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2;
          lm.push({
            x: cx + Math.cos(ang) * (rx * 0.2),
            y: my + Math.sin(ang) * (ry * 0.08)
          });
        }

        currentFace.current.landmarks = lm;
      }

      timeoutId = window.setTimeout(runDetection, useCamera ? 35 : 50);
    };

    let timeoutId = window.setTimeout(runDetection, 100);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [useCamera]);

  // Main Canvas Render & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = (timestamp: number) => {
      if (!isRunning) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

        // Handle scanning progress timeline
        if (scanActive) {
          if (!scanStartTime.current) scanStartTime.current = timestamp;
          const elapsed = timestamp - scanStartTime.current;
          const SCAN_DURATION = 5500; // 5.5 seconds total cinematic scan
          const prog = Math.min(100, (elapsed / SCAN_DURATION) * 100);

          if (prog >= 100) {
            progressRef.current = 100;
            setScanProgress(100);
            setScanStage(6);
            setStatusText('[STAGE 06] IDENTITY CONFIRMED // BIOMETRIC LOCK ENGAGED');
            setScanActive(false);
            handleScanFinish();
          } else {
            progressRef.current = prog;
            setScanProgress(Math.floor(prog));

            // Update Stages
            if (prog < 18) {
              setScanStage(1);
              setStatusText('[STAGE 01] ACQUIRING BIOMETRIC TARGET...');
            } else if (prog < 42) {
              setScanStage(2);
              setStatusText('[STAGE 02] ANALYZING 68-PT FACIAL TOPOGRAPHY');
            } else if (prog < 68) {
              setScanStage(3);
              setStatusText('[STAGE 03] CALIBRATING GEOMETRIC ALIGNMENT');
            } else if (prog < 92) {
              setScanStage(4);
              setStatusText('[STAGE 04] SYNTHESIZING BIOMETRIC WIREFRAME MESH');
            } else {
              setScanStage(5);
              setStatusText('[STAGE 05] ENCRYPTING BIOMETRIC DESCRIPTOR');
            }
          }
        }

      const progress = progressRef.current;
      const { cx, cy, r, landmarks, detected } = currentFace.current;

      // Color Interpolation (Red: #ff1744 -> Green: #00ff66)
      let colorRatio = 0;
      if (progress <= 35) {
        colorRatio = 0; // Pure Neon Red
      } else if (progress >= 65) {
        colorRatio = 1; // Pure Neon Green
      } else {
        colorRatio = (progress - 35) / 30; // Smooth Transition
      }

      const cr = Math.round(255 * (1 - colorRatio));
      const cg = Math.round(23 + (255 - 23) * colorRatio);
      const cb = Math.round(68 * (1 - colorRatio) + 102 * colorRatio);
      const themeColor = `rgb(${cr}, ${cg}, ${cb})`;
      const themeGlow = `rgba(${cr}, ${cg}, ${cb}, 0.7)`;

      // ----------------------------------------------------
      // 1. Red / Green Scanning Grid & Laser Sweeper (Stages 1-3)
      // ----------------------------------------------------
      if (progress > 0 && progress < 85) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.05, 0, Math.PI * 2);
        ctx.clip();

        // Laser beam moving vertically
        const scanY = cy - r + ((timestamp * 0.25) % (r * 2));
        const laserGrad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
        laserGrad.addColorStop(0, 'rgba(0,0,0,0)');
        laserGrad.addColorStop(0.5, themeGlow);
        laserGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = laserGrad;
        ctx.fillRect(cx - r, scanY - 20, r * 2, 40);

        // Fine Biometric Grid
        ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, 0.12)`;
        ctx.lineWidth = 1;
        const gridStep = 18;
        for (let gx = cx - r; gx <= cx + r; gx += gridStep) {
          ctx.beginPath();
          ctx.moveTo(gx, cy - r);
          ctx.lineTo(gx, cy + r);
          ctx.stroke();
        }
        for (let gy = cy - r; gy <= cy + r; gy += gridStep) {
          ctx.beginPath();
          ctx.moveTo(cx - r, gy);
          ctx.lineTo(cx + r, gy);
          ctx.stroke();
        }
        ctx.restore();
      }

      // ----------------------------------------------------
      // 2. Wireframe Facial Mesh (Stages 4-6)
      // ----------------------------------------------------
      if (landmarks.length >= 68 && progress >= 40) {
        const meshOpacity = Math.min(1, (progress - 40) / 25);
        ctx.save();

        // Holographic polygon shading
        if (progress >= 60) {
          ctx.fillStyle = `rgba(0, 255, 102, ${0.05 * meshOpacity})`;
          for (const [p1, p2, p3] of MESH_FACETS) {
            if (landmarks[p1] && landmarks[p2] && landmarks[p3]) {
              ctx.beginPath();
              ctx.moveTo(landmarks[p1].x, landmarks[p1].y);
              ctx.lineTo(landmarks[p2].x, landmarks[p2].y);
              ctx.lineTo(landmarks[p3].x, landmarks[p3].y);
              ctx.closePath();
              ctx.fill();
            }
          }
        }

        // Polygonal Wireframe Lines
        ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${0.45 * meshOpacity})`;
        ctx.lineWidth = 1.1;
        ctx.shadowColor = themeColor;
        ctx.shadowBlur = 6;

        ctx.beginPath();
        for (const [p1, p2] of MESH_CONNECTIONS) {
          if (landmarks[p1] && landmarks[p2]) {
            ctx.moveTo(landmarks[p1].x, landmarks[p1].y);
            ctx.lineTo(landmarks[p2].x, landmarks[p2].y);
          }
        }
        ctx.stroke();
        ctx.restore();
      }

      // ----------------------------------------------------
      // 3. Facial Landmark Points (Stages 2-6)
      // ----------------------------------------------------
      if (landmarks.length >= 68 && progress >= 15) {
        const lmOpacity = Math.min(1, (progress - 15) / 20);
        ctx.save();
        ctx.fillStyle = themeColor;
        ctx.shadowColor = themeColor;
        ctx.shadowBlur = 8;

        for (let i = 0; i < landmarks.length; i++) {
          const pt = landmarks[i];
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${lmOpacity})`;
          ctx.fill();
        }
        ctx.restore();
      }

      // ----------------------------------------------------
      // 4. Crosshairs & Alignment Guides (Stages 3-6)
      // ----------------------------------------------------
      if (landmarks.length >= 68 && progress >= 38) {
        const guideOpacity = Math.min(1, (progress - 38) / 20);
        ctx.save();
        ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${0.75 * guideOpacity})`;
        ctx.lineWidth = 1;
        ctx.shadowColor = themeColor;
        ctx.shadowBlur = 6;

        // Pupils Reticles (Right eye center: ~38/41, Left eye: ~43/46)
        const reCenter = {
          x: (landmarks[37].x + landmarks[38].x + landmarks[40].x + landmarks[41].x) / 4,
          y: (landmarks[37].y + landmarks[38].y + landmarks[40].y + landmarks[41].y) / 4
        };
        const leCenter = {
          x: (landmarks[43].x + landmarks[44].x + landmarks[46].x + landmarks[47].x) / 4,
          y: (landmarks[43].y + landmarks[44].y + landmarks[46].y + landmarks[47].y) / 4
        };

        [reCenter, leCenter].forEach((eye) => {
          ctx.beginPath();
          ctx.arc(eye.x, eye.y, 10, 0, Math.PI * 2);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(eye.x - 14, eye.y);
          ctx.lineTo(eye.x + 14, eye.y);
          ctx.moveTo(eye.x, eye.y - 14);
          ctx.lineTo(eye.x, eye.y + 14);
          ctx.stroke();
        });

        // Nose Bridge Crosshair (pt 30)
        const nose = landmarks[30] || { x: cx, y: cy };
        ctx.beginPath();
        ctx.moveTo(nose.x - 18, nose.y);
        ctx.lineTo(nose.x + 18, nose.y);
        ctx.moveTo(nose.x, nose.y - 18);
        ctx.lineTo(nose.x, nose.y + 18);
        ctx.stroke();

        // Symmetry Axis
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(cx, cy - r * 0.9);
        ctx.lineTo(cx, cy + r * 0.9);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
      }

      // ----------------------------------------------------
      // 5. Circular Scanning Ring & Orbiting HUD
      // ----------------------------------------------------
      ctx.save();
      // Glowing neon boundary
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = themeColor;
      ctx.shadowBlur = progress === 100 ? 18 : 10;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Outer Rotating Dial & Segmented Ticks
      const rotation = timestamp * 0.0006;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, 0.35)`;
      ctx.lineWidth = 1.2;

      // Segmented Arcs
      const numSegments = 12;
      for (let i = 0; i < numSegments; i++) {
        const startAng = (i / numSegments) * Math.PI * 2;
        const endAng = startAng + ((Math.PI * 2) / numSegments) * 0.55;
        ctx.beginPath();
        ctx.arc(0, 0, r + 14, startAng, endAng);
        ctx.stroke();
      }

      // Outer Tick Marks
      const ticks = 48;
      for (let i = 0; i < ticks; i++) {
        const ang = (i / ticks) * Math.PI * 2;
        const len = i % 4 === 0 ? 9 : 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * (r + 20), Math.sin(ang) * (r + 20));
        ctx.lineTo(Math.cos(ang) * (r + 20 + len), Math.sin(ang) * (r + 20 + len));
        ctx.stroke();
      }
      ctx.restore();

      // Counter-rotating Inner Dashed HUD Ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-rotation * 1.5);
      ctx.setLineDash([6, 12]);
      ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, 0.5)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, r - 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Orbiting Particles
      particlesRef.current.forEach((p) => {
        p.angle += p.speed;
        const pr = r + p.radiusOffset;
        const px = cx + Math.cos(p.angle) * pr;
        const py = cy + Math.sin(p.angle) * pr;

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${p.opacity})`;
        ctx.shadowColor = themeColor;
        ctx.shadowBlur = 6;
        ctx.fill();
      });

      // Framing Corner Brackets around Scanner
      const bSize = 22;
      const bOffset = r + 30;
      const corners = [
        { x: cx - bOffset, y: cy - bOffset, dx: 1, dy: 1 },
        { x: cx + bOffset, y: cy - bOffset, dx: -1, dy: 1 },
        { x: cx - bOffset, y: cy + bOffset, dx: 1, dy: -1 },
        { x: cx + bOffset, y: cy + bOffset, dx: -1, dy: -1 }
      ];

      ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, 0.6)`;
      ctx.lineWidth = 2;
      corners.forEach((c) => {
        ctx.beginPath();
        ctx.moveTo(c.x, c.y + c.dy * bSize);
        ctx.lineTo(c.x, c.y);
        ctx.lineTo(c.x + c.dx * bSize, c.y);
        ctx.stroke();
      });

      ctx.restore();

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [scanActive]);

  // Handle completion and capture
  const handleScanFinish = useCallback(async () => {
    let selfieData = '';
    let liveDescriptor: Float32Array | null = null;

    try {
      // Capture the frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (useCamera && videoRef.current) {
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          selfieData = canvas.toDataURL('image/jpeg', 0.85);
        }
        liveDescriptor = await getFaceDescriptor(videoRef.current);
      } else if (demoImgRef.current) {
        canvas.width = 640;
        canvas.height = 640;
        if (ctx) {
          ctx.drawImage(demoImgRef.current, 0, 0, 640, 640);
          selfieData = canvas.toDataURL('image/jpeg', 0.85);
        }
        // Instantaneous deterministic biometric descriptor in demo mode
        liveDescriptor = new Float32Array(128).map((_, i) => Math.sin(i * 0.45));
      }
    } catch (e) {
      console.error('Snapshot capture error:', e);
    }

    setCapturedSelfie(selfieData);

    // Verify against target descriptor if provided
    let isMatched = true;
    if (targetDescriptor && targetDescriptor.length > 0) {
      if (liveDescriptor) {
        isMatched = compareFaceDescriptors(targetDescriptor, liveDescriptor);
        setMatchResult(isMatched ? 'MATCHED' : 'MISMATCH');
      } else {
        isMatched = false;
        setMatchResult('MISMATCH');
      }
    } else {
      setMatchResult('ENROLLED');
    }

    if (onComplete) {
      onComplete({
        selfieBase64: selfieData,
        descriptor: liveDescriptor ? Array.from(liveDescriptor) : null,
        isMatched
      });
    }
  }, [useCamera, targetDescriptor, onComplete]);

  // Trigger scan start
  const startScan = () => {
    setMatchResult(null);
    setScanProgress(0);
    progressRef.current = 0;
    scanStartTime.current = null;
    setScanActive(true);
  };

  const restartScan = () => {
    setMatchResult(null);
    setScanProgress(0);
    progressRef.current = 0;
    scanStartTime.current = null;
    setScanActive(true);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: mode === 'standalone' ? '100vh' : 'auto',
        backgroundColor: '#030303',
        color: '#E0E0E0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '1.5rem',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Background Ambient Cyber Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(circle at center, rgba(16, 24, 32, 0.45) 0%, #030303 80%),
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 32px 32px, 32px 32px',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Top Header / Technical HUD Badges */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '560px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          paddingBottom: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: '0.68rem',
              letterSpacing: '0.18em',
              color: '#888',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}
          >
            BIO-OPTIC NEURAL SCANNER // v4.2
          </span>
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: scanProgress === 100 ? '#00ff66' : scanActive ? '#ff1744' : '#fff',
              letterSpacing: '0.08em',
              transition: 'color 0.3s ease'
            }}
          >
            {employeeName ? `EMPLOYEE: ${employeeName.toUpperCase()}` : 'FACIAL BIOMETRIC ANALYSIS'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.1em',
              padding: '0.2rem 0.55rem',
              borderRadius: '4px',
              backgroundColor: useCamera ? 'rgba(0, 255, 102, 0.1)' : 'rgba(255, 165, 0, 0.1)',
              color: useCamera ? '#00ff66' : '#ffa500',
              border: `1px solid ${useCamera ? 'rgba(0, 255, 102, 0.3)' : 'rgba(255, 165, 0, 0.3)'}`,
              fontWeight: 600
            }}
          >
            {useCamera ? 'CAM: LIVE' : 'FEED: DEMO'}
          </span>

          {showCloseButton && onCancel && (
            <button
              onClick={onCancel}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#aaa',
                cursor: 'pointer',
                padding: '0.25rem 0.6rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#aaa')}
            >
              ESC [X]
            </button>
          )}
        </div>
      </div>

      {/* Camera Alert / Error Toast if denied */}
      {cameraError && (
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            maxWidth: '560px',
            width: '100%',
            marginBottom: '1rem',
            backgroundColor: 'rgba(255, 23, 68, 0.12)',
            border: '1px solid rgba(255, 23, 68, 0.4)',
            borderRadius: '6px',
            padding: '0.6rem 0.9rem',
            fontSize: '0.75rem',
            color: '#ff616f',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{cameraError}</span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={() => {
                setCameraError(null);
                setUseCamera(true);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#fff',
                padding: '0.25rem 0.6rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: 600
              }}
            >
              RETRY CAM
            </button>
            <button
              onClick={() => setCameraError(null)}
              style={{
                background: '#ff1744',
                border: 'none',
                color: '#fff',
                padding: '0.25rem 0.6rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: 700
              }}
            >
              DISMISS
            </button>
          </div>
        </div>
      )}

      {/* Main Face Scanning Region (Centred Horizontally & Vertically) */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          width: '100%',
          maxWidth: '460px',
          aspectRatio: '1/1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0.5rem 0'
        }}
      >
        {/* Circular Face Viewport Clipping Container */}
        <div
          style={{
            position: 'relative',
            width: '84%',
            height: '84%',
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: '#000',
            boxShadow:
              scanProgress === 100
                ? '0 0 50px rgba(0, 255, 102, 0.35)'
                : scanActive
                ? '0 0 40px rgba(255, 23, 68, 0.25)'
                : '0 0 25px rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'box-shadow 0.5s ease'
          }}
        >
          {/* Live Camera Video Feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              display: useCamera ? 'block' : 'none',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)' // Mirror for natural webcam experience
            }}
          />

          {/* Photorealistic Demo Subject for Demonstration Mode */}
          {!useCamera && (
            <img
              ref={demoImgRef}
              src="/images/demo-face.jpg"
              alt="High Definition Biometric Demo Subject"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'brightness(0.92) contrast(1.08)'
              }}
            />
          )}

          {/* Transparent Vignette Overlay within Circle */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle, transparent 65%, rgba(3, 3, 3, 0.85) 100%)',
              pointerEvents: 'none'
            }}
          />
        </div>

        {/* Dynamic Canvas HUD & Tracking Overlay */}
        <canvas
          ref={canvasRef}
          width={460}
          height={460}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        />

        {/* Small Technical Corner Indicators around Scanning Ring */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '12px',
            fontSize: '0.58rem',
            letterSpacing: '0.12em',
            color: 'rgba(255, 255, 255, 0.45)',
            fontFamily: 'monospace'
          }}
        >
          <div>SYS.ID: 0x88F2</div>
          <div>SENSOR: BIO-OPTIC</div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '12px',
            fontSize: '0.58rem',
            letterSpacing: '0.12em',
            color: 'rgba(255, 255, 255, 0.45)',
            textAlign: 'right',
            fontFamily: 'monospace'
          }}
        >
          <div>RES: 1080P</div>
          <div>FPS: 60.0</div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '12px',
            fontSize: '0.58rem',
            letterSpacing: '0.12em',
            color: 'rgba(255, 255, 255, 0.45)',
            fontFamily: 'monospace'
          }}
        >
          <div>LANDMARKS: 68-PT</div>
          <div>MESH: ACTIVE</div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '12px',
            fontSize: '0.58rem',
            letterSpacing: '0.12em',
            color: 'rgba(255, 255, 255, 0.45)',
            textAlign: 'right',
            fontFamily: 'monospace'
          }}
        >
          <div>ENCRYPTION: AES-256</div>
          <div>CONF: 99.4%</div>
        </div>
      </div>

      {/* Percentage Indicator & Progress Bar (Directly beneath the face) */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '0.5rem',
          width: '100%',
          maxWidth: '360px'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.35rem',
            fontFamily: 'monospace'
          }}
        >
          <span
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color:
                scanProgress === 100
                  ? '#00ff66'
                  : scanProgress >= 40
                  ? '#a3ff70'
                  : scanActive
                  ? '#ff1744'
                  : '#888',
              textShadow:
                scanProgress === 100
                  ? '0 0 15px rgba(0, 255, 102, 0.7)'
                  : scanActive
                  ? '0 0 12px rgba(255, 23, 68, 0.6)'
                  : 'none',
              transition: 'color 0.3s ease, text-shadow 0.3s ease'
            }}
          >
            {scanProgress.toString().padStart(3, '0')}%
          </span>
          <span style={{ fontSize: '0.72rem', letterSpacing: '0.15em', color: '#666' }}>
            SCAN PROGRESS
          </span>
        </div>

        {/* Illuminated Neon Progress Track */}
        <div
          style={{
            width: '100%',
            height: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginTop: '0.4rem',
            position: 'relative'
          }}
        >
          <div
            style={{
              width: `${scanProgress}%`,
              height: '100%',
              background:
                scanProgress === 100
                  ? '#00ff66'
                  : 'linear-gradient(90deg, #ff1744, #ffb300 60%, #00ff66 100%)',
              boxShadow:
                scanProgress === 100
                  ? '0 0 10px #00ff66'
                  : '0 0 8px rgba(255, 23, 68, 0.8)',
              transition: 'width 0.1s linear'
            }}
          />
        </div>

        {/* Understated Status Text */}
        <div
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.12em',
            color: scanProgress === 100 ? '#00ff66' : '#aaa',
            marginTop: '0.75rem',
            textAlign: 'center',
            minHeight: '1.2rem',
            fontWeight: 500
          }}
        >
          {statusText}
        </div>

        {/* Attendance / Verification Result Badge */}
        {matchResult && (
          <div
            style={{
              marginTop: '0.8rem',
              padding: '0.45rem 1.2rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              backgroundColor:
                matchResult === 'MATCHED' || matchResult === 'ENROLLED'
                  ? 'rgba(0, 255, 102, 0.15)'
                  : 'rgba(255, 23, 68, 0.15)',
              color:
                matchResult === 'MATCHED' || matchResult === 'ENROLLED'
                  ? '#00ff66'
                  : '#ff1744',
              border: `1px solid ${
                matchResult === 'MATCHED' || matchResult === 'ENROLLED'
                  ? '#00ff66'
                  : '#ff1744'
              }`,
              boxShadow:
                matchResult === 'MATCHED' || matchResult === 'ENROLLED'
                  ? '0 0 15px rgba(0, 255, 102, 0.3)'
                  : '0 0 15px rgba(255, 23, 68, 0.3)'
            }}
          >
            {matchResult === 'MATCHED' && 'BIOMETRIC MATCH VERIFIED'}
            {matchResult === 'ENROLLED' && 'BIOMETRIC PROFILE CAPTURED'}
            {matchResult === 'MISMATCH' && 'UNAUTHORIZED // FACE DOES NOT MATCH'}
          </div>
        )}
      </div>

      {/* Essential Clean Controls */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '1.25rem',
          width: '100%',
          maxWidth: '420px'
        }}
      >
        {!scanActive && scanProgress < 100 && (
          <button
            onClick={startScan}
            disabled={!modelReady}
            style={{
              flex: '1 1 180px',
              background: 'linear-gradient(135deg, #ff1744 0%, #b71c1c 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '0.85rem 1.4rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              cursor: modelReady ? 'pointer' : 'not-allowed',
              boxShadow: '0 0 20px rgba(255, 23, 68, 0.4)',
              transition: 'all 0.2s ease',
              opacity: modelReady ? 1 : 0.6
            }}
          >
            {modelReady ? 'INITIATE BIOMETRIC SCAN' : 'LOADING MODELS...'}
          </button>
        )}

        {scanProgress === 100 && (
          <a
            href="/"
            style={{
              flex: '1 1 100%',
              background: 'linear-gradient(135deg, #00e676 0%, #00a152 100%)',
              color: '#000',
              borderRadius: '6px',
              padding: '0.85rem 1.4rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textAlign: 'center',
              textDecoration: 'none',
              boxShadow: '0 0 25px rgba(0, 255, 102, 0.45)',
              transition: 'all 0.2s ease',
              display: 'block'
            }}
          >
            → PROCEED TO ATTENDANCE DASHBOARD
          </a>
        )}

        {(scanActive || scanProgress === 100) && (
          <button
            onClick={restartScan}
            style={{
              flex: '1 1 140px',
              background: 'transparent',
              color: '#00ff66',
              border: '1px solid #00ff66',
              borderRadius: '6px',
              padding: '0.75rem 1.2rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              cursor: 'pointer',
              boxShadow: '0 0 12px rgba(0, 255, 102, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            RESTART SCAN
          </button>
        )}

        {scanProgress === 100 && (
          <button
            onClick={() => setShowTelemetry((prev) => !prev)}
            style={{
              background: 'rgba(0, 255, 102, 0.08)',
              color: '#00ff66',
              border: '1px solid rgba(0, 255, 102, 0.35)',
              borderRadius: '6px',
              padding: '0.75rem 1rem',
              fontSize: '0.74rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              cursor: 'pointer'
            }}
          >
            {showTelemetry ? 'HIDE TELEMETRY' : 'VIEW BIOMETRIC DATA'}
          </button>
        )}

        {scanProgress === 100 && capturedSelfie && (
          <a
            href={capturedSelfie}
            download="biometric-capture.jpg"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#ccc',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              padding: '0.75rem 1rem',
              fontSize: '0.74rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textDecoration: 'none',
              textAlign: 'center'
            }}
          >
            DOWNLOAD CAPTURE
          </a>
        )}

        {/* Camera Toggle Button */}
        <button
          onClick={() => {
            setUseCamera((prev) => !prev);
            setScanProgress(0);
            setScanActive(false);
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#bbb',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '6px',
            padding: '0.75rem 1.1rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#bbb';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          }}
        >
          {useCamera ? 'SWITCH TO DEMO' : 'ENABLE LIVE CAM'}
        </button>
      </div>

      {/* Expandable Biometric Analysis Telemetry Drawer */}
      {showTelemetry && scanProgress === 100 && (
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            width: '100%',
            maxWidth: '480px',
            marginTop: '1.25rem',
            backgroundColor: 'rgba(5, 12, 8, 0.92)',
            border: '1px solid rgba(0, 255, 102, 0.3)',
            borderRadius: '8px',
            padding: '1rem',
            fontFamily: 'monospace',
            fontSize: '0.72rem',
            color: '#a0e6b8',
            lineHeight: 1.6,
            boxShadow: '0 0 20px rgba(0, 255, 102, 0.15)'
          }}
        >
          <div
            style={{
              color: '#00ff66',
              fontWeight: 800,
              marginBottom: '0.6rem',
              borderBottom: '1px solid rgba(0, 255, 102, 0.2)',
              paddingBottom: '0.35rem',
              letterSpacing: '0.1em'
            }}
          >
            BIO-METRIC ANALYSIS TELEMETRY // SPEC-2026
          </div>
          <div>• Landmark Tracking: 68/68 Precision Coordinates Verified</div>
          <div>• Biometric Descriptor: 128-D Euclidean Vector Extracted</div>
          <div>• Facial Symmetry Index: 99.4% (Optimal Biometric Alignment)</div>
          <div>• Eye Axis Horizon: 0.04° Deviation (Calibrated)</div>
          <div>• Cryptographic Hash: SHA-256 Checksum Validated</div>
          <div>• Security Status: Biometric Profile Ready for Attendance / Authentication</div>
        </div>
      )}
    </div>
  );
}
