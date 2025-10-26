'use server';

/**
 * @fileOverview Summarizes transporter complaints for restaurant users.
 *
 * - summarizeComplaint - A function that summarizes the transporter complaint.
 * - SummarizeComplaintInput - The input type for the summarizeComplaint function.
 * - SummarizeComplaintOutput - The return type for the summarizeComplaint function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeComplaintInputSchema = z.object({
  complaintText: z
    .string()
    .describe('The text of the transporter complaint.'),
});
export type SummarizeComplaintInput = z.infer<typeof SummarizeComplaintInputSchema>;

const SummarizeComplaintOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the transporter complaint.'),
  relevantDetails: z.string().describe('Extracted relevant details from the complaint.'),
});
export type SummarizeComplaintOutput = z.infer<typeof SummarizeComplaintOutputSchema>;

export async function summarizeComplaint(input: SummarizeComplaintInput): Promise<SummarizeComplaintOutput> {
  return summarizeComplaintFlow(input);
}

const summarizeComplaintPrompt = ai.definePrompt({
  name: 'summarizeComplaintPrompt',
  input: {schema: SummarizeComplaintInputSchema},
  output: {schema: SummarizeComplaintOutputSchema},
  prompt: `You are an AI assistant helping restaurants understand transporter complaints.

  Summarize the following complaint text, extracting relevant details that would help the restaurant decide on a course of action. Focus on key issues raised by the transporter.

  Complaint Text: {{{complaintText}}}
  \nOutput summary and relevant details in the output schema provided to you.`,
});

const summarizeComplaintFlow = ai.defineFlow(
  {
    name: 'summarizeComplaintFlow',
    inputSchema: SummarizeComplaintInputSchema,
    outputSchema: SummarizeComplaintOutputSchema,
  },
  async input => {
    const {output} = await summarizeComplaintPrompt(input);
    return output!;
  }
);
