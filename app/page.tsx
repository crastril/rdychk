'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CaretRight, GameController, MapPin, Terminal, Confetti, CircleNotch, Check, CalendarBlank } from '@phosphor-icons/react';
import { AuthButton } from '@/components/auth-button';
import { cn } from '@/lib/utils';
import { createSlug } from '@/lib/slug';
import { FRENCH_CITIES } from '@/lib/cities';

const PERSON_MESSAGES = [
  "Go ?",
  "On y va à quelle heure ?",
  "T'es déjà parti ?",
  "On se retrouve à quelle heure ?",
  "On avait pas dit 19h ?",
  "T'es où ?",
  "T'as vu mon message ?",
  "Je peux partir ?",
  "T'as lu les message sur le groupe ?",
  "T'es loin ?",
  "T'arrives à quelle heure ?",
  "T'es en route ?",
];

const ONLINE_MESSAGES = [
  "T'ES PRÊT ?",
  "SUR LE VOCAL ?",
  "MAJ FINIE ?",
  "T'AS FINI TA GAME ?",
  "T'ES OÙ ?",
  "T'AS LU LES MESSAGE SUR LE GROUPE ?",
  "T'ES EN ROUTE ?",
  "T'ARRIVES À QUELLE HEURE ?",
  "T'ES LOIN ?",
  "T'ES ENCORE EN TRAIN DE JOUER ?",
  "T'ES SÉRIEUX ?",
  "T'AS RELANCÉ UNE PARTIE ?",
];

// WebGL fragment shader — same topographic formula, runs entirely on GPU
const VERT_SRC = `
  attribute vec2 a_pos;
  void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;
const FRAG_SRC = `
  precision mediump float;
  uniform float u_time;
  uniform vec2  u_res;
  void main() {
    float S = 0.003;
    float x = gl_FragCoord.x * S;
    float y = gl_FragCoord.y * S;
    float t = u_time;
    float v = sin(x*1.00 + y*0.75 + t)
            + sin(x*0.85 + y*1.10 - t*0.82) * 0.90
            + sin(x*1.20 - y*0.80 + t*0.67) * 0.75
            + sin(x*0.70 + y*0.95 + t*0.44) * 0.60
            + sin(x*0.55 - y*1.25 - t*0.53) * 0.45;
    float band = mod(floor((v + 5.0) * 3.5), 2.0);
    gl_FragColor = vec4(0.0, 0.0, 0.0, band * 0.82);
  }
