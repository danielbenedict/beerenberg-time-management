import React, { useState, useEffect } from 'react';
import { verifyPin, recordClockEvent } from './api';
import { Clock, ShieldCheck, UserCheck, Delete, ArrowRight, CheckCircle2, Camera, ScanLine, LogOut, Coffee, Utensils, CupSoda, HelpCircle, AlertTriangle } from 'lucide-react';

export default function App() {
  const [pin, setPin] = useState('');
  const [time, setTime] = useState(new Date());
  const [identifiedUser, setIdentifiedUser] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [successEvent, setSuccessEvent] = useState(null);
  const [loading, setLoading] = useState(false);

  // Task 3.2: Break Reason Modal State
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);

  // Task 3.3: Soft Compliance Alert State
  const [complianceWarning, setComplianceWarning] = useState(null);

  // Real-time Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleKeyPress = (num) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleClear = () => {
    setPin('');
    setIdentifiedUser(null);
    setStatusMessage('');
    setSuccessEvent(null);
    setIsBreakModalOpen(false);
    setComplianceWarning(null);
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleVerifyPin = async () => {
    if (pin.length !== 4) {
      setStatusMessage('Please enter a 4-digit PIN');
      return;
    }

    setLoading(true);
    setStatusMessage('Verifying identity...');

    try {
      const response = await verifyPin(pin);
      const user = response.data.user;
      setIdentifiedUser(user);
      setStatusMessage('');

      // Task 3.3: Evaluate continuous shift duration for meal break compliance
      if (user && user.lastClockIn) {
        const clockInTime = new Date(user.lastClockIn);
        const continuousHours = (new Date() - clockInTime) / (1000 * 60 * 60);

        if (continuousHours >= 4.5 && !user.hasTakenMealBreak) {
          setComplianceWarning(
            `Compliance Alert: You have been working for ${continuousHours.toFixed(1)} continuous hours. Fair Work Clause 32.5 requires an unpaid meal break before reaching 5 hours.`
          );
        }
      }
    } catch (err) {
      console.error(err);
      setStatusMessage(err.response?.data?.error || 'Invalid PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClockAction = async (eventType, breakReason = null) => {
    if (!identifiedUser) return;
    setLoading(true);

    try {
      await recordClockEvent({
        userId: identifiedUser.userId,
        eventType,
        verificationMethod: 'PIN',
        breakReason
      });

      setSuccessEvent({
        type: breakReason ? `${eventType.replace('_', ' ')} (${breakReason})` : eventType.replace('_', ' '),
        time: new Date().toLocaleTimeString('en-AU')
      });

      setIsBreakModalOpen(false);

      setTimeout(() => {
        handleClear();
      }, 3500);
    } catch (err) {
      console.error(err);
      setStatusMessage('Failed to record event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <ShieldCheck size={36} color="#D32F2F" />
          <div>
            <h1 style={styles.brandTitle}>Beerenberg Time Station</h1>
            <p style={styles.brandSub}>Hahndorf Factory Entrance — Kiosk #01</p>
          </div>
        </div>
        <div style={styles.clockBox}>
          <Clock size={20} color="#555" />
          <span style={styles.clockTime}>{time.toLocaleTimeString()}</span>
          <span style={styles.clockDate}>{time.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        </div>
      </header>

      <main style={styles.container}>
        {successEvent ? (
          /* SUCCESS FEEDBACK MODAL */
          <div style={{ ...styles.card, borderColor: '#10B981' }}>
            <CheckCircle2 size={64} color="#10B981" style={{ margin: '0 auto 16px auto' }} />
            <h2 style={{ color: '#FFF', margin: '0 0 8px 0' }}>{successEvent.type} Recorded!</h2>
            <p style={{ color: '#9CA3AF', margin: 0 }}>Timestamp: {successEvent.time}</p>
            <p style={{ color: '#E5E7EB', marginTop: '16px', fontSize: '13px' }}>Returning to home screen...</p>
          </div>
        ) : !identifiedUser ? (
          <div style={styles.kioskGrid}>
            {/* WEBCAM MOCK SCANNER */}
            <div style={styles.cameraCard}>
              <div style={styles.cameraHeader}>
                <Camera size={20} color="#9CA3AF" />
                <span style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: 'bold' }}>LIVE CAM — FACIAL MOCK</span>
              </div>
              <div style={styles.cameraFeed}>
                <ScanLine size={64} color="#D32F2F" style={{ opacity: 0.8 }} />
                <p style={styles.cameraText}>Position face or RFID badge towards camera</p>
              </div>
            </div>

            {/* PIN KEYPAD */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Enter Staff PIN</h2>
              <p style={styles.cardSub}>Touch keypad below to authenticate</p>

              <div style={styles.pinDisplay}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{ ...styles.pinDot, backgroundColor: pin.length > i ? '#D32F2F' : '#E0E0E0' }} />
                ))}
              </div>

              {statusMessage && (
                <p style={{ color: statusMessage.includes('Invalid') || statusMessage.includes('Please') ? '#EF4444' : '#10B981', fontWeight: 'bold', fontSize: '14px', marginBottom: '16px' }}>
                  {statusMessage}
                </p>
              )}

              <div style={styles.keypad}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button key={num} style={styles.keyBtn} onClick={() => handleKeyPress(num.toString())}>
                    {num}
                  </button>
                ))}
                <button style={{ ...styles.keyBtn, backgroundColor: '#7F1D1D', color: '#FECACA' }} onClick={handleClear}>
                  C
                </button>
                <button style={styles.keyBtn} onClick={() => handleKeyPress('0')}>
                  0
                </button>
                <button style={styles.keyBtn} onClick={handleDelete}>
                  <Delete size={24} />
                </button>
              </div>

              <button style={styles.submitBtn} onClick={handleVerifyPin} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify PIN'} <ArrowRight size={20} />
              </button>
            </div>
          </div>
        ) : (
          /* IDENTIFIED USER ACTION MENU */
          <div style={styles.card}>
            <div style={styles.userBadge}>
              <UserCheck size={36} color="#10B981" />
              <div>
                <h2 style={{ margin: 0, color: '#FFF', fontSize: '22px' }}>{identifiedUser.firstName} {identifiedUser.lastName}</h2>
                <p style={{ margin: 0, color: '#9CA3AF', fontSize: '14px' }}>{identifiedUser.employeeCode} • {identifiedUser.deptName}</p>
              </div>
            </div>

            {/* TASK 3.3: SOFT COMPLIANCE PROMPT BANNER */}
            {complianceWarning && (
              <div style={styles.warningBanner}>
                <AlertTriangle size={24} color="#F59E0B" style={{ flexShrink: 0 }} />
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ color: '#FBBF24', fontSize: '13px', display: 'block' }}>Meal Break Alert</strong>
                  <span style={{ color: '#FEF3C7', fontSize: '12px', lineHeight: '1.4', display: 'block' }}>{complianceWarning}</span>
                </div>
              </div>
            )}

            <p style={{ margin: '24px 0 12px 0', fontWeight: 'bold', color: '#E5E7EB', textAlign: 'left' }}>Select Clocking Event:</p>

            <div style={styles.actionGrid}>
              <button style={{ ...styles.actionBtn, backgroundColor: '#059669' }} onClick={() => handleClockAction('CLOCK_IN')} disabled={loading}>
                <CheckCircle2 size={22} /> Clock IN
              </button>
              <button style={{ ...styles.actionBtn, backgroundColor: complianceWarning ? '#B45309' : '#D97706' }} onClick={() => setIsBreakModalOpen(true)} disabled={loading}>
                <Coffee size={22} /> Start Break
              </button>
              <button style={{ ...styles.actionBtn, backgroundColor: '#0284C7' }} onClick={() => handleClockAction('BREAK_END')} disabled={loading}>
                <Coffee size={22} /> End Break
              </button>
              <button style={{ ...styles.actionBtn, backgroundColor: '#DC2626' }} onClick={() => handleClockAction('CLOCK_OUT')} disabled={loading}>
                <LogOut size={22} /> Clock OUT
              </button>
            </div>

            <button style={styles.secondaryBtn} onClick={handleClear}>
              Cancel / Exit
            </button>
          </div>
        )}

        {/* TASK 3.2: BREAK REASON SELECTOR MODAL */}
        {isBreakModalOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalCard}>
              <h2 style={{ color: '#FFF', marginTop: 0, fontSize: '20px' }}>Select Break Type</h2>
              <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '20px' }}>
                Please specify your break category for Award compliance:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  style={styles.breakReasonBtn} 
                  onClick={() => handleClockAction('BREAK_START', 'Meal / Lunch Break')}
                >
                  <Utensils size={20} color="#F59E0B" />
                  <div style={{ textAlign: 'left' }}>
                    <strong style={{ display: 'block', color: '#FFF' }}>Meal / Lunch Break</strong>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Unpaid break (&gt; 20 mins)</span>
                  </div>
                </button>

                <button 
                  style={styles.breakReasonBtn} 
                  onClick={() => handleClockAction('BREAK_START', 'Rest / Tea Break')}
                >
                  <CupSoda size={20} color="#10B981" />
                  <div style={{ textAlign: 'left' }}>
                    <strong style={{ display: 'block', color: '#FFF' }}>Rest / Tea Break</strong>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Paid break (&lt;= 20 mins)</span>
                  </div>
                </button>

                <button 
                  style={styles.breakReasonBtn} 
                  onClick={() => handleClockAction('BREAK_START', 'Authorized Special Break')}
                >
                  <HelpCircle size={20} color="#3B82F6" />
                  <div style={{ textAlign: 'left' }}>
                    <strong style={{ display: 'block', color: '#FFF' }}>Authorized Special Break</strong>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Medical / Emergency</span>
                  </div>
                </button>
              </div>

              <button 
                style={{ ...styles.secondaryBtn, marginTop: '20px' }} 
                onClick={() => setIsBreakModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: { fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#111827', minHeight: '100vh', color: '#FFF' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', backgroundColor: '#1F2937', borderBottom: '1px solid #374151' },
  brand: { display: 'flex', alignItems: 'center', gap: '16px' },
  brandTitle: { margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#FFF' },
  brandSub: { margin: 0, fontSize: '13px', color: '#9CA3AF' },
  clockBox: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#111827', padding: '10px 20px', borderRadius: '8px', border: '1px solid #374151' },
  clockTime: { fontSize: '20px', fontWeight: 'bold', color: '#FFF' },
  clockDate: { fontSize: '14px', color: '#9CA3AF' },
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 20px' },
  kioskGrid: { display: 'flex', gap: '32px', alignItems: 'center' },
  cameraCard: { backgroundColor: '#1F2937', borderRadius: '16px', padding: '20px', width: '320px', height: '420px', border: '1px solid #374151', display: 'flex', flexDirection: 'column' },
  cameraHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' },
  cameraFeed: { flex: 1, backgroundColor: '#111827', borderRadius: '12px', border: '2px dashed #374151', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', textAlign: 'center' },
  cameraText: { color: '#6B7280', fontSize: '13px', marginTop: '16px' },
  card: { backgroundColor: '#1F2937', borderRadius: '16px', padding: '36px', width: '380px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', border: '1px solid #374151' },
  cardTitle: { margin: '0 0 8px 0', fontSize: '20px', color: '#FFF' },
  cardSub: { margin: '0 0 20px 0', fontSize: '13px', color: '#9CA3AF' },
  pinDisplay: { display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '20px' },
  pinDot: { width: '18px', height: '18px', borderRadius: '50%', transition: 'all 0.2s' },
  keypad: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' },
  keyBtn: { height: '56px', borderRadius: '10px', backgroundColor: '#374151', color: '#FFF', fontSize: '22px', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  submitBtn: { width: '100%', height: '50px', backgroundColor: '#D32F2F', color: '#FFF', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' },
  secondaryBtn: { width: '100%', height: '48px', backgroundColor: '#374151', color: '#FFF', border: 'none', borderRadius: '8px', marginTop: '20px', cursor: 'pointer' },
  userBadge: { display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#111827', padding: '16px', borderRadius: '12px', textAlign: 'left' },
  warningBanner: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#78350F', border: '1px solid #F59E0B', borderRadius: '10px', padding: '12px', marginTop: '16px' },
  actionGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  actionBtn: { height: '56px', color: '#FFF', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalCard: { backgroundColor: '#1F2937', borderRadius: '16px', padding: '28px', width: '360px', border: '1px solid #374151', textAlign: 'center' },
  breakReasonBtn: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '10px', cursor: 'pointer', width: '100%' }
};