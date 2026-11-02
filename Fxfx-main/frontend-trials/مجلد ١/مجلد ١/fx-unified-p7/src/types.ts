export type StageId = 1 | 2 | 3 | 4 | 5;

export interface LensSpec {
  id: string;
  name: string;
  focalLength: string;
  maxAperture: string;
  fov: string;
  squeeze: string;
  closeFocus: string;
  flareColor: string;
  descAr: string;
  descEn: string;
  mtfCenter: number;
  distortionPct: number;
}

export interface LightingFixture {
  id: string;
  name: string;
  roleAr: string;
  roleEn: string;
  universe: string;
  cct: string;
  dimmer: number; // 0 - 100
  lux: number;
  luxDistance: string;
  modifier: string;
  descAr: string;
}

export interface AudioStem {
  id: string;
  titleAr: string;
  titleEn: string;
  micAr: string;
  micEn: string;
  volume: number; // in dB e.g. -6.2
  muted: boolean;
  solo: boolean;
  color: string;
}

export interface CinematicScene {
  id: number;
  titleAr: string;
  titleEn: string;
  locationAr: string;
  locationEn: string;
  timecode: string;
  imageUrl: string;
  directorCalloutAr: string;
  directorCalloutEn: string;
  defaultLensId: string;
  tStop: string;
  focusDistance: string;
  iso: number;
  shutter: string;
  wb: string;
  aspectRatio: string;
  elevation: string;
  gps: string;
}
