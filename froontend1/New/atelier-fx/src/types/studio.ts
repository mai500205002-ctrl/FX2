export type ViewMode = 'staging' | 'sequencer' | 'contact' | 'grading';

export type AspectRatioType = '2.39:1' | '16:9' | '4:3' | '1:1' | '9:16';

export interface CameraLensProfile {
  id: string;
  name: string;
  focalLength: string;
  aperture: string;
  shutterAngle: string;
  character: string;
  flareColor: string;
}

export interface FilmStockPreset {
  id: string;
  name: string;
  iso: number;
  format: '35mm' | '16mm' | '65mm';
  baseTint: string;
  grainIntensity: number;
  contrastCurve: string;
}

export interface SceneShot {
  id: string;
  title: string;
  sceneNumber: string;
  takeNumber: number;
  duration: number; // in seconds
  timecodeStart: string;
  promptSerif: string;
  parameterTokens: string[];
  imageUrl: string;
  aspectRatio: AspectRatioType;
  lensId: string;
  filmStockId: string;
  seed: number;
  cfgScale: number;
  steps: number;
  colorGrade: ColorGradeSettings;
  tags: string[];
}

export interface ColorGradeSettings {
  exposure: number; // -2 to +2
  contrast: number; // 0.8 to 1.5
  temperature: number; // -50 (cool) to +50 (warm)
  saturation: number; // 0 to 1.5
  filmStock: string; // e.g. "kodak-5219"
  lutIntensity: number; // 0 to 100%
  halationIntensity: number; // 0 to 100%
  grainDensity: number; // 0 to 100%
  anamorphicFlare: number; // 0 to 100%
  vignette: number; // 0 to 100%
}

export interface TimelineClip {
  id: string;
  shotId: string;
  trackId: 'v1' | 'v2' | 'a1';
  startSecond: number;
  durationSecond: number;
  title: string;
  thumbnailUrl: string;
  locked?: boolean;
}
