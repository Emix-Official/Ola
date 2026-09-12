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
    id: "nfc-bridge",
    name: "NFC Bridge",
    category: "Hardware / System Utility",
    status: "Prototype",
    preview: "nfc",
    headline:
      "Relaying physical NFC credentials from mobile to desktop environments.",
    summary:
      "A cross-device communication utility that captures NFC tag payloads via an Android phone and routes them directly to desktop workflows over USB serial.",
    story:
      "Built to bridge the gap between phone NFC readers and desktop terminals without requiring expensive dedicated hardware peripherals. Uses lightweight packet serialization for zero-latency input emulation.",
    url: "https://github.com/Emix-Official",
    linkLabel: "Explore repository",
  },
  {
    id: "senseaid",
    name: "SenseAid",
    category: "AI / Accessibility",
    status: "Production",
    headline:
      "Multimodal assistive technology for deaf and mute communication.",
    summary:
      "Web platform engineered for the deaf, mute, and visually impaired community featuring real-time sign language recognition powered by computer vision models.",
    story:
      "Served as backend lead and ML engineer, integrating MediaPipe gesture tracking with Firebase real-time infrastructure to deliver sub-100ms inference directly in browser clients.",
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
