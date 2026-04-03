"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Zap, Crown, ShieldCheck, Star } from 'lucide-react';

export default function UpgradePage() {
  const [loading, setLoading] = useState("");
  const router = useRouter();

  const plans = [
    { 
      name: 'Bronze', 
      price: 10, 
      color: 'from-orange-600 to-orange-900', 
      icon: <Zap className="text-orange-400" />,
      features: ['7 Mins Watching', '1 Download/Day', 'Email Invoices'] 
    },
    { 
      name: 'Silver', 
      price: 50, 
      color: 'from-slate-400 to-slate-700', 
      icon: <Star className="text-slate-200" />,
      features: ['10 Mins Watching', '5 Downloads/Day', 'Standard Support', 'Ad-Free Experience'] 
    },
    { 
      name: 'Gold', 
      price: 100, 
      color: 'from-yellow-400 to-yellow-700', 
      icon: <Crown className="text-yellow-300" />,
      features: ['Unlimited Watching', 'Unlimited Downloads', 'Priority Video Calling', '4K Streaming Support'],
      popular: true
    },
  ];

  const handleUpgrade = async (planName: string, price: number) => {
    const email = localStorage.getItem('userEmail');
    if (!email) {
        alert("Please login first");
        router.push('/login');
        return;
    }
    setLoading(planName);

    try {
      // 1. Create Order
      const orderRes = await fetch('http://localhost:5000/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: price })
      });
      
      if (!orderRes.ok) throw new Error("Order creation failed");
      const order = await orderRes.json();

      // 2. Razorpay Options
      const options = {
        key: "rzp_test_SZ6Ai2mniklQfK", 
        amount: order.amount,
        currency: "INR",
        name: "YouClone Premium",
        description: `Upgrading to ${planName} Plan`,
        order_id: order.id,
        handler: async (response: any) => {
          const verifyRes = await fetch('http://localhost:5000/api/payments/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, email, newPlan: planName, price })
          });

          if (verifyRes.ok) {
            alert(`🚀 Welcome to the ${planName} Tier!`);
            localStorage.setItem('userPlan', planName);
            router.push('/home');
          }
        },
        theme: { color: "#E11D48" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Payment initiation failed. Check if Backend is running.");
    } finally {
      setLoading("");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white py-20 px-6 flex flex-col items-center justify-center font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-red-600/10 blur-[120px] rounded-full -z-10"></div>
      
      <div className="text-center mb-16">
        <h1 className="text-6xl md:text-7xl font-black tracking-tighter uppercase mb-4 italic">
          Choose Your <span className="text-red-600">Power</span>
        </h1>
        <p className="text-white/40 font-medium tracking-[0.3em] text-xs uppercase">
          Secunderabad Node • High Speed Access Control
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {plans.map((p) => (
          <div key={p.name} className={`relative group p-[1px] rounded-[2.5rem] transition-all duration-500 hover:scale-[1.02] ${p.popular ? 'bg-gradient-to-b from-yellow-400 to-transparent scale-105' : 'bg-white/10 hover:bg-white/20'}`}>
            <div className="bg-[#0f0f0f] rounded-[2.5rem] p-10 h-full flex flex-col items-center">
              {p.popular && (
                <span className="absolute -top-4 bg-yellow-500 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                  Most Popular
                </span>
              )}
              
              <div className="mb-6 p-4 bg-white/5 rounded-2xl">
                {p.icon}
              </div>

              <h2 className="text-3xl font-black mb-2 uppercase italic tracking-tighter">{p.name}</h2>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black">₹{p.price}</span>
                <span className="text-white/30 text-sm">/month</span>
              </div>

              <ul className="w-full space-y-4 mb-10">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/70 font-medium">
                    <Check size={16} className="text-red-500" /> {f}
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handleUpgrade(p.name, p.price)}
                className={`mt-auto w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-2xl flex items-center justify-center gap-2
                  ${p.name === 'Gold' ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-red-600 text-white hover:bg-red-500'}
                  ${loading === p.name ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading === p.name ? (
                   <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : `Activate ${p.name}`}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 flex items-center gap-2 text-white/20 text-[10px] font-black uppercase tracking-[0.5em]">
        <ShieldCheck size={14} /> Secured by Razorpay & YouClone Security
      </div>
    </div>
  );
}