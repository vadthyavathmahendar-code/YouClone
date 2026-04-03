"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Mic, MicOff, MonitorUp, StopCircle, PhoneOff, VideoOff, Circle, Download } from "lucide-react";
import Link from "next/link";

export default function CallPage() {
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  
  // States
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. START CALL (Get Camera & Mic)
  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setIsCalling(true);
      setRecordedUrl(null); // Clear old recordings
    } catch (err) {
      alert("Please allow Camera and Microphone permissions to enter the VoIP Node.");
    }
  };

  // 2. END CALL
  const endCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (isRecording) stopRecording();
    setIsCalling(false);
    setIsScreenSharing(false);
  };

  // 3. TOGGLE SCREEN SHARE (Task 6 Requirement)
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        
        // Keep the local mic active while sharing screen
        if (streamRef.current) {
          const audioTrack = streamRef.current.getAudioTracks()[0];
          if (audioTrack) screenStream.addTrack(audioTrack);
        }

        streamRef.current = screenStream;
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        setIsScreenSharing(true);

        // Listen for the user clicking "Stop sharing" on the browser's native popup
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          startCall(); // Revert to webcam
        };
      } catch (err) {
        console.error("Screen share denied");
      }
    } else {
      setIsScreenSharing(false);
      startCall(); // Revert to webcam
    }
  };

  // 4. START RECORDING (Task 6 Requirement)
  const startRecording = () => {
    if (!streamRef.current) return;
    
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  // 5. STOP RECORDING
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 6. DOWNLOAD RECORDING
  const downloadRecording = () => {
    if (!recordedUrl) return;
    const a = document.createElement("a");
    a.href = recordedUrl;
    a.download = `YouClone_VoIP_Session_${new Date().getTime()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 selection:bg-red-600">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
          <Link href="/home" className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-all">
            ← Return to Feed
          </Link>
          <div className="flex items-center gap-3">
            {isRecording && (
              <span className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20">
                <Circle size={10} fill="currentColor" /> Session Recording
              </span>
            )}
            <div className="text-[10px] font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl">
              Node: <span className="text-green-500">Secure VoIP Cluster</span>
            </div>
          </div>
        </div>

        {/* MAIN STAGE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* VIDEO CONTAINER */}
          <div className="lg:col-span-2">
            <div className="aspect-video bg-[#111] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl relative flex items-center justify-center">
              
              {!isCalling ? (
                <div className="text-center">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Video size={40} className="opacity-40" />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Encrypted Channel</h2>
                  <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Awaiting connection...</p>
                </div>
              ) : (
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted // Muted so you don't hear your own echo
                  className={`w-full h-full object-cover ${isScreenSharing ? '' : 'scale-x-[-1]'}`} // Mirror webcam, but not screen share
                />
              )}

              {/* OVERLAY TAG */}
              {isCalling && (
                <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">
                  {isScreenSharing ? "Broadcast Mode" : "Local Camera"}
                </div>
              )}
            </div>

            {/* CONTROLS BAR */}
            <div className="mt-8 bg-[#111] border border-white/5 p-6 rounded-[2rem] flex flex-wrap justify-center items-center gap-4 shadow-xl">
              {!isCalling ? (
                <button onClick={startCall} className="bg-green-600 hover:bg-green-500 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-green-600/20">
                  Initialize Link
                </button>
              ) : (
                <>
                  <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-2xl transition-all ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                  </button>
                  <button onClick={() => setIsVideoOff(!isVideoOff)} className={`p-4 rounded-2xl transition-all ${isVideoOff ? 'bg-red-500/20 text-red-500' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                    {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                  </button>
                  <button onClick={toggleScreenShare} className={`p-4 rounded-2xl transition-all ${isScreenSharing ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                    <MonitorUp size={24} />
                  </button>
                  
                  <div className="w-px h-10 bg-white/10 mx-2"></div>

                  {!isRecording ? (
                    <button onClick={startRecording} className="flex items-center gap-2 p-4 rounded-2xl transition-all bg-white/10 hover:bg-red-500/20 hover:text-red-500 text-white">
                      <Circle size={20} /> <span className="text-xs font-black uppercase tracking-widest hidden sm:block">Record</span>
                    </button>
                  ) : (
                    <button onClick={stopRecording} className="flex items-center gap-2 p-4 rounded-2xl transition-all bg-red-600 text-white shadow-lg shadow-red-600/20">
                      <StopCircle size={20} /> <span className="text-xs font-black uppercase tracking-widest hidden sm:block">Stop</span>
                    </button>
                  )}

                  <div className="w-px h-10 bg-white/10 mx-2"></div>

                  <button onClick={endCall} className="bg-red-600 hover:bg-red-500 text-white p-4 px-8 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-red-600/20">
                    <PhoneOff size={24} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* SIDEBAR / RECORDING BIN */}
          <div className="lg:col-span-1">
            <div className="bg-[#111] border border-white/5 p-8 rounded-[3rem] h-full shadow-inner">
              <h3 className="text-xl font-black uppercase tracking-tighter mb-8 border-b border-white/5 pb-4">Session Logs</h3>
              
              {recordedUrl ? (
                <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] text-center">
                  <div className="w-16 h-16 bg-blue-600/20 border border-blue-600/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-500">
                    <Video size={24} />
                  </div>
                  <h4 className="font-bold text-sm mb-2">Recording Finalized</h4>
                  <p className="text-[10px] opacity-40 font-black uppercase tracking-widest mb-6">Ready for local offline storage</p>
                  
                  <button onClick={downloadRecording} className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-blue-500 transition-colors">
                    <Download size={16} /> Save File
                  </button>
                </div>
              ) : (
                <div className="text-center opacity-30 mt-20">
                  <StopCircle size={40} className="mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No recordings in buffer</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}