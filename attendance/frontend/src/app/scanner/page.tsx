'use client';

import React from 'react';
import Link from 'next/link';
import FuturisticFaceScanner from '@/components/FuturisticFaceScanner';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function ScannerPage() {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: '#030303',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Top Navigation Bar */}
      <header
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(3, 3, 3, 0.75)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#aaa',
            fontSize: '0.8rem',
            letterSpacing: '0.08em',
            textDecoration: 'none',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#00ff66')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#aaa')}
        >
          <ArrowLeft size={16} />
          <span>ATTENDANCE DASHBOARD</span>
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.75rem',
            letterSpacing: '0.14em',
            color: '#888',
            fontFamily: 'monospace'
          }}
        >
          <ShieldCheck size={16} color="#00ff66" />
          <span>AI BIOMETRIC SUITE 2026</span>
        </div>
      </header>

      {/* Main Scanner Container */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '3.5rem'
        }}
      >
        <FuturisticFaceScanner
          mode="standalone"
          onComplete={(result) => {
            console.log('Biometric Scan Finished:', result);
          }}
        />
      </main>
    </div>
  );
}
