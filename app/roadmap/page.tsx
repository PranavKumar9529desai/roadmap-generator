import React from "react";
import RoadmapCalendar from "./components/RoadmapCalendar";

// Define the specific draggable events for this page

const reactLearningEvents = [
  { title: "Week 1: Fundamentals & JSX", id: "react-week1" },
  { title: "Week 2: Components & State", id: "react-week2" },
  { title: "Week 3: Hooks & Lifecycle", id: "react-week3" },
  { title: "Week 4: Routing & Project", id: "react-week4" },
];

export default async function RoadMapPage() {
  // const { learningEvents, projectTitle } = await fetch(
  //   "https://api.example.com/learning-events"
  // ).then((res) => res.json());

  return (
    <div className="p-5 dark:text-white">
      <h1 className="text-2xl font-bold mb-4 dark:text-white">
        Project Roadmap: Learning React in 30 days.
      </h1>
      <RoadmapCalendar draggableEventsList={reactLearningEvents} />
    </div>
  );
}
