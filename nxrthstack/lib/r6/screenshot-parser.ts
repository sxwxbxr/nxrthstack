"use client";

import Tesseract from "tesseract.js";

export interface ParsedMatchData {
  // Map info
  map: string | null;

  // Team scores (round wins)
  team1Score: number | null;
  team2Score: number | null;

  // Player stats
  player1: {
    name: string | null;
    kills: number | null;
    deaths: number | null;
    assists: number | null;
    score: number | null;
  };
  player2: {
    name: string | null;
    kills: number | null;
    deaths: number | null;
    assists: number | null;
    score: number | null;
  };

  // Derived data
  winner: "player1" | "player2" | null;

  // Parsing metadata
  confidence: number;
  rawText: string;
  warnings: string[];
}

interface WordInfo {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

interface LineInfo {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  words: WordInfo[];
}

interface OCRResult {
  text: string;
  confidence: number;
  lines: LineInfo[];
}

/**
 * Parse an R6 Siege scoreboard screenshot to extract match data.
 * Works with varying resolutions (1080p to 4K) and aspect ratios.
 */
export async function parseScreenshot(
  imageFile: File,
  onProgress?: (progress: number, status: string) => void
): Promise<ParsedMatchData> {
  const warnings: string[] = [];

  onProgress?.(0, "Loading image...");

  // Create image URL for Tesseract
  const imageUrl = URL.createObjectURL(imageFile);

  try {
    onProgress?.(10, "Initializing OCR engine...");

    // Run OCR with optimized settings for game scoreboards
    const result = await Tesseract.recognize(imageUrl, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          onProgress?.(10 + m.progress * 70, "Recognizing text...");
        }
      },
      // Tesseract parameters optimized for scoreboards
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -_",
      tessedit_pageseg_mode: "6", // Assume uniform block of text
      preserve_interword_spaces: "1",
    });

    onProgress?.(85, "Analyzing scoreboard...");

    // Extract lines and words from the block structure
    const lines: LineInfo[] = [];

    if (result.data.blocks) {
      for (const block of result.data.blocks) {
        for (const paragraph of block.paragraphs) {
          for (const line of paragraph.lines) {
            lines.push({
              text: line.text,
              confidence: line.confidence,
              bbox: line.bbox,
              words: line.words.map((w) => ({
                text: w.text,
                confidence: w.confidence,
                bbox: w.bbox,
              })),
            });
          }
        }
      }
    }

    const ocrResult: OCRResult = {
      text: result.data.text,
      confidence: result.data.confidence,
      lines,
    };

    // Parse the OCR results
    const parsed = analyzeScoreboard(ocrResult, warnings);

    onProgress?.(100, "Complete");

    return {
      ...parsed,
      rawText: result.data.text,
      warnings,
    };
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

// Known R6 Siege map names for detection
const R6_MAPS = [
  "BANK", "BORDER", "CHALET", "CLUBHOUSE", "COASTLINE", "CONSULATE",
  "EMERALD PLAINS", "KAFE DOSTOYEVSKY", "KAFE", "KANAL", "LAIR",
  "NIGHTHAVEN LABS", "NIGHTHAVEN", "OREGON", "OUTBACK", "SKYSCRAPER",
  "THEME PARK", "VILLA", "HOUSE", "HEREFORD", "PLANE", "YACHT",
  "FAVELA", "FORTRESS", "TOWER", "BARTLETT", "STADIUM"
];

/**
 * Analyze OCR results to extract scoreboard data.
 */
