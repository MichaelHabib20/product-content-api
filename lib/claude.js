const Anthropic = require("@anthropic-ai/sdk");

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

function buildUserMessage(body) {
  const {
    name,
    name_ar = null,
    category = null,
    subcategory = null,
    brand = null,
    weight = null,
    extra_attributes = null,
    need_prescription = false,
  } = body;

  return [
    `Product name: ${name}`,
    `Arabic name: ${name_ar || "none"}`,
    `Category: ${category || "n/a"} > ${subcategory || "n/a"}`,
    `Brand: ${brand || "n/a"}`,
    `Weight: ${weight || "n/a"}`,
    `Needs prescription: ${need_prescription ? "yes" : "no"}`,
    `Other known attributes: ${extra_attributes || "none"}`,
  ].join("\n");
}

async function callClaude(systemPrompt, userMessage, maxTokens = 1024) {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const rawText = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  return JSON.parse(cleaned);
}

function applyCors(res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
}

module.exports = {
  client,
  CORS_HEADERS,
  slugify,
  clamp,
  ensureString,
  buildUserMessage,
  callClaude,
  applyCors,
};
