const { FIELD_PROMPTS } = require("../../lib/field-prompts");
const {
  CORS_HEADERS,
  applyCors,
  buildUserMessage,
  callClaude,
  clamp,
  ensureString,
  slugify,
} = require("../../lib/claude");

const VALID_FIELDS = Object.keys(FIELD_PROMPTS);

module.exports = async function handler(req, res) {
  // CORS preflight
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

  const { field } = req.query;

  if (!VALID_FIELDS.includes(field)) {
    res.status(404).json({
      error: `Unknown field "${field}"`,
      valid_fields: VALID_FIELDS,
    });
    return;
  }

  const body = req.body || {};
  const { name } = body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const { system, maxTokens, enforce } = FIELD_PROMPTS[field];

  try {
    const userMessage = buildUserMessage(body);
    let data = await callClaude(system, userMessage, maxTokens);
    data = enforce(data, body, { clamp, ensureString, slugify });
    res.status(200).json(data);
  } catch (err) {
    if (err instanceof SyntaxError) {
      res.status(502).json({ error: "Model returned invalid JSON" });
      return;
    }
    console.error(`generate/${field} error:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
};
