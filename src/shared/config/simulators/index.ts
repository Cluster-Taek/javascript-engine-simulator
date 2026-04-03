export interface SimulatorConfig {
  id: string;
  href: string;
  emoji: string;
}

export const SIMULATORS: SimulatorConfig[] = [
  { id: 'engine', href: '/engine-simulator', emoji: '⚙️' },
  { id: 'closure', href: '/closure-simulator', emoji: '🔒' },
  { id: 'this', href: '/this-simulator', emoji: '👆' },
  { id: 'event', href: '/event-simulator', emoji: '🎯' },
  { id: 'reconciliation', href: '/reconciliation-simulator', emoji: '⚛' },
];
