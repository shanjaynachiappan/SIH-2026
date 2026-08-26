import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Hexagon, ArrowRight, ShieldCheck } from 'lucide-react';

export const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@mineguard.com');
  const [password, setPassword] = useState('MineGuard@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (email === 'admin@mineguard.com' && password === 'MineGuard@123') {
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/');
    } else {
      setError('Invalid credentials. Hint: admin@mineguard.com / MineGuard@123');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden font-sans bg-slate-50">

      {/* Main Auth Container */}
      <div className="relative z-10 w-full max-w-[1000px] flex flex-col md:flex-row items-center bg-[#F9F8F6] border border-[#E5E0D8] rounded-[2.5rem] shadow-2xl overflow-hidden m-4 md:m-8">
        
        {/* Left Informational Side */}
        <div className="w-full md:w-5/12 p-8 md:p-12 lg:p-16 flex flex-col justify-between h-full bg-gradient-to-b from-[#2A3324] to-[#1C2118] relative overflow-hidden">
          {/* Subtle topography/grid pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-12">
              <div className="bg-gradient-to-tr from-emerald-600 to-emerald-400 p-2.5 rounded-xl shadow-lg">
                <Hexagon className="w-8 h-8 text-white fill-white/20" />
              </div>
              <span className="text-2xl font-black text-[#F4F1EA] tracking-tight">MineGuard</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
              Advanced <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-200">Subsidence</span> <br/>
              Monitoring.
            </h2>
            <p className="text-[#B8C2B2] font-medium leading-relaxed max-w-sm">
              AI-driven insights and real-time IoT mesh networks keeping your underground operations secure.
            </p>
          </div>

          <div className="mt-12 relative z-10">
            <div className="flex items-center space-x-3 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <ShieldCheck className="w-10 h-10 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-[#F4F1EA] text-sm font-bold">Enterprise Security</p>
                <p className="text-[#96A08F] text-xs">End-to-end encrypted datastream</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Side */}
        <div className="w-full md:w-7/12 p-8 md:p-12 lg:p-16 bg-[#F9F8F6] flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-10 text-center md:text-left">
              <h3 className="text-3xl font-extrabold text-[#2C2922] mb-2">Welcome Back</h3>
              <p className="text-[#736B5E] font-medium">Please enter your details to sign in.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Animated Floating Label Input for Email */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#9E9584] group-focus-within:text-emerald-700 transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-white border-2 border-[#E5E0D8] rounded-2xl text-sm font-semibold text-[#2C2922] focus:outline-none focus:border-emerald-700 focus:bg-white transition-all peer placeholder-transparent"
                  placeholder="Email Address"
                />
                <label 
                  htmlFor="email" 
                  className="absolute left-12 -top-2.5 bg-white px-2 text-xs font-bold text-[#736B5E] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-[#9E9584] peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-emerald-700 peer-focus:bg-white rounded"
                >
                  Email Address
                </label>
              </div>

              {/* Animated Floating Label Input for Password */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#9E9584] group-focus-within:text-emerald-700 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-12 py-4 bg-white border-2 border-[#E5E0D8] rounded-2xl text-sm font-semibold text-[#2C2922] focus:outline-none focus:border-emerald-700 focus:bg-white transition-all peer placeholder-transparent"
                  placeholder="Password"
                />
                <label 
                  htmlFor="password" 
                  className="absolute left-12 -top-2.5 bg-white px-2 text-xs font-bold text-[#736B5E] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-[#9E9584] peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-emerald-700 peer-focus:bg-white rounded"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#9E9584] hover:text-[#5E584D] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-sm font-semibold rounded-xl animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 rounded border-2 border-[#D1CABF] group-hover:border-emerald-600 transition-colors bg-white">
                    <input type="checkbox" className="peer sr-only" />
                    <div className="absolute inset-0 bg-emerald-700 rounded scale-0 peer-checked:scale-100 transition-transform flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  </div>
                  <span className="ml-3 text-sm font-bold text-[#736B5E] group-hover:text-[#2C2922] transition-colors">Remember me</span>
                </label>
                <button type="button" className="text-sm font-bold text-emerald-700 hover:text-emerald-900 transition-colors">
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full relative group overflow-hidden rounded-2xl p-[2px]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-700 rounded-2xl opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center justify-center px-8 py-4 bg-[#2A3324] rounded-[14px] transition-all duration-300 group-hover:bg-opacity-0">
                  <span className="text-sm font-bold text-[#F4F1EA] tracking-wide">SIGN IN TO SECURE PORTAL</span>
                  <ArrowRight className="ml-2 w-5 h-5 text-[#F4F1EA] transform group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-[#E5E0D8] text-center">
              <p className="text-sm text-[#736B5E] font-medium">
                Need to request access? <button className="text-emerald-700 font-bold hover:underline">Contact Administrator</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
