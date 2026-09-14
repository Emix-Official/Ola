export type ProjectImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type Project = {
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
  preview?: "nfc";
};

export const projects: Project[] = [
  {
    id: "time-tableau",
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
    name: "NFC Bridge",
    category: "Hardware / System Utility",
    status: "Prototype",
    preview: "nfc",
    headline:
      "A tap on your phone. An action on your computer.",
    summary:
      "A prototype connecting a phone’s NFC reader to a desktop app over USB, with the goal of turning scanned tags into configurable computer actions.",
    story:
      "The idea is to use hardware already in your pocket. Scan a tag on your phone, pass it to the desktop app, and map it to a workflow such as starting a timer or opening a set of apps.",
    url: "https://github.com/Emix-Official/NFC-Bridge-Desktop",
    linkLabel: "Explore repository",
  },
  {
    id: "senseaid",
    name: "SenseAid",
    category: "Web / Accessibility",
    status: "University prototype",
    headline:
      "Exploring more accessible education for students.",
    summary:
      "A first-year university project exploring tools and resources for students with disabilities.",
    story:
      "We initially explored AI integration, but that part remained unfinished. I implemented features within the site itself so we could share a working prototype. It is one of my early projects and a useful record of what I was learning.",
    image: {
      src: "projects/senseaid.png",
      alt: "SenseAid homepage with accessible education resources and support categories.",
      width: 2048,
      height: 1140,
    },
    url: "https://senseaid-site.web.app",
    linkLabel: "Visit live deployment",
  },
  {
    id: "markos",
    name: "MarkOS",
    category: "Systems / Desktop Architecture",
    status: "Experimental",
    headline: "Custom desktop environment with unified system utilities.",
    summary:
      "An exploratory desktop environment built in Python featuring dedicated process launching, custom startup audio choreography, and a responsive modular dashboard.",
    story:
      "Exploration into windowing orchestration, thread-safe background process monitoring, and custom visual identity design across a standalone desktop surface.",
    url: "https://github.com/Emix-Official/MarkOS",
    linkLabel: "View source on GitHub",
  },
  {
    id: "geo-auth",
    name: "GeoAuth",
    category: "Security / Web Applications",
    status: "Completed",
    headline: "Geofenced registration and access-controlled portal.",
    summary:
      "Secure registration architecture with perimeter-based access control, administrative telemetry, and real-time state synchronization.",
    story:
      "Engineered with Supabase authentication and geolocation boundaries to validate perimeter-specific permissions before granting application access.",
    url: "https://dummy-reg-app.vercel.app/",
    linkLabel: "Launch portal",
  },
  {
    id: "weather-app",
    name: "Weather App",
    category: "Frontend / API Integration",
    status: "Completed",
    headline: "Location-aware meteorological client with dynamic UI themes.",
    summary:
      "Responsive forecast dashboard providing precise meteorological metrics, real-time geolocation tracking, and dynamic visual states.",
    story:
      "Developed as a classroom assignment where requirements called for a minimal interface, but expanded into an end-to-end weather station client with asynchronous data pipelines.",
    url: "https://emixwlrd-weather.netlify.app",
    linkLabel: "View application",
  },
];
