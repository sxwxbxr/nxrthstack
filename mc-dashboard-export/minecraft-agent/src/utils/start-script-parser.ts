/**
 * Parse and modify start.sh / start script to extract/update JVM arguments.
 */

export interface JvmArgs {
  minMemory: string; // e.g., "2G"
  maxMemory: string; // e.g., "12G"
  gcType: string; // e.g., "G1GC", "ZGC", "ShenandoahGC"
  extraFlags: string[];
  rawLine: string;
}

const MEMORY_REGEX = /-X(ms|mx)(\d+[GMgm])/g;
const GC_REGEX = /-XX:\+Use(\w+GC)/;
const JAR_REGEX = /-jar\s+\S+/;

export function parseStartScript(content: string): JvmArgs {
  // Find the java command line
  const lines = content.split("\n");
  const javaLine = lines.find(
    (line) =>
      line.includes("java") && line.includes("-jar") && !line.startsWith("#")
  );

  if (!javaLine) {
    return {
      minMemory: "2G",
      maxMemory: "4G",
      gcType: "G1GC",
      extraFlags: [],
      rawLine: "",
    };
  }

  let minMemory = "2G";
  let maxMemory = "4G";
  let gcType = "G1GC";
  const extraFlags: string[] = [];

  // Parse memory
  const memMatches = [...javaLine.matchAll(MEMORY_REGEX)];
  for (const match of memMatches) {
    if (match[1] === "ms") minMemory = match[2];
    if (match[1] === "mx") maxMemory = match[2];
  }

  // Parse GC type
  const gcMatch = javaLine.match(GC_REGEX);
  if (gcMatch) {
    gcType = gcMatch[1];
  }

  // Collect extra JVM flags
  const parts = javaLine.split(/\s+/);
  for (const part of parts) {
    if (
      part.startsWith("-X") &&
      !part.startsWith("-Xms") &&
      !part.startsWith("-Xmx")
    ) {
      extraFlags.push(part);
    } else if (
      part.startsWith("-XX:") &&
      !GC_REGEX.test(part) &&
      part !== "-XX:+UseG1GC" // skip the GC flag
    ) {
      extraFlags.push(part);
    } else if (part.startsWith("-D")) {
      extraFlags.push(part);
    }
  }

  return {
    minMemory,
    maxMemory,
    gcType,
    extraFlags,
    rawLine: javaLine.trim(),
  };
}

export function buildStartScript(
  originalContent: string,
  args: JvmArgs
): string {
  const lines = originalContent.split("\n");
  const javaLineIndex = lines.findIndex(
    (line) =>
      line.includes("java") && line.includes("-jar") && !line.startsWith("#")
  );

  if (javaLineIndex === -1) {
    return originalContent;
  }

  const oldLine = lines[javaLineIndex];
  // Extract the jar file reference
  const jarMatch = oldLine.match(JAR_REGEX);
  const jarPart = jarMatch ? jarMatch[0] : "-jar server.jar";

  // Build new line
  const flags = [
    `java -Xms${args.minMemory} -Xmx${args.maxMemory}`,
    `-XX:+Use${args.gcType}`,
    ...args.extraFlags,
    jarPart,
    "nogui",
  ].join(" ");

  lines[javaLineIndex] = flags;
  return lines.join("\n");
}
