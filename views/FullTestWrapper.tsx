
import React, { useState, useEffect, useCallback } from 'react';
import { TestType, Assessment, TranscriptionPart, UserProfile, StudyPlan } from '../types';
import Card from '../components/Card';
import Loader from '../components/Loader';
import ConversationView from './ConversationView';
import { getSystemInstruction } from '../constants';
import { getBandAssessment, getStudyPlan } from '../services/geminiService';

// Warning Modal component defined within this file to avoid creating new files
interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSignUp: () => void;
  title: string;
  children: React.ReactNode;
}

const WarningModal: React.FC<WarningModalProps> = ({ isOpen, onClose, onConfirm, onSignUp, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-500/20 text-yellow-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
          <h2 className="text-xl font-bold text-slate-100">{title}</h2>
          <div className="mt-2 text-slate-400">
            {children}
          </div>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row-reverse sm:justify-center gap-3">
          <button
            onClick={onSignUp}
            className="w-full sm:w-auto bg-rose-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-rose-500 transition-colors duration-200"
          >
            Sign Up & Save
          </button>
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto bg-slate-600 text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-500 transition-colors duration-200"
          >
            Proceed Anyway
          </button>
        </div>
      </Card>
    </div>
  );
};

interface FullTestWrapperProps {
  userProfile: UserProfile;
  onResultsReady: (results: { latestAssessment: Assessment; studyPlan: StudyPlan | null }) => void;
  onBack: () => void;
  setLayoutVisible: (visible: boolean) => void;
  onNavigateToProfile: () => void;
}

