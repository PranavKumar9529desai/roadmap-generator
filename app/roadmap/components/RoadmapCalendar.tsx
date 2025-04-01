'use client';

import React, { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import type { EventInput } from '@fullcalendar/core';

// Define the shape of a draggable event item
interface DraggableEventItem {
  title: string;
  id: string;
}

interface RoadmapCalendarProps {
  initialCalendarEvents?: EventInput[]; // Renamed for clarity
  draggableEventsList?: DraggableEventItem[]; // Added prop for draggable events
}

// Removed the hardcoded initialDraggableEvents constant
// const initialDraggableEvents = [
//   { title: 'Research AI Trends', id: 'event1' },
//   { title: 'Develop Chatbot Prototype', id: 'event2' },
//   { title: 'User Testing Phase 1', id: 'event3' },
//   { title: 'Refine UI/UX', id: 'event4' },
//   { title: 'Prepare Launch Strategy', id: 'event5' },
// ];

const RoadmapCalendar: React.FC<RoadmapCalendarProps> = ({
  initialCalendarEvents = [], // Use the renamed prop
  draggableEventsList = [], // Use the new prop with a default value
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const draggableContainerRef = useRef<HTMLDivElement>(null);
  // State for the list of draggable events, initialized from props
  const [draggableEvents, setDraggableEvents] = useState(draggableEventsList);

  // Update draggableEvents state if the prop changes
  useEffect(() => {
    setDraggableEvents(draggableEventsList);
  }, [draggableEventsList]);

  useEffect(() => {
    let draggable: Draggable | null = null;
    if (draggableContainerRef.current) {
      draggable = new Draggable(draggableContainerRef.current, {
        itemSelector: '.draggable-event',
        eventData: (eventEl) => ({
          title: eventEl.innerText.trim(),
          id:
            eventEl.getAttribute('data-event-id') ||
            Math.random().toString(36).substring(7),
          create: true, // Ensure eventReceive callback fires
        }),
      });

      // Cleanup function to destroy the draggable instance
      return () => {
        if (draggable) { // Check if draggable was initialized
           draggable.destroy();
        }
      };
    }
    // The Draggable instance doesn't need to be re-created when the list items change,
    // only when the container ref itself changes.
  }, []);

  const handleEventReceive = (info: any) => {
    console.log('Event received:', info.event);
    // Remove the event from the draggable list state by its ID
    setDraggableEvents(prevEvents => prevEvents.filter(event => event.id !== info.event.id));

    // Here you could potentially update your backend or state
    // with the new event added to the calendar.
  };

  const handleDrop = (info: any) => {
    console.log('Dropped on date:', info.dateStr);
    // You can access the dragged element via info.draggedEl
    console.log('Dragged element:', info.draggedEl);
    // Check if you want to remove the original draggable element after drop
    // if (document.getElementById('remove-after-drop')?.checked) {
    //   info.draggedEl.parentNode.removeChild(info.draggedEl);
    // }
  };

  return (
    // Add Tailwind dark mode classes
    <div className="flex gap-5 dark:text-white">
      <div
        ref={draggableContainerRef}
        id="external-events"
        // Add Tailwind dark mode classes and adjust styling
        className="w-52 border border-gray-300 dark:border-gray-600 p-3 rounded dark:bg-gray-800"
        // style={{ width: '200px', border: '1px solid #ccc', padding: '10px' }}
      >
        <p className="font-semibold mb-2">
          <strong>Draggable Events</strong>
        </p>
        {/* Render from state */}
        {draggableEvents.map((event) => (
          <div
            // Add overflow handling classes
            className="draggable-event fc-event fc-h-event fc-daygrid-event fc-daygrid-block-event mb-1 p-1.5 rounded bg-gray-200 dark:bg-gray-700 cursor-pointer hover:opacity-80 overflow-hidden text-ellipsis whitespace-nowrap"
            key={event.id}
            data-event-id={event.id}
            title={event.title} // Add title attribute to show full text on hover
          >
            {event.title}
          </div>
        ))}
        {draggableEvents.length === 0 && (
           <p className="text-sm text-gray-500 dark:text-gray-400">No events left to drag.</p>
        )}
        {/* <p>
          <input type='checkbox' id='remove-after-drop' />
          <label htmlFor='remove-after-drop'>remove after drop</label>
        </p> */}
      </div>
      {/* Add Tailwind dark mode classes */}
      <div className="grow dark:bg-gray-900 p-4 rounded"> {/* Added padding and bg */}
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,dayGridDay',
          }}
          editable={true} // Allows dragging events already on the calendar
          droppable={true} // Allows external elements to be dropped
          events={initialCalendarEvents}
          eventReceive={handleEventReceive} // Called when an external event is dropped
          drop={handleDrop} // Called when any draggable is dropped (external or internal)
        />
      </div>
    </div>
  );
};

export default RoadmapCalendar;