function analyzeScoreboard(
  ocr: OCRResult,
  warnings: string[]
): Omit<ParsedMatchData, "rawText" | "warnings"> {
  const result: Omit<ParsedMatchData, "rawText" | "warnings"> = {
    map: null,
    team1Score: null,
    team2Score: null,
    player1: { name: null, kills: null, deaths: null, assists: null, score: null },
    player2: { name: null, kills: null, deaths: null, assists: null, score: null },
    winner: null,
    confidence: ocr.confidence,
  };

  // Detect map name
  const upperText = ocr.text.toUpperCase();
  for (const map of R6_MAPS) {
    if (upperText.includes(map)) {
      result.map = map;
      break;
    }
  }

  // Strategy 1: Find team scores in R6 format ("YOUR TEAM X" / "ENEMY TEAM Y")
  // or standalone large numbers near "YOUR TEAM" / "ENEMY TEAM" labels
  const yourTeamMatch = ocr.text.match(/YOUR\s*TEAM[\s\n]*(\d)/i);
  const enemyTeamMatch = ocr.text.match(/ENEMY\s*TEAM[\s\n]*(\d)/i);

  if (yourTeamMatch && enemyTeamMatch) {
    result.team1Score = parseInt(yourTeamMatch[1]);
    result.team2Score = parseInt(enemyTeamMatch[1]);
  } else {
    // Fallback: Find the match score pattern (e.g., "3 - 2", "4-1", "3 : 2")
    const matchScorePattern = /(\d)\s*[-:]\s*(\d)/;
    const scoreMatch = ocr.text.match(matchScorePattern);

    if (scoreMatch) {
      result.team1Score = parseInt(scoreMatch[1]);
      result.team2Score = parseInt(scoreMatch[2]);
    } else {
      warnings.push("Could not detect match score");
    }
  }

  // Determine winner based on round score
  if (result.team1Score !== null && result.team2Score !== null) {
    if (result.team1Score > result.team2Score) {
      result.winner = "player1";
    } else if (result.team2Score > result.team1Score) {
      result.winner = "player2";
    }
  }

  // Strategy 2: Find player stat lines
  // R6 scoreboard typically shows: [Operator] Name Score K A D Ping
  // We look for lines with multiple numbers that could be stats

  const statLines = findStatLines(ocr.lines);

  if (statLines.length >= 2) {
    // First stat line is player 1 (top team)
    const p1Stats = extractPlayerStats(statLines[0]);
    result.player1 = { ...result.player1, ...p1Stats };

    // Second stat line is player 2 (bottom team)
    const p2Stats = extractPlayerStats(statLines[1]);
    result.player2 = { ...result.player2, ...p2Stats };
  } else if (statLines.length === 1) {
    warnings.push("Only found one player's stats");
    const p1Stats = extractPlayerStats(statLines[0]);
    result.player1 = { ...result.player1, ...p1Stats };
  } else {
    warnings.push("Could not find player stat lines");

    // Fallback: Try to find any sequences of numbers that look like K/D stats
    const fallbackStats = extractStatsFallback(ocr.text);
    if (fallbackStats.length >= 2) {
      result.player1.kills = fallbackStats[0].kills;
      result.player1.deaths = fallbackStats[0].deaths;
      result.player2.kills = fallbackStats[1].kills;
      result.player2.deaths = fallbackStats[1].deaths;
    }
  }

  // Validate: In a 1v1, player deaths should roughly match opponent kills
  if (result.player1.kills !== null && result.player2.deaths !== null) {
    if (Math.abs(result.player1.kills - result.player2.deaths) > 2) {
      warnings.push("Kill/death mismatch detected - values may be inaccurate");
    }
  }

  return result;
}

/**
 * Find lines that look like player stat rows.
 * R6 scoreboard shows: [Operator icon] Name Score K D A [Ping]
 * Player 1 (your team) is typically highlighted and near top.
 * Enemy players may have "AI" prefix in Field Training mode.
 */
