import React from 'react';

interface JeskoHeaderProps {
  onNavClick?: (section: string) => void;
}

export const JeskoHeader: React.FC<JeskoHeaderProps> = ({ onNavClick }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 px-6 sm:px-12 py-5 sm:py-6 flex items-center justify-between pointer-events-auto">
      {/* Left Navigation Links */}
      <nav className="flex items-center gap-6 sm:gap-9 text-xs sm:text-sm font-sans font-medium text-[#181d24]/90 tracking-wide">
        <button
          onClick={() => onNavClick?.('about')}
          className="hover:text-black transition-colors cursor-pointer"
        >
          About
        </button>
        <button
          onClick={() => onNavClick?.('fleet')}
          className="hover:text-black transition-colors cursor-pointer"
        >
          Our Fleet
        </button>
        <button
          onClick={() => onNavClick?.('advantages')}
          className="hover:text-black transition-colors cursor-pointer hidden md:inline"
        >
          Advantages
        </button>
        <button
          onClick={() => onNavClick?.('global')}
          className="hover:text-black transition-colors cursor-pointer hidden md:inline"
        >
          Global
        </button>
      </nav>

      {/* Center Wordmark Logo */}
      <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-auto">
        <a
          href="#"
          className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#141920] select-none hover:opacity-85 transition-opacity"
        >
          Jesko Jets
        </a>
      </div>

      {/* Right Contact Info */}
      <div className="flex items-center gap-5 sm:gap-8 text-xs sm:text-sm font-sans font-medium text-[#181d24]/90">
        <a
          href="tel:+971544325050"
          className="hover:text-black transition-colors whitespace-nowrap hidden sm:inline"
        >
          +971 54 432 5050
        </a>
        <a
          href="mailto:info@jeskojets.com"
          className="hover:text-black transition-colors whitespace-nowrap"
        >
          info@jeskojets.com
        </a>
      </div>
    </header>
  );
};
