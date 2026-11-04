/**
 * Portfolio copy and verified facts live here.
 * Keep unavailable media and unverified claims explicitly marked until supplied.
 */
export interface Project {
  id: "cirs" | "community" | "accuflow" | "creative" | "airkart";
  chapter: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  accent: string;
  story: {
    challenge: string;
    role: string;
    process: string;
    outcome: string;
    lessons: string;
  };
  link?: string;
  mediaStatus: string;
}

export const siteContent = {
  name: "Ananda Priyan",
  initials: "AP",
  title: "Ananda Priyan — Selected work",
  tagline: "Student. Builder. Storyteller.",
  heroDescription:
    "I build digital experiences, tell stories and work on ideas that connect people.",
  heroHeadline: "I like making things matter.",
  heroEyebrow: "Ananda Priyan · Student & multidisciplinary creator",
  availability: "Open to ideas & conversations",
  footerCredit: "Built with AI assistance for Ananda Priyan.",
  seoDescription:
    "The portfolio of Ananda Priyan: student developer, creative storyteller and swimmer. Explore CIRS, community work at Vallalar Sathya Dharmasalai, AccuFlow and more.",
  nav: [
    { label: "Work", href: "#work" },
    { label: "About", href: "#about" },
    { label: "Recognition", href: "#recognition" },
  ],
  intro:
    "I build digital experiences, tell stories and work on ideas that connect people.",
  hero: {
    eyebrow: "Ananda Priyan · Student & multidisciplinary creator",
    firstName: "ANANDA",
    lastName: "PRIYAN",
    roles: "Student. Builder. Storyteller.",
    description:
      "I build digital experiences, tell stories and work on ideas that connect people.",
    primaryCta: "Explore the work",
    secondaryCta: "The Story Behind It",
    artworkTitle: "Ideas in Motion",
    artworkCaption: "Curiosity is the starting point. Making is the next move.",
    scrollCue: "A few things I’m putting into the world",
  },
  work: {
    eyebrow: "Selected work",
    title: "Curiosity, made tangible.",
    description:
      "A school’s digital home. Community work with a human purpose. AccuFlow, ready for its own story. Three different projects, connected by the urge to make something meaningful.",
    storyCta: "View the story",
    externalCta: "Visit the website",
  },
  airkart: {
    heading: "One decision. Two journeys.",
    description: "Explore the trade-off between speed and sharing a journey.",
    dispatchLabel: "Dispatch now",
    batchLabel: "Wait and batch",
    dispatchDescription:
      "Dispatching immediately avoids a batching wait, but a dedicated journey can cost more per delivery.",
    batchDescription:
      "Waiting allows deliveries to share a journey, potentially reducing cost per delivery while adding waiting time.",
    illustrativeNote:
      "Conceptual comparison only. These are illustrative trade-offs, not measured AirKart performance or pricing.",
  },
  creative: {
    heading: "Creative Studio",
    description: "A collection of trailers, films and creative work.",
    frames: [
      {
        id: "cck-trailer",
        label: "CCK trailer",
        category: "Trailer",
        status: "Available to watch · Public trailer export, 2:22.",
      },
      {
        id: "farewell-video",
        label: "Farewell video",
        category: "Video",
        status: "Available to watch · Farewell AA.",
      },
      {
        id: "masquerade-trailer",
        label: "Masquerade trailer",
        category: "Trailer",
        status: "Original film and exact contribution credits to be supplied.",
      },
      {
        id: "vantara",
        label: "Vantara",
        category: "Creative work",
        status: "Original film and exact contribution credits to be supplied.",
      },
      {
        id: "ted-ed-2026",
        label: "TED-Ed 2026",
        category: "Creative work",
        status: "Original film and exact contribution credits to be supplied.",
      },
      {
        id: "cirsmun-2026",
        label: "CIRSMUN 2026",
        category: "Creative work",
        status: "Original film and exact contribution credits to be supplied.",
      },
    ],
    mediaNote:
      "Two films available to watch. More original films and credits will follow.",
  },
  community: {
    eyebrow: "Volunteer work · since 2023",
    quote: "Technology means more when it reaches beyond the screen.",
    note: "Voluntary Social Media & Technology Head at Vallalar Sathya Dharmasalai since 2023, working on digital storytelling, social media and the organization’s website.",
  },
  experiments: {
    eyebrow: "The curiosity lab",
    title: "Some ideas are still becoming.",
    description:
      "An open notebook for experiments, questions and what comes next.",
    status: "Details coming soon",
  },
  about: {
    chapter: "06 / BEYOND THE SCREEN",
    eyebrow: "A little more about me",
    title: "More than one lane.",
    description: "The things I make are only part of the story.",
    staticLabel: "Read all four perspectives",
  },
  recognition: {
    eyebrow: "Milestones, not a finish line",
    title: "A little evidence.\nA lot more to explore.",
    description: "A few recognitions from learning, competing and showing up.",
    certificateStatus: "Certificate to be supplied",
  },
  contact: {
    eyebrow: "The next idea starts with a conversation",
    title: "Let’s build something that matters.",
    cta: "Let’s connect",
    heading: "Let’s talk.",
    description: "For a project, a collaboration or a conversation, email me.",
    email: "anandapriyan1012@gmail.com" as string | null,
    socials: [] as { label: string; url: string }[],
    emailPlaceholder: "Email · to be added",
    socialPlaceholder: "Social links · to be added",
  },
  footer: {
    motto: "Designed around curiosity.",
    credit: "Built with AI assistance for Ananda Priyan.",
    backToTop: "Back to the beginning",
  },
};

