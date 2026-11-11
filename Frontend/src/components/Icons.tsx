import React, { type ReactNode } from 'react';
import { Image, Text } from 'react-native-web';

export const legacyAssets: Record<string, string> = {
  hero: "/assets/72efe.png",
  scan: "/assets/fb8e5.svg",
  sparkles: "/assets/dc79a.svg",
  sparklesLg: "/assets/7a87f.svg",
  mail: "/assets/a49e2.svg",
  eyeOff: "/assets/bf239.svg",
  arrow: "/assets/8ba74.svg",
  arrowLeft: "/assets/e30c5.svg",
  chrome: "/assets/3d675.svg",
  apple: "/assets/c766b.svg",
  sprout: "/assets/b524f.svg",
  user: "/assets/b47f9.svg",
  at: "/assets/919d1.svg",
  check: "/assets/53645.svg",
  lock: "/assets/671fc.svg",
  scale: "/assets/35815.svg",
  flag: "/assets/277b4.svg",
  armchair: "/assets/19d39.svg",
  circle: "/assets/bab11.svg",
  footprints: "/assets/b787b.svg",
  bike: "/assets/8cf17.svg",
  circleCheck: "/assets/4f007.svg",
  dumbbell: "/assets/cbe69.svg",
  camera: "/assets/3fb17.svg",
};

interface VectorDef {
  path: ReactNode;
  stroke?: boolean;
  fill?: string;
  strokeWidth?: number;
}

const vectorIcons: Record<string, VectorDef> = {
  home: {
    stroke: true,
    path: (
      <>
        <path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    ),
  },
  social: {
    stroke: true,
    path: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  users: {
    stroke: true,
    path: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  camera: {
    stroke: true,
    path: (
      <>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
  },
  scan: {
    stroke: true,
    path: (
      <>
        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <line x1="7" y1="12" x2="17" y2="12" />
      </>
    ),
  },
  trend: {
    stroke: true,
    path: (
      <>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </>
    ),
  },
  chart: {
    stroke: true,
    path: (
      <>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </>
    ),
  },
  profile: {
    stroke: true,
    path: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
  },
  user: {
    stroke: true,
    path: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
  },
  settings: {
    stroke: true,
    path: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
  },
  bell: {
    stroke: true,
    path: (
      <>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
  },
  calendar: {
    stroke: true,
    path: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
  },
  cal: {
    stroke: true,
    path: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
  },
  water: {
    stroke: true,
    path: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />,
  },
  droplet: {
    stroke: true,
    path: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />,
  },
  flame: {
    stroke: true,
    path: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />,
  },
  fire: {
    stroke: true,
    path: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />,
  },
  edit: {
    stroke: true,
    path: (
      <>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </>
    ),
  },
  trash: {
    stroke: true,
    path: (
      <>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </>
    ),
  },
  plus: {
    stroke: true,
    path: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </>
    ),
  },
  minus: {
    stroke: true,
    path: <line x1="5" y1="12" x2="19" y2="12" />,
  },
  check: {
    stroke: true,
    path: <polyline points="20 6 9 17 4 12" />,
  },
  shield: {
    stroke: true,
    path: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  },
  logout: {
    stroke: true,
    path: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </>
    ),
  },
  lock: {
    stroke: true,
    path: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
  },
  mail: {
    stroke: true,
    path: (
      <>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </>
    ),
  },
  chevronRight: {
    stroke: true,
    path: <polyline points="9 18 15 12 9 6" />,
  },
  chevronLeft: {
    stroke: true,
    path: <polyline points="15 18 9 12 15 6" />,
  },
  arrowLeft: {
    stroke: true,
    path: (
      <>
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </>
    ),
  },
  arrow: {
    stroke: true,
    path: (
      <>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </>
    ),
  },
  close: {
    stroke: true,
    path: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
  },
  copy: {
    stroke: true,
    path: (
      <>
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </>
    ),
  },
  gift: {
    stroke: true,
    path: (
      <>
        <polyline points="20 12 20 22 4 22 4 12" />
        <rect x="2" y="7" width="20" height="5" />
        <line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </>
    ),
  },
  sparkles: {
    stroke: true,
    path: <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />,
  },
  target: {
    stroke: true,
    path: (
      <>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </>
    ),
  },
  smartphone: {
    stroke: true,
    path: (
      <>
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </>
    ),
  },
  footprints: {
    stroke: true,
    path: (
      <>
        <circle cx="9" cy="5" r="2" />
        <circle cx="15" cy="5" r="2" />
        <path d="M8 12c-1.1 0-2 .9-2 2v4c0 1.7 1.3 3 3 3s3-1.3 3-3v-4c0-1.1-.9-2-2-2z" />
        <path d="M16 10c-1.1 0-2 .9-2 2v4c0 1.7 1.3 3 3 3s3-1.3 3-3v-4c0-1.1-.9-2-2-2z" />
      </>
    ),
  },
  dumbbell: {
    stroke: true,
    path: (
      <>
        <line x1="6.5" y1="6.5" x2="17.5" y2="17.5" />
        <line x1="21" y1="21" x2="20" y2="20" />
        <line x1="3" y1="3" x2="4" y2="4" />
        <line x1="18" y1="22" x2="22" y2="18" />
        <line x1="2" y1="6" x2="6" y2="2" />
        <line x1="3" y1="10" x2="10" y2="3" />
        <line x1="14" y1="21" x2="21" y2="14" />
      </>
    ),
  },
  info: {
    stroke: true,
    path: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </>
    ),
  },
  scale: {
    stroke: true,
    path: (
      <>
        <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="M7 21h10" />
        <path d="M12 3v18" />
        <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
      </>
    ),
  },
};

export type IconName = keyof typeof legacyAssets | string;

export function Icon({
  name,
  size = 20,
  color = '#1F2A44',
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  style?: any;
}) {
  const v = vectorIcons[name as string];
  if (v) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={v.fill || 'none'}
        stroke={v.stroke ? color : 'none'}
        strokeWidth={v.strokeWidth || 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      >
        {v.path}
      </svg>
    );
  }

  const legacyUri = legacyAssets[name as string];
  if (legacyUri) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        source={{ uri: legacyUri }}
        style={[{ width: size, height: size }, style]}
      />
    );
  }

  return <Text style={{ fontSize: size * 0.75, color }}>{name}</Text>;
}
