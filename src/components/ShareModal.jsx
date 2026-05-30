import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, X, Link2 } from 'lucide-react';
import { SocialIcon } from './icons/SocialIcons';
import ShareToast from './ShareToast';
import { SHARE_GROUPS, SHARE_PLATFORMS, openShareLink } from '../utils/sharePlatforms';

function canUseNativeShare() {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

const SharePlatformButton = React.memo(function SharePlatformButton({ platform, onClick }) {
  const isSnapchat = platform.id === 'snapchat';
  const iconClass = isSnapchat ? 'h-5 w-5 text-black' : 'h-5 w-5 text-white';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-1.5 rounded-2xl p-2.5 sm:p-3 min-h-[88px] sm:min-h-[92px] transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple/50 touch-manipulation"
      style={{
        border: '1px solid var(--border-soft)',
        background: 'var(--card-bg)',
      }}
      aria-label={`Share on ${platform.name}`}
    >
      <span
        className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl transition-shadow duration-200 group-hover:shadow-md"
        style={{ backgroundColor: platform.brandColor }}
      >
        <SocialIcon id={platform.id} className={iconClass} />
      </span>
      <span
        className="text-[10px] sm:text-[11px] font-semibold text-center leading-tight line-clamp-2 w-full"
        style={{ color: 'var(--text-secondary)' }}
      >
        {platform.name}
      </span>
    </button>
  );
});

export default function ShareModal({ isOpen, onClose, payload }) {
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const toastTimerRef = useRef(null);

  const platforms = useMemo(() => {
    if (!canUseNativeShare()) {
      return SHARE_PLATFORMS.filter((p) => p.id !== 'native');
    }
    return SHARE_PLATFORMS;
  }, []);

  const grouped = useMemo(
    () =>
      SHARE_GROUPS.map((group) => ({
        ...group,
        items: platforms.filter((p) => p.group === group.id),
      })).filter((g) => g.items.length > 0),
    [platforms]
  );

  const showToast = useCallback((message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ visible: true, message });
    toastTimerRef.current = setTimeout(() => {
      setToast({ visible: false, message: '' });
    }, 2800);
  }, []);

  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    }
  }, []);

  const onSharePlatform = useCallback(
    async (platform) => {
      if (!payload?.url) return;

      const shareData = {
        url: payload.url,
        title: payload.title,
        description: payload.description,
        text: payload.text,
        image: payload.image,
      };

      if (platform.type === 'native') {
        try {
          await navigator.share({
            title: payload.title,
            text: payload.text,
            url: payload.url,
          });
          showToast(platform.hint || 'Shared successfully');
        } catch (err) {
          if (err?.name !== 'AbortError') {
            const copied = await copyToClipboard(`${payload.text}\n\n${payload.url}`);
            if (copied) showToast('Link copied — native share unavailable');
          }
        }
        return;
      }

      if (platform.type === 'copy') {
        const textToCopy = platform.id === 'copy' ? payload.url : `${payload.text}\n\n${payload.url}`;
        const copied = await copyToClipboard(textToCopy);
        showToast(copied ? (platform.hint || 'Link copied!') : 'Could not copy link');
        return;
      }

      if (platform.type === 'link' && platform.getUrl) {
        openShareLink(platform.getUrl(shareData));
      }
    },
    [payload, showToast, copyToClipboard]
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => closeBtnRef.current?.focus(), 50);

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    []
  );

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleCopyUrlBar = async () => {
    if (!payload?.url) return;
    const copied = await copyToClipboard(payload.url);
    showToast(copied ? 'Link copied!' : 'Could not copy link');
  };

  if (!payload) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: 'var(--overlay)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
          >
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="share-dialog-title"
              aria-describedby="share-dialog-desc"
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="glass-card w-full sm:max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-glass-heavy"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 shrink-0"
                style={{ borderBottom: '1px solid var(--border-soft)' }}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-cyan flex items-center justify-center shrink-0 shadow-glow-sm">
                    <Share2 size={20} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2
                      id="share-dialog-title"
                      className="font-display text-base sm:text-lg font-bold leading-tight"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Share your strategy
                    </h2>
                    <p
                      id="share-dialog-desc"
                      className="text-[11px] sm:text-xs mt-0.5 leading-relaxed line-clamp-2"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {payload.description}
                    </p>
                  </div>
                </div>
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={onClose}
                  className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                  style={{ border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-muted)' }}
                  aria-label="Close share dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-5 py-3 shrink-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                  Strategy link
                </span>
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 min-h-[44px]"
                  style={{ border: '1px solid var(--border)', background: 'var(--input-bg)' }}
                >
                  <Link2 size={14} className="shrink-0 text-neon-purple" aria-hidden />
                  <span
                    className="flex-1 text-[11px] sm:text-xs font-mono truncate"
                    style={{ color: 'var(--text-secondary)' }}
                    title={payload.url}
                  >
                    {payload.url}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUrlBar}
                    className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-lg bg-neon-purple/15 text-neon-purple hover:bg-neon-purple/25 transition-colors min-h-[36px] touch-manipulation"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6 space-y-5 min-h-0">
                {grouped.map((group) => (
                  <section key={group.id} aria-labelledby={`share-group-${group.id}`}>
                    <h3
                      id={`share-group-${group.id}`}
                      className="text-[10px] font-bold uppercase tracking-wider mb-2.5"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {group.label}
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-2.5">
                      {group.items.map((platform) => (
                        <SharePlatformButton
                          key={platform.id}
                          platform={platform}
                          onClick={() => onSharePlatform(platform)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ShareToast message={toast.message} visible={toast.visible} />
    </>
  );
}
