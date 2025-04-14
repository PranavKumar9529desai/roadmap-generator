import {
  type Message,
  convertToCoreMessages,
  createDataStreamResponse,
  experimental_generateImage,
  generateObject,
  streamObject,
  streamText,
} from 'ai';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import { customModel, imageGenerationModel } from '@/lib/ai';
import { models } from '@/lib/ai/models';
import {
  codePrompt,
  systemPrompt,
  updateDocumentPrompt,
} from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  getDocumentById,
  saveChat,
  saveCoursePlan,
  saveDocument,
  saveMessages,
  saveSuggestions,
} from '@/lib/db/queries';
import type { Suggestion } from '@/lib/db/schema';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';

export const maxDuration = 60;

type AllowedTools =
  | 'createDocument'
  | 'updateDocument'
  | 'requestSuggestions'
  | 'getWeather'
  | 'createRoadmap'
  | 'userProfileGeneration'
  | 'generateInitialCoursePlan'
  | 'saveCoursePlan';

const blocksTools: AllowedTools[] = [
  'createDocument',
  'updateDocument',
  'requestSuggestions',
];

const weatherTools: AllowedTools[] = ['getWeather'];
const roadmapTools: AllowedTools[] = ['createRoadmap'];
const profileTools: AllowedTools[] = ['userProfileGeneration'];
const courseTools: AllowedTools[] = ['generateInitialCoursePlan', 'saveCoursePlan'];
const allTools: AllowedTools[] = [...blocksTools, ...weatherTools, ...roadmapTools, ...profileTools, ...courseTools];

