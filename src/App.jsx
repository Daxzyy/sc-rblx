import { useState, useCallback, useRef, useEffect } from 'react';

const API_BASE_URL = '/api/search';
const LOCAL_SCRIPTS_URL = '/sc.json';
const DEBOUNCE_MS = 400;

function ChevronAccent({ className }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M10.8557 2L12 2L12 3.43273L5.99432 10L4.76607 8.65726L10.8557 2Z" fill="currentColor" />
      <path d="M3.55079 7.32345L-6.30174e-08 3.44167L0 2.00188L1.1298 2.00188L4.77259 5.986L3.55079 7.32345Z" fill="currentColor" />
    </svg>
  );
}

function AngledDivider({ width = '100%' }) {
  return (
    <svg width={width} height="5" viewBox="0 0 560 5" preserveAspectRatio="none" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M0 4H560" stroke="var(--gold)" strokeMiterlimit="10" />
      <path d="M430 0H560V4H420L424.76 1.20615C425.66 0.429117 426.81 0.000859238 430 0Z" fill="var(--gold)" />
    </svg>
  );
}

function AngledDividerDouble({ width = '100%' }) {
  return (
    <svg width={width} height="5" viewBox="0 0 560 5" preserveAspectRatio="none" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M0 4H560" stroke="var(--gold)" strokeMiterlimit="10" />
      <path d="M430 0H560V4H420L424.76 1.20615C425.66 0.429117 426.81 0.000859238 430 0Z" fill="var(--gold)" />
      <path d="M130 0H0V4H140L135.24 1.20615C134.34 0.429117 133.19 0.000859238 130 0Z" fill="var(--gold)" />
    </svg>
  );
}

function TitleUnderline({ width = 73 }) {
  return (
    <svg width={width} height="4" viewBox="0 0 73 4" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <path d="M57.2497 0L53.6572 3.60889H0V0H57.2497Z" fill="var(--gold)" />
      <path d="M62.4526 0L58.8601 3.60889H56.8293L60.4218 0H62.4526Z" fill="var(--gold)" />
      <path d="M67.6555 0L64.063 3.60889H62.0278L65.6247 0H67.6555Z" fill="var(--gold)" />
      <path d="M72.8583 0L69.2614 3.60889H67.2307L70.8276 0H72.8583Z" fill="var(--gold)" />
    </svg>
  );
}

function SearchGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CopyGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="12" height="12" rx="1" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </svg>
  );
}

function ClearGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SnippetCard({ title, code }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 1600);
  }, [code]);

  return (
    <article style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>{title}</h3>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            ...styles.copyButton,
            ...(copied ? styles.copyButtonActive : null),
          }}
          aria-label={copied ? 'Kode disalin' : 'Salin kode'}
        >
          {copied ? <CheckGlyph /> : <CopyGlyph />}
          <span>{copied ? 'Disalin' : 'Salin'}</span>
        </button>
      </div>
      <pre style={styles.codeBlock}>
        <code>{code}</code>
      </pre>
    </article>
  );
}

function mergeResults(apiItems, localItems) {
  const seen = new Set();
  const combined = [];

  for (const item of apiItems) {
    const key = item.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    combined.push(item);
  }

  for (const item of localItems) {
    const key = item.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    combined.push(item);
  }

  return combined;
}

