import { raceFilm } from "./raceFilm";

export type RaceSceneConfig = {
  enabled: boolean;
  src: string;
  mobileSrc: string;
  description: string;
  animationNames: string[];
  maxPixelRatio: number;
  mobilePixelRatio: number;
  focusNodeNames: string[];
};

export const raceScene: RaceSceneConfig = {
  enabled: true,
  // npm run prepare:race builds this from race.glb without replacing the export.
  src: "media/race/race-web.glb",
  mobileSrc: "media/race/race-mobile.glb",
  description: "Explore the three-car racing scene in 3D.",
  // Empty uses the first exported animation. A single combined race clip is ideal.
  // If the cars have separate clips, list those exact names to play them together.
  animationNames: [],
  maxPixelRatio: 1.5,
  mobilePixelRatio: 1,
  // Three.js removes punctuation from Blender object names.
  focusNodeNames: ["LOD_A_CHASSIS_mm_chassis", "Sketchfab_model", "Sketchfab_model001"],
};

export const showRaceShowcase =
  raceFilm.clips.length > 0 || raceScene.enabled || import.meta.env.DEV;