`;

const LiquidWaves = ({ mobile = false }: { mobile?: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false })
            || canvas.getContext('experimental-webgl', { alpha: true, premultipliedAlpha: false }) as WebGLRenderingContext | null;
    if (!gl) return; // graceful fallback: no effect if WebGL unavailable

    // Compile & link shaders
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src); gl.compileShader(s); return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER,   VERT_SRC));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG_SRC));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Fullscreen quad (2 triangles via TRIANGLE_STRIP)
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Blend so transparent fragments reveal the red background
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes  = gl.getUniformLocation(prog, 'u_res');

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width  = Math.round(r.width);
      canvas.height = Math.round(r.height);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const DT = mobile ? 0.002 : 0.003;
    let t = 0;
    let frameCount = 0;

    const draw = () => {
      frameCount++;
      // 30 fps on mobile to save battery
      if (mobile && frameCount % 2 !== 0) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }
      t += DT;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    const onVisibility = () => {
      if (document.hidden) { if (animRef.current) cancelAnimationFrame(animRef.current); }
      else animRef.current = requestAnimationFrame(draw);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteProgram(prog);
    };
  }, [mobile]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.35 }}
    />
  );
};

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  // Detect mobile to skip heavy animations
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const [recentGroups, setRecentGroups] = useState<{ name: string; slug: string; joined_at: string; type: string }[]>([]);
  const [mode, setMode] = useState<'in_person' | 'remote'>('in_person');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  // Form State
  const [groupName, setGroupName] = useState('');
  const [step, setStep] = useState<'name' | 'options' | 'city'>('name');
  const [calendarEnabled, setCalendarEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [baseLocation, setBaseLocation] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearchLocation = (query: string) => {
    if (!query.trim()) {
      setLocationResults([]);
      return;
    }
    const filtered = FRENCH_CITIES.filter(city => 
      city.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);
    setLocationResults(filtered.map(city => ({ name: city })));
  };

  // Reset form state when switching modes
  useEffect(() => {
    setStep('name');
    setBaseLocation(null);
    setLocationSearch('');
    setLocationResults([]);
  }, [mode]);

  // Cycle messages with a delay proportional to message length (1s–2s)
  const messageIndexRef = useRef(0);
  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const idx = messageIndexRef.current;
      const msg = PERSON_MESSAGES[idx % PERSON_MESSAGES.length];
      // Scale: shortest msg (~4 chars) → 1000ms, longest (~35 chars) → 2000ms
      const delay = 1000 + Math.round((msg.length / 35) * 1000);

      timeoutId = setTimeout(() => {
        if (!isMounted) return;
        setIsTyping(true);
        timeoutId = setTimeout(() => {
          if (!isMounted) return;
          messageIndexRef.current += 1;
          setIsTyping(false);
          setMessageIndex(messageIndexRef.current);
          schedule();
        }, 600);
      }, delay);
    };

    schedule();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // Handle body class for theme switching
  useEffect(() => {
    if (mode === 'remote') {
      document.body.classList.add('theme-online');
    } else {
      document.body.classList.remove('theme-online');
    }
  }, [mode]);

  // Fetch recent groups based on active mode
  useEffect(() => {
    async function fetchLastGroup() {
      if (!user) return;
      const { data, error } = await supabase
        .from('members')
        .select(`
          joined_at,
          groups!members_group_id_fkey (
            name,
            slug,
            type
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching recent groups from page.tsx:", error);
      }
      console.log("Fetched raw recents data:", data);

      if (data && data.length > 0) {
        let transformedGroups = (data as any[])
          .map((member) => {
            const groupData = member.groups || member.group;
            const group = Array.isArray(groupData) ? groupData[0] : groupData;
            if (!group) return null;

            return {
              name: group.name,
              slug: group.slug,
              type: group.type,
              joined_at: member.joined_at
            };
          })
          .filter((g): g is NonNullable<typeof g> => g !== null);

        console.log("Transformed groups:", transformedGroups);

        // Filter by mode (treat null type as 'in_person' for legacy groups)
        if (mode === 'in_person') {
          transformedGroups = transformedGroups.filter(g => g.type === 'in_person' || !g.type);
        } else {
          transformedGroups = transformedGroups.filter(g => g.type === 'remote');
        }

        setRecentGroups(transformedGroups.slice(0, 2));
      } else {
        setRecentGroups([]);
      }
    }
    fetchLastGroup();
  }, [user, mode]);

  const toggleMode = (newMode: 'in_person' | 'remote') => {
    if (mode === newMode || isTransitioning) return;
    setIsTransitioning(true);
    setMode(newMode);

    // Smooth transition delay to let curtain effect play
    setTimeout(() => {
      setIsTransitioning(false);
    }, 400);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || loading) return;

    if (step === 'name') {
      setStep('options');
      return;
    }

    if (step === 'options') {
      setStep('city');
      return;
    }

    if (mode === 'in_person' && !baseLocation) {
      alert("Veuillez sélectionner une ville pour votre groupe sur place.");
      return;
    }

    setLoading(true);
    let uniqueSlug = '';
    try {
      const slug = createSlug(groupName);
      uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;

      const { error: dbError } = await supabase
        .from('groups')
        .insert({
          name: groupName,
          slug: uniqueSlug,
          created_by: user?.id,
          type: mode,
          calendar_voting_enabled: calendarEnabled,
          location_voting_enabled: locationEnabled,
          city: baseLocation?.name ?? null,
          location: null,
          base_lat: null,
          base_lng: null
        });

      if (dbError) throw dbError;
    } catch (error: any) {
      console.error('Group creation failed:', error);
      alert("Erreur lors de la création: " + error.message);
      setLoading(false);
      return;
    }

    try {
      router.push(`/group/${uniqueSlug}`);
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto custom-scroll bg-black text-slate-100 font-display selection:bg-purple-500/30">

      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center py-6 px-4 md:px-12 pointer-events-none">

        {/* Logo */}
        <div className="pointer-events-auto flex items-center gap-2 group cursor-pointer bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-2xl">
          <span className="text-xl font-black tracking-tighter text-white">rdychk</span>
          <div className={cn(
            "w-2 h-2 rounded-full mt-1 transition-all duration-500 shadow-[0_0_10px_currentColor]",
            mode === 'remote' ? 'bg-purple-500 text-purple-500' : 'bg-red-500 text-red-500'
          )}></div>
        </div>

        {/* Auth Button */}
        <div className="pointer-events-auto">
          <AuthButton className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-bold hover:bg-white hover:text-black transition-colors shadow-lg" />
        </div>
      </nav>

      {/* Switcher Component - Anchored to scroll container */}
      <div className="absolute top-24 md:top-32 left-0 w-full z-40 flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-max relative">
          <div className="flex items-center gap-2 md:gap-4 bg-black/40 backdrop-blur-sm p-1 rounded-full border border-white/5 shadow-2xl relative">

            {/* Morphing Sliding Pill */}
            <div
              className={cn(
                "absolute top-1 bottom-1 w-[calc(50%-0.375rem)] md:w-[calc(50%-0.75rem)] rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-0",
                mode === 'in_person'
                  ? "left-1 bg-[#facc15] shadow-[0_4px_0_rgba(0,0,0,0.3)] border-2 border-white -rotate-1"
                  : "left-[calc(50%+0.125rem)] md:left-[calc(50%+0.25rem)] bg-white/5 shadow-[0_0_15px_rgba(217,70,239,0.3)] border border-purple-500/50 rotate-1"
              )}
            />

            <button
              onClick={() => toggleMode('in_person')}
              className={cn(
                "w-36 md:w-44 py-2 rounded-full transition-all duration-300 relative z-10 flex items-center justify-center",
                mode === 'in_person' ? 'text-black' : 'text-slate-400 hover:text-red-300'
              )}
            >
              <span className="font-black text-xs md:text-sm uppercase tracking-wide whitespace-nowrap">En Personne</span>
            </button>
            <button
              onClick={() => toggleMode('remote')}
              className={cn(
                "w-36 md:w-44 py-2 rounded-full transition-all duration-300 relative z-10 flex items-center justify-center",
                mode === 'remote'
                  ? 'text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                  : 'text-slate-400 hover:text-purple-300'
              )}
            >
              <span className="font-pixel text-sm md:text-lg tracking-widest uppercase whitespace-nowrap">En Ligne</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Layout - Grid overlaps components */}
      <div className="relative w-full grid grid-cols-1 grid-rows-1 min-h-screen">

        {/* =========================================================
            PERSON SIDE (Red / Real Life)
            ========================================================= */}
        <div className={cn(
          "person-side col-start-1 row-start-1 relative flex flex-col items-center justify-start min-h-screen w-full transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] z-20",
          mode === 'remote' ? '-translate-x-full opacity-50 pointer-events-none' : 'translate-x-0 opacity-100'
        )} style={{ background: 'radial-gradient(circle at center, #621414, #120303)' }}>

          <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none mix-blend-overlay z-0"></div>

          <LiquidWaves mobile={isMobile} />

          {!isMobile && mode === 'in_person' && (
            <>
              <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-red-700/30 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse z-0"></div>
              <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] bg-red-900/40 rounded-full blur-[100px] pointer-events-none mix-blend-screen z-0"></div>
            </>
          )}

          <div className="relative z-10 max-w-4xl w-full px-6 pt-32 md:pt-40 pb-16 flex flex-col items-start md:items-center justify-start text-left md:text-center min-h-screen md:mx-auto">
            <div className="w-full flex-grow flex flex-col justify-start items-start md:items-center text-left md:text-center mt-2 md:mt-4">

              {/* Spacer matching ONLINE STATUS height */}
              <div className="flex items-center justify-start md:justify-center gap-2 mb-4 h-6 opacity-0 pointer-events-none w-full">
                <span className="w-2 h-2 rounded-full"></span>
                <span className="font-mono text-xs uppercase">[ONLINE_STATUS: ACTIVE]</span>
              </div>

              <div className="text-left md:text-center w-full">
                <h1 className="text-5xl lg:text-8xl font-black text-white tracking-tighter leading-none drop-shadow-2xl">
                  ARRÊTEZ DE
                </h1>
                <div className="relative inline-block w-full text-left md:text-center mb-4 mt-1">
                  <h1 className="text-5xl lg:text-8xl font-black text-white tracking-tighter leading-none drop-shadow-2xl relative z-10">
                    DEMANDER
                  </h1>
                </div>
              </div>

              {/* Exact height matching container for animated chat */}
              <div className="w-full h-[220px] md:h-[260px] relative max-w-sm md:max-w-md md:mx-auto overflow-hidden text-left mb-4 px-2 md:px-0 flex flex-col justify-end">
                <div className="relative w-full max-w-[280px] h-full md:mx-auto">

                  {/* 3 Messages rendered at all times */}
                  {[0, 1, 2].map((offset) => {
                    const k = messageIndex - offset;
                    if (k < 0) return null;

                    let messageShift = 0;
                    for (let i = 0; i < offset; i++) {
                      const msgIndex = messageIndex - i;
                      if (msgIndex >= 0) {
                        const msg = PERSON_MESSAGES[msgIndex % PERSON_MESSAGES.length];
                        const len = msg.length;
                        if (len > 32) {
                          messageShift += 150;
                        } else if (len > 20) {
                          messageShift += 115;
                        } else {
                          messageShift += 75;
                        }
                      }
                    }

                    const typingShift = isTyping ? 55 : 0;
                    const bottomPos = 16 + messageShift + typingShift;
                    const isFadingOut = offset >= 2;

                    return (
                      <div
                        key={`person-msg-${k}`}
                        className={cn(
                          "absolute left-2 md:left-0 transition-all duration-500 imessage-dark-bubble font-medium text-xl md:text-2xl w-max max-w-[260px]",
                          offset === 0 && !isTyping ? "animate-message-pop-in" : "",
                          isFadingOut ? "opacity-0 scale-95 pointer-events-none -translate-y-4" : "opacity-100 scale-100 translate-y-0"
                        )}
                        style={{ bottom: `${bottomPos}px` }}
                      >
                        {PERSON_MESSAGES[k % PERSON_MESSAGES.length]}
                      </div>
                    );
                  })}

                  {/* Typing Indicator */}
                  <div
                    className={cn(
                      "absolute left-2 md:left-0 bottom-4 typing-box transition-all duration-300 w-max origin-bottom",
                      isTyping ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-2 pointer-events-none"
                    )}
                  >
                    <div className="typing-dot-bounce"></div>
                    <div className="typing-dot-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="typing-dot-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>

              <div className={cn("w-full max-w-md relative group perspective-1000 mb-12", mode === 'remote' && 'pointer-events-none')}>
                <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/notebook.png')] opacity-10 mix-blend-overlay"></div>
                  <form onSubmit={handleCreateGroup} className="flex flex-col gap-6 relative z-10 text-left md:text-center">
                    {/* Step indicator — pill for active, dot for inactive */}
                    <div className="flex items-center justify-center gap-1.5">
                      {(['name', 'options', 'city'] as const).map((s) => (
                        <div
                          key={s}
                          className={cn(
                            "rounded-full transition-all duration-300",
                            step === s
                              ? "w-5 h-1.5 bg-white/70"
                              : "w-1.5 h-1.5 bg-white/20"
                          )}
                        />
                      ))}
                    </div>

                    {step === 'name' ? (
                      <div className="animate-in fade-in slide-in-from-right duration-500">
                        <label className="block text-xs font-bold text-red-200 mb-2 uppercase tracking-wide">Nomme ton groupe</label>
                        <input
                          value={mode === 'in_person' ? groupName : ''}
                          onChange={(e) => setGroupName(e.target.value)}
                          disabled={loading || mode === 'remote'}
                          className="w-full h-14 rounded-2xl bg-black/20 border-2 border-white/10 focus:border-red-400 focus:bg-black/40 px-5 text-lg font-medium text-white placeholder-white/30 focus:outline-none transition-all disabled:opacity-50 text-left md:text-center"
                          placeholder="Barbecue, Cinéma..."
                          type="text"
                          required
                          autoFocus
                        />
                      </div>

                    ) : step === 'options' ? (
                      <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right duration-500">
                        <p className="text-xs font-bold text-white/40 uppercase tracking-widest text-center">Activer les fonctions</p>
                        <div className="grid grid-cols-2 gap-3">
                          {/* Calendar toggle card */}
                          <button
                            type="button"
                            onClick={() => setCalendarEnabled(v => !v)}
                            className={cn(
                              "relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 select-none",
                              calendarEnabled
                                ? "bg-red-500/15 border-red-400/70 text-white"
                                : "bg-black/20 border-white/8 text-white/35 hover:border-white/20 hover:text-white/55"
                            )}
                          >
                            {calendarEnabled && (
                              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-red-400" />
                            )}
                            <CalendarBlank className="w-7 h-7" weight={calendarEnabled ? 'fill' : 'regular'} />
                            <span className="text-xs font-bold uppercase tracking-wide text-center leading-tight">
                              Voter<br/>une date
                            </span>
                          </button>

                          {/* Location toggle card */}
                          <button
                            type="button"
                            onClick={() => setLocationEnabled(v => !v)}
                            className={cn(
                              "relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 select-none",
                              locationEnabled
                                ? "bg-red-500/15 border-red-400/70 text-white"
                                : "bg-black/20 border-white/8 text-white/35 hover:border-white/20 hover:text-white/55"
                            )}
                          >
                            {locationEnabled && (
                              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-red-400" />
                            )}
                            <MapPin className="w-7 h-7" weight={locationEnabled ? 'fill' : 'regular'} />
                            <span className="text-xs font-bold uppercase tracking-wide text-center leading-tight">
                              Voter<br/>un lieu
                            </span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep('name')}
                          className="text-xs text-white/30 hover:text-white/60 uppercase tracking-widest font-bold transition-colors text-center"
                        >
                          ← Retour
                        </button>
                      </div>

                    ) : (
                      /* Step 3 — City */
                      <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right duration-500">
                        <div className="flex flex-col items-center gap-1">
                          <MapPin className="w-6 h-6 text-red-400" weight="fill" />
                          <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Où ça se passe ?</p>
                        </div>
                        <div className="relative group/search">
                          <input
                            value={locationSearch}
                            onChange={(e) => {
                              setLocationSearch(e.target.value);
                              handleSearchLocation(e.target.value);
                            }}
                            className="w-full h-14 rounded-2xl bg-black/20 border-2 border-white/10 focus:border-red-400 focus:bg-black/40 px-5 text-lg font-medium text-white placeholder-white/30 focus:outline-none transition-all"
                            placeholder="Paris, Bordeaux..."
                            type="text"
                            autoFocus
                          />
                          {isSearchingLocation && (
                            <CircleNotch className="absolute right-4 top-4 w-5 h-5 text-red-400 animate-spin" />
                          )}
                        </div>

                        {locationResults.length > 0 && (
                          <div className="w-full bg-black/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-44 overflow-y-auto">
                            {locationResults.map((p) => (
                              <button
                                key={p.name}
                                type="button"
                                onClick={() => {
                                  setBaseLocation({ name: p.name, lat: 0, lng: 0 });
                                  setLocationSearch(p.name);
                                  setLocationResults([]);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-white/8 text-sm text-white transition-colors border-b border-white/5 last:border-none"
                              >
                                <span className="font-bold">{p.name}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {baseLocation && (
                          <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-400/10 px-3 py-2 rounded-xl border border-red-400/20">
                            <Check className="w-4 h-4 shrink-0" />
                            {baseLocation.name}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setStep('options')}
                          className="text-xs text-white/30 hover:text-white/60 uppercase tracking-widest font-bold transition-colors text-center"
                        >
                          ← Retour
                        </button>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || mode === 'remote' || !groupName.trim() || (step === 'city' && !baseLocation)}
                      className="sticker-btn w-full py-5 text-2xl font-black rounded-2xl flex items-center justify-center gap-3 group-hover:shadow-[0_0_30px_rgba(255,46,46,0.6)] disabled:opacity-50 text-white border-4 border-white shadow-[6px_6px_0px_rgba(0,0,0,0.5)] -rotate-2 hover:rotate-0 hover:scale-[1.05] hover:-translate-y-1 hover:shadow-[8px_10px_0px_rgba(0,0,0,0.4)] transition-all bg-[#ff2e2e] hover:bg-[#ff4444]"
                    >
                      {loading && mode === 'in_person' ? <CircleNotch className="w-8 h-8 animate-spin" /> : (
                        <>
                          {step === 'city' ? "C'EST PARTI !" : 'SUIVANT'}
                          <Confetti className="w-8 h-8" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
                <div className="absolute -z-10 top-5 -right-5 w-full h-full bg-black/20 rounded-3xl rotate-3"></div>
              </div>

              {/* In-Person History */}
              {user && mode === 'in_person' && (
                <div className="w-full max-w-md pb-8">
                  <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4 text-left md:text-center">Mes derniers groupes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                    {recentGroups.length > 0 ? recentGroups.map(group => (
                      <Link key={group.slug} href={`/group/${group.slug}`}>
                        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-3 hover:bg-white/10 hover:scale-[1.02] transition-all cursor-pointer group">
                          <div className="w-10 h-10 rounded-full bg-red-500/20 ring-1 ring-red-500/50 flex items-center justify-center text-red-500 font-bold text-lg shadow-lg">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white group-hover:text-red-400 transition-colors max-w-[120px] truncate">{group.name}</span>
                            <span className="text-[10px] text-white/50">{new Date(group.joined_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </Link>
                    )) : (
                      <div className="text-white/50 text-sm">Aucun groupe récent.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================
            ONLINE SIDE (Purple / Digital)
            ========================================================= */}
        <div className={cn(
          "online-side crt-overlay col-start-1 row-start-1 relative flex flex-col justify-start items-center p-6 lg:p-16 min-h-screen w-full transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] z-20",
          mode === 'in_person' ? 'translate-x-[100%] opacity-50 pointer-events-none' : 'translate-x-0 opacity-100'
        )} style={{ background: '#0e0514' }}>

          <style>{`
            @keyframes neon-flicker-border {
              0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { 
                box-shadow: inset 0 0 20px rgba(217, 70, 239, 0.4), inset 0 0 40px rgba(168, 85, 247, 0.2); 
                border-left: 2px solid rgba(217, 70, 239, 0.8);
                border-right: 2px solid rgba(217, 70, 239, 0.8);
              }
              20%, 24%, 55% { 
                box-shadow: none; 
                border-left: 2px solid rgba(217, 70, 239, 0.1);
                border-right: 2px solid rgba(217, 70, 239, 0.1);
              }
            }
            .cyberpunk-border {
              animation: neon-flicker-border 4s infinite;
            }
          `}</style>

          <div className="absolute inset-0 pointer-events-none cyberpunk-border z-50 mix-blend-screen opacity-70"></div>

          <div className="scan-line"></div>
          <div className="absolute inset-0 bg-grid-pattern bg-[length:40px_40px] opacity-40 pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-transparent to-purple-900/30 pointer-events-none"></div>

          {mode === 'remote' && (
            <>
              <div className="absolute top-1/4 right-10 w-32 h-32 border border-purple-500/30 rounded-full opacity-20 animate-pulse hidden lg:block"></div>
              <div className="absolute top-1/3 left-20 w-24 h-24 border border-purple-500/20 rounded-full opacity-10 animate-pulse hidden lg:block"></div>
              <div className="absolute bottom-1/4 left-10 font-mono text-purple-500/20 text-xs flex-col items-start hidden xl:flex">
                <span>SYS.OP.READY</span>
                <span>CONN_ESTABLISHED</span>
                <span>PING: 12ms</span>
              </div>
            </>
          )}

          <div className="relative z-10 max-w-4xl w-full px-6 pt-32 md:pt-40 pb-16 flex flex-col items-end md:items-center justify-start text-right md:text-center min-h-screen ml-auto md:mx-auto">
            <div className="w-full flex-grow flex flex-col justify-start items-end md:items-center text-right md:text-center mt-2 md:mt-4">

              <div className="flex items-center justify-end md:justify-center gap-2 mb-4 h-6 w-full">
                <span className="w-2 h-2 bg-green-500 animate-pulse rounded-full shadow-[0_0_8px_lime]"></span>
                <span className="font-mono text-xs text-green-500 tracking-widest uppercase">[ONLINE_STATUS: ACTIVE]</span>
              </div>

              <div className="text-right md:text-center w-full">
                <h1 className="text-5xl lg:text-8xl font-black text-white tracking-tighter leading-none glitch-text inline-block" data-text="ARRÊTEZ DE">
                  ARRÊTEZ DE
                </h1>
                <div className="relative w-full text-right md:text-center mb-4 mt-1 inline-block">
                  <h1 className="text-5xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 tracking-tighter leading-none filter drop-shadow-[0_0_10px_rgba(217,70,239,0.5)] font-pixel uppercase relative z-10">
                    DEMANDER
                  </h1>
                </div>
              </div>

              {/* Exact height matching container for animated Discord chat */}
              <div className="w-full h-[240px] md:h-[280px] relative max-w-lg md:mx-auto overflow-hidden text-right mb-4 px-2 md:px-0 flex flex-col justify-end">
                <div className="relative w-full max-w-[380px] h-full md:mx-auto">

                  {/* 3 Messages rendered at all times */}
                  {[0, 1, 2].map((offset) => {
                    const k = messageIndex - offset;
                    if (k < 0) return null;

                    let messageShift = 0;
                    for (let i = 0; i < offset; i++) {
                      const msgIndex = messageIndex - i;
                      if (msgIndex >= 0) {
                        const msg = ONLINE_MESSAGES[msgIndex % ONLINE_MESSAGES.length];
                        const len = msg.length;
                        if (len > 32) {
                          messageShift += 155;
                        } else if (len > 20) {
                          messageShift += 120;
                        } else {
                          messageShift += 85;
                        }
                      }
                    }

                    const typingShift = isTyping ? 35 : 0;
                    const bottomPos = 24 + messageShift + typingShift;
                    const isFadingOut = offset >= 2;

                    return (
                      <div
                        key={`online-msg-${k}`}
                        className={cn(
                          "absolute right-2 md:left-0 md:right-auto flex flex-row-reverse md:flex-row gap-3 w-full transition-all duration-500",
                          offset === 0 && !isTyping ? "animate-message-pop-in" : "",
                          isFadingOut ? "opacity-0 scale-95 pointer-events-none -translate-y-4" : "opacity-100 scale-100 translate-y-0"
                        )}
                        style={{ bottom: `${bottomPos}px` }}
                      >
                        <div className="w-10 h-10 rounded-full bg-purple-900/50 flex-shrink-0 flex items-center justify-center border border-purple-500/30 text-right md:text-left shadow-[0_0_15px_rgba(168,85,247,0.2)] bg-black/50 backdrop-blur-md">
                          <Terminal className="w-5 h-5 text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]" />
                        </div>
                        <div className="flex flex-col items-end md:items-start bg-black/40 md:bg-transparent p-2 md:p-0 rounded-lg md:rounded-none backdrop-blur-sm md:backdrop-blur-none border border-white/5 md:border-transparent">
                          <div className="flex items-baseline flex-row-reverse md:flex-row gap-2">
                            <span className="text-purple-400 font-bold text-sm hover:underline cursor-pointer">rdychk_bot</span>
                            <span className="text-purple-500/50 text-xs text-right md:text-left">Aujourd'hui à {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <span className="text-gray-200 mt-1 font-mono text-lg lg:text-xl drop-shadow-[0_0_8px_rgba(168,85,247,0.3)] text-right md:text-left">{ONLINE_MESSAGES[k % ONLINE_MESSAGES.length]}</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing Indicator */}
                  <div
                    className={cn(
                      "absolute right-16 md:left-14 md:right-auto bottom-2 transition-all duration-300 origin-bottom",
                      isTyping ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
                    )}
                  >
                    <p className="font-bold text-xs text-purple-400/70 animate-pulse tracking-wider text-right md:text-left">rdychk_bot est en train d'écrire...</p>
                  </div>
                </div>
              </div>

              {/* Online Form */}
              <div className={cn("group relative w-full max-w-md flex flex-col gap-4", mode === 'in_person' && 'pointer-events-none')}>
                <form onSubmit={handleCreateGroup} className="w-full flex flex-col gap-4 relative z-10">
                  {step === 'name' ? (
                    <div className="w-full text-right md:text-center animate-in fade-in slide-in-from-right duration-500">
                      <label className="block text-xs font-mono text-purple-400 mb-2 tracking-widest">NOM_DU_GROUPE_ &lt;</label>
                      <input
                        value={mode === 'remote' ? groupName : ''}
                        onChange={(e) => setGroupName(e.target.value)}
                        disabled={loading || mode === 'in_person'}
                        className="w-full bg-black/60 border border-purple-500/50 text-purple-200 font-mono py-4 px-6 rounded focus:outline-none focus:border-purple-400 focus:shadow-[0_0_15px_rgba(217,70,239,0.3)] placeholder-purple-800 transition-all text-lg text-right md:text-center disabled:opacity-50"
                        placeholder="RAID_NIGHT_01"
                        type="text"
                        required
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right duration-500">
                      {/* Toggles */}
                      <div className="flex flex-col gap-3">
                        <label className="flex items-center justify-between p-4 rounded-lg bg-black/60 border border-purple-500/30 cursor-pointer hover:bg-purple-500/10 transition-all group/toggle">
                          <span className="text-xs font-mono text-purple-300 uppercase tracking-widest">Election_date_active</span>
                          <input
                            type="checkbox"
                            checked={calendarEnabled}
                            onChange={(e) => setCalendarEnabled(e.target.checked)}
                            className="w-5 h-5 rounded accent-purple-500 bg-black border-purple-500/50"
                          />
                        </label>
                        <label className="flex items-center justify-between p-4 rounded-lg bg-black/60 border border-purple-500/30 cursor-pointer hover:bg-purple-500/10 transition-all group/toggle">
                          <span className="text-xs font-mono text-purple-300 uppercase tracking-widest">Options_vote_active</span>
                          <input
                            type="checkbox"
                            checked={locationEnabled}
                            onChange={(e) => setLocationEnabled(e.target.checked)}
                            className="w-5 h-5 rounded accent-purple-500 bg-black border-purple-500/50"
                          />
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => setStep('name')}
                        className="text-[10px] font-mono text-purple-500/50 hover:text-purple-400 uppercase tracking-[3px] transition-colors text-right md:text-center"
                      >
                        &lt; RETOUR_NOM
                      </button>
                    </div>
                  )}

                  <div className="relative w-full mt-2">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                    <button
                      type="submit"
                      disabled={loading || mode === 'in_person' || !groupName.trim()}
                      className="disabled:opacity-50 relative console-btn w-full py-5 px-8 rounded-lg flex items-center justify-center gap-4 overflow-hidden cursor-pointer bg-black/60 border border-[#d946ef] text-[#d946ef] hover:bg-[#d946ef]/10 shadow-[0_0_10px_rgba(217,70,239,0.5),0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_20px_rgba(217,70,239,0.6),inset_0_0_10px_rgba(217,70,239,0.4)]"
                    >
                      <span className="relative z-10 flex items-center gap-3 text-lg font-bold tracking-[2px] uppercase drop-shadow-[0_0_8px_#d946ef]">
                        {loading && mode === 'remote' ? <CircleNotch className="animate-spin text-2xl" /> : <Terminal className="text-2xl animate-pulse" />}
                        {step === 'name' ? 'SUIVANT_PROCESS' : 'INITIALISER_SESSION'}
                      </span>
                      <span className="font-mono text-xs opacity-50">&lt;ENTER&gt;</span>
                      <div className="absolute inset-0 bg-purple-500/10 transform translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 skew-x-12"></div>
                    </button>
                  </div>
                </form>
              </div>

              {/* Online History */}
              {user && mode === 'remote' && (
                <div className="mt-8 w-full max-w-2xl flex flex-col items-end md:items-center pb-8">
                  <h3 className="text-purple-500/50 text-xs font-mono uppercase tracking-wider mb-3 text-right md:text-center">_DERNIÈRES SESSIONS &lt;</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {recentGroups.length > 0 ? recentGroups.map(group => (
                      <Link key={group.slug} href={`/group/${group.slug}`}>
                        <div className="bg-black/40 border border-purple-500/20 p-3 rounded-none flex items-center justify-between flex-row-reverse hover:bg-purple-900/20 transition-colors cursor-pointer group w-full">
                          <div className="flex items-center flex-row-reverse gap-3 text-right">
                            <div className="w-10 h-10 bg-purple-900/40 border border-purple-500/50 flex items-center justify-center text-purple-300 font-mono text-xs shadow-[0_0_10px_inset_rgba(168,85,247,0.2)]">
                              <GameController className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-mono text-purple-300 max-w-[150px] truncate text-right">{group.name}</span>
                              <span className="text-[10px] text-purple-500/60 font-mono text-right">{new Date(group.joined_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <CaretRight className="w-4 h-4 text-purple-500/50 rotate-180 group-hover:text-purple-400" />
                        </div>
                      </Link>
                    )) : (
                      <div className="text-purple-500/50 text-xs font-mono w-full text-center">No recent sessions found.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
