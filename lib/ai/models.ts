// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
  provider?: 'openai' | 'google';
}

export const models: Array<Model> = [
  // {
  //   id: 'gpt-4o-mini',
  //   label: 'GPT 4o mini',
  //   apiIdentifier: 'gpt-4o-mini',
  //   description: 'Small model for fast, lightweight tasks',
  // },
  // {
  //   id: 'gpt-4o',
  //   label: 'GPT 4o',
  //   apiIdentifier: 'gpt-4o',
  //   description: 'For complex, multi-step tasks',
  // },
  {
    id: 'learners-amigo',
    label: "Learner's Amigo Recommender",
    apiIdentifier: 'gemini-1.5-flash',
    provider: 'google',
    description: 'Personalized course recommender for users'
  },
  {
    id: 'gemini-1.5-flash',
    label: 'Gemini 1.5 Flash',
    apiIdentifier: 'gemini-1.5-flash',
    provider: 'google',
    description: "Google's fast and versatile multimodal model"
  },
] as const;

export const DEFAULT_MODEL_NAME: string = 'learners-amigo';