function findStatLines(lines: LineInfo[]): LineInfo[] {
  const candidates: Array<{
    line: LineInfo;
    numberCount: number;
    y: number;
    isPlayer: boolean;
    isEnemy: boolean;
    hasName: boolean;
  }> = [];

  for (const line of lines) {
    const text = line.text;
    const numbers = line.words.filter((w) => /^\d+$/.test(w.text.trim()));

    // A stat line typically has 3-5 numbers (score, K, D, A, maybe ping)
    if (numbers.length >= 3) {
      // Check if this looks like a player line
      const hasAIPrefix = /\bAI\s+\w+/i.test(text);
      const hasPlayerName = line.words.some(
        (w) => w.text.length > 3 && !/^\d+$/.test(w.text) && !/^(ATK|DEF|Score|Kills|Deaths|Assists)$/i.test(w.text)
      );

      candidates.push({
        line,
        numberCount: numbers.length,
        y: line.bbox.y0,
        isPlayer: !hasAIPrefix && hasPlayerName,
        isEnemy: hasAIPrefix,
        hasName: hasPlayerName || hasAIPrefix,
      });
    }
  }

  // Sort by Y position (top to bottom)
  candidates.sort((a, b) => a.y - b.y);

  // Find the player line (your team - typically first non-AI line with stats)
  const playerLine = candidates.find((c) => c.isPlayer);

  // Find the first enemy line (AI player in Field Training)
  const enemyLine = candidates.find((c) => c.isEnemy);

  // If we found specific player/enemy lines, use those
  if (playerLine && enemyLine) {
    return [playerLine.line, enemyLine.line];
  }

  // Fallback: use lines with most numbers, prioritizing those with names
  const withNames = candidates.filter((c) => c.hasName);
  if (withNames.length >= 2) {
    return withNames.slice(0, 2).map((c) => c.line);
  }

  // Last resort: just take top 2 candidates
  return candidates.slice(0, 2).map((c) => c.line);
}

/**
 * Extract player stats from a stat line.
 * R6 Siege scoreboard format: [Name] [Score] [K] [D] [A] [Ping]
 * We use X-coordinate positions to determine column order.
 */
function extractPlayerStats(line: LineInfo): {
  name: string | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  score: number | null;
} {
  const result = {
    name: null as string | null,
    kills: null as number | null,
    deaths: null as number | null,
    assists: null as number | null,
    score: null as number | null,
  };

  // Separate words into text and numbers, preserving position info
  const textWords: Array<{ text: string; x: number }> = [];
  const numberWords: Array<{ value: number; x: number }> = [];

  for (const word of line.words) {
    const cleaned = word.text.trim();
    if (/^\d+$/.test(cleaned)) {
      numberWords.push({ value: parseInt(cleaned), x: word.bbox.x0 });
    } else if (cleaned.length > 1 && !/^[|\[\]{}()]+$/.test(cleaned)) {
      // Filter out OCR artifacts like |, [], etc.
      textWords.push({ text: cleaned, x: word.bbox.x0 });
    }
  }

  // Sort numbers by X position (left to right)
  numberWords.sort((a, b) => a.x - b.x);

  // Name extraction - look for player name patterns
  if (textWords.length > 0) {
    // Filter out common OCR misreads and column headers
    const filtered = textWords.filter(
      (t) => !["Score", "Kills", "Deaths", "Assists", "Ping", "K", "D", "A", "ATK", "DEF"].includes(t.text)
    );
    if (filtered.length > 0) {
      // For AI players, combine "AI" with the city name
      const aiIndex = filtered.findIndex((t) => t.text.toUpperCase() === "AI");
      if (aiIndex >= 0 && filtered.length > aiIndex + 1) {
        result.name = `AI ${filtered[aiIndex + 1].text}`;
      } else {
        // Take the longest text as name, or first non-trivial text
        const sortedByLength = [...filtered].sort((a, b) => b.text.length - a.text.length);
        result.name = sortedByLength[0].text;
      }
    }
  }

  // R6 Siege stat column order: Score, K, D, A (sometimes with ping at end)
  // Score is typically large (100s-1000s), K/D/A are small (0-30 typically)

  if (numberWords.length >= 4) {
    // First large number is score
    const scoreCandidate = numberWords.find((n) => n.value >= 100);
    if (scoreCandidate) {
      result.score = scoreCandidate.value;
    }

    // K, D, A are the small numbers after score, in order by X position
    const kdaCandidates = numberWords
      .filter((n) => n.value < 100 && (!scoreCandidate || n.x > scoreCandidate.x))
      .slice(0, 3);

    if (kdaCandidates.length >= 3) {
      result.kills = kdaCandidates[0].value;
      result.deaths = kdaCandidates[1].value;
      result.assists = kdaCandidates[2].value;
    } else if (kdaCandidates.length >= 2) {
      result.kills = kdaCandidates[0].value;
      result.deaths = kdaCandidates[1].value;
    } else if (kdaCandidates.length === 1) {
      result.kills = kdaCandidates[0].value;
    }
  } else if (numberWords.length >= 3) {
    // Assume first is score if large, rest are K, D, A
    if (numberWords[0].value >= 100) {
      result.score = numberWords[0].value;
      result.kills = numberWords[1].value;
      result.deaths = numberWords[2].value;
    } else {
      // All small - treat as K, D, A
      result.kills = numberWords[0].value;
      result.deaths = numberWords[1].value;
      result.assists = numberWords[2].value;
    }
  } else if (numberWords.length >= 2) {
    // Minimal case: just two numbers - assume K and D
    const small = numberWords.filter((n) => n.value < 50);
    if (small.length >= 2) {
      result.kills = small[0].value;
      result.deaths = small[1].value;
    }
  }

  return result;
}

