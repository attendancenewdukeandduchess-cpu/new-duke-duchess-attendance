'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Camera, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';

export default function EmployeeDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Workflow states
  const [step, setStep] = useState<'IDLE' | 'CAMERA' | 'GPS' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMsg, setErrorMsg] = useState('');
  const [errorDistance, setErrorDistance] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchAttendance();
    }
  }, [status]);

  const fetchAttendance = async () => {
    try {
      const res = await fetch('/api/attendance');
      const data = await res.json();
      setAttendance(data.attendance);
    } catch (e) {
      console.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  const startAttendance = async () => {
    setStep('CAMERA');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setErrorMsg('Camera access denied or unavailable.');
      setStep('ERROR');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        const imgData = canvasRef.current.toDataURL('image/jpeg', 0.8);
        stopCamera();
        processGPS(imgData);
      }
    }
  };

  const processGPS = (selfieData: string) => {
    setStep('GPS');
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      setStep('ERROR');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        try {
          const type = attendance?.checkInTime ? 'CHECK_OUT' : 'CHECK_IN';
          const res = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude, accuracy, selfie: selfieData, type })
          });
          
          const data = await res.json();
          if (res.ok) {
            setStep('SUCCESS');
            fetchAttendance(); // Refresh state
          } else {
            setErrorMsg(data.error || 'Attendance rejected.');
            if (data.distance) setErrorDistance(data.distance);
            setStep('ERROR');
          }
        } catch (e) {
          setErrorMsg('Network error.');
          setStep('ERROR');
        }
      },
      (err) => {
        setErrorMsg('Please enable precise location and try again.');
        setStep('ERROR');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (loading || status === 'loading') return <div className="container flex items-center justify-center">Loading...</div>;
  if (status === 'unauthenticated') return null;

  const isCheckedIn = !!attendance?.checkInTime;
  const isCheckedOut = !!attendance?.checkOutTime;

  return (
    <div className="container">
      <header className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem' }}>Good Morning, {session?.user?.name}</h1>
          <p className="text-muted text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-gold)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
          {session?.user?.name?.[0] || 'U'}
        </div>
      </header>

      {step === 'IDLE' && (
        <>
          <div className="card text-center" style={{ padding: '2rem 1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Today's Attendance</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              {!isCheckedIn && <span className="badge badge-absent" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>NOT MARKED</span>}
              {isCheckedIn && !isCheckedOut && <span className="badge badge-present" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>PRESENT</span>}
              {isCheckedOut && <span className="badge badge-present" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>CHECKED OUT</span>}
            </div>

            {!isCheckedOut && (
              <button className="btn-primary flex items-center justify-center gap-2" onClick={startAttendance} style={{ padding: '1.25rem', fontSize: '1.125rem' }}>
                <Camera size={24} />
                {isCheckedIn ? 'CHECK OUT' : 'MARK ATTENDANCE'}
              </button>
            )}

            <div className="flex justify-between" style={{ marginTop: '2rem', textAlign: 'left' }}>
              <div>
                <p className="text-muted text-sm">Check-in</p>
                <p className="font-bold">{attendance?.checkInTime ? new Date(attendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="text-muted text-sm">Check-out</p>
                <p className="font-bold">{attendance?.checkOutTime ? new Date(attendance.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="card flex justify-between items-center">
              <div>
                <p className="font-bold">Working Hours</p>
                <p className="text-muted text-sm">Today's total hours</p>
              </div>
              <p className="text-gold font-bold text-lg">—</p>
            </div>
            <div className="card flex justify-between items-center">
              <div>
                <p className="font-bold">Leave</p>
                <p className="text-muted text-sm">Available leave balance</p>
              </div>
              <p className="font-bold">12 Days</p>
            </div>
          </div>
        </>
      )}

      {step === 'CAMERA' && (
        <div className="card flex flex-col items-center">
          <h2 style={{ marginBottom: '0.5rem' }}>Take Your Selfie</h2>
          <p className="text-muted text-center" style={{ marginBottom: '1.5rem' }}>Position your face inside the frame and take a live selfie.</p>
          
          <div style={{ position: 'relative', width: '100%', maxWidth: '300px', aspectRatio: '3/4', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#000', marginBottom: '1.5rem' }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <button className="btn-primary" onClick={captureSelfie}>CAPTURE SELFIE</button>
          <button className="btn-secondary" style={{ marginTop: '1rem', width: '100%' }} onClick={() => { stopCamera(); setStep('IDLE'); }}>CANCEL</button>
        </div>
      )}

      {step === 'GPS' && (
        <div className="card flex flex-col items-center justify-center text-center" style={{ minHeight: '300px' }}>
          <MapPin size={48} className="text-gold" style={{ marginBottom: '1rem', animation: 'pulse 2s infinite' }} />
          <h2>Verifying Your Location...</h2>
          <p className="text-muted" style={{ marginTop: '0.5rem' }}>Please wait while we confirm your distance from the salon.</p>
        </div>
      )}

      {step === 'SUCCESS' && (
        <div className="card flex flex-col items-center justify-center text-center">
          <CheckCircle size={64} className="text-gold" style={{ marginBottom: '1rem' }} />
          <h2>✓ ATTENDANCE MARKED</h2>
          <p className="font-bold" style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>You are marked {isCheckedIn ? 'Checked Out' : 'Present'}</p>
          
          <div style={{ marginTop: '1.5rem', width: '100%', textAlign: 'left', backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
            <p className="flex justify-between" style={{ marginBottom: '0.5rem' }}><span className="text-muted">Time:</span> <strong>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></p>
            <p className="flex justify-between" style={{ marginBottom: '0.5rem' }}><span className="text-muted">Location:</span> <strong>New Duke & Duchess</strong></p>
            <p className="flex justify-between"><span className="text-muted">Location Verified:</span> <strong>✓</strong></p>
          </div>

          <button className="btn-primary" style={{ marginTop: '2rem' }} onClick={() => setStep('IDLE')}>DONE</button>
        </div>
      )}

      {step === 'ERROR' && (
        <div className="card flex flex-col items-center justify-center text-center">
          <AlertTriangle size={64} className="text-gold" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: 'var(--status-absent)' }}>⚠ OUTSIDE SALON LOCATION</h2>
          <p className="text-muted" style={{ marginTop: '1rem' }}>{errorMsg}</p>
          
          {errorDistance && (
            <p className="font-bold" style={{ marginTop: '1rem' }}>Distance from salon: {errorDistance} meters</p>
          )}

          <p className="font-bold" style={{ marginTop: '1.5rem', fontSize: '1.125rem' }}>Attendance Not Marked</p>

          <div className="flex gap-4" style={{ width: '100%', marginTop: '2rem' }}>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep('IDLE')}>CANCEL</button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={() => setStep('IDLE')}>TRY AGAIN</button>
          </div>
        </div>
      )}

      {/* Bottom Nav Placeholder */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--card-bg)', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-around', padding: '1rem', maxWidth: '480px', margin: '0 auto' }}>
        <div className="text-gold flex flex-col items-center cursor-pointer"><span style={{ fontWeight: 'bold' }}>Home</span></div>
        <div className="text-muted flex flex-col items-center cursor-pointer"><span>History</span></div>
        <div className="text-muted flex flex-col items-center cursor-pointer"><span>Profile</span></div>
      </div>
    </div>
  );
}
