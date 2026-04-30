"use client";
import { API_URL } from '../config';
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Video, VideoOff, Mic, MicOff, MonitorUp, PhoneOff,
  Circle, StopCircle, Download, Copy, UserPlus, Radio,
  ChevronLeft, Maximize2, Phone, PhoneCall, Wifi, WifiOff
} from "lucide-react";
import Link from "next/link";
import io from "socket.io-client";
// @ts-ignore
import Peer from "simple-peer";

if (typeof window !== "undefined") {
  window.global = window.global || window;
}

type CallStatus = 'idle' | 'ready' | 'calling' | 'connected';

export default function CallPage() {
  const localVideoRef   = useRef<HTMLVideoElement>(null);
  const remoteVideoRef  = useRef<HTMLVideoElement>(null);
  const connectionRef   = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef       = useRef<Blob[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const socketRef       = useRef<any>(null);
  const streamRef       = useRef<MediaStream | null>(null);
  const callDurationRef = useRef<NodeJS.Timeout | null>(null);

  const [user, setUser]             = useState<any>(null);
  const [me, setMe]                 = useState("");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [idToCall, setIdToCall]     = useState("");
  const [isMuted, setIsMuted]       = useState(false);
  const [isCamOff, setIsCamOff]     = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<{from:string;signal:any;name:string}|null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteName, setRemoteName] = useState("");
  const [copied, setCopied]         = useState(false);
  const [camError, setCamError]     = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(me);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // ── Init camera + socket ──────────────────────────────────────────────────
  useEffect(() => {
    const initCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = s;
        if (localVideoRef.current) localVideoRef.current.srcObject = s;
        setCallStatus('ready');
      } catch (err) {
        console.warn("Camera unavailable:", err);
        setCamError(true);
        setCallStatus('ready');
      }
    };
    initCamera();

    const fetchProfile = async () => {
      const email = localStorage.getItem("userEmail");
      if (!email) return;
      try {
        const res = await fetch(`${API_URL}/api/auth/profile?email=${email}`);
        const data = await res.json();
        if (res.ok) setUser(data);
      } catch {}
    };
    fetchProfile();

    socketRef.current = io(API_URL || "");
    const socket = socketRef.current;
    if (socket.connected) setMe(socket.id || "");
    socket.on("me", (id: string) => setMe(id));
    socket.on("connect", () => setMe(socket.id || ""));
    socket.on("hey", ({ from, signal, name }: any) => setIncomingCall({ from, signal, name }));
    socket.on("callAccepted", (signal: any) => {
      if (connectionRef.current && connectionRef.current._pc?.signalingState !== "stable") {
        connectionRef.current.signal(signal);
      }
    });

    return () => {
      socket.disconnect();
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (callDurationRef.current) clearInterval(callDurationRef.current);
    };
  }, []);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'connected') {
      setCallDuration(0);
      callDurationRef.current = setInterval(() => setCallDuration(p => p + 1), 1000);
    } else {
      if (callDurationRef.current) { clearInterval(callDurationRef.current); callDurationRef.current = null; }
      setCallDuration(0);
    }
    return () => { if (callDurationRef.current) clearInterval(callDurationRef.current); };
  }, [callStatus]);

  // ── Stream helper ─────────────────────────────────────────────────────────
  const getOrCreateStream = async (): Promise<MediaStream> => {
    if (streamRef.current) return streamRef.current;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = s;
      if (localVideoRef.current) localVideoRef.current.srcObject = s;
      setCamError(false);
      return s;
    } catch {
      setCamError(true);
      const canvas = document.createElement("canvas");
      canvas.width = 640; canvas.height = 480;
      const ctx = canvas.getContext("2d");
      if (ctx) { ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, 640, 480); }
      const blank = canvas.captureStream(1);
      try {
        const ac = new AudioContext();
        blank.addTrack(ac.createMediaStreamDestination().stream.getAudioTracks()[0]);
      } catch {}
      streamRef.current = blank;
      if (localVideoRef.current) localVideoRef.current.srcObject = blank;
      return blank;
    }
  };

  // ── Peer creation ─────────────────────────────────────────────────────────
  const createPeer = (initiator: boolean, targetId: string, s: MediaStream) => {
    const peer = new Peer({
      initiator, trickle: false, stream: s,
      config: { iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ]}
    });

    peer.on("signal", (data: any) => {
      if (initiator) {
        socketRef.current?.emit("callUser", { userToCall: targetId, signalData: data, from: me, name: user?.name || "User" });
      } else {
        socketRef.current?.emit("answerCall", { signal: data, to: targetId });
      }
    });

    peer.on("stream", (remote: MediaStream) => {
      setRemoteStream(remote);
      setCallStatus('connected');
    });

    peer.on("error", (err: any) => { console.error("Peer error:", err); hangUp(); });
    peer.on("close", () => { setRemoteStream(null); setCallStatus('ready'); });

    connectionRef.current = peer;
    return peer;
  };

  // ── Call actions ──────────────────────────────────────────────────────────
  const callUser = async (id: string) => {
    if (!id.trim()) return alert("Enter a valid Node ID");
    setCallStatus('calling');
    const s = await getOrCreateStream();
    createPeer(true, id, s);
  };

  const answerCall = async () => {
    if (!incomingCall) return;
    setRemoteName(incomingCall.name);
    setCallStatus('calling');
    const s = await getOrCreateStream();
    const peer = createPeer(false, incomingCall.from, s);
    peer.signal(incomingCall.signal);
    setIncomingCall(null);
  };

  const hangUp = useCallback(() => {
    connectionRef.current?.destroy();
    connectionRef.current = null;
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    setRemoteStream(null);
    setCallStatus('ready');
    setIdToCall("");
    setIsScreenSharing(false);
    setRemoteName("");
    if (isRecording) { mediaRecorderRef.current?.stop(); setIsRecording(false); }
  }, [isRecording]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const toggleMute = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(p => !p);
  };

  const toggleCamera = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCamOff(p => !p);
  };

  const stopScreenShare = () => {
    const s = streamRef.current;
    if (!s) return;
    if (localVideoRef.current) localVideoRef.current.srcObject = s;
    if (connectionRef.current) {
      const senders = connectionRef.current._pc.getSenders();
      const vs = senders.find((x: any) => x.track?.kind === "video");
      const as = senders.find((x: any) => x.track?.kind === "audio");
      if (vs) vs.replaceTrack(s.getVideoTracks()[0] || null);
      if (as) as.replaceTrack(s.getAudioTracks()[0] || null);
    }
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    setIsScreenSharing(false);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) { stopScreenShare(); return; }
    try {
      const ss = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = ss;
      if (localVideoRef.current) localVideoRef.current.srcObject = ss;
      if (connectionRef.current) {
        const senders = connectionRef.current._pc.getSenders();
        const vs = senders.find((x: any) => x.track?.kind === "video");
        const as = senders.find((x: any) => x.track?.kind === "audio");
        if (vs) vs.replaceTrack(ss.getVideoTracks()[0]);
        if (as && ss.getAudioTracks()[0]) as.replaceTrack(ss.getAudioTracks()[0]);
      }
      setIsScreenSharing(true);
      ss.getVideoTracks()[0].onended = () => stopScreenShare();
    } catch {}
  };

  const startRecording = () => {
    let src = streamRef.current;
    if (isScreenSharing && screenStreamRef.current) src = screenStreamRef.current;
    else if (remoteStream) src = remoteStream;
    if (!src) return;
    const mime = ['video/webm;codecs=vp9','video/webm','video/mp4'].find(m => MediaRecorder.isTypeSupported(m)) || '';
    chunksRef.current = [];
    const rec = new MediaRecorder(src, mime ? { mimeType: mime } : undefined);
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => setRecordedUrl(URL.createObjectURL(new Blob(chunksRef.current, { type: mime || 'video/webm' })));
    rec.start(1000);
    mediaRecorderRef.current = rec;
    setIsRecording(true);
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };

  const isInCall = callStatus === 'calling' || callStatus === 'connected';

  return (
    <div className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden">

      {/* ── HEADER ── */}
      <header className="h-14 flex-shrink-0 border-b border-white/5 bg-black/60 backdrop-blur-xl flex items-center justify-between px-5 z-50">
        <div className="flex items-center gap-3">
          <Link href="/home" className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center">
              <Radio size={14} className="text-white animate-pulse" />
            </div>
            <span className="font-black text-base uppercase tracking-tighter">YouClone Studio</span>
          </div>
        </div>

        {/* Status pill */}
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-wider transition-all duration-500 ${
          callStatus === 'connected' ? 'border-green-500/50 bg-green-500/10 text-green-400' :
          callStatus === 'calling'   ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400' :
          callStatus === 'ready'     ? 'border-white/10 bg-white/5 text-white/40' :
                                       'border-white/5 text-white/20'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            callStatus === 'connected' ? 'bg-green-400' :
            callStatus === 'calling'   ? 'bg-yellow-400 animate-pulse' : 'bg-white/20'
          }`} />
          {callStatus === 'connected' ? `Connected · ${formatDuration(callDuration)}` :
           callStatus === 'calling'   ? 'Connecting...' :
           callStatus === 'ready'     ? 'Ready' : 'Starting...'}
        </div>

        <div className="flex items-center gap-2">
          {camError && (
            <div className="flex items-center gap-1.5 text-[10px] text-orange-400 bg-orange-400/10 border border-orange-400/20 px-3 py-1 rounded-full">
              <WifiOff size={12} /> No Camera
            </div>
          )}
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-purple-600 rounded-full flex items-center justify-center font-black text-sm border border-white/10">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      {/* ── INCOMING CALL MODAL ── */}
      {incomingCall && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-5 shadow-2xl w-full max-w-sm">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/30">
                <span className="text-3xl font-black text-white">{incomingCall.name?.[0]?.toUpperCase() || '?'}</span>
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-green-400/30 animate-ping" />
            </div>
            <div className="text-center">
              <p className="text-white font-black text-xl">{incomingCall.name}</p>
              <p className="text-white/40 text-sm mt-1">Incoming video call</p>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => setIncomingCall(null)}
                className="flex-1 py-3.5 bg-red-600/20 hover:bg-red-600 border border-red-600/40 text-red-400 hover:text-white rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2">
                <PhoneOff size={18} /> Decline
              </button>
              <button onClick={answerCall}
                className="flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-bold transition-all duration-200 shadow-lg shadow-green-600/30 flex items-center justify-center gap-2">
                <Phone size={18} /> Answer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex overflow-hidden p-3 gap-3 min-h-0">

        {/* VIDEO SECTION */}
        <section className="flex-1 flex flex-col gap-3 min-w-0">

          {/* Video container */}
          <div className="flex-1 relative bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/5 shadow-2xl min-h-0">

            {/* Remote video — full screen */}
            <video ref={remoteVideoRef} autoPlay playsInline
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${remoteStream ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Local video — full when alone, PiP when remote active */}
            <video ref={localVideoRef} autoPlay playsInline muted
              className={`transition-all duration-500 ${
                remoteStream
                  ? 'absolute bottom-20 right-4 w-36 md:w-44 aspect-video rounded-xl border-2 border-white/20 shadow-2xl z-20 object-cover'
                  : 'absolute inset-0 w-full h-full object-cover'
              } ${isCamOff ? 'opacity-0' : 'opacity-100'}`}
            />

            {/* Camera off placeholder */}
            {isCamOff && !remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] z-10">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/10">
                    <VideoOff size={32} className="text-white/30" />
                  </div>
                  <p className="text-white/30 text-sm font-bold">Camera Off</p>
                </div>
              </div>
            )}

            {/* Idle spinner */}
            {callStatus === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-30">
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Starting camera...</p>
                </div>
              </div>
            )}

            {/* Connecting overlay */}
            {callStatus === 'calling' && !remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-yellow-400 font-black text-sm uppercase tracking-widest">Calling...</p>
                  <p className="text-white/30 text-xs mt-2">Waiting for answer</p>
                  <button onClick={hangUp}
                    className="mt-6 px-6 py-2.5 bg-red-600/20 hover:bg-red-600 border border-red-600/40 text-red-400 hover:text-white rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-2 mx-auto">
                    <PhoneOff size={14} /> Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Ready hint */}
            {callStatus === 'ready' && !remoteStream && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <p className="text-white/20 text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                  {camError ? '⚠ No camera · Audio only' : '● Camera ready · Enter Node ID to call'}
                </p>
              </div>
            )}

            {/* Remote name tag */}
            {callStatus === 'connected' && remoteName && (
              <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-white/80">
                {remoteName}
              </div>
            )}

            {/* Screen share badge */}
            {isScreenSharing && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-blue-600/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold">
                <MonitorUp size={13} className="animate-pulse" /> Sharing Screen
                <button onClick={stopScreenShare} className="ml-1 bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full transition-colors">Stop</button>
              </div>
            )}

            {/* REC badge */}
            {isRecording && (
              <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-red-600 px-3 py-1 rounded-full text-[10px] font-black animate-pulse">
                <span className="w-1.5 h-1.5 bg-white rounded-full" /> REC
              </div>
            )}

            {/* ── CONTROLS BAR ── */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-black/80 backdrop-blur-2xl px-4 py-3 rounded-2xl border border-white/10 shadow-2xl">

              {/* Mic */}
              <button onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${isMuted ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-white/10 hover:bg-white/20'}`}>
                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              {/* Camera */}
              <button onClick={toggleCamera} title={isCamOff ? "Camera on" : "Camera off"}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${isCamOff ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-white/10 hover:bg-white/20'}`}>
                {isCamOff ? <VideoOff size={18} /> : <Video size={18} />}
              </button>

              {/* Screen share */}
              <button onClick={toggleScreenShare} title="Share Screen"
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${isScreenSharing ? 'bg-blue-500 shadow-lg shadow-blue-500/30' : 'bg-white/10 hover:bg-white/20'}`}>
                <MonitorUp size={18} />
              </button>

              <div className="w-px h-7 bg-white/10 mx-1" />

              {/* Record */}
              {!isRecording ? (
                <button onClick={startRecording} title="Record"
                  className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110 active:scale-95">
                  <Circle size={18} />
                </button>
              ) : (
                <button onClick={stopRecording} title="Stop Recording"
                  className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-600/30 text-red-400 border border-red-500/40 animate-pulse transition-all">
                  <StopCircle size={18} />
                </button>
              )}

              {/* Fullscreen */}
              <button onClick={() => document.documentElement.requestFullscreen?.()}
                className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110 active:scale-95">
                <Maximize2 size={18} />
              </button>

              {/* ── HANG UP — prominent red pill ── */}
              {isInCall && (
                <>
                  <div className="w-px h-7 bg-white/10 mx-1" />
                  <button onClick={hangUp} title="End Call"
                    className="flex items-center gap-2 px-5 h-11 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-red-600/40 transition-all duration-200 hover:scale-105 active:scale-95">
                    <PhoneOff size={18} />
                    <span className="hidden sm:inline">End Call</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Info bar */}
          <div className="h-14 flex-shrink-0 bg-white/5 border border-white/5 rounded-xl px-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-purple-600 rounded-lg flex items-center justify-center font-black text-sm">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-bold text-sm leading-none">{user?.name || "You"}</p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  {callStatus === 'connected' ? `🟢 ${formatDuration(callDuration)}` :
                   callStatus === 'calling'   ? '🟡 Connecting...' : '⚪ Ready'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-white/30">
              <Wifi size={12} className={callStatus === 'connected' ? 'text-green-400' : ''} />
              WebRTC · E2E Encrypted
            </div>
          </div>
        </section>

        {/* ── SIDEBAR ── */}
        <aside className="w-72 flex-shrink-0 flex flex-col gap-3">

          {/* My Node ID */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Your Node ID</p>
            <div className="bg-black/50 border border-white/5 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <span className="text-[11px] font-mono text-green-400 flex-1 truncate">{me || 'Connecting...'}</span>
              <button onClick={copyId}
                className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'bg-white/5 hover:bg-white/10 text-white/40 hover:text-white'}`}>
                <Copy size={11} /> {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-[10px] text-white/20 leading-relaxed">Share this ID with your friend. They paste it below and call you.</p>
          </div>

          {/* Call panel */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Call a Friend</p>
            <input
              placeholder="Paste friend's Node ID..."
              className="w-full bg-black/50 border border-white/10 px-4 py-3 rounded-xl text-xs font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-white/20"
              value={idToCall}
              onChange={(e) => setIdToCall(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !isInCall) callUser(idToCall); }}
            />

            {!isInCall ? (
              <button onClick={() => callUser(idToCall)}
                disabled={callStatus === 'idle' || !idToCall.trim()}
                className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-white/5 disabled:text-white/20 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all duration-200 active:scale-95 shadow-lg shadow-green-600/20 flex items-center justify-center gap-2">
                <PhoneCall size={16} /> Call
              </button>
            ) : (
              <button onClick={hangUp}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-all duration-200 active:scale-95 shadow-lg shadow-red-600/30 flex items-center justify-center gap-2">
                <PhoneOff size={16} /> Hang Up
              </button>
            )}
          </div>

          {/* Recording panel */}
          <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 min-h-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Recording</p>
            <div className="flex-1 border border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center p-3 min-h-0 overflow-auto">
              {recordedUrl ? (
                <div className="w-full flex flex-col gap-2">
                  <video src={recordedUrl} controls className="w-full rounded-xl bg-black aspect-video" />
                  <button onClick={() => { const a = document.createElement("a"); a.href = recordedUrl; a.download = `YouClone_${Date.now()}.webm`; a.click(); }}
                    className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                    <Download size={13} /> Save
                  </button>
                  <button onClick={() => setRecordedUrl(null)} className="w-full py-1.5 text-[10px] text-white/20 hover:text-white/50 transition-colors">Discard</button>
                </div>
              ) : (
                <div className="text-center opacity-20 select-none">
                  <Circle size={24} className="mx-auto mb-2" />
                  <p className="text-[10px] uppercase font-bold tracking-widest">No Recording</p>
                  <p className="text-[9px] mt-1">Use Rec button during call</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
