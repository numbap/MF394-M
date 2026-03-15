/**
 * nameMatch.js — Pure-JS name-to-face matching library.
 * Zero dependencies. Works on Node, Web, and React Native.
 *
 * Platform-specific OCR + face detection feed into this shared logic:
 *   Web:  Tesseract.js (OCR) + face-api.js (faces)
 *   RN:   ML Kit via react-native-vision-camera-mlkit (both)
 *
 * Input format:
 *   textLines: [{ text, bbox: {x0,y0,x1,y1}, center: {x,y} }]
 *   faces:     [{ id, boundingBox: {x,y,width,height}, deleted? }]
 */

// ---------------------------------------------------------------------------
// UI Blocklist — common social media / video call text that isn't a name
// ---------------------------------------------------------------------------
const UI_BLOCKLIST = new Set([
  // Actions
  "like", "comment", "share", "follow", "repost", "reply", "save", "send",
  "pin", "bookmark", "subscribe", "unsubscribe", "block", "report", "mute",
  "unmute", "hide", "unhide", "archive", "unarchive", "forward", "copy",
  "paste", "undo", "redo", "refresh", "retry", "submit", "post", "upload",
  "download", "install", "update", "upgrade", "connect", "disconnect",
  "accept", "decline", "confirm", "deny", "approve", "reject",
  // Navigation
  "view", "more", "edit", "delete", "close", "back", "next", "done",
  "cancel", "settings", "menu", "home", "search", "discover", "explore",
  "browse", "filter", "sort", "options", "preferences", "help", "about",
  "privacy", "terms", "logout", "login", "signup", "register", "continue",
  "skip", "start", "finish", "open", "exit", "return", "go",
  // Social labels
  "story", "stories", "reel", "reels", "feed", "trending", "suggested",
  "sponsored", "notification", "notifications", "message", "messages",
  "chat", "inbox", "outbox", "draft", "drafts", "sent", "received",
  "following", "followers", "friends", "mutual", "people", "groups",
  "pages", "events", "marketplace", "watch", "gaming", "news",
  // Video call
  "camera", "mic", "microphone", "participant", "participants", "host",
  "cohost", "lobby", "recording", "leave", "join", "meeting", "call",
  "screen", "share screen", "raise hand", "reactions", "breakout",
  "whiteboard", "captions", "transcript", "waiting room",
  // Platforms
  "instagram", "facebook", "twitter", "linkedin", "tiktok", "zoom",
  "teams", "slack", "discord", "snapchat", "whatsapp", "telegram",
  "youtube", "pinterest", "reddit", "tumblr", "threads", "mastodon",
  // Time words
  "today", "yesterday", "ago", "hour", "hours", "minute", "minutes",
  "second", "seconds", "day", "days", "week", "weeks", "month", "months",
  "year", "years", "now", "just now", "recently", "earlier", "later",
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct",
  "nov", "dec", "january", "february", "march", "april", "june", "july",
  "august", "september", "october", "november", "december",
  // Metrics
  "views", "impressions", "reach", "engagement", "analytics", "insights",
  "statistics", "stats", "activity", "performance",
  // Content
  "photo", "photos", "video", "videos", "album", "albums", "profile",
  "bio", "tag", "tags", "hashtag", "hashtags", "caption", "location",
  "verified", "live", "online", "offline", "active", "away", "busy",
  "available", "status", "typing", "seen", "delivered", "read",
  // Misc UI
  "add", "new", "create", "remove", "clear", "reset", "apply", "select",
  "all", "none", "other", "show", "showing", "load", "loading", "more",
  "less", "expand", "collapse", "top", "bottom", "left", "right",
  "previous", "page", "of", "results", "no results", "empty", "error",
  "success", "warning", "info", "details", "summary", "description",
  "title", "name", "email", "phone", "address", "website", "link",
  "attachment", "file", "document", "image", "audio", "gif", "sticker",
  "emoji", "reaction", "thumbs up", "love", "haha", "wow", "sad", "angry",
  "care", "celebrate", "support", "insightful", "curious", "funny",
  // Common short labels
  "ok", "yes", "no", "on", "off", "am", "pm", "vs", "or", "and", "the",
  "for", "to", "in", "at", "by", "is", "it", "be", "as", "so", "if",
  "not", "but", "was", "are", "has", "had", "get", "got", "set", "see",
  "say", "her", "him", "his", "its", "our", "you", "who", "how", "why",
  "what", "when", "where", "which", "with", "from", "into", "over",
  "than", "then", "them", "they", "this", "that", "will", "been",
  "would", "could", "should", "about", "after", "before", "between",
  // Social engagement
  "liked", "commented", "shared", "followed", "replied", "saved",
  "reposted", "mentioned", "tagged", "invited", "added", "removed",
  "joined", "left", "started", "ended", "updated", "changed", "posted",
  "published", "unpublished", "pinned", "unpinned", "featured",
  // Counts that OCR might pick up with text
  "likes", "comments", "shares", "replies", "reposts", "saves",
  "bookmarks", "reactions", "votes",
  // Descriptive words (contact cards, bios, profiles)
  "hosts", "hosting", "hosted", "podcast", "podcasts", "blogger", "author",
  "teammate", "teammates", "colleague", "colleagues", "coworker", "coworkers",
  "manager", "director", "engineer", "designer", "developer", "analyst",
  "consultant", "coordinator", "assistant", "intern", "volunteer",
  "student", "teacher", "professor", "coach", "mentor", "advisor",
  "friend", "neighbor", "classmate", "roommate", "partner",
  // UI instructions
  "double-click", "right-click", "long-press", "swipe", "scroll", "drag", "drop",
  "tap", "press", "hold", "release", "hover", "focus", "blur",
]);

