"use client";
import { API_URL } from '../config';
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, MapPin, Phone, Loader2, ShieldCheck, ChevronDown } from "lucide-react";

const SOUTH_INDIA_STATES = ['Andhra Pradesh', 'Karnataka', 'Kerala', 'Tamil Nadu', 'Telangana'];

const ALL_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry'
];

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", location: "", state: "", phone: ""
  });

  const isSouthIndia = SOUTH_INDIA_STATES.includes(formData.state);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.state) return alert("Please select your state");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error("Server error. Check backend logs.");
      }

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("pendingEmail", formData.email);
        localStorage.setItem("userLocation", formData.location);
        localStorage.setItem("userState", formData.state);
        router.push("/verify-otp");
      } else {
        alert(data.message || data.error || "Signup failed");
      }
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 md:p-10 text-white selection:bg-red-600">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-red-600 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-lg bg-[#111]/80 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 rounded-3xl bg-red-600/10 border border-red-600/20 mb-6">
            <ShieldCheck className="text-red-600" size={32} />
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-2 italic">Create Account</h2>
          <p className="text-[10px] font-black uppercase opacity-40 tracking-[0.3em]">Authorized Personnel Only</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Name */}
          <div className="relative group">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-red-600 transition-colors" size={18} />
            <input
              type="text" required placeholder="Full Name"
              className="w-full bg-black/40 border border-white/5 rounded-2xl pl-14 pr-6 py-4 focus:outline-none focus:border-red-600 transition-all font-medium text-sm"
              value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Email */}
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-red-600 transition-colors" size={18} />
            <input
              type="email" required placeholder="Email"
              className="w-full bg-black/40 border border-white/5 rounded-2xl pl-14 pr-6 py-4 focus:outline-none focus:border-red-600 transition-all font-medium text-sm"
              value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* Password */}
          <div className="relative group">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-red-600 transition-colors" size={18} />
            <input
              type="password" required placeholder="Password"
              className="w-full bg-black/40 border border-white/5 rounded-2xl pl-14 pr-6 py-4 focus:outline-none focus:border-red-600 transition-all font-medium text-sm"
              value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {/* State dropdown — determines OTP type */}
          <div className="relative group">
            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-red-600 transition-colors z-10" size={18} />
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
            <select
              required
              className="w-full bg-black/40 border border-white/5 rounded-2xl pl-14 pr-12 py-4 focus:outline-none focus:border-red-600 transition-all font-medium text-sm appearance-none text-white"
              value={formData.state}
              onChange={e => setFormData({ ...formData, state: e.target.value })}
            >
              <option value="" disabled className="bg-[#111]">Select State</option>
              {ALL_STATES.map(s => (
                <option key={s} value={s} className="bg-[#111]">{s}</option>
              ))}
            </select>
            {/* OTP type indicator */}
            {formData.state && (
              <div className={`absolute -bottom-5 left-0 text-[10px] font-bold ${isSouthIndia ? 'text-green-400' : 'text-blue-400'}`}>
                {isSouthIndia ? '📧 Email OTP will be sent' : '📱 SMS OTP will be sent'}
              </div>
            )}
          </div>

          {/* City + Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="relative group">
              <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-red-600 transition-colors" size={18} />
              <input
                type="text" required placeholder="City"
                className="w-full bg-black/40 border border-white/5 rounded-2xl pl-14 pr-6 py-4 focus:outline-none focus:border-red-600 transition-all font-medium text-sm"
                value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="relative group">
              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-red-600 transition-colors" size={18} />
              <input
                type="text" required placeholder="Phone (+91...)"
                className="w-full bg-black/40 border border-white/5 rounded-2xl pl-14 pr-6 py-4 focus:outline-none focus:border-red-600 transition-all font-medium text-sm"
                value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] text-xs hover:bg-red-600 hover:text-white transition-all duration-500 mt-6 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Create Account"}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-white/5 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-30">
            Already registered?{' '}
            <Link href="/login" className="text-white hover:text-red-600 transition-colors underline decoration-red-600/30 underline-offset-4 ml-1">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
