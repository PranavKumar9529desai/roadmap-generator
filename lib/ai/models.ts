// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
  provider?: "openai" | "google";
}

export const models: Array<Model> = [
  {
    id: "learners-amigo", // Your internal identifier
    label: "Learner's Amigo Recommender",
    apiIdentifier: "gemini-2.0-flash", // This one is fine for free tier
    provider: "google",
    description:
      "Personalized course recommender for users (using Gemini 2.0 Flash)",
  },
  {
    id: "gemini-2.0-flash-actual",
    label: "Gemini 2.0 Flash",
    apiIdentifier: "gemini-2.0-flash", // This one is fine for free tier
    provider: "google",
    description:
      "Google's fast and efficient multimodal model for various tasks.",
  },

  // --- THIS IS THE CORRECTED BLOCK ---
  {
    id: "gemini-2.5-pro-experimental", // Changed ID
    label: "Gemini 2.5 Pro Experimental", // Changed Label
    // Use the experimental identifier that works with the free tier
    apiIdentifier: "gemini-2.5-pro-exp-03-25",
    provider: "google",
    description: "Google's advanced experimental model for complex reasoning (Free Tier available)."
  },
  // --- END OF CORRECTED BLOCK ---

] as const;

export const DEFAULT_MODEL_NAME: string = "learners-amigo";