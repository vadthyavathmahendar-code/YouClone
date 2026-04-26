"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "../config";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Get the email we saved during signup/login
    const pendingEmail = localStorage.getItem("pendingEmail");
    if (!pendingEmail) {
      router.push("/login");
    } else {
      setEmail(pendingEmail);
    }
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.ok) {
        // 🔥 THE FIX: Now we set the REAL email and token
        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("userPlan", data.user.plan);
        
        // Remove the temporary pending email
        localStorage.removeItem("pendingEmail");

        alert("✅ Authorization Successful. Entering Secunderabad Node.");
        router.push("/home");
      } else {
        alert(data.error || "Invalid OTP");
      }
    } catch (err) {
      alert("System Error during verification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-md bg-[#111] p-10 rounded-[2.5rem] border border-white/5 text-center">
        <div className="inline-flex p-4 rounded-3xl bg-red-600/10 mb-6">
          <ShieldCheck className="text-red-600" size={32} />
        </div>
        <h2 className="text-3xl font-black uppercase italic mb-2">Verify Node</h2>
        <p className="text-[10px] opacity-50 uppercase tracking-widest mb-8">Code sent to: {email}</p>

        <form onSubmit={handleVerify} className="space-y-6">
          <input 
            type="text" 
            maxLength={6}
            placeholder="000000"
            className="w-full bg-black border border-white/10 rounded-2xl py-4 text-center text-2xl font-black tracking-[0.5em] focus:border-red-600 outline-none transition-all"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={loading || otp.length < 6}
            className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Authorize Access"}
          </button>
        </form>
      </div>
    </div>
  );
}