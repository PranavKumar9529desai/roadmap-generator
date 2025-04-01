'use client';

import React, {
  createContext,
  useState,
  useContext,
  type ReactNode,
} from 'react';

// Define the shape of a roadmap event
export interface RoadmapEvent {
  id: string;
  title: string;
}

// Define the shape of the context state
interface RoadmapContextState {
  roadmapEvents: RoadmapEvent[];
  roadmapTitle: string;
  hasRoadmap: boolean;
  setRoadmapData: (title: string, events: RoadmapEvent[]) => void;
}

// Create the context with a default value (can be undefined or null, handled in consumer)
const RoadmapContext = createContext<RoadmapContextState | undefined>(
  undefined,
);

// Define the props for the provider
interface RoadmapProviderProps {
  children: ReactNode;
}

// Create the provider component
export const RoadmapProvider: React.FC<RoadmapProviderProps> = ({
  children,
}) => {
  const [roadmapEvents, setRoadmapEvents] = useState<RoadmapEvent[]>([]);
  const [roadmapTitle, setRoadmapTitle] = useState<string>('Generated Roadmap'); // Default title
  const [hasRoadmap, setHasRoadmap] = useState<boolean>(false);

  // Function to update both title and events
  const setRoadmapData = (title: string, events: RoadmapEvent[]) => {
    setRoadmapTitle(title);
    setRoadmapEvents(events);
    setHasRoadmap(true);
  };

  // Value provided by the context
  const value = {
    roadmapEvents,
    roadmapTitle,
    hasRoadmap,
    setRoadmapData,
  };

  return (
    <RoadmapContext.Provider value={value}>{children}</RoadmapContext.Provider>
  );
};

// Custom hook to use the RoadmapContext
export const useRoadmap = (): RoadmapContextState => {
  const context = useContext(RoadmapContext);
  if (context === undefined) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  return context;
};
