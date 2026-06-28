const Anthropic = require("@anthropic-ai/sdk");
const { SYSTEM_PROMPT } = require("../lib/prompt");

const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

// TODO: restrict Access-Control-Allow-Origin to your dashboard origin
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function slugify(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function clamp(str, max) {
  if (typeof str !== "string") return str;
  return str.length > max ? str.slice(0, max) : str;
}

function ensureString(val) {
  if (Array.isArray(val)) return val.join(", ");
  return typeof val === "string" ? val : String(val ?? "");
}

module.exports = async function handler(req, res) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(200, CORS_HEADERS);
    res.end();
    return;
  }

  // Set CORS on all responses
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const {
    name,
    name_ar = null,
    category = null,
    subcategory = null,
    brand = null,
    weight = null,
    extra_attributes = null,
    need_prescription = false,
  } = req.body || {};

  if (!name || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const userMessage = [
    `Product name: ${name}`,
    `Arabic name: ${name_ar || "none"}`,
    `Category: ${category || "n/a"} > ${subcategory || "n/a"}`,
    `Brand: ${brand || "n/a"}`,
    `Weight: ${weight || "n/a"}`,
    `Needs prescription: ${need_prescription ? "yes" : "no"}`,
    `Other known attributes: ${extra_attributes || "none"}`,
  ].join("\n");

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const rawText = message.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    // Strip optional ```json fences
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();

    let data;
    try {
      data = JSON.parse(cleaned);
    } catch {
      res.status(502).json({ error: "Model returned invalid JSON" });
      return;
    }

    // Server-side limit enforcement
    data.meta_title = clamp(data.meta_title, 60);
    data.meta_title_ar = clamp(data.meta_title_ar, 60);
    data.meta_description = clamp(data.meta_description, 160);
    data.meta_description_ar = clamp(data.meta_description_ar, 160);
    data.alt = clamp(data.alt, 125);
    data.alt_ar = clamp(data.alt_ar, 125);

    // Ensure slug is clean latin (fallback to product name)
    data.slug = slugify(data.slug || name);

    // Keywords must be strings
    data.keywords = ensureString(data.keywords);
    data.keywords_ar = ensureString(data.keywords_ar);

    res.status(200).json(data);
  } catch (err) {
    console.error("generate error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
