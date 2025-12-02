import * as htmlparser2 from "htmlparser2";

/**
 * Clean messy email HTML using a SAX parser.
 * Removes MSO/Outlook bloat while preserving content.
 *
 * This is faster than Cheerio (no DOM) and safer than Regex (correct parsing).
 */
export function cleanEmailHtml(rawHtml: string): string {
  if (!rawHtml) return "";

  let output = "";
  let depth = 0;

  // Track if we're inside tags we want to skip entirely
  let skipDepth = 0;

  // Tags to skip entirely (with all their content)
  const skipTags = new Set([
    "head",
    "meta",
    "style",
    "script",
    "xml",
    "title",
    "link",
    "o:p",
  ]);

  // Void tags (self-closing)
  const voidTags = new Set(["img", "br", "hr", "input", "meta", "link"]);

  // Check if we have a body tag - if not, capture everything
  const hasBodyTag = /<body/i.test(rawHtml);
  let capturing = !hasBodyTag;
  let insideBody = false;

  const parser = new htmlparser2.Parser(
    {
      onopentag(name, attribs) {
        const lowerName = name.toLowerCase();

        // Handle body tag
        if (lowerName === "body") {
          capturing = true;
          insideBody = true;
          return;
        }

        // Track skip depth for nested skipped tags
        if (skipTags.has(lowerName) || lowerName.includes(":")) {
          skipDepth++;
          return;
        }

        if (!capturing || skipDepth > 0) return;

        // Build cleaned attributes
        let newAttribs = "";

        for (const [key, value] of Object.entries(attribs)) {
          const lowerKey = key.toLowerCase();

          // Skip unwanted attributes
          if (lowerKey === "class" || lowerKey === "lang") continue;
          if (lowerKey.startsWith("xmlns")) continue;
          if (lowerKey.startsWith("o:") || lowerKey.startsWith("v:")) continue;
          if (lowerKey.startsWith("data-")) continue;

          // Clean style attribute
          if (lowerKey === "style") {
            const cleanStyle = value
              .split(";")
              .filter((prop) => {
                const [p] = prop.split(":");
                const propName = p?.trim().toLowerCase();
                if (!propName) return false;
                // Remove MSO and font properties
                if (propName.startsWith("mso-")) return false;
                if (propName.startsWith("font-")) return false;
                if (propName === "line-height") return false;
                if (propName.includes("autospace")) return false;
                return true;
              })
              .join(";")
              .trim();

            if (cleanStyle) {
              newAttribs += ` style="${cleanStyle}"`;
            }
            continue;
          }

          // Keep other attributes (href, src, id, etc.)
          const escapedValue = value.replace(/"/g, "&quot;");
          newAttribs += ` ${key}="${escapedValue}"`;
        }

        if (voidTags.has(lowerName)) {
          output += `<${name}${newAttribs} />`;
        } else {
          output += `<${name}${newAttribs}>`;
          depth++;
        }
      },

      ontext(text) {
        if (capturing && skipDepth === 0) {
          output += text;
        }
      },

      onclosetag(name) {
        const lowerName = name.toLowerCase();

        if (lowerName === "body") {
          capturing = false;
          insideBody = false;
          return;
        }

        // Track skip depth
        if (skipTags.has(lowerName) || lowerName.includes(":")) {
          if (skipDepth > 0) skipDepth--;
          return;
        }

        if (!capturing || skipDepth > 0) return;

        // Don't close void tags
        if (voidTags.has(lowerName)) return;

        output += `</${name}>`;
        depth--;
      },

      oncomment() {
        // Ignore all comments (including MSO conditionals)
      },
    },
    { decodeEntities: true, xmlMode: false }
  );

  parser.write(rawHtml);
  parser.end();

  return output.trim();
}
