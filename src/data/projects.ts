export type ProjectImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type Discipline = "software" | "3d" | "motion";

export type Project = {
  disciplines: Discipline[];
  featured?: boolean;
  role?: string;
  tools?: string[];
  id: string;
  name: string;
  category: string;
  status: string;
  headline: string;
  summary: string;
  story: string;
  url: string;
  linkLabel: string;
  image?: ProjectImage;
  preview?: "nfc" | "documents";
  imageCaption?: string;
};

export const projects: Project[] = [
  {
    id: "upright",
    name: "Upright",
    category: "Web App / Document Tools",
    disciplines: ["software"],
    featured: true,
    status: "Live project",
    preview: "documents",
    headline: "Different files. One place to bring them together.",
    summary:
      "A browser-based document compiler for bringing Word documents, PDFs, spreadsheets, presentations, and images into a unified document.",
    story:
      "Upright brings file import, compilation, preview, and download into one interface. It is an exploration of how a web app can make working across document formats feel more straightforward.",
    tools: ["React", "Document processing"],
    url: "https://upright-seven.vercel.app/",
    linkLabel: "Try Upright",
  },
  {
    id: "time-tableau",
    disciplines: ["software"],
    featured: true,
    name: "Time Tableau",
    category: "Web App / Student Tools",
    status: "Live beta",
    headline: "A clearer view of the university week.",
    summary:
      "A university timetable project that grew into a student-focused app for checking classes and planning the week.",
    story:
      "I started with automatic timetable generation to help reduce scheduling conflicts. When I shared previews with my class, their interest pushed me to build a student-facing experience. The current beta is based on my own class timetable.",
    image: {
      src: "projects/time-tableau.webp",
      alt: "Time Tableau showing a university class timetable, calendar, and next-class details.",
      width: 1600,
      height: 895,
    },
    url: "https://timetableau-two.vercel.app/",
    linkLabel: "Explore the beta",
  },
  {
    id: "nfc-bridge",
    disciplines: ["software"],
    featured: true,
    name: "NFC Bridge",
    category: "Hardware / System Utility",
    status: "Prototype",
    preview: "nfc",
    headline: "A tap on your phone. An action on your computer.",
    summary:
      "A prototype connecting a phone’s NFC reader to a desktop app over USB, with the goal of turning scanned tags into configurable computer actions.",
    story:
      "The idea is to use hardware already in your pocket. Scan a tag on your phone, pass it to the desktop app, and map it to a workflow such as starting a timer or opening a set of apps.",
    url: "https://github.com/Emix-Official/NFC-Bridge-Desktop",
    linkLabel: "Explore repository",
  },
  {
    id: "senseaid",
    disciplines: ["software"],
    name: "SenseAid",
    role: "Lead developer · six-person team",
    tools: ["HTML", "TypeScript", "Node.js", "Firebase"],
    category: "Web / Accessibility",
    status: "University prototype",
    headline: "Exploring more accessible education for students.",
    summary:
      "A first-year university project exploring tools and resources for students with disabilities.",
    story:
      "I led development in a six-person university team. We initially explored AI integration, but that part remained unfinished. I implemented features within the site itself so we could share a working prototype. It is one of my early projects and a useful record of what I was learning.",
    image: {
      src: "projects/senseaid.png",
      alt: "SenseAid homepage with accessible education resources and support categories.",
      width: 2264,
      height: 990,
    },
    url: "https://senseaid-site.web.app",
    linkLabel: "Visit live deployment",
  },
  {
    id: "markos",
    disciplines: ["software"],
    name: "MarkOS",
    category: "Systems / Desktop Architecture",
    status: "Experimental",
    headline: "Exploring a desktop environment of my own.",
    summary:
      "An exploratory desktop environment built in Python featuring dedicated process launching, custom startup audio choreography, and a responsive modular dashboard.",
    story:
      "An experiment in how windows, background processes, and a visual identity can fit together in a desktop environment.",
    url: "https://github.com/Emix-Official/MarkOS",
    linkLabel: "View source on GitHub",
  },
  {
    id: "geo-auth",
    disciplines: ["software"],
    name: "GeoAuth",
    category: "Security / Web Applications",
    status: "Completed",
    headline: "Exploring registration with a location boundary.",
    summary:
      "A web project combining user registration, Supabase authentication, and browser geolocation.",
    story:
      "This project explores how a registration flow can respond to a user’s location. Browser geolocation is a useful interface signal, but it is not proof of physical presence.",
    url: "https://dummy-reg-app.vercel.app/",
    linkLabel: "Launch portal",
  },
  {
    id: "weather-app",
    disciplines: ["software"],
    name: "Weather App",
    category: "Frontend / API Integration",
    status: "Completed",
    headline: "A forecast that follows your location.",
    summary:
      "A responsive weather interface combining forecasts, browser geolocation, and changing visual themes.",
    story:
      "A classroom assignment that became a chance to practise API requests, location permissions, loading states, and responsive interfaces.",
    url: "https://emixwlrd-weather.netlify.app",
    linkLabel: "View application",
  },
  {
    id: "three-cars",
    name: "Three cars. One frame.",
    category: "3D / Animation",
    disciplines: ["3d", "motion"],
    status: "Visual study",
    headline: "Finding the frame in a three-car race.",
    summary:
      "A Blender racing scene explored through a rendered film, a viewport breakdown, and an interactive 3D view.",
    story:
      "This study brings together scene composition, lighting, camera movement, and animation. The showcase lets you compare the final render with the scene behind it.",
    tools: ["Blender", "Three.js"],
    image: {
      src: "media/race/race-poster.webp",
      alt: "A frame from the three-car racing scene created in Blender.",
      width: 1280,
      height: 720,
    },
    imageCaption: "Blender render",
    url: "#motion",
    linkLabel: "Watch and explore",
  },
];

export const featuredProjects = projects.filter((project) => project.featured);
export const galleryProjects = projects.filter((project) => !project.featured);
