import type { ExportLanguage } from '../types';

export function exportPromptCode(
  prompt: string,
  language: ExportLanguage
): string {
  switch (language) {
    case 'markdown':
      return `# LPrompt Export\n\n${prompt}\n`;

    case 'text':
      return prompt;

    case 'json':
    default:
      return JSON.stringify(
        {
          schema_version: '3.0.0',
          title: 'LPrompt Exported Asset',
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