export const editorialCopy = {
  hero: {
    eyebrow: "Ananda Priyan · Student & multidisciplinary creator",
    first: "I like making",
    second: "things ",
    emphasis: "matter.",
    description:
      "I build digital experiences, tell stories and work on ideas that connect people.",
    cta: "Explore the work",
  },
  selectedWork: {
    label: "Selected work",
    title: "A few things I’ve put myself into.",
    description:
      "A school website, community work and AccuFlow. Different projects, each with its own story.",
  },
  studio: {
    label: "Creative Studio",
    title: "Stories, frame by frame.",
    description:
      "Trailers, films and creative work. Watch CCK trailer and Farewell AA; more original work and exact contribution credits will follow.",
  },
  about: {
    label: "About me",
    title: "More than one lane.",
    description:
      "I’m a student developer, storyteller and swimmer. I also serve voluntarily as Social Media & Technology Head at Vallalar Sathya Dharmasalai, where I’ve been involved since 2023.",
  },
  footer: {
    title: "Let’s build something that matters.",
    description: "A good conversation is a place to start.",
    cta: "Let’s connect",
    note: "anandapriyan1012@gmail.com",
    credit: "Built with AI assistance for Ananda Priyan.",
  },
};

export const heroQuestions = [
  {
    id: "cirs",
    question: "How do you tell a school’s story?",
    response:
      "Explore the CIRS website: a digital home for a learning community, with the Admissions page among the details to discover.",
    action: "Explore CIRS",
    target: "cirs",
  },
  {
    id: "community",
    question: "How can technology help a community reach more people?",
    response:
      "Discover voluntary work at Vallalar Sathya Dharmasalai: digital storytelling, social media and work on the organisation’s website.",
    action: "Explore the community work",
    target: "community",
  },
  {
    id: "accuflow",
    question: "What happens when an idea becomes something real?",
    response:
      "Explore AccuFlow, a product website and interaction prototype for pressure-point information.",
    action: "Explore AccuFlow",
    target: "accuflow",
  },
] as const;

export const openingQuestions = heroQuestions;

