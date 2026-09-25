export const profile = {
  name: "Olaoluwa Abiodun",
  brand: "MarkOS",
  email: "laoluwaabiodun1@gmail.com",
  location: "Lagos, Nigeria",
  education: "BSc Software Engineering · Babcock University",
  github: "https://github.com/Emix-Official",
  linkedin: "https://www.linkedin.com/in/olaoluwa-abiodun-673868368/",
  website: "https://ola-two-nu.vercel.app/",
  cv: "documents/olaoluwa-abiodun-cv.pdf",
  bio: [
    "I’m a software engineering student at Babcock University. I build software, model in 3D, and bring ideas to life through editing and animation.",
    "My projects often begin with a question: could a timetable be easier to use? Could a tap on a phone trigger something on a computer? I learn by following those questions and building something I can put in people’s hands.",
    "MarkOS is where those experiments meet. Some are useful tools, some are visual explorations, and each one teaches me something to bring into the next build.",
  ],
} as const;

export function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}