export async function POST(request: Request) {
  const {
    id,
    messages,
    modelId,
  }: { id: string; messages: Array<Message>; modelId: string } =
    await request.json();

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const model = models.find((model) => model.id === modelId);

  if (!model) {
    return new Response('Model not found', { status: 404 });
  }

  const coreMessages = convertToCoreMessages(messages);
  const userMessage = getMostRecentUserMessage(coreMessages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  const chat = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage, modelId });
    await saveChat({ id, userId: session.user.id, title });
  }

  const userMessageId = generateUUID();

  await saveMessages({
    messages: [
      { ...userMessage, id: userMessageId, createdAt: new Date(), chatId: id },
    ],
  });

  return createDataStreamResponse({
    execute: (dataStream) => {
      dataStream.writeData({
        type: 'user-message-id',
        content: userMessageId,
      });

      const result = streamText({
        model: customModel(model.apiIdentifier, model.provider),
        system: systemPrompt,
        messages: coreMessages,
        maxSteps: 5,
        experimental_activeTools: allTools,
        tools: {
          getWeather: {
            description: 'Get the current weather at a location',
            parameters: z.object({
              latitude: z.number(),
              longitude: z.number(),
            }),
            execute: async ({ latitude, longitude }) => {
              const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
              );

              const weatherData = await response.json();
              return weatherData;
            },
          },
          createDocument: {
            description:
              'Create a document for a writing or content creation activities like image generation. This tool will call other functions that will generate the contents of the document based on the title and kind.',
            parameters: z.object({
              title: z.string(),
              kind: z.enum(['text', 'code', 'image']),
            }),
            execute: async ({ title, kind }) => {
              const id = generateUUID();
              let draftText = '';

              dataStream.writeData({
                type: 'id',
                content: id,
              });

              dataStream.writeData({
                type: 'title',
                content: title,
              });

              dataStream.writeData({
                type: 'kind',
                content: kind,
              });

              dataStream.writeData({
                type: 'clear',
                content: '',
              });

              if (kind === 'text') {
                const { fullStream } = streamText({
                  model: customModel(model.apiIdentifier, model.provider),
                  system:
                    'Write about the given topic. Markdown is supported. Use headings wherever appropriate.',
                  prompt: title,
                });

                for await (const delta of fullStream) {
                  const { type } = delta;

                  if (type === 'text-delta') {
                    const { textDelta } = delta;

                    draftText += textDelta;
                    dataStream.writeData({
                      type: 'text-delta',
                      content: textDelta,
                    });
                  }
                }

                dataStream.writeData({ type: 'finish', content: '' });
              } else if (kind === 'code') {
                const { fullStream } = streamObject({
                  model: customModel(model.apiIdentifier, model.provider),
                  system: codePrompt,
                  prompt: title,
                  schema: z.object({
                    code: z.string(),
                  }),
                });

                for await (const delta of fullStream) {
                  const { type } = delta;

                  if (type === 'object') {
                    const { object } = delta;
                    const { code } = object;

                    if (code) {
                      dataStream.writeData({
                        type: 'code-delta',
                        content: code ?? '',
                      });

                      draftText = code;
                    }
                  }
                }

                dataStream.writeData({ type: 'finish', content: '' });
              } else if (kind === 'image') {
                const { image } = await experimental_generateImage({
                  model: imageGenerationModel,
                  prompt: title,
                  n: 1,
                });

                draftText = image.base64;

                dataStream.writeData({
                  type: 'image-delta',
                  content: image.base64,
                });

                dataStream.writeData({ type: 'finish', content: '' });
              }

              if (session.user?.id) {
                await saveDocument({
                  id,
                  title,
                  kind,
                  content: draftText,
                  userId: session.user.id,
                });
              }

              return {
                id,
                title,
                kind,
                content:
                  'A document was created and is now visible to the user.',
              };
            },
          },
          updateDocument: {
            description: 'Update a document with the given description.',
            parameters: z.object({
              id: z.string().describe('The ID of the document to update'),
              description: z
                .string()
                .describe('The description of changes that need to be made'),
            }),
            execute: async ({ id, description }) => {
              const document = await getDocumentById({ id });

              if (!document) {
                return {
                  error: 'Document not found',
                };
              }

              const { content: currentContent } = document;
              let draftText = '';

              dataStream.writeData({
                type: 'clear',
                content: document.title,
              });

              if (document.kind === 'text') {
                const { fullStream } = streamText({
                  model: customModel(model.apiIdentifier, model.provider),
                  system: updateDocumentPrompt(currentContent, 'text'),
                  prompt: description,
                  experimental_providerMetadata: {
                    openai: {
                      prediction: {
                        type: 'content',
                        content: currentContent,
                      },
                    },
                  },
                });

                for await (const delta of fullStream) {
                  const { type } = delta;

                  if (type === 'text-delta') {
                    const { textDelta } = delta;

                    draftText += textDelta;
                    dataStream.writeData({
                      type: 'text-delta',
                      content: textDelta,
                    });
                  }
                }

                dataStream.writeData({ type: 'finish', content: '' });
              } else if (document.kind === 'code') {
                const { fullStream } = streamObject({
                  model: customModel(model.apiIdentifier, model.provider),
                  system: updateDocumentPrompt(currentContent, 'code'),
                  prompt: description,
                  schema: z.object({
                    code: z.string(),
                  }),
                });

                for await (const delta of fullStream) {
                  const { type } = delta;

                  if (type === 'object') {
                    const { object } = delta;
                    const { code } = object;

                    if (code) {
                      dataStream.writeData({
                        type: 'code-delta',
                        content: code ?? '',
                      });

                      draftText = code;
                    }
                  }
                }

                dataStream.writeData({ type: 'finish', content: '' });
              } else if (document.kind === 'image') {
                const { image } = await experimental_generateImage({
                  model: imageGenerationModel,
                  prompt: description,
                  n: 1,
                });

                draftText = image.base64;

                dataStream.writeData({
                  type: 'image-delta',
                  content: image.base64,
                });

                dataStream.writeData({ type: 'finish', content: '' });
              }

              if (session.user?.id) {
                await saveDocument({
                  id,
                  title: document.title,
                  content: draftText,
                  kind: document.kind,
                  userId: session.user.id,
                });
              }

              return {
                id,
                title: document.title,
                kind: document.kind,
                content: 'The document has been updated successfully.',
              };
            },
          },
          requestSuggestions: {
            description: 'Request suggestions for a document',
            parameters: z.object({
              documentId: z
                .string()
                .describe('The ID of the document to request edits'),
            }),
            execute: async ({ documentId }) => {
              const document = await getDocumentById({ id: documentId });

              if (!document || !document.content) {
                return {
                  error: 'Document not found',
                };
              }

              const suggestions: Array<
                Omit<Suggestion, 'userId' | 'createdAt' | 'documentCreatedAt'>
              > = [];

              const { elementStream } = streamObject({
                model: customModel(model.apiIdentifier, model.provider),
                system:
                  'You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.',
                prompt: document.content,
                output: 'array',
                schema: z.object({
                  originalSentence: z
                    .string()
                    .describe('The original sentence'),
                  suggestedSentence: z
                    .string()
                    .describe('The suggested sentence'),
                  description: z
                    .string()
                    .describe('The description of the suggestion'),
                }),
              });

              for await (const element of elementStream) {
                const suggestion = {
                  originalText: element.originalSentence,
                  suggestedText: element.suggestedSentence,
                  description: element.description,
                  id: generateUUID(),
                  documentId: documentId,
                  isResolved: false,
                };

                dataStream.writeData({
                  type: 'suggestion',
                  content: suggestion,
                });

                suggestions.push(suggestion);
              }

              if (session.user?.id) {
                const userId = session.user.id;

                await saveSuggestions({
                  suggestions: suggestions.map((suggestion) => ({
                    ...suggestion,
                    userId,
                    createdAt: new Date(),
                    documentCreatedAt: document.createdAt,
                  })),
                });
              }

              return {
                id: documentId,
                title: document.title,
                kind: document.kind,
                message: 'Suggestions have been added to the document',
              };
            },
          },
          createRoadmap: {
            description: 'Creates a learning plan or roadmap with a list of steps or events. Use this when the user asks for a plan, schedule, or roadmap.',
            parameters: z.object({
              roadmapEvents: z.array(z.object({
                id: z.string().describe('A unique identifier for the roadmap event (e.g., "topic-1", "week-1-react").'),
                title: z.string().describe('The display name or title for the roadmap event (e.g., "Introduction to JavaScript", "Week 1: Setup").'),
              })).describe('An array of events representing the steps or stages of the roadmap.'),
            }),
            execute: async ({ roadmapEvents }) => {
              console.log('Executing createRoadmap tool with events:', roadmapEvents);
              dataStream.writeData({ type: 'roadmap-creation', content: roadmapEvents });

              return {
                success: true,
                message: `Roadmap created with ${roadmapEvents.length} event(s). The roadmap is being displayed.`,
              };
            },
          },
          userProfileGeneration: {
            description: 'Generates a user profile for the dashboard based on conversation data collected from the user.',
            parameters: z.object({
              name: z.string().describe('The name of the user.'),
              education: z.string().optional().describe('User\'s educational background and qualifications.'),
              pastExperience: z.string().optional().describe('User\'s past work or relevant experience.'),
              learningGoals: z.string().describe('User\'s learning objectives and aspirations.'),
              currentGoal: z.string().describe('The specific current learning goal for the user to focus on.'),
              dailyTimeCommitment: z.string().optional().describe('How much time the user can dedicate daily to learning.'),
              priorKnowledge: z.string().optional().describe('The user\'s prior knowledge level in the subject area.'),
            }),
            execute: async ({ name, education, pastExperience, learningGoals, currentGoal, dailyTimeCommitment, priorKnowledge }) => {
              console.log(`Generating profile for user: ${name}`);
              
              try {
                // First ensure we save to PostgreSQL via Drizzle
                if (session.user?.id) {
                  const { saveUserProfileToDB } = await import('@/lib/db/queries');
                  
                  // Save to PostgreSQL database
                  await saveUserProfileToDB({
                    userId: session.user.id,
                    name,
                    education,
                    pastExperience,
                    learningGoals,
                    currentGoal,
                    dailyTimeCommitment,
                    priorKnowledge,
                    avatarFallback: name.charAt(0).toUpperCase()
                  });
                  
                  console.log(`Profile for ${name} saved to PostgreSQL database`);
                }
                
                // Also save to IndexedDB for client-side usage (as backup)
                const { saveUserProfile, recordActivity } = await import('@/app/lib/db');
                
                await saveUserProfile({
                  name,
                  education: education || '',
                  pastExperience: pastExperience || '',
                  learningGoals: learningGoals || '',
                  avatarFallback: name.charAt(0).toUpperCase(),
                  currentGoal,
                  dailyTimeCommitment: dailyTimeCommitment || '',
                  priorKnowledge: priorKnowledge || ''
                });
                
                // Record this as a profile creation activity
                await recordActivity('profile-create');
                
                return {
                  success: true,
                  message: `Profile created for ${name}! You can now view your complete profile and learning activity on the dashboard.`,
                  showDashboardButton: true,
                  dashboardUrl: '/dashboard',
                  profile: {
                    userProfile: {
                      name,
                      education: education || '',
                      pastExperience: pastExperience || '',
                      learningGoals: learningGoals || '',
                      avatarFallback: name.charAt(0).toUpperCase(),
                      dailyTimeCommitment: dailyTimeCommitment || '',
                      priorKnowledge: priorKnowledge || ''
                    },
                    currentGoal
                  }
                };
              } catch (error) {
                console.error('Error saving user profile:', error);
                
                // Create a profile object even if saving failed
                const profileData = {
                  userProfile: {
                    name,
                    education: education || '',
                    pastExperience: pastExperience || '',
                    learningGoals: learningGoals || '',
                    avatarFallback: name.charAt(0).toUpperCase(),
                    dailyTimeCommitment: dailyTimeCommitment || '',
                    priorKnowledge: priorKnowledge || ''
                  },
                  currentGoal
                };
                
                // Return a partial success with the profile data even if storage failed
                return {
                  success: true,
                  message: `Profile processed for ${name}. You can view it on the dashboard.`,
                  showDashboardButton: true,
                  dashboardUrl: '/dashboard',
                  profile: profileData,
                  warning: "Your profile information was processed but there was an issue with storage. Your profile data may not persist between sessions."
                };
              }
            },
          },
          generateInitialCoursePlan: {
            description: "Generates an initial detailed course plan structure based on the user's profile and learning goals. Use this after the user confirms they want a detailed plan.",
            parameters: z.object({
              learningGoals: z.string().describe("User's learning objectives and aspirations."),
              priorKnowledge: z.string().optional().describe("The user's prior knowledge level in the subject area."),
              dailyTimeCommitment: z.string().optional().describe("How much time the user can dedicate daily to learning."),
              currentGoal: z.string().describe("The specific current learning goal for the user to focus on."),
            }),
            execute: async ({ learningGoals, priorKnowledge, dailyTimeCommitment, currentGoal }) => {
              console.log('Generating course plan for goal:', currentGoal);
              
              try {
                // Generate a course plan using the AI with generateObject
                console.log('Attempting to call generateObject for course plan...'); // Log before the call
                const { object: coursePlanData } = await generateObject({
                  model: customModel(model.apiIdentifier, model.provider),
                  system: 'You are an expert curriculum designer. Create a detailed, structured course plan based on the user\'s current learning goal, prior knowledge, and available time. The course should be structured like online learning platforms such as Udemy or Coursera, with clear modules, topics, resources and time estimates. Limit the number of modules to a maximum of 5.', // Added module limit instruction
                  prompt: `
                  Create a comprehensive course plan for a user with the following profile:
                  - Learning Goals: ${learningGoals}
                  - Current Goal: ${currentGoal}
                  - Prior Knowledge: ${priorKnowledge || 'Not specified'}
                  - Daily Time Commitment: ${dailyTimeCommitment || 'Not specified'}
                  
                  Structure the course with modules (max 5), topics, and resources as you would find on online learning platforms like Udemy or Coursera. Ensure all fields in the schema are populated correctly, using null where appropriate for optional fields like url or questions if no value is applicable.
                  `, // Added clarification for null values
                  schema: z.object({
                    title: z.string().describe('The title of the course'),
                    description: z.string().describe('A detailed description of the course'),
                    learningObjectives: z.array(z.string()).describe('Key learning objectives of the course'),
                    totalEstimatedTime: z.string().describe('Total estimated time to complete the course'),
                    modules: z.array(z.object({
                      id: z.string().describe('Unique identifier for the module'),
                      title: z.string().describe('Title of the module'),
                      description: z.string().describe('Description of what the module covers'),
                      estimatedTime: z.string().describe('Estimated time to complete this module'),
                      topics: z.array(z.object({
                        id: z.string().describe('Unique identifier for the topic'),
                        title: z.string().describe('Title of the topic'),
                        estimatedTime: z.string().describe('Estimated time to complete this topic'),
                        completed: z.boolean().default(false).describe('Whether this topic has been completed'),
                      })),
                      resources: z.array(z.object({
                        type: z.enum(['video', 'article', 'quiz']).describe('Type of resource'),
                        title: z.string().describe('Title of the resource'),
                        url: z.string().nullable().optional().describe('URL of the resource, if applicable'), // Updated
                        duration: z.string().nullable().optional().describe('Duration of video resources'),
                        estimatedReadTime: z.string().nullable().optional().describe('Estimated time to read article resources'),
                        questions: z.number().nullable().optional().describe('Number of questions for quiz resources'), // Updated
                      })),
                    })).max(5), // Limit modules in the schema as well
                  }),
                });

                console.log('generateObject call successful. Course plan data received:', coursePlanData); // Log after successful call

                // Return the result containing the full course plan
                return {
                  success: true,
                  message: "Your course plan has been generated successfully. Click below to view your course plan.",
                  showCourseButton: true,
                  courseUrl: '/course',
                  coursePlan: coursePlanData,
                };
              } catch (error) {
                console.error('--- ERROR generating course plan ---');
                if (error instanceof Error) {
                  console.error('Error Name:', error.name);
                  console.error('Error Message:', error.message);
                  console.error('Error Stack:', error.stack);
                }
                console.error('Full Error Object:', error);
                console.error('------------------------------------');
                return {
                  success: false,
                  message: "There was an error generating your course plan. Please check the server logs for details.",
                };
              }
            },
          },
          saveCoursePlan: {
            description: "Saves the finalized course plan to the user's profile after they have reviewed and approved it.",
            parameters: z.object({
              title: z.string().describe('The title of the course'),
              description: z.string().describe('A detailed description of the course'),
              learningObjectives: z.array(z.string()).optional().describe('Key learning objectives of the course'),
              totalEstimatedTime: z.string().optional().describe('Total estimated time to complete the course'),
              modules: z.array(z.object({
                id: z.string().describe('Unique identifier for the module'),
                title: z.string().describe('Title of the module'),
                description: z.string().describe('Description of what the module covers'),
                estimatedTime: z.string().describe('Estimated time to complete this module'),
                topics: z.array(z.object({
                  id: z.string().describe('Unique identifier for the topic'),
                  title: z.string().describe('Title of the topic'),
                  estimatedTime: z.string().describe('Estimated time to complete this topic'),
                  completed: z.boolean().default(false).describe('Whether this topic has been completed'),
                })),
                resources: z.array(z.object({
                  type: z.enum(['video', 'article', 'quiz']).describe('Type of resource'),
                  title: z.string().describe('Title of the resource'),
                  url: z.string().nullable().optional().describe('URL of the resource, if applicable'), // Updated
                  duration: z.string().nullable().optional().describe('Duration of video resources'),
                  estimatedReadTime: z.string().nullable().optional().describe('Estimated time to read article resources'),
                  questions: z.number().nullable().optional().describe('Number of questions for quiz resources'), // Updated
                })),
              })),
            }),
            execute: async ({ title, description, learningObjectives, totalEstimatedTime, modules }) => {
              console.log('Saving course plan:', title);
              
              if (!session.user?.id) {
                return {
                  success: false,
                  message: "You must be logged in to save a course plan.",
                };
              }
              
              try {
                // Save to database
                await saveCoursePlan({
                  userId: session.user.id,
                  title,
                  description,
                  learningObjectives,
                  totalEstimatedTime,
                  modules,
                });
                
                // Record the activity
                const { recordActivity } = await import('@/app/lib/db');
                await recordActivity('course-plan-create');
                
                // Write to the data stream to trigger a redirect
                dataStream.writeData({
                  type: 'course-plan-save',
                  content: { courseId: session.user.id }
                });
                
                return {
                  success: true,
                  message: "Your course plan has been saved successfully. You can access it from your dashboard or view it now.",
                  showCourseButton: true,
                  courseUrl: '/course',
                };
              } catch (error) {
                console.error('Error saving course plan:', error);
                return {
                  success: false,
                  message: "There was an error saving your course plan. Please try again.",
                };
              }
            },
          },
        },
        onFinish: async ({ response }) => {
          if (session.user?.id) {
            try {
              const responseMessagesWithoutIncompleteToolCalls =
                sanitizeResponseMessages(response.messages);

              await saveMessages({
                messages: responseMessagesWithoutIncompleteToolCalls.map(
                  (message) => {
                    const messageId = generateUUID();

                    if (message.role === 'assistant') {
                      dataStream.writeMessageAnnotation({
                        messageIdFromServer: messageId,
                      });
                    }

                    return {
                      id: messageId,
                      chatId: id,
                      role: message.role,
                      content: message.content,
                      createdAt: new Date(),
                    };
                  },
                ),
              });
            } catch (error) {
              console.error('Failed to save chat');
            }
          }
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'stream-text',
        },
      });

      result.mergeIntoDataStream(dataStream);
    },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
