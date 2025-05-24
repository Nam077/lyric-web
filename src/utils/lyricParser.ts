/**
 * Utility functions for parsing and processing lyric data from Zing MP3 API
 * # Step 1: Import required lodash utilities for safe data manipulation
 */
import { 
  get, has, size, filter, trim, isEmpty, map, first, last, compact, 
  findLastIndex, findIndex, some, find, join, includes, 
  toLower, split, clamp, max, every
} from 'lodash';

// Types
export interface WordData {
  data: string;
  startTime: number;
  endTime: number;
}

export interface SentenceData {
  words: WordData[];
}

export interface LyricDataStructure {
  sentences: SentenceData[];
}

export interface LyricData {
  err: number;
  data: LyricDataStructure;
}

export interface WordTiming {
  text: string;
  startTime: number;
  endTime: number;
}

export interface LyricLine {
  text: string;
  words: WordTiming[];
  startTime: number;
  endTime: number;
}

export interface SyncResult {
  currentLine: LyricLine | null;
  next: LyricLine | null;
  index: number;
  currentWordIndex: number;
  progress: number;
}

/**
 * Parse lyric data from Zing MP3 API format to optimized format for animation
 * # Step 1: Validate input data structure
 * # Step 2: Extract sentences from lyric data
 * # Step 3: Process each sentence and create word timings
 * # Step 4: Return compact array of lyric lines
 */
export function parseLyricDataOptimized(lyricData: LyricData): LyricLine[] {
  // # Step 1: Use lodash for safe access - check error code and sentences existence
  if (get(lyricData, 'err') !== 0 || !get(lyricData, 'data.sentences')) {
    return [];
  }

  // # Step 2: Extract sentences array safely
  const sentences = get(lyricData, 'data.sentences', []) as SentenceData[];
  
  // # Step 3: Process sentences and create lyric lines
  return compact(
    map(
      filter(sentences, sentence => has(sentence, 'words') && size(get(sentence, 'words', [])) > 0),
      sentence => {
        // # Step 3a: Filter valid words with text data
        const words = filter(get(sentence, 'words', []), word => 
          has(word, 'data') && trim(get(word, 'data', ''))
        );
        
        if (isEmpty(words)) return null;

        // # Step 3b: Create timing data for each word
        const wordTimings: WordTiming[] = map(words, word => ({
          text: trim(get(word, 'data', '')),
          startTime: get(word, 'startTime', 0),
          endTime: get(word, 'endTime', get(word, 'startTime', 0) + 500)
        }));

        // # Step 3c: Calculate start/end time for entire sentence using lodash
        const startTime = get(first(wordTimings), 'startTime', 0);
        const endTime = get(last(wordTimings), 'endTime', 0);
        const text = join(map(wordTimings, 'text'), ' ');

        return {
          text,
          words: wordTimings,
          startTime,
          endTime
        };
      }
    )
  );
}

/**
 * Filter and clean lyrics, remove empty or invalid sentences
 * # Step 1: Filter out sentences with less than 2 words
 * # Step 2: Remove sentences with only special characters
 * # Step 3: Return clean lyrics array
 */
export function cleanLyrics(lyrics: LyricLine[]): LyricLine[] {
  return filter(lyrics, lyric => {
    // # Step 1: Remove sentences with less than 2 words using lodash size
    if (size(get(lyric, 'words', [])) < 2) return false;
    
    // # Step 2: Remove sentences with only special characters using lodash some
    const hasValidText = some(get(lyric, 'words', []), word => 
      /[a-zA-ZÀ-ỹ0-9]/.test(get(word, 'text', ''))
    );
    
    return hasValidText;
  });
}

/**
 * Normalize timing to ensure smooth animation
 * # Step 1: Apply delay offset to all timings
 * # Step 2: Ensure minimum duration per word
 * # Step 3: Add minimum gap between words
 * # Step 4: Update sentence start/end times
 * @param lyrics - Array of lyric lines to normalize
 * @param delayMs - Delay in milliseconds to apply to all lyrics (can be negative for early start)
 */
