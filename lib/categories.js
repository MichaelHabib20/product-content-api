// Maps category/subcategory strings to a category group key
function detectCategory(category, subcategory) {
  const cat = (category || "").toLowerCase();
  const sub = (subcategory || "").toLowerCase();
  const combined = `${cat} ${sub}`;

  if (/pharma|medicine|drug|rx|prescription|supplement|vitamin|health care|otc/.test(combined)) return "pharmacy";
  if (/baby|infant|newborn|toddler|mom|mother|maternity|formula|nappy|diaper/.test(combined)) return "mom-baby";
  if (/food|grocery|beverage|drink|snack|fruit|vegetable|meat|dairy|bakery|organic/.test(combined)) return "food";
  if (/cloth|fashion|apparel|wear|shirt|dress|shoe|bag|accessory|jewel/.test(combined)) return "fashion";
  if (/home|furniture|decor|kitchen|bath|bedroom|garden|tools|appliance/.test(combined)) return "home";
  if (/book|stationery|office|school|notebook|pen|educational/.test(combined)) return "books";
  if (/electron|mobile|phone|laptop|tablet|computer|camera|tv|gadget|tech/.test(combined)) return "electronics";
  return "default";
}

// Per-category tone + compliance rules injected into the system prompt
const CATEGORY_RULES = {
  pharmacy: {
    tone: "professional, neutral, compliance-first. Use clear and factual language.",
    rules: [
      "NEVER make therapeutic, curative, or treatment claims of any kind.",
      "NEVER state or imply the product cures, treats, prevents, or fights any disease or condition.",
      "NEVER recommend dosage or frequency unless explicitly provided in the input.",
      "If need_prescription is true, mention that a prescription is required.",
      "Use language like 'consult your pharmacist or doctor' where appropriate.",
      "Do not describe mechanism of action unless it is explicitly stated in the input.",
    ],
  },
  "mom-baby": {
    tone: "warm, reassuring, safety-first. Speak directly to parents and caregivers.",
    rules: [
      "NEVER imply age suitability unless the exact age range is provided in the input.",
      "NEVER invent nutritional values, ingredients, or developmental benefits.",
      "NEVER make claims about infant health outcomes or developmental milestones.",
      "Always recommend consulting a pediatrician or healthcare provider.",
      "Use gentle, nurturing language that resonates with parents.",
    ],
  },
  food: {
    tone: "appetizing, sensory-driven. Highlight freshness, taste, and quality.",
    rules: [
      "NEVER invent nutritional values, calorie counts, or health claims not in the input.",
      "NEVER state allergen information unless explicitly provided.",
      "If certifications (halal, organic, etc.) are not in the input, do not mention them.",
      "Focus on taste, quality, and occasion rather than health benefits.",
    ],
  },
  fashion: {
    tone: "stylish, aspirational, lifestyle-driven. Appeal to personal expression.",
    rules: [
      "NEVER invent material composition percentages unless provided.",
      "NEVER invent size availability unless provided.",
      "Focus on style, occasion, and how it makes the wearer feel.",
      "Use sensory language for texture and fit only if material is known.",
    ],
  },
  home: {
    tone: "practical yet lifestyle-aspirational. Focus on quality, comfort, and everyday value.",
    rules: [
      "NEVER invent dimensions, materials, or weight unless provided.",
      "NEVER claim assembly-free unless stated in the input.",
      "Focus on the feeling the product creates in the space.",
      "Mention room type or use case only if inferable from the product name.",
    ],
  },
  books: {
    tone: "intellectual, curious, reader-focused. Speak to the value of knowledge or story.",
    rules: [
      "NEVER invent author credentials, awards, or endorsements.",
      "NEVER invent page count, ISBN, or publication year unless provided.",
      "Focus on what the reader will learn or experience.",
      "Mention target audience only if inferable from the title or provided facts.",
    ],
  },
  electronics: {
    tone: "specs-forward, performance-driven, confident. Appeal to the tech-savvy buyer.",
    rules: [
      "NEVER invent technical specifications, battery life, or compatibility unless provided.",
      "NEVER claim certifications (CE, FCC, etc.) unless stated in the input.",
      "Lead with the strongest known spec or feature.",
      "Use precise, technical language where facts are available.",
    ],
  },
  default: {
    tone: "clear, benefit-focused, professional. Appeal to a broad audience.",
    rules: [
      "Focus on the most obvious product benefits based on name and category.",
      "Keep claims general when specific facts are not provided.",
    ],
  },
};

// Per-category structured attribute schemas (field name → label for the prompt)
const CATEGORY_ATTRIBUTES = {
  pharmacy: {
    active_ingredient: "Active ingredient",
    dosage_form: "Dosage form (tablet, syrup, cream…)",
    strength: "Strength / concentration",
    pack_size: "Pack size",
    manufacturer: "Manufacturer",
    storage: "Storage conditions",
  },
  "mom-baby": {
    stage: "Stage / phase",
    age_range: "Age range",
    volume_ml: "Volume (ml)",
    formula_type: "Formula type (whey, casein…)",
    certifications: "Certifications (organic, halal…)",
  },
  food: {
    ingredients: "Main ingredients",
    calories: "Calories per serving",
    allergens: "Allergens",
    certifications: "Certifications (halal, organic…)",
    serving_size: "Serving size",
  },
  fashion: {
    material: "Material / fabric",
    gender: "Gender",
    size_range: "Available sizes",
    color: "Color(s)",
    fit: "Fit type",
    care: "Care instructions",
  },
  home: {
    material: "Material",
    dimensions: "Dimensions (W x H x D)",
    color: "Color",
    room_type: "Room type",
    assembly: "Assembly required (yes/no)",
  },
  books: {
    author: "Author",
    pages: "Number of pages",
    language: "Language",
    publisher: "Publisher",
    genre: "Genre",
    age_group: "Target age group",
  },
  electronics: {
    specs: "Key specifications",
    connectivity: "Connectivity (WiFi, BT…)",
    battery: "Battery life",
    compatibility: "Compatibility",
    warranty: "Warranty period",
    color: "Color",
  },
  default: {
    material: "Material",
    dimensions: "Dimensions",
    color: "Color",
    origin: "Country of origin",
  },
};

function getCategoryRules(category, subcategory) {
  const key = detectCategory(category, subcategory);
  return { key, ...CATEGORY_RULES[key] };
}

function getCategoryAttributes(category, subcategory) {
  const key = detectCategory(category, subcategory);
  return CATEGORY_ATTRIBUTES[key] || CATEGORY_ATTRIBUTES.default;
}

module.exports = { detectCategory, getCategoryRules, getCategoryAttributes, CATEGORY_ATTRIBUTES };
