'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Camera,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Home,
  History,
  User,
  Clock,
  LogOut,
  CalendarDays,
  Menu,
  X,
  Briefcase,
  Phone,
  Mail,
  Plus,
  Sparkles,
  Check,
  Calendar,
  Users,
  Search,
  ShieldCheck,
  Pencil,
  Save,
  UserX,
  ScanFace
} from 'lucide-react';
import { getFaceDescriptor, loadFaceModels, compareFaceDescriptors } from '@/lib/face-api';

export default function EmployeeDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'profile' | 'employees'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Home states
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // History states
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyStats, setHistoryStats] = useState<any>(null);
  const [historyFilter, setHistoryFilter] = useState<'month' | 'week' | 'all'>('month');
  const [historyLoading, setHistoryLoading] = useState(false);

  // Profile states
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactMobile, setContactMobile] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  // Admin Employees states
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [addEmpModalOpen, setAddEmpModalOpen] = useState(false);
  const [newEmpId, setNewEmpId] = useState('');
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpMobile, setNewEmpMobile] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpDesig, setNewEmpDesig] = useState('Senior Stylist');
  const [newEmpDept, setNewEmpDept] = useState('Styling');
  const [newEmpSalary, setNewEmpSalary] = useState('25000');
  const [newEmpPassword, setNewEmpPassword] = useState('emp123');
  const [newEmpFaceDescriptor, setNewEmpFaceDescriptor] = useState<number[] | null>(null);
  const [addEmpCameraOpen, setAddEmpCameraOpen] = useState(false);
  const [addEmpCameraLoading, setAddEmpCameraLoading] = useState(false);
  const [addEmpFaceStatus, setAddEmpFaceStatus] = useState<string>('');
  const addEmpVideoRef = useRef<HTMLVideoElement>(null);
  const addEmpCanvasRef = useRef<HTMLCanvasElement>(null);
  const [addEmpStream, setAddEmpStream] = useState<MediaStream | null>(null);
  const [addEmpSubmitting, setAddEmpSubmitting] = useState(false);
  const [addEmpMsg, setAddEmpMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Employee states
  const [editEmpModalOpen, setEditEmpModalOpen] = useState(false);
  const [editEmpData, setEditEmpData] = useState<any>(null); // the employee being edited
  const [editEmpName, setEditEmpName] = useState('');
  const [editEmpMobile, setEditEmpMobile] = useState('');
  const [editEmpEmail, setEditEmpEmail] = useState('');
  const [editEmpDesig, setEditEmpDesig] = useState('');
  const [editEmpDept, setEditEmpDept] = useState('');
  const [editEmpSalary, setEditEmpSalary] = useState('');
  const [editEmpStatus, setEditEmpStatus] = useState('ACTIVE');
  const [editEmpPassword, setEditEmpPassword] = useState('');
  const [editEmpJoiningDate, setEditEmpJoiningDate] = useState('');
  const [editEmpFaceDescriptor, setEditEmpFaceDescriptor] = useState<number[] | null>(null);
  const [editEmpCameraOpen, setEditEmpCameraOpen] = useState(false);
  const [editEmpCameraLoading, setEditEmpCameraLoading] = useState(false);
  const [editEmpFaceStatus, setEditEmpFaceStatus] = useState<string>('');
  const editEmpVideoRef = useRef<HTMLVideoElement>(null);
  const editEmpCanvasRef = useRef<HTMLCanvasElement>(null);
  const [editEmpStream, setEditEmpStream] = useState<MediaStream | null>(null);
  const [editEmpSubmitting, setEditEmpSubmitting] = useState(false);
  const [editEmpMsg, setEditEmpMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Face verification states
  const [faceApiReady, setFaceApiReady] = useState(false);
  const [faceVerifying, setFaceVerifying] = useState(false);

  // Leave Modal states
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveMsg, setLeaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Attendance workflow states
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
      fetchProfile();
      fetchHistory('month');
      if ((session?.user as any)?.role === 'ADMIN') {
        fetchEmployees();
      }
      // Pre-load face AI models in the background
      loadFaceModels().then(() => setFaceApiReady(true)).catch(() => {
        console.warn('Face models not available — facial recognition disabled.');
      });
    }
  }, [status]);

  // Fetch today's attendance
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

  // Fetch attendance history
  const fetchHistory = async (filter: 'month' | 'week' | 'all' = historyFilter) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/attendance/history?filter=${filter}`);
      const data = await res.json();
      setHistoryRecords(data.records || []);
      setHistoryStats(data.stats || null);
    } catch (e) {
      console.error('Failed to fetch history', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch user profile
  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      setProfileData(data);
      if (data?.user) {
        setContactMobile(data.user.mobile || '');
        setContactEmail(data.user.email || '');
      }
    } catch (e) {
      console.error('Failed to fetch profile', e);
    } finally {
      setProfileLoading(false);
    }
  };

  // Fetch all employees (for Admin)
  const fetchEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const res = await fetch('/api/admin/employees');
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (e) {
      console.error('Failed to fetch employees', e);
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handleFilterChange = (filter: 'month' | 'week' | 'all') => {
    setHistoryFilter(filter);
    fetchHistory(filter);
  };

  // Update contact info
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContact(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: contactMobile, email: contactEmail })
      });
      if (res.ok) {
        setIsEditingContact(false);
        fetchProfile();
      }
    } catch (err) {
      console.error('Failed to update contact info', err);
    } finally {
      setSavingContact(false);
    }
  };

  // Submit leave request
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveSubmitting(true);
    setLeaveMsg(null);
    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveType,
          fromDate: leaveFrom,
          toDate: leaveTo,
          reason: leaveReason
        })
      });
      const data = await res.json();
      if (res.ok) {
        setLeaveMsg({ type: 'success', text: 'Leave request submitted successfully!' });
        setLeaveFrom('');
        setLeaveTo('');
        setLeaveReason('');
        setTimeout(() => {
          setLeaveModalOpen(false);
          setLeaveMsg(null);
        }, 1500);
        fetchProfile();
      } else {
        setLeaveMsg({ type: 'error', text: data.error || 'Failed to submit leave request.' });
      }
    } catch (err) {
      setLeaveMsg({ type: 'error', text: 'Network error submitting request.' });
    } finally {
      setLeaveSubmitting(false);
    }
  };

  // Open edit modal pre-filled with employee data
  const openEditModal = (emp: any) => {
    setEditEmpData(emp);
    setEditEmpName(emp.name || '');
    setEditEmpMobile(emp.mobile || '');
    setEditEmpEmail(emp.email || '');
    setEditEmpDesig(emp.designation || '');
    setEditEmpDept(emp.department || '');
    setEditEmpSalary(emp.baseSalary?.toString() || '0');
    setEditEmpStatus(emp.status || 'ACTIVE');
    setEditEmpPassword('');
    setEditEmpJoiningDate(
      emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : ''
    );
    setEditEmpMsg(null);
    setEditEmpModalOpen(true);
  };

  // Submit edit
  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmpData) return;
    setEditEmpSubmitting(true);
    setEditEmpMsg(null);
    try {
      const res = await fetch(`/api/admin/employees/${editEmpData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editEmpName,
          mobile: editEmpMobile,
          email: editEmpEmail,
          designation: editEmpDesig,
          department: editEmpDept,
          baseSalary: Number(editEmpSalary),
          status: editEmpStatus,
          joiningDate: editEmpJoiningDate,
          ...(editEmpFaceDescriptor ? { faceDescriptor: editEmpFaceDescriptor } : {}),
          ...(editEmpPassword.trim() !== '' ? { password: editEmpPassword } : {})
        })
      });
      const data = await res.json();
      if (res.ok) {
        setEditEmpMsg({ type: 'success', text: `${editEmpName}'s profile updated successfully!` });
        fetchEmployees();
        setTimeout(() => {
          setEditEmpModalOpen(false);
          setEditEmpMsg(null);
        }, 1500);
      } else {
        setEditEmpMsg({ type: 'error', text: data.error || 'Failed to update employee.' });
      }
    } catch (err) {
      setEditEmpMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setEditEmpSubmitting(false);
    }
  };

  // Add new employee (Admin)
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddEmpSubmitting(true);
    setAddEmpMsg(null);
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: newEmpId,
          name: newEmpName,
          mobile: newEmpMobile,
          email: newEmpEmail,
          designation: newEmpDesig,
          department: newEmpDept,
          baseSalary: Number(newEmpSalary),
          password: newEmpPassword,
          ...(newEmpFaceDescriptor ? { faceDescriptor: newEmpFaceDescriptor } : {})
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAddEmpMsg({ type: 'success', text: `Employee ${newEmpName} (${newEmpId.toUpperCase()}) added successfully!` });
        setNewEmpId('');
        setNewEmpName('');
        setNewEmpMobile('');
        setNewEmpEmail('');
        setTimeout(() => {
          setAddEmpModalOpen(false);
          setAddEmpMsg(null);
        }, 1500);
        fetchEmployees();
      } else {
        setAddEmpMsg({ type: 'error', text: data.error || 'Failed to add employee.' });
      }
    } catch (err) {
      setAddEmpMsg({ type: 'error', text: 'Network error adding employee.' });
    } finally {
      setAddEmpSubmitting(false);
    }
  };

  // Camera & GPS workflows
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

  const captureSelfie = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    const imgData = canvasRef.current.toDataURL('image/jpeg', 0.8);

    // ── Face Verification ──────────────────────────────────────────────
    const storedDescriptor = profileData?.user?.faceDescriptor;
    if (faceApiReady && storedDescriptor && storedDescriptor.length > 0) {
      setFaceVerifying(true);
      try {
        const liveFaceDescriptor = await getFaceDescriptor(videoRef.current);
        if (!liveFaceDescriptor) {
          stopCamera();
          setFaceVerifying(false);
          setErrorMsg('No face detected in selfie. Please look directly at the camera and try again.');
          setStep('ERROR');
          return;
        }
        const isMatch = compareFaceDescriptors(liveFaceDescriptor, storedDescriptor);
        if (!isMatch) {
          stopCamera();
          setFaceVerifying(false);
          setErrorMsg('⚠️ Face does not match registered employee. Attendance REJECTED. If this is an error, please contact your manager.');
          setStep('ERROR');
          return;
        }
      } catch (e) {
        console.error('Face verification error:', e);
        // If models fail to load, allow attendance but log warning
      }
      setFaceVerifying(false);
    }
    // ──────────────────────────────────────────────────────────────────

    stopCamera();
    processGPS(imgData);
  };

  // Helper to open admin face-capture cameras
  const openAdminCamera = async (type: 'add' | 'edit') => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (type === 'add') { 
        setAddEmpStream(mediaStream); 
        setAddEmpCameraOpen(true); 
        setAddEmpFaceStatus(''); 
      } else { 
        setEditEmpStream(mediaStream); 
        setEditEmpCameraOpen(true); 
        setEditEmpFaceStatus(''); 
      }
      
      // Wait for React to render the <video> element before attaching the stream
      setTimeout(() => {
        const videoEl = type === 'add' ? addEmpVideoRef.current : editEmpVideoRef.current;
        if (videoEl) videoEl.srcObject = mediaStream;
      }, 50);
    } catch {
      alert('Camera access denied. Please allow camera permissions to capture a reference face.');
    }
  };

  const stopAdminCamera = (type: 'add' | 'edit') => {
    const streamToStop = type === 'add' ? addEmpStream : editEmpStream;
    if (streamToStop) streamToStop.getTracks().forEach(t => t.stop());
    if (type === 'add') { setAddEmpStream(null); setAddEmpCameraOpen(false); }
    else { setEditEmpStream(null); setEditEmpCameraOpen(false); }
  };

  const captureAdminFace = async (type: 'add' | 'edit') => {
    const videoEl = type === 'add' ? addEmpVideoRef.current : editEmpVideoRef.current;
    const canvasEl = type === 'add' ? addEmpCanvasRef.current : editEmpCanvasRef.current;
    if (!videoEl || !canvasEl) return;

    if (type === 'add') setAddEmpCameraLoading(true);
    else setEditEmpCameraLoading(true);

    try {
      const ctx = canvasEl.getContext('2d');
      if (!ctx) return;
      canvasEl.width = videoEl.videoWidth;
      canvasEl.height = videoEl.videoHeight;
      ctx.drawImage(videoEl, 0, 0);

      const descriptor = await getFaceDescriptor(videoEl);
      if (!descriptor) {
        if (type === 'add') setAddEmpFaceStatus('error:No face detected. Please look at the camera and try again.');
        else setEditEmpFaceStatus('error:No face detected. Please look at the camera and try again.');
        return;
      }
      const descriptorArray = Array.from(descriptor);
      if (type === 'add') {
        setNewEmpFaceDescriptor(descriptorArray);
        setAddEmpFaceStatus('success:✓ Face captured successfully! 128-point map stored.');
        stopAdminCamera('add');
      } else {
        setEditEmpFaceDescriptor(descriptorArray);
        setEditEmpFaceStatus('success:✓ Face updated successfully! New 128-point map stored.');
        stopAdminCamera('edit');
      }
    } catch (e: any) {
      const msg = 'error:Failed to scan face. Make sure face-api models are loaded and try again.';
      if (type === 'add') setAddEmpFaceStatus(msg);
      else setEditEmpFaceStatus(msg);
    } finally {
      if (type === 'add') setAddEmpCameraLoading(false);
      else setEditEmpCameraLoading(false);
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
            fetchAttendance();
            fetchHistory();
            fetchProfile();
            if (isAdmin) fetchEmployees();
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

  // Helper: calculate working hours
  const calculateWorkingHours = (checkIn?: string, checkOut?: string) => {
    if (!checkIn) return '—';
    const start = new Date(checkIn).getTime();
    if (checkOut) {
      const end = new Date(checkOut).getTime();
      const diff = end - start;
      if (diff <= 0) return '0 mins';
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    } else {
      // In progress
      const diff = Date.now() - start;
      if (diff <= 0) return 'Just started';
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return hours > 0 ? `${hours}h ${mins}m (In progress)` : `${mins}m (In progress)`;
    }
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '—';
    return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100vh', gap: '0.75rem' }}>
        <Clock className="animate-spin text-gold" size={24} />
        <span>Loading portal...</span>
      </div>
    );
  }
  if (status === 'unauthenticated') return null;

  const isCheckedIn = !!attendance?.checkInTime;
  const isCheckedOut = !!attendance?.checkOutTime;
  const employeeName = session?.user?.name || profileData?.user?.name || 'Staff Member';
  const employeeRole = (session?.user as any)?.designation || profileData?.user?.designation || (isAdmin ? 'Salon Manager' : 'Stylist');
  const employeeId = (session?.user as any)?.employeeId || profileData?.user?.employeeId || 'Staff';

  // Filtered employees for admin view
  const filteredEmployees = employees.filter((emp) => {
    const q = employeeSearch.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(q) ||
      emp.employeeId?.toLowerCase().includes(q) ||
      emp.designation?.toLowerCase().includes(q) ||
      emp.mobile?.includes(q)
    );
  });

  return (
    <div className="dashboard-layout">
      {/* Mobile Top Header */}
      <div className="mobile-header">
        <div className="flex items-center gap-2">
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--accent-gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            ND
          </div>
          <div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>New Duke & Duchess</h2>
            <p className="text-muted" style={{ fontSize: '0.7rem', margin: 0 }}>
              {isAdmin ? 'Admin Console' : 'Staff Attendance'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {mobileMenuOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* ── LEFT SIDEBAR NAVIGATION ────────────────────────────────────────── */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div>
          {/* Brand */}
          <div className="sidebar-brand">
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--accent-gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', flexShrink: 0 }}>
              ND
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>New Duke & Duchess</h2>
              <p className="text-gold" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                {isAdmin ? 'Admin Portal' : 'Staff Portal'}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
            >
              <Home size={20} />
              <span>Home</span>
            </button>

            <button
              className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => { setActiveTab('history'); setMobileMenuOpen(false); fetchHistory(); }}
            >
              <History size={20} />
              <span>History</span>
            </button>

            <button
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); fetchProfile(); }}
            >
              <User size={20} />
              <span>Profile</span>
            </button>

            {/* Admin Only Tab: Employees / Staff Management */}
            {isAdmin && (
              <button
                className={`nav-item ${activeTab === 'employees' ? 'active' : ''}`}
                onClick={() => { setActiveTab('employees'); setMobileMenuOpen(false); fetchEmployees(); }}
              >
                <Users size={20} />
                <span>Staff ({employees.length})</span>
              </button>
            )}
          </nav>
        </div>

        {/* Sidebar Footer: Employee Info & Sign Out */}
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
          <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(197, 160, 89, 0.2)', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0 }}>
              {employeeName[0] || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p className="font-bold" style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {employeeName}
              </p>
              <p className="text-muted text-sm" style={{ fontSize: '0.75rem' }}>
                {employeeId} • {employeeRole}
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="btn-secondary flex items-center justify-center gap-2"
            style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', color: 'var(--status-absent)' }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ────────────────────────────────────────────── */}
      <main className="main-content">
        {/* ══════════ TAB 1: HOME PAGE ══════════ */}
        {activeTab === 'home' && (
          <div>
            <header className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <div>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Good Morning, {employeeName}</h1>
                <p className="text-muted text-sm">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--accent-gold)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {employeeName[0] || 'U'}
              </div>
            </header>

            {step === 'IDLE' && (
              <>
                {/* Today's Attendance Card */}
                <div className="card text-center" style={{ padding: '2rem 1.5rem', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>Today's Attendance</h2>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    {!isCheckedIn && (
                      <span className="badge badge-absent" style={{ fontSize: '0.95rem', padding: '0.5rem 1.25rem' }}>
                        NOT MARKED
                      </span>
                    )}
                    {isCheckedIn && !isCheckedOut && (
                      <span className="badge badge-present" style={{ fontSize: '0.95rem', padding: '0.5rem 1.25rem' }}>
                        PRESENT (CHECKED IN)
                      </span>
                    )}
                    {isCheckedOut && (
                      <span className="badge badge-present" style={{ fontSize: '0.95rem', padding: '0.5rem 1.25rem' }}>
                        CHECKED OUT
                      </span>
                    )}
                  </div>

                  {!isCheckedOut ? (
                    <button
                      className="btn-primary flex items-center justify-center gap-2"
                      onClick={startAttendance}
                      style={{ padding: '1.15rem', fontSize: '1.1rem', margin: '0 auto', maxWidth: '320px' }}
                    >
                      <Camera size={22} />
                      {isCheckedIn ? 'CHECK OUT' : 'MARK ATTENDANCE'}
                    </button>
                  ) : (
                    <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', color: 'var(--status-present)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                      <CheckCircle size={20} />
                      <span>Today's attendance completed</span>
                    </div>
                  )}

                  {/* Check-in / Check-out timing info */}
                  <div className="flex justify-between" style={{ marginTop: '2rem', textAlign: 'left', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
                    <div>
                      <p className="text-muted text-sm">Check-in</p>
                      <p className="font-bold" style={{ fontSize: '1.05rem' }}>{formatTime(attendance?.checkInTime)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p className="text-muted text-sm">Check-out</p>
                      <p className="font-bold" style={{ fontSize: '1.05rem' }}>{formatTime(attendance?.checkOutTime)}</p>
                    </div>
                  </div>

                  {isCheckedIn && (
                    <div className="flex items-center justify-center gap-2" style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <MapPin size={14} className="text-gold" />
                      <span>Salon Location Verified (within 20m)</span>
                    </div>
                  )}
                </div>

                {/* Metric Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="card flex justify-between items-center" style={{ margin: 0 }}>
                    <div>
                      <p className="font-bold" style={{ fontSize: '1rem' }}>Working Hours</p>
                      <p className="text-muted text-sm">Today's total hours</p>
                    </div>
                    <p className="text-gold font-bold text-lg">
                      {calculateWorkingHours(attendance?.checkInTime, attendance?.checkOutTime)}
                    </p>
                  </div>

                  <div
                    className="card flex justify-between items-center cursor-pointer"
                    style={{ margin: 0 }}
                    onClick={() => { setActiveTab('profile'); }}
                  >
                    <div>
                      <p className="font-bold" style={{ fontSize: '1rem' }}>Leave</p>
                      <p className="text-muted text-sm">Available balance</p>
                    </div>
                    <p className="font-bold text-lg" style={{ color: 'var(--text-main)' }}>
                      {profileData?.leaveStats?.available ?? 12} Days
                    </p>
                  </div>
                </div>

                {/* Salon Geofence Info Card */}
                <div className="card" style={{ backgroundColor: '#fff', border: '1px solid var(--border-light)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(197, 160, 89, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)' }}>
                        <MapPin size={22} />
                      </div>
                      <div>
                        <p className="font-bold">Salon Geofence Active</p>
                        <p className="text-muted text-sm">Allowed radius: <strong>20 meters</strong> from salon</p>
                      </div>
                    </div>
                    <span className="badge badge-present">ACTIVE</span>
                  </div>
                </div>
              </>
            )}

            {/* Step: CAMERA */}
            {step === 'CAMERA' && (
              <div className="card flex flex-col items-center">
                <h2 style={{ marginBottom: '0.5rem' }}>Take Your Selfie</h2>
                <p className="text-muted text-center" style={{ marginBottom: '0.5rem' }}>
                  Position your face inside the frame and take a live selfie.
                </p>
                {faceApiReady && profileData?.user?.faceDescriptor && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--status-present)', marginBottom: '1rem', backgroundColor: 'rgba(16,185,129,0.1)', padding: '0.4rem 0.8rem', borderRadius: '20px' }}>
                    <ScanFace size={14} />
                    <span>AI Face Verification Active</span>
                  </div>
                )}
                {!faceApiReady && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <Clock size={14} className="animate-spin" />
                    <span>Loading AI models...</span>
                  </div>
                )}
                
                <div style={{ position: 'relative', width: '100%', maxWidth: '320px', aspectRatio: '3/4', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#000', marginBottom: '1.5rem' }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {faceVerifying && (
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                      <ScanFace size={48} style={{ color: 'var(--accent-gold)', animation: 'pulse 1.5s infinite' }} />
                      <p style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>Verifying Face...</p>
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                <button className="btn-primary" onClick={captureSelfie} disabled={faceVerifying} style={{ maxWidth: '320px' }}>
                  {faceVerifying ? 'VERIFYING...' : 'CAPTURE SELFIE'}
                </button>
                <button className="btn-secondary" style={{ marginTop: '0.75rem', width: '100%', maxWidth: '320px' }} onClick={() => { stopCamera(); setStep('IDLE'); }}>
                  CANCEL
                </button>
              </div>
            )}

            {/* Step: GPS */}
            {step === 'GPS' && (
              <div className="card flex flex-col items-center justify-center text-center" style={{ minHeight: '300px' }}>
                <MapPin size={48} className="text-gold" style={{ marginBottom: '1rem', animation: 'pulse 2s infinite' }} />
                <h2>Verifying Your Location...</h2>
                <p className="text-muted" style={{ marginTop: '0.5rem' }}>
                  Confirming your distance from salon (must be within 20 meters).
                </p>
              </div>
            )}

            {/* Step: SUCCESS */}
            {step === 'SUCCESS' && (
              <div className="card flex flex-col items-center justify-center text-center">
                <CheckCircle size={64} className="text-gold" style={{ marginBottom: '1rem' }} />
                <h2>✓ ATTENDANCE MARKED</h2>
                <p className="font-bold" style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>
                  You are marked {isCheckedIn ? 'Checked Out' : 'Present'}
                </p>
                
                <div style={{ marginTop: '1.5rem', width: '100%', maxWidth: '400px', textAlign: 'left', backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
                  <p className="flex justify-between" style={{ marginBottom: '0.5rem' }}>
                    <span className="text-muted">Time:</span>
                    <strong>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                  </p>
                  <p className="flex justify-between" style={{ marginBottom: '0.5rem' }}>
                    <span className="text-muted">Location:</span>
                    <strong>New Duke & Duchess</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted">Radius Check:</span>
                    <strong style={{ color: 'var(--status-present)' }}>✓ Verified within 20m</strong>
                  </p>
                </div>

                <button className="btn-primary" style={{ marginTop: '2rem', maxWidth: '320px' }} onClick={() => setStep('IDLE')}>
                  DONE
                </button>
              </div>
            )}

            {/* Step: ERROR */}
            {step === 'ERROR' && (
              <div className="card flex flex-col items-center justify-center text-center">
                <AlertTriangle size={64} style={{ color: 'var(--status-absent)', marginBottom: '1rem' }} />
                <h2 style={{ color: 'var(--status-absent)' }}>ATTENDANCE NOT MARKED</h2>
                <p className="text-muted" style={{ marginTop: '0.75rem' }}>{errorMsg}</p>
                
                {errorDistance && (
                  <p className="font-bold" style={{ marginTop: '0.75rem', color: 'var(--status-absent)' }}>
                    Distance from salon: {Math.round(errorDistance)} meters (limit: 20m)
                  </p>
                )}

                <div className="flex gap-4" style={{ width: '100%', maxWidth: '320px', marginTop: '1.5rem' }}>
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep('IDLE')}>CANCEL</button>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={() => setStep('IDLE')}>TRY AGAIN</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════ TAB 2: HISTORY PAGE ══════════ */}
        {activeTab === 'history' && (
          <div>
            <header className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <div>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Attendance History</h1>
                <p className="text-muted text-sm">View your attendance records and daily working hours</p>
              </div>
              <button
                onClick={() => fetchHistory(historyFilter)}
                className="btn-secondary flex items-center gap-1"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                <Clock size={16} />
                <span>Refresh</span>
              </button>
            </header>

            {/* Filter Tabs */}
            <div className="flex gap-2" style={{ marginBottom: '1.5rem' }}>
              <button
                className={`btn-secondary ${historyFilter === 'month' ? 'active-filter' : ''}`}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  backgroundColor: historyFilter === 'month' ? 'var(--accent-gold)' : 'transparent',
                  color: historyFilter === 'month' ? '#fff' : 'var(--text-muted)',
                  borderColor: historyFilter === 'month' ? 'var(--accent-gold)' : 'var(--border-light)'
                }}
                onClick={() => handleFilterChange('month')}
              >
                This Month
              </button>

              <button
                className={`btn-secondary ${historyFilter === 'week' ? 'active-filter' : ''}`}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  backgroundColor: historyFilter === 'week' ? 'var(--accent-gold)' : 'transparent',
                  color: historyFilter === 'week' ? '#fff' : 'var(--text-muted)',
                  borderColor: historyFilter === 'week' ? 'var(--accent-gold)' : 'var(--border-light)'
                }}
                onClick={() => handleFilterChange('week')}
              >
                Last 7 Days
              </button>

              <button
                className={`btn-secondary ${historyFilter === 'all' ? 'active-filter' : ''}`}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  backgroundColor: historyFilter === 'all' ? 'var(--accent-gold)' : 'transparent',
                  color: historyFilter === 'all' ? '#fff' : 'var(--text-muted)',
                  borderColor: historyFilter === 'all' ? 'var(--accent-gold)' : 'var(--border-light)'
                }}
                onClick={() => handleFilterChange('all')}
              >
                All Records
              </button>
            </div>

            {/* Summary Statistics */}
            <div className="stat-grid">
              <div className="stat-box">
                <span className="stat-box-title">Total Days Logged</span>
                <span className="stat-box-val">{historyStats?.totalRecords || historyRecords.length}</span>
              </div>
              <div className="stat-box">
                <span className="stat-box-title">Total Hours Worked</span>
                <span className="stat-box-val text-gold">{historyStats?.totalHoursStr || '0m'}</span>
              </div>
              <div className="stat-box">
                <span className="stat-box-title">Late Check-ins</span>
                <span className="stat-box-val" style={{ color: (historyStats?.lateDays || 0) > 0 ? 'var(--status-late)' : 'var(--text-main)' }}>
                  {historyStats?.lateDays || 0}
                </span>
              </div>
            </div>

            {/* Records List */}
            {historyLoading ? (
              <div className="card text-center" style={{ padding: '3rem' }}>
                <Clock className="animate-spin text-gold" size={28} style={{ margin: '0 auto 0.5rem' }} />
                <p className="text-muted">Loading attendance records...</p>
              </div>
            ) : historyRecords.length === 0 ? (
              <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
                <CalendarDays size={48} className="text-muted" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>No attendance records found</h3>
                <p className="text-muted text-sm">There are no attendance check-ins recorded for this period.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {historyRecords.map((record) => {
                  const durationStr = calculateWorkingHours(record.checkInTime, record.checkOutTime);
                  return (
                    <div key={record._id || record.date} className="card" style={{ padding: '1.25rem' }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
                        <div className="flex items-center gap-2">
                          <Calendar size={18} className="text-gold" />
                          <span className="font-bold" style={{ fontSize: '1rem' }}>{formatDate(record.date)}</span>
                        </div>
                        <div>
                          {record.status === 'PRESENT' && (
                            <span className="badge badge-present">PRESENT</span>
                          )}
                          {record.status === 'LATE' && (
                            <span className="badge badge-late">LATE</span>
                          )}
                          {record.status === 'ABSENT' && (
                            <span className="badge badge-absent">ABSENT</span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                        <div>
                          <p className="text-muted text-sm">Check-in</p>
                          <p className="font-bold">{formatTime(record.checkInTime)}</p>
                        </div>

                        <div className="text-center">
                          <p className="text-muted text-sm">Duration</p>
                          <p className="font-bold text-gold">{durationStr}</p>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <p className="text-muted text-sm">Check-out</p>
                          <p className="font-bold">{formatTime(record.checkOutTime)}</p>
                        </div>
                      </div>

                      {record.distanceFromSalon !== undefined && (
                        <div className="flex justify-between items-center" style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-light)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-gold" />
                            GPS verified ({Math.round(record.distanceFromSalon)}m from salon)
                          </span>
                          {record.gpsAccuracy && (
                            <span>Accuracy: ±{Math.round(record.gpsAccuracy)}m</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════ TAB 3: PROFILE PAGE ══════════ */}
        {activeTab === 'profile' && (
          <div>
            <header className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <div>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Staff Profile</h1>
                <p className="text-muted text-sm">Your employment details, contact, and leave balance</p>
              </div>
            </header>

            {/* Profile Header Card */}
            <div className="card flex items-center gap-4" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--accent-gold)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 700, flexShrink: 0 }}>
                {employeeName[0] || 'U'}
              </div>
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{employeeName}</h2>
                  <span className="badge badge-present">{profileData?.user?.status || 'ACTIVE'}</span>
                  {isAdmin && <span className="badge" style={{ backgroundColor: 'rgba(197, 160, 89, 0.15)', color: 'var(--accent-gold)' }}>ADMIN</span>}
                </div>
                <p className="text-muted text-sm" style={{ marginTop: '0.2rem' }}>
                  {profileData?.user?.designation || employeeRole} • {profileData?.user?.department || 'Styling'}
                </p>
                <p className="text-gold font-bold text-sm" style={{ marginTop: '0.2rem' }}>
                  Employee ID: {employeeId}
                </p>
              </div>
            </div>

            {/* Employment & Contact Details */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Employee Details</h3>
                {!isEditingContact ? (
                  <button
                    onClick={() => setIsEditingContact(true)}
                    className="btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    Edit Contact
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingContact(false)}
                    className="btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    Cancel
                  </button>
                )}
              </div>

              {!isEditingContact ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <p className="text-muted text-sm">Designation</p>
                    <p className="font-bold">{profileData?.user?.designation || employeeRole}</p>
                  </div>
                  <div>
                    <p className="text-muted text-sm">Department</p>
                    <p className="font-bold">{profileData?.user?.department || 'Styling'}</p>
                  </div>
                  <div>
                    <p className="text-muted text-sm">Mobile Number</p>
                    <p className="font-bold">{profileData?.user?.mobile || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-muted text-sm">Email Address</p>
                    <p className="font-bold">{profileData?.user?.email || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-muted text-sm">Salon Branch</p>
                    <p className="font-bold">New Duke & Duchess</p>
                  </div>
                  <div>
                    <p className="text-muted text-sm">Joining Date</p>
                    <p className="font-bold">
                      {profileData?.user?.joiningDate ? new Date(profileData.user.joiningDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                  {profileData?.user?.baseSalary && (
                    <div>
                      <p className="text-muted text-sm">Base Salary</p>
                      <p className="font-bold text-gold">₹{profileData.user.baseSalary.toLocaleString()}/month</p>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSaveContact}>
                  <div className="input-group">
                    <label className="input-label">Mobile Number</label>
                    <input
                      className="input-field"
                      type="text"
                      value={contactMobile}
                      onChange={(e) => setContactMobile(e.target.value)}
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <input
                      className="input-field"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="e.g. staff@dukeduchess.com"
                    />
                  </div>
                  <button type="submit" className="btn-primary" disabled={savingContact} style={{ maxWidth: '200px' }}>
                    {savingContact ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              )}
            </div>

            {/* Leave Management Card */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Leave Balance & Requests</h3>
                  <p className="text-muted text-sm">Annual quota: 12 days</p>
                </div>
                <button
                  onClick={() => setLeaveModalOpen(true)}
                  className="btn-primary flex items-center gap-1"
                  style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <Plus size={16} />
                  <span>Request Leave</span>
                </button>
              </div>

              {/* Leave summary stats */}
              <div className="stat-grid" style={{ marginBottom: '1rem' }}>
                <div className="stat-box">
                  <span className="stat-box-title">Available Balance</span>
                  <span className="stat-box-val text-gold">{profileData?.leaveStats?.available ?? 12} Days</span>
                </div>
                <div className="stat-box">
                  <span className="stat-box-title">Approved Leaves</span>
                  <span className="stat-box-val" style={{ color: 'var(--status-present)' }}>{profileData?.leaveStats?.approved ?? 0}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-box-title">Pending Requests</span>
                  <span className="stat-box-val" style={{ color: 'var(--status-late)' }}>{profileData?.leaveStats?.pending ?? 0}</span>
                </div>
              </div>

              {/* Recent Leave Requests */}
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Recent Leave Applications</h4>
              {(!profileData?.leaves || profileData.leaves.length === 0) ? (
                <p className="text-muted text-sm" style={{ padding: '0.75rem 0' }}>No leave requests submitted yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {profileData.leaves.map((l: any) => (
                    <div key={l._id} className="flex justify-between items-center" style={{ padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                      <div>
                        <p className="font-bold" style={{ fontSize: '0.9rem' }}>{l.leaveType}</p>
                        <p className="text-muted text-sm">
                          {new Date(l.fromDate).toLocaleDateString()} to {new Date(l.toDate).toLocaleDateString()}
                          {l.reason && ` • "${l.reason}"`}
                        </p>
                      </div>
                      <div>
                        {l.status === 'APPROVED' && <span className="badge badge-present">APPROVED</span>}
                        {l.status === 'PENDING' && <span className="badge badge-late">PENDING</span>}
                        {l.status === 'REJECTED' && <span className="badge badge-absent">REJECTED</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Leave Modal */}
            {leaveModalOpen && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                <div className="card" style={{ width: '100%', maxWidth: '440px', margin: 0 }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Apply for Leave</h3>
                    <button onClick={() => setLeaveModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <X size={20} />
                    </button>
                  </div>

                  {leaveMsg && (
                    <div style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      fontSize: '0.85rem',
                      backgroundColor: leaveMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: leaveMsg.type === 'success' ? 'var(--status-present)' : 'var(--status-absent)'
                    }}>
                      {leaveMsg.text}
                    </div>
                  )}

                  <form onSubmit={handleApplyLeave}>
                    <div className="input-group">
                      <label className="input-label">Leave Type</label>
                      <select
                        className="input-field"
                        value={leaveType}
                        onChange={(e) => setLeaveType(e.target.value)}
                        style={{ height: '44px' }}
                      >
                        <option value="Casual Leave">Casual Leave</option>
                        <option value="Sick Leave">Sick Leave</option>
                        <option value="Personal Leave">Personal Leave</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="input-group">
                        <label className="input-label">From Date</label>
                        <input
                          type="date"
                          className="input-field"
                          value={leaveFrom}
                          onChange={(e) => setLeaveFrom(e.target.value)}
                          required
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">To Date</label>
                        <input
                          type="date"
                          className="input-field"
                          value={leaveTo}
                          onChange={(e) => setLeaveTo(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Reason</label>
                      <textarea
                        className="input-field"
                        rows={3}
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        placeholder="State reason for leave..."
                        required
                        style={{ resize: 'vertical' }}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setLeaveModalOpen(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={leaveSubmitting}>
                        {leaveSubmitting ? 'Submitting...' : 'Submit Request'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════ TAB 4: ADMIN EMPLOYEES MANAGEMENT ══════════ */}
        {activeTab === 'employees' && isAdmin && (
          <div>
            <header className="flex justify-between items-center" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Staff & Employee Management</h1>
                <p className="text-muted text-sm">Add, view, and monitor daily attendance for all salon team members</p>
              </div>
              <button
                onClick={() => setAddEmpModalOpen(true)}
                className="btn-primary flex items-center gap-2"
                style={{ width: 'auto', padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
              >
                <Plus size={18} />
                <span>Add Employee</span>
              </button>
            </header>

            {/* Quick Staff Stats */}
            <div className="stat-grid">
              <div className="stat-box">
                <span className="stat-box-title">Total Staff Members</span>
                <span className="stat-box-val">{employees.length}</span>
              </div>
              <div className="stat-box">
                <span className="stat-box-title">Present Today</span>
                <span className="stat-box-val" style={{ color: 'var(--status-present)' }}>
                  {employees.filter(e => !!e.todayAttendance?.checkInTime).length}
                </span>
              </div>
              <div className="stat-box">
                <span className="stat-box-title">Not Marked Today</span>
                <span className="stat-box-val" style={{ color: 'var(--status-absent)' }}>
                  {employees.filter(e => !e.todayAttendance?.checkInTime).length}
                </span>
              </div>
            </div>

            {/* Search Box */}
            <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Search size={18} className="text-muted" />
              <input
                type="text"
                placeholder="Search staff by name, ID (e.g. E001), phone, or role..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem' }}
              />
              {employeeSearch && (
                <button onClick={() => setEmployeeSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Employees List */}
            {employeesLoading ? (
              <div className="card text-center" style={{ padding: '3rem' }}>
                <Clock className="animate-spin text-gold" size={28} style={{ margin: '0 auto 0.5rem' }} />
                <p className="text-muted">Loading staff list...</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
                <Users size={48} className="text-muted" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>No employees found</h3>
                <p className="text-muted text-sm">
                  {employeeSearch ? 'Try a different search query.' : 'Click "+ Add Employee" above to add your staff.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredEmployees.map((emp) => {
                  const todayAtt = emp.todayAttendance;
                  const isCheckedIn = !!todayAtt?.checkInTime;
                  const isCheckedOut = !!todayAtt?.checkOutTime;

                  return (
                    <div key={emp._id} className="card" style={{ padding: '1.25rem' }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div className="flex items-center gap-3">
                          <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(197, 160, 89, 0.2)', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.05rem', flexShrink: 0 }}>
                            {emp.name?.[0] || 'E'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{emp.name}</h3>
                              <span className="badge" style={{ backgroundColor: '#f3f4f6', color: 'var(--text-main)', fontSize: '0.75rem' }}>
                                {emp.employeeId}
                              </span>
                            </div>
                            <p className="text-muted text-sm">{emp.designation || 'Staff'} • {emp.department || 'Salon'}</p>
                          </div>
                        </div>

                        {/* Today's Status Badge + Edit Button */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(emp)}
                            title="Edit employee details"
                            style={{
                              background: 'rgba(197,160,89,0.12)',
                              border: '1px solid rgba(197,160,89,0.3)',
                              borderRadius: '8px',
                              padding: '0.35rem 0.65rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              color: 'var(--accent-gold)',
                              fontSize: '0.8rem',
                              fontWeight: 600
                            }}
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                        </div>
                        <div>
                          {!isCheckedIn && (
                            <span className="badge badge-absent">NOT MARKED TODAY</span>
                          )}
                          {isCheckedIn && !isCheckedOut && (
                            <span className="badge badge-present">PRESENT (CHECKED IN)</span>
                          )}
                          {isCheckedOut && (
                            <span className="badge badge-present">CHECKED OUT</span>
                          )}
                        </div>
                      </div>

                      {/* Details row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', fontSize: '0.85rem' }}>
                        <div>
                          <span className="text-muted">Mobile: </span>
                          <strong>{emp.mobile || '—'}</strong>
                        </div>
                        <div>
                          <span className="text-muted">Today's Check-in: </span>
                          <strong>{formatTime(todayAtt?.checkInTime)}</strong>
                        </div>
                        <div>
                          <span className="text-muted">Today's Check-out: </span>
                          <strong>{formatTime(todayAtt?.checkOutTime)}</strong>
                        </div>
                        <div>
                          <span className="text-muted">Base Salary: </span>
                          <strong className="text-gold">{emp.baseSalary ? `₹${emp.baseSalary.toLocaleString()}/mo` : '—'}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Modal: Edit Employee ───────────────────────────────────── */}
            {editEmpModalOpen && editEmpData && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                <div className="card" style={{ width: '100%', maxWidth: '520px', margin: 0, maxHeight: '92vh', overflowY: 'auto' }}>
                  {/* Header */}
                  <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Edit Employee Profile</h3>
                      <p className="text-muted text-sm">
                        ID: <strong>{editEmpData.employeeId}</strong> — update the details below
                      </p>
                    </div>
                    <button onClick={() => setEditEmpModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <X size={20} />
                    </button>
                  </div>

                  {/* Feedback Message */}
                  {editEmpMsg && (
                    <div style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      fontSize: '0.85rem',
                      backgroundColor: editEmpMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: editEmpMsg.type === 'success' ? 'var(--status-present)' : 'var(--status-absent)'
                    }}>
                      {editEmpMsg.text}
                    </div>
                  )}

                  <form onSubmit={handleEditEmployee}>
                    {/* Name */}
                    <div className="input-group">
                      <label className="input-label">Full Name *</label>
                      <input
                        type="text"
                        className="input-field"
                        value={editEmpName}
                        onChange={(e) => setEditEmpName(e.target.value)}
                        placeholder="Employee full name"
                        required
                      />
                    </div>

                    {/* Designation + Department */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="input-group">
                        <label className="input-label">Designation</label>
                        <input
                          type="text"
                          className="input-field"
                          value={editEmpDesig}
                          onChange={(e) => setEditEmpDesig(e.target.value)}
                          placeholder="e.g. Hair Stylist"
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Department</label>
                        <input
                          type="text"
                          className="input-field"
                          value={editEmpDept}
                          onChange={(e) => setEditEmpDept(e.target.value)}
                          placeholder="e.g. Styling, Skin"
                        />
                      </div>
                    </div>

                    {/* Mobile + Salary */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="input-group">
                        <label className="input-label">Mobile Number</label>
                        <input
                          type="tel"
                          className="input-field"
                          value={editEmpMobile}
                          onChange={(e) => setEditEmpMobile(e.target.value)}
                          placeholder="9876543210"
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Monthly Salary (₹)</label>
                        <input
                          type="number"
                          className="input-field"
                          value={editEmpSalary}
                          onChange={(e) => setEditEmpSalary(e.target.value)}
                          placeholder="25000"
                        />
                      </div>
                    </div>

                    {/* Email + Joining Date */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="input-group">
                        <label className="input-label">Email Address</label>
                        <input
                          type="email"
                          className="input-field"
                          value={editEmpEmail}
                          onChange={(e) => setEditEmpEmail(e.target.value)}
                          placeholder="staff@example.com"
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Joining Date</label>
                        <input
                          type="date"
                          className="input-field"
                          value={editEmpJoiningDate}
                          onChange={(e) => setEditEmpJoiningDate(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Status */}
                    <div className="input-group">
                      <label className="input-label">Account Status</label>
                      <select
                        className="input-field"
                        value={editEmpStatus}
                        onChange={(e) => setEditEmpStatus(e.target.value)}
                        style={{ height: '44px' }}
                      >
                        <option value="ACTIVE">ACTIVE — Can log in and mark attendance</option>
                        <option value="DISABLED">DISABLED — Account suspended</option>
                      </select>
                    </div>

                    {/* New Password (optional) */}
                    <div className="input-group">
                      <label className="input-label">New Password (leave blank to keep current)</label>
                      <input
                        type="text"
                        className="input-field"
                        value={editEmpPassword}
                        onChange={(e) => setEditEmpPassword(e.target.value)}
                        placeholder="Leave blank = no change"
                      />
                      <span className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                        Only fill this if you want to reset the employee's login password.
                      </span>
                    </div>

                    {/* Face Registration Section */}
                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
                        <div>
                          <p className="font-bold" style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <ScanFace size={16} style={{ color: 'var(--accent-gold)' }} />
                            AI Face Registration
                          </p>
                          <p className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {editEmpData?.faceDescriptor ? '✓ Face data already registered — click to update' : 'No face registered — register to enable AI verification'}
                          </p>
                        </div>
                        {(editEmpFaceDescriptor || editEmpData?.faceDescriptor) && (
                          <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--status-present)', padding: '0.2rem 0.5rem', borderRadius: '10px', fontWeight: 600 }}>REGISTERED</span>
                        )}
                      </div>

                      {editEmpFaceStatus && (
                        <div style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', marginBottom: '0.75rem', fontSize: '0.82rem', backgroundColor: editEmpFaceStatus.startsWith('success') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: editEmpFaceStatus.startsWith('success') ? 'var(--status-present)' : 'var(--status-absent)' }}>
                          {editEmpFaceStatus.replace(/^(success|error):/, '')}
                        </div>
                      )}

                      {editEmpCameraOpen ? (
                        <div className="flex flex-col items-center">
                          <div style={{ position: 'relative', width: '100%', maxWidth: '280px', aspectRatio: '4/3', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000', marginBottom: '0.75rem' }}>
                            <video ref={editEmpVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <canvas ref={editEmpCanvasRef} style={{ display: 'none' }} />
                          <div className="flex gap-2" style={{ width: '100%', maxWidth: '280px' }}>
                            <button type="button" className="btn-secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }} onClick={() => stopAdminCamera('edit')}>Cancel</button>
                            <button type="button" className="btn-primary flex items-center justify-center gap-1" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }} onClick={() => captureAdminFace('edit')} disabled={editEmpCameraLoading}>
                              <ScanFace size={14} />
                              {editEmpCameraLoading ? 'Scanning...' : 'Scan Face'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn-secondary flex items-center justify-center gap-2"
                          style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}
                          onClick={() => openAdminCamera('edit')}
                        >
                          <ScanFace size={16} />
                          {editEmpData?.faceDescriptor ? 'Update Face Registration' : 'Register Employee Face'}
                        </button>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3" style={{ marginTop: '1rem' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ flex: 1 }}
                        onClick={() => setEditEmpModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary flex items-center justify-center gap-2"
                        style={{ flex: 1 }}
                        disabled={editEmpSubmitting}
                      >
                        <Save size={16} />
                        {editEmpSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal: Add New Employee */}
            {addEmpModalOpen && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                <div className="card" style={{ width: '100%', maxWidth: '480px', margin: 0, maxHeight: '90vh', overflowY: 'auto' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Add New Employee</h3>
                      <p className="text-muted text-sm">Create a staff profile with credentials for login</p>
                    </div>
                    <button onClick={() => setAddEmpModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <X size={20} />
                    </button>
                  </div>

                  {addEmpMsg && (
                    <div style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      fontSize: '0.85rem',
                      backgroundColor: addEmpMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: addEmpMsg.type === 'success' ? 'var(--status-present)' : 'var(--status-absent)'
                    }}>
                      {addEmpMsg.text}
                    </div>
                  )}

                  <form onSubmit={handleAddEmployee}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="input-group">
                        <label className="input-label">Employee ID *</label>
                        <input
                          type="text"
                          className="input-field"
                          value={newEmpId}
                          onChange={(e) => setNewEmpId(e.target.value)}
                          placeholder="e.g. E002, E003"
                          required
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Full Name *</label>
                        <input
                          type="text"
                          className="input-field"
                          value={newEmpName}
                          onChange={(e) => setNewEmpName(e.target.value)}
                          placeholder="e.g. Rahul Verma"
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="input-group">
                        <label className="input-label">Designation</label>
                        <input
                          type="text"
                          className="input-field"
                          value={newEmpDesig}
                          onChange={(e) => setNewEmpDesig(e.target.value)}
                          placeholder="e.g. Hair Stylist"
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Department</label>
                        <input
                          type="text"
                          className="input-field"
                          value={newEmpDept}
                          onChange={(e) => setNewEmpDept(e.target.value)}
                          placeholder="e.g. Styling, Skin"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="input-group">
                        <label className="input-label">Mobile Number (Login)</label>
                        <input
                          type="tel"
                          className="input-field"
                          value={newEmpMobile}
                          onChange={(e) => setNewEmpMobile(e.target.value)}
                          placeholder="e.g. 9876543210"
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Monthly Salary (₹)</label>
                        <input
                          type="number"
                          className="input-field"
                          value={newEmpSalary}
                          onChange={(e) => setNewEmpSalary(e.target.value)}
                          placeholder="25000"
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Email Address (Optional)</label>
                      <input
                        type="email"
                        className="input-field"
                        value={newEmpEmail}
                        onChange={(e) => setNewEmpEmail(e.target.value)}
                        placeholder="staff@dukeduchess.com"
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Initial Password / PIN *</label>
                      <input
                        type="text"
                        className="input-field"
                        value={newEmpPassword}
                        onChange={(e) => setNewEmpPassword(e.target.value)}
                        placeholder="e.g. emp123 or 1234"
                        required
                      />
                      <span className="text-muted text-sm" style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                        The employee will use this password and their Employee ID (or Mobile) to log in.
                      </span>
                    </div>

                    {/* Face Registration Section */}
                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', marginTop: '0.75rem' }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
                        <div>
                          <p className="font-bold" style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <ScanFace size={16} style={{ color: 'var(--accent-gold)' }} />
                            AI Face Registration
                          </p>
                          <p className="text-muted" style={{ fontSize: '0.75rem' }}>Optional — enables AI identity check on every clock-in</p>
                        </div>
                        {newEmpFaceDescriptor && (
                          <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--status-present)', padding: '0.2rem 0.5rem', borderRadius: '10px', fontWeight: 600 }}>REGISTERED</span>
                        )}
                      </div>

                      {addEmpFaceStatus && (
                        <div style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', marginBottom: '0.75rem', fontSize: '0.82rem', backgroundColor: addEmpFaceStatus.startsWith('success') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: addEmpFaceStatus.startsWith('success') ? 'var(--status-present)' : 'var(--status-absent)' }}>
                          {addEmpFaceStatus.replace(/^(success|error):/, '')}
                        </div>
                      )}

                      {addEmpCameraOpen ? (
                        <div className="flex flex-col items-center">
                          <div style={{ position: 'relative', width: '100%', maxWidth: '280px', aspectRatio: '4/3', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000', marginBottom: '0.75rem' }}>
                            <video ref={addEmpVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <canvas ref={addEmpCanvasRef} style={{ display: 'none' }} />
                          <div className="flex gap-2" style={{ width: '100%', maxWidth: '280px' }}>
                            <button type="button" className="btn-secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }} onClick={() => stopAdminCamera('add')}>Cancel</button>
                            <button type="button" className="btn-primary flex items-center justify-center gap-1" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }} onClick={() => captureAdminFace('add')} disabled={addEmpCameraLoading}>
                              <ScanFace size={14} />
                              {addEmpCameraLoading ? 'Scanning...' : 'Scan Face'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn-secondary flex items-center justify-center gap-2"
                          style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}
                          onClick={() => openAdminCamera('add')}
                        >
                          <ScanFace size={16} />
                          {newEmpFaceDescriptor ? '✓ Face Captured — Click to Redo' : 'Capture Reference Face Photo'}
                        </button>
                      )}
                    </div>

                    <div className="flex gap-3" style={{ marginTop: '1rem' }}>
                      <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setAddEmpModalOpen(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={addEmpSubmitting}>
                        {addEmpSubmitting ? 'Creating...' : 'Create Employee'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
