
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel';
import { Play, Pause, Cog, Info, Sparkles, Globe } from 'lucide-react';
import SignAvatar from './SignAvatar';
import { Badge } from '@/components/ui/badge';
import { getLanguageName, SUPPORTED_LANGUAGES } from '../services/languageService';

interface TranslationDisplayProps {
  result: {
    words: {
      text: string;
      imageUrl: string;
      poseData?: number[][];
    }[];
    originalText?: string;
    translatedGrammar?: string;
    detectedLanguage?: string;
  };
}

export const TranslationDisplay: React.FC<TranslationDisplayProps> = ({ result }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true); // Start playing automatically
  const [viewMode, setViewMode] = useState<'gif' | 'avatar'>('gif');
  
  // Safety check for result data
  const hasWords = result && result.words && result.words.length > 0;
  
  // Check if translation was from a non-English language
  const isMultilingual = result.detectedLanguage && result.detectedLanguage !== SUPPORTED_LANGUAGES.ENGLISH;
  
  useEffect(() => {
    let intervalId: number | null = null;
    
    if (isPlaying && hasWords) {
      intervalId = window.setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex >= result.words.length) {
            setIsPlaying(false);
            return 0;
          }
          return nextIndex;
        });
      }, 2000); // Display each sign for 2 seconds
    }
    
    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, result.words.length, hasWords]);
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying && currentIndex >= result.words.length - 1) {
      setCurrentIndex(0);
    }
  };
  
  // Reset to first sign and auto-play when new translation comes in
  useEffect(() => {
    if (hasWords) {
      setCurrentIndex(0);
      setIsPlaying(true);
      
      // Choose appropriate view mode based on data availability
      const hasPoseData = result.words.some(word => word.poseData && word.poseData.length > 0);
      setViewMode(hasPoseData ? 'avatar' : 'gif');
    }
  }, [result, hasWords]);

  // If no translation words, don't render anything
  if (!hasWords) {
    return null;
  }
  
  // Get current word safely
  const currentWord = result.words[currentIndex] || { text: '', imageUrl: '' };
  const hasPoseData = Boolean(currentWord.poseData && currentWord.poseData.length > 0);
  
  return (
    <Card className="bg-white shadow-lg">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex justify-between items-center">
          <span className="flex items-center">
            <Sparkles size={20} className="text-blue-600 mr-2" />
            AI Sign Language Translation
          </span>
          {result.words.length > 1 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePlayPause}
              className="flex items-center gap-2"
            >
              {isPlaying ? (
                <>
                  <Pause size={16} /> Pause
                </>
              ) : (
                <>
                  <Play size={16} /> Play All Signs
                </>
              )}
            </Button>
          )}
        </CardTitle>
        
        {isMultilingual && (
          <div className="flex items-center mt-2 text-sm text-blue-600">
            <Globe size={16} className="mr-2" /> 
            Translated from {getLanguageName(result.detectedLanguage || '')} to English to Sign Language
          </div>
        )}
      </CardHeader>
      <Separator />
      <CardContent className="p-6">
        <Tabs defaultValue="signs" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="signs">Signs</TabsTrigger>
            <TabsTrigger value="grammar">ASL Grammar</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signs" className="space-y-4">
            <div className="flex flex-col items-center">
              <div className="mb-4 flex items-center">
                <Button 
                  variant={viewMode === 'gif' ? 'default' : 'outline'} 
                  size="sm"
                  className="mr-2"
                  onClick={() => setViewMode('gif')}
                  disabled={!currentWord.imageUrl}
                >
                  GIF View
                </Button>
                <Button 
                  variant={viewMode === 'avatar' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setViewMode('avatar')}
                  disabled={!hasPoseData}
                >
                  Avatar View
                </Button>
              </div>
              
              {/* Current active sign */}
              <div className="mb-8 flex flex-col items-center">
                {viewMode === 'gif' || !hasPoseData ? (
                  <div className="w-75 h-75 flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-md border border-gray-200">
                    <img 
                      src={currentWord.imageUrl} 
                      alt={`Sign for "${currentWord.text}"`}
                      className="max-w-full max-h-full object-contain"
                      loading="eager"
                      onError={(e) => {
                        console.error("Image load error:", e);
                        // Set fallback image on error
                        (e.target as HTMLImageElement).src = "/signs/not-found.gif";
                      }}
                    />
                  </div>
                ) : (
                  <SignAvatar 
                    poseData={currentWord.poseData}
                    isPlaying={isPlaying}
                    word={currentWord.text}
                  />
                )}
                <p className="mt-4 text-center text-xl font-medium">
                  {currentWord.text}
                </p>
              </div>
              
              {/* Carousel of all signs */}
              <Carousel className="w-full max-w-lg">
                <CarouselContent>
                  {result.words.map((word, index) => (
                    <CarouselItem 
                      key={index} 
                      className="basis-1/3 md:basis-1/4 cursor-pointer"
                      onClick={() => {
                        setCurrentIndex(index);
                        setIsPlaying(false);
                      }}
                    >
                      <div className={`flex flex-col items-center p-2 ${currentIndex === index ? 'ring-2 ring-primary rounded-lg' : ''}`}>
                        <div className="w-20 h-20 flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200">
                          <img 
                            src={word.imageUrl} 
                            alt={`Sign for "${word.text}"`}
                            className="max-w-full max-h-full object-contain"
                            loading="lazy"
                            onError={(e) => {
                              // Set fallback image on error
                              (e.target as HTMLImageElement).src = "/signs/not-found.gif";
                            }}
                          />
                        </div>
                        <p className="mt-1 text-center text-xs font-medium truncate w-full">
                          {word.text}
                        </p>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-0" />
                <CarouselNext className="right-0" />
              </Carousel>
            </div>
          </TabsContent>
          
          <TabsContent value="grammar">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-bold mb-2">ASL Grammar Translation</h3>
              <p className="text-sm text-gray-700 mb-2">
                ASL uses different grammar than English. Here's how your text translates to ASL structure:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {isMultilingual && (
                  <div className="p-3 bg-white rounded shadow">
                    <h4 className="text-sm font-medium text-gray-500">
                      {getLanguageName(result.detectedLanguage || '')}:
                    </h4>
                    <p className="text-base">{result.originalText}</p>
                  </div>
                )}
                
                <div className="p-3 bg-white rounded shadow">
                  <h4 className="text-sm font-medium text-gray-500">English:</h4>
                  <p className="text-base">{result.originalText || result.words.map(w => w.text).join(' ')}</p>
                </div>
                
                <div className="p-3 bg-white rounded shadow">
                  <h4 className="text-sm font-medium text-gray-500">ASL Structure:</h4>
                  <p className="text-base">{result.translatedGrammar || result.words.map(w => w.text).join(' ')}</p>
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                <p>ASL typically uses a different word order than English, often following Time-Topic-Comment structure.</p>
                <p className="mt-1">Words with similar meanings are mapped to consistent signs in ASL.</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="info">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="flex items-center text-md font-medium mb-1">
                  <Info size={16} className="mr-2" /> About This Translation
                </h3>
                <p className="text-sm text-gray-700">
                  This translation uses transformer-based models to understand context, 
                  encoder-decoder architecture with attention mechanisms, and few-shot learning techniques.
                  {isMultilingual && ` It also includes multilingual support with automatic language detection and translation.`}
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="flex items-center text-md font-medium mb-1">
                  <Cog size={16} className="mr-2" /> Technology Used
                </h3>
                <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                  <li>Transformer models for context understanding</li>
                  <li>ASL grammar restructuring with Time-Topic-Comment structure</li>
                  <li>Word synonym normalization for consistent signs</li>
                  <li>Grammatical error correction</li>
                  <li>Avatar visualization with pose data (when available)</li>
                  <li>Few-shot learning for new signs</li>
                  {isMultilingual && <li>Multilingual support with language detection and translation</li>}
                </ul>
              </div>
              
              {isMultilingual && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="flex items-center text-md font-medium mb-1">
                    <Globe size={16} className="mr-2" /> Multilingual Processing
                  </h3>
                  <p className="text-sm text-gray-700 mb-2">
                    Your input was detected as {getLanguageName(result.detectedLanguage || '')} and translated to English before generating sign language.
                  </p>
                  <div className="flex items-center justify-around text-sm text-gray-700">
                    <Badge variant="outline" className="bg-white px-2 py-1 flex items-center gap-1">
                      <span>{getLanguageName(result.detectedLanguage || '')}</span>
                    </Badge>
                    <span>→</span>
                    <Badge variant="outline" className="bg-white px-2 py-1 flex items-center gap-1">
                      <span>English</span>
                    </Badge>
                    <span>→</span>
                    <Badge variant="outline" className="bg-white px-2 py-1 flex items-center gap-1">
                      <span>ASL</span>
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-2">Original Text:</h3>
          <p className="text-muted-foreground">
            {result.originalText || result.words.map(word => word.text).join(' ')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

