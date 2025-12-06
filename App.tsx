
import React, { useState, useCallback, useEffect } from 'react';
import { View, TestType, UserProfile, Assessment, TranscriptionPart, StudyPlan } from './types';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import PracticeView from './views/PracticeView';
import FullTestWrapper from './views/FullTestWrapper';
import ProfileView from './views/ProfileView';
import ConversationView from './views/ConversationView';
import { getSystemInstruction } from './constants';
import { API_KEY } from './config';

const ApiKeyInstructions: React.FC = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-2xl p-8 bg-slate-800 rounded-lg shadow-lg border border-slate-700 text-center">
            <h1 className="text-3xl font-bold text-slate-100 mb-4">Welcome to Articlar</h1>
            <p className="text-slate-300 mb-6">
                To get started with your local development environment, you need to provide a Gemini API key.
            </p>
            <div className="text-left bg-slate-900 p-4 rounded-lg border border-slate-600 space-y-4">
                <p className="text-slate-300">
                    1. Create your API key at{' '}
                    <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">
                        Google AI Studio
                    </a>.
                </p>
                <p className="text-slate-300">
                    2. Open the <code className="bg-slate-700 text-rose-300 px-2 py-1 rounded">config.ts</code> file in the project's root directory.
                </p>
                <p className="text-slate-300">
                    3. Paste your key into the <code className="bg-slate-700 text-rose-300 px-2 py-1 rounded">API_KEY</code> variable.
                </p>
            </div>
            <p className="text-sm text-slate-500 mt-6">
                Your key is stored locally and is never shared. Remember not to commit the <code className="bg-slate-700 px-1 rounded">config.ts</code> file with your key in it.
            </p>
        </div>
    </div>
);

// Define initial profile state outside the component for stability
const initialProfileState: UserProfile = {
  name: null,
  isAuthenticated: false,
  latestAssessment: null,
  targetScore: 7.5,
  deadlineWeeks: 4,
  studyPlan: null,
};

const App: React.FC = () => {
  if (!API_KEY) {
    return <ApiKeyInstructions />;
  }

  const [currentView, setCurrentView] = useState<View>(View.PRACTICE);
  const [isLayoutVisible, setIsLayoutVisible] = useState(true);
  const [activeTest, setActiveTest] = useState<TestType | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [welcomeName, setWelcomeName] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>(initialProfileState);

  // Load profile from localStorage on initial render
  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem('userProfile');
      if (storedProfile) {
        setUserProfile(JSON.parse(storedProfile));
      }
    } catch (error) {
      console.error("Failed to parse user profile from localStorage", error);
      localStorage.removeItem('userProfile'); // Clear corrupted data
    }
  }, []);

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    if (userProfile.isAuthenticated) {
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
    }
  }, [userProfile]);


  // Clear welcome message when navigating away from the practice page
  useEffect(() => {
    if (currentView !== View.PRACTICE && welcomeName) {
      setWelcomeName(null);
    }
  }, [currentView, welcomeName]);

  // Manage layout visibility based on the current view
  useEffect(() => {
    // The practice conversation view is the only one that *always* hides the layout.
    // The FullTestWrapper will manage visibility itself via a prop.
    // For all other views, we default the layout to be visible.
    if (currentView === View.CONVERSATION) {
      setIsLayoutVisible(false);
    } else {
      setIsLayoutVisible(true);
    }
  }, [currentView]);


  const startTest = useCallback((testType: TestType, topic?: string) => {
    setActiveTest(testType);
    setActiveTopic(topic || null);
    setCurrentView(View.CONVERSATION);
  }, []);

  const handleTestComplete = useCallback((transcription: TranscriptionPart[]) => {
    // This callback is now only for practice sessions.
    // The transcript is available but not used for assessment here.
    setCurrentView(View.PRACTICE); // Go back to practice view
    setActiveTest(null);
    setActiveTopic(null);
  }, []);
  
  const handleGoBack = useCallback(() => {
    // This function will return the user to the main practice/selection screen.
    setCurrentView(View.PRACTICE);
    setActiveTest(null);
    setActiveTopic(null);
  }, []);

  const handleUpdateProfile = useCallback((newProfile: Partial<UserProfile>) => {
      setUserProfile(prev => ({...prev, ...newProfile}));
  }, []);

  const handleSignUp = useCallback((name: string) => {
    setUserProfile({ ...initialProfileState, name, isAuthenticated: true });
    setWelcomeName(name);
    setCurrentView(View.PRACTICE);
  }, []);
  
  const handleSignOut = useCallback(() => {
    localStorage.removeItem('userProfile');
    setUserProfile(initialProfileState);
    setCurrentView(View.PROFILE);
  }, []);


  const renderView = () => {
    switch (currentView) {
      case View.PRACTICE:
        return <PracticeView onStartTest={startTest} welcomeName={userProfile.name} />;
      case View.FULL_TEST:
        return (
          <FullTestWrapper
            userProfile={userProfile}
            onResultsReady={(results) => {
              handleUpdateProfile(results);
            }}
            onBack={handleGoBack}
            setLayoutVisible={setIsLayoutVisible}
            onNavigateToProfile={() => setCurrentView(View.PROFILE)}
          />
        );
      case View.PROFILE:
        return <ProfileView userProfile={userProfile} onUpdateProfile={handleUpdateProfile} onSignUp={handleSignUp} onSignOut={handleSignOut} />;
      case View.CONVERSATION:
        if (activeTest) {
          // This path is now only for practice tests. Full tests are handled inside FullTestWrapper.
          return (
            <ConversationView
              testType={activeTest}
              topic={activeTopic}
              systemInstruction={getSystemInstruction(activeTest, activeTopic)}
              onComplete={handleTestComplete}
              onBack={handleGoBack}
            />
          );
        }
        // Fallback to practice view if no active test
        setCurrentView(View.PRACTICE);
        return <PracticeView onStartTest={startTest} />;
      default:
        return <PracticeView onStartTest={startTest} />;
    }
  };

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen flex flex-col">
      {isLayoutVisible && <Header />}
      <main className={`flex flex-col flex-grow container mx-auto px-4 relative ${
        isLayoutVisible ? 'pt-24 pb-24' : 'py-8'
      }`}>
        {renderView()}
      </main>
      {isLayoutVisible && (
        <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
      )}
    </div>
  );
};

export default App;