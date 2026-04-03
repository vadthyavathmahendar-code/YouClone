"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", location: "" });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userPlan", data.user.plan); // Will be 'Free'
        localStorage.setItem("userName", data.user.name);
        router.push("/home");
      } else {
        alert(data.error || "Signup failed");
      }
    } catch (err) {
      alert("System Error. Check Backend Connection.");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white">
      <div className="w-full max-w-md bg-[#111] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Register Here</h2>
          <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Join the YouClone Network</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <input 
            type="text" required placeholder="Full Name"
            className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-600 transition-colors font-medium text-sm"
            value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <input 
            type="email" required placeholder="Email Address"
            className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-600 transition-colors font-medium text-sm"
            value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <input 
            type="password" required placeholder="Secure Passcode"
            className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-600 transition-colors font-medium text-sm"
            value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
          {/* Location is crucial for Task 4 regional logic later */}
          <input 
            type="text" required placeholder="City / Location (e.g., Secunderabad)"
            className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-600 transition-colors font-medium text-sm"
            value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})}
          />

          <button type="submit" className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-colors mt-6">
            Create Account
          </button>
        </form>

        <p className="text-center text-xs font-bold opacity-40 mt-8">
          Already registered? <Link href="/login" className="text-white hover:text-red-500 transition-colors">Login here.</Link>
        </p>
      </div>
    </div>
  );
}