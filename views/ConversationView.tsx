import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TestType, SessionState, TranscriptionPart } from '../types';
import { useLiveSession } from '../hooks/useLiveSession';
import Loader from '../components/Loader';
import BackButton from '../components/BackButton';

interface TimerProps {
  stage: 'PREPARING' | 'SPEAKING';
  timeLeft: number;
  totalTime: number;
}

const Timer: React.FC<TimerProps> = ({ stage, timeLeft, totalTime }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / totalTime;
  const strokeDashoffset = circumference * (1 - progress);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  const stageText = stage === 'PREPARING' ? 'Preparation' : 'Speaking';
  const colorClass = stage === 'PREPARING' ? 'text-blue-400' : 'text-rose-500';

  return (
    <div className="relative flex flex-col items-center justify-center my-4">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle className="text-slate-700" strokeWidth="5" stroke="currentColor" fill="transparent" r={radius} cx="50" cy="50" />
          <circle
            className={colorClass} strokeWidth="5" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="50" cy="50" transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 0.5s linear' }}
          />
        </svg>
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-100">{formatTime(timeLeft)}</span>
          <span className={`text-sm font-medium ${colorClass}`}>{stageText}</span>
        </div>
      </div>
    </div>
  );
};

interface ConversationViewProps {
  testType: TestType;
  systemInstruction: string;
  onComplete: (transcription: TranscriptionPart[]) => void;
  onBack?: () => void;
  topic?: string | null;
}

const ConversationView: React.FC<ConversationViewProps> = ({ testType, systemInstruction, onComplete, onBack, topic }) => {
  const { sessionState, transcription, streamingInputText, streamingOutputText, error, startSession, endSession } = useLiveSession(systemInstruction);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  
  const [timerStage, setTimerStage] = useState<'PREPARING' | 'SPEAKING' | 'ENDED' | 'INACTIVE'>('INACTIVE');
  const [timeLeft, setTimeLeft] = useState(0);

  const handleEndTest = useCallback(() => {
    endSession();
  }, [endSession]);

  useEffect(() => {
    startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcription, streamingInputText, streamingOutputText]);

  useEffect(() => {
    if (sessionState === SessionState.FINISHED) {
      onCompleteRef.current(transcription);
    }
  }, [sessionState, transcription]);
  
  // Timer logic: Start timer for Part 2 after examiner gives instructions
  useEffect(() => {
    if (testType === TestType.PART2 && timerStage === 'INACTIVE' && transcription.length > 0 && transcription[0].speaker === 'ai') {
      setTimerStage('PREPARING');
      setTimeLeft(60);
    }
  }, [transcription, testType, timerStage]);

  // Timer logic: Countdown and stage transition
  useEffect(() => {
    if (timerStage === 'PREPARING' || timerStage === 'SPEAKING') {
      if (timeLeft <= 0) {
        if (timerStage === 'PREPARING') {
          setTimerStage('SPEAKING');
          setTimeLeft(120);
        } else {
          setTimerStage('ENDED');
          handleEndTest();
        }
        return;
      }

      const intervalId = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [timerStage, timeLeft, handleEndTest]);

  const handleBackClick = () => {
    endSession();
    if (onBack) {
      onBack();
    }
  };

  if (sessionState === SessionState.FINISHED) {
      // The parent component will handle unmounting this view.
      // Show a loader in the meantime.
      return <Loader text={testType === TestType.FULL_TEST ? "Test complete. Generating assessment..." : "Finishing session..."} />;
  }
  
  const title = topic ? `${testType}: ${topic}` : testType;

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto relative">
      {onBack && <BackButton onClick={handleBackClick} />}
      
      {testType === TestType.PART2 && timerStage !== 'INACTIVE' && timerStage !== 'ENDED' && (
        <Timer 
          stage={timerStage}
          timeLeft={timeLeft}
          totalTime={timerStage === 'PREPARING' ? 60 : 120}
        />
      )}

      <header className={`mb-4 text-center ${testType === TestType.PART2 ? 'pt-2' : 'pt-12'}`}>
        <h1 className="text-2xl font-semibold text-slate-100 capitalize">{title}</h1>
        <div className="mt-3 flex items-center justify-center space-x-2 h-6">
            {/* FIX: Removed check for SessionState.FINISHED as it's unreachable due to an early return, resolving a TypeScript error. */}
            <p className="text-sm text-slate-400 font-medium">
                {sessionState === SessionState.CONNECTING && 'Connecting...'}
                {sessionState === SessionState.LISTENING && 'Listening... You may speak now.'}
                {sessionState === SessionState.THINKING && 'Examiner is speaking...'}
                {sessionState === SessionState.ERROR && 'Connection Error.'}
            </p>
            {sessionState === SessionState.LISTENING && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>}
            {sessionState === SessionState.THINKING && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span>}
        </div>
        {error && <p className="text-rose-400 mt-2 text-sm">{error}</p>}
      </header>
      
      <div className="flex-grow bg-slate-800 rounded-lg p-4 overflow-y-auto space-y-4 shadow-inner min-h-[50vh]">
        {transcription.map((part, index) => (
          <div key={index} className={`flex flex-col ${part.speaker === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-2xl p-3 rounded-lg ${part.speaker === 'user' ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
              <p>{part.text}</p>
            </div>
          </div>
        ))}

        {/* Streaming AI output */}
        {streamingOutputText && (
            <div className="flex flex-col items-start">
                <div className="max-w-2xl p-3 rounded-lg bg-slate-700 text-slate-200">
                    <p>{streamingOutputText}</p>
                </div>
            </div>
        )}

        {/* Streaming User input */}
        {streamingInputText && (
            <div className="flex flex-col items-end">
                <div className="max-w-2xl p-3 rounded-lg bg-rose-600 text-white">
                    <p>{streamingInputText}</p>
                </div>
            </div>
        )}

        {sessionState === SessionState.THINKING && !streamingOutputText &&
            <div className="flex flex-col items-start">
                <div className="max-w-2xl p-3 rounded-lg bg-slate-700">
                    <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 bg-slate-300 rounded-full animate-pulse delay-0"></span>
                        <span className="h-2 w-2 bg-slate-300 rounded-full animate-pulse delay-150"></span>
                        <span className="h-2 w-2 bg-slate-300 rounded-full animate-pulse delay-300"></span>
                    </div>
                </div>
            </div>
        }
        <div ref={transcriptEndRef} />
      </div>

      <div className="mt-6">
        <button
          onClick={handleEndTest}
          disabled={sessionState !== SessionState.LISTENING && sessionState !== SessionState.THINKING}
          className="w-full bg-rose-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-rose-500 transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          End Session
        </button>
      </div>
    </div>
  );
};

export default ConversationView;