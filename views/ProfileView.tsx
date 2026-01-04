import React, { useState } from 'react';
import { UserProfile } from '../types';
import Card from '../components/Card';
import Loader from '../components/Loader';
import { getStudyPlan } from '../services/geminiService';

interface ProfileViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  onSignUp: (name: string) => void;
  onSignOut: () => void;
}

const SignUpForm: React.FC<{ onSignUp: (name: string) => void }> = ({ onSignUp }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && password.trim()) {
      onSignUp(name);
    } else {
      alert('Please fill in both name and password.');
    }
  };

  return (
    <div className="max-w-md mx-auto">
       <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Welcome!</h1>
        <p className="text-base text-slate-400 mt-2">Create an account to track your progress.</p>
      </header>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 mt-1 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              required
            />
          </div>
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 mt-1 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-rose-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-rose-500 transition-colors duration-200"
          >
            Sign Up
          </button>
        </form>
      </Card>
    </div>
  );
};

const ProfileView: React.FC<ProfileViewProps> = ({ userProfile, onUpdateProfile, onSignUp, onSignOut }) => {
  const { name, isAuthenticated, latestAssessment, targetScore, deadlineWeeks, studyPlan } = userProfile;
  const [isLoading, setIsLoading] = useState(false);

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    const newPlan = await getStudyPlan(userProfile);
    if(newPlan) {
        onUpdateProfile({ studyPlan: newPlan });
    } else {
        alert("Could not generate a study plan. Please make sure you have a recent assessment.");
    }
    setIsLoading(false);
  };
  
  const handleGenerateClick = () => {
    if (isLoading) return;

    if (!latestAssessment) {
      alert("Please complete a full mock test to generate a personalized study plan.");
    } else {
      handleGeneratePlan();
    }
  };

  if (!isAuthenticated) {
    return <SignUpForm onSignUp={onSignUp} />;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-slate-100">{name}'s Profile</h1>
        <p className="text-base text-slate-400 mt-2">Track your progress and set your goals</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Latest Assessment</h2>
          {latestAssessment ? (
            <div className="space-y-2 text-slate-300">
              <p>Overall Score: <span className="font-bold text-white">{latestAssessment.overall.toFixed(1)}</span></p>
              <p>Fluency: <span className="font-bold text-white">{latestAssessment.fluency.score.toFixed(1)}</span></p>
              <p>Vocabulary: <span className="font-bold text-white">{latestAssessment.lexicalResource.score.toFixed(1)}</span></p>
              <p>Grammar: <span className="font-bold text-white">{latestAssessment.grammaticalRange.score.toFixed(1)}</span></p>
              <p>Pronunciation: <span className="font-bold text-white">{latestAssessment.pronunciation.score.toFixed(1)}</span></p>
            </div>
          ) : (
            <p className="text-slate-400">Complete a full mock test to see your assessment here.</p>
          )}
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Your Goals</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="targetScore" className="block text-sm font-medium text-slate-300 mb-2">Target Score: {targetScore.toFixed(1)}</label>
              <input
                id="targetScore"
                type="range"
                min="4"
                max="9"
                step="0.5"
                value={targetScore}
                onChange={(e) => onUpdateProfile({ targetScore: parseFloat(e.target.value) })}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-slate-300">Study Deadline</label>
              <select
                id="deadline"
                value={deadlineWeeks}
                onChange={(e) => onUpdateProfile({ deadlineWeeks: parseInt(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-2 mt-1 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              >
                {[2, 4, 6, 8, 12].map(w => <option key={w} value={w}>{w} weeks</option>)}
              </select>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Personalized Study Plan</h2>
          <p className="text-slate-400 mt-1">Get a daily plan based on your assessment and goals.</p>
        </div>
        <button
            onClick={handleGenerateClick}
            disabled={isLoading}
            className={`mt-6 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 ${
                isLoading
                    ? 'bg-slate-600 cursor-not-allowed'
                    : !latestAssessment
                    ? 'bg-slate-600'
                    : 'bg-rose-600 hover:bg-rose-500'
            }`}
        >
            {isLoading ? 'Generating...' : (studyPlan ? 'Regenerate Plan' : 'Generate Plan')}
        </button>
        {isLoading && <div className="mt-4"><Loader text="Creating your personalized study schedule..." /></div>}
        {studyPlan && !isLoading && (
            <div className="mt-6 space-y-4 max-h-96 overflow-y-auto pr-2">
                {studyPlan.dailyLessons.map(day => (
                    <div key={day.day} className="bg-slate-700/50 p-4 rounded-lg">
                        <h3 className="font-semibold text-slate-100">Day {day.day}: {day.topic}</h3>
                        <ul className="list-disc list-inside text-slate-300 mt-2 space-y-1">
                            {day.activities.map((act, i) => <li key={i}>{act}</li>)}
                        </ul>
                    </div>
                ))}
            </div>
        )}
      </Card>
      
      <div className="text-center pt-4">
        <button
          onClick={onSignOut}
          className="bg-slate-700 text-slate-300 font-semibold py-2 px-6 rounded-lg hover:bg-slate-600 transition-colors duration-200"
        >
          Sign Out
        </button>
      </div>

    </div>
  );
};

export default ProfileView;