export const projectStatus: Record<Project["id"], string> = {
  cirs: "Live website",
  community: "Volunteer work · since 2023",
  accuflow: "Product & interaction prototype",
  creative: "Work collection",
  airkart: "Student project",
};

export const accuflowStages = [
  {
    id: "idea",
    title: "The idea",
    body: "AccuFlow is an exploratory product website and interaction prototype for pressure-point information. It brings a product story and a conversational guide into one web experience.",
  },
  {
    id: "problem",
    title: "The design question",
    body: "How can a visitor move from a broad product introduction to a focused interaction? The prototype explores that journey across an overview, product information, an explanation of the concept and a Try interface.",
  },
  {
    id: "how-it-works",
    title: "In the prototype",
    body: "Six pages organise Home, Product, How It Works, Try It, Business and About. Scroll-linked presentation leads into a conversational pressure-point guide interface. These are prototype interactions, not verified health outcomes.",
  },
  {
    id: "stage",
    title: "Current stage",
    body: "A publicly viewable website prototype. The screens shown here come from the running prototype; they are not a fabricated product render.",
  },
];

export const accuflowChecklist = [
  "A verified project description and the original idea.",
  "The intended audience and the problem being explored.",
  "Your exact role, contribution and any collaborators.",
  "The current stage and verified features, if any.",
  "Genuine screenshots, sketches, drafts or other project visuals.",
  "Your process notes, decisions and personal reflections.",
];

