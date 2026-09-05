import { generateCompletion } from "@anvia/core";
import { model } from "./models.js";
import z from "zod";
import "dotenv/config";
import { Pipeline } from "@anvia/core/pipeline";
import { Studio } from "@anvia/studio";

const ArticleInputSchema = z.object({
  topic: z.string(),
  language: z.string(),
});

const ArticleSchema = z.object({
  content: z.string(),
});

const CritiqueSchema = z.object({
  points: z.array(z.string()),
});

// 1. Generate draft
// 2. Critique draft
// 3. Rewrite draft

async function generateDraft(topic: string, language: string) {
  const DRAFT_INSTRUCTIONS = `You are professional article writer that writes article in ${language}.`;

  const result = await generateCompletion({
    model,
    instructions: DRAFT_INSTRUCTIONS,
    prompt: `Write 500 words article about ${topic}`,
    outputSchema: ArticleSchema,
  });

  return result.output;
}

async function critiqueDraft(content: string) {
  const CRITIQUE_INSTRUCTIONS = `You are a professional editor. Critique the draft only, do not rewrite it.
  Cover clarity, structure, tone, and weak spots. Give concrete, actionable feedback in short bullets.`;

  const result = await generateCompletion({
    model,
    instructions: CRITIQUE_INSTRUCTIONS,
    prompt: `Critique this article : ${content}`,
    outputSchema: CritiqueSchema,
  });

  return result.output;
}

async function rewriteArticle(content: string, points: string[]) {
  const REWRITE_INSTRUCTIONS = `You are a rewrite specialist. Improve the draft using the critique.
  Keep the original intent. Apply every actionable point. Output only the revised article, no commentary.`;

  const result = await generateCompletion({
    model,
    instructions: REWRITE_INSTRUCTIONS,
    prompt: `Rewrite this article ${content} based on this critique : ${JSON.stringify(points)}`,
    outputSchema: ArticleSchema,
  });

  return result.output;
}

const refineArticle = new Pipeline({
  id: "refine-article",
  inputSchema: ArticleInputSchema,
})
  .step({
    id: "generate-draft",
    run: async (context) => {
      const topic = context.input.topic;
      const language = context.input.language;
      const result = await generateDraft(topic, language);
      return result;
    },
  })
  .step({
    id: "critique-draft",
    run: async (context) => {
      const content = context.input.content;
      const points = await critiqueDraft(content);
      return { content, points };
    },
  })
  .step({
    id: "rewrite-draft",
    run: async (context) => {
      const content = context.input.content;
      const points = context.input.points.points;
      const result = await rewriteArticle(content, points);
      return result;
    },
  });

new Studio([refineArticle]).start();
