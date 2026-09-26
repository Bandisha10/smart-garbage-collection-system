export interface ParsedVoiceCollection {
  dustbinId?: string;
  weight?: number;
  action?: 'collected' | 'issue';
  rawTranscript: string;
  isValid: boolean;
  errorMessage?: string;
  wakeWordDetected?: boolean;
  isCancellation?: boolean;
}

const DIGIT_WORDS: Record<string, string> = {
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
};

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
};

// Regex pattern to match "Hey Eco", "Hi Eco", "OK Eco", "Eco", "Echo", "Aiko", "Ekko", etc.
export const WAKE_WORD_REGEX = /\b(?:hey|hi|hello|ok|okay)?\s*(?:eco|echo|ekko|aiko|ico|agro|eggo)\b/i;

// Regex pattern to match cancellation / abort commands
export const CANCEL_REGEX = /\b(?:cancel|abort|stop|no|don't|dont|undo|wrong|wait|hold on|never mind|nevermind)\b/i;

/**
 * Checks if the given spoken text contains the "Hey Eco" wake word
 */
export function detectWakeWord(text: string): boolean {
  if (!text) return false;
  return WAKE_WORD_REGEX.test(text);
}

/**
 * Removes the wake word prefix from the spoken text so payload can be parsed cleanly
 */
export function stripWakeWord(text: string): string {
  if (!text) return '';
  return text.replace(WAKE_WORD_REGEX, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Checks if the spoken text is a cancellation or abort command
 */
export function detectCancelCommand(text: string): boolean {
  if (!text) return false;
  return CANCEL_REGEX.test(text);
}

/**
 * Converts digit sequences like "seven nine zero seven" -> "7907"
 */
function normalizeDigitWords(text: string): string {
  let words = text.split(/\s+/);
  let result: string[] = [];
  let currentDigitSeq = '';

  for (let i = 0; i < words.length; i++) {
    const w = words[i].toLowerCase();
    if (DIGIT_WORDS[w] !== undefined) {
      currentDigitSeq += DIGIT_WORDS[w];
    } else {
      if (currentDigitSeq) {
        result.push(currentDigitSeq);
        currentDigitSeq = '';
      }
      result.push(words[i]);
    }
  }
  if (currentDigitSeq) {
    result.push(currentDigitSeq);
  }
  return result.join(' ');
}

function parseNumber(raw: string): number | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();

  // Direct numeric (including decimals e.g. "3", "4.5")
  const num = parseFloat(trimmed);
  if (!isNaN(num) && isFinite(num)) {
    return num;
  }

  // Handle words like "three point five" or "4 point 5"
  if (trimmed.includes('point')) {
    const parts = trimmed.split('point').map((p) => p.trim());
    const intPart = NUMBER_WORDS[parts[0]] ?? parseInt(parts[0], 10);
    const decPart = NUMBER_WORDS[parts[1]] ?? parseInt(parts[1], 10);
    if (!isNaN(intPart) && !isNaN(decPart)) {
      return parseFloat(`${intPart}.${decPart}`);
    }
  }

  if (NUMBER_WORDS[trimmed] !== undefined) {
    return NUMBER_WORDS[trimmed];
  }

  return null;
}

/**
 * Normalizes bin ID string into standard database format (e.g. "7907" -> "B-7907", "b 7907" -> "B-7907")
 */
function formatBinId(id: string): string {
  const clean = id.trim().toUpperCase();
  // If already like B-1234 or BIN-1234
  if (/^B-\d+/i.test(clean) || /^BIN-\d+/i.test(clean)) {
    return clean;
  }
  // If like B1234 or B 1234
  if (/^B\s*(\d+)$/i.test(clean)) {
    const num = clean.replace(/^B\s*/i, '');
    return `B-${num}`;
  }
  // If purely numeric digits like 7907 -> auto-prefix B-7907
  if (/^\d{3,5}$/.test(clean)) {
    return `B-${clean}`;
  }
  return clean;
}

/**
 * Parses natural language speech transcript into structured collection data.
 * Supports:
 * - "Hey Eco bin 7907 collected 3 kg"
 * - "Bin 7907 collected 3 kg"
 * - "Bin B-7907 collected with 3 kg weight"
 * - "Dustbin is 7907 4.5 kg"
 * - "Cancel", "Stop", "Abort"
 */
export function parseVoiceCollection(
  transcript: string,
  options?: { requireWakeWord?: boolean }
): ParsedVoiceCollection {
  const result: ParsedVoiceCollection = {
    rawTranscript: transcript || '',
    isValid: false,
    wakeWordDetected: false,
    isCancellation: false,
  };

  if (!transcript || !transcript.trim()) {
    result.errorMessage = 'No speech detected. Please try speaking again.';
    return result;
  }

  // 1. Check for cancellation command
  if (detectCancelCommand(transcript)) {
    result.isCancellation = true;
    result.isValid = false;
    result.errorMessage = 'Action cancelled.';
    return result;
  }

  // 2. Check for Wake Word
  const hasWakeWord = detectWakeWord(transcript);
  result.wakeWordDetected = hasWakeWord;

  if (options?.requireWakeWord && !hasWakeWord) {
    result.errorMessage = 'Wake word "Hey Eco" not detected.';
    return result;
  }

  // 3. Strip Wake Word if present
  let cleanText = hasWakeWord ? stripWakeWord(transcript) : transcript;

  cleanText = cleanText
    .replace(/[,?!;:]/g, ' ')
    .replace(/\.(?!\d)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If user ONLY said "Hey Eco", we acknowledge wake word without error
  if (!cleanText || cleanText.length === 0) {
    result.wakeWordDetected = true;
    result.errorMessage = 'Listening for details...';
    return result;
  }

  // 4. Convert spoken digit words: "seven nine zero seven" -> "7907"
  cleanText = normalizeDigitWords(cleanText);

  // 5. Normalize common phonetic speech-to-text confusions for "bin" / "dustbin"
  cleanText = cleanText
    .replace(/\b(?:been|bean|ben|pin|pen|dabba|trash|garbage|container|box|bucket)\b/gi, 'bin')
    .replace(/\b(?:bee|be)\s+(\d+)\b/gi, 'b-$1')
    .replace(/\bb\s+(\d+)\b/gi, 'b-$1');

  // 6. EXTRACT DUSTBIN / BIN ID
  let extractedBinId: string | null = null;

  const binPatterns = [
    // "bin B-7907", "dustbin B-102", "bin 7907", "dustbin number is 7907", "bin #7907"
    /(?:dustbin|dust\s*bin|bin)\s*(?:number|no|code|id|#)?\s*(?:is|was|has|of|to|:)?\s*([a-zA-Z0-9\-_]+(?:\s*\d+)?)/i,
    // "B-7907", "b 7907", "bin-7907"
    /\b(b[\s-]?\d+)\b/i,
    /\b(bin[\s-]?\d+)\b/i,
    /#\s*([a-zA-Z0-9\-_]+)/i,
    // Pure standalone 3 to 5 digit number (e.g. "7907 collected 3 kg")
    /\b(\d{3,5})\b/,
  ];

  const blacklist = [
    'with', 'collected', 'picked', 'is', 'has', 'was', 'and', 'weight',
    'problem', 'issue', 'waste', 'kilos', 'kilo', 'kg', 'kgs', 'done',
    'scanned', 'cleared', 'the', 'this', 'that', 'number', 'no', 'eco', 'echo'
  ];

  for (const pattern of binPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (!blacklist.includes(candidate.toLowerCase())) {
        extractedBinId = formatBinId(candidate);
        break;
      }
    }
  }

  if (!extractedBinId) {
    result.errorMessage = 'Could not identify the bin number. Please say "Hey Eco, Bin [Number]".';
    return result;
  }
  result.dustbinId = extractedBinId;

  // 7. EXTRACT ACTION
  const lowerText = cleanText.toLowerCase();
  const issueKeywords = ['issue', 'problem', 'damaged', 'defect', 'broken', 'missing', 'overflow', 'overflowing', 'full', 'dirty', 'hazardous'];
  const collectKeywords = ['collected', 'collect', 'picked', 'done', 'completed', 'cleared', 'scanned', 'picked up', 'empty', 'emptied', 'waste', 'clear'];

  const hasIssue = issueKeywords.some((kw) => lowerText.includes(kw));
  const hasCollect = collectKeywords.some((kw) => lowerText.includes(kw));

  if (hasIssue) {
    result.action = 'issue';
  } else if (hasCollect) {
    result.action = 'collected';
  } else {
    // If the sentence mentions weight or kg, default to "collected"
    if (lowerText.includes('kg') || lowerText.includes('kilo') || lowerText.includes('weight')) {
      result.action = 'collected';
    } else {
      result.errorMessage = 'Could not determine action (collected or issue). Please repeat.';
      return result;
    }
  }

  // 8. EXTRACT WEIGHT (Required for "collected", optional for "issue")
  if (result.action === 'collected') {
    let extractedWeight: number | null = null;

    const weightPatterns = [
      // "3 kg", "3.5 kgs", "3 kilograms", "3 kilos", "3 kilo", "3 kg waste"
      /(\d+(?:\.\d+)?|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty)\b(?:\s*point\s*\w+)?)\s*(?:kg|kgs|kilo|kilos|kilograms?)\b/i,
      // "weight is 3 kg", "weight 3.5", "volume 3"
      /(?:weight|volume)\s*(?:is|of|:)?\s*(\d+(?:\.\d+)?|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty)\b(?:\s*point\s*\w+)?)(?:\s*(?:kg|kgs|kilo|kilograms?))?/i,
      // "3 kg weight", "5 weight"
      /(\d+(?:\.\d+)?)\s*(?:kg|kgs)?\s*weight\b/i,
      // "with 3", "of 3"
      /(?:with|of)\s+(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilo)?/i,
    ];

    for (const pattern of weightPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        const parsed = parseNumber(match[1]);
        if (parsed !== null && parsed > 0) {
          extractedWeight = parsed;
          break;
        }
      }
    }

    if (extractedWeight === null || extractedWeight <= 0) {
      result.errorMessage = 'Could not identify the weight. Please say the weight in kg.';
      return result;
    }

    result.weight = extractedWeight;
  }

  result.isValid = true;
  return result;
}
