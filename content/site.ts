/**
 * All home page copy and data. Facts come from the current skinrockofficial.com.
 * Rules: no em or en dashes anywhere (enforced by tests/unit/content.test.ts).
 * Values marked `pending: true` conflict on the current site and need client confirmation.
 */

export type SiteImage = { src: string; width: number; height: number; alt: string };

const img = (file: string, width: number, height: number, alt: string): SiteImage => ({
  src: `/images/${file}`,
  width,
  height,
  alt,
});

const images = {
  alpsSlate: img("alps-slate.jpg", 2000, 1863, "Skinrock slate veneer covering a living room wall beside a window with a view of snowy Alpine peaks"),
  onyxColumn: img("onyx-column.jpg", 1500, 2000, "Backlit translucent Skinrock stone column glowing amber with dark veining"),
  litTable: img("lit-table.jpg", 2000, 1500, "Large dining table topped with backlit translucent Skinrock stone in a dark event room"),
  darkBath: img("dark-bath.jpg", 2000, 1477, "Bathroom clad floor to ceiling in dark grey Skinrock slate veneer"),
  stairHall: img("stair-hall.jpg", 1500, 2000, "Stairwell with grey Skinrock slate veneer walls and recessed linear lights"),
  copperWall: img("copper-wall.jpg", 1500, 2000, "Hallway wall in copper toned Skinrock slate veneer next to a wooden door"),
  facadeCorner: img("facade-corner.jpg", 2000, 1500, "Building corner clad outdoors in large grey green Skinrock slate panels"),
  sauna: img("sauna.jpg", 2000, 1500, "Spa relaxation room with a flowing veined Skinrock stone feature wall"),
  streetWall: img("street-wall.jpg", 2000, 1125, "Outdoor retaining wall along a street finished in grey Skinrock slate veneer"),
  lobby: img("lobby.jpg", 1500, 2000, "Hotel lounge with a backlit Skinrock stone ceiling panel and stone clad walls"),
  kitchenIsland: img("kitchen-island.jpg", 2000, 1244, "Kitchen island and tall cabinets faced with dark Skinrock slate veneer"),
  backlitBath: img("backlit-bath.jpg", 2000, 1500, "Bathroom vanity framed by backlit translucent Skinrock quartzite panels"),
  chaletKitchen: img("chalet-kitchen.jpg", 2000, 1500, "Chalet kitchen under timber beams with a Skinrock slate wall"),
  bedroom: img("bedroom.jpg", 2000, 1500, "Bedroom with a Skinrock slate veneer wall behind an upholstered headboard"),
  fireplace: img("fireplace.jpg", 1475, 2000, "Double sided fireplace wrapped in marbled Skinrock stone veneer"),
  slateCloseup: img("slate-closeup.jpg", 780, 840, "Close up of Skinrock slate veneer showing copper, rose and grey mineral texture"),
  slateSample: img("slate-sample.jpg", 800, 600, "Skinrock Swiss Valley Grey stone veneer sample with fine silver lines"),
  quartziteSample: img("quartzite-sample.jpg", 800, 600, "Skinrock Arctic Storm stone veneer sample with soft grey banding"),
  marbleSample: img("marble-sample.jpg", 800, 600, "Skinrock Atlantic White stone veneer sample with warm golden veins"),
  acousticSample: img("acoustic-sample.jpg", 800, 600, "Skinrock acoustic panels with slatted stone faces in light and dark tones"),
  og: img("og.jpg", 1200, 630, "Skinrock slate veneer wall in an Alpine home"),
} satisfies Record<string, SiteImage>;

/** Values that conflict on the current site. Defined once here; everything else derives from them. */
const specs = {
  thickness: { min: 1.5, max: 3, value: "1.5 to 3 mm", pending: true },
  weight: { kg: 2.8, value: "≈2.8 kg/m²", pending: true },
  format: { value: "120 × 250 cm", pending: true },
  headquarters: { value: "Chur", pending: true },
};

