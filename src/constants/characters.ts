import { CharacterId, CharacterInfo } from '../types/game';

export const CHARACTERS: Record<CharacterId, CharacterInfo> = {
  firewall_frank: {
    id: 'firewall_frank',
    name: 'Firewall Frank',
    tagline: 'The Digital Fortress',
    description: 'A sturdy digital fortress shield built to block security threats and charge forward.',
    specialty: 'DDoS Deflector & Zero-Trust Rampart',
    primaryColor: '#F97316', // Orange 500
    accentColor: '#EF4444', // Red 500
    glowColor: 'rgba(249, 115, 22, 0.6)',
    bgGradient: 'from-amber-500/20 via-orange-600/20 to-red-600/30',
    borderGradient: 'from-orange-400 to-red-500',
    cyberQuote: 'PACKET DROPPED. PATH CLEARED!',
    avatarSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]">
      <defs>
        <linearGradient id="frankGlow" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FF7A00"/>
          <stop offset="1" stop-color="#FF0044"/>
        </linearGradient>
        <radialGradient id="frankCore" cx="50" cy="50" r="35" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FFE600"/>
          <stop offset="0.6" stop-color="#FF5500"/>
          <stop offset="1" stop-color="#990000"/>
        </radialGradient>
      </defs>
      <!-- Shield Base -->
      <path d="M50 5 L85 20 C85 58 50 92 50 92 C50 92 15 58 15 20 Z" fill="url(#frankGlow)" stroke="#FFF" stroke-width="2.5" stroke-linejoin="round"/>
      <!-- Inner Cyber Fortress Plates -->
      <path d="M50 15 L75 27 C75 55 50 80 50 80 C50 80 25 55 25 27 Z" fill="#1A0B05" stroke="#FFAA00" stroke-width="2"/>
      <!-- Hexagonal Core Grid -->
      <polygon points="50,30 65,39 65,57 50,66 35,57 35,39" fill="url(#frankCore)" stroke="#FFFFFF" stroke-width="2"/>
      <!-- Brick / Firewall Glyphs -->
      <line x1="38" y1="48" x2="62" y2="48" stroke="#FFE7BA" stroke-width="2.5"/>
      <line x1="50" y1="36" x2="50" y2="48" stroke="#FFE7BA" stroke-width="2"/>
      <line x1="44" y1="48" x2="44" y2="60" stroke="#FFE7BA" stroke-width="2"/>
      <line x1="56" y1="48" x2="56" y2="60" stroke="#FFE7BA" stroke-width="2"/>
      <!-- Fortress Horns / Spikes -->
      <polygon points="50,6 44,14 56,14" fill="#FFFFFF"/>
      <circle cx="50" cy="48" r="4" fill="#FFFFFF"/>
    </svg>`
  },
  packet_pete: {
    id: 'packet_pete',
    name: 'Packet Pete',
    tagline: 'The Gigabit Photon',
    description: 'A glowing high-speed data envelope burning through network cables at optical speed.',
    specialty: '100Gbps Low-Latency Optical Surge',
    primaryColor: '#06B6D4', // Cyan 500
    accentColor: '#3B82F6', // Blue 500
    glowColor: 'rgba(6, 182, 212, 0.6)',
    bgGradient: 'from-cyan-500/20 via-sky-600/20 to-blue-600/30',
    borderGradient: 'from-cyan-400 to-blue-500',
    cyberQuote: '0ms PING. MAXIMUM THROUGHPUT!',
    avatarSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">
      <defs>
        <linearGradient id="peteGlow" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stop-color="#00F0FF"/>
          <stop offset="1" stop-color="#0066FF"/>
        </linearGradient>
      </defs>
      <!-- Speed Trails -->
      <path d="M10 32 L35 32 M5 50 L30 50 M12 68 L32 68" stroke="#00F0FF" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
      <!-- Glowing Data Envelope Body -->
      <polygon points="30,22 88,22 92,72 26,72" fill="url(#peteGlow)" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round"/>
      <!-- Envelope Flap & Optical Seams -->
      <polygon points="30,22 59,52 88,22" fill="#003566" stroke="#00FFFF" stroke-width="2"/>
      <polygon points="26,72 59,48 92,72" fill="#051923" stroke="#38BDF8" stroke-width="1.5" opacity="0.7"/>
      <!-- Binary Hologram Glyphs -->
      <circle cx="59" cy="40" r="8" fill="#FFFFFF"/>
      <circle cx="59" cy="40" r="4" fill="#00E5FF"/>
      <!-- High-speed photon lightning -->
      <path d="M42 35 L48 45 L45 48 L52 58" stroke="#FFF" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M76 35 L70 45 L73 48 L66 58" stroke="#FFF" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`
  },
  cyber_kat: {
    id: 'cyber_kat',
    name: 'Cyber Kat',
    tagline: 'The Quantum Prowler',
    description: 'A sleek neon-clad cyber-cat wearing AR HUD visor glasses and overclocked reflexes.',
    specialty: 'Fiber-Optic Agility & Reflex Overclock',
    primaryColor: '#EC4899', // Pink 500
    accentColor: '#A855F7', // Purple 500
    glowColor: 'rgba(236, 72, 153, 0.6)',
    bgGradient: 'from-pink-500/20 via-fuchsia-600/20 to-purple-600/30',
    borderGradient: 'from-pink-400 to-purple-500',
    cyberQuote: 'NINE LIVES OF BANDWIDTH!',
    avatarSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-[0_0_15px_rgba(236,72,153,0.8)]">
      <defs>
        <linearGradient id="katGlow" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FF2A85"/>
          <stop offset="1" stop-color="#9D00FF"/>
        </linearGradient>
      </defs>
      <!-- Cyber Cat Ears -->
      <polygon points="22,12 40,36 18,44" fill="url(#katGlow)" stroke="#FFF" stroke-width="2.5"/>
      <polygon points="78,12 60,36 82,44" fill="url(#katGlow)" stroke="#FFF" stroke-width="2.5"/>
      <polygon points="26,18 36,34 22,40" fill="#FF77BC"/>
      <polygon points="74,18 64,34 78,40" fill="#FF77BC"/>
      <!-- Head Base -->
      <path d="M22 40 Q50 30 78 40 Q88 68 76 84 Q50 94 24 84 Q12 68 22 40 Z" fill="#140824" stroke="url(#katGlow)" stroke-width="3"/>
      <!-- AR HUD Visor Glasses -->
      <path d="M20 48 Q50 42 80 48 L76 65 Q50 60 24 65 Z" fill="#00FFF0" stroke="#FFFFFF" stroke-width="2" opacity="0.95"/>
      <!-- Visor HUD Telemetry Scanlines -->
      <line x1="28" y1="54" x2="72" y2="54" stroke="#003B46" stroke-width="2" stroke-dasharray="3 3"/>
      <circle cx="36" cy="56" r="3" fill="#FF0077"/>
      <circle cx="64" cy="56" r="3" fill="#FF0077"/>
      <!-- Whisker Antennae -->
      <line x1="12" y1="68" x2="26" y2="70" stroke="#FF2A85" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="10" y1="76" x2="26" y2="75" stroke="#FF2A85" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="88" y1="68" x2="74" y2="70" stroke="#FF2A85" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="90" y1="76" x2="74" y2="75" stroke="#FF2A85" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Cyber Nose & Fang -->
      <polygon points="47,72 53,72 50,76" fill="#FF2A85"/>
      <path d="M44 80 Q50 85 56 80" stroke="#00FFF0" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },
  agent_mal: {
    id: 'agent_mal',
    name: 'Agent Mal',
    tagline: 'The Lag Exterminator',
    description: 'A digital security agent carrying a scanner staff to purge latency, trojans, and system lag.',
    specialty: 'Heuristic Threat Scanner & Protocol Purge',
    primaryColor: '#10B981', // Emerald 500
    accentColor: '#84CC16', // Lime 500
    glowColor: 'rgba(16, 185, 129, 0.6)',
    bgGradient: 'from-emerald-500/20 via-teal-600/20 to-lime-600/30',
    borderGradient: 'from-emerald-400 to-lime-400',
    cyberQuote: 'MALWARE PURGED. PUSH TO OVERDRIVE!',
    avatarSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]">
      <defs>
        <linearGradient id="malGlow" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stop-color="#00FFA3"/>
          <stop offset="1" stop-color="#007744"/>
        </linearGradient>
      </defs>
      <!-- Hood / Helmet Silhouette -->
      <path d="M50 10 C32 10 22 28 22 50 C22 75 35 90 50 94 C65 90 78 75 78 50 C78 28 68 10 50 10 Z" fill="#041B12" stroke="url(#malGlow)" stroke-width="3"/>
      <!-- Inner Visor Shadow -->
      <ellipse cx="50" cy="46" rx="22" ry="14" fill="#000000" stroke="#00FFA3" stroke-width="2"/>
      <!-- Glowing Heuristic Scanner Optics -->
      <circle cx="42" cy="46" r="5" fill="#00FFA3"/>
      <circle cx="58" cy="46" r="5" fill="#00FFA3"/>
      <circle cx="42" cy="46" r="2" fill="#FFFFFF"/>
      <circle cx="58" cy="46" r="2" fill="#FFFFFF"/>
      <!-- Scanner Staff Energy Emitter -->
      <line x1="84" y1="20" x2="84" y2="88" stroke="#00FFA3" stroke-width="4" stroke-linecap="round"/>
      <circle cx="84" cy="20" r="9" fill="#00FFA3" stroke="#FFF" stroke-width="2"/>
      <polygon points="84,14 89,20 84,26 79,20" fill="#041B12"/>
      <!-- Firewall Shield Crest On Chest -->
      <polygon points="50,68 60,74 50,86 40,74" fill="url(#malGlow)"/>
      <circle cx="50" cy="76" r="2.5" fill="#FFFFFF"/>
    </svg>`
  }
};

export const TITLE_OPTIONS = [
  'Packet Dash: Overclocked',
  'Cyber Sprint: The Gigabit Race',
  'Bandwidth Battle',
  'Ping & Push: Firewall Run'
] as const;

export const DEFAULT_SETTINGS = {
  registrationEnabled: true,
  requiredTaps: 1000,
  countdownDuration: 5,
  gameTitle: 'Packet Dash: Overclocked'
};
