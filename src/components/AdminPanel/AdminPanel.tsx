import React, { useState, useEffect } from 'react';
import { GameSettings, PlayerRegistration, RaceHistoryRecord } from '../../types/game';
import { TITLE_OPTIONS, CHARACTERS } from '../../constants/characters';
import {
  updateGameSettings,
  subscribeRegistrations,
  subscribeRaceHistory,
  deleteRegistrationRecord,
  resetRaceLobby
} from '../../services/gameService';
import { soundEngine } from '../../services/sound';
import {
  Settings,
  Users,
  Download,
  Trash2,
  RotateCcw,
  Sliders,
  ArrowLeft,
  Search,
  Check,
  Trophy,
  History,
  FileSpreadsheet,
  Eye,
  EyeOff,
  Wifi,
  AlertCircle,
  X,
  Globe
} from 'lucide-react';

interface AdminPanelProps {
  settings: GameSettings;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ settings, onClose }) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'registrations' | 'history'>('settings');

  // Local settings state
  const [registrationEnabled, setRegistrationEnabled] = useState(settings.registrationEnabled);
  const [requiredTaps, setRequiredTaps] = useState(settings.requiredTaps);
  const [countdownDuration, setCountdownDuration] = useState(settings.countdownDuration);
  const [soloTimeLimit, setSoloTimeLimit] = useState(settings.soloTimeLimit || 15);
  const [gameTitle, setGameTitle] = useState(settings.gameTitle);
  const [showTelemetryOnTrack, setShowTelemetryOnTrack] = useState(settings.showTelemetryOnTrack ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Registrations & History data
  const [registrations, setRegistrations] = useState<PlayerRegistration[]>([]);
  const [raceHistory, setRaceHistory] = useState<RaceHistoryRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // In-app feedback toast & confirmation modal (eliminates window.alert/window.confirm for iFrame and Vercel compatibility)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    danger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    onConfirm: () => {}
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const unsubReg = subscribeRegistrations(setRegistrations);
    const unsubHist = subscribeRaceHistory(setRaceHistory);
    return () => {
      unsubReg();
      unsubHist();
    };
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    soundEngine.playClick();
    await updateGameSettings({
      registrationEnabled,
      requiredTaps: Number(requiredTaps),
      countdownDuration: Number(countdownDuration),
      soloTimeLimit: Number(soloTimeLimit),
      gameTitle,
      showTelemetryOnTrack
    });
    setIsSaving(false);
    setSaveSuccess(true);
    showToast('Settings saved & synced to active race successfully!');
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetLobby = () => {
    soundEngine.playClick();
    setConfirmModal({
      isOpen: true,
      title: 'Reset Race Lobby?',
      description: 'This will reset the active race session, clear assigned slots, and return all players to the standby lobby.',
      confirmText: 'Yes, Reset Lobby',
      danger: true,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        await resetRaceLobby(false);
        showToast('Race lobby has been reset.');
      }
    });
  };

  const handleDeleteReg = (id?: string) => {
    if (!id) return;
    soundEngine.playClick();
    setConfirmModal({
      isOpen: true,
      title: 'Delete Registration Record?',
      description: 'This will permanently remove this player registration record from Firebase Firestore.',
      confirmText: 'Delete Record',
      danger: true,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        await deleteRegistrationRecord(id);
        showToast('Registration record deleted.');
      }
    });
  };

  // Export registrations to CSV
  const handleExportRegistrationsCSV = () => {
    soundEngine.playClick();
    if (registrations.length === 0) {
      showToast('No registration records available to export.');
      return;
    }

    const headers = ['Name', 'Company', 'Contact Number', 'Position', 'Email', 'Assigned Protocol', 'Registered Date'];
    const rows = registrations.map((r) => [
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.company.replace(/"/g, '""')}"`,
      `"${r.contactNumber.replace(/"/g, '""')}"`,
      `"${r.position.replace(/"/g, '""')}"`,
      `"${r.email.replace(/"/g, '""')}"`,
      `"${CHARACTERS[r.characterId]?.name || r.characterId}"`,
      `"${r.createdAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ransomware_rescue_registrations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${registrations.length} registrations to CSV.`);
  };

  // Export race history & podium winners to CSV
  const handleExportHistoryCSV = () => {
    soundEngine.playClick();
    if (raceHistory.length === 0) {
      showToast('No race history records available to export.');
      return;
    }

    const headers = ['Date', 'Title', 'Mode', 'Outcome', 'Patch Size (MB)', 'Rank', 'Player Name', 'Company', 'Protocol', 'Finish Time (s)', 'MB Transferred'];
    const rows: string[] = [];

    raceHistory.forEach((h) => {
      h.winners.forEach((w) => {
        const mode = h.isSoloMode ? 'Solo Speed Run' : 'Multiplayer';
        const outcome = h.isSoloMode
          ? (w.outcome || (w.score && w.score > 0 ? 'SUCCESS' : 'FAILED'))
          : `Rank #${w.rank}`;
        rows.push([
          `"${h.date}"`,
          `"${h.title}"`,
          `"${mode}"`,
          `"${outcome}"`,
          `${h.targetTaps}`,
          `${w.rank}`,
          `"${w.name.replace(/"/g, '""')}"`,
          `"${w.company.replace(/"/g, '""')}"`,
          `"${CHARACTERS[w.characterId]?.name || w.characterId}"`,
          `${w.finishTimeSeconds}`,
          `${w.tapCount}`
        ].join(','));
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ransomware_rescue_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${raceHistory.length} race sessions to CSV.`);
  };

  // Filtered registrations
  const filteredRegistrations = registrations.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (CHARACTERS[r.characterId]?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen max-h-screen w-full bg-slate-950 text-slate-100 flex flex-col p-3 sm:p-4 md:p-6 overflow-hidden select-none">
      {/* Top Header - Fixed at top, never scrolls away */}
      <header className="shrink-0 flex flex-col md:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Game Display
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 font-bold flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5" />
                Presented by TIM
              </span>
              <span className="text-slate-700">|</span>
              <span className="text-xs font-mono text-slate-400">Restricted Route: /admin</span>
            </div>
            <h1 className="text-lg md:text-2xl font-black italic tracking-wide bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent font-['Chakra_Petch']">
              COMMAND CENTER // /admin
            </h1>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 w-full md:w-auto justify-center">
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('settings');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Game Settings
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('registrations');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'registrations'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Registrations ({registrations.length})
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('history');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            History ({raceHistory.length})
          </button>
        </div>
      </header>

      {/* Main Content Area - Fully and reliably scrollable on any viewport */}
      <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden pr-1 pb-6">
        {/* TAB 1: Game Settings */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-start">
              {/* LEFT COLUMN: Controls, Telemetry & Branding */}
              <div className="space-y-4">
                {/* 1. Registration Mandatory Toggle */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
                  <h2 className="text-sm sm:text-base font-bold font-['Chakra_Petch'] text-cyan-400 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-cyan-400" />
                    1. Player Registration Mandatory Toggle
                  </h2>
                  <p className="text-xs text-slate-400">
                    Controls whether players must fill out company and contact info upon scanning QR code.
                  </p>

                  <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
                    <div>
                      <div className="font-bold text-xs text-slate-200">
                        Mandatory Mobile Registration
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {registrationEnabled
                          ? 'ON: Name, Company, Contact, Position, Email required.'
                          : 'OFF: Skip registration form; jump straight to ready check.'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRegistrationEnabled(!registrationEnabled)}
                      className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                        registrationEnabled ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-slate-950 shadow-md" />
                    </button>
                  </div>
                </div>

                {/* 2. Track Telemetry Toggle */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
                  <h2 className="text-sm sm:text-base font-bold font-['Chakra_Petch'] text-cyan-400 flex items-center gap-2">
                    {showTelemetryOnTrack ? <Eye className="w-4 h-4 text-cyan-400" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                    2. Live Track Telemetry Display
                  </h2>
                  <p className="text-xs text-slate-400">
                    Toggle between detailed Mbps & progress metrics vs clean track view.
                  </p>

                  <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
                    <div>
                      <div className="font-bold text-xs text-slate-200">
                        {showTelemetryOnTrack ? 'Show Numerical Mbps & Progress' : 'Clean View (Just Show Character Move)'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {showTelemetryOnTrack
                          ? 'ON: Real-time MB transferred, % progress, and speed gauges shown on lanes.'
                          : 'OFF: Minimalist track; only runner avatars and step strides are displayed.'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTelemetryOnTrack(!showTelemetryOnTrack)}
                      className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                        showTelemetryOnTrack ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-slate-950 shadow-md" />
                    </button>
                  </div>
                </div>

                {/* 3. Game Title Selection */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
                  <h2 className="text-sm sm:text-base font-bold font-['Chakra_Petch'] text-cyan-400 flex items-center gap-2">
                    3. Active Game Title
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TITLE_OPTIONS.map((title) => (
                      <div
                        key={title}
                        onClick={() => setGameTitle(title)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          gameTitle === title
                            ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-xs font-['Chakra_Petch']">
                          <span className="truncate pr-1">{title}</span>
                          {gameTitle === title && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Patch Size, Prep Time, Presets & Actions */}
              <div className="space-y-4">
                {/* 4. Patch Size & Countdown Duration */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
                  <h2 className="text-sm sm:text-base font-bold font-['Chakra_Petch'] text-cyan-400 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    4. Emergency Patch Size & Prep Time
                  </h2>

                  {/* Patch Size Slider & Quick Presets */}
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-300 font-bold">Emergency Patch Size:</span>
                      <span className="text-cyan-400 font-black text-sm tracking-wide bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/40">
                        {Number(requiredTaps).toLocaleString()} MB
                      </span>
                    </div>

                    {/* Quick preset buttons */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {[100, 500, 1000, 2000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setRequiredTaps(val)}
                          className={`flex-1 py-1 px-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer text-center ${
                            requiredTaps === val
                              ? 'bg-cyan-500 text-slate-950 shadow-sm'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          {val === 100 ? '100 MB' : val === 500 ? '500 MB' : val === 1000 ? '1,000 MB' : '2,000 MB'}
                        </button>
                      ))}
                    </div>

                    <input
                      type="range"
                      min="100"
                      max="2000"
                      step="50"
                      value={requiredTaps}
                      onChange={(e) => setRequiredTaps(Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer mt-1"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-slate-500">
                      <span>100 MB (Fast)</span>
                      <span>1,000 MB (Standard 1TB)</span>
                      <span>2,000 MB (Endurance)</span>
                    </div>
                  </div>

                  {/* Countdown duration Slider & Quick Presets */}
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-300 font-bold">Countdown Prep Duration:</span>
                      <span className="text-amber-400 font-black text-sm tracking-wide bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
                        {countdownDuration} Seconds
                      </span>
                    </div>

                    {/* Quick preset buttons */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {[3, 5, 10].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCountdownDuration(val)}
                          className={`flex-1 py-1 px-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer text-center ${
                            countdownDuration === val
                              ? 'bg-amber-400 text-slate-950 shadow-sm'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          {val}s {val === 5 ? '(Standard)' : ''}
                        </button>
                      ))}
                    </div>

                    <input
                      type="range"
                      min="3"
                      max="10"
                      step="1"
                      value={countdownDuration}
                      onChange={(e) => setCountdownDuration(Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer mt-1"
                    />
                  </div>

                  {/* 5. Solo Mode Time to Beat (Seconds) */}
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-300 font-bold">Solo Mode (Time to Beat):</span>
                      <span className="text-emerald-400 font-black text-sm tracking-wide bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                        {soloTimeLimit} Seconds
                      </span>
                    </div>

                    {/* Quick presets */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {[5, 10, 15, 20, 30].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setSoloTimeLimit(val)}
                          className={`flex-1 py-1 px-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer text-center ${
                            soloTimeLimit === val
                              ? 'bg-emerald-400 text-slate-950 shadow-sm'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          {val}s {val === 15 ? '(Std)' : ''}
                        </button>
                      ))}
                    </div>

                    <input
                      type="range"
                      min="5"
                      max="60"
                      step="1"
                      value={soloTimeLimit}
                      onChange={(e) => setSoloTimeLimit(Number(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer mt-1"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-slate-500">
                      <span>5s (Hardcore)</span>
                      <span>15s (Standard)</span>
                      <span>60s (Extended)</span>
                    </div>
                  </div>
                </div>

                {/* Save Buttons & Controls */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex flex-col sm:flex-row items-center gap-2.5">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full sm:flex-1 py-3 px-4 rounded-xl font-black font-['Chakra_Petch'] text-xs sm:text-sm tracking-wide bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
                    >
                      {saveSuccess ? (
                        <>
                          <Check className="w-4 h-4" />
                          SETTINGS SAVED & SYNCED!
                        </>
                      ) : (
                        <>
                          <Sliders className="w-4 h-4" />
                          APPLY & SAVE SETTINGS
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleResetLobby}
                      className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-950 border border-red-500/40 hover:bg-red-500/10 text-red-400 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Race Lobby
                    </button>
                  </div>
                </div>

                {/* Vercel & Production Readiness Info */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                    <Globe className="w-3.5 h-3.5" />
                    <span>ROUTE: /admin • LIVE FIREBASE SYNC</span>
                  </div>
                  <p className="leading-relaxed">
                    Settings sync live to the host display and all mobile controllers. Changing the patch size updates the finish line immediately.
                  </p>
                </div>
              </div>
            </div>
          </form>
        )}

      {/* TAB 2: Player Registrations */}
      {activeTab === 'registrations' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
            <div className="relative w-full md:w-80">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search registrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-xs font-mono text-slate-400">
                Total Registrations: <strong className="text-cyan-400">{registrations.length}</strong>
              </span>
              <button
                onClick={handleExportRegistrationsCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold font-['Chakra_Petch'] text-xs cursor-pointer shadow-md transition-all active:scale-95"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-x-auto shadow-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Company</th>
                  <th className="p-3">Position</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Protocol</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-500">
                      No player registration records found.
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((r) => {
                    const char = CHARACTERS[r.characterId];
                    return (
                      <tr key={r.id || r.playerId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-bold text-slate-100">{r.name}</td>
                        <td className="p-3 text-cyan-400">{r.company || '—'}</td>
                        <td className="p-3 text-slate-300">{r.position || '—'}</td>
                        <td className="p-3 text-slate-300">{r.email}</td>
                        <td className="p-3 text-slate-400">{r.contactNumber || '—'}</td>
                        <td className="p-3">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{
                              color: char?.primaryColor || '#FFF',
                              backgroundColor: `${char?.primaryColor || '#FFF'}15`
                            }}
                          >
                            {char?.name || r.characterId}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 text-[10px]">
                          {new Date(r.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteReg(r.id)}
                            className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Race History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
            <div>
              <h3 className="text-xs font-bold font-['Chakra_Petch'] text-slate-200">
                Archived Rescue Sessions & Winning Protocols
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Past race statistics, winning times, and podium standings saved to Firebase.
              </p>
            </div>
            <button
              onClick={handleExportHistoryCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold font-['Chakra_Petch'] text-xs cursor-pointer shadow-md transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              Export History CSV
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {raceHistory.length === 0 ? (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 text-center text-slate-500 font-mono text-xs">
                No past race sessions recorded yet.
              </div>
            ) : (
              raceHistory.map((hist) => (
                <div
                  key={hist.id || hist.raceId}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="font-bold text-xs font-['Chakra_Petch'] text-slate-200">
                          {hist.title || 'Gigabit Circuit Run'} • {hist.targetTaps} MB
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{hist.date}</div>
                      </div>
                    </div>
                  </div>

                  {/* Podium Finishers */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {hist.winners.map((winner) => (
                      <div
                        key={winner.rank}
                        className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${
                          winner.rank === 1
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : winner.rank === 2
                            ? 'bg-slate-400/10 border-slate-400/30 text-slate-200'
                            : 'bg-amber-800/10 border-amber-800/30 text-amber-500'
                        }`}
                      >
                        <div className="w-7 h-7 rounded bg-slate-950 font-black font-['Chakra_Petch'] flex items-center justify-center text-sm">
                          #{winner.rank}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-xs truncate">{winner.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{winner.company}</div>
                          <div className="text-[10px] font-mono text-cyan-400 flex items-center gap-1.5 flex-wrap">
                            <span>⏱ {winner.finishTimeSeconds}s • {winner.tapCount} MB</span>
                            {hist.isSoloMode ? (
                              <span
                                className={`px-1.5 py-0.2 rounded font-bold uppercase border text-[9px] ${
                                  winner.outcome === 'SUCCESS' || (winner.score && winner.score > 0)
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-red-500/20 text-red-300 border-red-500/40'
                                }`}
                              >
                                {winner.outcome || (winner.score && winner.score > 0 ? 'SUCCESS' : 'FAILED')}
                              </span>
                            ) : (
                              winner.score !== undefined && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                  {winner.score} PTS
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      </main>

      {/* Toast Notification (Eliminates window.alert) */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 border border-cyan-500 text-cyan-300 px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] font-mono text-xs">
          <Check className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Confirmation Modal (Eliminates window.confirm) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  confirmModal.danger
                    ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                    : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                }`}
              >
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold font-['Chakra_Petch'] text-slate-100">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  {confirmModal.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-['Chakra_Petch'] cursor-pointer transition-all shadow-md ${
                  confirmModal.danger
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