function sortByExactMatch(items, lowerQuery) {
  return [...items].sort((a, b) => {
    const aExact = a.title.toLowerCase() === lowerQuery;
    const bExact = b.title.toLowerCase() === lowerQuery;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return 0;
  });
}

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);
  const localScriptsRef = useRef(null);

  const loadLocalScripts = useCallback(async () => {
    if (localScriptsRef.current) return localScriptsRef.current;

    try {
      const response = await fetch(LOCAL_SCRIPTS_URL, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('sc.json tidak ditemukan');
      const data = await response.json();
      localScriptsRef.current = Array.isArray(data) ? data : [];
    } catch {
      localScriptsRef.current = [];
    }

    return localScriptsRef.current;
  }, []);

  const runSearch = useCallback(async (q) => {
    const trimmed = q.trim();

    if (!trimmed) {
      setStatus('idle');
      setResults([]);
      setHasSearched(false);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setErrorMessage('');
    setHasSearched(true);

    const lowerQuery = trimmed.toLowerCase();
    const localScripts = await loadLocalScripts();
    const localMatches = localScripts
      .filter((item) => (item.title || '').toLowerCase().includes(lowerQuery))
      .map((item, index) => ({
        id: `local-${index}-${item.title ?? 'untitled'}`,
        title: item.title ?? 'Tanpa judul',
        code: item.script ?? '',
      }));

    try {
      const url = new URL(API_BASE_URL, window.location.origin);
      url.searchParams.set('q', trimmed);

      const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Permintaan gagal (${response.status})`);
      }

      const data = await response.json();
      const scripts = data?.result?.scripts ?? [];
      const apiMatches = scripts.map((item, index) => ({
        id: `api-${index}-${item.title ?? 'untitled'}`,
        title: item.title ?? 'Tanpa judul',
        code: item.script ?? '',
      }));

      const combined = sortByExactMatch(mergeResults(apiMatches, localMatches), lowerQuery);
      setResults(combined);
      setStatus('success');
    } catch (err) {
      if (err.name === 'AbortError') return;

      if (localMatches.length > 0) {
        setResults(sortByExactMatch(localMatches, lowerQuery));
        setStatus('success');
        return;
      }

      setStatus('error');
      setErrorMessage(err.message || 'Terjadi kesalahan saat mencari.');
      setResults([]);
    }
  }, [loadLocalScripts]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(query);
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceRef.current);
  }, [query, runSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const audio = new Audio('/lagu.mp3');
    audio.loop = true;
    audio.preload = 'auto';
    audioRef.current = audio;

    const startPlayback = () => {
      audio.play().then(() => {
        window.removeEventListener('click', startPlayback);
        window.removeEventListener('keydown', startPlayback);
        window.removeEventListener('touchstart', startPlayback);
      }).catch(() => {});
    };

    window.addEventListener('click', startPlayback);
    window.addEventListener('keydown', startPlayback);
    window.addEventListener('touchstart', startPlayback);

    return () => {
      window.removeEventListener('click', startPlayback);
      window.removeEventListener('keydown', startPlayback);
      window.removeEventListener('touchstart', startPlayback);
      audio.pause();
      audio.src = '';
    };
  }, []);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brandRow}>
          <div style={styles.badge}>
            <img src="/logo.jpg" alt="Script Gobloks logo" style={styles.badgeImage} />
          </div>
          <span style={styles.brandText}>SCRIPT GOBLOX</span>
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.hero}>
          <h1 style={styles.heroTitle}>Cari scriptnya, copy, gasskeun😈😋</h1>
          <div style={{ marginTop: 10, marginBottom: 22 }}>
            <TitleUnderline width={96} />
          </div>

          <div style={styles.searchRow}>
            <div style={styles.searchInputWrap}>
              <span style={styles.searchIcon}>
                <SearchGlyph />
              </span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ketik aja wok..."
                style={styles.searchInput}
                aria-label="Cari snippet"
              />
              {query.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  style={styles.clearButton}
                  aria-label="Hapus query"
                >
                  <ClearGlyph />
                </button>
              )}
            </div>
          </div>

          {status === 'success' && results.length > 0 && (
            <p style={styles.resultCount}>
              Ketemu <span style={styles.resultCountNumber}>{results.length}</span> script buat "{query}"
            </p>
          )}
        </section>

        <div style={{ margin: '28px 0' }}>
          <AngledDivider />
        </div>

        <section aria-live="polite">
          {status === 'loading' && (
            <p style={styles.statusText}>Mencari script...</p>
          )}

          {status === 'error' && (
            <div style={styles.errorBox}>
              <p style={{ margin: 0 }}>{errorMessage}</p>
              <p style={{ margin: '6px 0 0', color: 'var(--light-text)', fontSize: 13 }}>
                Pastikan environment variable SCRIPT_API_URL sudah diisi di Vercel.
              </p>
            </div>
          )}

          {status === 'success' && results.length === 0 && (
            <p style={styles.statusText}>Nggak ada snippet yang cocok dengan "{query}".</p>
          )}

          {!hasSearched && status !== 'loading' && (
            <p style={styles.statusText}>Mulai ketik mapnya buat nampilin sc nya😎</p>
          )}

          <div style={styles.resultsList}>
            {results.map((item) => (
              <SnippetCard key={item.id} title={item.title} code={item.code} />
            ))}
          </div>
        </section>
      </main>

      <footer style={styles.footer}>
        <div style={styles.footerDivider}>
          <AngledDividerDouble />
        </div>
        <p style={styles.footerText}>
          Script Goblox <span style={styles.footerDash}>-</span>{' '}
          
            <a href="https://wa.me/+62895423300395?text=halo+givy+ganteng"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.footerHandle}
          >
            @givyXfhan
          </a>
        </p>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--background)',
    paddingBottom: 80,
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid var(--border-subtle)',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    maxWidth: 860,
    margin: '0 auto',
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 6,
    background: '#373F4B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    border: '1px solid var(--border-subtle)',
  },
  badgeImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  brandText: {
    fontFamily: 'var(--font-family)',
    fontWeight: 700,
    fontSize: 20,
    letterSpacing: '0.12em',
    color: 'var(--gold-text)',
  },
  main: {
    flex: 1,
    width: '100%',
    maxWidth: 860,
    margin: '0 auto',
    padding: '48px 24px 40px',
  },
  hero: {
    textAlign: 'left',
  },
  heroTitle: {
    fontFamily: 'var(--font-family)',
    fontWeight: 500,
    fontSize: 'clamp(24px, 4vw, 34px)',
    color: 'var(--white)',
    margin: 0,
    letterSpacing: '0.01em',
  },
  searchRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  searchInputWrap: {
    position: 'relative',
    flex: '1 1 320px',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    color: 'var(--light-text)',
    display: 'flex',
  },
  searchInput: {
    width: '100%',
    background: 'var(--panel-bg)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 4,
    color: 'var(--white)',
    fontFamily: 'var(--font-family)',
    fontSize: 15,
    padding: '14px 44px 14px 46px',
    outline: 'none',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    background: 'transparent',
    border: 'none',
    borderRadius: 4,
    color: 'var(--light-text)',
    cursor: 'pointer',
    padding: 0,
  },
  resultCount: {
    margin: '14px 0 0',
    fontSize: 13,
    color: 'var(--light-text)',
  },
  resultCountNumber: {
    color: 'var(--gold-text)',
    fontWeight: 700,
  },
  statusText: {
    color: 'var(--light-text)',
    fontSize: 14,
    margin: '0 0 20px',
  },
  errorBox: {
    background: 'var(--error-bg)',
    border: '1px solid var(--error-border)',
    color: 'var(--error-text)',
    borderRadius: 4,
    padding: '14px 16px',
    marginBottom: 20,
    fontSize: 14,
  },
  resultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  card: {
    background: 'var(--panel-bg)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '14px 16px',
    borderBottom: '1px solid var(--border-subtle)',
  },
  cardTitle: {
    margin: 0,
    fontFamily: 'var(--font-family)',
    fontWeight: 500,
    fontSize: 15,
    color: 'var(--white)',
    wordBreak: 'break-word',
  },
  copyButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    background: 'transparent',
    border: '1px solid var(--border-subtle)',
    color: 'var(--gold-text)',
    borderRadius: 4,
    fontSize: 13,
    fontFamily: 'var(--font-family)',
    padding: '6px 12px',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease, color 0.15s ease',
  },
  copyButtonActive: {
    borderColor: 'var(--gold)',
    color: 'var(--gold-hover)',
  },
  codeBlock: {
    margin: 0,
    background: 'var(--panel-bg-alt)',
    color: 'var(--light-text)',
    fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 13,
    lineHeight: 1.6,
    padding: 16,
    overflowX: 'auto',
    whiteSpace: 'pre',
  },
  footer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'var(--panel-bg)',
    zIndex: 10,
    textAlign: 'center',
    padding: '12px 24px 14px',
  },
  footerDivider: {
    marginBottom: 10,
  },
  footerText: {
    margin: 0,
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.01em',
    color: 'var(--light-text)',
  },
  footerDash: {
    color: 'var(--border-subtle)',
    margin: '0 2px',
  },
  footerHandle: {
    color: 'var(--gold-text)',
  },
};
