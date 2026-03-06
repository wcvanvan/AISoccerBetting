/**
 * Extracts text from LLM response content.
 * Handles both string responses and array-of-blocks responses (LangChain format).
 */
export function extractTextContent(content: unknown): string {
  if (typeof content === 'string' && content.trim()) {
    return content.trim();
  }
  if (Array.isArray(content)) {
    return content
      .filter(
        (b): b is { type: string; text: string } =>
          typeof b === 'object' && b !== null && (b as { type?: string }).type === 'text'
      )
      .map(b => b.text)
      .join('\n')
      .trim();
  }
  return '';
}
