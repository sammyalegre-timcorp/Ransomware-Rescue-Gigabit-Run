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
import { Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [liveRace, setLiveRace] = useState<LiveRaceDoc | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        const elem = document.documentElement as any;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        }
      } else {
        const doc = document as any;
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen request blocked or unsupported:', err);
    }
  };

  // Parse URL query params, pathname, and hash to determine view
  const [currentUrl, setCurrentUrl] = useState(() => ({
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash
  }));

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentUrl({
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash
      });
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
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
  // The admin page should ONLY be accessible by adding '/admin' to the url
  const isAdminRoute =
    currentUrl.pathname.toLowerCase().includes('/admin') ||
    currentUrl.hash.toLowerCase().includes('admin') ||
    searchParams.get('admin') === 'true';

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
    if (!next) {
      soundEngine.playClick();
    }
  };

  const navigateTo = (path: string, search: string = '') => {
    window.history.pushState({}, '', `${path}${search}`);
    setCurrentUrl({ pathname: path, search, hash: '' });
  };

  // Auto-start and keep background music playing during idle, lobby QR screen, and matches
  // MUST be placed at top of component before any conditional returns!
  useEffect(() => {
    if (!isMuted && !isController && !isAdminRoute) {
      soundEngine.startBgm();
    }
    const enableAudio = () => {
      if (!soundEngine.isMuted && !isController && !isAdminRoute) {
        soundEngine.startBgm();
      }
    };
    window.addEventListener('click', enableAudio);
    window.addEventListener('touchstart', enableAudio);
    return () => {
      window.removeEventListener('click', enableAudio);
      window.removeEventListener('touchstart', enableAudio);
    };
  }, [isMuted, isController, isAdminRoute]);

  // 1. Admin Panel view - Strictly accessible only via /admin route
  if (isAdminRoute) {
    return (
      <AdminPanel
        settings={settings}
        onClose={() => {
          navigateTo('/', '');
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
          CONNECTING TO RANSOMWARE RESCUE NETWORK...
        </div>
      </div>
    );
  }

  // 2. Mobile Controller View (On player's mobile phone)
  if (isController && charParam && CHARACTERS[charParam]) {
    return (
      <div className="relative h-dvh max-h-dvh w-full bg-slate-950 overflow-hidden">
        <MobileControllerView
          characterId={charParam}
          liveRace={liveRace}
          settings={settings}
          isMuted={isMuted}
          onToggleSound={toggleSound}
          onExitToHost={() => navigateTo('/', '')}
        />
      </div>
    );
  }

  // 3. Shared Main Host Display View (Completely non-scrollable, fits in viewport)
  return (
    <div className="relative h-screen max-h-screen w-full bg-slate-950 flex flex-col justify-between overflow-hidden select-none">
      {/* Render Current Phase on Main Display */}
      <main className="flex-1 min-h-0 w-full overflow-hidden">
        {liveRace.status === 'lobby' && (
          <LobbyPhase
            liveRace={liveRace}
            settings={settings}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            isMuted={isMuted}
            onToggleSound={toggleSound}
          />
        )}

        {/* When countdown or racing: Host shows the optical track with racers staged or racing */}
        {(liveRace.status === 'countdown' || liveRace.status === 'racing') && (
          <RaceTrack
            liveRace={liveRace}
            settings={settings}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            isMuted={isMuted}
            onToggleSound={toggleSound}
          />
        )}

        {liveRace.status === 'podium' && (
          <PodiumPhase
            liveRace={liveRace}
            settings={settings}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            isMuted={isMuted}
            onToggleSound={toggleSound}
            onOpenAdmin={() => navigateTo('/admin')}
          />
        )}
      </main>
    </div>
  );
}
