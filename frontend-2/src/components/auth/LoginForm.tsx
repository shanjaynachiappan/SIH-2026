import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { SocialLogin } from './SocialLogin';
import { SecurityCard } from './SecurityCard';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    // Mock login logic
    if (email === 'admin@mineguard.com' && password === 'MineGuard@123') {
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/overview');
    } else {
      setError('Invalid email or password. Hint: admin@mineguard.com / MineGuard@123');
    }
  };

  return (
    <div className="w-full max-w-md mt-8">
      <h2 className="text-3xl font-bold text-[#14213D] mb-2 flex items-center">
        Welcome Back! <span className="ml-2">👋</span>
      </h2>
      <p className="text-slate-500 font-medium mb-8">
        Sign in to continue to your monitoring dashboard
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-bold text-[#14213D] mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0] text-sm text-slate-800 font-medium transition-all"
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-bold text-[#14213D] mb-1.5">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-11 pr-12 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0] text-sm text-slate-800 font-medium transition-all"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm font-medium text-red-500">{error}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 text-[#1769E0] focus:ring-[#1769E0] border-slate-300 rounded cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 font-medium cursor-pointer">
              Remember me
            </label>
          </div>
          <button type="button" className="text-sm font-bold text-[#1769E0] hover:text-blue-800 transition-colors">
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#1769E0] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1769E0] transition-colors mt-6"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Sign In
        </button>
      </form>

      <SocialLogin />
      <SecurityCard />
    </div>
  );
};
