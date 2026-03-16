// centralize paths for images used on the home page
// images are placed in the public folder; build full URLs using Vite's BASE_URL

function toPublicPath(fileName: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return `${normalizedBase}${fileName}`.replace(/([^:]\/)\/+/g, "$1");
}

export const largeHero = toPublicPath("pexels-asphotography-14953886.jpg");
export const editorial = toPublicPath("pexels-pavel-danilyuk-7937299.jpg");
export const fiftyFifty = {
  electrical: toPublicPath("giullia-siqueira-z-Pl41JT3RA-unsplash.jpg"),
  safety: toPublicPath("assorted-work-tools-wood-background.jpg"),
};
export const oneThirdTwoThirds = {
  paints: toPublicPath("benjamin-lehman-EJU7A__krX0-unsplash.jpg"),
  construction: toPublicPath("the-blowup-lqx_D7xIZ2o-unsplash.jpg"),
};

export const homeShowcase = {
  toolkit: toPublicPath("manual-tool-set-set-wooden-floor.jpg"),
  maintenance: toPublicPath("mechanic-supplies-composition-high-angle.jpg"),
  fittings: toPublicPath("julie-molliver-Z3vFp7szCAY-unsplash.jpg"),
};

export const aboutRaph = toPublicPath("about.png");

// generic placeholder used by carousel when product lacks an image
export const placeholder = toPublicPath("placeholder.svg");
