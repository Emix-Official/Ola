import { raceFilm } from "./raceFilm";

export type RaceSceneConfig = {
  enabled: boolean;
  src: string;
  srcDev?: string;
  description: string;
  animationNames: string[];
  maxPixelRatio: number;
};

export const raceScene: RaceSceneConfig = {
  // Set true after exporting public/media/race/race.glb.
  enabled: true,
  src: "media/race/race.glb",
  srcDev: "media/race/race-original.glb",
  description: "Explore the three-car racing scene in 3D.",
  // Empty uses the first exported animation. A single combined race clip is ideal.
  // If the cars have separate clips, list those exact names to play them together.
  animationNames: [],
  maxPixelRatio: 1.5,
};

export const showRaceShowcase =
  raceFilm.clips.length > 0 || raceScene.enabled || import.meta.env.DEV;
