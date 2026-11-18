// Netlify Function: Gemini se winning product ideas leta hai.
// API key Netlify ke Environment Variables mein GEMINI_API_KEY naam se rakhein.
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "POST use karein" }) };
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return { statusCode: 500, body: JSON.stringify({ error: "GEMINI_API_KEY set nahi hai (Netlify > Site settings > Environment variables)" }) };
  }

  let command = "";
  try { command = (JSON.parse(event.body || "{}").command || "").slice(0, 500); } catch (e) {}
  if (!command) {
    return { statusCode: 400, body: JSON.stringify({ error: "Command khali hai" }) };
  }

  const prompt = `You are an expert Shopify dropshipping product researcher.
User command: "${command}"

Suggest 6 realistic product ideas that fit the command. For each product, judge using: trend momentum, demand, competition level, profit margin, shipping/fragility, and "wow factor"/problem solved.
Respond ONLY with JSON in this exact shape:
{"products":[{"name":"","why":"","cost_usd":0,"sell_usd":0,"competition":"low|medium|high","score":0,"ad_angle":"","search_terms":["",""],"risk":""}]}
Rules: score is 0-100. cost_usd and sell_usd are realistic numbers. search_terms are keywords to find the product on AliExpress/CJ and check on Google Trends/TikTok. Be honest about risks. No markdown.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.8 }
        })
      }
    );
    const data = await res.json();
    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: data.error?.message || "Gemini error" }) };
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server error: " + e.message }) };
  }
};
