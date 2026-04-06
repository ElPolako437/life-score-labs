import { useState } from "react";
import { LandingPage } from "@/components/LandingPage";
import { AgeInput } from "@/components/AgeInput";
import { BioAgeTest } from "@/components/BioAgeTest";
import { EmailGate } from "@/components/EmailGate";
import { TestResults } from "@/components/TestResults";
import { CookieConsent } from "@/components/CookieConsent";
import { TestState, questions } from "@/types/bioage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AppState = "landing" | "age-input" | "test" | "email-gate" | "results";

const Index = () => {
  const { toast } = useToast();
  const [appState, setAppState] = useState<AppState>("landing");
  const [testState, setTestState] = useState<TestState>({
    currentQuestion: 0,
    answers: {},
    userAge: null,
    selfAssessment: null,
    userInfo: null,
    isComplete: false
  });

  const handleStartTest = () => {
    setAppState("age-input");
  };

  const handleAgeSubmit = (age: number, selfAssessment: import("@/types/bioage").SelfAssessment | null) => {
    setTestState(prev => ({ ...prev, userAge: age, selfAssessment }));
    setAppState("test");
  };

const handleEmailSubmit = async (firstName: string, email: string, gdprConsent: boolean = true) => {
  // Create answers array using question IDs (1-15), not indices (0-14)
  const answersArray = questions.map((q) => Number(testState.answers[q.id] ?? 0));
  const scoreTotal = answersArray.reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0);
  
  // Calculate bio age and result level for storage
  const { calculateBioAge } = await import("@/types/bioage");
  const bioAgeResult = calculateBioAge(testState.answers, testState.userAge || 30);
  const resultText = `Dein biologisches Alter beträgt ${bioAgeResult.biologicalAge} Jahre. ${bioAgeResult.interpretation}`;
  const resultLevel = bioAgeResult.profile.id; // foundation, awakening, momentum, mastery

  // Save to bioage_submissions with result_level and gdpr_consent
  try {
    const { error } = await supabase
      .from('bioage_submissions')
      .insert([{ 
        email, 
        firstname: firstName, 
        answers: answersArray, 
        score_total: scoreTotal,
        user_age: testState.userAge,
        result_level: resultLevel,
        gdpr_consent: gdprConsent,
        consent_timestamp: new Date().toISOString()
      }]);

    if (error) {
      console.error("Failed to save bioage submission:", error);
    }
  } catch (error) {
    console.error("Database save error:", error);
  }

  // Save to bio_age_results for compatibility
  try {
    const { error: saveError } = await supabase
      .from('bio_age_results')
      .insert([{ 
        name: firstName,
        email, 
        real_age: testState.userAge || 30,
        bio_age: bioAgeResult.biologicalAge,
        result_text: resultText,
        result_level: resultLevel,
        gdpr_consent: gdprConsent,
        consent_timestamp: new Date().toISOString()
      }]);

    if (saveError) {
      console.error("Failed to save bio age results:", saveError);
    }
  } catch (error) {
    console.error("Bio age save error:", error);
  }

  // ALWAYS sync to Brevo list #3 (BioAge Leads) after successful submission
  // Newsletter opt-in (list #2) is handled separately on results page
  try {
    const { error: brevoError } = await supabase.functions.invoke('sync-brevo', {
      body: {
        email: email,
        firstname: firstName,
        newsletterOptIn: false,  // Always false here - opt-in happens on results page
      }
    });
    
    if (brevoError) {
      console.error("Brevo sync error:", brevoError);
      // Don't block user - Brevo sync failure shouldn't affect UX
    }
  } catch (brevoSyncError) {
    console.error("Brevo sync exception:", brevoSyncError);
    // Don't block user - continue to results
  }

  // Send email
  try {
    await supabase.functions.invoke('send-bioage-email', {
      body: {
        record: {
          email,
          firstname: firstName,
          answers: answersArray,
          score_total: scoreTotal,
          user_age: testState.userAge || 30,
        }
      }
    });
  } catch (emailError) {
    console.error("Email sending error:", emailError);
  }

  setTestState(prev => ({
    ...prev,
    userInfo: { firstName, email }
  }));

  toast({
    title: `Danke, ${firstName}!`,
    description: `Dein biologisches Alter wurde berechnet.`,
  } as any);

  setAppState("results");
};

  const handleAnswerSelect = (questionId: number, points: number) => {
    setTestState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: points }
    }));
  };

  const handleNext = () => {
    setTestState(prev => ({
      ...prev,
      currentQuestion: Math.min(prev.currentQuestion + 1, questions.length - 1)
    }));
  };

  const handlePrevious = () => {
    setTestState(prev => ({
      ...prev,
      currentQuestion: Math.max(prev.currentQuestion - 1, 0)
    }));
  };

  const handleComplete = () => {
    console.log("handleComplete - current testState:", testState);
    setTestState(prev => {
      const updatedState = { ...prev, isComplete: true };
      console.log("handleComplete - updated testState:", updatedState);
      return updatedState;
    });
    setAppState("email-gate");
  };

  const handleRestart = () => {
    setTestState({
      currentQuestion: 0,
      answers: {},
      userAge: null,
      selfAssessment: null,
      userInfo: null,
      isComplete: false
    });
    setAppState("landing");
  };

  const renderContent = () => {
    switch (appState) {
      case "landing":
        return <LandingPage onStartTest={handleStartTest} />;
      
      case "age-input":
        return <AgeInput onAgeSubmit={handleAgeSubmit} />;
      
      case "test":
        return (
          <BioAgeTest
            testState={testState}
            onAnswerSelect={handleAnswerSelect}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onComplete={handleComplete}
          />
        );
      
      case "email-gate":
        console.log("Rendering EmailGate with testState:", testState);
        return <EmailGate testState={testState} onEmailSubmit={handleEmailSubmit} />;
      
      case "results":
        return (
          <TestResults
            testState={testState}
            onRestart={handleRestart}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {renderContent()}
      <CookieConsent />
    </>
  );
};

export default Index;
