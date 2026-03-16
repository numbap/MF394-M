/**
 * POST /api/extract-contacts
 *
 * Accepts a base64-encoded screenshot and uses Google Gemini Flash
 * to extract structured contact data (names, titles, orgs, face regions).
 *
 * Request:  { image: "base64-string" }
 * Response: { people: [{ name, title?, organization?, faceRegion? }] }
 */

const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const jwt = require("jsonwebtoken");

const GEMINI_MODEL = "gemini-2.0-flash";

const EXTRACTION_PROMPT = `Analyze this screenshot from a social media or professional networking platform.
Identify all visible people and extract:
- name: The person's full name
- title: Their job title or role (if visible)
- organization: Their company or organization (if visible)
- faceRegion: The bounding box of their face as percentage coordinates {x, y, width, height} where values are 0-1 relative to image dimensions. x and y represent the top-left corner. If no face is visible for a person, set to null.

Return ONLY people where you can identify a name.`;

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    people: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          title: { type: SchemaType.STRING, nullable: true },
          organization: { type: SchemaType.STRING, nullable: true },
          faceRegion: {
            type: SchemaType.OBJECT,
            nullable: true,
            properties: {
              x: { type: SchemaType.NUMBER },
              y: { type: SchemaType.NUMBER },
              width: { type: SchemaType.NUMBER },
              height: { type: SchemaType.NUMBER },
            },
            required: ["x", "y", "width", "height"],
          },
        },
        required: ["name"],
      },
    },
  },
  required: ["people"],
};

function detectMimeType(base64String) {
  if (base64String.startsWith("/9j/")) return "image/jpeg";
  if (base64String.startsWith("iVBOR")) return "image/png";
  if (base64String.startsWith("R0lGO")) return "image/gif";
  if (base64String.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }
  const token = authHeader.replace("Bearer ", "");
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const decoded = verifyAuth(req);
  if (!decoded) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { image } = req.body || {};
  if (!image || typeof image !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'image' field. Expected base64-encoded string." });
  }

  // Strip data URI prefix if present
  const base64Data = image.includes(",") ? image.split(",")[1] : image;

  // Basic validation: base64 should only contain valid chars
  if (!/^[A-Za-z0-9+/=]+$/.test(base64Data.slice(0, 100))) {
    return res.status(400).json({ error: "Invalid base64 encoding." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[extract-contacts] GEMINI_API_KEY not configured");
    return res.status(500).json({ error: "Server configuration error." });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const mimeType = detectMimeType(base64Data);

    const result = await model.generateContent([
      EXTRACTION_PROMPT,
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ]);

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("[extract-contacts] Gemini API error:", error.message);

    if (error.message?.includes("API key")) {
      return res.status(500).json({ error: "Invalid API configuration." });
    }

    return res.status(500).json({
      error: "Failed to analyze screenshot. Please try again.",
    });
  }
}
