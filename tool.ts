import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";

const multiply = tool(
  ({ a, b }: { a: number; b: number }): number => {
    /**
     * Multiply two numbers.
     */
    console.log(`🔧 TOOL CALLED: multiply(${a}, ${b})`);
    const result = a * b;
    console.log(`🔧 TOOL RESULT: ${result}`);
    return result;
  },
  {
    name: "multiply",
    description: "Multiply two numbers",
    schema: z.object({
      a: z.number(),
      b: z.number(),
    }),
  }
);

// Test the tool directly first
console.log("=== Testing Tool Directly ===");
const directResult = await multiply.invoke({ a: 2, b: 3 });
console.log("Direct tool result:", directResult);

console.log(multiply.name); // multiply
console.log(multiply.description); // Multiply two numbers.

// Create LLM with tools
const llm = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0,
  // Make sure to set your OpenAI API key in environment variables
  // or pass it directly: openAIApiKey: "your-api-key"
});

// Bind the tools to the LLM
const llmWithTools = llm.bindTools([multiply]);

// Example 1: Simple tool usage
console.log("\n=== Example 1: Basic Tool Usage ===");
const response1 = await llmWithTools.invoke([
  new HumanMessage("What is 15 multiplied by 23?")
]);

console.log("AI Response:", response1.content);
console.log("Tool calls:", response1.tool_calls);

// Example 2: More complex calculation
console.log("\n=== Example 2: Complex Calculation ===");
const response2 = await llmWithTools.invoke([
  new HumanMessage("I need to calculate 42 times 17 for my math homework. Can you help?")
]);

console.log("AI Response:", response2.content);
console.log("Tool calls:", response2.tool_calls);

// Example 3: Word problem that requires multiplication
console.log("\n=== Example 3: Word Problem ===");
const response3 = await llmWithTools.invoke([
  new HumanMessage("If I have 8 boxes and each box contains 12 items, how many items do I have in total?")
]);

console.log("AI Response:", response3.content);
console.log("Tool calls:", response3.tool_calls);