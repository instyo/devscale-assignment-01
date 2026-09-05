import { generateCompletion } from "@anvia/core";
import { model } from "./models.js";
import z from "zod";
import "dotenv/config";
import { Pipeline } from "@anvia/core/pipeline";

const PitchInputSchema = z.object({
  name: z.string(),
  idea: z.string(),
  monetization: z.string(),
  tech: z.array(z.string()),
});

function reviewAs(role: "ceo" | "analyst" | "cto", focus: string) {
  return new Pipeline({
    id: `review-${role}`,
    inputSchema: PitchInputSchema,
  }).step({
    id: "review",
    run: async (context) => {
      const result = await generateCompletion({
        model,
        prompt: `
        App name : ${context.input.name}
        App idea : ${context.input.idea}
        Monetization : ${context.input.monetization}
        Tech : ${context.input.tech}
        `,
        instructions: `Review as a ${role}. Focus on: ${focus}. Be concise (3-5 sentences).`,
      });

      return result.output;
    },
  });
}

const ideaReview = new Pipeline({
  id: "idea-review",
  inputSchema: PitchInputSchema,
})
  .parallel({
    id: "perspectives",
    branches: {
      ceo: reviewAs("ceo", "market fit and revenue"),
      analyst: reviewAs("analyst", "economics and risk"),
      cto: reviewAs("cto", "feasibility and tech stack"),
    },
  })
  .step({
    id: "merge",
    run: async ({ input }) => {
      const result = await generateCompletion({
        model,
        prompt: JSON.stringify(input),
        instructions:
          "Merge the three reviews into one go / no-go verdict with a short rationale.",
        outputSchema: z.object({
          verdict: z.enum(["go", "no-go"]),
          rationale: z.string(),
        }),
      });
      return result.output;
    },
  });

const result = await ideaReview.run({
  input: {
    name: "GoRide",
    idea: "Aplikasi ride hailing untuk mengantar penumpang dari titik a ke titik b, mempertemukan antara driver dan penumpang melalui aplikasi.",
    monetization: "Admin fee",
    tech: ["Flutter", "Node.js", "PostgreSQL", "Firebase"],
  },
});

console.log("Combined verdict:", result.output);
