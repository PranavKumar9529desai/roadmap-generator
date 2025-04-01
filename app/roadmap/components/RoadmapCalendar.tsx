'use client';

import React, { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import type { EventInput } from '@fullcalendar/core';
import { db, type PlacedEvent } from '../../lib/db'; // Import db and PlacedEvent
import { useLiveQuery } from 'dexie-react-hooks'; // Import useLiveQuery for reactivity

// Define the shape of a draggable event item
interface DraggableEventItem {
  title: string;
  id: string;
}

interface RoadmapCalendarProps {
  // initialCalendarEvents prop is no longer needed as we fetch from DB
  draggableEventsList?: DraggableEventItem[]; // Keep prop for initial draggable list
}

// Removed the hardcoded initialDraggableEvents constant

const RoadmapCalendar: React.FC<RoadmapCalendarProps> = ({
  draggableEventsList = [], // Use the new prop with a default value
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const draggableContainerRef = useRef<HTMLDivElement>(null);

  // Fetch placed events live from IndexedDB
  const placedEvents = useLiveQuery(() => db.placedEvents.toArray(), []);

  // State for the list of draggable events, filtered based on placed events
  const [draggableEvents, setDraggableEvents] = useState<DraggableEventItem[]>([]);

  // State for events currently on the calendar
  const [calendarEvents, setCalendarEvents] = useState<EventInput[]>([]);

  // Effect to initialize draggable and calendar events based on DB and props
  useEffect(() => {
    if (placedEvents) { // Check if placedEvents data is loaded
      // Populate calendar events from placedEvents
      const initialCalendarEvents = placedEvents.map((event: PlacedEvent) => ({
        id: event.id,
        title: event.title,
        start: event.start ?? undefined, // Convert null/undefined to undefined
        end: event.end ?? undefined,   // Convert null/undefined to undefined
        allDay: true // Explicitly mark as an all-day event
      }));
      setCalendarEvents(initialCalendarEvents);

      // Filter draggable events: only show those NOT in placedEvents
      const placedEventIds = new Set(placedEvents.map((e: PlacedEvent) => e.id));
      const filteredDraggable = draggableEventsList.filter(
        event => !placedEventIds.has(event.id)
      );
      setDraggableEvents(filteredDraggable);
    }
  }, [placedEvents, draggableEventsList]); // Rerun when placedEvents or the prop list changes

  // Existing useEffect for setting up Draggable
  useEffect(() => {
    let draggable: Draggable | null = null;
    if (draggableContainerRef.current) {
      draggable = new Draggable(draggableContainerRef.current, {
        itemSelector: '.draggable-event',
        eventData: (eventEl) => ({
          title: eventEl.innerText.trim(),
          id: eventEl.getAttribute('data-event-id') || '', // Ensure ID is passed
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
  }, []); // Dependency array is empty as Draggable setup doesn't depend on state/props changing

  // Handle event drop FROM external list TO calendar
  const handleEventReceive = async (info: any) => {
    console.log('Event received:', info.event);
    const { id, title, start, end } = info.event;

    // Prevent adding if ID is somehow missing (safety check)
    if (!id) {
      console.error("Received event without an ID, cannot save.");
      info.revert(); // Revert the drop
      return;
    }

    const newPlacedEvent: PlacedEvent = { id, title, start, end };

    try {
      // Check if event already exists (e.g., rapid clicking/dropping)
      const existing = await db.placedEvents.get(id);
      if (existing) {
          console.log("Event already exists in DB, likely a duplicate drop. Ignoring.");
          // Optionally update if needed, but put usually handles upsert
          // await db.placedEvents.update(id, { start, end });
          return; // Exit if already processed
      }

      await db.placedEvents.put(newPlacedEvent); // Add/update in IndexedDB
      console.log('Event saved to IndexedDB:', newPlacedEvent);
      // useLiveQuery handles state updates, no manual set needed here
    } catch (error) {
      console.error("Failed to save event to IndexedDB:", error);
      info.revert(); // Revert the drop on error
      // Optional: Notify user
    }
  };


  // Handle event drop WHEN dragging WITHIN the calendar
  const handleEventDrop = async (info: any) => {
    console.log('Event dropped (internal):', info.event);
    const { id, start, end } = info.event; // Title isn't needed for update usually

     try {
      await db.placedEvents.update(id, { start, end }); // Update start/end dates
      console.log('Event updated in IndexedDB:', { id, start, end });
       // useLiveQuery handles state updates
    } catch (error) {
      console.error("Failed to update event in IndexedDB:", error);
      info.revert(); // Revert the move on error
    }
  };

  // Handle clicking an event ON the calendar to remove it
  const handleEventClick = async (info: any) => {
    console.log('Event clicked:', info.event);
    const { id, title } = info.event;

    // Confirm before deleting
    if (confirm(`Are you sure you want to remove "${title}" from the calendar? This will make it available to drag again.`)) {
       try {
         await db.placedEvents.delete(id); // Remove from IndexedDB
         console.log('Event removed from IndexedDB:', id);
         // useLiveQuery handles state updates, removing from calendar and adding back to draggable list via the main useEffect
       } catch (error) {
          console.error("Failed to remove event from IndexedDB:", error);
          // Optional: Notify user
       }
    }
  };


  // Removed the unused handleDrop function

  return (
    // Add Tailwind dark mode classes
    <div className="flex gap-5 dark:text-white">
      <div
        ref={draggableContainerRef}
        id="external-events"
        // Add Tailwind dark mode classes and adjust styling
        className="w-52 border border-gray-300 dark:border-gray-600 p-3 rounded dark:bg-gray-800"
      >
        <p className="font-semibold mb-2">
          <strong>Draggable Events</strong>
        </p>
        {/* Render from state */}
        {draggableEvents.map((event) => (
          <div
            // Add overflow handling classes
            className="draggable-event fc-event fc-h-event fc-daygrid-event fc-daygrid-block-event mb-1 p-1.5 rounded bg-gray-200 dark:bg-gray-700 cursor-pointer hover:opacity-80 truncate"
            key={event.id}
            data-event-id={event.id}
            title={event.title} // Add title attribute to show full text on hover
          >
            {event.title}
          </div>
        ))}
        {/* Update empty state message */}
        {draggableEvents.length === 0 && placedEvents && placedEvents.length > 0 && (
           <p className="text-sm text-gray-500 dark:text-gray-400">All events placed.</p>
        )}
        {/* Initial loading state or if no events passed */}
         {draggableEvents.length === 0 && (!placedEvents || placedEvents.length === 0) && draggableEventsList.length > 0 && (
           <p className="text-sm text-gray-500 dark:text-gray-400">Loading events...</p>
        )}
         {draggableEventsList.length === 0 && (!placedEvents || placedEvents.length === 0) && (
           <p className="text-sm text-gray-500 dark:text-gray-400">No events defined.</p>
        )}

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
          events={calendarEvents} // Use state for calendar events
          eventReceive={handleEventReceive} // Called when an external event is dropped
          eventDrop={handleEventDrop}       // Called when an internal event is moved
          eventClick={handleEventClick}     // Handle click to remove
         // Removed drop={handleDrop}
        />
      </div>
    </div>
  );
};

export default RoadmapCalendar;
