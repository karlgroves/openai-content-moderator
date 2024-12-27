const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
const PORT = 8000;

// OpenAI Configuration
const openai = new OpenAI();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Moderation Endpoint
app.post("/moderate", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text content is required for moderation." });
    }

    // Call OpenAI Moderation API
    const response = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: text,
    });

    res.json(response.results[0]); // Send the moderation results
  } catch (error) {
    console.error("Error in /moderate endpoint:", error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});