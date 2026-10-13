const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Creative Studio background-removal server is running.");
});

app.post("/remove-background", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload an image." });
    }

    const apiKey = process.env.REMOVEBG_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "The background-removal API key has not been configured."
      });
    }

    const form = new FormData();
    form.append(
      "image_file",
      new Blob([req.file.buffer], { type: req.file.mimetype }),
      req.file.originalname
    );
    form.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: form
    });

    if (!response.ok) {
      const message = await response.text();
      return res.status(response.status).json({
        error: "Background removal failed. Check the API key and available credits.",
        details: message.slice(0, 500)
      });
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    res.set("Content-Type", "image/png");
    res.send(imageBuffer);
  } catch (error) {
    console.error("Background removal error:", error);
    res.status(500).json({ error: "Something went wrong on the server." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Creative Studio server listening on port ${port}`);
});
