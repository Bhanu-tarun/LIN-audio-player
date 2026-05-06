const { useState, useEffect, useRef, useCallback } = React;

const Icon = ({ path, size = 24, fill = "none", className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    {path}
  </svg>
);

const Play = (p) => <Icon {...p} fill={p.fill || "currentColor"} path={<polygon points="5 3 19 12 5 21 5 3" />} />;
const Pause = (p) => <Icon {...p} fill={p.fill || "currentColor"} path={<><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></>} />;
const SkipBack = (p) => <Icon {...p} path={<><polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" /></>} />;
const SkipForward = (p) => <Icon {...p} path={<><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></>} />;
const GripHorizontal = (p) => <Icon {...p} path={<><rect x="4" y="8" width="2" height="2"/><rect x="11" y="8" width="2" height="2"/><rect x="18" y="8" width="2" height="2"/><rect x="4" y="14" width="2" height="2"/><rect x="11" y="14" width="2" height="2"/><rect x="18" y="14" width="2" height="2"/></>} />;
const X = (p) => <Icon {...p} path={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />;
const Volume2 = (p) => <Icon {...p} path={<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></>} />;
const Trash = (p) => <Icon {...p} path={<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>} />;
const ArrowLeft = (p) => <Icon {...p} path={<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>} />;
const Edit3 = (p) => <Icon {...p} path={<><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>} />;
const SunIcon = (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>} />;
const MoonIcon = (p) => <Icon {...p} path={<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>} />;

const getImageUrl = (seed) => {
    let hash = 0;
    const str = seed || "default";
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `https://picsum.photos/seed/${Math.abs(hash)}/400/400`;
};

const getBrightestColor = (imgUrl, callback) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imgUrl;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 20;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, size, size);
        try {
            const data = ctx.getImageData(0, 0, size, size).data;
            let brightest = { r: 255, g: 255, b: 255, val: -1 };
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i+1], b = data[i+2];
                // Use perceived brightness formula
                const val = (r * 299 + g * 587 + b * 114) / 1000;
                if (val > brightest.val) {
                    brightest = { r, g, b, val };
                }
            }
            // If it's too dark (entire image is dark), boost it
            if (brightest.val < 150) {
                const boost = 200 / (brightest.val + 1);
                brightest.r = Math.min(255, brightest.r * boost);
                brightest.g = Math.min(255, brightest.g * boost);
                brightest.b = Math.min(255, brightest.b * boost);
            }
            callback(`rgb(${Math.round(brightest.r)},${Math.round(brightest.g)},${Math.round(brightest.b)})`);
        } catch(e) {
            callback('#ffffff');
        }
    };
    img.onerror = () => callback('#ffffff');
};

const getAverageColor = (imgUrl, callback) => {
    getBrightestColor(imgUrl, callback);
};

const rgbToHsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) h = s = 0;
    else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h /= 6;
    }
    return [h, s, l];
};

const hslToRgb = (h, s, l) => {
    let r, g, b;
    if (s === 0) r = g = b = l;
    else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

// Extract and enhance multiple colors using HSL for extreme vibrancy
const getImageColors = (imgUrl, callback) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imgUrl;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 15; 
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, size, size);
        try {
            const data = ctx.getImageData(0, 0, size, size).data;
            const uniqueHues = [];
            
            for (let i = 0; i < data.length; i += 4 * 2) {
                const [h, s, l] = rgbToHsl(data[i], data[i+1], data[i+2]);
                // Filter out very dark or very grey pixels
                if (l > 0.1 && s > 0.1) {
                    uniqueHues.push(h);
                }
            }
            
            // Pick distinct hues
            const hues = [];
            uniqueHues.forEach(h => {
                if (hues.length < 6 && !hues.some(existing => Math.abs(existing - h) < 0.1)) {
                    hues.push(h);
                }
            });
            
            // If we don't have enough hues, rotate from the first one
            if (hues.length === 0) hues.push(0.3); // fallback green
            while (hues.length < 4) {
                hues.push((hues[hues.length - 1] + 0.2) % 1);
            }

            // Map hues to highly saturated, bright RGB colors
            const palette = hues.map(h => {
                const [r, g, b] = hslToRgb(h, 0.9, 0.55); // 90% saturation, 55% lightness
                return { r, g, b };
            });

            callback({
                palette: palette.slice(0, 4),
                accent: `rgb(${palette[0].r},${palette[0].g},${palette[0].b})`
            });
        } catch(e) {
            callback({
                palette: [{r:0,g:255,b:128}, {r:255,g:0,b:128}, {r:0,g:128,b:255}, {r:255,g:128,b:0}],
                accent: '#00ff00'
            });
        }
    };
    img.onerror = () => callback({
        palette: [{r:0,g:255,b:128}, {r:255,g:0,b:128}, {r:0,g:128,b:255}, {r:255,g:128,b:0}],
        accent: '#00ff00'
    });
};

