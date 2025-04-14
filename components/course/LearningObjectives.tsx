import React from 'react';

interface LearningObjectivesProps {
  objectives: string[];
}

export const LearningObjectives: React.FC<LearningObjectivesProps> = ({ objectives }) => {
  if (!objectives || objectives.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Learning Objectives</h2>
      <ul className="list-disc list-inside space-y-1">
        {objectives.map((objective, index) => (
          <li key={index} className="text-zinc-700 dark:text-zinc-300">
            {objective}
          </li>
        ))}
      </ul>
    </div>
  );
};