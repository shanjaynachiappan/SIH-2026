import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon, ArrowRight, ShieldCheck, Activity, Cpu } from 'lucide-react';

const ReactiveBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: { x: number; y: number; vx: number; vy: number; radius: number }[] = [];
    let animationFrameId: number;
    
    const mouse = { x: -1000, y: -1000, radius: 150 };

    const initParticles = () => {
      particles = [];
      // Adjust density based on screen size
      const numParticles = Math.floor((canvas.width * canvas.height) / 12000);
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          radius: Math.random() * 1.5 + 0.5
        });
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Draw particle
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(52, 211, 153, 0.8)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 1.5, 0, Math.PI * 2); // Slightly larger particles
        ctx.fillStyle = 'rgba(52, 211, 153, 0.9)';
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow for lines to avoid performance hit

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) { // Slightly longer connection range
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(52, 211, 153, ${0.35 - dist / 130 * 0.35})`; // Brighter lines
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }

        // Connect to mouse
        const dxMouse = p.x - mouse.x;
        const dyMouse = p.y - mouse.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        if (distMouse < mouse.radius) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(52, 211, 153, ${0.7 - distMouse / mouse.radius * 0.7})`; // Much brighter mouse connection
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Slight attraction to cursor
          p.x -= dxMouse * 0.03;
          p.y -= dyMouse * 0.03;
        }
      }
      
      animationFrameId = requestAnimationFrame(draw);
    };

    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-90" />;
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2A3324] to-[#1C2118] relative overflow-hidden font-sans flex flex-col">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .stagger-1 { animation-delay: 100ms; }
        .stagger-2 { animation-delay: 200ms; }
        .stagger-3 { animation-delay: 300ms; }
        .stagger-4 { animation-delay: 400ms; }
        .stagger-5 { animation-delay: 500ms; }
        .stagger-6 { animation-delay: 600ms; }
      `}</style>

      {/* Reactive Mesh Background */}
      <ReactiveBackground />

      {/* Ambient background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }}></div>

      {/* Subtle topography/grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '24px 24px' }}
      ></div>

      {/* Navigation */}
      <nav className={`relative z-10 w-full px-6 py-6 md:px-12 lg:px-24 flex items-center justify-between opacity-0 ${isVisible ? 'animate-fade-in-up' : ''}`}>
        <div className="flex items-center space-x-3 group cursor-pointer">
          <div className="bg-gradient-to-tr from-emerald-600 to-emerald-400 p-2 rounded-xl shadow-lg transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
            <Hexagon className="w-6 h-6 text-white fill-white/20" />
          </div>
          <span className="text-xl font-black text-[#F4F1EA] tracking-tight">MineGuard</span>
        </div>
        
        <button 
          onClick={() => navigate('/login')}
          className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-[#F4F1EA] font-bold text-sm rounded-xl backdrop-blur-sm border border-white/10 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:-translate-y-0.5"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-grow flex flex-col justify-center items-center px-6 text-center max-w-5xl mx-auto py-12 md:py-24">
        
        <div className={`opacity-0 ${isVisible ? 'animate-fade-in-up stagger-1' : ''} inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-8 hover:bg-emerald-500/20 transition-colors cursor-default`}>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-emerald-400 text-xs font-bold tracking-wide uppercase">System Operational</span>
        </div>

        <h1 className={`opacity-0 ${isVisible ? 'animate-fade-in-up stagger-2' : ''} text-5xl md:text-7xl font-bold text-white mb-8 leading-tight tracking-tight`}>
          Advanced <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-200 animate-float inline-block">Subsidence</span> Monitoring.
        </h1>
        
        <p className={`opacity-0 ${isVisible ? 'animate-fade-in-up stagger-3' : ''} text-[#B8C2B2] text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto mb-12`}>
          AI-driven insights and real-time IoT mesh networks keeping your underground operations secure. Predict, detect, and prevent hazards before they occur.
        </p>

        <div className={`opacity-0 ${isVisible ? 'animate-fade-in-up stagger-4' : ''}`}>
          <button
            onClick={() => navigate('/login')}
            className="relative group overflow-hidden rounded-2xl p-[2px] transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-2xl opacity-100 group-hover:opacity-80 transition-opacity duration-300 shadow-[0_0_40px_rgba(16,185,129,0.4)] group-hover:shadow-[0_0_60px_rgba(16,185,129,0.6)] animate-pulse" style={{ animationDuration: '3s' }} />
            <div className="relative flex items-center justify-center px-10 py-5 bg-[#2A3324] rounded-[14px] transition-all duration-300 group-hover:bg-opacity-0">
              <span className="text-base font-bold text-[#F4F1EA] tracking-wide">ENTER SECURE PORTAL</span>
              <ArrowRight className="ml-3 w-5 h-5 text-[#F4F1EA] transform group-hover:translate-x-2 transition-transform" />
            </div>
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full">
          <div className={`opacity-0 ${isVisible ? 'animate-fade-in-up stagger-4' : ''} group flex flex-col items-center p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm transition-all duration-500 hover:bg-white/10 hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)] hover:border-emerald-500/30`}>
            <div className="p-4 bg-white/5 rounded-2xl mb-6 group-hover:scale-110 group-hover:bg-emerald-500/10 transition-all duration-500">
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-[#F4F1EA] text-lg font-bold mb-3">Enterprise Security</h3>
            <p className="text-[#96A08F] text-sm leading-relaxed">End-to-end encrypted datastream ensuring your operational data remains strictly confidential.</p>
          </div>
          
          <div className={`opacity-0 ${isVisible ? 'animate-fade-in-up stagger-5' : ''} group flex flex-col items-center p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm transition-all duration-500 hover:bg-white/10 hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(251,191,36,0.2)] hover:border-amber-500/30`}>
            <div className="p-4 bg-white/5 rounded-2xl mb-6 group-hover:scale-110 group-hover:bg-amber-500/10 transition-all duration-500">
              <Activity className="w-10 h-10 text-amber-300" />
            </div>
            <h3 className="text-[#F4F1EA] text-lg font-bold mb-3">Real-time Analytics</h3>
            <p className="text-[#96A08F] text-sm leading-relaxed">Continuous processing of IDW spatial data providing immediate alerts on deformation events.</p>
          </div>

          <div className={`opacity-0 ${isVisible ? 'animate-fade-in-up stagger-6' : ''} group flex flex-col items-center p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm transition-all duration-500 hover:bg-white/10 hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)] hover:border-emerald-500/30`}>
            <div className="p-4 bg-white/5 rounded-2xl mb-6 group-hover:scale-110 group-hover:bg-emerald-500/10 transition-all duration-500">
              <Cpu className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-[#F4F1EA] text-lg font-bold mb-3">AI Predictions</h3>
            <p className="text-[#96A08F] text-sm leading-relaxed">Machine learning models anticipating risk zones based on historical and real-time sensory input.</p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 text-center opacity-70 hover:opacity-100 transition-opacity">
        <p className="text-[#96A08F] text-sm font-medium">© {new Date().getFullYear()} MineGuard Technologies. All rights reserved.</p>
      </footer>
    </div>
  );
};