const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const App = () => {
    // Data State
    const [tracks, setTracks] = useState([]);
    const [playlists, setPlaylists] = useState({});
    const [albumMeta, setAlbumMeta] = useState({});
    
    // Playback State
    const [currentTrack, setCurrentTrack] = useState(null);
    const [queue, setQueue] = useState([]);
    const [currentColor, setCurrentColor] = useState('#00ff00');
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    
    // Layout & UI State
    const [columns, setColumns] = useState(['primary-menu', 'track-list', 'secondary-menu']);
    const [activeMenu, setActiveMenu] = useState('songs');
    const [isArtExpanded, setIsArtExpanded] = useState(false);
    const [activeTagFilter, setActiveTagFilter] = useState(null);
    
    // Drilldown State
    const [drilldown, setDrilldown] = useState(null); 
    const [isAddingToPlaylist, setIsAddingToPlaylist] = useState(false);
    const [plSearch, setPlSearch] = useState("");
    const [isAddingToAlbum, setIsAddingToAlbum] = useState(false);
    const [albumSearch, setAlbumSearch] = useState("");

    // Search State
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Playlist Creation/Editing State
    const [newPlName, setNewPlName] = useState("");
    const [newPlFile, setNewPlFile] = useState(null);
    const [newPlDesc, setNewPlDesc] = useState("");
    const [newPlTags, setNewPlTags] = useState("");

    // Album Editing State
    const [editAlbumName, setEditAlbumName] = useState("");
    const [editAlbumFile, setEditAlbumFile] = useState(null);
    const [editAlbumDesc, setEditAlbumDesc] = useState("");
    const [editAlbumTags, setEditAlbumTags] = useState("");

    // Player position & Dragging
    const [playerPos, setPlayerPos] = useState({ x: 40, y: 40 });
    const [isDraggingState, setIsDraggingState] = useState(false);
    const isDraggingPlayer = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    
    // Sliders
    const isDraggingVol = useRef(false);
    const isDraggingProgress = useRef(false);

    // Theme State
    const [theme, setTheme] = useState(() => {
        try { return localStorage.getItem('lin-theme') || 'dark'; } catch(e) { return 'dark'; }
    });

    // Audio analyser refs
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const animFrameRef = useRef(null);
    const gradientColorsRef = useRef({
        palette: [
            { r: 42, g: 26, b: 62 }, { r: 20, g: 50, b: 60 },
            { r: 60, g: 20, b: 40 }, { r: 20, g: 60, b: 30 }
        ]
    });

    const audioRef = useRef(new Audio());
    const progressBarRef = useRef(null);
    const volumeBarRef = useRef(null);

    const fetchData = () => {
        fetch('/api/tracks').then(res => res.json()).then(data => setTracks(data));
        fetch('/api/playlists').then(res => res.json()).then(data => setPlaylists(data));
        fetch('/api/albums').then(res => res.json()).then(data => setAlbumMeta(data));
    };

    // Apply theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        try { localStorage.setItem('lin-theme', theme); } catch(e) {}
    }, [theme]);

    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

    // Setup audio analyser for reactive background
    const setupAnalyser = useCallback(() => {
        if (analyserRef.current) return; // already setup
        try {
            const ctx = audioContextRef.current || new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = ctx;
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            const source = ctx.createMediaElementSource(audioRef.current);
            source.connect(analyser);
            analyser.connect(ctx.destination);
            analyserRef.current = analyser;
            sourceRef.current = source;
        } catch(e) {
            console.warn('Could not setup audio analyser:', e);
        }
    }, []);

    // Audio-reactive animation loop
    const startAudioReactiveLoop = useCallback(() => {
        if (animFrameRef.current) return;
        
        const bgEl = document.querySelector('.animated-bg');
        const pulseEl = document.querySelector('.audio-pulse');
        if (!bgEl) return;
        
        const dataArray = new Uint8Array(analyserRef.current?.frequencyBinCount || 128);
        
        const animate = () => {
            if (analyserRef.current) {
                analyserRef.current.getByteFrequencyData(dataArray);
                
                // Calculate energy from bass frequencies (first 1/4 of bins)
                const bassEnd = Math.floor(dataArray.length / 4);
                let bassEnergy = 0;
                for (let i = 0; i < bassEnd; i++) bassEnergy += dataArray[i];
                bassEnergy = bassEnergy / (bassEnd * 255);
                
                // Calculate overall energy
                let totalEnergy = 0;
                for (let i = 0; i < dataArray.length; i++) totalEnergy += dataArray[i];
                totalEnergy = totalEnergy / (dataArray.length * 255);
                
                const { palette } = gradientColorsRef.current;
                
                // Modulate all 4 blobs
                palette.forEach((col, idx) => {
                    const energy = (idx % 2 === 0) ? bassEnergy : totalEnergy;
                    const size = (45 + idx * 5) + energy * 35;
                    const opacity = (0.6 + (idx % 2) * 0.15) + energy * 0.4;
                    
                    bgEl.style.setProperty(`--color-${idx + 1}`, `rgba(${col.r},${col.g},${col.b},${Math.min(1, opacity)})`);
                    bgEl.style.setProperty(`--blob-size`, `${size}vmax`);
                });
                
                // Pulse overlay
                if (pulseEl) {
                    const p = palette[0];
                    const pulseScale = 1.2 + bassEnergy * 1.5;
                    pulseEl.style.setProperty('--pulse-scale', pulseScale);
                    pulseEl.style.setProperty('--pulse-opacity', Math.min(0.7, 0.3 + bassEnergy * 0.7));
                    pulseEl.style.setProperty('--pulse-color', `rgba(${p.r},${p.g},${p.b},0.4)`);
                }
            }
            animFrameRef.current = requestAnimationFrame(animate);
        };
        animate();
    }, []);

    const stopAudioReactiveLoop = useCallback(() => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
        // Reset to static state
        const bgEl = document.querySelector('.animated-bg');
        const pulseEl = document.querySelector('.audio-pulse');
        if (bgEl) {
            const { palette } = gradientColorsRef.current;
            palette.forEach((col, idx) => {
                bgEl.style.setProperty(`--color-${idx + 1}`, `rgba(${col.r},${col.g},${col.b},${0.4 + (idx % 2) * 0.1})`);
            });
            bgEl.style.setProperty('--blob-size', '50vmax');
        }
        if (pulseEl) {
            pulseEl.style.setProperty('--pulse-opacity', '0');
        }
    }, []);

    // Start/stop reactive loop based on playback
    useEffect(() => {
        if (isPlaying && analyserRef.current) {
            startAudioReactiveLoop();
        } else {
            stopAudioReactiveLoop();
        }
        return () => stopAudioReactiveLoop();
    }, [isPlaying, startAudioReactiveLoop, stopAudioReactiveLoop]);

    useEffect(() => {
        fetchData();
        const audio = audioRef.current;
        const updateProgress = () => setProgress(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => playNext();

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    // Update gradient colors from album art
    useEffect(() => {
        if (currentTrack) {
            const imgUrl = albumMeta[currentTrack.album]?.image 
                ? `/api/images/${encodeURI(albumMeta[currentTrack.album].image)}`
                : getImageUrl(currentTrack.album || currentTrack.title);
            
            // Get accent color for track highlighting
            getAverageColor(imgUrl, color => {
                setCurrentColor(color);
            });
            
            // Get multi-color palette for gradient background
            getImageColors(imgUrl, colors => {
                gradientColorsRef.current = colors;
                
                // Apply gradient colors to CSS custom properties
                const bgEl = document.querySelector('.animated-bg');
                if (bgEl) {
                    colors.palette.forEach((col, idx) => {
                        bgEl.style.setProperty(`--color-${idx + 1}`, `rgba(${col.r},${col.g},${col.b},${0.4 + (idx % 2) * 0.1})`);
                    });
                }
            });
        }
    }, [currentTrack, albumMeta]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const getSnapCoords = (target) => {
        const primaryEl = document.querySelector('.col-wrapper.primary-menu');
        const secondaryEl = document.querySelector('.col-wrapper.secondary-menu');
        const playerHeight = isArtExpanded ? 350 : 150; 
        
        let targetEl = target === 'primary-bottom' ? primaryEl : secondaryEl;
        if (!targetEl) return { x: 40, y: 40 };

        const rect = targetEl.getBoundingClientRect();
        const x = target === 'primary-bottom' ? rect.left + 40 : rect.left + 20;
        
        if (target === 'primary-bottom') {
            return { x, y: window.innerHeight - playerHeight - 80 };
        } else {
            return { x, y: 80 }; 
        }
    };

    useEffect(() => {
        if (!isDraggingState) {
            const pb = getSnapCoords('primary-bottom');
            const st = getSnapCoords('secondary-top');
            const distPB = Math.hypot(pb.x - playerPos.x, pb.y - playerPos.y);
            const distST = Math.hypot(st.x - playerPos.x, st.y - playerPos.y);
            setPlayerPos(distPB < distST ? pb : st);
        }
    }, [columns, isArtExpanded]);

    useEffect(() => {
        setTimeout(() => setPlayerPos(getSnapCoords('primary-bottom')), 100);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDraggingPlayer.current) {
                const newX = e.clientX - dragOffset.current.x;
                const newY = e.clientY - dragOffset.current.y;
                setPlayerPos({ x: newX, y: newY });
            }
            if (isDraggingVol.current && volumeBarRef.current) {
                const rect = volumeBarRef.current.getBoundingClientRect();
                const pos = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
                setVolume(pos);
            }
            if (isDraggingProgress.current && progressBarRef.current && duration) {
                const rect = progressBarRef.current.getBoundingClientRect();
                const pos = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
                audioRef.current.currentTime = pos * duration;
            }
        };
        const handleMouseUp = () => {
            if (isDraggingPlayer.current) {
                isDraggingPlayer.current = false;
                setIsDraggingState(false);
                const pb = getSnapCoords('primary-bottom');
                const st = getSnapCoords('secondary-top');
                const distPB = Math.hypot(pb.x - playerPos.x, pb.y - playerPos.y);
                const distST = Math.hypot(st.x - playerPos.x, st.y - playerPos.y);
                setPlayerPos(distPB < distST ? pb : st);
            }
            if (isDraggingVol.current) isDraggingVol.current = false;
            if (isDraggingProgress.current) isDraggingProgress.current = false;
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [playerPos, duration]); 

    // Actions
    const handlePlayerMouseDown = (e) => {
        isDraggingPlayer.current = true;
        setIsDraggingState(true);
        dragOffset.current = { x: e.clientX - playerPos.x, y: e.clientY - playerPos.y };
    };

    const handleColDragStart = (e, id) => e.dataTransfer.setData('col_id', id);
    const handleColDrop = (e, targetId) => {
        const sourceId = e.dataTransfer.getData('col_id');
        if (sourceId && sourceId !== targetId) {
            setColumns(prev => {
                const newCols = [...prev];
                const srcIdx = newCols.indexOf(sourceId);
                const tgtIdx = newCols.indexOf(targetId);
                [newCols[srcIdx], newCols[tgtIdx]] = [newCols[tgtIdx], newCols[srcIdx]];
                return newCols;
            });
        }
    };

    const togglePlay = () => {
        if (!currentTrack && tracks.length > 0) playContext(tracks, 0);
        else if (!currentTrack) return;
        else if (isPlaying) audioRef.current.pause();
        else audioRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const playContext = (trackList, startIndex) => {
        setupAnalyser();
        setCurrentTrack(trackList[startIndex]);
        setQueue(trackList.slice(startIndex + 1));
        audioRef.current.src = '/api/stream/' + encodeURIComponent(trackList[startIndex].filename);
        audioRef.current.play().then(() => {
            setIsPlaying(true);
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
        }).catch(e => console.error(e));
        setIsSearching(false);
    };

    const playNext = () => {
        if (queue.length > 0) {
            setupAnalyser();
            const next = queue[0];
            setCurrentTrack(next);
            setQueue(queue.slice(1));
            audioRef.current.src = '/api/stream/' + encodeURIComponent(next.filename);
            audioRef.current.play().then(() => setIsPlaying(true));
        } else {
            setIsPlaying(false);
        }
    };

    const playPrev = () => {
        audioRef.current.currentTime = 0; 
    };

    const handleProgressMouseDown = (e) => {
        if (!progressBarRef.current || !duration) return;
        isDraggingProgress.current = true;
        const rect = progressBarRef.current.getBoundingClientRect();
        const pos = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
        audioRef.current.currentTime = pos * duration;
    };

    const handleVolumeMouseDown = (e) => {
        if (!volumeBarRef.current) return;
        isDraggingVol.current = true;
        const rect = volumeBarRef.current.getBoundingClientRect();
        const pos = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
        setVolume(pos);
    };

    const handleAddTag = async (filename) => {
        const tag = prompt("Enter a new tag:");
        if (tag && tag.trim()) {
            await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename, tag: tag.trim().toLowerCase() })
            });
            fetchData();
        }
    };

    const addToPlaylist = async (filename) => {
        const plNames = Object.keys(playlists);
        if (plNames.length === 0) return alert("No playlists exist!");
        const chosen = prompt("Add to playlist:\n" + plNames.join("\n"));
        if (chosen && playlists[chosen]) {
            const newTracks = [...playlists[chosen].tracks, filename];
            await fetch('/api/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: chosen, tracks: newTracks })
            });
            fetchData();
        }
    };

    const addToQueue = (track) => {
        setQueue(q => [...q, track]);
    };

    const handleQueueDragStart = (e, index) => e.dataTransfer.setData('q_idx', index);
    const handleQueueDrop = (e, targetIdx) => {
        const srcIdx = parseInt(e.dataTransfer.getData('q_idx'));
        if (!isNaN(srcIdx) && srcIdx !== targetIdx) {
            setQueue(prev => {
                const newQ = [...prev];
                const [moved] = newQ.splice(srcIdx, 1);
                newQ.splice(targetIdx, 0, moved);
                return newQ;
            });
        }
    };

    const submitPlaylist = async () => {
        if (!newPlName.trim()) return;
        const formData = new FormData();
        formData.append('name', newPlName.trim());
        if (newPlFile) formData.append('image', newPlFile);
        formData.append('description', newPlDesc.trim());
        formData.append('tags', newPlTags.trim());

        await fetch('/api/playlists/upload', { method: 'POST', body: formData });
        
        // Reset form if we were creating a new one
        if (activeMenu === 'create-playlist') {
            setNewPlName("");
            setNewPlFile(null);
            setNewPlDesc("");
            setNewPlTags("");
            setActiveMenu('playlists');
        } else if (activeMenu === 'edit-playlist') {
            setDrilldown({type: 'playlist', name: newPlName.trim()});
            setActiveMenu('playlists');
        }
        fetchData();
    };

    const openEditPlaylist = (name) => {
        const p = playlists[name];
        setNewPlName(name);
        setNewPlDesc(p.description || "");
        setNewPlTags((p.tags || []).join(", "));
        setNewPlFile(null);
        setActiveMenu('edit-playlist');
        setDrilldown(null);
    };

    const openEditAlbum = (name) => {
        const a = albumMeta[name] || {};
        setEditAlbumName(name);
        setEditAlbumDesc(a.description || "");
        setEditAlbumTags((a.tags || []).join(", "));
        setEditAlbumFile(null);
        setActiveMenu('edit-album');
        setDrilldown(null);
    };

    const submitAlbum = async () => {
        if (!editAlbumName.trim()) return;
        const formData = new FormData();
        formData.append('name', editAlbumName.trim());
        if (editAlbumFile) formData.append('image', editAlbumFile);
        formData.append('description', editAlbumDesc.trim());
        formData.append('tags', editAlbumTags.trim());

        await fetch('/api/albums/upload', { method: 'POST', body: formData });

        setDrilldown({type: 'album', name: editAlbumName.trim()});
        setActiveMenu('albums');
        fetchData();
    };

    // Derived Data
    let displayTracks = tracks;
    if (activeTagFilter) {
        displayTracks = tracks.filter(t => t.tags && t.tags.includes(activeTagFilter));
    }

    const artists = [...new Set(displayTracks.map(t => t.artist))];
    const albums = [...new Set(displayTracks.map(t => t.album))];

    // Make global search search through tags too
    const filteredSearch = tracks.filter(t => {
        const q = searchQuery.toLowerCase();
        return t.title.toLowerCase().includes(q) || 
               t.artist.toLowerCase().includes(q) ||
               (t.tags && t.tags.some(tag => tag.includes(q)));
    });

    // Determine player dynamic width
    const isPlayerInRight = playerPos.x > window.innerWidth / 2;
    const playerWidth = isPlayerInRight ? '180px' : '220px';

    // Rendering Helpers
    const renderTrackList = (list) => {
        if (list.length === 0) return <div style={{opacity: 0.5, fontSize: '2rem'}}>No tracks found.</div>;
        return list.map((track, idx) => {
            const isCurrent = currentTrack?.filename === track.filename;
            return (
                <div key={idx + track.filename} className="track-item-wrapper">
                    <div 
                        className={`track-text-item ${isCurrent ? 'playing' : ''}`}
                        style={{ color: isCurrent ? currentColor : undefined }}
                        onClick={() => playContext(list, idx)}
                    >
                        {track.title}
                    </div>
                    <div className="tags-container">
                        {track.tags && track.tags.map(tag => (
                            <span 
                                key={tag} 
                                className={`tag-pill ${activeTagFilter === tag ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); setActiveTagFilter(activeTagFilter === tag ? null : tag); }}
                            >
                                #{tag}
                            </span>
                        ))}
                        <button className="add-tag-btn" onClick={() => handleAddTag(track.filename)}>+ Tag</button>
                        <button className="add-tag-btn" onClick={() => addToPlaylist(track.filename)}>+ Playlist</button>
                        <button className="queue-add-btn" onClick={() => addToQueue(track)}>+ Queue</button>
                    </div>
                    <div 
                        className="item-art"
                        style={{ backgroundImage: albumMeta[track.album]?.image ? `url("/api/images/${encodeURI(albumMeta[track.album].image)}")` : `url("${getImageUrl(track.album || track.title)}")` }}
                    />
                </div>
            );
        });
    };

    const renderPlaylistMeta = () => {
        if (drilldown?.type === 'playlist') {
            const plData = playlists[drilldown.name];
            if (!plData || (!plData.description && (!plData.tags || plData.tags.length === 0))) return null;
            
            return (
                <div style={{marginTop: 'auto', padding: '0 40px', marginBottom: '80px', color: 'var(--text-secondary)'}}>
                    {plData.description && (
                        <p style={{fontSize: '1.2rem', fontStyle: 'italic', marginBottom: '15px'}}>{plData.description}</p>
                    )}
                    <div className="tags-container">
                        {plData.tags.map(tag => (
                            <span key={tag} className="tag-pill">#{tag}</span>
                        ))}
                    </div>
                </div>
            );
        }
        if (drilldown?.type === 'album') {
            const aData = albumMeta[drilldown.name];
            if (!aData || (!aData.description && (!aData.tags || aData.tags.length === 0))) return null;
            
            return (
                <div style={{marginTop: 'auto', padding: '0 40px', marginBottom: '80px', color: 'var(--text-secondary)'}}>
                    {aData.description && (
                        <p style={{fontSize: '1.2rem', fontStyle: 'italic', marginBottom: '15px'}}>{aData.description}</p>
                    )}
                    <div className="tags-container">
                        {aData.tags.map(tag => (
                            <span key={tag} className="tag-pill">#{tag}</span>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderCenter = () => {
        if (drilldown) {
            if (drilldown.type === 'playlist') {
                const plData = playlists[drilldown.name] || {tracks:[], image:null, description:"", tags:[]};
                const list = plData.tracks.map(fn => tracks.find(t => t.filename === fn)).filter(Boolean);
                
                // Inline search searches through tags as well
                const filteredPlSearch = plSearch.trim() ? tracks.filter(t => {
                    const q = plSearch.toLowerCase();
                    return t.title.toLowerCase().includes(q) || 
                           t.artist.toLowerCase().includes(q) ||
                           (t.tags && t.tags.some(tag => tag.includes(q)));
                }) : [];
                
                return (
                    <>
                        <div className="drilldown-header">
                            <button className="drilldown-back" onClick={() => {setDrilldown(null); setIsAddingToPlaylist(false); setPlSearch("");}}><ArrowLeft size={32}/></button>
                            {plData.image ? (
                                <div style={{width:'80px', height:'80px', backgroundImage:`url("/api/images/${encodeURI(plData.image)}")`, backgroundSize:'cover', boxShadow: '0 5px 15px rgba(0,0,0,0.5)'}} />
                            ) : (
                                <div style={{width:'80px', height:'80px', backgroundImage:`url("${getImageUrl(drilldown.name)}")`, backgroundSize:'cover', boxShadow: '0 5px 15px rgba(0,0,0,0.5)'}} />
                            )}
                            <h2 className="drilldown-title">{drilldown.name}</h2>
                            <button className="drilldown-back" style={{marginLeft: 'auto'}} onClick={() => openEditPlaylist(drilldown.name)}>
                                <Edit3 size={24} />
                            </button>
                        </div>
                        
                        {renderTrackList(list)}
                        
                        <button className="new-playlist-btn" style={{marginTop:'30px', width:'max-content'}} onClick={() => setIsAddingToPlaylist(!isAddingToPlaylist)}>
                            {isAddingToPlaylist ? "Close Search" : "Add Songs"}
                        </button>
                        
                        {isAddingToPlaylist && (
                            <div style={{marginTop: '20px', padding: '20px', background: 'var(--glass-bg)', borderRadius: '10px'}}>
                                <input 
                                    autoFocus 
                                    className="search-input" 
                                    placeholder="Search library..." 
                                    style={{width:'100%', textAlign:'left', fontSize:'1.5rem', marginBottom: '20px'}} 
                                    value={plSearch} 
                                    onChange={e=>setPlSearch(e.target.value)} 
                                />
                                <div style={{display:'flex', flexDirection:'column', gap:'10px', maxHeight:'300px', overflowY:'auto'}}>
                                    {filteredPlSearch.map(t => (
                                        <div key={t.filename} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding: '10px', borderBottom: '1px solid var(--glass-border)'}}>
                                            <div>
                                                <div style={{fontSize:'1.1rem'}}>{t.title}</div>
                                                <div style={{fontSize:'0.8rem', color:'var(--text-secondary)'}}>{t.artist}</div>
                                            </div>
                                            <button 
                                                className="add-tag-btn" 
                                                style={{opacity: 1}} 
                                                onClick={async () => {
                                                    const newTracks = [...plData.tracks, t.filename];
                                                    await fetch('/api/playlists', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ name: drilldown.name, tracks: newTracks })
                                                    });
                                                    fetchData();
                                                }}
                                            >
                                                + Add
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                );
            } else if (drilldown.type === 'album') {
                const aMeta = albumMeta[drilldown.name] || {tracks:[], image:null, description:"", tags:[]};
                // Merge: metadata-derived tracks + manually added tracks (no duplicates)
                const metaTracks = tracks.filter(t => t.album === drilldown.name);
                const manualTracks = (aMeta.tracks || []).map(fn => tracks.find(t => t.filename === fn)).filter(Boolean);
                const seenFilenames = new Set(metaTracks.map(t => t.filename));
                const extraTracks = manualTracks.filter(t => !seenFilenames.has(t.filename));
                const list = [...metaTracks, ...extraTracks];
                
                // Inline search
                const filteredAlbumSearch = albumSearch.trim() ? tracks.filter(t => {
                    const q = albumSearch.toLowerCase();
                    return t.title.toLowerCase().includes(q) || 
                           t.artist.toLowerCase().includes(q) ||
                           (t.tags && t.tags.some(tag => tag.includes(q)));
                }) : [];
                
                return (
                    <>
                        <div className="drilldown-header">
                            <button className="drilldown-back" onClick={() => {setDrilldown(null); setIsAddingToAlbum(false); setAlbumSearch("");}}><ArrowLeft size={32}/></button>
                            {aMeta.image ? (
                                <div style={{width:'80px', height:'80px', backgroundImage:`url("/api/images/${encodeURI(aMeta.image)}")`, backgroundSize:'cover', boxShadow: '0 5px 15px rgba(0,0,0,0.5)'}} />
                            ) : (
                                <div style={{width:'80px', height:'80px', backgroundImage:`url("${getImageUrl(drilldown.name)}")`, backgroundSize:'cover', boxShadow: '0 5px 15px rgba(0,0,0,0.5)'}} />
                            )}
                            <h2 className="drilldown-title">{drilldown.name}</h2>
                            <button className="drilldown-back" style={{marginLeft: 'auto'}} onClick={() => openEditAlbum(drilldown.name)}>
                                <Edit3 size={24} />
                            </button>
                        </div>
                        
                        {renderTrackList(list)}
                        
                        <button className="new-playlist-btn" style={{marginTop:'30px', width:'max-content'}} onClick={() => setIsAddingToAlbum(!isAddingToAlbum)}>
                            {isAddingToAlbum ? "Close Search" : "Add Songs"}
                        </button>
                        
                        {isAddingToAlbum && (
                            <div style={{marginTop: '20px', padding: '20px', background: 'var(--glass-bg)', borderRadius: '10px'}}>
                                <input 
                                    autoFocus 
                                    className="search-input" 
                                    placeholder="Search library..." 
                                    style={{width:'100%', textAlign:'left', fontSize:'1.5rem', marginBottom: '20px'}} 
                                    value={albumSearch} 
                                    onChange={e=>setAlbumSearch(e.target.value)} 
                                />
                                <div style={{display:'flex', flexDirection:'column', gap:'10px', maxHeight:'300px', overflowY:'auto'}}>
                                    {filteredAlbumSearch.map(t => (
                                        <div key={t.filename} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding: '10px', borderBottom: '1px solid var(--glass-border)'}}>
                                            <div>
                                                <div style={{fontSize:'1.1rem'}}>{t.title}</div>
                                                <div style={{fontSize:'0.8rem', color:'var(--text-secondary)'}}>{t.artist}</div>
                                            </div>
                                            <button 
                                                className="add-tag-btn" 
                                                style={{opacity: 1}} 
                                                onClick={async () => {
                                                    const currentManualTracks = aMeta.tracks || [];
                                                    const newTracks = [...currentManualTracks, t.filename];
                                                    await fetch('/api/albums', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ name: drilldown.name, tracks: newTracks })
                                                    });
                                                    fetchData();
                                                }}
                                            >
                                                + Add
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                );
            } else {
                const list = tracks.filter(t => t[drilldown.type] === drilldown.name);
                return (
                    <>
                        <div className="drilldown-header">
                            <button className="drilldown-back" onClick={() => setDrilldown(null)}><ArrowLeft size={32}/></button>
                            <h2 className="drilldown-title">{drilldown.name}</h2>
                        </div>
                        {renderTrackList(list)}
                    </>
                );
            }
        }

        if (activeMenu === 'create-playlist' || activeMenu === 'edit-playlist') {
            const isEditing = activeMenu === 'edit-playlist';
            return (
                <div style={{display:'flex', flexDirection:'column', gap:'20px', maxWidth:'500px', marginTop: '20px'}}>
                    <div className="drilldown-header">
                       <button className="drilldown-back" onClick={() => isEditing ? setDrilldown({type: 'playlist', name: newPlName}) : setActiveMenu('playlists')}><ArrowLeft size={32}/></button>
                       <h2 className="drilldown-title">{isEditing ? "Edit Playlist" : "Create Playlist"}</h2>
                    </div>
                    <input type="text" placeholder="Playlist Name" className="search-input" style={{width:'100%', fontSize:'2rem', marginBottom:0, textAlign:'left'}} value={newPlName} onChange={e=>setNewPlName(e.target.value)} readOnly={isEditing} />
                    
                    <textarea 
                        className="search-input" 
                        placeholder="Description (Optional)" 
                        style={{width:'100%', fontSize:'1rem', textAlign:'left', resize:'vertical', minHeight:'80px', marginTop: '20px'}}
                        value={newPlDesc}
                        onChange={e=>setNewPlDesc(e.target.value)}
                    />
                    
                    <input 
                        type="text" 
                        placeholder="Tags (comma separated, e.g. workout, album)" 
                        className="search-input" 
                        style={{width:'100%', fontSize:'1rem', textAlign:'left', marginTop: '20px'}}
                        value={newPlTags}
                        onChange={e=>setNewPlTags(e.target.value)}
                    />

                    <div style={{border:'1px dashed var(--glass-border)', padding:'30px', textAlign:'center', marginTop: '20px'}}>
                        <input type="file" accept="image/*" onChange={e => setNewPlFile(e.target.files[0])} style={{color: 'var(--text-secondary)'}} />
                        <p style={{color:'var(--text-secondary)', marginTop: '10px'}}>Upload a new custom cover image</p>
                    </div>
                    <button className="new-playlist-btn" style={{marginTop:'20px', alignSelf:'flex-start'}} onClick={submitPlaylist}>{isEditing ? "Save Changes" : "Create Playlist"}</button>
                </div>
            );
        }

        if (activeMenu === 'edit-album') {
            return (
                <div style={{display:'flex', flexDirection:'column', gap:'20px', maxWidth:'500px', marginTop: '20px'}}>
                    <div className="drilldown-header">
                       <button className="drilldown-back" onClick={() => setDrilldown({type: 'album', name: editAlbumName})}><ArrowLeft size={32}/></button>
                       <h2 className="drilldown-title">Edit Album</h2>
                    </div>
                    <input type="text" placeholder="Album Name" className="search-input" style={{width:'100%', fontSize:'2rem', marginBottom:0, textAlign:'left'}} value={editAlbumName} readOnly />
                    
                    <textarea 
                        className="search-input" 
                        placeholder="Description (Optional)" 
                        style={{width:'100%', fontSize:'1rem', textAlign:'left', resize:'vertical', minHeight:'80px', marginTop: '20px'}}
                        value={editAlbumDesc}
                        onChange={e=>setEditAlbumDesc(e.target.value)}
                    />
                    
                    <input 
                        type="text" 
                        placeholder="Tags (comma separated, e.g. rock, 2024)" 
                        className="search-input" 
                        style={{width:'100%', fontSize:'1rem', textAlign:'left', marginTop: '20px'}}
                        value={editAlbumTags}
                        onChange={e=>setEditAlbumTags(e.target.value)}
                    />

                    <div style={{border:'1px dashed var(--glass-border)', padding:'30px', textAlign:'center', marginTop: '20px'}}>
                        <input type="file" accept="image/*" onChange={e => setEditAlbumFile(e.target.files[0])} style={{color: 'var(--text-secondary)'}} />
                        <p style={{color:'var(--text-secondary)', marginTop: '10px'}}>Upload a custom album cover image</p>
                    </div>
                    <button className="new-playlist-btn" style={{marginTop:'20px', alignSelf:'flex-start'}} onClick={submitAlbum}>Save Changes</button>
                </div>
            );
        }

        if (activeMenu === 'songs') return renderTrackList(displayTracks);
        
        if (activeMenu === 'artists') {
            return (
                <div className="grid-view">
                    {artists.map(a => (
                        <div key={a} className="grid-card" onClick={() => setDrilldown({type: 'artist', name: a})}>
                            <div className="grid-art" style={{backgroundImage: `url("${getImageUrl(a)}")`, borderRadius: '50%'}} />
                            <div className="grid-title">{a}</div>
                        </div>
                    ))}
                </div>
            );
        }
        
        if (activeMenu === 'albums') {
            return (
                <div className="grid-view">
                    {albums.map(a => {
                        const albumArtist = displayTracks.find(t => t.album === a)?.artist;
                        const aMeta = albumMeta[a] || {};
                        return (
                            <div key={a} className="grid-card" onClick={() => setDrilldown({type: 'album', name: a})}>
                                {aMeta.image ? (
                                    <div className="grid-art" style={{backgroundImage: `url("/api/images/${encodeURI(aMeta.image)}")`}} />
                                ) : (
                                    <div className="grid-art" style={{backgroundImage: `url("${getImageUrl(a)}")`}} />
                                )}
                                <div className="grid-title">{a}</div>
                                <div className="grid-subtitle">{albumArtist}</div>
                            </div>
                        )
                    })}
                </div>
            );
        }

        if (activeMenu === 'playlists') {
            const plNames = Object.keys(playlists);
            
            // Allow searching through playlists too if activeTagFilter is set
            let displayPlNames = plNames;
            if (activeTagFilter) {
                displayPlNames = plNames.filter(name => playlists[name].tags && playlists[name].tags.includes(activeTagFilter));
            }

            return (
                <>
                    <div className="playlist-header">
                        <button className="new-playlist-btn" onClick={() => { 
                            setNewPlName(""); setNewPlFile(null); setNewPlDesc(""); setNewPlTags("");
                            setActiveMenu('create-playlist'); 
                            setDrilldown(null); 
                        }}>Create New</button>
                    </div>
                    {displayPlNames.length === 0 ? <div style={{opacity: 0.5}}>No playlists found.</div> : null}
                    <div className="grid-view">
                        {displayPlNames.map(name => {
                            const p = playlists[name];
                            return (
                                <div key={name} className="grid-card" onClick={() => setDrilldown({type: 'playlist', name})}>
                                    {p.image ? (
                                        <div className="grid-art" style={{backgroundImage: `url("/api/images/${encodeURI(p.image)}")`}} />
                                    ) : (
                                        <div className="grid-art" style={{backgroundImage: `url("${getImageUrl(name)}")`}} />
                                    )}
                                    <div className="grid-title">{name}</div>
                                    <div className="grid-subtitle">{p.tracks.length} tracks</div>
                                </div>
                            );
                        })}
                    </div>
                </>
            );
        }

        if (activeMenu === 'queue') {
            return (
                <>
                    <h2 className="drilldown-title" style={{marginBottom: '30px'}}>Up Next</h2>
                    {queue.length === 0 ? <div style={{opacity: 0.5}}>Queue is empty.</div> : null}
                    {queue.map((track, idx) => (
                        <div 
                            key={idx + track.filename} 
                            className="queue-item"
                            draggable
                            onDragStart={(e) => handleQueueDragStart(e, idx)}
                            onDrop={(e) => handleQueueDrop(e, idx)}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <GripHorizontal className="queue-item-drag" size={20} />
                            <div className="queue-item-info">
                                <span className="queue-item-title">{track.title}</span>
                                <span className="queue-item-artist">{track.artist}</span>
                            </div>
                            <button className="queue-item-remove" onClick={() => setQueue(q => q.filter((_, i) => i !== idx))}>
                                <Trash size={20}/>
                            </button>
                        </div>
                    ))}
                </>
            );
        }

        return null;
    };

    const renderColumn = (id) => {
        if (id === 'primary-menu') {
            return (
                <div className="left-menu" style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                        {['songs', 'artists', 'albums', 'playlists'].map(item => (
                            <div 
                                key={item} 
                                className={`menu-item ${(activeMenu === item || (item === 'playlists' && (activeMenu === 'create-playlist' || activeMenu === 'edit-playlist')) || (item === 'albums' && activeMenu === 'edit-album')) ? 'active' : ''}`}
                                onClick={() => { setActiveMenu(item); setDrilldown(null); }}
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                    {/* Render playlist meta if player is on the right */}
                    {isPlayerInRight && renderPlaylistMeta()}
                </div>
            );
        }
        if (id === 'track-list') {
            return (
                <div className="center-container">
                    <div className="center-content">
                        {renderCenter()}
                    </div>
                </div>
            );
        }
        if (id === 'secondary-menu') {
            return (
                <div className="right-menu" style={{justifyContent: 'flex-start'}}>
                    {/* Render playlist meta if player is on the left */}
                    {!isPlayerInRight && <div style={{width:'100%', marginBottom:'auto'}}>{renderPlaylistMeta()}</div>}
                    <div style={{display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-end', marginTop:'auto'}}>
                        <div className="secondary-item" onClick={() => setIsSearching(true)}>search</div>
                        <div className={`secondary-item ${activeMenu === 'queue' ? 'active' : ''}`} onClick={() => setActiveMenu('queue')}>queue</div>
                        {activeTagFilter && (
                            <div className="secondary-item" onClick={() => setActiveTagFilter(null)}>clear filter</div>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="app-container">
            <div className="animated-bg">
                <div className="bg-blob blob-1"></div>
                <div className="bg-blob blob-2"></div>
                <div className="bg-blob blob-3"></div>
                <div className="bg-blob blob-4"></div>
                <div className="bg-glass-overlay"></div>
            </div>
            <div className="audio-pulse" />

            {/* Theme Toggle */}
            <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            </button>

            {columns.map(id => (
                <div 
                    key={id} 
                    className={`col-wrapper ${id}`}
                    draggable
                    onDragStart={(e) => handleColDragStart(e, id)}
                    onDrop={(e) => handleColDrop(e, id)}
                    onDragOver={(e) => e.preventDefault()}
                >
                    <div className="drag-handle"><GripHorizontal size={16} /></div>
                    {renderColumn(id)}
                </div>
            ))}

            <div 
                className={`draggable-player ${isDraggingState ? 'dragging' : ''}`}
                style={{ left: `${playerPos.x}px`, top: `${playerPos.y}px`, width: playerWidth }}
            >
                <div className="player-header" onMouseDown={handlePlayerMouseDown}>
                    <span className="player-brand">LIN</span>
                    <GripHorizontal className="drag-icon" size={20} />
                </div>
                
                {isArtExpanded && currentTrack && (
                    <div 
                        className="player-expanded-art" 
                        style={{backgroundImage: albumMeta[currentTrack.album]?.image ? `url("/api/images/${encodeURI(albumMeta[currentTrack.album].image)}")` : `url("${getImageUrl(currentTrack.album || currentTrack.title)}")`}}
                        onClick={() => setIsArtExpanded(false)}
                    />
                )}

                <div className="player-info">
                    {currentTrack ? (
                        <>
                            {!isArtExpanded && (
                                <div 
                                    className="player-art" 
                                    style={{backgroundImage: albumMeta[currentTrack.album]?.image ? `url("/api/images/${encodeURI(albumMeta[currentTrack.album].image)}")` : `url("${encodeURI(getImageUrl(currentTrack.album || currentTrack.title))}")`}}
                                    onClick={() => setIsArtExpanded(true)}
                                />
                            )}
                            <div className="player-text">
                                <span className="player-title">{currentTrack.title}</span>
                                <span className="player-artist">{currentTrack.artist}</span>
                            </div>
                        </>
                    ) : (
                        <div className="player-text" style={{opacity: 0.5}}>
                            <span className="player-title">Not Playing</span>
                        </div>
                    )}
                </div>

                <div className="player-controls">
                    <div className="control-buttons">
                        <button className="control-btn" onClick={playPrev}><SkipBack size={20} /></button>
                        <button className="control-btn play-btn" onClick={togglePlay}>
                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{marginLeft: '2px'}} />}
                        </button>
                        <button className="control-btn" onClick={playNext}><SkipForward size={20} /></button>
                    </div>
                    <div className="progress-container">
                        <span>{formatTime(progress)}</span>
                        <div className="progress-bar" ref={progressBarRef} onMouseDown={handleProgressMouseDown}>
                            <div 
                                className="progress-fill" 
                                style={{width: `${duration ? (progress / duration) * 100 : 0}%`}}
                            />
                        </div>
                        <span>{formatTime(duration)}</span>
                    </div>
                    <div className="progress-container" style={{marginTop: '15px'}}>
                        <Volume2 size={14} />
                        <div className="progress-bar" ref={volumeBarRef} onMouseDown={handleVolumeMouseDown}>
                            <div 
                                className="progress-fill" 
                                style={{width: `${volume * 100}%`}}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {isSearching && (
                <div className="search-overlay">
                    <button className="search-close" onClick={() => setIsSearching(false)}>
                        <X size={40} />
                    </button>
                    <input 
                        autoFocus
                        className="search-input"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <div className="search-results-wrapper">
                        <div className="search-results-grid">
                            {filteredSearch.map(track => (
                                <div 
                                    key={track.filename} 
                                    className="search-result-item"
                                    onClick={() => { playContext([track], 0); }}
                                >
                                    <div 
                                        className="search-result-art"
                                        style={{backgroundImage: albumMeta[track.album]?.image ? `url("/api/images/${encodeURI(albumMeta[track.album].image)}")` : `url("${getImageUrl(track.album || track.title)}")`}}
                                    />
                                    <span className="search-result-title">{track.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
