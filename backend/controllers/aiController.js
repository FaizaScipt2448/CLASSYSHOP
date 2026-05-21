const Anthropic = require('@anthropic-ai/sdk');

const generateProductContent = async (req, res) => {
  const { name, price, category } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Product name is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    return res.status(500).json({ message: 'Anthropic API key not configured. Add ANTHROPIC_API_KEY to backend/.env and restart the server.' });
  }

  const client = new Anthropic({ apiKey });

  const priceNum = Number(price) || 1000;

  const prompt = `You are a product content writer for ClassyShop, a Pakistani e-commerce store. Generate realistic, specific product details for the product below. Return ONLY a valid JSON object — no markdown, no extra text.

Product Name: ${name}
Price (Rs. PKR): ${priceNum}
${category ? `Category hint: ${category}` : ''}

Rules:
- Every field must be specific to THIS exact product — not generic filler.
- description: 2–3 paragraphs (150–250 words). Cover materials, key features, benefits, use cases. Mention Pakistan-relevant context where natural.
- brand: the real or most likely brand for this product (e.g. Sony for headphones, Zara for dresses, Nestlé for food).
- category: exactly one of: fashion, electronics, beauty, wellness, footwear, bags, groceries, jewellery
- subcategory: a specific subcategory (e.g. "Headphones", "Dresses", "Sunscreen", "Sneakers")
- originalPrice: a number 10–25% higher than ${priceNum} (the "was" price). Must be higher than price.
- discount: integer percentage derived from (originalPrice - price) / originalPrice * 100, rounded.
- countInStock: realistic integer 15–200 based on product type popularity.
- isFeatured / isLatest / isPopular: "yes" or "no" — vary them per product.
- weightValue: realistic product weight as a number.
- weightUnit: "g" for items under 1kg, "kg" for heavier items.
- packageWeightValue: slightly more than product weight.
- packageWeightUnit: same logic as weightUnit.
- length / width / height: realistic dimensions in cm for the product (not the package).
- dimensionUnit: always "cm".
- size: if applicable (clothing: "S, M, L, XL"; shoes: "UK 6-11"; liquid: "250ml"; else "").
- metaTitle: max 60 chars, format: "${name} | ClassyShop".
- metaDescription: 120–155 chars, persuasive sentence with main keywords.
- metaKeywords: 10–14 comma-separated keywords: product name parts, brand, category, features, "buy online Pakistan", "ClassyShop", relevant Urdu-romanized terms if natural.

Return exactly this JSON shape:
{
  "description": "...",
  "brand": "...",
  "category": "...",
  "subcategory": "...",
  "originalPrice": 0,
  "discount": 0,
  "countInStock": 0,
  "isFeatured": "no",
  "isLatest": "no",
  "isPopular": "no",
  "weightValue": 0,
  "weightUnit": "g",
  "packageWeightValue": 0,
  "packageWeightUnit": "g",
  "length": 0,
  "width": 0,
  "height": 0,
  "dimensionUnit": "cm",
  "size": "",
  "metaTitle": "...",
  "metaDescription": "...",
  "metaKeywords": "..."
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    let text = message.content[0].text.trim();

    // Strip markdown code fences if present
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenced) text = fenced[1].trim();

    const data = JSON.parse(text);

    // Enforce originalPrice > price
    if (Number(data.originalPrice) <= priceNum) {
      data.originalPrice = Math.round(priceNum * 1.15);
    }
    data.discount = Math.round(((data.originalPrice - priceNum) / data.originalPrice) * 100);

    res.json(data);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(500).json({ message: 'AI returned invalid JSON — please try again' });
    }
    const msg = err?.error?.message || err?.message || 'AI generation failed';
    console.error('AI generation error:', msg);
    res.status(500).json({ message: msg });
  }
};

module.exports = { generateProductContent };
