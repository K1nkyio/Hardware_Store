import { Router } from "express";
import { pool } from "../db/pool";
import { config } from "../config";

export const seoRouter = Router();

seoRouter.get("/sitemap.xml", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, category, updated_at::text FROM products ORDER BY updated_at DESC"
    );

    const siteUrl = config.siteUrl;
    const urls: string[] = [];
    urls.push(`${siteUrl}/`);

    const categories = new Set<string>();
    for (const row of rows) {
      if (row.category) {
        categories.add(row.category);
      }
      urls.push(`${siteUrl}/product/${row.id}`);
    }

    for (const category of categories) {
      const slug = category.toLowerCase().replace(/\s+/g, "-");
      urls.push(`${siteUrl}/category/${slug}`);
    }

    const xmlEntries = urls
      .map((url) => `<url><loc>${url}</loc></url>`)
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
      xmlEntries +
      `</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.send(xml);
  } catch (err) {
    next(err);
  }
});
