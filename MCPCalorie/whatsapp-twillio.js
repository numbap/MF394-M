import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const MCP_URL = "http://localhost:PORT"; // your MCP server URL if HTTP
// or if you're only using stdio MCP, you may wrap it with an HTTP interface

// Twilio webhook
app.post("/whatsapp", async (req, res) => {
  const from = req.body.From; // WhatsApp number
  const body = req.body.Body; // Message text

  console.log(`Message from ${from}: ${body}`);

  // Example: Map WhatsApp message to MCP tool
  let toolName;
  if (body.toLowerCase().includes("joke")) toolName = "tell_joke";
  else if (body.toLowerCase().includes("weather"))
    toolName = "get_weather_ottawa";

  if (!toolName) {
    res.send(
      `<Response><Message>Sorry, I didn't understand that 🤔</Message></Response>`,
    );
    return;
  }

  // Call your MCP server tool
  try {
    const response = await fetch(`${MCP_URL}/call-tool`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: toolName, params: {} }),
    });
    const data = await response.json();

    const textResponse =
      data.content?.[0]?.text || "Oops, something went wrong 😬";

    res.send(`<Response><Message>${textResponse}</Message></Response>`);
  } catch (err) {
    console.error(err);
    res.send(
      `<Response><Message>Failed to contact MCP server 😬</Message></Response>`,
    );
  }
});

app.listen(3000, () =>
  console.log("WhatsApp webhook server running on port 3000"),
);
