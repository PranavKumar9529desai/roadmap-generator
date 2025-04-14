import React from 'react';
import type { CoursePlan } from '@/lib/db/schema';

interface CoursePlanHeaderProps {
  coursePlan: CoursePlan;
}

export const CoursePlanHeader: React.FC<CoursePlanHeaderProps> = ({ coursePlan }) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-2">{coursePlan.title}</h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4">
        {coursePlan.description}
      </p>
      {coursePlan.totalEstimatedTime && (
        <div className="text-sm bg-zinc-100 dark:bg-zinc-800 p-2 inline-block rounded-md">
          ⏱️ Total estimated time: {coursePlan.totalEstimatedTime}
        </div>
      )}
    </div>
  );
};