export const projects: Project[] = [
  {
    id: "cirs",
    chapter: "01",
    category: "BUILD",
    title: "CIRS Website",
    subtitle: "A digital home for a learning community.",
    description:
      "Web development and creative work for the official CIRS website, including the Admissions page.",
    tags: ["Website", "Education"],
    accent: "#b6a189",
    link: "https://cirschool.org",
    mediaStatus:
      "Live public website captures · cirschool.org · 3 November 2026.",
    story: {
      challenge:
        "I proposed refreshing our school website to give future students and parents a clearer picture of campus life. The school assembled a team, and Admissions became one of the practical parts of that work: application access, the process and key enquiries needed to be easy to find.",
      role: "Page design and web development with the school’s team, including the Admissions page, layouts and visual direction.",
      process:
        "I focused on campus life and information for future students and parents, refining phone layouts and responding to feedback on images, navigation and text. The Admissions Guide places the registered portal login beside the process guide and directs current enquiries to the Admissions Office.",
      outcome:
        "The official website is live at cirschool.org, with a dedicated Admissions Guide at cirschool.org/admissions.html.",
      lessons: "",
    },
  },
  {
    id: "community",
    chapter: "02",
    category: "GIVE BACK",
    title: "Vallalar Sathya Dharmasalai",
    subtitle: "Volunteer technology and social-media work since 2023.",
    description:
      "Voluntary Social Media & Technology Head since 2023. Digital storytelling, social media and work on the organisation’s website, in service of a community.",
    tags: ["Community service", "Website & storytelling"],
    accent: "#c5a06b",
    link: "https://vallalar-sathya-dharmasalai.vercel.app/en/about/",
    mediaStatus: "Actual About-page capture from the website review preview.",
    story: {
      challenge:
        "After helping prepare and distribute meals, I asked the organisers how else I could contribute. They described limited online reach, which led to work on the website and social media.",
      role: "Social Media & Technology Head, serving voluntarily since 2023. My work includes digital storytelling, social media and work on the organisation’s website.",
      process:
        "The work grew from hands-on service into digital storytelling, social-media management and a website for the organisation. The English and Tamil About-page views shown here come from its public website review preview.",
      outcome:
        "Ongoing voluntary involvement since 2023. The organisation’s website work is available as a public review preview, alongside the digital-storytelling and social-media commitment.",
      lessons: "",
    },
  },
  {
    id: "accuflow",
    chapter: "03",
    category: "EXPLORE",
    title: "AccuFlow",
    subtitle: "An exploratory product website and interaction prototype.",
    description:
      "A six-page product website and conversational interface prototype for pressure-point information.",
    tags: ["Interaction design", "Prototype"],
    accent: "#8da99e",
    link: "https://accuflow-premium-ai.netlify.app",
    mediaStatus:
      "Actual screens from the publicly viewable AccuFlow website prototype.",
    story: {
      challenge:
        "An exploratory product website and interaction prototype for pressure-point information, connecting a product introduction to a conversational guide interface.",
      role: "",
      process:
        "Six pages organise the product story: Home, Product, How It Works, Try It, Business and About. The Try page presents the prototype’s conversational interface.",
      outcome:
        "A publicly viewable website prototype. It is an interaction exploration, with no clinical effectiveness or product results claimed.",
      lessons: "",
    },
  },
  {
    id: "creative",
    chapter: "04",
    category: "CREATE",
    title: "Creative Studio",
    subtitle: "Ideas, frame by frame.",
    description:
      "Trailers, films and editing work. A collection of six named pieces, including two films available through Google Drive.",
    tags: ["Storytelling", "Film & editing"],
    accent: "#b69d85",
    mediaStatus:
      "CCK trailer and Farewell AA available to watch. More films, approved stills and exact credits pending.",
    story: {
      challenge:
        "Bring creative storytelling work into a collection that gives each project room to be understood. Individual project briefs are still to be supplied.",
      role: "Creative storyteller. Exact TED-Ed, TEDx and editing contributions, collaborators and credits are awaiting verification.",
      process:
        "CCK trailer and Farewell AA can be viewed through their original Google Drive players. Timelines, behind-the-scenes material and exact contribution credits are still to be supplied.",
      outcome:
        "Two films are available to watch. No audience, affiliation or production results are claimed without project details.",
      lessons:
        "Project-specific creative decisions and personal reflections will accompany the finished media.",
    },
  },
  {
    id: "airkart",
    chapter: "05",
    category: "IMAGINE",
    title: "AirKart",
    subtitle: "What if the journey could be smarter?",
    description:
      "Long waits for needed items at home led our team to explore faster delivery as a student competition concept. I worked on its website and 3D model; the central question was whether to dispatch immediately or wait to share a journey.",
    tags: ["Student project", "Concept"],
    accent: "#b6a189",
    mediaStatus: "Smaller student project · all demo figures are illustrative.",
    story: {
      challenge:
        "Waiting for needed items at home prompted our team’s student competition concept: could deliveries arrive sooner while keeping journeys affordable? That led to the trade-off between immediate dispatch and batching deliveries together.",
      role: "Website and 3D model for the team’s student venture concept.",
      process:
        "The interactive comparison demonstrates two possible dispatch choices. It is an explanation of a concept, not a simulation using verified operational data.",
      outcome:
        "A concept to investigate further. No operating service, delivery results or verified cost figures are claimed.",
      lessons:
        "The comparison makes one question tangible: how much waiting might be acceptable in exchange for a potentially lower delivery cost? Personal research findings are to be supplied.",
    },
  },
];

export const aboutLanes = [
  {
    id: "builder",
    label: "Builder",
    title: "Websites for school and community.",
    description:
      "My work on the CIRS website includes Admissions. At Vallalar Sathya Dharmasalai, I volunteer as Social Media & Technology Head and work on the organisation’s website.",
    detail: "Websites, experiments and ideas taking shape.",
  },
  {
    id: "storyteller",
    label: "Storyteller",
    title: "Film, editing and digital storytelling.",
    description:
      "My film collection includes the CCK trailer and Farewell AA. Digital storytelling is also part of my voluntary work at Vallalar Sathya Dharmasalai.",
    detail: "Explore the films in Studio.",
  },
  {
    id: "swimmer",
    label: "Swimmer",
    title: "Freestyle and breaststroke.",
    description:
      "I’m a swimmer, too. I started at CIRS in Class 10, focusing on freestyle and breaststroke.",
    detail: "A part of life beyond the screen.",
  },
  {
    id: "curious",
    label: "Curious Mind",
    title: "Ideas to explore, interfaces to test.",
    description:
      "AccuFlow is a product website and interaction prototype. AirKart explores delivery choices. Both are student concepts and early-stage work.",
    detail: "Student concepts and early-stage work.",
  },
];

