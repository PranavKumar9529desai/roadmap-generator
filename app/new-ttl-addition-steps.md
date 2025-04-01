# Steps to Add a New LLM Tool

This guide outlines the necessary steps to add a new tool that the Large Language Model (LLM) can invoke within the Vercel AI Chatbot application, potentially interacting with the Blocks UI.

Let's assume we want to add a new tool called `analyzeSentiment`.

## 1. Define the Tool in the Backend API

The core definition of the tool, including its purpose, parameters, and execution logic, resides in the main chat API route.

- **File:** `app/(chat)/api/chat/route.ts`
- **Action:** Locate the `tools` object within the `streamText` call (around line 109). Add a new key-value pair for your tool.

```typescript
// ... inside streamText call ...
tools: {
  getWeather: { /* ... existing tool ... */ },
  createDocument: { /* ... existing tool ... */ },
  updateDocument: { /* ... existing tool ... */ },
  requestSuggestions: { /* ... existing tool ... */ },

  // --- Add your new tool definition here ---
  analyzeSentiment: {
    // Description for the LLM: Explain what the tool does and when to use it.
    description: 'Analyzes the sentiment (positive, negative, neutral) of a given text or document.',
    // Parameters: Define the inputs the tool needs using Zod.
    parameters: z.object({
      textToAnalyze: z.string().describe('The text content whose sentiment needs to be analyzed.'),
      // Optional: Add other parameters like documentId if analyzing an existing block
      // documentId: z.string().optional().describe('The ID of the document to analyze, if applicable.'),
    }),
    // Execute Function: The code that runs when the tool is called.
    execute: async ({ textToAnalyze /*, documentId */ }) => {
      console.log(`Analyzing sentiment for: ${textToAnalyze}`);
      // --- Add your sentiment analysis logic here ---
      // This could involve calling another API, running a local model, etc.
      const sentimentResult = 'positive'; // Replace with actual analysis result

      // --- Optional: Use dataStream for real-time UI updates ---
      // If you need to update the Blocks UI or send data back mid-execution:
      // dataStream.writeData({ type: 'sentiment-result', content: sentimentResult });

      // Return the final result that will be sent back to the LLM
      return {
        sentiment: sentimentResult,
        message: `Sentiment analysis complete. Result: ${sentimentResult}`,
      };
    },
  },
  // --- End of new tool definition ---

},
// ... rest of streamText options ...
```

## 2. Make the Tool "Active"

Ensure the LLM knows this tool is available for the current request.

- **File:** `app/(chat)/api/chat/route.ts`
- **Action:** Add the name of your new tool (`'analyzeSentiment'`) to the array passed to `experimental_activeTools` (around line 108). If you are organizing tools into groups (like `blocksTools`, `weatherTools` near line 52), add it to the relevant group or create a new one and include it in `allTools`.

```typescript
// Example: Adding to a hypothetical 'analysisTools' group
const analysisTools: AllowedTools[] = ['analyzeSentiment'];
const allTools: AllowedTools[] = [...blocksTools, ...weatherTools, ...analysisTools]; // Add the new group

// ... later in streamText ...
experimental_activeTools: allTools,
// ...
```

## 3. Update Prompt Guidance (Recommended)

Help the LLM understand _when_ to use your new tool compared to others.

- **File:** `lib/ai/prompts.ts`
- **Action:** Modify the system prompt (e.g., `systemPrompt` which might include `blocksPrompt`) to include instructions or examples for your new tool.

```typescript
// Example modification within a system prompt string:
export const systemPrompt = `
You are a helpful assistant.
${blocksPrompt} // Include existing prompts

**Tool Usage Guide:**
- Use 'getWeather' for weather forecasts.
- Use 'createDocument' for creating new content in blocks.
- Use 'updateDocument' for editing existing block content.
- Use 'requestSuggestions' to get editing ideas for a document.
- Use 'analyzeSentiment' when asked to determine the sentiment of a piece of text. // <-- Add guidance for the new tool

// ... rest of the prompt ...
`;
```

## 4. Handle Tool Invocation and Results (Frontend)

If your tool just returns data to the LLM for its response, you might not need frontend changes. However, if you want to display specific UI elements for the tool call or its results (like the document placeholders), you'll need to update the frontend.

- **File:** `components/message.tsx`

  - **Action:** Inside the `PurePreviewMessage` component, locate the section rendering `toolInvocations` (around line 160). Add a case to handle your new tool's name (`analyzeSentiment`). You might render a specific component to show the tool is running or display its results.

  ```typescript
  // ... inside the map over message.toolInvocations ...
  if (state === "result") {
    const { result } = toolInvocation;
    return (
      <div key={toolCallId}>
        {toolName === "getWeather" ? (
          <Weather weatherAtLocation={result} />
        ) : toolName === "createDocument" ? (
          <DocumentPreview /* ... */ />
        ) : toolName === "updateDocument" ? (
          <DocumentToolResult type="update" /* ... */ />
        ) : toolName === "requestSuggestions" ? (
          <DocumentToolResult type="request-suggestions" /* ... */ />
        ) : // --- Add case for your new tool ---
        toolName === "analyzeSentiment" ? (
          // Render a custom component or simple display for the result
          <div>Sentiment Analysis Result: {JSON.stringify(result)}</div>
        ) : (
          // --- End of new tool case ---
          <pre>{JSON.stringify(result, null, 2)}</pre>
        )}
      </div>
    );
  }

  if (state === "running") {
    // Optionally handle the 'running' state specifically for your tool
    if (toolName === "analyzeSentiment") {
      return <div key={toolCallId}>Analyzing sentiment...</div>;
    }
    // Default handling for other running tools
  }
  // ...
  ```

- **File:** `components/data-stream-handler.tsx` (Optional)

  - **Action:** If your tool's `execute` function uses `dataStream.writeData` to send custom real-time updates (like intermediate sentiment scores), you need to handle these new data `type`s here. Define the new type in `DataStreamDelta` and add logic within the `useEffect` hook to process it, potentially updating the `useBlock` state or other UI states.

  ```typescript
  // Add new type
  type DataStreamDelta = {
    type:
      | 'text-delta'
      // ... other types
      | 'sentiment-result' // <-- Add your new stream type
      | 'kind';
    content: string | Suggestion | /* Add your result type if complex */;
  };

  // Inside useEffect processing newDeltas
  newDeltas.forEach((delta) => {
    const { type, content } = delta as DataStreamDelta;
    // ... existing switch cases ...
    switch (type) {
      // ...
      case 'sentiment-result':
        console.log('Received sentiment update:', content);
        // Update relevant state, e.g., setBlock(...) if related to a block
        break;
      // ...
    }
  });
  ```

By following these steps, you can integrate new capabilities into the LLM's repertoire within the chatbot application. Remember to tailor the descriptions, parameters, execution logic, and frontend handling to the specific needs of your new tool.
