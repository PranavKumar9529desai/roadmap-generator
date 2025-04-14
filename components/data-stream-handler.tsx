'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import type { BlockKind } from './block';
import type { Suggestion } from '@/lib/db/schema';
import { initialBlockData, useBlock } from '@/hooks/use-block';
import { useUserMessageId } from '@/hooks/use-user-message-id';
import { useSWRConfig } from 'swr';
import { useRoadmap, type RoadmapEvent } from '@/contexts/RoadmapContext';
import { useRouter } from 'next/navigation';

type DataStreamDelta = {
  type:
    | 'text-delta'
    | 'code-delta'
    | 'image-delta'
    | 'title'
    | 'id'
    | 'suggestion'
    | 'clear'
    | 'finish'
    | 'user-message-id'
    | 'kind'
    | 'roadmap-creation'
    | 'course-plan-creation'
    | 'course-plan-save';
  content: string | Suggestion | RoadmapEvent[] | any;
};

export function DataStreamHandler({ id }: { id: string }) {
  const { data: dataStream } = useChat({ id });
  const { setUserMessageIdFromServer } = useUserMessageId();
  const { setBlock } = useBlock();
  const lastProcessedIndex = useRef(-1);
  const { setRoadmapData } = useRoadmap();
  const router = useRouter();

  // Store a reference to any redirects that need to happen
  const redirectRef = useRef<string | null>(null);

  const { mutate } = useSWRConfig();
  const [optimisticSuggestions, setOptimisticSuggestions] = useState<
    Array<Suggestion>
  >([]);

  useEffect(() => {
    if (optimisticSuggestions && optimisticSuggestions.length > 0) {
      const [optimisticSuggestion] = optimisticSuggestions;
      const url = `/api/suggestions?documentId=${optimisticSuggestion.documentId}`;
      mutate(url, optimisticSuggestions, false);
    }
  }, [optimisticSuggestions, mutate]);

  // Handle redirect after stream completion
  useEffect(() => {
    if (redirectRef.current) {
      const redirectUrl = redirectRef.current;
      redirectRef.current = null;
      // Small timeout to ensure UI updates before redirect
      setTimeout(() => {
        router.push(redirectUrl);
      }, 500);
    }
  }, [router]);

  useEffect(() => {
    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    (newDeltas as DataStreamDelta[]).forEach((delta: DataStreamDelta) => {
      if (delta.type === 'user-message-id') {
        setUserMessageIdFromServer(delta.content as string);
        return;
      }

      if (delta.type === 'roadmap-creation') {
        const roadmapEvents = delta.content as RoadmapEvent[];
        const roadmapTitle = "AI Generated Roadmap";
        console.log('Received roadmap events, updating context:', roadmapEvents);

        setRoadmapData(roadmapTitle, roadmapEvents);
        
        return;
      }

      if (delta.type === 'course-plan-save') {
        console.log('Course plan saved, setting redirect to /course');
        // Set the redirect URL reference
        redirectRef.current = '/course';
        return;
      }

      setBlock((draftBlock) => {
        if (!draftBlock) {
          return { ...initialBlockData, status: 'streaming' };
        }

        switch (delta.type) {
          case 'id':
            return {
              ...draftBlock,
              documentId: delta.content as string,
              status: 'streaming',
            };

          case 'title':
            return {
              ...draftBlock,
              title: delta.content as string,
              status: 'streaming',
            };

          case 'kind':
            return {
              ...draftBlock,
              kind: delta.content as BlockKind,
              status: 'streaming',
            };

          case 'text-delta':
            return {
              ...draftBlock,
              content: draftBlock.content + (delta.content as string),
              isVisible:
                draftBlock.status === 'streaming' &&
                draftBlock.content.length > 400 &&
                draftBlock.content.length < 450
                  ? true
                  : draftBlock.isVisible,
              status: 'streaming',
            };

          case 'code-delta':
            return {
              ...draftBlock,
              content: delta.content as string,
              isVisible:
                draftBlock.status === 'streaming' &&
                draftBlock.content.length > 300 &&
                draftBlock.content.length < 310
                  ? true
                  : draftBlock.isVisible,
              status: 'streaming',
            };

          case 'image-delta':
            return {
              ...draftBlock,
              content: delta.content as string,
              isVisible: true,
              status: 'streaming',
            };

          case 'suggestion':
            setTimeout(() => {
              setOptimisticSuggestions((currentSuggestions) => [
                ...currentSuggestions,
                delta.content as Suggestion,
              ]);
            }, 0);

            return draftBlock;

          case 'clear':
            return {
              ...draftBlock,
              content: '',
              status: 'streaming',
            };

          case 'finish':
            return {
              ...draftBlock,
              status: 'idle',
            };

          default:
            return draftBlock;
        }
      });
    });
  }, [dataStream, setBlock, setUserMessageIdFromServer, setRoadmapData, router]);

  return null;
}
