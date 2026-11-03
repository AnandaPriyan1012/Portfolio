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
        status: "Original film and exact contribution credits to be supplied.",
      },
      {
        id: "farewell-video",
        label: "Farewell video",
        category: "Video",
        status: "Original film and exact contribution credits to be supplied.",
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
    mediaNote: "Original videos and thumbnails coming soon.",
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
    heading: "A conversation, soon.",
    description:
      "Verified contact details haven’t been added yet. Email and social links will appear here once supplied.",
    email: null as string | null,
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
      "Trailers, films and creative work. Original media and exact contribution credits will be added as they are supplied.",
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
    note: "Verified email and social links will be added here.",
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
      "Open AccuFlow’s project story. Its description, contribution details and current stage are awaiting confirmation.",
    action: "Explore AccuFlow",
    target: "accuflow",
  },
] as const;

export const openingQuestions = heroQuestions;

export const projectStatus: Record<Project["id"], string> = {
  cirs: "Live website",
  community: "Volunteer work · since 2023",
  accuflow: "Details awaiting confirmation",
  creative: "Work collection",
  airkart: "Student project",
};

export const accuflowStages = [
  {
    id: "idea",
    title: "The idea",
    body: "AccuFlow’s verified description has not yet been supplied. This space will introduce the idea in Ananda’s own words.",
  },
  {
    id: "problem",
    title: "The problem",
    body: "The intended audience, problem statement and supporting context are awaiting confirmation.",
  },
  {
    id: "contribution",
    title: "My contribution",
    body: "Exact responsibilities, individual contributions and any collaborators are awaiting confirmation.",
  },
  {
    id: "how-it-works",
    title: "How it works",
    body: "Verified features and an explanation of how the project works have not yet been supplied. No capabilities are claimed here.",
  },
  {
    id: "process",
    title: "The process",
    body: "Genuine drafts, project decisions, iterations and process notes will be added when supplied.",
  },
  {
    id: "stage",
    title: "Current stage",
    body: "The current project stage is awaiting confirmation. This page does not imply a live product, completed build or measured results.",
  },
  {
    id: "lessons",
    title: "What I learned",
    body: "Personal reflections and lessons will be added in Ananda’s own words when supplied.",
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
        "A website for CIRS, with the Admissions page among the details to explore. The original brief and specific constraints are awaiting verified project notes.",
      role: "Web-development and creative work for the official CIRS website, including the Admissions page. Exact contribution details and collaborators will be added with the full project notes.",
      process:
        "The homepage and Admissions screens shown here were captured from the live public website on 3 November 2026. Original process notes and earlier iterations have not been supplied.",
      outcome:
        "The website is available at cirschool.org. No traffic, admission or conversion results have been provided.",
      lessons:
        "Personal reflections and specific lessons will be added with the project write-up.",
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
    mediaStatus: "Approved community photographs and work samples pending.",
    story: {
      challenge:
        "Support community service at Vallalar Sathya Dharmasalai through digital storytelling, social media and the organization’s website.",
      role: "Social Media & Technology Head, serving voluntarily since 2023. My work includes digital storytelling, social media and work on the organisation’s website.",
      process:
        "Digital storytelling, social-media work and work on the organisation’s website. Approved samples and specific process notes will show the work in more detail.",
      outcome:
        "Ongoing volunteer involvement since 2023. Work includes the organisation’s website; its verified URL and project stage have not been supplied. No donation, reach or beneficiary statistics are claimed.",
      lessons:
        "Personal reflections on this volunteer work will be added after confirmation. The guiding idea here is to place digital tools in service of people.",
    },
  },
  {
    id: "accuflow",
    chapter: "03",
    category: "EXPLORE",
    title: "AccuFlow",
    subtitle: "Project documentation in progress.",
    description:
      "AccuFlow is a featured project. Its purpose, my contribution and its current stage still need to be confirmed.",
    tags: ["Project", "Details pending"],
    accent: "#8da99e",
    mediaStatus: "Verified project visuals and description pending.",
    story: {
      challenge:
        "The project’s purpose, intended audience and problem statement have not yet been supplied.",
      role: "My exact contribution, responsibilities and collaborators are awaiting confirmation.",
      process:
        "Genuine drafts, decisions and process notes will be added when supplied.",
      outcome:
        "The current stage and any verified outcomes are awaiting confirmation. No capabilities or results are claimed.",
      lessons:
        "Personal reflections and lessons will be added in my own words when supplied.",
    },
  },
  {
    id: "creative",
    chapter: "04",
    category: "CREATE",
    title: "Creative Studio",
    subtitle: "Ideas, frame by frame.",
    description:
      "Trailers, films and editing work. A collection of six named pieces, with original media and exact contribution credits awaiting upload.",
    tags: ["Storytelling", "Film & editing"],
    accent: "#b69d85",
    mediaStatus: "Original videos, thumbnails and project credits pending.",
    story: {
      challenge:
        "Bring creative storytelling work into a collection that gives each project room to be understood. Individual project briefs are still to be supplied.",
      role: "Creative storyteller. Exact TED-Ed, TEDx and editing contributions, collaborators and credits are awaiting verification.",
      process:
        "Original videos, timelines and behind-the-scenes material will replace the labelled editorial placeholders.",
      outcome:
        "This collection reserves space for the work. No release, audience, affiliation or production results are claimed without project details.",
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
      "A smaller student project exploring the trade-off between dispatching now and waiting to share a journey.",
    tags: ["Student project", "Concept"],
    accent: "#b6a189",
    mediaStatus: "Smaller student project · all demo figures are illustrative.",
    story: {
      challenge:
        "Explore the conceptual trade-off between dispatching a delivery immediately and waiting to batch deliveries together.",
      role: "A student project. Development stage, team and exact responsibilities are awaiting confirmation.",
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
    title: "From “what if” to something you can use.",
    description:
      "I’m a student developer. My work includes web development and creative work for the CIRS website, including Admissions, and work on the organisation’s website at Vallalar Sathya Dharmasalai, where I serve voluntarily as Social Media & Technology Head.",
    detail: "Websites, experiments and ideas taking shape.",
  },
  {
    id: "storyteller",
    label: "Storyteller",
    title: "A different way to make an idea move.",
    description:
      "I’m a creative storyteller with TED-Ed, TEDx and editing work to share. Digital storytelling is also part of my voluntary work for Vallalar Sathya Dharmasalai.",
    detail: "Stories, frames and the connections between them.",
  },
  {
    id: "swimmer",
    label: "Swimmer",
    title: "There’s a life beyond the screen.",
    description:
      "I’m a swimmer, too. The Chinmaya Gaurav Award for Excellence in Swimming is one part of that story.",
    detail: "A different lane. The same curiosity.",
  },
  {
    id: "curious",
    label: "Curious Mind",
    title: "Always another question worth asking.",
    description:
      "I’m a student and an aspiring entrepreneur, curious about the connections between building, storytelling and service. My projects are places to keep asking questions and making something real.",
    detail: "Learning, wondering and making room for what’s next.",
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
  {
    id: "swimming",
    title: "Chinmaya Gaurav Award",
    distinction: "Excellence in Swimming",
    description:
      "Recognition for Excellence in Swimming. Certificate, award date and supporting context are awaiting upload.",
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
  posterUrl: string | null;
  caption: string;
  credits: string | null;
}[] = [
  {
    id: "cck-trailer",
    title: "CCK trailer",
    type: "Trailer",
    videoUrl: null,
    credits: null,
    posterUrl: null,
    caption: "Original film and exact contribution credits to be supplied.",
  },
  {
    id: "farewell-video",
    title: "Farewell video",
    type: "Video",
    videoUrl: null,
    credits: null,
    posterUrl: null,
    caption: "Original film and exact contribution credits to be supplied.",
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
  "Original films or approved embed URLs for CCK trailer, Farewell video, Masquerade trailer, Vantara, TED-Ed 2026 and CIRSMUN 2026; approved thumbnails, dates and exact contribution credits.",
  "Approved Vallalar Sathya Dharmasalai photographs, digital-storytelling and social-media samples, website screenshots and its verified URL when ready; specific process notes and any verified outcomes you wish to publish.",
  "AccuFlow’s verified description, intended audience, contribution, current stage, genuine visuals and personal reflections; Dhvanyartha’s verified description, status and images.",
  "Certificates and context for all three recognitions, including the organizer details for ICSC and award dates.",
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
    previewUrl: null,
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
    previewUrl: null,
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
          "A student developer, with the CIRS website, website work for Vallalar Sathya Dharmasalai and the featured AccuFlow project. AccuFlow’s details are awaiting confirmation.",
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
          "TED-Ed, TEDx and editing work belong to the creative-production collection. Original media and exact contribution credits are awaiting upload.",
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
        description:
          "A swimmer and recipient of the Chinmaya Gaurav Award for Excellence in Swimming. The certificate and additional award context are to be supplied.",
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
          "AccuFlow is one of the featured projects. Its verified description, contribution details and current stage are awaiting confirmation.",
        action: "Open AccuFlow",
        project: "accuflow",
      },
      {
        id: "creative",
        label: "Create",
        title: "Give the idea a different form.",
        description:
          "A creative-production space for TED-Ed, TEDx and editing work. Original videos and credits are still to be supplied.",
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
    note: "The idea, the thinking, the process. A dedicated place for the full story, once the details are confirmed.",
    eyebrow: "A key project · details to come",
    stage: "Project stage awaiting confirmation",
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
    second: "The film comes next.",
    note: "Original work, exact contributions and credits will be shared here once supplied.",
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
    "The full story will document my exact contributions, decisions and lessons. The screens here are captured from the live website; they are not invented mockups.",
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
