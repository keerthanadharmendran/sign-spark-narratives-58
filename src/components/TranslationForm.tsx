
import React, { useState } from 'react';
import { translateToSignLanguage } from '../services/translationService';
import { translateWithTransformer } from '../services/advancedTranslationService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, Languages, Brain, Globe } from 'lucide-react';
import { SpeechRecognizer } from '@/components/SpeechRecognizer';
import { processMultilingualInput, getLanguageName, SUPPORTED_LANGUAGES } from '../services/languageService';
import { Badge } from '@/components/ui/badge';

interface TranslationFormProps {
  onTranslationComplete: (result: {
    words: { text: string; imageUrl: string; poseData?: number[][] }[];
    originalText?: string;
    translatedGrammar?: string;
    detectedLanguage?: string;
  }) => void;
}

const TranslationForm: React.FC<TranslationFormProps> = ({ onTranslationComplete }) => {
  const { toast } = useToast();
  
  const [inputText, setInputText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [useAdvancedModel, setUseAdvancedModel] = useState(true);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);

  const handleSpeechInput = (transcript: string) => {
    setInputText(transcript);
    // Auto-translate when speech input is received
    if (transcript.trim()) {
      handleTranslate(transcript);
    }
  };

  const handleTranslate = async (text?: string) => {
    const textToTranslate = text || inputText;
    
    if (!textToTranslate.trim()) {
      toast({
        title: "Empty input",
        description: "Please enter some text or speak to translate.",
        variant: "destructive",
      });
      return;
    }

    setIsTranslating(true);
    try {
      console.log("Processing multilingual input:", textToTranslate);
      
      // Process multilingual input with improved grammar correction
      const multilingual = await processMultilingualInput(textToTranslate);
      setDetectedLanguage(multilingual.detectedLanguage);
      
      // Use the grammatically corrected text for translation
      const textForTranslation = multilingual.grammaticallyCorrect;
      console.log("Text after language processing:", textForTranslation);
      console.log("Using advanced model:", useAdvancedModel);
      
      let result;
      
      if (useAdvancedModel) {
        // Use the advanced transformer-based translation
        result = await translateWithTransformer(textForTranslation);
        
        // Add detected language information
        result = {
          ...result,
          originalText: multilingual.originalText,
          detectedLanguage: multilingual.detectedLanguage
        };
        
        toast({
          title: "AI Translation Complete",
          description: `Translation performed using transformer-based neural model. ${
            multilingual.detectedLanguage !== SUPPORTED_LANGUAGES.ENGLISH 
              ? `Detected language: ${getLanguageName(multilingual.detectedLanguage)}` 
              : ''
          }`,
          variant: "default",
        });
      } else {
        // Use the basic translation as fallback
        const basicResult = await translateToSignLanguage(textForTranslation);
        result = {
          words: basicResult.words,
          originalText: multilingual.originalText,
          detectedLanguage: multilingual.detectedLanguage
        };
      }
      
      onTranslationComplete(result);
      
      // Log the results to debug image display issues
      console.log("Translation result:", result);
    } catch (error) {
      toast({
        title: "Translation failed",
        description: "An error occurred during translation. Falling back to basic translation.",
        variant: "destructive",
      });
      console.error("Translation error:", error);
      
      // Fallback to basic translation
      try {
        const fallbackResult = await translateToSignLanguage(textToTranslate);
        onTranslationComplete({
          words: fallbackResult.words,
          originalText: textToTranslate
        });
      } catch (fallbackError) {
        console.error("Fallback translation also failed:", fallbackError);
      }
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Card className="bg-white shadow-lg">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Switch 
                checked={useAdvancedModel} 
                onCheckedChange={setUseAdvancedModel}
                id="advanced-model"
              />
              <label 
                htmlFor="advanced-model" 
                className="text-sm font-medium flex items-center cursor-pointer"
              >
                <Brain size={16} className="mr-1 text-purple-500" />
                Use Advanced AI Model
              </label>
            </div>
            <div className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
              {useAdvancedModel ? "Transformer + Avatar" : "Basic Translation"}
            </div>
          </div>
          
          <div className="relative">
            <Textarea 
              placeholder="Enter text in any supported language or click the microphone to speak..." 
              className="min-h-[100px] pr-12"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="absolute bottom-2 right-2">
              <SpeechRecognizer 
                onTranscript={handleSpeechInput} 
                isListening={isListening} 
                setIsListening={setIsListening} 
              />
            </div>
            
            {detectedLanguage && detectedLanguage !== SUPPORTED_LANGUAGES.ENGLISH && (
              <Badge variant="outline" className="absolute top-2 right-2 bg-blue-50 flex items-center gap-1">
                <Globe size={12} />
                {getLanguageName(detectedLanguage)}
              </Badge>
            )}
          </div>
          
          <Button 
            onClick={() => handleTranslate()}
            disabled={isTranslating}
            className="w-full bg-primary"
          >
            {isTranslating ? "Translating..." : (
              <span className="flex items-center justify-center gap-2">
                <Languages size={16} /> Translate to Sign Language <ArrowRight size={16} />
              </span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TranslationForm;
