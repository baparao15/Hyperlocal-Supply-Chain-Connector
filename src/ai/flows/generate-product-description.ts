'use server';

/**
 * @fileOverview A product description generator for farmers.
 *
 * - generateProductDescription - A function that generates a product description.
 * - GenerateProductDescriptionInput - The input type for the generateProductDescription function.
 * - GenerateProductDescriptionOutput - The return type for the generateProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductDescriptionInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of the crop, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  voiceDescription: z.string().describe('The voice description of the crop.'),
  cropType: z.string().describe('The type of crop.'),
  farmerLocation: z.string().describe('The location of the farmer.'),
});
export type GenerateProductDescriptionInput = z.infer<
  typeof GenerateProductDescriptionInputSchema
>;

const GenerateProductDescriptionOutputSchema = z.object({
  productDescription: z.string().describe('The generated product description.'),
});
export type GenerateProductDescriptionOutput = z.infer<
  typeof GenerateProductDescriptionOutputSchema
>;

export async function generateProductDescription(
  input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: {schema: GenerateProductDescriptionInputSchema},
  output: {schema: GenerateProductDescriptionOutputSchema},
  prompt: `You are an expert agricultural marketing copywriter. A farmer will provide you with an image and voice description of their crop, as well as its type and their location. Your job is to generate a compelling product description that will attract buyers.

Crop Type: {{{cropType}}}
Farmer Location: {{{farmerLocation}}}
Voice Description: {{{voiceDescription}}}
Image: {{media url=imageDataUri}}

Write a product description that is no more than 200 words. Focus on the freshness, quality, and origin of the crop. Make it sound appealing to restaurant owners looking for fresh produce.`,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
