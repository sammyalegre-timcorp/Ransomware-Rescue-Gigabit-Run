/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CharacterId, LiveRaceDoc, GameSettings } from './types/game';
import { DEFAULT_SETTINGS, CHARACTERS } from './constants/characters';
import { subscribeLiveRace, subscribeSettings } from './services/gameService';
import { LobbyPhase } from './components/HostDisplay/LobbyPhase';
import { RaceTrack } from './components/HostDisplay/RaceTrack';
import { PodiumPhase } from './components/HostDisplay/PodiumPhase';
import { MobileControllerView } from './components/MobileController/MobileControllerView';
import { AdminPanel } from './components/AdminPanel/AdminPanel';
import { soundEngine } from './services/sound';
import { Volume2, VolumeX, Shield, Monitor } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [liveRace, setLiveRace] = useState<LiveRaceDoc | null>(null);
  const [showAdmin, setShowAdmin] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Parse URL query params and pathname to determine view
  const [currentUrl, setCurrentUrl] = useState(() => ({
    pathname: window.location.pathname,
    search: window.location.search
  }));

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentUrl({
        pathname: window.location.pathname,
        search: window.location.search
      });
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Subscribe to live Firestore state
  useEffect(() => {
    const unsubSettings = subscribeSettings(setSettings);
    const unsubRace = subscribeLiveRace(setLiveRace);
    return () => {
      unsubSettings();
      unsubRace();
    };
  }, []);

  const searchParams = new URLSearchParams(currentUrl.search);
  const isController = searchParams.get('role') === 'controller';
  const charParam = searchParams.get('char') as CharacterId | null;
  const isAdminRoute = currentUrl.pathname.includes('/admin') || searchParams.get('admin') === 'true';

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.isMuted = next;
    if (!next) {
      soundEngine.playClick();
    }
  };

  const navigateTo = (path: string, search: string = '') => {
    window.history.pushState({}, '', `${path}${search}`);
    setCurrentUrl({ pathname: path, search });
  };

  // 1. Admin Panel view
  if (isAdminRoute || showAdmin) {
    return (
      <AdminPanel
        settings={settings}
        onClose={() => {
          if (isAdminRoute) {
            navigateTo('/', '');
          }
          setShowAdmin(false);
        }}
      />
    );
  }

  // Loading state while initial Firestore sync happens
  if (!liveRace) {
    return (
      <div className="h-screen max-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 overflow-hidden">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin mb-4" />
        <div className="font-mono text-cyan-400 text-sm tracking-widest uppercase">
          CONNECTING TO PACKET MASH NETWORK...
        </div>
      </div>
    );
  }

  // 2. Mobile Controller View (On player's mobile phone)
  if (isController && charParam && CHARACTERS[charParam]) {
    return (
      <div className="relative min-h-screen bg-slate-950">
        {/* Floating audio toggle */}
        <button
          onClick={toggleSound}
          className="fixed top-3 right-3 z-50 p-2 rounded-full bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        <MobileControllerView
          characterId={charParam}
          liveRace={liveRace}
          settings={settings}
          onExitToHost={() => navigateTo('/', '')}
        />
      </div>
    );
  }

  // 3. Shared Main Host Display View (Completely non-scrollable, fits in viewport)
  return (
    <div className="relative h-screen max-h-screen w-full bg-slate-950 flex flex-col justify-between overflow-hidden select-none">
      {/* Top Floating Utility Controls for Host */}
      <div className="fixed top-3 right-3 z-40 flex items-center gap-2">
        <button
          onClick={toggleSound}
          className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-500 text-slate-400 hover:text-cyan-400 transition-colors shadow-lg cursor-pointer"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>
      </div>

      {/* Render Current Phase on Main Display */}
      <main className="flex-1 min-h-0 w-full overflow-hidden">
        {liveRace.status === 'lobby' && (
          <LobbyPhase
            liveRace={liveRace}
            settings={settings}
            onOpenAdmin={() => setShowAdmin(true)}
          />
        )}

        {/* When countdown or racing: Host shows the optical track with racers staged or racing */}
        {(liveRace.status === 'countdown' || liveRace.status === 'racing') && (
          <RaceTrack
            liveRace={liveRace}
            settings={settings}
            onOpenAdmin={() => setShowAdmin(true)}
          />
        )}

        {liveRace.status === 'podium' && (
          <PodiumPhase
            liveRace={liveRace}
            settings={settings}
            onOpenAdmin={() => setShowAdmin(true)}
          />
        )}
      </main>
    </div>
  );
}
