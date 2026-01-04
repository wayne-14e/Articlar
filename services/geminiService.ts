
import { GoogleGenAI, Type } from '@google/genai';
import { Assessment, StudyPlan, UserProfile } from '../types';
import { ASSESSMENT_PROMPT, STUDY_PLAN_PROMPT } from '../constants';
import { API_KEY } from '../config';

const getAiInstance = () => {
    if (!API_KEY) {
        throw new Error("API_KEY is not configured. Please add it to config.ts");
    }
    return new GoogleGenAI({ apiKey: API_KEY });
};

export const getBandAssessment = async (transcript: string): Promise<Assessment | null> => {
    try {
        const ai = getAiInstance();
        const assessmentCriterionSchema = {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.NUMBER },
                feedback: { type: Type.STRING },
            },
            required: ['score', 'feedback'],
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: ASSESSMENT_PROMPT(transcript),
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        fluency: assessmentCriterionSchema,
                        lexicalResource: assessmentCriterionSchema,
                        grammaticalRange: assessmentCriterionSchema,
                        pronunciation: assessmentCriterionSchema,
                        overall: { type: Type.NUMBER },
                    },
                    required: ['fluency', 'lexicalResource', 'grammaticalRange', 'pronunciation', 'overall'],
                },
            },
        });
        const jsonText = response.text;
        const result = JSON.parse(jsonText) as Assessment;
        return result;

    } catch (error) {
        console.error("Error getting band assessment:", error);
        return null;
    }
};

export const getStudyPlan = async (profile: UserProfile): Promise<StudyPlan | null> => {
    if (!profile.latestAssessment) return null;

    try {
        const ai = getAiInstance();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: STUDY_PLAN_PROMPT(profile.latestAssessment.overall, profile.targetScore, profile.deadlineWeeks),
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        dailyLessons: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    day: { type: Type.INTEGER },
                                    topic: { type: Type.STRING },
                                    activities: { type: Type.ARRAY, items: { type: Type.STRING } },
                                },
                            },
                        },
                    },
                },
            },
        });
        const jsonText = response.text;
        const result = JSON.parse(jsonText) as StudyPlan;
        return result;

    } catch (error) {
        console.error("Error generating study plan:", error);
        return null;
    }
};