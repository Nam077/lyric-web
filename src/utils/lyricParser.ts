/**
 * Utility functions for parsing and processing lyric data from Zing MP3 API
 */

export interface WordData {
  startTime: number;
  endTime: number;
  data: string;
}

export interface SentenceData {
  words: WordData[];
}

export interface LyricData {
  err: number;
  msg: string;
  data: {
    sentences: SentenceData[];
    file: string;
    enabledVideoBG: boolean;
    defaultIBGUrls: string[];
    BGMode: number;
  };
  timestamp: number;
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

/**
 * Parse lyric data từ Zing MP3 API format thành format tối ưu cho animation
 */
export function parseLyricDataOptimized(lyricData: LyricData): LyricLine[] {
  if (lyricData.err !== 0 || !lyricData.data?.sentences) {
    return [];
  }

  return lyricData.data.sentences
    .filter(sentence => sentence.words && sentence.words.length > 0)
    .map(sentence => {
      const words = sentence.words.filter(word => word.data && word.data.trim());
      
      if (words.length === 0) return null;

      // Tạo timing data cho từng từ
      const wordTimings: WordTiming[] = words.map(word => ({
        text: word.data.trim(),
        startTime: word.startTime || 0,
        endTime: word.endTime || (word.startTime + 500)
      }));

      // Tính toán start/end time cho cả câu
      const startTime = wordTimings[0].startTime;
      const endTime = wordTimings[wordTimings.length - 1].endTime;
      const text = wordTimings.map(w => w.text).join(' ');

      return {
        text,
        words: wordTimings,
        startTime,
        endTime
      };
    })
    .filter(Boolean) as LyricLine[];
}

/**
 * Lọc và làm sạch lyrics, loại bỏ những câu trống hoặc không hợp lệ
 */
export function cleanLyrics(lyrics: LyricLine[]): LyricLine[] {
  return lyrics.filter(lyric => {
    // Loại bỏ câu có ít hơn 2 từ
    if (lyric.words.length < 2) return false;
    
    // Loại bỏ câu chỉ có ký tự đặc biệt
    const hasValidText = lyric.words.some(word => 
      /[a-zA-ZÀ-ỹ0-9]/.test(word.text)
    );
    
    return hasValidText;
  });
}

/**
 * Chuẩn hóa timing để đảm bảo animation mượt mà
 * @param lyrics - Array of lyric lines to normalize
 * @param delayMs - Delay in milliseconds to apply to all lyrics (can be negative for early start)
 */
export function normalizeTiming(lyrics: LyricLine[], delayMs: number = 0): LyricLine[] {
  return lyrics.map((lyric, ) => {
    const words = lyric.words.map((word, ) => {
      // Đảm bảo timing hợp lệ và áp dụng delay
      const startTime = word.startTime + delayMs;
      const endTime = Math.max(word.endTime + delayMs, startTime + 300); // Minimum 300ms per word
      
      return {
        ...word,
        startTime,
        endTime
      };
    });

    // Đảm bảo có khoảng cách tối thiểu giữa các từ
    const normalizedWords = words.map((word, wordIndex) => {
      if (wordIndex === 0) return word;
      
      const prevWord = words[wordIndex - 1];
      const minGap = 100; // 100ms gap minimum
      
      return {
        ...word,
        startTime: Math.max(word.startTime, prevWord.endTime + minGap)
      };
    });

    return {
      ...lyric,
      words: normalizedWords,
      startTime: normalizedWords[0].startTime,
      endTime: normalizedWords[normalizedWords.length - 1].endTime
    };
  });
}

/**
 * Parse và xử lý hoàn chỉnh lyric data
 */
export function processLyricData(lyricData: LyricData): LyricLine[] {
  const parsed = parseLyricDataOptimized(lyricData);
  const cleaned = cleanLyrics(parsed);
  const normalized = normalizeTiming(cleaned);
  
  console.log(`Processed ${normalized.length} lyric lines from ${parsed.length} raw sentences`);
  
  return normalized;
}

/**
 * Tìm lyric line hiện tại dựa trên thời gian audio
 */
export function getCurrentLyricIndex(lyrics: LyricLine[], currentTimeMs: number): number {
  // Nếu chưa đến thời gian của lyric đầu tiên, return -1
  if (currentTimeMs < lyrics[0]?.startTime) {
    return -1;
  }

  for (let i = 0; i < lyrics.length; i++) {
    const lyric = lyrics[i];
    if (currentTimeMs >= lyric.startTime && currentTimeMs <= lyric.endTime) {
      return i;
    }
    // Nếu thời gian hiện tại nhỏ hơn startTime của lyric này, return lyric trước đó
    if (currentTimeMs < lyric.startTime) {
      return Math.max(0, i - 1);
    }
  }
  
  // Nếu vượt quá tất cả lyrics, return lyric cuối cùng
  return Math.max(0, lyrics.length - 1);
}

/**
 * Tìm từ hiện tại trong một lyric line
 */
export function getCurrentWordIndex(lyric: LyricLine, currentTimeMs: number): number {
  for (let i = 0; i < lyric.words.length; i++) {
    const word = lyric.words[i];
    if (currentTimeMs >= word.startTime && currentTimeMs <= word.endTime) {
      return i;
    }
  }
  
  // Nếu không tìm thấy, return -1 (chưa bắt đầu) hoặc length (đã kết thúc)
  if (currentTimeMs < lyric.words[0]?.startTime) return -1;
  return lyric.words.length;
}

/**
 * Tạo timing offset cho demo khi không có audio timing thực tế
 */
export function createDemoTiming(lyrics: LyricLine[], totalDurationMs: number = 180000): LyricLine[] {
  if (lyrics.length === 0) return [];
  
  const avgLyricDuration = totalDurationMs / lyrics.length;
  
  return lyrics.map((lyric, lyricIndex) => {
    const lyricStartTime = lyricIndex * avgLyricDuration;
    const lyricEndTime = lyricStartTime + avgLyricDuration;
    const wordDuration = avgLyricDuration / lyric.words.length;
    
    const updatedWords = lyric.words.map((word, wordIndex) => ({
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