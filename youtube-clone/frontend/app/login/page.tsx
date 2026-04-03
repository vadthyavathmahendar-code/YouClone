"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Mail, Smartphone, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  
  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  
  // Flow States
  const [step, setStep] = useState<1 | 2>(1);
  const [authType, setAuthType] = useState<"email" | "mobile" | null>(null);
  const [loading, setLoading] = useState(false);

  // STEP 1: Verify Credentials & Trigger OTP
  const handleInitialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Backend accepted password, now asks for OTP
        setAuthType(data.authType); // "email" (South India) or "mobile" (Other)
        setStep(2);
      } else {
        alert(data.message || "Access Denied.");
      }
    } catch (err) {
      alert("System Error. Check Backend Connection.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP & Enter Node
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.ok) {
        // Full Authentication Complete
        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userPlan", data.user.plan);
        localStorage.setItem("userName", data.user.name);
        
        // Push to the Walled Garden
        router.push("/home");
      } else {
        alert(data.message || "Invalid OTP.");
      }
    } catch (err) {
      alert("Verification Error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white selection:bg-red-600">
      <div className="w-full max-w-md bg-[#111] p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
        
        {/* Background Glow */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-red-600/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="text-center mb-10 relative z-10">
          <div className="w-16 h-16 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="text-red-500" size={28} />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Login Here</h2>
          <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">
            {step === 1 ? "Authorized Personnel Only" : "Two-Factor Verification"}
          </p>
        </div>

        <div className="relative z-10">
          <AnimatePresence mode="wait">
            
            {/* --- STEP 1: EMAIL & PASSWORD --- */}
            {step === 1 && (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                onSubmit={handleInitialLogin} 
                className="space-y-6"
              >
                <div>
                  <input 
                    type="email" required placeholder="Email"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-600 transition-colors font-medium text-sm"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <input 
                    type="password" required placeholder="Password"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-600 transition-colors font-medium text-sm"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button disabled={loading} type="submit" className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-500 transition-colors mt-4 flex justify-center items-center gap-2 disabled:opacity-50">
                  {loading ? "Verifying..." : "Continue"} <ArrowRight size={16} />
                </button>
              </motion.form>
            )}

            {/* --- STEP 2: OTP VERIFICATION --- */}
            {step === 2 && (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                onSubmit={handleVerifyOTP} 
                className="space-y-6"
              >
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-start gap-4 mb-6">
                  {authType === 'email' ? <Mail className="text-red-500 mt-1" size={20}/> : <Smartphone className="text-red-500 mt-1" size={20}/>}
                  <div>
                    <p className="text-xs font-bold">Action Required</p>
                    <p className="text-[10px] opacity-60 mt-1 leading-relaxed">
                      Based on your region, an OTP has been dispatched to your registered {authType === 'email' ? 'email address' : 'mobile device'}.
                    </p>
                  </div>
                </div>

                <div>
                  <input 
                    type="text" required placeholder="Enter 6-Digit OTP" maxLength={6}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-600 transition-colors font-black text-center tracking-[0.5em] text-lg"
                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Only allows numbers
                  />
                </div>

                <button disabled={loading} type="submit" className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-green-500 transition-colors mt-4 flex justify-center items-center gap-2 disabled:opacity-50">
                  {loading ? "Authenticating..." : "Verify & Enter Node"} <CheckCircle2 size={16} />
                </button>
                
                <button type="button" onClick={() => setStep(1)} className="w-full text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity mt-4">
                  Cancel Verification
                </button>
              </motion.form>
            )}

          </AnimatePresence>
        </div>

        {step === 1 && (
          <p className="text-center text-xs font-bold opacity-40 mt-8 relative z-10">
            don't have an account? <Link href="/signup" className="text-red-500 hover:text-white transition-colors">create account.</Link>
          </p>
        )}
      </div>
    </div>
  );
}