const AssessmentView: React.FC<{ assessment: Assessment }> = ({ assessment }) => {
    const criteria = [
        { name: "Fluency & Coherence", data: assessment.fluency },
        { name: "Lexical Resource", data: assessment.lexicalResource },
        { name: "Grammatical Range", data: assessment.grammaticalRange },
        { name: "Pronunciation", data: assessment.pronunciation },
    ];
    return (
        <Card className="max-w-3xl mx-auto p-8 border-slate-700">
            <h2 className="text-3xl font-bold text-center text-slate-100">Your Assessment</h2>
            <div className="text-center my-8">
                <div className="inline-flex items-center justify-center w-40 h-40 rounded-full bg-gradient-to-br from-rose-500 to-rose-700">
                     <div className="w-[152px] h-[152px] rounded-full bg-slate-800 flex flex-col items-center justify-center">
                        <p className="text-slate-400 text-sm">Overall Band</p>
                        <p className="text-6xl font-bold text-white">{assessment.overall.toFixed(1)}</p>
                     </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                {criteria.map(c => (
                    <div key={c.name} className="bg-slate-700 p-4 rounded-lg text-center">
                        <p className="text-sm text-slate-400">{c.name}</p>
                        <p className="text-2xl font-semibold text-white">{c.data.score.toFixed(1)}</p>
                    </div>
                ))}
            </div>
            <div className="space-y-6 text-left">
                {criteria.map(c => (
                    <div key={c.name}>
                        <h3 className="text-xl font-semibold text-slate-200 mb-2">{c.name}</h3>
                        <div className="text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-700/50 p-4 rounded-lg border border-slate-600">{c.data.feedback}</div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const StudyPlanView: React.FC<{ studyPlan: StudyPlan }> = ({ studyPlan }) => (
    <Card className="max-w-3xl mx-auto p-8 border-slate-700">
        <h2 className="text-3xl font-bold text-center text-slate-100 mb-6">Your Personalized Study Plan</h2>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 text-left">
            {studyPlan.dailyLessons.map(day => (
                <div key={day.day} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                    <h3 className="font-semibold text-slate-100">Day {day.day}: {day.topic}</h3>
                    <ul className="list-disc list-inside text-slate-300 mt-2 space-y-1">
                        {day.activities.map((act, i) => <li key={i}>{act}</li>)}
                    </ul>
                </div>
            ))}
        </div>
    </Card>
);


const FullTestWrapper: React.FC<FullTestWrapperProps> = ({ userProfile, onResultsReady, onBack, setLayoutVisible, onNavigateToProfile }) => {
  const [isTestActive, setIsTestActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [finalAssessment, setFinalAssessment] = useState<Assessment | null>(null);
  const [finalStudyPlan, setFinalStudyPlan] = useState<StudyPlan | null>(null);
  const [isWarningModalVisible, setIsWarningModalVisible] = useState(false);

  useEffect(() => {
    // Hide layout ONLY when the test is active or loading.
    const shouldShowLayout = !isTestActive && !isLoading;
    setLayoutVisible(shouldShowLayout);

    return () => {
      setLayoutVisible(true);
    };
  }, [isTestActive, isLoading, setLayoutVisible]);

  const handleBackFromConversation = useCallback(() => {
    setIsTestActive(false);
  }, []);

  const handleTestComplete = useCallback(async (transcription: TranscriptionPart[]) => {
    setIsTestActive(false);
    setIsLoading(true);
    const conversationTranscript = transcription.map(p => `${p.speaker}: ${p.text}`).join('\n');
    
    const newAssessment = await getBandAssessment(conversationTranscript);

    if (newAssessment) {
      const updatedProfileForPlan = { ...userProfile, latestAssessment: newAssessment };
      // Only generate and save plan for authenticated users
      const newPlan = userProfile.isAuthenticated ? await getStudyPlan(updatedProfileForPlan) : null;
      
      setFinalAssessment(newAssessment);
      setFinalStudyPlan(newPlan);
      
      // Only save results for authenticated users
      if (userProfile.isAuthenticated) {
        onResultsReady({ latestAssessment: newAssessment, studyPlan: newPlan });
      }
    } else {
      alert("There was an issue generating your assessment. Please try again.");
    }
    setIsLoading(false);
  }, [onResultsReady, userProfile]);

  const startNewTest = () => {
    setFinalAssessment(null);
    setFinalStudyPlan(null);
    setIsTestActive(true);
  };
  
  const handleStartClick = () => {
    if (userProfile.isAuthenticated) {
      startNewTest();
    } else {
      setIsWarningModalVisible(true);
    }
  };

  const assessmentToDisplay = finalAssessment || userProfile.latestAssessment;
  const studyPlanToDisplay = finalStudyPlan || userProfile.studyPlan;

  if (isTestActive) {
    return (
      <ConversationView
        testType={TestType.FULL_TEST}
        systemInstruction={getSystemInstruction(TestType.FULL_TEST)}
        onComplete={handleTestComplete}
        onBack={handleBackFromConversation}
      />
    );
  }

  if (isLoading) {
    return <Loader text="Analyzing performance, generating assessment, and creating your study plan..." />;
  }

  if (assessmentToDisplay) {
    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold text-slate-100 text-center">Test Results</h1>
            <AssessmentView assessment={assessmentToDisplay} />
            {studyPlanToDisplay && <StudyPlanView studyPlan={studyPlanToDisplay} />}
            <div className="text-center pt-4">
                <button
                    onClick={handleStartClick}
                    className="bg-rose-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-rose-500 transition-colors duration-200"
                >
                    Take Another Test
                </button>
            </div>
        </div>
    );
  }

  return (
    <>
      <div className="flex-grow flex flex-col items-center justify-center text-center space-y-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-100">Full Mock Test</h1>
        <p className="text-base text-slate-400 max-w-xl mx-auto">
          Simulate the complete IELTS speaking test experience. You will go through all three parts and receive a detailed band score at the end.
        </p>
        <button
          onClick={handleStartClick}
          className="bg-rose-600 text-white font-semibold py-3 px-10 rounded-lg text-base hover:bg-rose-500 transition-colors duration-200 shadow-lg"
        >
          Start Full Test
        </button>
      </div>
      {isWarningModalVisible && (
        <WarningModal
          isOpen={isWarningModalVisible}
          onClose={() => setIsWarningModalVisible(false)}
          onConfirm={() => {
            setIsWarningModalVisible(false);
            startNewTest();
          }}
          onSignUp={() => {
            setIsWarningModalVisible(false);
            onNavigateToProfile();
          }}
          title="Heads Up!"
        >
          <p>You are not signed in. Your test results and study plan will not be saved. Sign up to track your progress.</p>
        </WarningModal>
      )}
    </>
  );
};


export default FullTestWrapper;
