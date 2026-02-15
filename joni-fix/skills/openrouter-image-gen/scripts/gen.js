#!/usr/bin/env node
/**
 * Generate images via OpenRouter (Nano Banana Pro / Gemini 3 Pro Image Preview).
 * Uses OPENROUTER_API_KEY. Prints MEDIA: <path> for OpenClaw.
 *
 * Usage: node gen.js --prompt "a dog" --filename out.png
 */
const fs = require("fs");
const path = require("path");

function parseArgs() {
  const args = process.argv.slice(2);
  let prompt = "";
  let filename = "";
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === "--prompt" || args[i] === "-p") && args[i + 1]) {
      prompt = args[++i].trim();
    } else if ((args[i] === "--filename" || args[i] === "-f") && args[i + 1]) {
      filename = args[++i].trim();
    }
  }
  return { prompt, filename };
}

function extractBase64FromDataUrl(dataUrl) {
  const m = /^data:image\/[^;]+;base64,(.+)$/.exec(dataUrl);
  return m ? m[1] : null;
}

function findImageInContent(content) {
  if (typeof content === "string") {
    const m = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g);
    return m && m[0] ? m[0] : null;
  }
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part && typeof part === "object") {
        const url = part.image_url?.url ?? part.url;
        if (typeof url === "string" && url.startsWith("data:image/")) {
          return url;
        }
        if (part.type === "image" && typeof part.data === "string") {
          return `data:image/png;base64,${part.data}`;
        }
      }
    }
  }
  return null;
}

async function main() {
  const apiKey = (process.env.OPENROUTER_API_KEY || "").trim();
  if (!apiKey) {
    console.error("Missing OPENROUTER_API_KEY");
    process.exit(1);
  }

  const { prompt, filename } = parseArgs();
  if (!prompt || !filename) {
    console.error("Usage: node gen.js --prompt \"<description>\" --filename <output.png>");
    process.exit(1);
  }

  const outPath = path.resolve(filename);
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const url = "https://openrouter.ai/api/v1/chat/completions";
  const body = {
    model: "google/gemini-3-pro-image-preview",
    modalities: ["image", "text"],
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1024,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/TokenTimes/JONI",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`OpenRouter error ${res.status}: ${text.slice(0, 500)}`);
    process.exit(1);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  const msg = choice?.message;
  let dataUrl = null;
  if (msg?.images?.length) {
    const img = msg.images[0];
    dataUrl = img?.image_url?.url ?? img?.imageUrl?.url ?? null;
  }
  if (!dataUrl) {
    const content = msg?.content;
    dataUrl = findImageInContent(content);
  }
  if (!dataUrl) {
    const content = msg?.content;
    const text = typeof content === "string" ? content : JSON.stringify(content ?? msg);
    console.error("No image in response. Content:", text?.slice(0, 300));
    process.exit(1);
  }

  const base64 = extractBase64FromDataUrl(dataUrl);
  if (!base64) {
    console.error("Could not parse image data URL");
    process.exit(1);
  }

  fs.writeFileSync(outPath, Buffer.from(base64, "base64"));
  console.log(`Image saved: ${outPath}`);
  console.log(`MEDIA: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
