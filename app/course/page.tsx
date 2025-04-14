'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { CoursePlan } from '@/lib/db/schema';
import { CoursePlanHeader } from '@/components/course/CoursePlanHeader';
import { LearningObjectives } from '@/components/course/LearningObjectives';
import { ModulesList } from '@/components/course/ModulesList';

export default function CoursePage() {
  const [coursePlans, setCoursePlans] = useState<CoursePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<CoursePlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoursePlans = async () => {
      setLoading(true); // Start loading
      try {
        // Fetch course plans from the API endpoint
        const response = await fetch('/api/course-plans');

        if (!response.ok) {
          throw new Error(`Failed to fetch course plans: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.coursePlans) {
          setCoursePlans(data.coursePlans);
          if (data.coursePlans.length > 0) {
            setSelectedPlan(data.coursePlans[0]); // Select the first plan by default
          }
        } else {
          setCoursePlans([]); // Ensure it's an empty array if no plans found
        }
      } catch (error) {
        console.error('Error fetching course plans:', error);
        // Optionally set an error state here to display to the user
      } finally {
        setLoading(false); // Stop loading regardless of outcome
      }
    };

    fetchCoursePlans();
  }, []);

  // Course plan selector component - shown when user has multiple plans
  const CoursePlanSelector = () => {
    if (coursePlans.length <= 1) return null;
    
    return (
      <div className="mb-6">
        <label htmlFor="course-plan-select" className="block text-sm font-medium mb-2">
          Select Course Plan
        </label>
        <select
          id="course-plan-select"
          className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md p-2 w-full max-w-md"
          value={selectedPlan?.id}
          onChange={(e) => {
            const selected = coursePlans.find(plan => plan.id === e.target.value);
            if (selected) setSelectedPlan(selected);
          }}
        >
          {coursePlans.map(plan => (
            <option key={plan.id} value={plan.id}>
              {plan.title}
            </option>
          ))}
        </select>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-4"></div>
          <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-md animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (coursePlans.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-8 border border-zinc-200 dark:border-zinc-800">
          <h1 className="text-2xl font-bold mb-4">No Course Plans Found</h1>
          <p className="mb-6 text-zinc-600 dark:text-zinc-400">
            You don&apos;t have any course plans yet. Chat with the assistant to create
            one!
          </p>
          <Button 
            onClick={() => (window.location.href = '/')}
            size="lg"
            className="px-6"
          >
            Chat with Assistant
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <CoursePlanSelector />
        
        {selectedPlan ? (
          <>
            <CoursePlanHeader coursePlan={selectedPlan} />
            <LearningObjectives objectives={selectedPlan.learningObjectives || []} />
            <ModulesList coursePlan={selectedPlan} />
          </>
        ) : (
          <div className="text-center p-8 bg-zinc-50 dark:bg-zinc-900 rounded-md">
            <p>No course plan selected.</p>
          </div>
        )}
      </div>
    </div>
  );
}
