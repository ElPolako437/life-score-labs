import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CalinessLogo } from "./CalinessLogo";
import { SupportHint } from "./SupportHint";
import { questions, TestState, calculateBioAge } from "@/types/bioage";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BioAgeTestProps {
  testState: TestState;
  onAnswerSelect: (questionId: number, points: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
}

export const BioAgeTest = ({ 
  testState, 
  onAnswerSelect, 
  onNext, 
  onPrevious, 
  onComplete 
}: BioAgeTestProps) => {
  const currentQuestion = questions[testState.currentQuestion];
  const progress = ((testState.currentQuestion + 1) / questions.length) * 100;
  const isLastQuestion = testState.currentQuestion === questions.length - 1;
  const hasAnswer = testState.answers[currentQuestion.id] !== undefined;

  const handleOptionSelect = (points: number) => {
    onAnswerSelect(currentQuestion.id, points);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete();
    } else {
      onNext();
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-dark flex flex-col relative overflow-x-hidden box-border">
      {/* Subtle background glow */}
      <div className="absolute inset-0 hero-gradient opacity-50 pointer-events-none" />
      
      <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto relative z-10 px-4 sm:px-6 py-3 sm:py-6">
        {/* Header - Compact on mobile */}
        <div className="text-center mb-3 sm:mb-6 bg-gradient-dark/95 backdrop-blur-sm z-20 py-2 sm:py-3">
          <CalinessLogo size="sm" className="justify-center mb-2 sm:mb-4 md:hidden" showText={true} />
          <CalinessLogo size="md" className="justify-center mb-4 hidden md:flex" showText={true} />
          
          {/* Progress Section */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex justify-between text-xs sm:text-sm text-text-muted font-medium tracking-wide px-1">
              <span>Frage {testState.currentQuestion + 1}/{questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} variant="neon" className="h-2 sm:h-3" />
          </div>
        </div>

        {/* Question Card - Full width, proper text wrapping */}
        <div className="flex-1 flex flex-col justify-start sm:justify-center">
          <Card className="card-elegant w-full">
            <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle 
                className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-center section-title leading-relaxed sm:leading-tight"
                style={{ 
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                  hyphens: 'auto'
                }}
              >
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5 sm:gap-3 px-4 sm:px-6 pb-4 sm:pb-6">
              {currentQuestion.options.map((option, index) => {
                const isSelected = testState.answers[currentQuestion.id] === option.points;
                return (
                  <button
                    key={index}
                    type="button"
                    className={`w-full min-h-[48px] sm:min-h-[52px] h-auto py-3 sm:py-4 px-3 sm:px-4 text-left flex items-start gap-3 rounded-xl transition-all duration-200 touch-manipulation border-2 ${
                      isSelected 
                        ? "bg-primary text-primary-foreground border-primary shadow-glow" 
                        : "bg-card/90 text-card-foreground border-border/40 hover:border-primary/50 hover:bg-secondary/50 active:bg-secondary/70"
                    }`}
                    onClick={() => handleOptionSelect(option.points)}
                  >
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 mt-0.5 ${
                      isSelected
                        ? "border-primary-foreground bg-primary-foreground/30"
                        : "border-muted-foreground/40 bg-muted/20"
                    }`}>
                      {isSelected && (
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                    <span 
                      className="text-[15px] sm:text-base md:text-lg leading-snug font-medium flex-1"
                      style={{ 
                        overflowWrap: 'anywhere',
                        wordBreak: 'break-word'
                      }}
                    >
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Navigation - Fixed bottom with safe area */}
        <div 
          className="mt-4 pt-3 sm:pt-4 border-t border-border/20"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          <div className="flex justify-between items-center gap-2 sm:gap-4">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={testState.currentQuestion === 0}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 min-h-[44px] touch-manipulation text-sm sm:text-base"
            >
              <ChevronLeft className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Zurück</span>
            </Button>

            <div className="text-center text-xs sm:text-sm text-text-muted font-medium whitespace-nowrap">
              <span className="text-primary">{Object.keys(testState.answers).length}</span>
              <span>/{questions.length}</span>
            </div>

            <Button
              onClick={handleNext}
              disabled={!hasAnswer}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-5 min-h-[44px] touch-manipulation text-sm sm:text-base ${!hasAnswer ? "opacity-50" : "glow-neon"}`}
            >
              <span>{isLastQuestion ? "Fertig" : "Weiter"}</span>
              {!isLastQuestion && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
            </Button>
          </div>
        </div>

        {/* Support Hint - Hidden on mobile */}
        <div className="hidden sm:block mt-4">
          <SupportHint />
        </div>
      </div>
    </div>
  );
};