import type { GeminiConfig, ExportLanguage } from '../types';
import { DEFAULT_GEMINI_MODEL } from './modelCatalog';

export function exportPromptCode(
  prompt: string,
  language: ExportLanguage,
  config: GeminiConfig
): string {
  const model = config.model || DEFAULT_GEMINI_MODEL;
  // Never copy a live secret into generated source code.
  const apiKeyPlaceholder = 'YOUR_GEMINI_API_KEY';

  switch (language) {
    case 'python':
      return `# ==============================================================================
# LPrompt Studio - Python Code Export (Google GenAI SDK)
# Cài đặt thư viện: pip install google-genai
# ==============================================================================
import os
from google import genai
from google.genai import types

def run_prompt():
    # Khởi tạo client với API Key từ biến môi trường hoặc cấu hình
    api_key = os.environ.get("GEMINI_API_KEY", "${apiKeyPlaceholder}")
    client = genai.Client(api_key=api_key)

    prompt_content = """${prompt.replace(/"""/g, '\\"\\"\\"')}"""

    response = client.models.generate_content(
        model="${model}",
        contents=prompt_content,
        config=types.GenerateContentConfig(
            temperature=${config.temperature ?? 0.7},
        ),
    )

    print("--- PHẢN HỒI TỪ GEMINI ---")
    print(response.text)
    return response.text

if __name__ == "__main__":
    run_prompt()
`;

    case 'typescript':
      return `// ==============================================================================
// LPrompt Studio - TypeScript / Node.js Export
// Cài đặt thư viện: npm install @google/genai
// ==============================================================================
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '${apiKeyPlaceholder}';
const ai = new GoogleGenAI({ apiKey });

async function executePrompt(): Promise<string | undefined> {
  const prompt = \`${prompt.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`;

  const response = await ai.models.generateContent({
    model: '${model}',
    contents: prompt,
    config: {
      temperature: ${config.temperature ?? 0.7},
    },
  });

  console.log('--- PHẢN HỒI TỪ GEMINI ---');
  console.log(response.text);
  return response.text;
}

executePrompt().catch(console.error);
`;

    case 'curl':
      const escapedJson = JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: config.temperature ?? 0.7
        }
      }, null, 2);

      return `curl "https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKeyPlaceholder}" \\
  -H "Content-Type: application/json" \\
  -X POST \\
  -d '${escapedJson.replace(/'/g, "'\\''")}'
`;

    case 'json':
    default:
      return JSON.stringify(
        {
          schema_version: '3.0.0',
          title: 'LPrompt Exported Asset',
          model: model,
          temperature: config.temperature ?? 0.7,
          prompt: prompt,
          exported_at: new Date().toISOString(),
          metadata: {
            generator: 'LPrompt Studio v3.0',
            char_count: prompt.length,
            word_count: prompt.trim().split(/\s+/).length
          }
        },
        null,
        2
      );
  }
}