export const achievements = [
  {
    id: "icsc",
    title: "ICSC 2026",
    distinction: "Silver Honour · Top 1%",
    description:
      "Award and placement supplied by Ananda Priyan. Certificate, organizer details and further context are awaiting upload.",
    certificate: null,
  },
  {
    id: "chemistry",
    title: "International Chemistry Competition 2026",
    distinction: "Gold Honour · Top 2%",
    description:
      "Award and placement supplied by Ananda Priyan. Certificate and further competition context are awaiting upload.",
    certificate: null,
  },
];

export const experiments = [
  {
    id: "dhvanyartha",
    title: "Dhvanyartha",
    description: "Verified description and project image to be added.",
    status: "In the notebook",
    icon: "wave",
  },
];

export const creativeMedia: {
  id: string;
  title: string;
  type: string;
  videoUrl: string | null;
  embedUrl?: string | null;
  posterUrl: string | null;
  caption: string;
  credits: string | null;
}[] = [
  {
    id: "cck-trailer",
    title: "CCK trailer",
    type: "Trailer",
    videoUrl: null,
    embedUrl:
      "https://drive.google.com/file/d/1FXMI8GoosQllewx87S8_lJDXRULukrYA/preview",
    credits: null,
    posterUrl: "/media/cck-trailer-still.jpg",
    caption: "Trailer · Public export, 2:22.",
  },
  {
    id: "farewell-video",
    title: "Farewell video",
    type: "Video",
    videoUrl: null,
    embedUrl:
      "https://drive.google.com/file/d/1zxuYX1UAG8FwYlfYhWP-SAnP4jaRx5MN/preview",
    credits: null,
    posterUrl: "/media/farewell-film-still.jpg",
    caption: "Farewell AA · 4:18.",
  },
  {
    id: "masquerade-trailer",
    title: "Masquerade trailer",
    type: "Trailer",
    videoUrl: null,
    credits: null,
    posterUrl: null,
    caption: "Original film and exact contribution credits to be supplied.",
  },
  {
    id: "vantara",
    title: "Vantara",
    type: "Creative work",
    videoUrl: null,
    credits: null,
    posterUrl: null,
    caption: "Original film and exact contribution credits to be supplied.",
  },
  {
    id: "ted-ed-2026",
    title: "TED-Ed 2026",
    type: "Creative work",
    videoUrl: null,
    credits: null,
    posterUrl: null,
    caption: "Original film and exact contribution credits to be supplied.",
  },
  {
    id: "cirsmun-2026",
    title: "CIRSMUN 2026",
    type: "Creative work",
    videoUrl: null,
    credits: null,
    posterUrl: null,
    caption: "Original film and exact contribution credits to be supplied.",
  },
];

export const assetChecklist = [
  "CIRS desktop and mobile screenshots, including the Admissions page; exact contribution details, collaborators, dates and process notes.",
  "AirKart’s verified description, stage, role and research; any measured figures you want to replace the conceptual comparison.",
  "Original films or approved embed URLs for Masquerade trailer, Vantara, TED-Ed 2026 and CIRSMUN 2026; approved thumbnails, dates and exact contribution credits for the film collection.",
  "Approved Vallalar Sathya Dharmasalai photographs, digital-storytelling and social-media samples, website screenshots and its verified URL when ready; specific process notes and any verified outcomes you wish to publish.",
  "AccuFlow’s verified description, intended audience, contribution, current stage, genuine visuals and personal reflections; Dhvanyartha’s verified description, status and images.",
  "Certificates and context for both academic recognitions, including the organizer details for ICSC and award dates.",
  "A verified contact email, social profile URLs and an optional approved portrait.",
  "Any personal process notes and lessons you want to add to the project stories.",
  "Genuine project drafts, sketches and before-and-after images for the messy-version view and comparison slider.",
];

