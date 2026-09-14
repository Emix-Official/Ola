export type RaceClip = {
  id: string
  label: string
  src: string
  poster?: string
  description: string
  captions?: { src: string; language: string; label: string }
}

export type RaceFilm = {
  title: string
  summary: string
  credits?: string
  clips: RaceClip[]
}

export const raceFilm: RaceFilm = {
  title: 'Three cars. One frame.',
  summary: 'A three-car racing scene, made in Blender.',
  // Add your exact role and any asset credits once confirmed.
  clips: [
    {
      id: 'render',
      label: 'Rendered Film',
      src: 'media/race/race.mp4',
      poster: 'media/race/race-poster.webp',
      description: 'The final cinematic render created in Blender.',
    },
    {
      id: 'viewport',
      label: 'Blender Viewport',
      src: 'media/race/race-viewport.mp4',
      poster: 'media/race/race-viewport-poster.webp',
      description: 'The 3D animation, wireframes, and camera trajectory viewed inside the Blender viewport.',
    },
  ],
}

// The empty preview is for local development. A production page needs real media.
export const showRaceFilm = raceFilm.clips.length > 0 || import.meta.env.DEV
