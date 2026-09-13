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
    // Add these files to public/media/race, then uncomment this entry:
    // {
    //   id: 'render',
    //   label: 'Render',
    //   src: 'media/race/race.mp4',
    //   poster: 'media/race/race-poster.jpg',
    //   description: 'Three cars racing in a scene made in Blender.',
    // },
    // Optional second clip after exporting a matching viewport recording:
    // {
    //   id: 'viewport',
    //   label: 'Viewport',
    //   src: 'media/race/race-viewport.mp4',
    //   description: 'The same racing scene viewed in the Blender viewport.',
    // },
  ],
}

// The empty preview is for local development. A production page needs real media.
export const showRaceFilm = raceFilm.clips.length > 0 || import.meta.env.DEV
