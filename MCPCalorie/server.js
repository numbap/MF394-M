import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fetch from "node-fetch";
import OpenAI from "openai";
import twilio from "twilio";
import "dotenv/config";

const app = express();
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

app.use(bodyParser.urlencoded({ extended: false }));

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// MCP Server "tool" that estimates macros
const server = new Server({
  transport: new StdioServerTransport(),
});

server.registerTool({
  name: "estimate_food_macros",
  description: "Estimates calories, protein, fat, carbs from a food image URL",
  parameters: {
    type: "object",
    properties: {
      image_url: { type: "string" },
    },
    required: ["image_url"],
  },
  async execute({ image_url }) {
    // Ask OpenAI to estimate macros from image
    const prompt = `
      You are a nutrition expert. Based on this food photo URL, give a JSON object with estimated:
      calories (kcal), protein (grams), fat (grams), carbs (grams).
      Image URL: ${image_url}
      Respond ONLY as JSON.
    `;
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
    });

    // Parse AI response as JSON
    try {
      return JSON.parse(response.choices[0].message.content);
    } catch (err) {
      return { error: "Could not estimate macros. Try a clearer photo." };
    }
  },
});

// Twilio WhatsApp webhook
app.post("/whatsapp", async (req, res) => {
  const from = req.body.From;
  const mediaUrl = req.body.MediaUrl0;
  const mediaType = req.body.MediaContentType0;

  if (!mediaUrl || !mediaType.startsWith("image")) {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: from,
      body: "Please send a photo of your food to estimate macros.",
    });
    return res.sendStatus(200);
  }

  // Call MCP tool
  try {
    const macros = await server.callTool("estimate_food_macros", {
      image_url: mediaUrl,
    });

    const message = macros.error
      ? macros.error
      : `Estimated Macros:\nCalories: ${macros.calories} kcal\nProtein: ${macros.protein}g\nFat: ${macros.fat}g\nCarbs: ${macros.carbs}g`;

    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: from,
      body: message,
    });
  } catch (err) {
    console.error(err);
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: from,
      body: "Oops, something went wrong estimating your food. Try again!",
    });
  }

  res.sendStatus(200);
});

app.listen(process.env.PORT || 3000, () => {
  console.log("WhatsApp Macro Bot running...");
});
