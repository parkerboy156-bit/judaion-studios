/* ------------------------------------------------------------------
   THE NARRATIVE — shared data
   Single source of truth imported by BOTH TheNarrativeClient (desktop)
   and NarrativeMobile. Change copy / images here once; both pick it up.
------------------------------------------------------------------- */

export const KICKER = "BEFORE I BUILT BRANDS,";
export const CENTER_LINE = "SECT.1 THE PRINCIPLES";

/* ---- SECT.2 THE LEADERSHIP (bio) — shared by desktop + mobile ---- */
export const BIO_LABEL = "Sect.2 The Leadership";
export const BIO_KICKER = "ZION.JUDAH";
export const BIO_NAME = "PARKER";
export const BIO_ROLE = "Chief Creative Officer";

export const BIO_PARAGRAPHS = [
  "I am the architect behind JUDAION Studios. My methodology begins with full extraction, sitting inside a founder’s vision until its structural truth is legible, all before a single asset gets built.",
  "My standards are non-negotiable, nothing decorative and nothing that won’t hold at scale. My studio operates as a one-man studio by design, not by limitation, every identity that leaves this monolith has been carried, structurally, from the very first extraction to final handover, by my own hand.",
  "I am nineteen. The studio was not built by an agency, a team or a name inherited from anyone instead it was built by one person who decided, early, that permanence was worth more than noise. What leaves this studio carries that decision in it.",
];

/* corner controls both the title column AND its paired body box (desktop).
   Mobile ignores corner/side/w/h and just stacks in array order. */
export type Title = {
  index: string;
  word: string;
  corner: "tl" | "tr" | "bl" | "br";
  side: "left" | "right";
  w: string;
  h: string;
  body: string;
  image: string; // desktop hover plate (landscape)
  mobileImage?: string; // portrait-optimised background for the mobile stage; falls back to `image`
};

export const TITLES: Title[] = [
  {
    index: "01",
    word: "REFORMATION",
    corner: "tl",
    side: "left",
    w: "55rem",
    h: "16rem",
    image: "/narrative-01.avif",
    mobileImage: "/narrative-01-mobile.avif",
    body: "Before JUDAION, there was a lifestyle governed by outside forces, the likes of impulses, habits and distractions were all in control of the wheel. The reformation began as a personal one: strip away what wasn't essential, install discipline where there had only been drift. JUDAION — the convergence of Zion and Judah — was the first name given to that reformation. Before it built identities for others, it was the identity being built.",
  },
  {
    index: "02",
    word: "THE FORM",
    corner: "bl",
    side: "left",
    w: "55rem",
    h: "16rem",
    image: "/narrative-02.avif",
    mobileImage: "/narrative-02-mobile.avif",
    body: "The discipline that rebuilt a life is the same discipline that now rebuilds brands. Hack away at the unessential until only the true structure remains, that's what makes a mark legible and what makes it last. This studio doesn't chase trends because permanence was never optional in the first place. It was the whole point.",
  },
  {
    index: "03",
    word: "PARTNERSHIP",
    corner: "tr",
    side: "right",
    w: "55rem",
    h: "16rem",
    image: "/narrative-03.avif",
    mobileImage: "/narrative-03-mobile.avif",
    body: "A vision handled without care is a vision at risk. I know exactly what that feels like, I built this studio so my clients never do. Every engagement starts with full extraction, not a brief skimmed for keywords. I carry the structural weight of the creative side of your business — the load-bearing wall — so you can run operations without wondering if the foundation will hold.",
  },
  {
    index: "04",
    word: "MONOLITH",
    corner: "br",
    side: "right",
    w: "55rem",
    h: "16rem",
    image: "/narrative-04.avif",
    mobileImage: "/narrative-04-mobile.avif",
    body: "A monolith doesn't reference anything. It doesn't chase the moment or borrow authority from what's around it, it simply holds its shape while everything else cycles through. That's the reference point here, 'not built to be current, built to be permanent'. A brand should be able to stand in any era and still read as itself.",
  },
];

/* map v from [a,b] onto [0,1], clamped */
export const clamp01 = (v: number, a: number, b: number) =>
  Math.min(1, Math.max(0, (v - a) / (b - a)));