export function normalizeTiming(lyrics: LyricLine[], delayMs: number = 0): LyricLine[] {
  return map(lyrics, (lyric) => {
    // # Step 1: Apply delay and ensure valid timing for each word using lodash
    const words = map(get(lyric, 'words', []), (word) => {
      // # Step 1a: Apply delay offset and ensure minimum duration using lodash max
      const startTime = get(word, 'startTime', 0) + delayMs;
      const endTime = max([get(word, 'endTime', 0) + delayMs, startTime + 300]) || startTime + 300;
      
      return {
        ...word,
        startTime,
        endTime
      };
    });

    // # Step 2: Ensure minimum gap between consecutive words using lodash map
    const normalizedWords = map(words, (word, wordIndex) => {
      if (wordIndex === 0) return word;
      
      const prevWord = get(words, wordIndex - 1);
      const minGap = 100; // 100ms gap minimum
      
      return {
        ...word,
        startTime: max([get(word, 'startTime', 0), get(prevWord, 'endTime', 0) + minGap]) || get(word, 'startTime', 0)
      };
    });

    // # Step 3: Update sentence timing based on normalized words using lodash
    return {
      ...lyric,
      words: normalizedWords,
      startTime: get(first(normalizedWords), 'startTime', 0),
      endTime: get(last(normalizedWords), 'endTime', 0)
    };
  });
}

/**
 * Parse and process complete lyric data
 * # Step 1: Validate input data structure
 * # Step 2: Process each sentence into lyric lines
 * # Step 3: Create word timings for each sentence
 * # Step 4: Return compact array without null values
 */
export function processLyricData(data: LyricData): LyricLine[] {
  // # Step 1: Validate data structure using lodash get()
  if (!get(data, 'data.sentences')) return [];

  // # Step 2-4: Process sentences into lyric lines using lodash
  return compact(
    map(get(data, 'data.sentences', []), (sentence) => {
      if (!get(sentence, 'words') || size(get(sentence, 'words', [])) === 0) return null;
      
      // # Step 3: Create word timing objects using lodash map
      const words: WordTiming[] = map(get(sentence, 'words', []), word => ({
        text: get(word, 'data', ''),
        startTime: get(word, 'startTime', 0),
        endTime: get(word, 'endTime', 0)
      }));

      return {
        text: join(map(words, 'text'), ' '),
        words,
        startTime: get(first(words), 'startTime', 0),
        endTime: get(last(words), 'endTime', 0)
      };
    })
  );
}

/**
 * Find current lyric line based on audio time
 * # Step 1: Check if time is before first lyric
 * # Step 2: Find lyric line containing current time
 * # Step 3: Fallback to nearest previous lyric
 */
export function getCurrentLyricIndex(lyrics: LyricLine[], currentTimeMs: number): number {
  // # Step 1: If before first lyric time, return -1 using lodash
  const firstLyric = first(lyrics);
  if (currentTimeMs < get(firstLyric, 'startTime', 0)) {
    return -1;
  }

  // # Step 2: Find lyric containing current time using lodash
  const foundIndex = findIndex(lyrics, lyric => 
    currentTimeMs >= get(lyric, 'startTime', 0) && 
    currentTimeMs <= get(lyric, 'endTime', 0)
  );

  if (foundIndex !== -1) return foundIndex;

  // # Step 3: Find nearest lyric with startTime less than current time using lodash
  const beforeIndex = findLastIndex(lyrics, lyric => 
    currentTimeMs >= get(lyric, 'startTime', 0)
  );
  
  return max([0, beforeIndex]) || 0;
}

/**
 * Find current word in a lyric line
 * # Step 1: Find word containing current time
 * # Step 2: Handle edge cases (before start, after end)
 */
export function getCurrentWordIndex(lyric: LyricLine, currentTimeMs: number): number {
  const words = get(lyric, 'words', []);
  
  // # Step 1: Find word containing current time using lodash
  const foundIndex = findIndex(words, word =>
    currentTimeMs >= get(word, 'startTime', 0) && 
    currentTimeMs <= get(word, 'endTime', 0)
  );

  if (foundIndex !== -1) return foundIndex;
  
  // # Step 2: Handle edge cases using lodash - return -1 (not started) or length (finished)
  const firstWord = first(words);
  if (currentTimeMs < get(firstWord, 'startTime', 0)) return -1;
  return size(words);
}

/**
 * Create timing offset for demo when no actual audio timing is available
 * # Step 1: Validate input and calculate durations
 * # Step 2: Distribute time evenly across lyrics
 * # Step 3: Create word-level timing within each lyric
 */
