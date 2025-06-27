import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import 'dotenv/config';

const lookupPhoneNumber = tool(
  async ({ phoneNumber }: { phoneNumber: string }): Promise<string> => {
    /**
     * Look up phone number information using NUMVERIFY API.
     */
    console.log(`TOOL CALLED: lookupPhoneNumber(${phoneNumber})`);
    
    try {
      const apiKey = process.env.NUMVERIFY_API_KEY;
      if (!apiKey) {
        return "Error: NUMVERIFY_API_KEY environment variable is not set";
      }

      const url = `http://apilayer.net/api/validate?access_key=${apiKey}&number=${encodeURIComponent(phoneNumber)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error) {
        return `API Error: ${data.error.info || 'Unknown error'}`;
      }

      const result = {
        valid: data.valid,
        number: data.number,
        localFormat: data.local_format,
        internationalFormat: data.international_format,
        countryPrefix: data.country_prefix,
        countryCode: data.country_code,
        countryName: data.country_name,
        location: data.location,
        carrier: data.carrier,
        lineType: data.line_type
      };

      console.log('TOOL RESULT:', result);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      const errorMessage = `Error looking up phone number: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.log('TOOL ERROR:', errorMessage);
      return errorMessage;
    }
  },
  {
    name: "lookupPhoneNumber",
    description: "Look up phone number information including validity, country, carrier, and line type using NUMVERIFY API",
    schema: z.object({
      phoneNumber: z.string().describe("The phone number to look up (can include country code)"),
    }),
  }
);

async function main() {
  // Test the phone number lookup tool directly first
  console.log("=== Testing Phone Number Tool Directly ===");
  const directResult = await lookupPhoneNumber.invoke({ phoneNumber: "+1-555-123-4567" });
  console.log("Direct tool result:", directResult);

  // Create LLM with tools using Google Gemini
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    temperature: 0,
  });

  const llmWithTools = llm.bindTools([lookupPhoneNumber]);

  // Example 1: Simple phone number validation
  console.log("\n=== Example 1: Basic Phone Number Validation ===");
  const response1 = await llmWithTools.invoke([
    { role: "user", content: "Is +1-555-123-4567 a valid phone number?" }
  ]);

  console.log("AI Response:", response1.content);
  
  // Execute tool calls if any
  if (response1.tool_calls && response1.tool_calls.length > 0) {
    for (const toolCall of response1.tool_calls) {
      console.log(`Tool Call: ${toolCall.name}(${JSON.stringify(toolCall.args)})`);
      const toolResult = await lookupPhoneNumber.invoke(toolCall.args as { phoneNumber: string });
      console.log("Tool Result:", toolResult);
    }
  }

  // Example 2: Phone number information lookup
  console.log("\n=== Example 2: Phone Number Information ===");
  const response2 = await llmWithTools.invoke([
    { role: "user", content: "Can you tell me about the phone number +44 20 7946 0958?" }
  ]);

  console.log("AI Response:", response2.content);
  
  // Execute tool calls if any
  if (response2.tool_calls && response2.tool_calls.length > 0) {
    for (const toolCall of response2.tool_calls) {
      console.log(`Tool Call: ${toolCall.name}(${JSON.stringify(toolCall.args)})`);
      const toolResult = await lookupPhoneNumber.invoke(toolCall.args as { phoneNumber: string });
      console.log("Tool Result:", toolResult);
    }
  }

  // Example 3: Multiple phone number validation
  console.log("\n=== Example 3: Multiple Phone Numbers ===");
  const response3 = await llmWithTools.invoke([
    { role: "user", content: "I have these phone numbers: +1-800-555-1234 and +33 1 42 68 53 00. Can you validate them and tell me which countries they're from?" }
  ]);

  console.log("AI Response:", response3.content);
  
  // Execute tool calls if any
  if (response3.tool_calls && response3.tool_calls.length > 0) {
    for (const toolCall of response3.tool_calls) {
      console.log(`Tool Call: ${toolCall.name}(${JSON.stringify(toolCall.args)})`);
      const toolResult = await lookupPhoneNumber.invoke(toolCall.args as { phoneNumber: string });
      console.log("Tool Result:", toolResult);
    }
  }
}

// Run the main function
main().catch(console.error);