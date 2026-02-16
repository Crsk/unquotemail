import { NodeHtmlMarkdown } from 'node-html-markdown';

// Factory translator for td/th: adds ' | ' separator between cells in the same row
// Uses postprocess to trim block-level whitespace (e.g. <p> inside <td>) before the pipe
const cellTranslator = (ctx: any) => ({
  surroundingNewlines: false,
  postfix: ctx.node.nextElementSibling ? ' | ' : '',
  postprocess: ({ content }: { content: string }) => content.trim(),
});

// Create instance with custom translators for email HTML
const nhm = new NodeHtmlMarkdown(
  {
    // Ignore non-content elements
    ignore: ['head', 'script', 'style', 'meta', 'link'],
  },
  {
    // Custom translators - unwrap table elements (email layout tables)
    // Single-cell rows render as plain text; multi-cell rows use ' | ' between cells
    table: { preserveWhitespace: true },
    thead: {},
    tbody: {},
    tr: { postfix: '\n' },
    th: cellTranslator,
    td: cellTranslator,
  }
);

/**
 * Convert HTML to Markdown using node-html-markdown
 * Optimized for email HTML which often uses tables for layout
 */
export function htmlToMarkdown(html: string): string {
  return nhm.translate(html);
}
