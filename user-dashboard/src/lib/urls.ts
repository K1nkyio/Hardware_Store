export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const productPath = (id: string, name: string) => `/product/${id}--${slugify(name)}`;
