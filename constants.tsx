import React from 'react';
import { TestType, View } from './types';

export const ICONS = {
    PRACTICE: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V4a2 2 0 012-2h8a2 2 0 012 2v4z" />
        </svg>
    ),
    FULL_TEST: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
    ),
    PROFILE: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
};

export const NAVIGATION_ITEMS = [
  { id: View.PRACTICE, label: 'Practice', icon: ICONS.PRACTICE },
  { id: View.FULL_TEST, label: 'Full Test', icon: ICONS.FULL_TEST },
  { id: View.PROFILE, label: 'Profile', icon: ICONS.PROFILE },
];

export const getSystemInstruction = (testType: string, topic?: string | null): string => {
    if (testType === TestType.TOPIC_PRACTICE && topic) {
        return `You are an expert IELTS examiner conducting a speaking test. Your name is Alex.
Today you are conducting a full practice test (Parts 1, 2, and 3) focused on the topic of "${topic}".
All your questions, including the Part 2 cue card and Part 3 follow-ups, must be directly related to this topic.
Be friendly, professional, and stick to the official IELTS format.
Do not provide feedback or scores during the test. Only ask questions.
Begin the test now by greeting the user and starting with the first question about "${topic}".`;
    }

    if (testType === TestType.PART2) {
        return `You are an expert IELTS examiner conducting a speaking test. Your name is Alex.
Today you are conducting Part 2 of the test.
Your task is to:
1. Greet the user and introduce Part 2.
2. Present them with a cue card topic. The topic should be a standard IELTS Part 2 topic, for example: "Describe a book you have recently read."
3. After presenting the topic, say EXACTLY: "You will have 1 minute to prepare, and then you need to speak for up to 2 minutes. Your preparation time begins now."
4. After saying this, you MUST remain completely silent and wait for the user to start speaking. Do not provide any encouragement or further instructions.
5. Once the user finishes speaking, you can say "Thank you." and then ask one or two brief follow-up questions related to their topic.
6. To end the session, say "That is the end of this practice session."
Begin the test now by greeting the user and presenting the cue card topic.`;
    }

    return `You are an expert IELTS examiner conducting a speaking test. Your name is Alex.
Be friendly, professional, and stick to the official IELTS format.
Do not provide feedback or scores during the test. Only ask questions.
For Part 1, ask 4-5 general questions.
For Part 2, provide a cue card topic and give the user 1 minute to prepare and 2 minutes to speak. Tell them when to start and stop.
For Part 3, ask 4-5 follow-up questions related to the Part 2 topic.
Today you are conducting: ${testType}.
Begin the test now by greeting the user and starting with the first question.`;
};

export const ASSESSMENT_PROMPT = (transcript: string) => `
Analyze the following IELTS speaking test transcript and provide a detailed band score assessment.
The user's speech is marked with "user:", and the examiner's with "ai:".
Evaluate based on the four official IELTS criteria: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation.
For pronunciation, infer based on the text (e.g., complexity of vocabulary used suggests ability to pronounce).

The response must be a single JSON object.

For each of the four criteria, provide:
1. A band score from 1.0 to 9.0.
2. Detailed, constructive feedback with specific examples from the transcript. Explain what the user did well and what they can improve.

Also provide an overall band score, which should be the average of the four criteria scores, rounded to the nearest half band (e.g., 6.25 becomes 6.5, 6.75 becomes 7.0, 6.1 becomes 6.0).

The final JSON structure should be:
{
  "fluency": { "score": 7.0, "feedback": "You spoke at a good pace and used cohesive devices well, like 'furthermore' and 'on the other hand'. However, you sometimes hesitated to find vocabulary, for example when you said '...the, uhm, thing you use to...'. Try to use paraphrasing to avoid these pauses." },
  "lexicalResource": { "score": 6.5, "feedback": "You have a good range of vocabulary for familiar topics. You used some less common words like 'picturesque' and 'vibrant'. To improve, try to incorporate more idiomatic language and topic-specific vocabulary." },
  "grammaticalRange": { "score": 6.0, "feedback": "You used a mix of simple and complex sentences. However, there were some errors with verb tenses, for instance, 'I have went there last year' should be 'I went there last year'. Focus on practicing past tenses." },
  "pronunciation": { "score": 7.0, "feedback": "Your pronunciation is generally clear and easy to understand. Individual sounds are accurate. To reach a higher score, work on sentence stress and intonation to make your speech more expressive and natural-sounding." },
  "overall": 6.5
}

Transcript:
---
${transcript}
---
`;

export const STUDY_PLAN_PROMPT = (currentScore: number, targetScore: number, weeks: number) => `
A user has an overall IELTS speaking score of ${currentScore} and wants to reach a target score of ${targetScore} in ${weeks} weeks.
Create a personalized, day-by-day study plan to help them achieve this goal.
The plan should be realistic and focus on improving all four speaking criteria.
Include a mix of activities like practicing specific question types, vocabulary building, grammar exercises, and mock tests.
The response must be in JSON format.
`;