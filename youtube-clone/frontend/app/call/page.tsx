"use client";
import { useEffect, useRef, useState } from "react";
import { 
  Video, Mic, MicOff, MonitorUp, StopCircle, PhoneOff, 
  VideoOff, Circle, Download, Copy, UserPlus, Radio, 
  Activity, Shield, ChevronLeft 
} from "lucide-react";
import Link from "next/link";
import io from "socket.io-client";
import Peer from "simple-peer"; // 👈 Make sure to: npm install simple-peer

// Polyfill for Simple-Peer in Next.js
if (typeof window !== "undefined") {
  window.global = window.global || window;
}

const socket = io("http://localhost:5000");

export default function CallPage() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<any>(null);

  const [me, setMe] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    socket.on("me", (id) => setMe(id));

    // 📡 Listener for incoming calls
    socket.on("hey", ({ from, signal }) => {
      setIsCalling(true);
      startCall(false).then((currentStream) => {
        const peer = new Peer({ initiator: false, trickle: false, stream: currentStream });
        
        peer.on("signal", (data) => {
          socket.emit("answerCall", { signal: data, to: from });
        });

        peer.on("stream", (remoteStream) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
          setRemoteStream(remoteStream);
        });

        peer.signal(signal);
        connectionRef.current = peer;
      });
    });
  }, []);

  const startCall = async (isInitiator = true) => {
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
      alert("Access Denied. Check browser permissions.");
      throw err;
    }
  };

  // 📞 Function linked to the UserPlus (+) Button
  const callUser = (id: string) => {
    if (!stream) {
      alert("Start your camera first!");
      return;
    }
    
    const peer = new Peer({ initiator: true, trickle: false, stream: stream });

    peer.on("signal", (data) => {
      socket.emit("callUser", { 
        userToCall: id, 
        signalData: data, 
        from: me 
      });
    });

    peer.on("stream", (remoteStream) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      setRemoteStream(remoteStream);
    });

    socket.on("callAccepted", (signal) => {
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true, 
          audio: true 
        });
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        
        // Update the peer with the new screen tracks
        if (connectionRef.current) {
          connectionRef.current.replaceTrack(
            stream!.getVideoTracks()[0],
            screenStream.getVideoTracks()[0],
            stream!
          );
        }
        
        setStream(screenStream);
        setIsScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          startCall();
        };
      } catch (err) {
        console.error("Screen share failed:", err);
      }
    } else {
      setIsScreenSharing(false);
      startCall();
    }
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
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
    <div className="min-h-screen bg-black text-white flex overflow-hidden font-sans">
      <aside className="w-20 flex flex-col items-center py-10 bg-[#111] border-r border-white/5 justify-between">
         <div className="space-y-10">
            <Link href="/home" className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white">
              <ChevronLeft size={20} />
            </Link>
            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/40">
              <Radio size={20} className="animate-pulse" />
            </div>
         </div>
      </aside>

      <main className="flex-1 flex flex-col p-8 overflow-y-auto">
        <div className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 rounded-[2.5rem] p-6 border border-white/10 flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-tr from-red-600 to-orange-500 rounded-full flex items-center justify-center font-black text-xl shadow-lg">ME</div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Node Active</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-green-400">{me || "GENERATING..."}</code>
                <Copy size={14} className="opacity-40 hover:opacity-100 cursor-pointer" onClick={() => navigator.clipboard.writeText(me)} />
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-[2.5rem] p-6 border border-white/10 flex items-center gap-4">
            <input 
              placeholder="Enter Friend's ID" 
              className="flex-1 bg-white text-black border-none px-6 py-4 rounded-2xl text-xs font-black outline-none transition-all placeholder:text-black/40 shadow-inner"
              value={idToCall}
              onChange={(e) => setIdToCall(e.target.value)}
            />
            {/* 🟢 FIXED: BUTTON NOW CALLS THE FUNCTION */}
            <button 
              onClick={() => callUser(idToCall)}
              className="bg-white text-black p-4 rounded-2xl hover:bg-red-600 hover:text-white transition-all active:scale-95"
            >
              <UserPlus size={20} />
            </button>
          </div>
        </div>

        <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
             <div className="aspect-video bg-[#080808] rounded-[4rem] border border-white/10 overflow-hidden relative shadow-2xl group">
                {!isCalling ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                     <Video size={48} className="opacity-10" />
                     <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-20">Awaiting Signal</p>
                     <button onClick={() => startCall()} className="mt-4 bg-red-600 px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl shadow-red-600/20">
                        Connect 
                     </button>
                  </div>
                ) : (
                  <>
                    {/* Main Video (Shows Remote Stream if available, otherwise Local) */}
                    <video ref={remoteStream ? remoteVideoRef : localVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    
                    {/* Small Picture-in-Picture for yourself when in a call */}
                    {remoteStream && (
                      <video ref={localVideoRef} autoPlay playsInline muted className="absolute top-8 right-8 w-48 aspect-video rounded-3xl border border-white/20 shadow-2xl object-cover scale-x-[-1]" />
                    )}

                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/80 backdrop-blur-3xl p-4 rounded-[2.5rem] border border-white/20">
                       <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-2xl transition-all ${isMuted ? 'bg-red-500/20 text-red-500' : 'hover:bg-white/10'}`}>
                         {isMuted ? <MicOff /> : <Mic />}
                       </button>
                       <button onClick={toggleScreenShare} className={`p-4 rounded-2xl transition-all ${isScreenSharing ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' : 'hover:bg-white/10'}`}>
                         <MonitorUp />
                       </button>
                       <div className="w-px h-10 bg-white/10 mx-2" />
                       {!isRecording ? (
                         <button onClick={startRecording} className="p-4 hover:text-red-500"><Circle /></button>
                       ) : (
                         <button onClick={() => { mediaRecorderRef.current?.stop(); setIsRecording(false); }} className="p-4 bg-red-600 rounded-2xl animate-pulse"><StopCircle /></button>
                       )}
                       <button onClick={() => window.location.reload()} className="p-4 bg-red-600 rounded-2xl"><PhoneOff /></button>
                    </div>
                  </>
                )}
             </div>
          </div>

          <div className="lg:col-span-1 bg-white/5 rounded-[4rem] border border-white/10 p-8 flex flex-col items-center justify-center text-center">
             {recordedUrl ? (
                <div className="w-full space-y-6">
                   <div className="aspect-square bg-black rounded-[3rem] border border-white/5 overflow-hidden shadow-inner">
                      <video src={recordedUrl} autoPlay loop muted className="w-full h-full object-cover opacity-50" />
                   </div>
                   <button onClick={() => { const a = document.createElement("a"); a.href = recordedUrl; a.download=`VoIP_Rec.webm`; a.click(); }} 
                     className="w-full py-5 bg-white text-black rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-green-500 transition-all">
                      Download Recording
                   </button>
                </div>
             ) : (
                <div className="opacity-10">
                   <Download size={48} className="mx-auto mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-widest leading-loose">No active<br/>session cache</p>
                </div>
             )}
          </div>
        </div>
      </main>
    </div>
  );
}