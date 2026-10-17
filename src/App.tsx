import React, { useState, useEffect, useRef, useCallback } from 'react';
import { JeskoHeader } from './components/JeskoHeader';
import { JeskoHeroScene } from './components/JeskoHeroScene';
import { BetterWayToFly } from './components/BetterWayToFly';
import { ControlOverlay, CameraMode } from './components/ControlOverlay';
import { BookingModal } from './components/BookingModal';
import { jetAudio } from './utils/audioAmbiance';
import { ShieldCheck, Wind, Clock, Award, ArrowUpRight } from 'lucide-react';

export default function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [cameraMode, setCameraMode] = useState<CameraMode>('story');
  const [activeColorHex, setActiveColorHex] = useState(0xded6c7); // Champagne Platinum
  const [audioActive, setAudioActive] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const runwayRef = useRef<HTMLDivElement>(null);

  // Synchronize window scroll position with normalized progress [0, 1]
  const handleScroll = useCallback(() => {
    if (!runwayRef.current) return;
    const rect = runwayRef.current.getBoundingClientRect();
    const totalScrollable = rect.height - window.innerHeight;
    if (totalScrollable <= 0) return;

    const current = -rect.top;
    const p = Math.max(0, Math.min(1, current / totalScrollable));
    setScrollProgress(p);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Jump to specific story milestone
  const handleSeekProgress = (targetProgress: number) => {
    setScrollProgress(targetProgress);
    if (!runwayRef.current) return;
    const rect = runwayRef.current.getBoundingClientRect();
    const runwayTop = window.scrollY + rect.top;
    const totalScrollable = rect.height - window.innerHeight;

    if (targetProgress >= 0.9) {
      document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      const targetScrollY = runwayTop + targetProgress * totalScrollable;
      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth',
      });
    }
  };

  const handleReset = () => {
    handleSeekProgress(0);
  };

  const handleToggleAudio = () => {
    const active = jetAudio.toggle();
    setAudioActive(active);
  };

  const handleNavClick = (section: string) => {
    if (section === 'about') {
      handleSeekProgress(0);
    } else if (section === 'fleet' || section === 'advantages') {
      handleSeekProgress(0.42);
    } else if (section === 'global') {
      handleSeekProgress(0.95);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#dfd8cc] text-[#121417]">
      {/* Jesko Jets Top Navigation */}
      <JeskoHeader onNavClick={handleNavClick} />

      {/* Long Scroll Runway that controls the 3D Cinematic Story Timeline */}
      <div ref={runwayRef} className="relative h-[480vh]">
        {/* Sticky 3D Experience Viewport pinned across the entire runway */}
        <div className="sticky top-0 left-0 w-full h-screen overflow-hidden">
          <JeskoHeroScene
            progress={scrollProgress}
            onProgressChange={setScrollProgress}
            onOpenBooking={() => setIsBookingOpen(true)}
            cameraMode={cameraMode}
            activeColorHex={activeColorHex}
          />
        </div>
      </div>

      {/* Frame 00:25 - 00:30: "A BETTER WAY TO FLY" Section */}
      <div id="services-section" className="relative z-20 bg-[#dfd8cc] border-t border-[#cebeaf]/60">
        <BetterWayToFly />
      </div>

      {/* Fleet & Global Charter Advantages Section */}
      <section className="relative z-20 bg-[#ece7dd] py-20 px-6 sm:px-14 border-t border-[#cebeaf]/60">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-[#cebeaf]/60 pb-8">
            <div>
              <p className="text-[10px] font-mono tracking-widest text-[#666] uppercase mb-2">
                Aviation Excellence
              </p>
              <h3 className="font-serif text-4xl sm:text-5xl font-bold text-[#141920]">
                Gulfstream Fleet Precision
              </h3>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => setIsBookingOpen(true)}
                className="px-6 py-3 rounded-full bg-[#141920] text-white text-xs font-mono uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Charter This Aircraft</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#f5f1eb] border border-[#ded5c7]">
              <div className="w-10 h-10 rounded-xl bg-[#1b222c] text-white flex items-center justify-center mb-4">
                <Wind className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-xl font-bold text-[#141920] mb-2">Aerodynamic Mastery</h4>
              <p className="text-xs text-[#555] leading-relaxed">
                Clean-sheet wing contouring reduces parasitic drag, enabling continuous Mach 0.925 cruise velocity.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#f5f1eb] border border-[#ded5c7]">
              <div className="w-10 h-10 rounded-xl bg-[#1b222c] text-white flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-xl font-bold text-[#141920] mb-2">100% Fresh Air</h4>
              <p className="text-xs text-[#555] leading-relaxed">
                Cabin air replenishment every two minutes combined with the lowest cabin altitude in business aviation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#f5f1eb] border border-[#ded5c7]">
              <div className="w-10 h-10 rounded-xl bg-[#1b222c] text-white flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-xl font-bold text-[#141920] mb-2">Supreme Safety</h4>
              <p className="text-xs text-[#555] leading-relaxed">
                Enhanced Flight Vision System (EFVS) and Synthetic Vision-Primary Flight Display (SV-PFD).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#f5f1eb] border border-[#ded5c7]">
              <div className="w-10 h-10 rounded-xl bg-[#1b222c] text-white flex items-center justify-center mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-xl font-bold text-[#141920] mb-2">Michelin Dining</h4>
              <p className="text-xs text-[#555] leading-relaxed">
                Dedicated convection ovens, crystal glassware service, and custom menus crafted by bespoke private chefs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 bg-[#141920] text-white/80 py-12 px-6 sm:px-14 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-white/10 pb-8">
          <div className="font-serif text-2xl font-bold text-white tracking-wide">
            Jesko Jets
          </div>
          <div className="flex gap-8 text-[11px] text-white/60">
            <span>DUBAI</span>
            <span>LONDON</span>
            <span>NEW YORK</span>
            <span>GENEVA</span>
            <span>SINGAPORE</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between pt-6 text-[10px] text-white/40">
          <div>© {new Date().getFullYear()} Jesko Jets Limited. All rights reserved. High-fidelity cinematic aircraft clone.</div>
          <div className="mt-2 sm:mt-0">Gulfstream G650ER · Rolls-Royce BR725 Powered</div>
        </div>
      </footer>

      {/* Collapsible Bottom Control Dock (Ergonomic per Three.js constitution) */}
      <ControlOverlay
        currentProgress={scrollProgress}
        onSeekProgress={handleSeekProgress}
        cameraMode={cameraMode}
        onToggleCameraMode={(m) => setCameraMode(m)}
        audioActive={audioActive}
        onToggleAudio={handleToggleAudio}
        activeColorHex={activeColorHex}
        onChangeColor={(hex) => setActiveColorHex(hex)}
        onReset={handleReset}
      />

      {/* Charter Flight Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}
