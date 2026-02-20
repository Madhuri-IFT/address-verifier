import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { DOCUMENT, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from './services/gemini.service';
import { VerificationResult } from './models/verification-result.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class AppComponent implements OnInit {
  private readonly geminiService = inject(GeminiService);
  // Fix: Explicitly type `document` as `Document` to resolve type inference issues.
  private readonly document: Document = inject(DOCUMENT);

  address1 = signal<string>('456 Oak Avenue, Springfield, IL 62704');
  address2 = signal<string>('456 Oak Ave, Springfield, Illinois 62704');
  
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  verificationResult = signal<VerificationResult | null>(null);
  showApiInfo = signal<boolean>(false);

  ngOnInit(): void {
    if (this.document.defaultView) {
        const urlParams = new URLSearchParams(this.document.defaultView.location.search);
        const address1Param = urlParams.get('address1');
        const address2Param = urlParams.get('address2');

        if (address1Param && address2Param) {
            this.address1.set(decodeURIComponent(address1Param));
            this.address2.set(decodeURIComponent(address2Param));
            this.onVerify();
        }
    }
  }

  private normalizeAddress(address: string): string {
    if (!address) return '';
    let normalized = address.toLowerCase();
    
    normalized = normalized.replace(/[.,]/g, '');

    const replacements: { [key: string]: string } = {
      'ave': 'avenue',
      'st': 'street',
      'rd': 'road',
      'dr': 'drive',
      'ln': 'lane',
      'ct': 'court',
      'blvd': 'boulevard',
      'pl': 'place'
    };

    for (const abbr in replacements) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'g');
      normalized = normalized.replace(regex, replacements[abbr]);
    }

    return normalized.replace(/\s+/g, ' ').trim();
  }

  private levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= b.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }

    return matrix[b.length][a.length];
  }

  async onVerify(): Promise<void> {
    if (!this.address1().trim() || !this.address2().trim()) {
      this.error.set('Please enter both addresses to compare.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.verificationResult.set(null);

    const addr1 = this.address1();
    const addr2 = this.address2();

    const normalizedAddress1 = this.normalizeAddress(addr1);
    const normalizedAddress2 = this.normalizeAddress(addr2);
    const distance = this.levenshteinDistance(normalizedAddress1, normalizedAddress2);

    const precomputation = {
      normalizedAddress1,
      normalizedAddress2,
      levenshteinDistance: distance,
    };

    try {
      const result = await this.geminiService.verifyAddresses(addr1, addr2, precomputation);
      this.verificationResult.set(result);
      this.postResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      this.error.set(errorMessage);
      this.postResult({ error: errorMessage });
    } finally {
      this.isLoading.set(false);
    }
  }

  private postResult(result: VerificationResult | { error: string }): void {
    if (this.document.defaultView && this.document.defaultView.self !== this.document.defaultView.top) {
      // We are in an iframe
      this.document.defaultView.parent.postMessage(result, '*');
    }
  }
}
