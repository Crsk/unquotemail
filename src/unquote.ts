import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import { marked } from 'marked';
import { patterns } from './patterns';
import { htmlToText } from './htmlToText';

/* eslint-disable @typescript-eslint/no-explicit-any */
type CheerioNode = any;

export interface UnquoteOptions {
  parse?: boolean;
}

/**
 * Extract original tag names with their casing from HTML
 */
function extractOriginalTagCasing(html: string): Map<string, string> {
  const tagMap = new Map<string, string>();
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)/g;
  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    const tagName = match[1];
    const lowerTag = tagName.toLowerCase();
    // Keep the first occurrence's casing (usually the opening tag)
    if (!tagMap.has(lowerTag)) {
      tagMap.set(lowerTag, tagName);
    }
  }
  return tagMap;
}

/**
 * Restore original tag casing in processed HTML
 */
function restoreTagCasing(html: string, originalCasing: Map<string, string>): string {
  let result = html;
  for (const [lowerTag, originalTag] of originalCasing) {
    if (lowerTag !== originalTag) {
      // Replace opening tags
      result = result.replace(
        new RegExp(`<${lowerTag}(\\s|>|\\/)`, 'gi'),
        (match) => `<${originalTag}${match.slice(lowerTag.length + 1)}`
      );
      // Replace closing tags
      result = result.replace(
        new RegExp(`</${lowerTag}>`, 'gi'),
        `</${originalTag}>`
      );
    }
  }
  return result;
}

/**
 * Extract inner HTML without the <html><head></head><body> wrapper
 * and convert to self-closing tags like Python's BeautifulSoup
 */
function getInnerHtml($: CheerioAPI, originalHtml: string): string {
  // Extract original tag casing before cheerio normalizes it
  const originalCasing = extractOriginalTagCasing(originalHtml);

  // Check if original HTML had html/body/head tags
  const hadHtmlTag = /<html[\s>]/i.test(originalHtml);
  const hadBodyTag = /<body[\s>]/i.test(originalHtml);
  const hadHeadTag = /<head[\s>]/i.test(originalHtml);

  // Extract whitespace patterns from original
  const htmlBodyWhitespace = originalHtml.match(/<html[^>]*>([\s]*)<body/i)?.[1] || '';
  const bodyCloseWhitespace = originalHtml.match(/<\/body>([\s]*)<\/html>/i)?.[1] || '';

  let html: string;
  if (hadHtmlTag || hadBodyTag) {
    // Original had structure, keep it but normalize
    html = $.html();

    // Remove <head></head> if original didn't have it
    if (!hadHeadTag) {
      html = html.replace(/<head><\/head>/g, '');
    }

    // Restore whitespace between html/body tags
    if (htmlBodyWhitespace) {
      html = html.replace(/<html([^>]*)><body/i, `<html$1>${htmlBodyWhitespace}<body`);
    }
    if (bodyCloseWhitespace) {
      html = html.replace(/<\/body><\/html>/i, `</body>${bodyCloseWhitespace}</html>`);
    }
  } else {
    // Original was a fragment, extract just body contents
    html = $('body').html() || '';
  }

  // Convert to self-closing tags like BeautifulSoup
  html = html.replace(/<br>/gi, '<br/>');
  html = html.replace(/<hr>/gi, '<hr/>');

  // Normalize excessive whitespace (more than 4 consecutive newlines) like BeautifulSoup
  html = html.replace(/\n{5,}/g, '\n\n\n\n');

  // Restore original tag casing
  html = restoreTagCasing(html, originalCasing);

  return html.trim();
}

export class Unquote {
  private originalHtml: string | null;
  private originalText: string | null;
  private _html: string | null = null;
  private _text: string | null = null;

  constructor(
    html: string | null,
    text: string | null,
    options: UnquoteOptions = { parse: true }
  ) {
    if (!html && !text) {
      throw new Error('You must provide at least one of html or text');
    }

    this.originalHtml = html ? html.replace(/\xa0/g, ' ') : null;
    this.originalText = text ? text.replace(/\xa0/g, ' ') : null;

    if (options.parse !== false) {
      this.parse();
    }
  }

  getHtml(): string | null {
    if (this._html === null) {
      if (this.originalHtml) {
        this._html = this.originalHtml;
      } else if (this.originalText) {
        this._html = this.textToHtml(this.originalText);
      }
    }
    return this._html;
  }

  getText(): string | null {
    if (this._text === null) {
      if (this.originalText) {
        this._text = this.originalText;
      } else if (this.originalHtml) {
        this._text = htmlToText(this.originalHtml).trim();
      }
    }
    return this._text;
  }

