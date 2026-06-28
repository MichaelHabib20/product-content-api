const { getCategoryAttributes, detectCategory } = require("../lib/categories");
const { applyCors, CORS_HEADERS } = require("../lib/claude");

module.exports = function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(200, CORS_HEADERS);
    res.end();
    return;
  }

  applyCors(res);

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { category = "", subcategory = "" } = req.query;
  const key = detectCategory(category, subcategory);
  const schema = getCategoryAttributes(category, subcategory);

  res.status(200).json({
    category_key: key,
    attributes: Object.entries(schema).map(([field, label]) => ({ field, label })),
  });
};
