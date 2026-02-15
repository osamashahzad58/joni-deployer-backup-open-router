---
name: openrouter-image-gen
description: Generate images from a text prompt (e.g. "create a dog image"). Uses OpenRouter Nano Banana Pro. No OpenAI key required. Prefer this over openai-image-gen when OPENROUTER_API_KEY is set.
homepage: https://openrouter.ai/google/gemini-3-pro-image-preview
metadata:
  {
    "openclaw": {
      "emoji": "🍌",
      "requires": { "bins": ["node"], "env": ["OPENROUTER_API_KEY"] },
      "primaryEnv": "OPENROUTER_API_KEY"
    }
  }
---

# OpenRouter Image Gen (Nano Banana Pro)

Generate images using OpenRouter's Nano Banana Pro (Gemini 3 Pro Image Preview). No OpenAI key needed.

## Generate

```bash
node {baseDir}/scripts/gen.js --prompt "your image description" --filename "output.png"
```

API key: set `OPENROUTER_API_KEY` (or `skills."openrouter-image-gen".env.OPENROUTER_API_KEY`). The script prints a `MEDIA:` line for OpenClaw to auto-attach on supported providers.
