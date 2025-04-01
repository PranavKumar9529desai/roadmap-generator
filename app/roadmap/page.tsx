'use client'; // Make this a client component to use hooks

import React from "react";
import RoadmapCalendar from "./components/RoadmapCalendar";
// Import the context hook
import { useRoadmap } from '@/contexts/RoadmapContext';

// RoadmapEvent interface is now defined in the context, no need to redefine here

// const reactLearningEvents = [
//   { title: "Week 1: Fundamentals & JSX", id: "react-week1" },
//   { title: "Week 2: Components & State", id: "react-week2" },
//   { title: "Week 3: Hooks & Lifecycle", id: "react-week3" },
//   { title: "Week 4: Routing & Project", id: "react-week4" },
// ]; // Remove or comment out the hardcoded array

export default function RoadMapPage() {
  // Read events and title from the context
  const { roadmapEvents, roadmapTitle } = useRoadmap();

  // Use the context values directly
  const eventsToDisplay = roadmapEvents; // No need for ternary if context provides default []
  const generatedRoadmapTitle = roadmapTitle; // Use title from context

  return (
    <div className="p-5 dark:text-white">
      <h1 className="text-2xl font-bold mb-4 dark:text-white">
        {/* Use the title from context */} 
        {generatedRoadmapTitle}
      </h1>
      {/* Pass the events from context to the calendar */}
      <RoadmapCalendar draggableEventsList={eventsToDisplay} />
    </div>
  );
}
