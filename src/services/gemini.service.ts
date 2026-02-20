import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { VerificationResult } from '../models/verification-result.model';

interface AddressPrecomputation {
  normalizedAddress1: string;
  normalizedAddress2: string;
  levenshteinDistance: number;
}

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private genAI: GoogleGenAI;

  constructor() {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    this.genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async verifyAddresses(
    address1: string,
    address2: string,
    precomputation: AddressPrecomputation
  ): Promise<VerificationResult> {
    const model = 'gemini-2.5-flash';

    const maxLength = Math.max(precomputation.normalizedAddress1.length, precomputation.normalizedAddress2.length);
    const similarity = maxLength > 0 ? (1 - precomputation.levenshteinDistance / maxLength) * 100 : 100;

    const prompt = `
      Please analyze the following two addresses and determine if they refer to the exact same physical location.
      Consider common abbreviations (e.g., St. for Street, Ave for Avenue, Apt for Apartment, etc.) and formatting differences.
      
      Address 1: "${address1}"
      Address 2: "${address2}"

      A preliminary client-side analysis was performed with the following results:
      - Normalized Address 1 (lowercase, abbreviations expanded, punctuation removed): "${precomputation.normalizedAddress1}"
      - Normalized Address 2 (lowercase, abbreviations expanded, punctuation removed): "${precomputation.normalizedAddress2}"
      - Levenshtein distance between normalized addresses: ${precomputation.levenshteinDistance} (A lower number means more similar).
      - Calculated similarity score: ${similarity.toFixed(2)}%.

      Based on both the original addresses and this preliminary analysis, are these addresses the same? Provide your reasoning.

      Respond only with the JSON object in the specified schema.
    `;

    try {
      const response = await this.genAI.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              areSame: {
                type: Type.BOOLEAN,
                description: 'True if the addresses are the same, false otherwise.'
              },
              reasoning: {
                type: Type.STRING,
                description: 'A brief explanation for the decision.'
              }
            },
            required: ["areSame", "reasoning"]
          },
        },
      });

      const jsonString = response.text.trim();
      const result = JSON.parse(jsonString);
      
      return result as VerificationResult;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error('Failed to verify addresses. Please check the console for more details.');
    }
  }
}