/**
 * Fallback extraction when line-based parsing fails.
 * Looks for patterns like "K D" numbers in the raw text.
 */
function extractStatsFallback(text: string): Array<{ kills: number; deaths: number }> {
  const results: Array<{ kills: number; deaths: number }> = [];

  // Look for sequences of small numbers that could be K/D
  // Pattern: number, optional separator, number (both < 30)
  const pattern = /\b(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\b/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const [, n1, n2, n3] = match.map(Number);

    // If all are reasonable K/D/A values
    if (n1 < 30 && n2 < 30 && n3 < 30) {
      results.push({ kills: n1, deaths: n3 }); // K, A, D order
    }
  }

  // Also try simpler two-number pattern
  if (results.length < 2) {
    const simplePattern = /\b(\d{1,2})\s+(\d{1,2})\b/g;
    while ((match = simplePattern.exec(text)) !== null) {
      const [, n1, n2] = match.map(Number);
      if (n1 < 30 && n2 < 30) {
        // Avoid duplicates
        if (!results.some((r) => r.kills === n1 && r.deaths === n2)) {
          results.push({ kills: n1, deaths: n2 });
        }
      }
    }
  }

  return results.slice(0, 2);
}

/**
 * Pre-process image for better OCR results.
 * Optimized for R6 Siege scoreboards with dark backgrounds and light text.
 */
export async function preprocessImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(file);
        return;
      }

      // Upscale small images for better OCR (target ~2000px width)
      const targetWidth = 2000;
      const scale = img.width < targetWidth ? targetWidth / img.width : 1;
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      // Use better image interpolation
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw scaled image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Step 1: Convert to grayscale and collect histogram
      const grayValues: number[] = new Array(data.length / 4);
      let minGray = 255;
      let maxGray = 0;

      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        grayValues[i / 4] = gray;
        minGray = Math.min(minGray, gray);
        maxGray = Math.max(maxGray, gray);
      }

      // Step 2: Apply histogram stretching and adaptive thresholding
      const range = maxGray - minGray || 1;

      for (let i = 0; i < data.length; i += 4) {
        let gray = grayValues[i / 4];

        // Histogram stretching (normalize to full 0-255 range)
        gray = Math.round(((gray - minGray) / range) * 255);

        // Strong contrast enhancement for text
        // This makes light text (scores, names) stand out from dark background
        const contrast = 2.0;
        gray = Math.min(255, Math.max(0, Math.round((gray - 128) * contrast + 128)));

        // Mild sharpening effect by boosting already-bright pixels
        // R6 scoreboards have white/yellow text on dark backgrounds
        if (gray > 160) {
          gray = Math.min(255, gray + 40);
        } else if (gray < 80) {
          gray = Math.max(0, gray - 30);
        }

        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }

      ctx.putImageData(imageData, 0, 0);

      // Convert canvas to blob/file
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const processedFile = new File([blob], file.name, { type: "image/png" });
            resolve(processedFile);
          } else {
            resolve(file);
          }
        },
        "image/png",
        1.0
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for preprocessing"));
    };

    img.src = URL.createObjectURL(file);
  });
}