export const projectAssets: Record<
  Project["id"],
  {
    previewUrl: string | null;
    mobilePreviewUrl?: string | null;
    admissionsUrl?: string | null;
    previewCaption?: string;
    draftUrl: string | null;
    beforeUrl: string | null;
    afterUrl: string | null;
  }
> = {
  cirs: {
    previewUrl: "/media/cirs-home-desktop.webp",
    mobilePreviewUrl: "/media/cirs-home-mobile.webp",
    draftUrl: null,
    beforeUrl: null,
    afterUrl: null,
    admissionsUrl: "/media/cirs-admissions.webp",
  },
  accuflow: {
    previewUrl: "/media/accuflow-prototype-desktop.webp",
    mobilePreviewUrl: "/media/accuflow-prototype-mobile.webp",
    previewCaption: "Actual guide interface · internal website prototype",
    draftUrl: null,
    beforeUrl: null,
    afterUrl: null,
  },
  airkart: {
    previewUrl: null,
    draftUrl: null,
    beforeUrl: null,
    afterUrl: null,
  },
  creative: {
    previewUrl: null,
    draftUrl: null,
    beforeUrl: null,
    afterUrl: null,
  },
  community: {
    previewUrl: "/media/vallalar-website-desktop.webp",
    mobilePreviewUrl: "/media/vallalar-website-mobile.webp",
    previewCaption: "Existing website review preview · About page",
    draftUrl: null,
    beforeUrl: null,
    afterUrl: null,
  },
};

export const experienceContent = {
  desk: {
    eyebrow: "A living desk of ideas",
    footerHint: "Pick something up. See where it takes you.",
  },
  routes: [
    {
      id: "built",
      number: "01",
      title: "See what I’ve built",
      description: "Websites, experiments and ideas taking shape.",
      target: "work",
    },
    {
      id: "stories",
      number: "02",
      title: "Follow the stories",
      description: "Explore the creative side, frame by frame.",
      target: "creative",
    },
    {
      id: "person",
      number: "03",
      title: "Meet the person",
      description: "A builder, a storyteller, a swimmer. More than one lane.",
      target: "about",
    },
  ] as const,
  decision: {
    eyebrow: "A small AirKart thought experiment",
    title: "One order. Your call.",
    description:
      "An order is ready. Send it now, or wait for another order to share the journey?",
    options: [
      {
        id: "now",
        label: "Send the drone now",
        wait: 0,
        cost: 8,
        result:
          "No batching wait. A dedicated journey uses more demo credits per order.",
      },
      {
        id: "batch",
        label: "Wait for another order",
        wait: 5,
        cost: 5,
        result:
          "A five-minute batching wait. Sharing the journey uses fewer demo credits per order.",
      },
    ] as const,
    disclaimer:
      "Illustrative only: 0 or 5 minutes of batching wait and 8 or 5 demo credits. These are invented teaching values, not AirKart prices, measured performance or a live drone service.",
    perspectives: [
      {
        id: "technology",
        label: "Technology",
        title: "When should a journey begin?",
        description:
          "The dispatch decision connects waiting time, route planning and the possibility of grouping orders. The interaction explores that question without claiming a working dispatch system.",
      },
      {
        id: "business",
        label: "Business",
        title: "What does each journey cost?",
        description:
          "Sharing a journey could reduce cost per order. Whether that trade-off works would need real operating costs, demand patterns and research.",
      },
      {
        id: "people",
        label: "People",
        title: "How much waiting feels reasonable?",
        description:
          "A cheaper journey can still be the wrong choice for someone who needs an order sooner. The useful question is what the person receiving it values.",
      },
    ] as const,
  },
  drafts: {
    label: "Show me the messy version",
    polishedLabel: "Back to the polished version",
    unavailableTitle: "The notebook is waiting for its pages.",
    unavailableDescription:
      "Original drafts, sketches and behind-the-scenes notes haven’t been supplied yet. This view marks where they will go; it does not recreate a personal process or invent an origin story.",
  },
};

