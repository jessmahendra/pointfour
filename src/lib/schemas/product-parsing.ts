import { z } from 'zod';

// Schema for product parsing results
export const ProductParsingSchema = z.object({
  brandName: z.string().describe('The brand name extracted from the query'),
  brandWebsite: z.string().describe('The official brand website URL'),
  productName: z.string().describe('The product name extracted from the query'),
  productUrl: z.string().describe('The specific product URL on the brand website'),
  confidence: z.enum(['low', 'medium', 'high']).describe('Confidence level in the parsing accuracy')
});

export type ProductParsingResult = z.infer<typeof ProductParsingSchema>;
