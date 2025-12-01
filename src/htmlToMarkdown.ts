import { NodeHtmlMarkdown } from 'node-html-markdown';

/**
 * Convert HTML to Markdown using node-html-markdown
 * Optimized for email HTML which often uses tables for layout
 */
export function htmlToMarkdown(html: string): string {
  return NodeHtmlMarkdown.translate(html, {
    // Ignore non-content elements
    ignore: ['head', 'script', 'style', 'meta', 'link'],
    // Treat table cells as blocks of text, not grids (flattens layout tables)
    blockElements: ['div', 'p', 'form', 'table', 'tbody', 'tr', 'td'],
  });
}