export const discoveryContent = {
  constellation: {
    eyebrow: "The connections",
    title: "Nothing exists in isolation.",
    description: "Five interests. More than one way to connect the dots.",
    mapLabel: "Map",
    listLabel: "List",
    hint: "Choose a point to follow its thread.",
    nodes: [
      {
        id: "coding",
        label: "Coding",
        number: "01",
        x: 24,
        y: 25,
        title: "Making an idea tangible.",
        description:
          "A student developer, with the CIRS website, website work for Vallalar Sathya Dharmasalai and the exploratory AccuFlow prototype.",
        action: "Explore CIRS",
        project: "cirs",
      },
      {
        id: "service",
        label: "Service",
        number: "02",
        x: 75,
        y: 20,
        title: "Putting tools in service of people.",
        description:
          "Voluntary Social Media & Technology Head at Vallalar Sathya Dharmasalai since 2023. The work includes digital storytelling, social media and work on the organisation’s website.",
        action: "Explore the volunteer work",
        project: "community",
      },
      {
        id: "filmmaking",
        label: "Filmmaking",
        number: "03",
        x: 83,
        y: 67,
        title: "Giving an idea a sequence.",
        description:
          "TED-Ed, TEDx and editing work belong to the creative-production collection. CCK trailer and Farewell AA are available to watch; exact contribution credits will follow.",
        action: "Explore creative production",
        project: "creative",
      },
      {
        id: "economics",
        label: "Economics",
        number: "04",
        x: 43,
        y: 82,
        title: "Every choice has a trade-off.",
        description:
          "AirKart is a smaller student project exploring dispatching now or waiting to share a journey. Its waiting-time and cost comparison is conceptual, not measured service data.",
        action: "Explore AirKart",
        project: "airkart",
      },
      {
        id: "swimming",
        label: "Swimming",
        number: "05",
        x: 17,
        y: 65,
        title: "Another lane to explore.",
        description: "A swimmer, with a life beyond the screen.",
        action: "Meet the swimmer",
        project: null,
      },
    ] as const,
  },
  tour: {
    eyebrow: "The 60-second tour",
    note: "Silent by design. Explore at your own pace.",
    complete: "Tour complete",
    completeDescription: "Follow any thread that caught your curiosity.",
    done: "Back to exploring",
    manual: "Manual mode · motion preference respected",
    slides: [
      {
        id: "cirs",
        label: "Build",
        title: "How do you tell a school’s story?",
        description:
          "Start with the CIRS website, a digital home for a learning community. The site is available at cirschool.org.",
        action: "Open the CIRS story",
        project: "cirs",
      },
      {
        id: "community",
        label: "Give back",
        title: "Build for a human purpose.",
        description:
          "Voluntary Social Media & Technology Head at Vallalar Sathya Dharmasalai since 2023: digital storytelling, social media and work on the organisation’s website.",
        action: "Read the volunteer story",
        project: "community",
      },
      {
        id: "accuflow",
        label: "Explore",
        title: "An idea deserves its own story.",
        description:
          "AccuFlow is a product website and interaction prototype for pressure-point information. Explore its actual prototype screens.",
        action: "Open AccuFlow",
        project: "accuflow",
      },
      {
        id: "creative",
        label: "Create",
        title: "Give the idea a different form.",
        description:
          "A creative-production space for TED-Ed, TEDx and editing work. Watch CCK trailer and Farewell AA; more original films and credits will follow.",
        action: "Open creative production",
        project: "creative",
      },
      {
        id: "swimming",
        label: "Beyond the screen",
        title: "There is more than one lane.",
        description:
          "Student. Builder. Storyteller. Swimmer. Meet the person behind these connected interests.",
        action: "Meet the swimmer",
        project: null,
      },
    ] as const,
  },
};

