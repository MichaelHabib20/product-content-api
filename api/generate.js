const { buildSystemPrompt } = require("../lib/prompt");
const { getCategoryRules } = require("../lib/categories");
const {
  CORS_HEADERS,
  applyCors,
  buildUserMessage,
  callClaude,
  clamp,
  ensureString,
  slugify,
} = require("../lib/claude");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(200, CORS_HEADERS);
    res.end();
    return;
  }

  applyCors(res);

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = req.body || {};
  const { name, category = null, subcategory = null } = body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  // Step 1: pick category-aware system prompt
  const categoryRules = getCategoryRules(category, subcategory);
  const systemPrompt = buildSystemPrompt(categoryRules);

  try {
    const userMessage = buildUserMessage(body);
    let data = await callClaude(systemPrompt, userMessage, 2048);

    data.meta_title = clamp(data.meta_title, 60);
    data.meta_title_ar = clamp(data.meta_title_ar, 60);
    data.meta_description = clamp(data.meta_description, 160);
    data.meta_description_ar = clamp(data.meta_description_ar, 160);
    data.alt = clamp(data.alt, 125);
    data.alt_ar = clamp(data.alt_ar, 125);
    data.slug = slugify(data.slug || name);
    data.keywords = ensureString(data.keywords);
    data.keywords_ar = ensureString(data.keywords_ar);

    // Return detected category key so the caller knows which rules were applied
    data._category = categoryRules.key;

    res.status(200).json(data);
  } catch (err) {
    if (err instanceof SyntaxError) {
      res.status(502).json({ error: "Model returned invalid JSON" });
      return;
    }
    console.error("generate error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
