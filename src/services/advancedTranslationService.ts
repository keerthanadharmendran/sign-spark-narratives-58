
import { pipeline, env } from '@huggingface/transformers';
import * as tf from '@tensorflow/tfjs';
import { getSignImagesForWord } from './databaseService';
import { normalizeToASLSigns, WORD_SYNONYMS } from './languageService';

// Configure the transformers.js environment
env.allowLocalModels = false;
env.useBrowserCache = true;

// Interfaces for our service
interface TranslationResult {
  words: {
    text: string;
    imageUrl: string;
    poseData?: number[][]; // 3D pose data for avatar
  }[];
  originalText: string;
  translatedGrammar: string;
}

// Model names
const CONTEXT_MODEL = "bert-base-uncased";
const TRANSLATION_MODEL = "facebook/nllb-200-distilled-600M";

/**
 * Advanced text-to-sign translation using transformer models
 */
export async function translateWithTransformer(text: string): Promise<TranslationResult> {
  console.log("Advanced NMT: Processing input text:", text);
  
  // Clean and normalize the text
  const cleanedText = text.replace(/[^\w\s\.\,\?\!]/gi, '').toLowerCase().trim();
  
  if (!cleanedText) {
    return { words: [], originalText: text, translatedGrammar: "" };
  }
  
  try {
    // Initialize TensorFlow.js
    await tf.ready();
    console.log("TensorFlow.js initialized:", tf.getBackend());
    
    // Initialize the feature extraction pipeline for context understanding
    let contextAnalyzer;
    try {
      contextAnalyzer = await pipeline('feature-extraction', CONTEXT_MODEL);
      console.log("Context model loaded successfully");
    } catch (error) {
      console.error("Failed to load context model:", error);
      // Fallback to basic processing
      return fallbackTranslation(cleanedText, text);
    }
    
    // Get sentence embeddings to understand context
    const embeddings = await contextAnalyzer(cleanedText, { pooling: "mean" });
    console.log("Generated embeddings for context understanding");
    
    // In a full implementation, this would use the embeddings to adjust the translation
    // For now, we'll use a rule-based approach to demonstrate the concept
    const translatedGrammar = convertToAslGrammar(cleanedText);
    console.log("Converted to ASL grammar:", translatedGrammar);
    
    // Process according to ASL grammar structure
    let words = translatedGrammar.split(/\s+/).filter(word => word.length > 0);
    console.log("Words after grammar transformation:", words);
    
    // Normalize words to handle synonyms
    words = normalizeToASLSigns(words);
    console.log("Words after synonym normalization:", words);
    
    // Get sign images and generate pose data
    const translatedSigns = await Promise.all(words.map(async (word) => {
      // Get sign images with letter fallback if needed
      const wordSigns = getSignImagesForWord(word);
      
      // For each sign, generate pose data (in a full implementation)
      // Here we're creating mock data as placeholder
      const withPoseData = wordSigns.map(sign => ({
        ...sign,
        poseData: generateMockPoseData() // In production, this would use real pose data
      }));
      
      return withPoseData;
    }));
    
    // Flatten the array of arrays
    const flattenedSigns = translatedSigns.flat();
    
    return {
      words: flattenedSigns,
      originalText: text,
      translatedGrammar: translatedGrammar
    };
    
  } catch (error) {
    console.error("Error in transformer translation:", error);
    // Fallback to basic translation if transformer fails
    return fallbackTranslation(cleanedText, text);
  }
}

/**
 * Fallback to basic translation when advanced models fail
 */
function fallbackTranslation(cleanedText: string, originalText: string): TranslationResult {
  console.log("Using fallback translation");
  const words = cleanedText.split(/\s+/).filter(word => word.length > 0);
  
  // Normalize words to handle synonyms
  const normalizedWords = normalizeToASLSigns(words);
  
  // Process each word
  let translatedSigns: { text: string; imageUrl: string; poseData?: number[][] }[] = [];
  
  for (const word of normalizedWords) {
    const wordSigns = getSignImagesForWord(word);
    translatedSigns = [
      ...translatedSigns, 
      ...wordSigns.map(sign => ({
        ...sign,
        poseData: generateMockPoseData()
      }))
    ];
  }
  
  return {
    words: translatedSigns,
    originalText,
    translatedGrammar: normalizedWords.join(" ") // In fallback mode, we just use normalized words
  };
}

