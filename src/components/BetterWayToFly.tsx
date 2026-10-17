import React, { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import { formatDubaiTime } from '../utils/aircraftMath';
import cabinDogImg from '../assets/images/jesko_pets_cabin.jpg';

interface AccordionItem {
  id: string;
  title: string;
  content: string;
}

const ACCORDION_ITEMS: AccordionItem[] = [
  {
    id: 'pets',
    title: 'Pets',
    content:
      'Traveling with pets on a private jet means comfort and peace of mind for both owners and their companions. Our dedicated team ensures seamless arrangements, from documentation and safety to onboard care, so that your pet enjoys the same level of attention and luxury as you do. Every detail is managed to create a stress-free and enjoyable journey for everyone on board.',
  },
  {
    id: 'availability',
    title: '24/7 availability',
    content:
      'Our global flight dispatch operates around the clock, providing instantaneous slot clearance, private terminal handling, and ready-to-board standby aircraft anywhere across Europe, the Middle East, Asia, and North America.',
  },
  {
    id: 'services',
    title: 'Onboard services',
    content:
      'Michelin-curated in-flight gastronomy, bespoke sommelier selections, and high-speed Ka-band satellite connectivity tailored precisely to your journey’s rhythm.',
  },
  {
    id: 'efficient',
    title: 'Efficient',
    content:
      'Bypass commercial terminal friction entirely. Arrive at private FBO handling just 15 minutes prior to departure with direct runway ramp access and immediate takeoff clearance.',
  },
];

export const BetterWayToFly: React.FC = () => {
  const [openId, setOpenId] = useState<string>('pets');
  const [dubaiTime, setDubaiTime] = useState(formatDubaiTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setDubaiTime(formatDubaiTime());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? '' : id);
  };

  return (
    <section className="relative w-full max-w-7xl mx-auto px-6 sm:px-12 py-20 min-h-screen flex flex-col justify-between">
      <div>
        {/* Section Tag */}
        <p className="text-[11px] font-mono tracking-widest uppercase text-[#555] mb-12 sm:mb-16">
          A Better Way to Fly
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Accordion */}
          <div className="lg:col-span-6 space-y-6">
            {ACCORDION_ITEMS.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div
                  key={item.id}
                  className="border-b border-[#c8c1b3]/70 pb-6 transition-colors"
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full flex items-center justify-between text-left group py-2 cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="font-serif text-3xl sm:text-4xl text-[#141920] font-normal group-hover:text-black transition-colors">
                      {item.title}
                    </span>
                    <span className="text-xl text-[#333] transition-transform duration-200">
                      {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="mt-4 pr-6 text-sm sm:text-base text-[#4a5058] leading-relaxed font-sans font-light animate-fadeIn">
                      {item.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Cabin Pet Luxury Image & Details */}
          <div className="lg:col-span-6">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-[#c4bcb0]/60 bg-[#eee8de]">
              <img
                src={cabinDogImg}
                alt="Jesko Jets private cabin pet travel experience"
                className="w-full h-[400px] sm:h-[480px] object-cover object-center transform hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-5 right-5 text-white flex items-end justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/80">
                    Cabin Comfort
                  </div>
                  <div className="text-sm font-medium font-serif">
                    Unrestricted Pet Accompaniment
                  </div>
                </div>
                <div className="text-xs font-mono text-white/70">
                  Gulfstream G650ER
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status / Local Time Widget */}
      <div className="pt-16 pb-8 flex items-center justify-end">
        <div className="flex items-center gap-3 text-right">
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[#777] uppercase">
              Local Time
            </div>
            <div className="text-xs font-mono font-semibold text-[#141920] tracking-wider">
              {dubaiTime.cityStr}
            </div>
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-light text-[#141920] tracking-wider border-l border-[#b5aca0] pl-4">
            {dubaiTime.timeStr}
          </div>
        </div>
      </div>
    </section>
  );
};
