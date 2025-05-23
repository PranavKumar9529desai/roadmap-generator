import {
  type DataStreamWriter,
  experimental_generateImage,
  smoothStream,
  streamObject,
  streamText,
  tool,
} from 'ai';
import type { Model } from '../models';
import type { Session } from 'next-auth';
import { z } from 'zod';
import { getDocumentById, saveDocument } from '@/lib/db/queries';
import { customModel, imageGenerationModel } from '..';

interface UpdateDocumentProps {
  model: Model;
  session: Session;
  dataStream: DataStreamWriter;
}

export const updateDocument = ({
  model,
  session,
  dataStream,
}: UpdateDocumentProps) =>
  tool({
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
          system:
            'You are tasked with updating a document based on the provided prompt. Preserve the formatting and structure of the original document.',
          prompt: `Instructions: ${description}

Document:
${currentContent}`,
          experimental_transform: smoothStream({ chunking: 'word' }),
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
          system:
            'You are tasked with updating a document based on the provided prompt. Preserve the formatting and structure of the original document.',
          prompt: `Instructions: ${description}

Code:
${currentContent}`,
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
  });
