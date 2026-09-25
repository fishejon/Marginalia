export type MediumType = 'book' | 'podcast' | 'article' | 'video' | 'essay';

export interface ActionItem {
  id: string;
  action: string;
  category: 'Immediate' | 'Habit' | 'Strategic Decision';
  completed?: boolean;
}

export interface QuoteItem {
  id: string;
  text: string;
  location?: string; // e.g. "Chapter 3, p. 74" or "24:15 timestamp"
  note?: string;
}

export interface ClubDiscussionQA {
  id: string;
  question: string;
  answer: string;
}

export interface SynthesizedInsights {
  thesis: string;
  keyPrinciples: string[];
  actionPlaybook: ActionItem[];
  recommendationPitch: {
    whyRecommend: string;
    whoShouldRead: string;
    ratingBlurb: string;
  };
  synthesizedAt: string;
}

export interface Entry {
  id: string;
  userId?: string;
  title: string;
  author: string;
  medium: MediumType;
  sourceUrl?: string; // Direct link to podcast episode, article, video, or book
  coverUrl?: string;
  dateLogged: string;
  rating: number; // 1 to 5
  tags: string[];
  status: 'completed' | 'in-progress' | 'rereading';
  
  // The 3 foundational Personal Book Club discussion pillars:
  whatImThinking: string;       // raw takeaways, reflections, surprises
  whyILikedIt: string;          // what resonated, memorable stories, why it stood out
  howIllUseItGoingForward: string; // actionable applications, habits, business decisions

  // Guided Book Club Q&A
  clubDiscussion: ClubDiscussionQA[];
  
  // Memorable quotes / soundbites
  quotes: QuoteItem[];
  
  // AI-generated synthesis
  synthesis?: SynthesizedInsights;
}

export interface QueryRepositoryResult {
  answer: string;
  consultationSummary: string;
  citedEntries: Array<{
    id: string;
    title: string;
    author: string;
    relevance: string;
  }>;
  suggestedNextSteps: string[];
}

export interface SocraticMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface SmartRecommendation {
  id: string;
  title: string;
  author: string;
  medium: MediumType;
  coverUrl?: string;
  whyRecommended: string;
  thematicConnection: string;
  tags: string[];
  sourceLink?: string;
}

