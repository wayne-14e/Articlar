
import React, { useState } from 'react';
import { TestType } from '../types';
import Card from '../components/Card';

interface PracticeViewProps {
  onStartTest: (testType: TestType, topic?: string) => void;
  welcomeName?: string | null;
}

const Part1Icon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);
const Part2Icon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
);
const Part3Icon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);


const PracticeView: React.FC<PracticeViewProps> = ({ onStartTest, welcomeName }) => {
  const [topic, setTopic] = useState('');

  const practiceOptions = [
    { type: TestType.PART1, title: 'Part 1 Practice', description: 'General questions on familiar topics.', icon: <Part1Icon /> },
    { type: TestType.PART2, title: 'Part 2 Practice', description: 'Speak on a topic from a cue card.', icon: <Part2Icon /> },
    { type: TestType.PART3, title: 'Part 3 Practice', description: 'Discuss more abstract ideas.', icon: <Part3Icon /> },
  ];
  
  const handleTopicPracticeStart = () => {
    if (topic.trim()) {
      onStartTest(TestType.TOPIC_PRACTICE, topic.trim());
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header>
        {welcomeName ? (
           <h1 className="text-3xl font-bold text-slate-100">Let's practice, {welcomeName}!</h1>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-slate-100">IELTS Speaking Coach</h1>
            <p className="text-base text-slate-400 mt-1">Choose a section to begin your practice.</p>
          </>
        )}
      </header>

       <Card className="p-6">
            <h2 className="text-xl font-semibold text-slate-100">Practice a Specific Topic</h2>
            <p className="text-slate-400 mt-1">Enter any topic (e.g., "Holidays", "Technology") for a focused practice session.</p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <input 
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTopicPracticeStart()}
                placeholder="Enter topic..."
                className="flex-grow bg-slate-700 border border-slate-600 text-slate-100 rounded-lg p-3 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
              <button
                onClick={handleTopicPracticeStart}
                disabled={!topic.trim()}
                className="bg-rose-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-rose-500 transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                Practice Topic
              </button>
            </div>
      </Card>

      <div className="space-y-4">
        {practiceOptions.map((option) => (
          <Card key={option.type} className="p-0 overflow-hidden hover:bg-slate-700/50 transition-colors duration-200">
            <button
                onClick={() => onStartTest(option.type)}
                className="w-full text-left flex items-center justify-between p-6"
              >
                <div className="flex items-center gap-4">
                    <div className="text-rose-500 bg-rose-500/10 p-3 rounded-lg">
                        {option.icon}
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-100">{option.title}</h2>
                        <p className="text-slate-400">{option.description}</p>
                    </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PracticeView;