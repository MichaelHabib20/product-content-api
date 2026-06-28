const BASE_SAFETY = `SAFETY RULES (mandatory):
- Describe ONLY from the facts given. NEVER invent ingredients, nutritional values, age suitability, dosage, medical benefits, or health/safety claims.
- Do NOT make medical, therapeutic, or curative claims of any kind.
- If a fact is unknown, omit it — keep copy general rather than fabricating specifics.
- Arabic must read as native, fluent copy — NOT a literal translation of English.
Respond with ONLY the JSON object, no markdown, no backticks, no preamble.`;

const FIELD_PROMPTS = {
  name: {
    system: `You are a bilingual e-commerce copywriter. Given a product, return improved EN and AR names.
${BASE_SAFETY}
Return: { "name": "", "name_ar": "" }
Rules: improve clarity/wording only; keep the real product identity intact.`,
    maxTokens: 256,
    enforce: (d) => d,
  },

  slug: {
    system: `You are an SEO specialist. Given a product, return EN and AR slugs.
${BASE_SAFETY}
Return: { "slug": "", "slug_ar": "" }
Rules:
- slug: lowercase latin, hyphenated, no stop words.
- slug_ar: arabic-script words joined by hyphens.`,
    maxTokens: 128,
    enforce: (d, body) => {
      const { slugify } = require("./claude");
      d.slug = slugify(d.slug || body.name);
      return d;
    },
  },

  description: {
    system: `You are a bilingual e-commerce copywriter. Given a product, return short EN and AR descriptions.
${BASE_SAFETY}
Return: { "description": "", "description_ar": "" }
Rules: 1–2 compelling sentences each.`,
    maxTokens: 512,
    enforce: (d) => d,
  },

  "long-description": {
    system: `You are a bilingual e-commerce copywriter. Given a product, return long EN and AR descriptions.
${BASE_SAFETY}
Return: { "long_description_en": "", "long_description_ar": "" }
Rules: 2–3 short paragraphs each, keywords used naturally, no stuffing.`,
    maxTokens: 1024,
    enforce: (d) => d,
  },

  meta: {
    system: `You are a bilingual SEO specialist. Given a product, return meta title and meta description in EN and AR.
${BASE_SAFETY}
Return: { "meta_title": "", "meta_title_ar": "", "meta_description": "", "meta_description_ar": "" }
Rules:
- meta_title (en & ar): 50–60 chars, main keyword near the start.
- meta_description (en & ar): 150–160 chars, keyword-rich, soft call-to-action.`,
    maxTokens: 512,
    enforce: (d, _body, { clamp }) => {
      d.meta_title = clamp(d.meta_title, 60);
      d.meta_title_ar = clamp(d.meta_title_ar, 60);
      d.meta_description = clamp(d.meta_description, 160);
      d.meta_description_ar = clamp(d.meta_description_ar, 160);
      return d;
    },
  },

  alt: {
    system: `You are a bilingual e-commerce copywriter. Given a product, return image alt text in EN and AR.
${BASE_SAFETY}
Return: { "alt": "", "alt_ar": "" }
Rules: <=125 chars each, plainly describes the product image.`,
    maxTokens: 256,
    enforce: (d, _body, { clamp }) => {
      d.alt = clamp(d.alt, 125);
      d.alt_ar = clamp(d.alt_ar, 125);
      return d;
    },
  },

  keywords: {
    system: `You are a bilingual SEO specialist. Given a product, return search keywords in EN and AR.
${BASE_SAFETY}
Return: { "keywords": "", "keywords_ar": "" }
Rules: 5–8 real buyer search terms each, comma-separated string.`,
    maxTokens: 256,
    enforce: (d, _body, { ensureString }) => {
      d.keywords = ensureString(d.keywords);
      d.keywords_ar = ensureString(d.keywords_ar);
      return d;
    },
  },
};

module.exports = { FIELD_PROMPTS };
