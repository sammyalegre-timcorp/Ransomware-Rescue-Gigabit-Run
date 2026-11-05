import React, { useState } from 'react';
import { CharacterId } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { registerPlayer } from '../../services/gameService';
import { soundEngine } from '../../services/sound';
import { User, Building, Phone, Briefcase, Mail, ChevronRight, ShieldCheck } from 'lucide-react';

interface RegistrationScreenProps {
  characterId: CharacterId;
  onRegistered: (name: string, company: string) => void;
}

export const RegistrationScreen: React.FC<RegistrationScreenProps> = ({
  characterId,
  onRegistered
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-6 max-w-lg mx-auto">
      {/* Character Header Banner */}
      <div className="flex flex-col items-center text-center mt-2 mb-6">
        <div className="relative mb-2">
          <CharacterAvatar characterId={characterId} size="lg" glow={true} />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          PILOT REGISTRATION // SLOT ASSIGNED
        </div>
        <h1 className="text-2xl font-black italic tracking-wide font-['Chakra_Petch'] text-slate-100">
          {char.name}
        </h1>
        <p className="text-xs text-slate-400 max-w-xs">{char.description}</p>
      </div>

      {/* Registration Form Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md flex-1 flex flex-col justify-between">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-mono">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              FULL NAME <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Alex Mercer"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Company */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">COMPANY / ORG</label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Cyberdyne Systems"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">CONTACT NUMBER</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="e.g. +1 555-0199"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">POSITION / TITLE</label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="e.g. Lead Network Engineer"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              EMAIL ADDRESS <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="alex@enterprise.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl font-bold font-['Chakra_Petch'] text-base tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer active:scale-95"
            >
              {isSubmitting ? (
                'CONNECTING TO SYSTEM...'
              ) : (
                <>
                  PROCEED TO CONTROLLER
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="text-center text-[10px] font-mono text-slate-500 mt-4">
        Packet Dash Protocol • Safe & Secure Connection
      </div>
    </div>
  );
};
