import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { experimental_wrapLanguageModel as wrapLanguageModel, type LanguageModelV1 } from 'ai';

import { customMiddleware } from './custom-middleware';
import type { Model } from './models';

export const customModel = (apiIdentifier: string, provider: Model['provider']) => {
  console.log(`[customModel] Received provider: ${provider}, apiIdentifier: ${apiIdentifier}`);
  let modelProvider: LanguageModelV1;
  if (provider === 'google') {
    console.log('[customModel] Creating Google provider...');
    modelProvider = google(apiIdentifier) as any;
  } else {
    console.log('[customModel] Creating OpenAI provider...');
    modelProvider = openai(apiIdentifier) as any;
  }
  console.log(`[customModel] Created modelProvider type: ${modelProvider?.constructor?.name}`);

  return wrapLanguageModel({
    model: modelProvider,
    middleware: customMiddleware,
  });
};

export const imageGenerationModel = openai.image('dall-e-3');

export const courseRecommendationModel = () => {
  return customModel('gpt-4o-mini', 'openai');
};