export const site = {
  name: "Skinrock",
  legalName: "Skinrock Official AG",
  url: "https://skinrockofficial.com",
  tagline: "Real Stone. Ultra Thin. Flexible. Translucent.",
  copyrightYear: 2026,

  nav: {
    links: [
      { label: "Stones", href: "#collection" },
      { label: "Projects", href: "#projects" },
      { label: "Light", href: "#light" },
      { label: "Specs", href: "#proof" },
      { label: "Studio", href: "#footer" },
    ],
    cta: { label: "Request samples", href: "#samples" },
  },

  hero: {
    eyebrow: "Natural stone veneer",
    headline: "Real stone. Thin enough to let light through.",
    accentWord: "light",
    lede: "Experience the next generation of natural stone surfaces. Engineered to combine the timeless beauty of genuine stone with exceptional flexibility, lightweight performance, and innovative design freedom for extraordinary spaces.",
    image: images.alpsSlate,
  },

  manifesto: ["Stone.", "Bends.", "Glows.", `${specs.thickness.min} mm.`],
  manifestoNotes: [
    "Split from the block. Every sheet unique.",
    "Follows curves and complex surfaces.",
    "Selected stones are translucent when backlit.",
    `Thin from ${specs.thickness.min} mm. Cuts with standard diamond tools.`,
  ],

  flex: {
    kicker: "Flexible",
    title: "It bends. It is still stone.",
    body: "A layer of real stone, split from the block. It follows curves and complex surfaces, cuts with standard diamond tools and works with many substrates.",
    stats: [
      { value: specs.thickness.min, decimals: 1, unit: "mm", label: "Thin from" },
      { value: specs.weight.kg, decimals: 1, unit: "kg/m²", label: "Approximate weight" },
      { value: 42, decimals: 0, unit: "", label: "Stones in the collection" },
    ],
    image: images.slateCloseup,
  },

  light: {
    kicker: "Translucent",
    title: "Lit from within.",
    paragraph:
      "Backlit, the stone stops being a surface and becomes the lamp. Every sheet glows with its own map of veins, and no two are ever the same.",
    uses: ["Walls", "Bars", "Furniture", "Ceilings", "Installations"],
    image: images.onyxColumn,
  },

  collection: [
    { slug: "slate", name: "Slate", count: "10 stones", image: images.slateSample, href: "https://skinrockofficial.com/product-category/slate/" },
    { slug: "quartzite", name: "Quartzite", count: "8 stones", image: images.quartziteSample, href: "https://skinrockofficial.com/product-category/quartzite/" },
    { slug: "marble", name: "Marble", count: "24 stones", image: images.marbleSample, href: "https://skinrockofficial.com/product-category/marble/" },
    { slug: "acoustic", name: "Acoustic", count: "Stone faced panel", image: images.acousticSample, href: "https://skinrockofficial.com/product-category/acoustic-panel/" },
  ],
  collectionTitle: "Forty two stones.",
  collectionIntro: "Each one split from a real block, so no two sheets are ever alike. Plus a stone faced acoustic panel.",

  projects: [
    { image: images.lobby, use: "Backlit ceiling", setting: "Hospitality, indoor" },
    { image: images.facadeCorner, use: "Facade", setting: "Residential, outdoor" },
    { image: images.litTable, use: "Backlit table", setting: "Event space, indoor" },
    { image: images.sauna, use: "Feature wall", setting: "Spa, indoor" },
    { image: images.kitchenIsland, use: "Kitchen", setting: "Residential, indoor" },
    { image: images.backlitBath, use: "Backlit bathroom", setting: "Residential, indoor" },
    { image: images.fireplace, use: "Fireplace", setting: "Residential, indoor" },
    { image: images.streetWall, use: "Retaining wall", setting: "Public, outdoor" },
    { image: images.chaletKitchen, use: "Wall", setting: "Chalet, indoor" },
    { image: images.darkBath, use: "Bathroom", setting: "Residential, indoor" },
  ],
  projectsTitle: "Indoors and out. Flat or curved. Lit or not.",

  // "Why choose us": the seven reasons from the current site, lightly shortened, no dashes
  whyKicker: "Why Skinrock",
  whyTitle: "Real stone. Revolutionary flexibility.",
  whyIntro: "Hover any reason to see it in a real project.",
  whyIntroTouch: "Scroll through the reasons to see each one in a real project.",
  why: [
    {
      key: "Swiss",
      title: "Swiss innovation.",
      body: "Developed through Swiss expertise and innovation, combining premium quality with global manufacturing capabilities.",
      image: images.alpsSlate,
    },
    {
      key: `${specs.thickness.min} mm`,
      title: "Ultra thin natural stone.",
      body: `Real natural stone from ${specs.thickness.value}, with the authentic beauty of stone at ${specs.weight.value}.`,
      image: images.slateCloseup,
    },
    {
      key: "Curves",
      title: "Flexible and bendable.",
      body: "Applied on curved and complex surfaces, opening new possibilities for architects and designers.",
      image: images.fireplace,
    },
    {
      key: "Backlit",
      title: "Translucent options.",
      body: "Selected stones allow backlighting for walls, feature panels, bars, furniture and installations.",
      image: images.onyxColumn,
    },
    {
      key: "Diamond",
      title: "Easy installation.",
      body: "Compatible with a wide range of substrates and cut with standard diamond tools.",
      image: images.kitchenIsland,
    },
    {
      key: "Less",
      title: "Sustainable solution.",
      body: "Thin and light, it reduces material consumption, transport emissions and overall carbon footprint.",
      image: images.facadeCorner,
    },
    {
      key: "Lasting",
      title: "Durable and long lasting.",
      body: "The timeless beauty of natural stone with excellent durability and fewer replacements.",
      image: images.stairHall,
    },
  ],

  proofTitle: "Independently tested.",
  proofIntro:
    "Tested by laboratories in Switzerland, Germany, Austria and India. Full reports are available on request.",
  proof: [
    { standard: "DIN 4102-1", result: "Fire class B2" },
    { standard: "EN 13823", result: "C-s2,d0, orienting test" },
    { standard: "VKF guideline", result: "RF 2" },
    { standard: "SIA 262/1:2013", result: "Frost and de-icing salt resistance tested" },
    { standard: "SN EN 1931", result: "Water vapour permeability tested" },
    { standard: "AgBB 2015", result: "Emission requirements fulfilled" },
    { standard: "ASTM C121", result: "Water absorption 2.5%, unsealed" },
  ],

  cta: {
    title: "Hold it in your hand.",
    body: "Order a sample set and feel how thin, light and flexible real stone can be.",
    button: "Request samples",
    // pending: the new contact page does not exist yet; points to the current site.
    href: "https://skinrockofficial.com/contact-us/",
  },

  contact: {
    company: "Skinrock Official AG",
    street: "Hartbertstrasse 9",
    postal: "7000",
    city: specs.headquarters.value,
    country: "CH",
    countryName: "Switzerland",
    // pending: no public email or phone on the current site.
    email: null as string | null,
  },

  legal: [
    { label: "Terms and Conditions", href: "https://skinrockofficial.com/terms-conditions/" },
    { label: "Privacy Policy", href: "https://skinrockofficial.com/privacy-policy/" },
  ],

  specs,

  seo: {
    title: "Skinrock | Flexible natural stone veneer from Switzerland",
    description:
      `Skinrock makes ultra thin natural stone veneers in slate, quartzite and marble. ${specs.thickness.value} thin, flexible, with selected stones translucent when backlit. Created in Switzerland.`,
  },

  images,
};

export type Site = typeof site;
