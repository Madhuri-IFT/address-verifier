import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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
  // Fix: Explicitly type `http` as `HttpClient` to resolve type inference issues.
  // This ensures `this.http.post` is recognized and that its return type is correctly inferred,
  // which in turn resolves the downstream error.
  private http: HttpClient = inject(HttpClient);

  // The URL of your deployed serverless function. 
  // '/api/verify' is a relative path that works seamlessly with hosts like Vercel.
  private readonly backendUrl = '/api/verify'; 

  async verifyAddresses(
    address1: string,
    address2: string,
    precomputation: AddressPrecomputation
  ): Promise<VerificationResult> {
    try {
      const payload = { address1, address2, precomputation };
      
      // Use Angular's HttpClient to make a POST request to your backend proxy.
      const response$ = this.http.post<VerificationResult>(this.backendUrl, payload);
      
      // Convert the Observable to a Promise for the async/await syntax.
      // FIX: Add explicit type to `result` to prevent type inference issues.
      const result: VerificationResult = await firstValueFrom(response$);
      
      return result;
    } catch (error) {
      console.error('Error calling backend service:', error);
      throw new Error('Failed to communicate with the verification service. Please check the console.');
    }
  }
}