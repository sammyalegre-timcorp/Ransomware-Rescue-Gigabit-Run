import React, { useEffect, useState } from 'react';
import { CharacterId, LiveRaceDoc, GameSettings } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { CharacterAvatar } from '../common/CharacterAvatar';
import { generateQrDataUrl } from '../../utils/qrCode';
import { startCountdown, clearSlot } from '../../services/gameService';
import { soundEngine } from '../../services/sound';
import {
  QrCode,
  CheckCircle2,
  Trash2,
  Zap,
  Gauge,
  Flame,
  Clock,
  Wifi,
  ShieldAlert
} from 'lucide-react';

interface LobbyPhaseProps {
  liveRace: LiveRaceDoc;
  settings: GameSettings;
}

export const LobbyPhase: React.FC<LobbyPhaseProps> = ({
  liveRace,
  settings
}) => {
  const [qrCodes, setQrCodes] = useState<Record<CharacterId, string>>({
    firewall_frank: '',
    packet_pete: '',
    cyber_kat: '',
    agent_mal: ''
  });

  const charList = Object.values(CHARACTERS);

  // Generate QR code URLs for each character slot
  useEffect(() => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;

    charList.forEach(async (char) => {
      const controllerUrl = `${origin}${pathname}?role=controller&char=${char.id}`;
      const dataUrl = await generateQrDataUrl(controllerUrl);
      setQrCodes((prev) => ({ ...prev, [char.id]: dataUrl }));
    });
  }, []);

  const readyCount = Object.values(liveRace.slots).filter((s) => s.assigned && s.isReady).length;
  const assignedCount = Object.values(liveRace.slots).filter((s) => s.assigned).length;
  const targetMB = (liveRace.targetTaps || settings.requiredTaps || 1000).toLocaleString();

  const handleStartRace = async () => {
    soundEngine.playClick();
    await startCountdown(settings.countdownDuration, liveRace.targetTaps || settings.requiredTaps);
  };

  return (
    <div className="h-screen max-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-3 md:p-4 overflow-hidden select-none">
      {/* Top Banner / HUD - Compact Header with "Presented by TIM" and NO admin button */}
      <header className="shrink-0 flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-1.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold">
            <Wifi className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Presented by TIM</span>
          </div>
          <span className="text-slate-700">|</span>
          <h1 className="text-xl md:text-2xl font-black italic tracking-wide bg-gradient-to-r from-cyan-400 via-sky-300 to-fuchsia-400 bg-clip-text text-transparent font-['Chakra_Petch']">
            {settings.gameTitle}
          </h1>
        </div>

        {/* Global Patch Target & Prep Telemetry */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-300">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>Emergency Patch:</span>
            <span className="text-cyan-400 font-bold">{targetMB} MB</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Prep:</span>
            <span className="text-amber-400 font-bold">{settings.countdownDuration}s</span>
          </div>
        </div>
      </header>

      {/* Critical Lore Alert Banner */}
      <div className="shrink-0 bg-slate-900/70 border border-red-500/30 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 text-xs font-mono">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
          <span className="text-slate-300 truncate">
            <strong className="text-red-400">RANSOMWARE ALERT:</strong> A ransomware exploit has breached the network. Push the emergency patch to core server. First to transfer <strong>{targetMB} MB</strong> secures the company!
          </span>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 shrink-0 font-bold hidden sm:inline">
          Tap rapidly to pump Mbps
        </span>
      </div>

      {/* 4 Character Pedestals Grid - Fills available vertical space without scrolling */}
      <div className="flex-1 min-h-0 grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3.5 my-0.5 items-stretch">
        {charList.map((char) => {
          const slot = liveRace.slots[char.id];
          const isAssigned = slot?.assigned;
          const isReady = slot?.isReady;
          const qrUrl = qrCodes[char.id];

          return (
            <div
              key={char.id}
              className={`relative flex flex-col justify-between rounded-xl border transition-all duration-200 p-2.5 md:p-3 ${
                isReady
                  ? 'bg-slate-900/90 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  : isAssigned
                  ? 'bg-slate-900/70 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'bg-slate-900/40 border-slate-800'
              }`}
            >
              {/* Slot Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-1 mb-1 shrink-0">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: char.primaryColor }}
                  />
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                    Protocol {charList.indexOf(char) + 1}
                  </span>
                </div>
                {isReady ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    READY
                  </span>
                ) : isAssigned ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    STANDBY
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                    OPEN
                  </span>
                )}
              </div>

              {/* Character Identity & Avatar with Stepping Feet */}
              <div className="flex flex-col items-center text-center my-auto shrink-0">
                <div className="transition-transform duration-200 scale-90 md:scale-95">
                  <CharacterAvatar characterId={char.id} size="md" glow={true} />
                </div>
                <h3 className="text-sm md:text-base font-bold font-['Chakra_Petch'] mt-1 text-slate-100 truncate w-full">
                  {char.name}
                </h3>
                <div
                  className="mt-0.5 text-[9px] font-mono px-2 py-0.2 rounded border truncate max-w-full"
                  style={{
                    color: char.primaryColor,
                    borderColor: `${char.primaryColor}40`,
                    backgroundColor: `${char.primaryColor}10`
                  }}
                >
                  {char.specialty}
                </div>
              </div>

              {/* QR Code / Player Info Section */}
              <div className="mt-1.5 shrink-0 flex flex-col items-center">
                {!isAssigned ? (
                  <div className="flex flex-col items-center bg-slate-950/90 border border-slate-800 rounded-lg p-1.5 w-full">
                    <div className="p-1 bg-white rounded-md shadow-inner flex items-center justify-center">
                      {qrUrl ? (
                        <img
                          src={qrUrl}
                          alt={`QR for ${char.name}`}
                          className="w-20 h-20 md:w-24 md:h-24 object-contain"
                        />
                      ) : (
                        <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center bg-slate-100 text-slate-400">
                          <QrCode className="w-5 h-5 animate-spin" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-cyan-300 mt-1 flex items-center gap-1">
                      <QrCode className="w-3 h-3" /> Scan to Connect
                    </p>
                  </div>
                ) : (
                  <div className="w-full bg-slate-950/90 border border-cyan-500/30 rounded-lg p-2 text-center">
                    <div className="text-[9px] font-mono text-slate-500 uppercase">Assigned Pilot</div>
                    <div className="text-xs md:text-sm font-bold text-slate-100 truncate mt-0.5">
                      {slot.playerName || 'Anonymous Pilot'}
                    </div>
                    <div className="text-[10px] font-mono text-cyan-400 truncate">
                      {slot.playerCompany || 'Enterprise Network'}
                    </div>
                    {slot.playerPosition && (
                      <div className="text-[9px] text-slate-400 truncate">
                        {slot.playerPosition}
                      </div>
                    )}
                    <button
                      onClick={() => clearSlot(char.id)}
                      className="mt-1.5 text-[10px] font-mono text-red-400 hover:text-red-300 flex items-center justify-center gap-1 hover:underline cursor-pointer w-full"
                    >
                      <Trash2 className="w-2.5 h-2.5" /> Disconnect
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Master Launch Bar - Compact Fixed Height, NO admin button */}
      <footer className="shrink-0 mt-1 border-t border-cyan-500/20 pt-2 flex items-center justify-between gap-4 bg-slate-900/70 rounded-xl px-4 py-2 border">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-1.5">
            {charList.map((c) => {
              const slot = liveRace.slots[c.id];
              return (
                <div
                  key={c.id}
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center bg-slate-950 overflow-hidden ${
                    slot?.isReady
                      ? 'border-emerald-400 text-emerald-400'
                      : slot?.assigned
                      ? 'border-amber-400 text-amber-400'
                      : 'border-slate-700 text-slate-600'
                  }`}
                >
                  <div className="scale-75">
                    <CharacterAvatar characterId={c.id} size="sm" glow={false} />
                  </div>
                </div>
              );
            })}
          </div>
          <div>
            <div className="text-sm font-bold font-['Chakra_Petch'] text-slate-200">
              {readyCount} of 4 Protocols Ready
            </div>
            <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
              {readyCount === 0
                ? 'Players scan QR code on their mobile device to register and drive'
                : 'Click Start Game to launch 5s countdown on mobile devices!'}
            </div>
          </div>
        </div>

        {/* Start Game Button */}
        <div>
          <button
            onClick={handleStartRace}
            disabled={assignedCount === 0}
            className={`px-5 py-2.5 rounded-xl font-black font-['Chakra_Petch'] text-xs md:text-sm tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              assignedCount > 0
                ? 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
            START GAME ({settings.countdownDuration}s COUNTDOWN ON PHONES)
            <Zap className="w-4 h-4 text-yellow-300" />
          </button>
        </div>
      </footer>
    </div>
  );
};
