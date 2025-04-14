# Complete Course Generator Implementation Plan

This document outlines the steps to add a feature that generates detailed, Udemy/Coursera-style course plans for users after their profile has been created.

## Overview

The goal is to:
1. After successful user profile generation, ask the user if they want a detailed course plan.
2. If confirmed, generate an initial structured course plan (topics, time estimates, resource types).
3. Allow the user to provide feedback and refine the plan iteratively through conversation.
4. Once the user approves the plan, save it to the database.
5. The saved data should support a rich UI similar to online course platforms.

**Important Note:**  
We are not going to render the courses in the chat interface. Instead, we will show a message indicating that the course has been generated. The message will include a button saying "Click here to view your course." When the user clicks the button, they will be redirected to the `/course` page where the course details will be displayed.

## Implementation Steps



### 2. Backend API (`app/(chat)/api/chat/route.ts`)

- [ ] **Define `generateInitialCoursePlan` Tool:**
    - Add `generateInitialCoursePlan` to the `AllowedTools` type.
    - Add the tool definition to the `tools` object within the `POST` function.
    - **Description:** "Generates an initial detailed course plan structure based on the user's profile and learning goals. Use this *after* the user confirms they want a detailed plan."
    - **Parameters (Zod):** Define necessary inputs, likely derived from the user's profile (e.g., `learningGoals`, `priorKnowledge`, `dailyTimeCommitment`).
    - **Execute Logic:**
        - Call the LLM (e.g., using `streamObject` or `generateObject`) with a prompt to create the structured course plan based on the input parameters and the desired schema (modules, topics, time, etc.).
        - Save the generated plan to the database.
        - Return a message indicating that the course has been generated, along with a button to view the course (e.g., `{ success: true, message: "Course generated successfully. [Click here to view your course](#)" }`).
- [ ] **Define `saveCoursePlan` Tool:**
    - Add `saveCoursePlan` to the `AllowedTools` type.
    - Add the tool definition to the `tools` object.
    - **Description:** "Saves the finalized course plan to the user's profile after they have reviewed and approved it."
    - **Parameters (Zod):** Define a schema matching the `CoursePlan` database structure (or the relevant parts needed for saving). This data will likely come from the final state of the plan maintained during the conversation.
    - **Execute Logic:**
        - Call the `saveCoursePlan` database query function from `lib/db/queries.ts` with the provided plan data and the `userId` from the session.
        - Return a success message (e.g., `{ success: true, message: "Course plan saved successfully!" }`).
- [ ] **Update Tool Lists:** Add the new tool names (`generateInitialCoursePlan`, `saveCoursePlan`) to the relevant tool group arrays (e.g., create a new `courseTools` array and add it to `allTools`) passed to the LLM.
- [ ] **Modify `userProfileGeneration` Tool (Optional but Recommended):** Consider if the *response* from the `userProfileGeneration` tool's execution should include a suggestion for the AI to ask the user about generating the course plan next. This might be better handled purely via prompting.

### 3. AI Prompt Engineering (`lib/ai/prompts.ts`)

- [ ] **Update `systemPrompt` / `domainPrompt`:**
    - Instruct the AI that *after* the `userProfileGeneration` tool successfully executes, it should ask the user if they want a detailed course plan generated for their `currentGoal`.
    - Explain the flow:
        - If user confirms, use `generateInitialCoursePlan`.
        - Present a message indicating the course has been generated, along with a button to view the course.
        - Once the user clicks the button, redirect them to the `/course` page where the course details will be displayed.
    - Add guidance on using the new tools (`generateInitialCoursePlan`, `saveCoursePlan`) in the `**Tool Usage Guide:**` section.

### 4. Frontend Implementation

- [ ] **Handle New Message Type (`useChat` hook / `chat.tsx`):**
    - Modify the message handling logic to recognize and process the new course generation success message.
    - Display the message with a button that redirects the user to the `/course` page.

### 5. Course Plan Display Page

- [ ] **Create Course Plan Page:**
    - Create a new page (e.g., `app/course/page.tsx`) to display saved course plans.
    - Implement a detailed view of the course plan with modules, topics, and resources.
    - Design with a Udemy/Coursera-like UI with sections for modules, progress tracking, and resource links.

## Schema Design Example

Here's a possible JSON structure for the `modules` field in the `CoursePlan` table:

```json
[
  {
    "id": "module-1",
    "title": "Introduction to JavaScript",
    "description": "Learn the basics of JavaScript programming",
    "estimatedTime": "5 hours",
    "topics": [
      {
        "id": "topic-1-1",
        "title": "Variables and Data Types",
        "estimatedTime": "1 hour",
        "completed": false
      },
      {
        "id": "topic-1-2",
        "title": "Functions and Scope",
        "estimatedTime": "2 hours",
        "completed": false
      }
    ],
    "resources": [
      {
        "type": "video",
        "title": "JavaScript Fundamentals",
        "url": "https://www.youtube.com/watch?v=example",
        "duration": "15 minutes"
      },
      {
        "type": "article",
        "title": "Understanding JavaScript Variables",
        "url": "https://example.com/js-variables",
        "estimatedReadTime": "10 minutes"
      },
      {
        "type": "quiz",
        "title": "JavaScript Basics Quiz",
        "questions": 10
      }
    ]
  }
]
```

## UI/UX Considerations

- Use a clean, organized layout similar to popular online course platforms.
- Implement a sidebar navigation for quick access to different modules.
- Include estimated time to complete for each section and the overall course.
- Add visual progress indicators to motivate users.
- Use consistent color coding for different resource types (videos, readings, quizzes).
- Consider adding a "continue where you left off" feature.