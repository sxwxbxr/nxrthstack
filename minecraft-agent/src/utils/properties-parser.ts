/**
 * Parse server.properties format (preserving comments and order).
 * Lines are: key=value or #comment or blank
 */

interface PropertiesEntry {
  type: "property" | "comment" | "blank";
  key?: string;
  value?: string;
  raw: string;
}

export function parseProperties(content: string): {
  entries: PropertiesEntry[];
  properties: Record<string, string>;
} {
  const entries: PropertiesEntry[] = [];
  const properties: Record<string, string> = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trimEnd();

    if (trimmed === "") {
      entries.push({ type: "blank", raw: trimmed });
    } else if (trimmed.startsWith("#")) {
      entries.push({ type: "comment", raw: trimmed });
    } else {
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) {
        entries.push({ type: "comment", raw: trimmed });
      } else {
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1);
        entries.push({ type: "property", key, value, raw: trimmed });
        properties[key] = value;
      }
    }
  }

  return { entries, properties };
}

/**
 * Serialize properties back, preserving comments and order.
 * Only changed values are updated.
 */
export function serializeProperties(
  entries: PropertiesEntry[],
  updates: Record<string, string>
): string {
  const lines: string[] = [];

  for (const entry of entries) {
    if (entry.type === "property" && entry.key && entry.key in updates) {
      lines.push(`${entry.key}=${updates[entry.key]}`);
    } else {
      lines.push(entry.raw);
    }
  }

  // Add any new properties not in original file
  for (const [key, value] of Object.entries(updates)) {
    if (!entries.some((e) => e.type === "property" && e.key === key)) {
      lines.push(`${key}=${value}`);
    }
  }

  return lines.join("\n");
}
