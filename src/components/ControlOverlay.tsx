import React, { useState } from 'react';
import { Volume2, VolumeX, Eye, Layers, Compass, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

export type CameraMode = 'story' | 'orbit';

export interface ControlOverlayProps {
  currentProgress: number;
  onSeekProgress: (p: number) => void;
  cameraMode: CameraMode;
  onToggleCameraMode: (mode: CameraMode) => void;
  audioActive: boolean;
  onToggleAudio: () => void;
  activeColorHex: number;
  onChangeColor: (hex: number) => void;
  onReset: () => void;
}

const COLOR_SWATCHES = [
  { name: 'Champagne Platinum', hex: 0xded6c7, bg: '#ded6c7' },
  { name: 'Titanium Silver', hex: 0xc5cbd1, bg: '#c5cbd1' },
  { name: 'Obsidian Jet Black', hex: 0x1a1d22, bg: '#1a1d22' },
  { name: 'Arctic Pearl', hex: 0xf3f4f6, bg: '#f3f4f6' },
];

const STORY_STAGES = [
  { label: '01 SKY GLIDE', progress: 0.12 },
  { label: '02 SPECS', progress: 0.42 },
  { label: '03 SCHEMATIC', progress: 0.72 },
  { label: '04 SERVICES', progress: 0.94 },
];

export const ControlOverlay: React.FC<ControlOverlayProps> = ({
  currentProgress,
  onSeekProgress,
  cameraMode,
  onToggleCameraMode,
  audioActive,
  onToggleAudio,
  activeColorHex,
  onChangeColor,
  onReset,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4 pointer-events-none">
      {/* Toggle Button attached to top of dock */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="pointer-events-auto px-4 py-1.5 rounded-full bg-[#1b222c]/85 hover:bg-[#1b222c] text-white text-[11px] font-mono tracking-wider uppercase backdrop-blur-md shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          aria-label={isCollapsed ? 'Show Controls' : 'Hide Controls'}
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Show Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Hide Controls (Zen Mode)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Glassmorphic Dock */}
      <div
        className={`pointer-events-auto transition-all duration-300 ease-out bg-[#141922]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 text-white shadow-2xl ${
          isCollapsed ? 'opacity-0 translate-y-12 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          {/* Story Phase Scrubber */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {STORY_STAGES.map((stage) => {
              const isCurrent =
                Math.abs(currentProgress - stage.progress) < 0.16 ||
                (stage.label.includes('01') && currentProgress < 0.28) ||
                (stage.label.includes('02') && currentProgress >= 0.28 && currentProgress < 0.55) ||
                (stage.label.includes('03') && currentProgress >= 0.55 && currentProgress < 0.82) ||
                (stage.label.includes('04') && currentProgress >= 0.82);

              return (
                <button
                  key={stage.label}
                  onClick={() => onSeekProgress(stage.progress)}
                  className={`px-3 py-1.5 rounded-lg font-mono text-[11px] tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-white text-[#121417] font-semibold shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {stage.label}
                </button>
              );
            })}
          </div>

          {/* Right Controls: Mode, Color, Sound */}
          <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            {/* Camera View Mode */}
            <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/5">
              <button
                onClick={() => onToggleCameraMode('story')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono tracking-wide flex items-center gap-1 transition-all cursor-pointer ${
                  cameraMode === 'story'
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/50 hover:text-white'
                }`}
                title="Cinematic Story Scroll Mode"
              >
                <Layers className="w-3 h-3" />
                <span>Story</span>
              </button>
              <button
                onClick={() => onToggleCameraMode('orbit')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono tracking-wide flex items-center gap-1 transition-all cursor-pointer ${
                  cameraMode === 'orbit'
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/50 hover:text-white'
                }`}
                title="Free 3D Aircraft Orbit & Inspection"
              >
                <Compass className="w-3 h-3" />
                <span>3D Orbit</span>
              </button>
            </div>

            {/* Aircraft Livery Finish Swatches */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-black/30 rounded-lg border border-white/5">
              <span className="text-[10px] font-mono text-white/50 hidden sm:inline">Finish:</span>
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.name}
                  onClick={() => onChangeColor(swatch.hex)}
                  title={swatch.name}
                  aria-label={swatch.name}
                  style={{ backgroundColor: swatch.bg }}
                  className={`w-4 h-4 rounded-full transition-transform cursor-pointer border ${
                    activeColorHex === swatch.hex
                      ? 'scale-125 border-white ring-2 ring-white/40'
                      : 'border-white/30 hover:scale-110 opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>

            {/* Ambient Sound Toggle */}
            <button
              onClick={onToggleAudio}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                audioActive
                  ? 'bg-white/20 border-white/40 text-white'
                  : 'bg-black/30 border-white/10 text-white/60 hover:text-white'
              }`}
              title={audioActive ? 'Mute Jet Ambiance' : 'Enable Jet Flight Audio'}
              aria-label={audioActive ? 'Mute Audio' : 'Play Audio'}
            >
              {audioActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Reset to Start */}
            <button
              onClick={onReset}
              className="p-2 rounded-lg bg-black/30 border border-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
              title="Reset Story Flight to Start"
              aria-label="Reset Flight"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
