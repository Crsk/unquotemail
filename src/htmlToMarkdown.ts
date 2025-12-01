import { NodeHtmlMarkdown } from 'node-html-markdown';

// Create instance with custom translators for email HTML
const nhm = new NodeHtmlMarkdown(
  {
    // Ignore non-content elements
    ignore: ['head', 'script', 'style', 'meta', 'link'],
  },
  {
    // Custom translators - unwrap table elements (email layout tables)
    // Setting no content/prefix/postfix means just recurse into children
    table: { preserveWhitespace: true },
    thead: {},
    tbody: {},
    tr: { postfix: '\n' },
    th: { postfix: ' ' },
    td: { postfix: ' ' },
  }
);

/**
 * Convert HTML to Markdown using node-html-markdown
 * Optimized for email HTML which often uses tables for layout
 */
export function htmlToMarkdown(html: string): string {
  return nhm.translate(html);
}
