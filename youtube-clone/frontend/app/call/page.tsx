"use client";
import { useEffect, useRef, useState } from "react";
import { 
  Video, Mic, MicOff, MonitorUp, StopCircle, PhoneOff, 
  Circle, Download, Copy, UserPlus, Radio, 
  Activity, Shield, ChevronLeft, Settings, Users, 
  Maximize2, Share2
} from "lucide-react";
import Link from "next/link";
import io from "socket.io-client";
import Peer from "simple-peer";

// Polyfill for Simple-Peer in Next.js
if (typeof window !== "undefined") {
  window.global = window.global || window;
}

// Ensure this matches your backend PORT
const socket = io("http://localhost:5000");

export default function CallPage() {
  // --- REFS ---
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // --- STATE ---
  const [user, setUser] = useState<any>(null);
  const [me, setMe] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  // --- 1. INITIALIZATION & ID GENERATION ---
  useEffect(() => {
    // Sync Profile
    const fetchProfile = async () => {
      const email = localStorage.getItem("userEmail");
      if (!email) return;
      try {
        const res = await fetch(`http://localhost:5000/api/auth/profile?email=${email}`);
        const data = await res.json();
        if (res.ok) setUser(data);
      } catch (err) { console.error("Profile Error:", err); }
    };
    fetchProfile();

    // Instant ID Sync
    if (socket.connected) setMe(socket.id);
    const onMe = (id: string) => setMe(id);
    const onConnect = () => setMe(socket.id);

    socket.on("me", onMe);
    socket.on("connect", onConnect);

    return () => {
      socket.off("me", onMe);
      socket.off("connect", onConnect);
    };
  }, []);

  // --- 2. SIGNALING LISTENERS ---
  useEffect(() => {
    if (!me) return;

    socket.on("hey", ({ from, signal, name }) => {
      if (connectionRef.current) return;
      setIsCalling(true);
      
      startCall().then((currentStream) => {
        const peer = new Peer({ initiator: false, trickle: false, stream: currentStream });
        
        peer.on("signal", (data) => {
          socket.emit("answerCall", { signal: data, to: from });
        });

        peer.on("stream", (remote) => {
          setRemoteStream(remote);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remote;
        });

        peer.signal(signal);
        connectionRef.current = peer;
      });
    });

    socket.on("callAccepted", (signal) => {
      // 🛡️ Signaling Guard: Prevents the "Stable" state crash
      if (connectionRef.current && connectionRef.current._pc.signalingState !== "stable") {
        connectionRef.current.signal(signal);
      }
    });

    return () => {
      socket.off("hey");
      socket.off("callAccepted");
    };
  }, [me, user]);

  // --- 3. CORE LOGIC FUNCTIONS ---

  const startCall = async () => {
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setStream(currentStream);
      if (localVideoRef.current) localVideoRef.current.srcObject = currentStream;
      setIsCalling(true);
      return currentStream;
    } catch (err) {
      alert("Please allow camera/mic access.");
      throw err;
    }
  };

  const initiatePeer = (id: string, currentStream: MediaStream) => {
    const peer = new Peer({ initiator: true, trickle: false, stream: currentStream });

    peer.on("signal", (data) => {
      socket.emit("callUser", { 
        userToCall: id, 
        signalData: data, 
        from: me, 
        name: user?.name || "Studio Participant" 
      });
    });

    peer.on("stream", (remote) => {
      setRemoteStream(remote);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remote;
    });

    connectionRef.current = peer;
  };

  const callUser = (id: string) => {
    if (!id.trim()) return alert("Enter a valid Node ID");
    setIsCalling(true);
    if (!stream) {
      startCall().then((s) => initiatePeer(id, s));
    } else {
      initiatePeer(id, stream);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        
        if (connectionRef.current) {
          const videoTrack = screenStream.getVideoTracks()[0];
          const sender = connectionRef.current._pc.getSenders().find((s: any) => s.track.kind === "video");
          if (sender) sender.replaceTrack(videoTrack);
        }
        
        setStream(screenStream);
        setIsScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          startCall();
        };
      } catch (err) { console.error(err); }
    } else {
      setIsScreenSharing(false);
      startCall();
    }
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedUrl(URL.createObjectURL(blob));
    };
    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col font-sans">
      {/* --- HEADER --- */}
      <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/home" className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white">
            <ChevronLeft size={22} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center shadow-lg shadow-red-600/20">
              <Radio size={16} className="text-white animate-pulse" />
            </div>
            <span className="font-bold tracking-tighter text-xl uppercase italic">Studio Node</span>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
          <div className={`w-2 h-2 rounded-full ${me ? 'bg-green-500 animate-ping' : 'bg-yellow-500'}`} />
          <span className="text-[11px] font-mono text-green-500 uppercase tracking-widest leading-none">
            {me ? `Node ID: ${me.substring(0, 14)}` : "Syncing..."}
          </span>
          <Copy size={14} className="cursor-pointer opacity-40 hover:opacity-100" onClick={() => navigator.clipboard.writeText(me)} />
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-white/5 rounded-full"><Settings size={20} /></button>
          <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-orange-600 rounded-full border border-white/20 shadow-xl" />
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* --- VIDEO AREA --- */}
        <section className="flex-1 flex flex-col gap-4">
          <div className="flex-1 bg-black rounded-3xl border border-white/5 overflow-hidden relative shadow-2xl">
            {!isCalling ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-10">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                  <Video size={40} className="text-white/20" />
                </div>
                <h1 className="text-3xl font-black mb-2 tracking-tight">Transmission Ready</h1>
                <p className="text-white/40 max-w-sm mb-8 text-sm">Join the secure uplink. Your camera will activate upon node enabling.</p>
                <button 
                  onClick={() => { startCall(); setIsCalling(true); }}
                  className="bg-red-600 hover:bg-red-700 text-white px-12 py-4 rounded-2xl font-bold uppercase text-xs tracking-widest shadow-2xl shadow-red-600/40 transition-all active:scale-95"
                >
                  Enable Node
                </button>
              </div>
            ) : (
              <div className="w-full h-full relative">
                <video 
                  ref={remoteStream ? remoteVideoRef : localVideoRef} 
                  autoPlay playsInline 
                  onLoadedMetadata={(e) => e.currentTarget.play()}
                  className="w-full h-full object-cover" 
                />
                <div className="absolute top-6 left-6 flex gap-2">
                  <span className="bg-red-600 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest">Live</span>
                </div>
                {remoteStream && (
                  <div className="absolute top-6 right-6 w-56 aspect-video rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                  </div>
                )}
              </div>
            )}

            {/* --- CONTROLS --- */}
            <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#0a0a0a]/90 backdrop-blur-2xl px-6 py-4 rounded-3xl border border-white/10 transition-all ${isCalling ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-2xl ${isMuted ? 'bg-red-500 text-white' : 'bg-white/5'}`}>
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
              <button onClick={toggleScreenShare} className={`p-4 rounded-2xl ${isScreenSharing ? 'bg-blue-600' : 'bg-white/5'}`}>
                <MonitorUp size={22} />
              </button>
              <div className="w-px h-8 bg-white/10 mx-2" />
              {!isRecording ? (
                <button onClick={startRecording} className="p-4 bg-white/5 rounded-2xl flex items-center gap-2">
                  <Circle size={20} /><span className="text-[10px] font-bold uppercase tracking-widest">Rec</span>
                </button>
              ) : (
                <button onClick={() => { mediaRecorderRef.current?.stop(); setIsRecording(false); }} className="p-4 bg-red-600/20 text-red-500 rounded-2xl animate-pulse flex items-center gap-2 border border-red-500/50">
                  <StopCircle size={20} /><span className="text-[10px] font-bold uppercase tracking-widest tracking-tighter">Capturing</span>
                </button>
              )}
              <button onClick={() => window.location.reload()} className="p-4 bg-red-600 text-white rounded-2xl shadow-lg">
                <PhoneOff size={22} />
              </button>
            </div>
          </div>

          <div className="h-24 bg-white/5 border border-white/10 rounded-3xl px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><Users size={24}/></div>
              <div>
                <h3 className="font-bold text-lg">{user?.name || "Global Participant"}</h3>
                <p className="text-xs text-white/40 uppercase tracking-widest font-mono text-[10px]">E2E Encrypted Handshake</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="bg-white/5 p-3 rounded-xl"><Share2 size={18}/></button>
              <button className="bg-white/5 p-3 rounded-xl"><Maximize2 size={18}/></button>
            </div>
          </div>
        </section>

        {/* --- SIDEBAR --- */}
        <aside className="w-80 flex flex-col gap-4">
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Connect Node</span>
            <input 
              placeholder="Friend's Signal ID..." 
              className="w-full bg-black border border-white/10 px-5 py-4 rounded-2xl text-xs font-mono outline-none"
              value={idToCall}
              onChange={(e) => setIdToCall(e.target.value)}
            />
            <button 
              onClick={() => callUser(idToCall)}
              className="w-full bg-white text-black py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95"
            >
              <UserPlus size={16} className="inline mr-2" /> Establish Link
            </button>
          </div>

          <div className="flex-1 bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-4">Local Cache</span>
            <div className="flex-1 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center p-2">
              {recordedUrl ? (
                <div className="w-full h-full flex flex-col">
                  <video src={recordedUrl} controls className="w-full rounded-2xl mb-4 bg-black aspect-video" />
                  <button 
                    onClick={() => { const a = document.createElement("a"); a.href = recordedUrl; a.download="Node_Capture.webm"; a.click(); }} 
                    className="w-full py-4 bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all"
                  >
                    <Download size={14} className="inline mr-2" /> Download Cache
                  </button>
                </div>
              ) : (
                <div className="text-center opacity-20">
                  <Download size={24} className="mx-auto mb-2" />
                  <p className="text-[10px] uppercase font-bold tracking-widest">No Cache</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}