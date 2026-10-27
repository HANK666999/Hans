// Vercel serverless function: POST /api/analyze
// Keep GEMINI_API_KEY in Vercel Project Settings > Environment Variables.
// Never place your API key in public/index.html.
const MAX_TEXT_CHARS = 12000;
const MAX_FILE_BYTES_BASE64 = 4_200_000;

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST for analysis requests." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "The site owner has not configured the Gemini API key yet."
    });
  }

  try {
    const body = req.body || {};
    const message = String(body.message || "").slice(0, MAX_TEXT_CHARS).trim();
    const context = String(body.context || "").slice(0, 4000);
    const file = body.file || null;

    if (!message && !file) {
      return res.status(400).json({ error: "Please enter text or attach a supported file." });
    }

    const parts = [];
    const instructions = [
      "You are Wealth Gap Explainer, an educational assistant for understanding wealth distribution data.",
      "Explain information in clear, friendly, plain English suitable for students and community members.",
      "When figures are supplied, describe what they say without inventing missing values.",
      "Distinguish wealth from income when relevant.",
      "Explain what can and cannot be concluded from the supplied information.",
      "Do not claim a correlation proves causation. Identify missing definitions, time periods, sample sizes, and source details when relevant.",
      "If the source is not supplied, say that you have not independently verified it.",
      "Use short headings and bullets when useful. Keep answers focused and readable.",
      "End with a short 'Human check' note reminding the user to verify important numbers and context against the original source.",
      "Do not claim to have searched the web or verified facts unless evidence is included in the user's input."
    ].join("\n");

    parts.push({ text: instructions + "\n\nUser request:\n" + message });

    if (context) {
      parts.push({ text: "Previously supplied context (may be incomplete):\n" + context });
    }

    if (file) {
      if (file.text) {
        parts.push({
          text: "Uploaded text file: " + String(file.name || "file").slice(0, 180) +
            "\nContents:\n" + String(file.text).slice(0, MAX_TEXT_CHARS)
        });
      } else if (file.data && file.mimeType) {
        if (String(file.data).length > MAX_FILE_BYTES_BASE64) {
          return res.status(413).json({ error: "That file is too large. Please upload a file under 3 MB." });
        }
        const allowed = file.mimeType === "application/pdf" || /^image\/(png|jpeg|webp|gif)$/i.test(file.mimeType);
        if (!allowed) {
          return res.status(400).json({ error: "Supported files are CSV, TXT, PDF, PNG, JPEG, WEBP, or GIF." });
        }
        parts.push({
          inline_data: {
            mime_type: file.mimeType,
            data: String(file.data)
          }
        });
        parts.push({ text: "The attachment is named " + String(file.name || "upload").slice(0, 180) + ". Analyze only information that is legible and present in this attachment. If any figures are unclear, say so." });
      }
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const upstream = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" +
        encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 850
          }
        })
      }
    );

    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const messageFromProvider = result?.error?.message || "The AI provider returned an error.";
      // Avoid returning request metadata or credentials.
      return res.status(upstream.status === 429 ? 429 : 502).json({
        error: upstream.status === 429
          ? "The free AI request limit may have been reached. Please wait and try again later."
          : "AI provider error: " + String(messageFromProvider).slice(0, 240)
      });
    }

    const answer = (result?.candidates?.[0]?.content?.parts || [])
      .map((part) => part.text || "")
      .join("\n")
      .trim();

    if (!answer) {
      return res.status(502).json({ error: "The AI returned an empty response. Please try again." });
    }
    return res.status(200).json({ answer });
  } catch (err) {
    return res.status(500).json({ error: "Unexpected server error. Please try again." });
  }
};
