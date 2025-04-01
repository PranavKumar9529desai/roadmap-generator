'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useRoadmap } from '@/contexts/RoadmapContext';
import { Button } from './ui/button';

export const RoadmapButton = () => {
  const { hasRoadmap } = useRoadmap();
  const router = useRouter();

  if (!hasRoadmap) {
    return null;
  }

  return (
    <div className="flex justify-center my-4">
      <Button
        onClick={() => router.push('/roadmap')}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-map"
        >
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
          <line x1="9" x2="9" y1="3" y2="18" />
          <line x1="15" x2="15" y1="6" y2="21" />
        </svg>
        <span>View Your Learning Roadmap</span>
      </Button>
    </div>
  );
};

export default RoadmapButton;
