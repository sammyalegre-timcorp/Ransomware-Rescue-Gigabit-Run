import React, { useState } from 'react';
import { CharacterId } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { registerPlayer } from '../../services/gameService';
import { soundEngine } from '../../services/sound';
import { User, Building, Phone, Briefcase, Mail, ChevronRight, ShieldCheck, Wifi, Volume2, VolumeX } from 'lucide-react';

interface RegistrationScreenProps {
  characterId: CharacterId;
  onRegistered: (name: string, company: string) => void;
  isMuted?: boolean;
  onToggleSound?: () => void;
}

export const RegistrationScreen: React.FC<RegistrationScreenProps> = ({
  characterId,
  onRegistered,
  isMuted,
  onToggleSound
}) => {
  const char = CHARACTERS[characterId];
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    contactNumber: '',
    position: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Please provide at least your Name and Email to register.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      soundEngine.playClick();

      const playerId = `player_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      await registerPlayer({
        playerId,
        characterId,
        name: formData.name.trim(),
        company: formData.company.trim() || 'Independent Tech',
        contactNumber: formData.contactNumber.trim(),
        position: formData.position.trim(),
        email: formData.email.trim()
      });

      onRegistered(formData.name.trim(), formData.company.trim());
    } catch (err) {
      console.error(err);
      setError('Failed to submit registration. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-dvh max-h-dvh w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-2.5 sm:p-3.5 select-none overflow-y-auto max-w-md mx-auto">
      {/* Top Branding Banner with Integrated Audio */}
      <header className="shrink-0 flex items-center justify-between border-b border-slate-800 pb-2 bg-slate-900/60 px-2 py-1.5 rounded-xl">
        <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-bold">
          <Wifi className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Presented by TIM</span>
        </div>
        <div className="flex items-center gap-1.5">
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className="p-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-400 cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-cyan-400" />}
            </button>
          )}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono">
            <ShieldCheck className="w-3 h-3" />
            REGISTRATION
          </div>
        </div>
      </header>

      {/* Character Identity */}
      <div className="shrink-0 flex flex-col items-center text-center my-0.5">
        <div className="scale-75 sm:scale-85">
          <CharacterAvatar characterId={characterId} size="md" glow={true} />
        </div>
        <h1 className="text-base sm:text-lg font-black italic tracking-wide font-['Chakra_Petch'] text-slate-100 mt-0.5">
          {char.name}
        </h1>
        <p className="text-[10px] text-slate-400 max-w-xs">{char.specialty}</p>
      </div>

      {/* Registration Form Card */}
      <div className="flex-1 min-h-0 bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-xl backdrop-blur-md flex flex-col justify-between overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-2">
          {error && (
            <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-[11px] font-mono">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-0.5">
              FULL NAME <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Alex Mercer"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Company */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-0.5">COMPANY / ORG</label>
            <div className="relative">
              <Building className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Enterprise Systems"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-0.5">CONTACT NUMBER</label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="+1 555-0199"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-0.5">POSITION / TITLE</label>
            <div className="relative">
              <Briefcase className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Lead Security Analyst"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-0.5">
              EMAIL ADDRESS <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="alex@security.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-1.5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-3 rounded-lg font-bold font-['Chakra_Petch'] text-sm tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
            >
              {isSubmitting ? (
                'CONNECTING...'
              ) : (
                <>
                  ENTER GIGABIT RUN
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <footer className="shrink-0 text-center text-[10px] font-mono text-slate-500 mt-2">
        Presented by TIM • Ransomware Rescue Protocol
      </footer>
    </div>
  );
};