// Name prefixes/suffixes that boost score
const NAME_AFFIXES = new Set([
  "jr", "jr.", "sr", "sr.", "ii", "iii", "iv", "v",
  "dr", "dr.", "mr", "mr.", "mrs", "mrs.", "ms", "ms.", "prof", "prof.",
  "md", "m.d.", "phd", "ph.d.", "esq", "esq.",
]);

// ---------------------------------------------------------------------------
// Regex patterns for rejection
// ---------------------------------------------------------------------------
const URL_PATTERN = /https?:\/\/|www\.|\.com|\.org|\.net|\.io|\.co\b/i;
const EMAIL_PATTERN = /@\S+\.\S+/;
const PURE_NUMERIC = /^[\d,.\s%$]+$/;
const TIMESTAMP_PATTERN = /^\d{1,2}[hms]\b|\d{1,2}:\d{2}|\b\d{1,2}\/\d{1,2}/;
const EMOJI_RANGE = /[\u{1F600}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FEFF}\u{1F000}-\u{1FFFF}]/u;
const HANDLE_HASHTAG = /^[@#]/;
const METRIC_PATTERN = /\d+\.?\d*\s*[KkMmBb]\b|\d+\s*(likes?|views?|followers?|following|comments?|shares?|reposts?|saves?|subscribers?|impressions?|reach|posts?)/i;
const DATE_PATTERN = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d/i;

// ---------------------------------------------------------------------------
// regroupWords(words, options?) → text segments
// ---------------------------------------------------------------------------
/**
 * Regroup word-level OCR output into properly segmented text lines.
 * Sorts words by position, groups into rows by y-proximity, then splits
 * rows by horizontal gaps (different card/column in a grid layout).
 *
 * Works with any OCR engine that returns word-level bounding boxes
 * (Tesseract.js on web, ML Kit on React Native).
 *
 * @param {Array<{ text: string, bbox: { x0: number, y0: number, x1: number, y1: number } }>} words
 * @param {{ gapMultiplier?: number }} [options] - gapMultiplier controls horizontal gap sensitivity (default 2.5)
 * @returns {Array<{ text: string, bbox: { x0: number, y0: number, x1: number, y1: number }, center: { x: number, y: number } }>}
 */
export function regroupWords(words, options = {}) {
  if (!words || words.length === 0) return [];

  const gapMultiplier = options.gapMultiplier ?? 2.5;

  // Add yCenter to each word for row grouping
  const enriched = words.map((w) => ({
    ...w,
    yCenter: (w.bbox.y0 + w.bbox.y1) / 2,
  }));

  // Sort by y-center, then x position
  enriched.sort((a, b) => a.yCenter - b.yCenter || a.bbox.x0 - b.bbox.x0);

  // Estimate line height threshold from word positions
  const maxY = Math.max(...enriched.map((w) => w.bbox.y1));
  const lineThreshold = Math.max(15, Math.round(maxY * 0.015));

  // Group words into rows by vertical proximity
  const rows = [];
  let currentRow = null;

  for (const word of enriched) {
    if (!currentRow || Math.abs(word.yCenter - currentRow.yCenter) > lineThreshold) {
      if (currentRow) rows.push(currentRow);
      currentRow = { words: [word], yCenter: word.yCenter };
    } else {
      currentRow.words.push(word);
      currentRow.yCenter =
        currentRow.words.reduce((sum, w) => sum + w.yCenter, 0) / currentRow.words.length;
    }
  }
  if (currentRow) rows.push(currentRow);

  // Within each row, split into segments by horizontal gaps.
  // Gap > gapMultiplier × average word height = separate text segment.
  const textLines = [];
  for (const row of rows) {
    row.words.sort((a, b) => a.bbox.x0 - b.bbox.x0);

    const avgHeight =
      row.words.reduce((sum, w) => sum + (w.bbox.y1 - w.bbox.y0), 0) / row.words.length;
    const gapThreshold = avgHeight * gapMultiplier;

    let segment = [row.words[0]];
    for (let i = 1; i < row.words.length; i++) {
      const gap = row.words[i].bbox.x0 - row.words[i - 1].bbox.x1;
      if (gap > gapThreshold) {
        textLines.push(buildSegment(segment));
        segment = [row.words[i]];
      } else {
        segment.push(row.words[i]);
      }
    }
    textLines.push(buildSegment(segment));
  }

  return textLines;
}

/**
 * Combine an array of word objects into a single text segment with merged bbox.
 * @param {Array<{ text: string, bbox: { x0: number, y0: number, x1: number, y1: number } }>} words
 * @returns {{ text: string, bbox: { x0: number, y0: number, x1: number, y1: number }, center: { x: number, y: number } }}
 */
function buildSegment(words) {
  const text = words.map((w) => w.text).join(" ");
  const bbox = {
    x0: Math.min(...words.map((w) => w.bbox.x0)),
    y0: Math.min(...words.map((w) => w.bbox.y0)),
    x1: Math.max(...words.map((w) => w.bbox.x1)),
    y1: Math.max(...words.map((w) => w.bbox.y1)),
  };
  const center = {
    x: Math.round((bbox.x0 + bbox.x1) / 2),
    y: Math.round((bbox.y0 + bbox.y1) / 2),
  };
  return { text, bbox, center };
}

// ---------------------------------------------------------------------------
// isLikelyName(text) → { score: 0-1, reason: string }
// ---------------------------------------------------------------------------
/**
 * Heuristic scoring of whether OCR text looks like a person's name.
 *
 * @param {string} text - A single OCR text line
 * @returns {{ score: number, reason: string }}
 */
export function isLikelyName(text) {
  if (!text || typeof text !== "string") {
    return { score: 0, reason: "empty" };
  }

  const trimmed = text.trim();
  if (trimmed.length <= 2) {
    return { score: 0, reason: "too short" };
  }

  // Reject text containing characters that never appear in names
  // (brackets, math symbols, pipes, slashes, etc. — common OCR garbage)
  if (/[\\|=\[\]{}()<>+*^%$#@!~;:?"_/]/.test(trimmed)) {
    return { score: 0, reason: "special characters" };
  }

  // Immediate rejections
  if (URL_PATTERN.test(trimmed)) return { score: 0, reason: "url" };
  if (EMAIL_PATTERN.test(trimmed)) return { score: 0, reason: "email" };
  if (PURE_NUMERIC.test(trimmed)) return { score: 0, reason: "numeric" };
  if (TIMESTAMP_PATTERN.test(trimmed)) return { score: 0, reason: "timestamp" };
  if (DATE_PATTERN.test(trimmed)) return { score: 0, reason: "date" };
  if (EMOJI_RANGE.test(trimmed)) return { score: 0, reason: "emoji" };
  if (HANDLE_HASHTAG.test(trimmed)) return { score: 0, reason: "handle/hashtag" };
  if (METRIC_PATTERN.test(trimmed)) return { score: 0, reason: "metric" };

  const words = trimmed.split(/\s+/);
  if (words.length > 4) return { score: 0, reason: "too many words" };
  if (words.some((w) => w.length > 20)) return { score: 0, reason: "word too long" };

  // Blocklist check (case-insensitive, full string)
  const lower = trimmed.toLowerCase();
  if (UI_BLOCKLIST.has(lower)) return { score: 0, reason: "ui blocklist" };

  // Also check individual words for single-word entries
  if (words.length === 1 && UI_BLOCKLIST.has(words[0].toLowerCase())) {
    return { score: 0, reason: "ui blocklist (word)" };
  }

  // Check if ALL words are blocklisted (e.g. "view more")
  // Also split hyphenated words (e.g. "work-colleague" → check "work" and "colleague")
  const expandedWords = words.flatMap((w) => w.split("-"));
  if (expandedWords.length > 1 && expandedWords.every((w) => UI_BLOCKLIST.has(w.toLowerCase()))) {
    return { score: 0, reason: "all words blocklisted" };
  }

  // Check if ANY word is blocklisted — penalize but don't reject
  // (some legitimate names could contain a common word, but it's rare)
  const hasBlocklistedWord = expandedWords.some((w) =>
    w.length > 2 && UI_BLOCKLIST.has(w.toLowerCase())
  );
  if (hasBlocklistedWord && words.length > 1) {
    return { score: 0, reason: "contains blocklisted word" };
  }

  // Digits mixed with letters (e.g. "user123", "photo2")
  if (/\d/.test(trimmed) && /[a-zA-Z]/.test(trimmed)) {
    // Allow if digits are part of name suffix like "III", "3rd"
    const hasAffix = words.some((w) => NAME_AFFIXES.has(w.toLowerCase()));
    if (!hasAffix) {
      return { score: 0, reason: "digits mixed with letters" };
    }
  }

  // --- Scoring ---
  let score = 0.5;
  const reasons = [];

  // Title case boost: first letter uppercase, rest lowercase for each word
  const isTitleCase = words.every(
    (w) => /^[A-Z]/.test(w) && (w.length === 1 || /^[A-Z][a-z'-]+$/.test(w))
  );
  if (isTitleCase && words.length >= 2) {
    score += 0.2;
    reasons.push("title case");
  }

  // Non-title-case penalty for multi-word phrases.
  // Real names are almost always title case. Phrases like "Hosts a podcast"
  // or "work-colleague teammate" are descriptions, not names.
  if (!isTitleCase && words.length >= 2) {
    score -= 0.2;
    reasons.push("not title case");
  }

  // Word count
  if (words.length === 2) {
    score += 0.1;
    reasons.push("2 words");
  } else if (words.length === 3) {
    score += 0.1;
    reasons.push("3 words");
  } else if (words.length === 1) {
    score -= 0.1;
    reasons.push("single word");
  }

  // Name prefix/suffix
  if (words.some((w) => NAME_AFFIXES.has(w.toLowerCase()))) {
    score += 0.15;
    reasons.push("name affix");
  }

  // All caps multi-word
  if (words.length > 1 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
    score -= 0.2;
    reasons.push("all caps");
  }

  // Long text
  if (trimmed.length > 25) {
    score -= 0.2;
    reasons.push("long text");
  }

  // Clamp
  score = Math.max(0, Math.min(1, score));

  return {
    score,
    reason: reasons.length > 0 ? reasons.join(", ") : "base score",
  };
}

// ---------------------------------------------------------------------------
// filterNames(textLines, options?) → scored name candidates
// ---------------------------------------------------------------------------
/**
 * Filter OCR text lines down to likely name candidates.
 *
 * @param {Array<{ text: string, bbox?: object, center?: { x: number, y: number } }>} textLines
 * @param {{ threshold?: number }} [options]
 * @returns {Array<{ text: string, score: number, reason: string, bbox?: object, center?: { x: number, y: number } }>}
 */
export function filterNames(textLines, options = {}) {
  const threshold = options.threshold ?? 0.4;

  return textLines
    .map((line) => {
      const result = isLikelyName(line.text);
      return {
        text: line.text.trim(),
        score: result.score,
        reason: result.reason,
        bbox: line.bbox,
        center: line.center,
      };
    })
    .filter((entry) => entry.score >= threshold)
    .sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// matchNamesToFaces(names, faces, options?) → matches
// ---------------------------------------------------------------------------
/**
 * Proximity-weighted greedy matching of name positions to face positions.
 * Vertical bias: names below faces get a 30% distance discount (social media pattern).
 *
 * @param {Array<{ text: string, center: { x: number, y: number } }>} names - Name candidates with positions
 * @param {Array<{ id: string, boundingBox: { x: number, y: number, width: number, height: number } }>} faces
 * @param {{ imageWidth?: number, imageHeight?: number, maxDistanceFraction?: number }} [options]
 * @returns {Array<{ faceId: string, name: string, confidence: number, distance: number }>}
 */
export function matchNamesToFaces(names, faces, options = {}) {
  if (!names || names.length === 0 || !faces || faces.length === 0) {
    return [];
  }

  const imgW = options.imageWidth || 1000;
  const imgH = options.imageHeight || 1000;
  const maxDistFrac = options.maxDistanceFraction ?? 0.4;
  const maxDist = Math.sqrt(imgW * imgW + imgH * imgH) * maxDistFrac;

  // Compute face centers and heights
  const faceCenters = faces.map((f) => {
    const bb = f.boundingBox || {};
    return {
      id: f.id,
      cx: (bb.x || 0) + (bb.width || 0) / 2,
      cy: (bb.y || 0) + (bb.height || 0) / 2,
      height: bb.height || 0,
    };
  });

  // Build all (name, face) pairs with weighted distance
  const pairs = [];
  names.forEach((nameEntry, ni) => {
    const nx = nameEntry.center?.x ?? 0;
    const ny = nameEntry.center?.y ?? 0;

    faceCenters.forEach((fc, fi) => {
      const dx = nx - fc.cx;
      const dy = ny - fc.cy;
      let dist = Math.sqrt(dx * dx + dy * dy);

      // Vertical bias: if name center is below face center (within 2x face height),
      // reduce distance by 30% — names typically appear below faces in social media
      if (ny > fc.cy && (ny - fc.cy) < fc.height * 2) {
        dist *= 0.7;
      }

      pairs.push({
        nameIdx: ni,
        faceIdx: fi,
        faceId: fc.id,
        name: nameEntry.text,
        dist,
        rawDist: Math.sqrt(dx * dx + dy * dy),
      });
    });
  });

  // Filter pairs exceeding max distance
  const validPairs = pairs.filter((p) => p.rawDist <= maxDist);

  // Sort by distance ascending
  validPairs.sort((a, b) => a.dist - b.dist);

  // Greedy assign — no duplicate faces, no duplicate names
  const assignedFaces = new Set();
  const assignedNames = new Set();
  const matches = [];

  for (const pair of validPairs) {
    if (assignedFaces.has(pair.faceIdx) || assignedNames.has(pair.nameIdx)) {
      continue;
    }
    assignedFaces.add(pair.faceIdx);
    assignedNames.add(pair.nameIdx);

    // Confidence: inverse of normalized distance (closer = higher confidence)
    const diagonal = Math.sqrt(imgW * imgW + imgH * imgH);
    const confidence = Math.max(0, Math.min(1, 1 - pair.rawDist / diagonal));

    matches.push({
      faceId: pair.faceId,
      name: pair.name,
      confidence: Math.round(confidence * 100) / 100,
      distance: Math.round(pair.rawDist),
    });

    console.log(
      `Matched "${pair.name}" -> face ${pair.faceIdx} (dist=${Math.round(pair.rawDist)}px, confidence=${Math.round(confidence * 100)}%)`
    );
  }

  return matches;
}

// ---------------------------------------------------------------------------
// identifyNamesLocally(textLines, faces, options?) — main entry point
// ---------------------------------------------------------------------------
/**
 * Complete local name identification pipeline. Replaces the Gemini API call.
 *
 * @param {Array<{ text: string, bbox: { x0: number, y0: number, x1: number, y1: number }, center: { x: number, y: number } }>} textLines - OCR output
 * @param {Array<{ id: string, boundingBox: { x: number, y: number, width: number, height: number }, deleted?: boolean }>} faces - Detected faces
 * @param {{ imageWidth?: number, imageHeight?: number, threshold?: number }} [options]
 * @returns {{ matches: Array<{ faceId: string, name: string, confidence: number, distance: number }>, candidateNames: string[], unmatchedFaceIds: string[] }}
 */
export function identifyNamesLocally(textLines, faces, options = {}) {
  const activeFaces = faces.filter((f) => !f.deleted);

  // Step 1: Filter text lines to likely names
  const candidates = filterNames(textLines, { threshold: options.threshold });
  const candidateNames = candidates.map((c) => c.text);

  console.log(`Name candidates: ${JSON.stringify(candidateNames)}`);

  if (candidates.length === 0 || activeFaces.length === 0) {
    return {
      matches: [],
      candidateNames,
      unmatchedFaceIds: activeFaces.map((f) => f.id),
    };
  }

  // Step 2: Match names to faces by proximity
  const matches = matchNamesToFaces(candidates, activeFaces, {
    imageWidth: options.imageWidth,
    imageHeight: options.imageHeight,
  });

  // Step 3: Identify unmatched faces
  const matchedFaceIds = new Set(matches.map((m) => m.faceId));
  const unmatchedFaceIds = activeFaces
    .filter((f) => !matchedFaceIds.has(f.id))
    .map((f) => f.id);

  return { matches, candidateNames, unmatchedFaceIds };
}
