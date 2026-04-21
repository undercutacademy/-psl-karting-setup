'use client';

import { useEffect, useState } from 'react';
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
      {/* Modal comes in Task 6 */}
    </>
  );
}
