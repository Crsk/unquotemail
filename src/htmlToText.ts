import * as cheerio from 'cheerio';

/**
 * Simple HTML to text converter (Cloudflare Worker compatible)
 * Mimics the behavior of Python's html2text library
 */
export function htmlToText(html: string): string {
  const $ = cheerio.load(html);

  // Remove script and style elements
  $('script, style, head').remove();

  // Handle line breaks
  $('br').replaceWith('\n');

  // Handle paragraphs and divs
  $('p, div').each((_, el) => {
    const $el = $(el);
    $el.prepend('\n');
    $el.append('\n');
  });

  // Handle headers
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const $el = $(el);
    $el.prepend('\n\n');
    $el.append('\n\n');
  });

  // Handle lists
  $('li').each((_, el) => {
    const $el = $(el);
    $el.prepend('* ');
    $el.append('\n');
  });

  $('ul, ol').each((_, el) => {
    const $el = $(el);
    $el.prepend('\n');
    $el.append('\n');
  });

  // Handle blockquotes
  $('blockquote').each((_, el) => {
    const $el = $(el);
    const text = $el.text();
    const quotedText = text
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n');
    $el.text(quotedText);
    $el.prepend('\n');
    $el.append('\n');
  });

  // Handle links - keep the text
  $('a').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const text = $el.text();
    if (href && text && href !== text) {
      $el.text(`${text} (${href})`);
    }
  });

  // Get text content
  let text = $.text();

  // Clean up whitespace
  text = text
    // Replace multiple spaces with single space
    .replace(/[ \t]+/g, ' ')
    // Replace multiple newlines with double newline
    .replace(/\n{3,}/g, '\n\n')
    // Trim each line
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    // Final trim
    .trim();

  // Escape markdown characters like Python's html2text does
  // This prevents false pattern matches on content that looks like quote headers
  text = text
    // Escape leading dashes (horizontal rules)
    .replace(/^(---+)/gm, '\\$1')
    // Escape leading hash (headers)
    .replace(/^(#+)/gm, '\\$1');

  return text;
}