export function createDemoTiming(lyrics: LyricLine[], totalDurationMs: number = 180000): LyricLine[] {
  if (isEmpty(lyrics)) return [];
  
  // # Step 1: Calculate average duration per lyric using lodash
  const avgLyricDuration = totalDurationMs / size(lyrics);
  
  // # Step 2-3: Create timing for each lyric and its words using lodash
  return map(lyrics, (lyric, lyricIndex) => {
    const lyricStartTime = lyricIndex * avgLyricDuration;
    const lyricEndTime = lyricStartTime + avgLyricDuration;
    const words = get(lyric, 'words', []);
    const wordDuration = avgLyricDuration / size(words);
    
    // # Step 3: Create word-level timing using lodash map with index
    const updatedWords = map(words, (word, wordIndex) => ({
      ...word,
      startTime: lyricStartTime + (wordIndex * wordDuration),
      endTime: lyricStartTime + ((wordIndex + 1) * wordDuration)
    }));
    
    return {
      ...lyric,
      words: updatedWords,
      startTime: lyricStartTime,
      endTime: lyricEndTime
    };
  });
}

/**
 * Parse lyric data from Zing MP3 API format to optimized format for animation
 * # Step 1: Validate input data structure
 * # Step 2: Extract and process sentences
 * # Step 3: Create word timings for valid words
 * # Step 4: Build lyric line objects
 */
export function parseLyricData(lyricData: LyricDataStructure): LyricLine[] {
  // # Step 1: Validate input structure using lodash
  if (!lyricData || !has(lyricData, 'sentences')) {
    return [];
  }

  // # Step 2: Extract sentences safely using lodash
  const sentences = get(lyricData, 'sentences', []) as SentenceData[];
  
  // # Step 3-4: Process sentences using lodash for better performance
  return compact(
    map(sentences, (sentence: SentenceData) => {
      // Early return if no words using lodash isEmpty
      if (!sentence || isEmpty(get(sentence, 'words', []))) {
        return null;
      }

      const words = get(sentence, 'words', []);
      
      // # Step 3: Create word timings with validation using lodash compact and map
      const wordTimings: WordTiming[] = compact(
        map(words, (word: WordData) => {
          if (!word) return null;

          const startTime = get(word, 'startTime', 0);
          const endTime = get(word, 'endTime', 0);
          const text = trim(get(word, 'data', ''));

          // Validate word timing and text using lodash
          if (!text || startTime < 0 || endTime <= startTime) {
            return null;
          }

          return {
            text,
            startTime,
            endTime
          };
        })
      );

      // Early return if no valid words using lodash
      if (isEmpty(wordTimings)) {
        return null;
      }

      // # Step 4: Build complete lyric line object using lodash utilities
      return {
        text: join(map(wordTimings, 'text'), ' '),
        words: wordTimings,
        startTime: get(first(wordTimings), 'startTime', 0),
        endTime: get(last(wordTimings), 'endTime', 0)
      };
    })
  );
}

/**
 * Synchronize lyrics with current time, find previous and next lyric lines
 * # Step 1: Find lyric line before or at current time
 * # Step 2: Handle edge case when no lyric is found
 * # Step 3: Calculate current word index and progress
 * # Step 4: Build complete sync result
 */
export function syncLyrics(lyrics: LyricLine[], currentTime: number): SyncResult {
  // # Step 1: Find the last lyric that has started using lodash
  const beforeIndex = findLastIndex(lyrics, lyric =>
    get(lyric, 'startTime', 0) <= currentTime
  );
  
  // # Step 2: Handle case when no lyric has started yet using lodash
  if (beforeIndex === -1) {
    return {
      currentLine: null,
      next: first(lyrics) || null,
      index: 0,
      currentWordIndex: -1,
      progress: 0
    };
  }

  // # Step 3: Get current and next lyrics using lodash utilities
  const currentLyric = get(lyrics, beforeIndex);
  const nextLyric = get(lyrics, beforeIndex + 1, null);
  const currentWordIndex = getCurrentWordIndex(currentLyric, currentTime);
  
  // # Step 3a: Calculate progress within current line using lodash for safe access
  const startTime = get(currentLyric, 'startTime', 0);
  const endTime = get(currentLyric, 'endTime', 0);
  const progress = endTime > startTime 
    ? clamp((currentTime - startTime) / (endTime - startTime), 0, 1)
    : 0;

  // # Step 4: Return complete sync result
  return {
    currentLine: currentLyric,
    next: nextLyric,
    index: beforeIndex,
    currentWordIndex,
    progress
  };
}

/**
 * Find lyric line by keyword, supports case-insensitive search
 * # Step 1: Iterate through all lyric lines
 * # Step 2: Search for keyword in each line's words
 * # Step 3: Return first matching lyric with highlighted word
 */
