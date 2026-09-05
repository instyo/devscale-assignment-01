import { generateCompletion } from "@anvia/core";
import z from "zod";
import { model } from "./models.js";

const RoutingSchema = z.object({
  priority: z.enum(["low", "medium", "high"]),
  reason: z.string(),
  confidenceScore: z.number(),
});

const CLASSIFICATION_INSTRUCTIONS = `
  Your task is to classify the user request to be the following priority :
  - low
  - medium
  - high

  <guidelines>
  - If you are not sure, please choose low.
  - Include the reason and confidenceScore between 0 to 1.
  </guidelines>
  `;

const userRequest =
  "Server down since 9am, whole checkout broken, customers angry";

const classifyResult = await generateCompletion({
  model,
  instructions: CLASSIFICATION_INSTRUCTIONS,
  prompt: `User request: ${userRequest}`,
  outputSchema: RoutingSchema,
});

switch (classifyResult.output.priority) {
  case "low":
    console.log(
      `Handle low priority ticket : ${JSON.stringify(classifyResult.output)}`,
    );
    break;

  case "medium":
    console.log(
      `Handle medium priority ticket : ${JSON.stringify(classifyResult.output)}`,
    );
    break;

  case "high":
    console.log(
      `Handle high priority ticket : ${JSON.stringify(classifyResult.output)}`,
    );
    break;
}
