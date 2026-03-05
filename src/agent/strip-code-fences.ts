/**
 * Strip markdown code fences from LLM output.
 * Shared by report-analyzer and match-news-client.
 */
export function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```') && trimmed.includes('\n')) {
    const afterFirst = trimmed.slice(3).replace(/^[\w]*\n?/, '');
    const end = afterFirst.lastIndexOf('```');
    if (end !== -1) return afterFirst.slice(0, end).trim();
    return afterFirst.trim();
  }
  return trimmed;
}
