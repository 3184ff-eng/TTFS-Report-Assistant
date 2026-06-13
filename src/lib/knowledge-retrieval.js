import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const searchableDirectories = ["knowledge", "examples"];
const searchableExtensions = new Set([".md", ".txt"]);
const maxChunkCharacters = 2200;
const defaultResultLimit = 6;

function projectRoot() {
  return process.cwd();
}

function walkFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory)
    .flatMap((entry) => {
      const fullPath = path.join(directory, entry);
      const stats = statSync(fullPath);

      if (stats.isDirectory()) {
        return walkFiles(fullPath);
      }

      return searchableExtensions.has(path.extname(entry).toLowerCase()) ? [fullPath] : [];
    })
    .sort();
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9/$#.' -]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "this",
    "that",
    "from",
    "into",
    "must",
    "should",
    "fire",
    "report",
    "ttfs"
  ]);

  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function splitDocument(content) {
  const sections = String(content || "")
    .split(/\n(?=#{1,3}\s+)/)
    .map((section) => section.trim())
    .filter(Boolean);

  return (sections.length ? sections : [content])
    .flatMap((section) => {
      if (section.length <= maxChunkCharacters) {
        return [section];
      }

      const chunks = [];
      let remaining = section;
      while (remaining.length > maxChunkCharacters) {
        let splitAt = remaining.lastIndexOf("\n", maxChunkCharacters);
        if (splitAt < maxChunkCharacters * 0.55) {
          splitAt = remaining.lastIndexOf(" ", maxChunkCharacters);
        }
        if (splitAt < maxChunkCharacters * 0.55) {
          splitAt = maxChunkCharacters;
        }
        chunks.push(remaining.slice(0, splitAt).trim());
        remaining = remaining.slice(splitAt).trim();
      }
      if (remaining) {
        chunks.push(remaining);
      }
      return chunks;
    })
    .filter(Boolean);
}

export function loadKnowledgeChunks() {
  return searchableDirectories.flatMap((directoryName) => {
    const directory = path.join(projectRoot(), directoryName);
    return walkFiles(directory).flatMap((filePath) => {
      const relativePath = path.relative(projectRoot(), filePath);
      const content = readFileSync(filePath, "utf8");
      return splitDocument(content).map((text, index) => ({
        id: `${relativePath}#${index + 1}`,
        source: relativePath,
        text
      }));
    });
  });
}

export function retrieveKnowledge(query, options = {}) {
  const limit = options.limit || defaultResultLimit;
  const queryTokens = tokenize(query);

  if (!queryTokens.length) {
    return [];
  }

  const queryTokenSet = new Set(queryTokens);

  return loadKnowledgeChunks()
    .map((chunk) => {
      const normalizedChunk = normalizeText(`${chunk.source} ${chunk.text}`);
      const chunkTokens = tokenize(normalizedChunk);
      const chunkTokenSet = new Set(chunkTokens);
      const overlapScore = [...queryTokenSet].reduce((score, token) => {
        if (chunkTokenSet.has(token)) {
          return score + 4;
        }
        if (normalizedChunk.includes(token)) {
          return score + 1;
        }
        return score;
      }, 0);
      const sourceBoost =
        /guide|vetting|checklist|good_report|standard/i.test(chunk.source) ||
        /northern division|vetting checklist|good report/i.test(chunk.text)
          ? 3
          : 0;

      return {
        ...chunk,
        score: overlapScore + sourceBoost
      };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score || a.source.localeCompare(b.source))
    .slice(0, limit);
}

export function formatRetrievedKnowledge(chunks) {
  if (!chunks.length) {
    return "No local knowledge excerpts were retrieved. Continue to follow the standing TTFS rules and flag missing information.";
  }

  return chunks
    .map((chunk, index) => {
      return `Excerpt ${index + 1} (${chunk.source})\n${chunk.text}`;
    })
    .join("\n\n---\n\n");
}
