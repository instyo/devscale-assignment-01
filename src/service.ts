import { generateCompletion } from "@anvia/core";
import { model } from "./models.js";
import z from "zod";
import "dotenv/config";

const ArticleSchema = z.object({
  article: z.string(),
});

const GENERATE_QUERY_INSTRUCTION = `
  You're an expert in company data research
  your task is to generate 5 most important queries to get following data :

  - Company Profile
  - Financial Statement (Investment, Internal Statement)
  - Company Employees
  - Sectors
  - Valuations
  `;

export async function generateQueries(companyName: string) {
  const result = await generateCompletion({
    model,
    instructions: GENERATE_QUERY_INSTRUCTION,
    prompt: `Generate queries of ${companyName}`,
    outputSchema: ArticleSchema,
  });

  return result.output;
}
