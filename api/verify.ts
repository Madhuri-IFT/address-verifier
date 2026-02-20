// This is a Vercel-style Serverless Function that acts as a secure proxy.
// It should be placed in the `api` directory at the root of your project.
// After deploying, you must set your `API_KEY` as an environment variable in your Vercel project settings.

import { GoogleGenAI, Type } from '@google/genai';

// The 'Request' and 'Response' types can be imported from 'vercel' if you install the types,
// but for this simple case, we can use 'any' to keep dependencies minimal.
export default async function handler(request: any, response: any) {
  // Ensure we are only handling POST requests
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Only POST requests are allowed' });
    return;
  }
  
  // Get the API key securely from server-side environment variables
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return response.status(500).json({ error: 'API_KEY is not configured on the server.' });
  }
  
  // Get the data sent from the Angular frontend
  const { address1, address2, precomputation } = request.body;
  if (!address1 || !address2 || !precomputation) {
    return response.status(400).json({ error: 'Missing address data in the request body.' });
  }

  // Initialize Gemini AI on the server
  const genAI = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash';

  // Recreate the prompt using the data from the frontend
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
      // Call the Gemini API from the secure server environment
      const result = await genAI.models.generateContent({
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

      // FIX: The text response from the Gemini API is accessed directly via the `text` property.
      const jsonString = result.text.trim();
      const verificationResult = JSON.parse(jsonString);
      
      // Allow requests from any origin (for development). 
      // In production, you should restrict this to your website's domain for better security.
      // e.g., response.setHeader('Access-Control-Allow-Origin', 'https://your-domain.com');
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      // Send the successful result back to the Angular app
      response.status(200).json(verificationResult);

    } catch (error) {
      console.error('Error calling Gemini API from backend:', error);
      response.status(500).json({ error: 'Failed to verify addresses via the backend service.' });
    }                                                                                                                                                                                                     }