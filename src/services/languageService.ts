

/**
 * Language detection and translation service
 */

// Language codes
export const SUPPORTED_LANGUAGES = {
  ENGLISH: 'en',
  TAMIL: 'ta'
};

// Common English grammatical mistakes and corrections
const COMMON_GRAMMAR_FIXES: Record<string, string> = {
  "i am": "I am",
  "i will": "I will",
  "i have": "I have",
  "dont": "don't",
  "cant": "can't",
  "wont": "won't",
  "im": "I am",
  "ive": "I've",
  "youre": "you're",
  "theyre": "they're",
  "didnt": "didn't",
  "doesnt": "doesn't",
  "isnt": "isn't",
  "thats": "that's",
  "hes": "he's",
  "shes": "she's"
};

// Common words with same meanings for ASL
export const WORD_SYNONYMS: Record<string, string> = {
  // Greetings
  "hi": "hello",
  "hey": "hello",
  "greetings": "hello",
  
  // Gratitude
  "thanks": "thank you",
  "thank": "thank you",
  
  // Common verbs
  "want": "want",
  "needs": "need",
  "needing": "need",
  "needed": "need",
  "wants": "want",
  "wanting": "want",
  "wanted": "want",
  
  // Common adjectives
  "beautiful": "beautiful",
  "pretty": "beautiful",
  "gorgeous": "beautiful",
  "lovely": "beautiful",
  
  // Temporal
  "before": "before",
  "prior": "before",
  "previously": "before",
  "earlier": "before",
  
  "after": "after",
  "later": "after",
  "afterwards": "after",
  "subsequently": "after"
};

/**
 * Detects the language of a given text
 * Uses compact-language-detector library for client-side detection
 */
export async function detectLanguage(text: string): Promise<string> {
  try {
    console.log("Detecting language for:", text);
    
    // Enhanced Tamil detection - both for Tamil script and romanized Tamil
    // Tamil characters fall within this Unicode range
    const tamilRegex = /[\u0B80-\u0BFF]/;
    
    // Common Tamil words in romanized form (lowercase for case-insensitive matching)
    const romanizedTamilWords = [
      'vanakkam', 'nandri', 'thamizh', 'amma', 'appa', 'akka', 'anna', 
      'naan', 'neenga', 'avaru', 'ival', 'enakku', 'unakku', 'epdi',
      'eppadi', 'intha', 'antha', 'engey', 'ennoda', 'unnoda', 'idhu',
      'adhu', 'seri', 'illa', 'romba', 'konjam', 'vaanga', 'ponga'
    ];
    
    // Check for Tamil script characters
    if (tamilRegex.test(text)) {
      console.log("Detected Tamil language (script)");
      return SUPPORTED_LANGUAGES.TAMIL;
    }
    
    // Check for romanized Tamil by looking for common Tamil words
    const lowerText = text.toLowerCase();
    for (const word of romanizedTamilWords) {
      if (lowerText.includes(word)) {
        console.log("Detected romanized Tamil language");
        return SUPPORTED_LANGUAGES.TAMIL;
      }
    }
    
    // Default to English for everything else
    console.log("Defaulting to English language");
    return SUPPORTED_LANGUAGES.ENGLISH;
  } catch (error) {
    console.error("Language detection error:", error);
    // Default to English on error
    return SUPPORTED_LANGUAGES.ENGLISH;
  }
}

/**
 * Translates text from the source language to the target language
 * Uses Google Translate API
 */
export async function translateText(text: string, sourceLang: string, targetLang: string = SUPPORTED_LANGUAGES.ENGLISH): Promise<string> {
  // If already in target language, return as is
  if (sourceLang === targetLang) {
    return text;
  }
  
  console.log(`Translating from ${sourceLang} to ${targetLang}:`, text);
  
  try {
    // Google Translate API endpoint
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Extract translated text from response
    // The response format is a nested array where the first element contains translation segments
    let translatedText = '';
    
    if (data && data[0]) {
      // Concatenate all translation segments
      translatedText = data[0]
        .map((segment: any[]) => segment[0])
        .join(' ')
        .trim();
    }
    
    console.log("Translated text:", translatedText);
    return translatedText;
  } catch (error) {
    console.error("Translation error:", error);
    // Return original text if translation fails
    return text;
  }
}

/**
 * Fix common grammatical errors in English text
 */
export function fixGrammaticalErrors(text: string): string {
  let correctedText = text;
  
  // Apply common grammar fixes
  Object.entries(COMMON_GRAMMAR_FIXES).forEach(([incorrect, correct]) => {
    const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
    correctedText = correctedText.replace(regex, correct);
  });
  
  // Fix capitalization at the beginning of sentences
  correctedText = correctedText.replace(/(^\s*[a-z]|[.!?]\s+[a-z])/g, match => 
    match.toUpperCase()
  );
  
  return correctedText;
}

/**
 * Process input text for translation
 * Detects language, translates to English if needed, fixes grammar, then returns the English text
 */
export async function processMultilingualInput(text: string): Promise<{
  originalText: string;
  detectedLanguage: string;
  translatedText: string;
  grammaticallyCorrect: string;
}> {
  // Detect the language of the input text
  const detectedLanguage = await detectLanguage(text);
  
  // If not English, translate to English
  let translatedText = text;
  if (detectedLanguage !== SUPPORTED_LANGUAGES.ENGLISH) {
    translatedText = await translateText(text, detectedLanguage, SUPPORTED_LANGUAGES.ENGLISH);
  }
  
  // Fix grammatical errors in translated or original English text
  const grammaticallyCorrect = fixGrammaticalErrors(translatedText);
  
  return {
    originalText: text,
    detectedLanguage,
    translatedText,
    grammaticallyCorrect
  };
}

/**
 * Normalize words to their common ASL sign based on synonyms
 */
export function normalizeToASLSigns(words: string[]): string[] {
  return words.map(word => {
    const lowerWord = word.toLowerCase();
    return WORD_SYNONYMS[lowerWord] || word;
  });
}

/**
 * Get language name from language code
 */
export function getLanguageName(langCode: string): string {
  const languageNames: { [key: string]: string } = {
    en: 'English',
    ta: 'Tamil'
  };
  
  return languageNames[langCode] || 'Unknown';
}

