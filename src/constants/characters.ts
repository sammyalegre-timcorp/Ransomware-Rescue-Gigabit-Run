import { CharacterId, CharacterInfo } from '../types/game';

export const CHARACTERS: Record<CharacterId, CharacterInfo> = {
  firewall_frank: {
    id: 'firewall_frank',
    name: 'Firewall Frank',
    tagline: 'The Digital Fortress',
    description: 'A sturdy digital fortress shield protocol with mechanized armor legs built to block security threats and charge forward.',
    specialty: 'DDoS Deflector & Zero-Trust Rampart',
    primaryColor: '#F97316', // Orange 500
    accentColor: '#EF4444', // Red 500
    glowColor: 'rgba(249, 115, 22, 0.6)',
    bgGradient: 'from-amber-500/20 via-orange-600/20 to-red-600/30',
    borderGradient: 'from-orange-400 to-red-500',
    cyberQuote: 'PACKET DROPPED. PATH CLEARED!',
    avatarSvg: ''
  },
  packet_pete: {
    id: 'packet_pete',
    name: 'Packet Pete',
    tagline: 'The Gigabit Photon',
    description: 'A glowing high-speed data envelope runner with photon booster sneakers burning through network cables.',
    specialty: '100Gbps Low-Latency Optical Surge',
    primaryColor: '#06B6D4', // Cyan 500
    accentColor: '#3B82F6', // Blue 500
    glowColor: 'rgba(6, 182, 212, 0.6)',
    bgGradient: 'from-cyan-500/20 via-sky-600/20 to-blue-600/30',
    borderGradient: 'from-cyan-400 to-blue-500',
    cyberQuote: '0ms PING. MAXIMUM THROUGHPUT!',
    avatarSvg: ''
  },
  cyber_kat: {
    id: 'cyber_kat',
    name: 'Cyber Kat',
    tagline: 'The Quantum Prowler',
    description: 'A sleek neon cyber-cat wearing AR HUD visor glasses with agile robotic paws and lightning-fast cyber legs.',
    specialty: 'Fiber-Optic Agility & Reflex Overclock',
    primaryColor: '#EC4899', // Pink 500
    accentColor: '#A855F7', // Purple 500
    glowColor: 'rgba(236, 72, 153, 0.6)',
    bgGradient: 'from-pink-500/20 via-fuchsia-600/20 to-purple-600/30',
    borderGradient: 'from-pink-400 to-purple-500',
    cyberQuote: 'NINE LIVES OF BANDWIDTH!',
    avatarSvg: ''
  },
  agent_mal: {
    id: 'agent_mal',
    name: 'Agent Mal',
    tagline: 'The Lag Exterminator',
    description: 'A digital security operative carrying a scanner staff with tactical antivirus cyber boots to purge system lag.',
    specialty: 'Heuristic Threat Scanner & Protocol Purge',
    primaryColor: '#10B981', // Emerald 500
    accentColor: '#84CC16', // Lime 500
    glowColor: 'rgba(16, 185, 129, 0.6)',
    bgGradient: 'from-emerald-500/20 via-teal-600/20 to-lime-600/30',
    borderGradient: 'from-emerald-400 to-lime-400',
    cyberQuote: 'MALWARE PURGED. PUSH TO OVERDRIVE!',
    avatarSvg: ''
  }
};

export const TITLE_OPTIONS = [
  'Ransomware Rescue: Gigabit Run',
  'Cyber Sprint: The Gigabit Race',
  'Bandwidth Battle',
  'Ping & Push: Firewall Run'
] as const;

export const DEFAULT_SETTINGS = {
  registrationEnabled: true,
  requiredTaps: 1000,
  countdownDuration: 5,
  gameTitle: 'Ransomware Rescue: Gigabit Run',
  showTelemetryOnTrack: false // default false: "just show the character move", with option in admin to show mbps/progress
};

export const GAME_LORE = {
  story: `A ransomware exploit has breached the network. The IT team dispatches 4 AI Security Protocols to push a 1 Terabyte emergency patch to the core server. Because bandwidth is limited, only the first protocol to reach the server can lock it down and save the company.`,
  objective: `The Objective: Tap rapidly to pump bandwidth (Mbps). The first player to transfer the required MB deploys the patch, secures the network, and wins the match.`
};