  private parseHtml($: CheerioAPI): boolean {
    // Moz (must be before Apple)
    const moz = $('div.moz-cite-prefix');
    if (moz.length) {
      const nextSibling = moz.next('blockquote[type="cite"]');
      if (nextSibling.length) {
        nextSibling.remove();
        moz.remove();
        return true;
      }
    }

    // Freshdesk
    const freshdesk = $('div.freshdesk_quote');
    if (freshdesk.length) {
      freshdesk.remove();
      return true;
    }

    // Front
    const front = $('.front-blockquote');
    if (front.length) {
      front.remove();
      return true;
    }

    // Missive
    const missive = $('div.missive_quote');
    if (missive.length) {
      missive.remove();
      return true;
    }

    // Outreach
    const outreach = $('div.outreach-quote');
    if (outreach.length) {
      outreach.remove();
      return true;
    }

    // Hubspot
    const hubspot = $('div.hs_reply');
    if (hubspot.length) {
      hubspot.remove();
      return true;
    }

    // Spark
    const spark = $('[name="messageReplySection"]');
    if (spark.length) {
      spark.remove();
      return true;
    }

    // Gmail
    const gmail = $('.gmail_attr');
    if (gmail.length) {
      const parent = gmail.parent();
      const parentClasses = parent.attr('class') || '';
      if (
        parentClasses.includes('gmail_quote_container') ||
        parentClasses.includes('gmail_quote')
      ) {
        parent.remove();
        return true;
      }
    }

    // Another Gmail
    const gmail2 = $('div.gmail_quote');
    if (gmail2.length) {
      const parent = gmail2.parent();
      const parentClasses = parent.attr('class') || '';
      if (parentClasses.includes('gmail_extra')) {
        parent.remove();
        return true;
      }
    }

    // Gmail, fallback - handle blockquote.gmail_quote inside div.gmail_quote
    const gmailFallback = $('blockquote.gmail_quote');
    if (gmailFallback.length) {
      // Check if blockquote is inside a div.gmail_quote - if so, remove the whole div
      const parentDiv = gmailFallback.closest('div.gmail_quote');
      if (parentDiv.length) {
        parentDiv.remove();
      } else {
        gmailFallback.remove();
      }
      return true;
    }

    // Gmail div without blockquote but with quote content (cleanup empty gmail_quote divs)
    const gmailDivOnly = $('div.gmail_quote');
    if (gmailDivOnly.length) {
      // Remove if it only contains whitespace or is empty after other processing
      const textContent = gmailDivOnly.text().trim();
      if (!textContent || gmailDivOnly.children().length === 0) {
        gmailDivOnly.remove();
        return true;
      }
    }

    // Yahoo
    const yahoo = $('div.yahoo_quoted');
    if (yahoo.length) {
      yahoo.remove();
      return true;
    }

    // Ymail
    const ymail = $('div#ymail_android_signature');
    if (ymail.length) {
      ymail.nextAll().not('script, style').remove();
      ymail.remove();
      return true;
    }

    // Yahoo quoted mail
    const ymail2 = $('p.yahoo-quoted-begin');
    if (ymail2.length) {
      ymail2.nextAll().not('script, style').remove();
      ymail2.remove();
      return true;
    }

    // GetFernand.com
    const fernand = $('div.fernand_quote');
    if (fernand.length) {
      fernand.remove();
      return true;
    }

    // Intercom
    const intercom = $('div.history');
    if (intercom.length) {
      intercom.remove();
      return true;
    }

    // Reply
    const reply = $('p#reply-intro');
    if (reply.length) {
      const blockquote = reply.next('blockquote[type="cite"]');
      if (blockquote.length) {
        blockquote.remove();
        reply.remove();
        return true;
      }
    }

    // MsOffice
    const msoffice = $('div#mail-editor-reference-message-container');
    if (msoffice.length) {
      msoffice.remove();
      return true;
    }

    // MsOutlook
    const msoutlook = $(
      'div[style^="border:none;border-top:solid"]>p.MsoNormal>b'
    );
    if (msoutlook.length) {
      const msoRoot = msoutlook.parent().parent();
      const style = (msoRoot.attr('style') || '')
        .replace(/cm/g, 'in')
        .replace(/pt/g, 'in')
        .replace(/mm/g, 'in');

      if (style.endsWith(' 1.0in;padding:3.0in 0in 0in 0in')) {
        let root = msoRoot;
        const parentContents = msoRoot.parent().children();
        const htmlElements = parentContents.filter((_, el) =>
          $.html(el).startsWith('<')
        );

        if (htmlElements.length === 1) {
          root = msoRoot.parent();
        }

        root.nextAll().remove();
        root.remove();
        return true;
      }
    }

    // Outlook
    const outlook = $('div#divRplyFwdMsg');
    if (outlook.length) {
      const prevHr = outlook.prevAll('hr').first();
      if (prevHr.length) {
        outlook.nextAll().remove();
        outlook.remove();
        prevHr.remove();
        return true;
      }
    }

    // ProtonMail
    const proton = $('.protonmail_quote');
    if (proton.length) {
      proton.remove();
      return true;
    }

    // Trix
    const trix = $('div.trix-content>blockquote');
    if (trix.length) {
      trix.remove();
      return true;
    }

    // ZMail
    const zmail = $('div.zmail_extra');
    if (zmail.length) {
      const previous = zmail.prev();
      if (previous.hasClass('zmail_extra_hr')) {
        previous.remove();
      }
      zmail.remove();
      return true;
    }

    // Zendesk
    const zendesk = $('div.quotedReply>blockquote');
    if (zendesk.length) {
      zendesk.parent().remove();
      return true;
    }

    // Zoho
    const zoho = $('div[title="beforequote:::"]');
    if (zoho.length) {
      zoho.nextAll().remove();
      const prevSibling = zoho.prev();
      if (prevSibling.text().trim().startsWith('---')) {
        prevSibling.remove();
      }
      zoho.remove();
      return true;
    }

    // Notion
    const notion = $('blockquote.notion-mail-quote');
    if (notion.length) {
      notion.remove();
      return true;
    }

    // Tutanota
    const tutanota = $('blockquote.tutanota_quote');
    if (tutanota.length) {
      const prevDiv = tutanota.prev('div');
      if (prevDiv.length) {
        prevDiv.remove();
      }
      tutanota.remove();
      return true;
    }

    // Some odd Yahoo ydp
    const ydp = $('div[class$="yahoo_quoted"]');
    if (ydp.length) {
      const id = ydp.attr('id') || '';
      if (id.includes('yahoo_quoted')) {
        ydp.remove();
        return true;
      }
    }

    // QT
    const qt = $('blockquote[type="cite"]#qt');
    if (qt.length) {
      qt.remove();
      return true;
    }

    // Alimail
    const alimail = $('div.alimail-quote');
    if (alimail.length) {
      const parent = alimail.parent();
      if (parent.is('blockquote')) {
        parent.remove();
        return true;
      }
    }

    // Some Apple version
    const apple = $('html[class*="apple-mail"] blockquote[type="cite"]>div[dir]');
    if (apple.length) {
      const blockquoteParent = apple.parent();
      let previousSibling = blockquoteParent.prev();

      // Skip text nodes
      while (previousSibling.length && !previousSibling.is('*')) {
        previousSibling = previousSibling.prev();
      }

      if (previousSibling.length && previousSibling.attr('dir')) {
        const childBlockquote = previousSibling.find('blockquote');
        if (childBlockquote.length) {
          previousSibling.remove();
        }
      }

      blockquoteParent.remove();
      return true;
    }

    // Apple interchange
    const appleIc = $('br.Apple-interchange-newline');
    if (appleIc.length) {
      const parent = appleIc.parent();
      if (parent.is('blockquote')) {
        parent.remove();
        return true;
      }
    }

    // Another apple
    const apple2 = $('meta[name="x-apple-disable-message-reformatting"]');
    if (apple2.length) {
      const blockquote = apple2.closest('blockquote');
      if (blockquote.length) {
        const prevDiv = blockquote.prev('div');
        if (prevDiv.length) {
          const nestedBlockquote = prevDiv.find('blockquote[type="cite"]');
          if (nestedBlockquote.length) {
            prevDiv.remove();
          }
        }
        blockquote.remove();
        return true;
      }
    }

    // OneComWebmail
    const onecom = $('div.oneComWebmail-html');
    if (onecom.length) {
      const parent = onecom.parent();
      if (parent.is('blockquote')) {
        parent.remove();
      }
    }

    // NH*
    const nh = $('div.nh_extra');
    if (nh.length) {
      nh.remove();
    }

    // GWP starting classname
    const gwp = $('div[id^="gwp"]');
    if (gwp.length) {
      const parent = gwp.parent();
      const tagName = parent.prop('tagName') || '';
      if (tagName.includes('@')) {
        parent.remove();
        return true;
      }
    }

    return false;
  }