export function findLyricByWord(lyrics: LyricLine[], searchWord: string): LyricLine | null {
  // # Step 1: Use lodash find for more efficient search
  const foundLyric = find(lyrics, lyric => {
    const text = toLower(get(lyric, 'text', ''));
    return includes(text, toLower(searchWord));
  });
  
  if (!foundLyric) return null;
  
  // # Step 2: Find matching word index using lodash
  const words = split(toLower(get(foundLyric, 'text', '')), /\s+/);
  const wordIndex = findIndex(words, word =>
    includes(word, toLower(searchWord))
  );
  
  // # Step 3: Return lyric with highlighted word using lodash
  return {
    ...foundLyric,
    words: wordIndex !== -1 ? [get(foundLyric, `words[${wordIndex}]`, get(foundLyric, 'words[0]'))] : get(foundLyric, 'words', [])
  };
}

/**
 * Parse saved lyric file, convert from storage format to application format
 * # Step 1: Parse JSON content and validate structure
 * # Step 2: Extract sentences from parsed data
 * # Step 3: Process each sentence into lyric lines
 * # Step 4: Validate and create word timings
 */
export function parseLyricFile(fileContent: string): LyricLine[] {
  // # Step 1: Parse and validate JSON structure using lodash
  const data = JSON.parse(fileContent) as LyricData;
  
  if (!get(data, 'data.sentences')) return [];
  
  // # Step 2-4: Process sentences into application format using lodash
  return compact(
    map(get(data, 'data.sentences', []), (sentence: SentenceData) => {
      const words = get(sentence, 'words', []);
      
      // # Step 3: Create word timings with validation using lodash
      const wordTimings: WordTiming[] = compact(
        map(words, (word: WordData) => {
          if (!word) return null;

          const startTime = get(word, 'startTime', 0);
          const endTime = get(word, 'endTime', 0);
          const text = trim(get(word, 'data', ''));

          // Validate timing and text content using lodash
          if (!text || startTime < 0 || endTime <= startTime) {
            return null;
          }

          return {
            text,
            startTime,
            endTime
          };
        })
      );

      if (isEmpty(wordTimings)) {
        return null;
      }

      // # Step 4: Build complete lyric line object using lodash
      return {
        text: join(map(wordTimings, 'text'), ' '),
        words: wordTimings,
        startTime: get(first(wordTimings), 'startTime', 0),
        endTime: get(last(wordTimings), 'endTime', 0)
      };
    })
  );
}

/**
 * Merge words within each sentence into single timing units
 * Takes startTime from first word and endTime from last word of each sentence
 * # Step 1: Validate input lyrics array
 * # Step 2: Process each lyric line to merge words
 * # Step 3: Create single merged word per sentence
 * # Step 4: Return modified lyrics with merged timings
 */
export function mergeSentenceWords(lyrics: LyricLine[]): LyricLine[] {
  if (isEmpty(lyrics)) return [];
  
  return map(lyrics, (lyric) => {
    const words = get(lyric, 'words', []);
    
    // If no words or only one word, return as is
    if (size(words) <= 1) return lyric;
    
    // # Step 3: Create single merged word with combined text and timing
    const mergedWord: WordTiming = {
      text: get(lyric, 'text', ''), // Use the full sentence text
      startTime: get(first(words), 'startTime', 0), // Start from first word
      endTime: get(last(words), 'endTime', 0) // End at last word
    };
    
    // # Step 4: Return lyric with single merged word
    return {
      ...lyric,
      words: [mergedWord],
      startTime: mergedWord.startTime,
      endTime: mergedWord.endTime
    };
  });
}

/**
 * Toggle between merged and word-by-word display modes
 * # Step 1: Check current state by examining word count
 * # Step 2: Apply appropriate transformation
 */
export function toggleSentenceMerge(lyrics: LyricLine[], originalLyrics: LyricLine[]): LyricLine[] {
  if (isEmpty(lyrics) || isEmpty(originalLyrics)) return lyrics;
  
  // # Step 1: Check if currently merged (each sentence has only 1 word)
  const isMerged = every(lyrics, lyric => size(get(lyric, 'words', [])) === 1);
  
  // # Step 2: Return opposite state
  if (isMerged) {
    // Currently merged, return original word-by-word
    return originalLyrics;
  } else {
    // Currently word-by-word, return merged
    return mergeSentenceWords(lyrics);
  }
}