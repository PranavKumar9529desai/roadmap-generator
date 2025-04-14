# Course Recommender Chatbot & Dashboard Implementation Plan

## Overview
This document outlines the steps needed to implement the course recommendation chatbot with user profile creation and a dashboard view. The chatbot will collect user information, save it to the database, and provide a way to view the profile on a dashboard.

## Current State Analysis
- [x] IndexedDB database structure is already set up with UserProfile and UserActivity tables
- [x] Helper functions for user profile data storage and retrieval exist
- [x] Dashboard page component is implemented but needs proper data flow
- [x] Domain prompt for the chatbot exists but needs simplification
- [x] Roadmap generation functionality exists
- [x] User profile generation tool exists but may need adjustments

## Implementation Steps

### 1. Improve the Chatbot Prompt
- [x] Current prompt is too complex
- [ ] Simplify prompts.ts to focus on course recommendation
- [ ] Update the domain prompt to clearly ask for:
  - Name
  - Education background
  - Current field of study
  - Learning goals/topics
  - Available time per day
  - Prior knowledge assessment

### 2. Enable User Profile Storage
- [x] Database schema for UserProfile exists in app/lib/db.ts
- [x] Functions to save and retrieve user profile data exist
- [ ] Ensure the userProfileGeneration tool is properly invoked when profile information is collected

### 3. Create "View Profile" Button After Data Submission
- [ ] Add code to show a success message after profile creation
- [ ] Add "View Profile" button after successful profile creation
- [ ] Add redirect functionality to /dashboard page

### 4. Update Dashboard Page
- [x] Dashboard page component exists
- [x] Activity tracking functionality exists
- [x] Profile data display UI exists
- [ ] Ensure profile data is properly fetched and displayed

## Detailed Tasks

### Task 1: Simplify Chat Prompt
1. [ ] Update lib/ai/prompts.ts with simplified domain prompt
2. [ ] Ensure the prompt guides the chatbot to collect all required user information
3. [ ] Update the systemPrompt to ensure proper tool usage

### Task 2: Fine-tune Profile Generation
1. [ ] Review the userProfileGeneration tool implementation
2. [ ] Ensure it properly captures all required profile fields
3. [ ] Add more explicit validation before profile generation

### Task 3: Add View Profile Functionality
1. [ ] Modify the chatbot response after profile creation to include a button or link
2. [ ] Add navigation code to redirect to the dashboard page

### Task 4: Complete Dashboard Integration
1. [ ] Review and update the dashboard page component if needed
2. [ ] Ensure proper data fetching and error handling
3. [ ] Test the entire flow from conversation to dashboard view

## Implementation Plan
1. First, update prompts.ts with simplified prompt
2. Then verify the userProfileGeneration tool in app/(chat)/api/chat/route.ts 
3. Add the success message and view profile button in the chatbot UI
4. Verify dashboard data retrieval and display

## Notes
- The database is using IndexedDB with a fallback to in-memory storage
- User activity is automatically tracked with recordActivity() function
- The dashboard has activity visualization similar to GitHub's contribution graph