  private clearText(text: string): string {
    let result = text;
    for (const pattern of ['>', '<', ' ', '\n', '\r', '\t', '\xa0']) {
      result = result.split(pattern).join('');
    }
    return result.trim();
  }

  parse(): boolean {
    this._text = this.originalText;
    this._html = this.originalHtml;

    if (this._html) {
      const $ = cheerio.load(this._html);

      if (this.parseHtml($)) {
        this._html = getInnerHtml($, this.originalHtml!);
        this._text = htmlToText(this._html).trim();
        return true;
      }

      // Try to locate any class="*quote*" and debug it
      const quoteElements = $('[class*="quote"]');
      if (quoteElements.length) {
        this.quoteFound($);
      }

      // Try to locate any class="*sign*" and debug it
      const signElements = $('[class*="sign"]');
      if (signElements.length) {
        this.signFound($);
      }
    }

    if (!this._text && this._html) {
      this._text = htmlToText(this._html).trim();
    }

    // Content based data using regex
    let match: RegExpMatchArray | null = null;
    for (const pattern of patterns) {
      if (this._text) {
        match = this._text.match(pattern);
        if (match) {
          break;
        }
      }
    }

    if (!match) {
      if (this._text) {
        this.noPatternsFound(this._text);
      }
      return false;
    }

    // Get the index of the match
    const matchIndex = this._text!.indexOf(match[0]);
    this._text = this._text!.substring(0, matchIndex).trim();

    if (this._html) {
      const $ = cheerio.load(this._html);
      let content = '';
      let matchingTag: CheerioNode | null = null;
      const lookupText = this.clearText(match[0]);

      // Iterate through all text nodes
      const textNodes: CheerioNode[] = [];
      const collectTextNodes = (node: CheerioNode) => {
        node.contents().each((_: number, el: any) => {
          const $el = $(el);
          if (el.type === 'text') {
            textNodes.push($el);
          } else if (el.type === 'tag') {
            collectTextNodes($el);
          }
        });
      };
      collectTextNodes($.root());

      for (const textNode of textNodes) {
        const currentText = textNode.text();
        if (!currentText) continue;

        content += this.clearText(currentText);

        if (content.includes(lookupText)) {
          matchingTag = textNode;
          break;
        }
      }

      if (matchingTag) {
        // Remove everything after the matching tag's parent
        matchingTag.parent().nextAll().remove();

        // Also remove the blockquote that follows if present
        const blockquoteAfter = matchingTag.parent().next('blockquote');
        if (blockquoteAfter.length) {
          blockquoteAfter.remove();
        }

        // Go up from the text node until we find an element that contains ONLY the quote
        // If findIndex === 0, the element contains only the quote, remove it
        // If findIndex > 0, the element has other content, keep the previous element
        let currentTag: CheerioNode | null = matchingTag;
        let previousTag: CheerioNode | null = null;
        let found = false;
        let tagToRemove: CheerioNode | null = null;

        while (currentTag && currentTag.length) {
          const tagContent = currentTag.text();
          const clearedContent = this.clearText(tagContent);
          const findIndex = clearedContent.indexOf(lookupText);

          if (findIndex === 0) {
            // This element contains only the quote text
            // Keep traversing up to find the highest element that only contains quote
            tagToRemove = currentTag;
            previousTag = currentTag;
            currentTag = currentTag.parent();
            found = true;
          } else if (findIndex > 0) {
            // This element has other content before the quote
            // Remove the previous element (which only had quote)
            if (tagToRemove) {
              found = true;
            }
            break;
          } else {
            // Quote not found at all - shouldn't happen
            break;
          }
        }

        if (found && tagToRemove && tagToRemove.length) {
          // Check if it's not the root
          const tagName = tagToRemove.prop('tagName');
          if (tagName && tagName.toLowerCase() !== 'html' && tagName.toLowerCase() !== 'body') {
            const parentOfRemoved: CheerioNode | null = tagToRemove.parent();
            tagToRemove.remove();

            // Clean up empty parent elements
            let current = parentOfRemoved;
            while (current && current.length) {
              const currentTagName = current.prop('tagName');
              if (!currentTagName || currentTagName.toLowerCase() === 'html' || currentTagName.toLowerCase() === 'body') {
                break;
              }

              if (!current.text().trim() && !current.find('img').length) {
                const nextParent = current.parent();
                current.remove();
                current = nextParent;
              } else {
                break;
              }
            }
          }
        }

        this._html = getInnerHtml($, this.originalHtml!);
      } else {
        // Rebuild the html from the text
        this._html = this.textToHtml(this._text);
      }
    }

    return true;
  }

  textToHtml(data: string | null): string | null {
    if (!data) {
      return null;
    }

    return (marked.parse(data, { async: false }) as string).trim();
  }

  /** Override this method to handle cases when a quote class is found but not processed */
  protected quoteFound(_$: CheerioAPI): void {
    // Can be overridden
  }

  /** Override this method to handle cases when a signature class is found but not processed */
  protected signFound(_$: CheerioAPI): void {
    // Can be overridden
  }

  /** Override this method to handle cases when no patterns matched */
  protected noPatternsFound(_text: string): void {
    // Can be overridden
  }
}

export class VerboseUnquote extends Unquote {
  protected quoteFound($: CheerioAPI): void {
    console.log('Quote found in HTML structure');
    console.log($.html().substring(0, 100));
  }

  protected signFound($: CheerioAPI): void {
    console.log('Signature found in HTML structure');
    console.log($.html().substring(0, 100));
  }

  protected noPatternsFound(text: string): void {
    console.log('No patterns found in text');
    console.log(text.substring(0, 100));
  }
}