/** Section display copy and interface explanations, kept alongside the facts. */
export const interfaceCopy = {
  routes: { eyebrow: "No right way in.", title: "Follow your curiosity." },
  workHeading: { first: "Curiosity,", second: "made tangible." },
  communityHeading: { first: "Digital tools.", second: "Human purpose." },
  creativeHeading: { first: "Ideas,", second: "frame by frame." },
  aboutHeading: { first: "More than", second: "one ", emphasis: "lane." },
  recognitionHeading: { first: "A few milestones.", second: "Still moving." },
  secondary: {
    eyebrow: "Projects & Experiments",
    first: "A little room for",
    second: "“what if?”",
    description:
      "Smaller projects, open questions and ideas still taking shape.",
  },
  accuflow: {
    note: "A product story that leads into an interaction prototype.",
    eyebrow: "Product & interaction design",
    stage: "Website prototype",
  },
  questions: {
    eyebrow: "It starts with a question.",
    signature: "I’m Ananda.",
    continuation: "I build to find out.",
  },
  contact: {
    first: "Let’s build something",
    second: "that ",
    emphasis: "matters.",
    invitation: "Curiosity is a pretty good place to start.",
    privacy: "No form or data collection is active on this page.",
  },
  media: {
    first: "The frame is ready.",
    second: "Choose a film.",
    note: "CCK trailer and Farewell AA are available to watch. More original films and exact credits will follow.",
  },
  lab: {
    title: "What if orders arrive more often?",
    description:
      "A simplified model: evenly spaced orders, one shared journey, a fixed 12-credit trip and 2 credits per order. Real routing, capacity and service constraints are excluded.",
    note: "Illustrative teaching model, not AirKart performance. Average wait = (batch size − 1) × arrival interval ÷ 2. Credits per order = 2 + 12 ÷ batch size. Immediate individual dispatch would cost 14 demo credits in this separate model.",
  },
  askWork: [
    { key: "challenge" as const, label: "What was the challenge?" },
    { key: "process" as const, label: "What went into it?" },
    { key: "lessons" as const, label: "What did you learn?" },
  ],
};

export const directorsCut = {
  title: "Director’s cut",
  credits: null as string | null,
  videoUrl: null as string | null,
  posterUrl: null as string | null,
  caption: "The original director’s montage has not yet been supplied.",
};

/** Public scroll-story copy. Animation timing lives separately in useScrollStory.ts. */
export const scrollStoryCopy = {
  introduction:
    "I build for my school and my community: web development for CIRS, and volunteer technology and social-media work for Vallalar since 2023.",
  cirsRole:
    "My work spans web development and creative work for my school, including the Admissions page.",
  cirsContext:
    "Admissions brings the registered portal, the application process and key enquiries into one guide, with current availability and assessment arrangements confirmed by the school.",
  captions: [
    { label: "The work", text: "Web development and creative work for CIRS." },
    {
      label: "One focus",
      text: "The Admissions page, as part of the school’s digital experience.",
    },
    {
      label: "The source",
      text: "A real capture of the public school website.",
    },
  ],
};

export const communityStory = {
  purposeLabel: "The purpose",
  purpose: "Supporting community work at Vallalar Sathya Dharmasalai.",
  role: "Social Media & Technology Head",
  tenure: "Serving voluntarily since 2023.",
  contributions: [
    "Digital storytelling",
    "Social-media work",
    "Work on the organisation’s website",
  ],
  contributionLabel: "My contribution",
  editorNote:
    "Add the organisation’s approved purpose, one real communication challenge, specific work samples and Ananda’s reasoning. Do not infer impact statistics.",
};
