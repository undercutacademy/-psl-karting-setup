'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { TRANSLATIONS, Language } from '@/lib/translations';

type Mode = 'ios' | 'desktop' | null;

type Props = {
  teamName: string;
  logoUrl: string;
  primaryColor: string;
};

function detectMode(): Mode {
  if (typeof window === 'undefined') return null;

  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes('Mac') && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  if (isStandalone) return null;
  if (isIOS) return 'ios';
  if (isAndroid) return null;
  return 'desktop';
}

export default function InstallAppButton({
  teamName,
  logoUrl,
  primaryColor,
}: Props) {
  const [mode, setMode] = useState<Mode>(null);
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    setMode(detectMode());
    const saved = localStorage.getItem('preferred_language') as Language | null;
    if (saved && ['en', 'es', 'pt', 'it'].includes(saved)) {
      setLang(saved);
    }
  }, []);

  if (!mode) return null;

  const t = TRANSLATIONS[lang];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 w-full rounded-xl border border-gray-700/60 bg-gray-800/40 px-4 py-3 text-sm font-semibold text-gray-300 uppercase tracking-wider transition-all hover:border-gray-500 hover:bg-gray-700/60 hover:text-white flex items-center justify-center gap-2"
      >
        <span>📱</span>
        <span>{t.installAppButton}</span>
      </button>

      {open && (
        <InstallModal
          mode={mode}
          t={t}
          teamName={teamName}
          logoUrl={logoUrl}
          primaryColor={primaryColor}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

type ModalProps = {
  mode: Exclude<Mode, null>;
  t: (typeof TRANSLATIONS)[Language];
  teamName: string;
  logoUrl: string;
  primaryColor: string;
  onClose: () => void;
};

function InstallModal({
  mode,
  t,
  teamName,
  logoUrl,
  primaryColor,
  onClose,
}: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top racing stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(to right, ${primaryColor}, white, ${primaryColor})`,
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt={teamName}
              className="h-8 w-auto object-contain flex-shrink-0"
            />
            <h2
              id="install-modal-title"
              className="text-white font-bold uppercase tracking-wider text-sm truncate"
            >
              {t.installModalTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.installClose}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {mode === 'ios' ? (
            <IOSBody t={t} primaryColor={primaryColor} />
          ) : (
            <DesktopBody t={t} />
          )}
        </div>
      </div>
    </div>
  );
}

function IOSBody({
  t,
  primaryColor,
}: {
  t: (typeof TRANSLATIONS)[Language];
  primaryColor: string;
}) {
  return (
    <>
      <p className="text-gray-400 text-sm text-center mb-4">
        {t.installModalSubtitle}
      </p>

      <div className="mx-auto max-w-[280px] mb-5">
        <div className="rounded-[2rem] border-4 border-gray-800 overflow-hidden bg-black shadow-inner">
          <video
            src="/install-guide/ios-install.mp4"
            poster="/install-guide/ios-install-poster.jpg"
            muted
            autoPlay
            loop
            playsInline
            preload="metadata"
            aria-label={t.installModalSubtitle}
            className="w-full h-auto block"
          />
        </div>
      </div>

      <ol className="space-y-2 text-sm mb-4">
        {[t.installStep1, t.installStep2, t.installStep3].map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="flex-shrink-0 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              {i + 1}
            </span>
            <span className="text-gray-200 pt-0.5">{step}</span>
          </li>
        ))}
      </ol>

      <p className="text-gray-500 text-xs text-center border-t border-gray-800 pt-3">
        {t.installFooterNote}
      </p>
    </>
  );
}

function DesktopBody({ t }: { t: (typeof TRANSLATIONS)[Language] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, window.location.href, {
      width: 220,
      margin: 1,
      color: { dark: '#111111', light: '#ffffff' },
    }).catch((err) => {
      console.error('Failed to render QR code', err);
    });
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <h3 className="text-white font-bold text-lg text-center">
        {t.installDesktopTitle}
      </h3>
      <div className="bg-white p-3 rounded-xl">
        <canvas ref={canvasRef} />
      </div>
      <p className="text-gray-400 text-sm text-center max-w-xs">
        {t.installDesktopSubtitle}
      </p>
    </div>
  );
}