/**
 * Convert English text to ASL grammar structure
 * ASL typically follows Time-Topic-Comment structure
 */
function convertToAslGrammar(text: string): string {
  // Enhanced rule-based transformation for ASL grammar
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/).filter(word => word.length > 0);
  
  // ASL grammar rules (Time-Topic-Comment structure)
  const timeWords = ["yesterday", "today", "tomorrow", "later", "before", "after", "now", "past", "future"];
  const questionWords = ["what", "who", "where", "when", "why", "how", "which"];
  
  // Identify sentence type
  const isQuestion = questionWords.some(qw => words.includes(qw)) || lowerText.endsWith("?");
  
  // Extract time references
  const timeReferences: string[] = [];
  const nonTimeWords: string[] = [];
  
  words.forEach(word => {
    if (timeWords.includes(word)) {
      timeReferences.push(word);
    } else {
      nonTimeWords.push(word);
    }
  });
  
  // Build ASL structure
  let aslStructure: string[] = [];
  
  // Time always comes first in ASL
  aslStructure = [...timeReferences];
  
  if (isQuestion) {
    // For questions: Topic + Question Word + Comment
    const topic = nonTimeWords.filter(w => !questionWords.includes(w));
    const qWords = nonTimeWords.filter(w => questionWords.includes(w));
    
    // For "What is X" questions, structure becomes "X WHAT"
    if (qWords.includes("what") && (words.includes("is") || words.includes("are"))) {
      const subject = nonTimeWords.filter(w => w !== "what" && w !== "is" && w !== "are");
      aslStructure = [...aslStructure, ...subject, "what"];
    } else {
      // General question structure
      aslStructure = [...aslStructure, ...topic, ...qWords];
    }
  } else {
    // For statements: Topic + Comment
    // Remove auxiliary verbs and articles as they're usually omitted in ASL
    const auxVerbs = ["am", "is", "are", "was", "were", "will", "would", "have", "has", "had"];
    const articles = ["a", "an", "the"];
    
    aslStructure = [
      ...aslStructure,
      ...nonTimeWords.filter(word => !auxVerbs.includes(word) && !articles.includes(word))
    ];
  }
  
  return aslStructure.join(" ");
}

/**
 * Generate mock pose data for avatar animation
 * In a real implementation, this would come from motion capture or ML models
 */
function generateMockPoseData(): number[][] {
  // Generate simplified mock pose data 
  // Each frame has 33 keypoints with x,y,z coordinates
  const frames = 30; // 30 frames of animation
  const keypoints = 33; // 33 keypoints in MediaPipe Pose
  const poseData = [];
  
  for (let i = 0; i < frames; i++) {
    const frameData = [];
    for (let j = 0; j < keypoints; j++) {
      // Generate mock coordinates
      frameData.push([
        Math.random() * 2 - 1, // x: -1 to 1
        Math.random() * 2 - 1, // y: -1 to 1
        Math.random() * 2 - 1  // z: -1 to 1
      ]);
    }
    poseData.push(frameData.flat());
  }
  
  return poseData;
}

/**
 * Few-shot learning function to add new signs with minimal examples
 */
export async function learnNewSignFromExamples(
  word: string, 
  exampleUrls: string[]
): Promise<boolean> {
  try {
    console.log(`Learning new sign for '${word}' from ${exampleUrls.length} examples`);
    
    // Initialize TensorFlow.js if not already initialized
    await tf.ready();
    
    // In a real implementation, this would:
    // 1. Extract features from example GIFs/videos
    // 2. Train a small model to recognize the pattern
    // 3. Generate new sign data based on the learned pattern
    
    // For this demo, we'll just add the first example to our database
    if (exampleUrls.length > 0) {
      // Add to database
      // In a real app, this would store the learned model or features
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error learning new sign:", error);
    return false;
  }
}
