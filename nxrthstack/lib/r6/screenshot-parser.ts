"use client";

import Tesseract from "tesseract.js";

export interface ParsedMatchData {
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

    // Run OCR with blocks output for detailed structure
    const result = await Tesseract.recognize(imageUrl, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          onProgress?.(10 + m.progress * 70, "Recognizing text...");
        }
      },
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

/**
 * Analyze OCR results to extract scoreboard data.
 */
function analyzeScoreboard(
  ocr: OCRResult,
  warnings: string[]
): Omit<ParsedMatchData, "rawText" | "warnings"> {
  const result: Omit<ParsedMatchData, "rawText" | "warnings"> = {
    team1Score: null,
    team2Score: null,
    player1: { name: null, kills: null, deaths: null, assists: null, score: null },
    player2: { name: null, kills: null, deaths: null, assists: null, score: null },
    winner: null,
    confidence: ocr.confidence,
  };

  // Strategy 1: Find the match score (e.g., "3 - 2", "4-1", "3 : 2")
  const matchScorePattern = /(\d)\s*[-:]\s*(\d)/;
  const scoreMatch = ocr.text.match(matchScorePattern);

  if (scoreMatch) {
    result.team1Score = parseInt(scoreMatch[1]);
    result.team2Score = parseInt(scoreMatch[2]);

    // Determine winner based on round score
    if (result.team1Score > result.team2Score) {
      result.winner = "player1";
    } else if (result.team2Score > result.team1Score) {
      result.winner = "player2";
    }
  } else {
    warnings.push("Could not detect match score (e.g., 3-2)");
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
 * These typically contain multiple numbers (score, K, A, D, ping).
 */
function findStatLines(lines: LineInfo[]): LineInfo[] {
  const candidates: Array<{ line: LineInfo; numberCount: number; y: number }> = [];

  for (const line of lines) {
    // Count how many number tokens are in this line
    const numbers = line.words.filter((w) => /^\d+$/.test(w.text.trim()));

    // A stat line typically has 4-6 numbers (score, K, A, D, maybe ping)
    // But at minimum we need K and D (2 numbers)
    if (numbers.length >= 2) {
      candidates.push({
        line,
        numberCount: numbers.length,
        y: line.bbox.y0,
      });
    }
  }

  // Sort by Y position (top to bottom)
  candidates.sort((a, b) => a.y - b.y);

  // If we have many candidates, filter to those with the most numbers
  // (more likely to be actual stat lines)
  if (candidates.length > 2) {
    const maxNumbers = Math.max(...candidates.map((c) => c.numberCount));
    const filtered = candidates.filter((c) => c.numberCount >= maxNumbers - 1);

    // Return top 2 (one per team in 1v1)
    return filtered.slice(0, 2).map((c) => c.line);
  }

  return candidates.slice(0, 2).map((c) => c.line);
}

/**
 * Extract player stats from a stat line.
 * Expected format: [Name] [Score] [K] [A] [D] [Ping]
 * But order might vary, so we use heuristics.
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

  // Separate words into text and numbers
  const textWords: string[] = [];
  const numbers: number[] = [];

  for (const word of line.words) {
    const cleaned = word.text.trim();
    if (/^\d+$/.test(cleaned)) {
      numbers.push(parseInt(cleaned));
    } else if (cleaned.length > 1 && !/^[|\[\]{}()]+$/.test(cleaned)) {
      // Filter out OCR artifacts like |, [], etc.
      textWords.push(cleaned);
    }
  }

  // Name is typically the longest text token or first text token
  if (textWords.length > 0) {
    // Filter out common OCR misreads and column headers
    const filtered = textWords.filter(
      (t) => !["Score", "Kills", "Deaths", "Assists", "Ping", "K", "D", "A"].includes(t)
    );
    if (filtered.length > 0) {
      result.name = filtered[0];
    }
  }

  // For numbers, typical order in R6 is: Score, K, A, D, Ping
  // Score is usually the largest (hundreds/thousands)
  // Ping is usually 10-200
  // K, A, D are usually 0-20 in a single match

  if (numbers.length >= 4) {
    // Sort by likely category
    const sorted = [...numbers].sort((a, b) => b - a);

    // Largest is probably score
    result.score = sorted[0];

    // Find K, D, A among remaining (smaller numbers, typically < 30)
    const kdaCandidates = numbers.filter((n) => n < 50 && n !== result.score);

    if (kdaCandidates.length >= 3) {
      // Order in the line matters: K, A, D or K, D based on position
      const kda = kdaCandidates.slice(0, 3);
      result.kills = kda[0];
      result.assists = kda[1];
      result.deaths = kda[2];
    } else if (kdaCandidates.length >= 2) {
      result.kills = kdaCandidates[0];
      result.deaths = kdaCandidates[1];
    }
  } else if (numbers.length >= 2) {
    // Minimal case: just K and D
    const small = numbers.filter((n) => n < 50);
    if (small.length >= 2) {
      result.kills = small[0];
      result.deaths = small[1];
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
 * Applies contrast enhancement and grayscale conversion.
 */
export async function preprocessImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      resolve(file); // Fallback to original
      return;
    }

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Convert to grayscale and enhance contrast
      for (let i = 0; i < data.length; i += 4) {
        // Grayscale
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

        // Contrast enhancement (stretch histogram)
        const enhanced = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128));

        data[i] = enhanced;
        data[i + 1] = enhanced;
        data[i + 2] = enhanced;
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
