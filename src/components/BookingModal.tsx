import React, { useState } from 'react';
import { X, Plane, Calendar, Users, MapPin, CheckCircle, ArrowRight } from 'lucide-react';
import { calculateFlightCalculation, GULFSTREAM_650ER_SPECS } from '../utils/aircraftMath';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DESTINATIONS = [
  { city: 'Dubai (DXB)', country: 'UAE', distanceKm: 0 },
  { city: 'New York (JFK)', country: 'USA', distanceKm: 11020 },
  { city: 'London (LHR)', country: 'UK', distanceKm: 5500 },
  { city: 'Tokyo (HND)', country: 'Japan', distanceKm: 7950 },
  { city: 'Paris (LBG)', country: 'France', distanceKm: 5250 },
  { city: 'Geneva (GVA)', country: 'Switzerland', distanceKm: 4920 },
  { city: 'Singapore (SIN)', country: 'Singapore', distanceKm: 5850 },
];

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const [origin, setOrigin] = useState('Dubai (DXB)');
  const [destination, setDestination] = useState('New York (JFK)');
  const [date, setDate] = useState('2026-10-25');
  const [passengers, setPassengers] = useState(4);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const destObj = DESTINATIONS.find((d) => d.city === destination) || DESTINATIONS[1];
  const originObj = DESTINATIONS.find((d) => d.city === origin) || DESTINATIONS[0];

  // Approximate distance calculation
  const distance = Math.abs(destObj.distanceKm - originObj.distanceKm) || 7500;
  const flightCalc = calculateFlightCalculation(distance);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#f6f3ee] text-[#14171a] rounded-2xl shadow-2xl overflow-hidden border border-[#ded8cf]">
        {/* Header bar */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-[#e2dbce] bg-[#ece6dc]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1b222c] text-white flex items-center justify-center">
              <Plane className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-serif tracking-wide text-[#1b222c]">
                Jesko Jets Charter
              </h3>
              <p className="text-xs font-mono text-[#666] uppercase tracking-wider">
                Gulfstream G650ER Private Flight Desk
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-[#666] hover:text-[#111] hover:bg-black/5 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="text-2xl font-serif font-bold text-[#1b222c]">
              Charter Reservation Received
            </h4>
            <p className="text-sm text-[#555] max-w-md mx-auto leading-relaxed">
              Your flight inquiry for {origin} to {destination} on the Gulfstream G650ER has been registered. Our flight concierge desk will reach out within 15 minutes with slot clearance and catering preferences.
            </p>
            <div className="p-4 rounded-xl bg-white/70 border border-[#e2dbce] text-left max-w-sm mx-auto text-xs font-mono space-y-1">
              <div><strong>Route:</strong> {origin} → {destination}</div>
              <div><strong>Flight Duration:</strong> {flightCalc.formatted} non-stop</div>
              <div><strong>Aircraft:</strong> Gulfstream G650ER (Range: {GULFSTREAM_650ER_SPECS.maxRangeKm.toLocaleString()} km)</div>
              <div><strong>Passengers:</strong> {passengers} VIP Guests</div>
            </div>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="mt-4 px-6 py-2.5 rounded-full bg-[#1b222c] text-white text-xs font-mono tracking-widest uppercase hover:bg-black transition-all cursor-pointer"
            >
              Return to Experience
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#666] mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Departure Airport
                </label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[#d8d0c4] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1b222c]"
                >
                  {DESTINATIONS.map((d) => (
                    <option key={d.city} value={d.city}>
                      {d.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#666] mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Arrival Destination
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[#d8d0c4] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1b222c]"
                >
                  {DESTINATIONS.filter((d) => d.city !== origin).map((d) => (
                    <option key={d.city} value={d.city}>
                      {d.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#666] mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Preferred Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[#d8d0c4] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1b222c]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#666] mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Passengers (Max {GULFSTREAM_650ER_SPECS.seatsMax})
                </label>
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-[#d8d0c4] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1b222c]"
                >
                  {Array.from({ length: GULFSTREAM_650ER_SPECS.seatsMax }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Passenger' : 'Passengers'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Aircraft Route Metric Card */}
            <div className="p-4 rounded-xl bg-[#eee8de] border border-[#ded5c7] flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono uppercase text-[#777]">Estimated Flight Time</div>
                <div className="text-xl font-bold font-serif text-[#1b222c]">{flightCalc.formatted}</div>
                <div className="text-[11px] text-[#555] font-mono">Distance: ~{distance.toLocaleString()} km (Non-stop capable)</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-mono uppercase text-[#777]">Aircraft Type</div>
                <div className="text-sm font-bold text-[#1b222c]">Gulfstream G650ER</div>
                <div className="text-[11px] text-emerald-800 font-mono font-medium">✓ Direct Slot Priority</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-[#ccc] text-xs font-mono uppercase tracking-wider text-[#555] hover:bg-black/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-7 py-2.5 rounded-full bg-[#141920] hover:bg-black text-white text-xs font-mono uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <span>Request Flight Quote</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
