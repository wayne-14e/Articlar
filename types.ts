export enum View {
  PRACTICE = 'PRACTICE',
  FULL_TEST = 'FULL_TEST',
  PROFILE = 'PROFILE',
  CONVERSATION = 'CONVERSATION',
}

export enum TestType {
  PART1 = 'PART 1',
  PART2 = 'PART 2',
  PART3 = 'PART 3',
  FULL_TEST = 'FULL TEST',
  TOPIC_PRACTICE = 'TOPIC PRACTICE',
}

export enum SessionState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  FINISHED = 'FINISHED',
  ERROR = 'ERROR',
}

export interface TranscriptionPart {
  speaker: 'user' | 'ai';
  text: string;
}

export interface AssessmentCriterion {
  score: number;
  feedback: string;
}

export interface Assessment {
  fluency: AssessmentCriterion;
  lexicalResource: AssessmentCriterion;
  grammaticalRange: AssessmentCriterion;
  pronunciation: AssessmentCriterion;
  overall: number;
}

export interface StudyPlanDay {
    day: number;
    topic: string;
    activities: string[];
}
export interface StudyPlan {
  dailyLessons: StudyPlanDay[];
}

export interface UserProfile {
  name: string | null;
  isAuthenticated: boolean;
  latestAssessment: Assessment | null;
  targetScore: number;
  deadlineWeeks: number;
  studyPlan: StudyPlan | null;
}