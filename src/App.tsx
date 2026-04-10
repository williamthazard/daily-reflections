import { useState, useEffect, useRef } from 'react';
import { IoCalendarOutline, IoCloseOutline, IoPlayOutline, IoPauseOutline } from 'react-icons/io5';

type ReflectionData = {
  date: string;
  title: string;
  quote?: string;
  body: string;
  audioTrackId?: string | null;
  audioSecretToken?: string | null;
};

type ReflectionIndexItem = {
  date: string;
  title: string;
};

type Theme = 'light' | 'dark' | 'system';

// Minimalist Audio Player Component
const AudioPlayer = ({ trackId, secretToken }: { trackId: string, secretToken?: string | null }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<any>(null);

  // Initialize widget once
  useEffect(() => {
    if (!iframeRef.current || !(window as any).SC) return;
    
    const widget = (window as any).SC.Widget(iframeRef.current);
    widgetRef.current = widget;

    const onReady = () => {
      widget.getDuration((d: number) => setDuration(d));
    };
    const onPlay = () => {
      setIsPlaying(true);
      // Fallback: fetch duration if still 0
      widget.getDuration((d: number) => {
        if (d) setDuration(d);
      });
    };
    const onPause = () => setIsPlaying(false);
    const onFinish = () => setIsPlaying(false);
    const onProgress = (data: { currentPosition: number }) => {
      setProgress(data.currentPosition);
      // Fallback: if duration is still 0, try to get it again
      if (duration === 0) {
        widget.getDuration((d: number) => {
          if (d) setDuration(d);
        });
      }
    };

    widget.bind((window as any).SC.Widget.Events.READY, onReady);
    widget.bind((window as any).SC.Widget.Events.PLAY, onPlay);
    widget.bind((window as any).SC.Widget.Events.PAUSE, onPause);
    widget.bind((window as any).SC.Widget.Events.FINISH, onFinish);
    widget.bind((window as any).SC.Widget.Events.PLAY_PROGRESS, onProgress);

    return () => {
      if (widgetRef.current) {
        widgetRef.current.unbind((window as any).SC.Widget.Events.READY);
        widgetRef.current.unbind((window as any).SC.Widget.Events.PLAY);
        widgetRef.current.unbind((window as any).SC.Widget.Events.PAUSE);
        widgetRef.current.unbind((window as any).SC.Widget.Events.FINISH);
        widgetRef.current.unbind((window as any).SC.Widget.Events.PLAY_PROGRESS);
      }
    };
  }, []);

  // Load new track when IDs change without unmounting
  useEffect(() => {
    if (widgetRef.current && trackId) {
      const url = `https://api.soundcloud.com/tracks/${trackId}${secretToken ? `%3Fsecret_token%3D${secretToken}` : ''}`;
      
      // Reset local state for new track
      setProgress(0);
      setDuration(0);

      widgetRef.current.load(url, {
        auto_play: false,
        show_comments: false,
        show_user: false,
        show_reposts: false,
        show_teaser: false,
        callback: () => {
          // Re-fetch duration once the load is complete
          widgetRef.current.getDuration((d: number) => {
            if (d) setDuration(d);
          });
        }
      });
    }
  }, [trackId, secretToken]);

  const togglePlay = () => {
    if (widgetRef.current) {
      widgetRef.current.toggle();
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const scTrackUrl = `https://soundcloud.com/tracks/${trackId}${secretToken ? `/s-${secretToken}` : ''}`;
  const initialUrl = `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${trackId}${secretToken ? `%3Fsecret_token%3D${secretToken}` : ''}&auto_play=false&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`;

  return (
    <div className="mt-12 pt-12 border-t border-stone-100 dark:border-stone-900 animate-fade-in">
      <div className="flex items-center gap-6">
        <button 
          onClick={togglePlay}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 transition-all shadow-sm"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <IoPauseOutline size={24} /> : <IoPlayOutline size={24} className="ml-1" />}
        </button>
        
        <div className="flex-grow space-y-2">
          <div className="h-1 w-full bg-stone-100 dark:bg-stone-900 rounded-full overflow-hidden relative">
            <div 
              className="absolute h-full bg-stone-400 dark:bg-stone-600 transition-all duration-300 rounded-full"
              style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-stone-400 font-mono">
            <span>{formatTime(progress)} / {formatTime(duration)}</span>
            <a 
              href={scTrackUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="opacity-50 text-[9px] hover:text-stone-600 dark:hover:text-stone-300 transition-colors border-b border-transparent hover:border-stone-400"
            >
              Audio via SoundCloud
            </a>
          </div>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        src={initialUrl}
        className="hidden"
        allow="autoplay"
      />
    </div>
  );
};

function App() {
  const [index, setIndex] = useState<ReflectionIndexItem[]>([]);
  const [currentReflection, setCurrentReflection] = useState<ReflectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');

  // Theme Management
  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (t: string) => {
      root.classList.remove('light', 'dark');
      root.classList.add(t);
      root.style.colorScheme = t;
      // Update browser theme-color for mobile chrome
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', t === 'dark' ? '#0c0a09' : '#fafaf9'); // stone-950 and stone-50
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches ? 'dark' : 'light');
      const listener = () => applyTheme(mediaQuery.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      applyTheme(theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Data Loading
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/index.json`)
      .then(res => res.ok ? res.json() : Promise.reject('No data'))
      .then(data => {
        setIndex(data);
        const hashDate = window.location.hash.replace('#', '');
        const targetDate = (hashDate && data.find((i: any) => i.date === hashDate)) ? hashDate : data[0]?.date;
        if (targetDate) loadReflection(targetDate);
        else setLoading(false);
      })
      .catch(() => {
        setError('No daily reflections available.');
        setLoading(false);
      });

    const onHashChange = () => {
      const hDate = window.location.hash.replace('#', '');
      if (hDate) {
        loadReflection(hDate);
        setShowCalendar(false);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const loadReflection = (dateStr: string) => {
    setLoading(true);
    setError(''); // Clear error on new load
    fetch(`${import.meta.env.BASE_URL}data/${dateStr}.json`)
      .then(res => res.json())
      .then(data => {
        setCurrentReflection(data);
        window.location.hash = dateStr;
        setLoading(false);
        window.scrollTo(0, 0);
      })
      .catch(() => {
        setError('Failed to load reflection.');
        setLoading(false);
      });
  };

  // Helper: Friendly Date Formatting
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const dayNum = d.getDate();
    const suffix = ["th", "st", "nd", "rd"][(dayNum % 10 > 3 || [11, 12, 13].includes(dayNum % 100)) ? 0 : dayNum % 10];
    const monthName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][d.getMonth()];
    return `${monthName} ${dayNum}${suffix}, ${year}`;
  };

  // Navigation Logic
  const currentIdx = index.findIndex(item => item.date === currentReflection?.date);
  const nextItem = currentIdx > 0 ? index[currentIdx - 1] : null;
  const prevItem = currentIdx >= 0 && currentIdx < index.length - 1 ? index[currentIdx + 1] : null;

  const Nav = () => (
    <nav className="flex justify-between items-center mb-12 text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 border-y border-stone-100 dark:border-stone-900 py-4 font-sans antialiased">
      {prevItem ? (
        <button onClick={() => loadReflection(prevItem.date)} className="hover:text-stone-900 dark:hover:text-stone-200 transition-colors">← previous day</button>
      ) : <span className="opacity-20 select-none">← previous day</span>}
      {nextItem ? (
        <button onClick={() => loadReflection(nextItem.date)} className="hover:text-stone-900 dark:hover:text-stone-200 transition-colors">next day →</button>
      ) : <span className="opacity-20 select-none">next day →</span>}
    </nav>
  );

  const CalendarView = () => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    
    const dateCells = [];
    for (let i = 0; i < firstDay; i++) dateCells.push(<div key={`empty-${i}`} className="h-12 w-full" />);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasReflection = index.find(item => item.date === dateStr);
      const isSelected = currentReflection?.date === dateStr;
      
      dateCells.push(
        <div 
          key={d} 
          onClick={() => hasReflection && (loadReflection(dateStr), setShowCalendar(false))}
          className={`h-12 w-full flex items-center justify-center text-sm cursor-pointer transition-all border border-transparent rounded
            ${hasReflection ? 'bg-stone-100 dark:bg-stone-900/50 font-medium hover:bg-stone-200 dark:hover:bg-stone-900 text-stone-900 dark:text-stone-100 border-stone-200 dark:border-stone-800' : 'text-stone-300 dark:text-stone-800 pointer-events-none'}
            ${isSelected ? 'ring-2 ring-stone-400 dark:ring-stone-500 ring-inset' : ''}
          `}
        >
          {d}
        </div>
      );
    }

    return (
      <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-light tracking-wide text-stone-600 dark:text-stone-400">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</h2>
          <div className="flex gap-4">
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="text-stone-400 hover:text-stone-600">prev</button>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="text-stone-400 hover:text-stone-600">next</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-12">
          {['S','M','T','W','T','F','S'].map((day, i) => <div key={`${day}-${i}`} className="text-center text-[10px] uppercase tracking-widest text-stone-400 font-medium mb-2">{day}</div>)}
          {dateCells}
        </div>
        <div className="mt-12 pt-8 border-t border-stone-100 dark:border-stone-800">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-6 text-center">Recent Index</h3>
          <div className="space-y-3">
            {index.slice(0, 7).map(item => (
              <div key={item.date} onClick={() => (loadReflection(item.date), setShowCalendar(false))} className="cursor-pointer group text-sm flex justify-between hover:text-stone-900 dark:hover:text-stone-100 text-stone-500 dark:text-stone-400 border-b border-stone-50 dark:border-stone-900 pb-1 transition-colors">
                <span className="truncate mr-4">{item.title}</span>
                <span className="font-mono text-[10px] opacity-40 shrink-0">{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-500 selection:bg-stone-200 dark:selection:bg-stone-800 font-sans">
      <div className="py-12 md:py-16 px-6 md:px-8 max-w-3xl mx-auto flex flex-col">
        <header className="flex flex-col gap-10 mb-20 md:mb-24 animate-fade-in">
          <div className="flex justify-between items-center">
            <h1 className="text-lg md:text-xl tracking-[0.2em] text-stone-400 font-light cursor-pointer select-none uppercase" onClick={() => (loadReflection(index[0]?.date), setShowCalendar(false))}>daily reflections</h1>
            <button 
              onClick={() => setShowCalendar(!showCalendar)} 
              className={`transition-colors p-2 -mr-2 ${showCalendar ? 'text-stone-900 dark:text-stone-100' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
              aria-label={showCalendar ? 'Close calendar' : 'Open calendar'}
            >
              {showCalendar ? <IoCloseOutline size={24} /> : <IoCalendarOutline size={22} />}
            </button>
          </div>
          <div className="flex justify-center gap-6 md:gap-8">
            {(['system', 'light', 'dark'] as const).map(t => (
              <button key={t} onClick={() => setTheme(t)} className={`text-[10px] uppercase tracking-[0.2em] transition-colors ${theme === t ? 'text-stone-800 dark:text-stone-200 font-bold underline underline-offset-4 decoration-stone-300 dark:decoration-stone-700' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}>{t}</button>
            ))}
          </div>
        </header>

        <main className="flex-grow">
          {(!currentReflection && error) ? (
            <div className="text-red-400 flex justify-center mt-20">{error}</div>
          ) : (!currentReflection && loading) ? (
            <div className="text-stone-400 italic font-serif flex justify-center mt-20">loading...</div>
          ) : (
            <>
              {/* Calendar View - Persistent but hidden when not active */}
              <div className={showCalendar ? 'block' : 'hidden'}>
                <CalendarView />
              </div>

              {/* Reflection View - Persistent but hidden when calendar is active */}
              {currentReflection && (
                <article className={`max-w-2xl mx-auto relative ${showCalendar ? 'hidden' : 'block'}`}>
                  {/* Loading/Error Overlay */}
                  <div className={`absolute inset-0 z-10 bg-stone-50/50 dark:bg-stone-950/50 backdrop-blur-[2px] flex items-start justify-center pt-20 transition-opacity duration-300 ${(loading || error) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="text-center space-y-4">
                      {loading && <span className="text-stone-400 italic font-serif">loading...</span>}
                      {error && <span className="text-red-400 block">{error}</span>}
                    </div>
                  </div>

                  <div className={`transition-all duration-500 flex flex-col ${(loading || error) ? 'opacity-20 blur-[1px]' : 'opacity-100'}`}>
                    <span className="text-xs font-mono text-stone-400 tracking-[0.3em] block text-center mb-10 uppercase">{formatDate(currentReflection.date)}</span>
                    <h2 className="text-3xl md:text-4xl font-light tracking-widest mt-4 mb-12 text-center uppercase leading-snug text-stone-800 dark:text-stone-100">{currentReflection.title}</h2>
                    
                    <div className="max-w-prose mx-auto w-full flex flex-col">
                      {currentReflection.quote && (
                        <blockquote className="text-xl italic text-stone-600 dark:text-stone-400 leading-relaxed font-serif border-l-2 border-stone-100 dark:border-stone-900 pl-8 mb-12" dangerouslySetInnerHTML={{ __html: currentReflection.quote }} />
                      )}
                      
                      <div className="space-y-10 text-lg leading-[1.9] text-stone-800 dark:text-stone-200 font-serif antialiased text-justify">
                        {currentReflection.body.split('\n\n').map((p, i) => <p key={i} className="first-letter:text-2xl dark:first-letter:text-stone-100">{p}</p>)}
                      </div>
                      
                      {currentReflection.audioTrackId && (
                        <AudioPlayer 
                          trackId={currentReflection.audioTrackId} 
                          secretToken={currentReflection.audioSecretToken} 
                        />
                      )}
                      
                      <div className="mt-12">
                        <Nav />
                      </div>
                    </div>
                  </div>
                </article>
              )}
            </>
          )}
        </main>

        <footer className="mt-24 border-t border-stone-100 dark:border-stone-900 pt-10 text-center text-[10px] text-stone-400 space-y-3 tracking-widest uppercase pb-12">
          <p>From the book <em>Daily Reflections</em>.</p>
          <p>Copyright © 1990 by <a href="https://www.aa.org/" className="hover:text-stone-600 dark:hover:text-stone-300 border-b border-stone-200 dark:border-stone-800 transition-all">Alcoholics Anonymous World Services, Inc</a>.</p>
          <div className="pt-4"><a href={`${import.meta.env.BASE_URL}rss.xml`} className="hover:text-stone-600 dark:hover:text-stone-300 opacity-60 transition-opacity">subscribe via RSS</a></div>
        </footer>
      </div>
    </div>
  );
}

export default App;
