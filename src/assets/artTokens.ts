export const ART_COLORS = {
  shared: {
    void950: '#02050A',
    void900: '#050B13',
    void850: '#081320',
    void800: '#0B1B2B',
    steel700: '#183449',
    steel500: '#3E718E',
    ice100: '#EAF7FF',
    ice300: '#AFC5D3',
    cyan400: '#47C7F1',
    cyan200: '#A4EBFF',
    amber400: '#E8AE4B',
    green400: '#5CD59B',
    red400: '#F06B63',
  },
  aegis: {
    primaryMetal: '#A9B7C2',
    darkArmor: '#1A2833',
    lightArmor: '#D9E1E5',
    energy: '#3DD4D0',
    command: '#E7A847',
    danger: '#C85B45',
  },
  synod: {
    hull: '#10141D',
    ceramic: '#252C3B',
    energy: '#53DCFF',
    compute: '#8A6DFF',
    overheat: '#FF6F61',
    signal: '#EAFBFF',
  },
  veyra: {
    shell: '#4A5534',
    darkChitin: '#20291E',
    bone: '#C8BE91',
    bioluminescence: '#A8E85E',
    membrane: '#E07865',
    core: '#F2B64B',
  },
} as const;

export const ART_SIZES = {
  logo: { width: 1600, height: 600, safeAreaPercent: 8 },
  emblem: { width: 1024, height: 1024, safeAreaPercent: 12 },
  shipHero: { width: 1536, height: 1024, safeAreaPercent: 8 },
  shipCard: { width: 1024, height: 1024, safeAreaPercent: 10 },
  shipMap: { width: 512, height: 512, safeAreaPercent: 12 },
  buildingHero: { width: 1024, height: 1024, safeAreaPercent: 8 },
  buildingCard: { width: 768, height: 768, safeAreaPercent: 10 },
  planet: { width: 1536, height: 1536, safeAreaPercent: 7 },
  portrait: { width: 1024, height: 1280, safeAreaPercent: 10 },
  background: { width: 3840, height: 2160, safeAreaPercent: 0 },
} as const;

export const ART_CAMERA = {
  ships: {
    yawDegrees: [25, 35],
    pitchDegrees: [18, 26],
    noseDirection: 'upper-right',
  },
  buildings: {
    pitchDegrees: [30, 35],
    fullBaseVisible: true,
  },
  planets: {
    keyLightDirection: 'upper-left',
    keyLightDegrees: [35, 45],
  },
} as const;

export type FactionArtKey = 'aegis' | 'synod' | 'veyra';
