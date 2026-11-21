import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type Status = 'approved' | 'declined' | 'review';
export type Decision = 'automatic' | 'decline' | 'review';
export interface Transaction {
  id: string;
  merchant: string;
  amountCents: number;
  category: string;
  status: Status;
  reason: string;
  createdAt: string;
}

interface AccountSummary {
  limitCents: number;
  usedCents: number;
  availableCents: number;
  utilization: number;
}

/**
 * Base URL of the plataforma (api-creditcard) backend.
 *
 * Relative path so the browser calls the same origin that served the app.
 * - Local dev: configure an `/api` proxy in the Angular dev server, or run the
 *   backend behind the same host.
 * - GKE: Nginx (see `nginx.conf`) proxies `/api` to the plataforma Service.
 */
export const API_BASE = '/api';

const emptySummary: AccountSummary = { limitCents: 500_000, usedCents: 0, availableCents: 500_000, utilization: 0 };

@Injectable({ providedIn: 'root' })
export class BankingDemoService {
  private readonly http = inject(HttpClient);
  private readonly summary = signal<AccountSummary>(emptySummary);

  readonly transactions = signal<Transaction[]>([]);
  readonly limitCents = computed(() => this.summary().limitCents);
  readonly usedCents = computed(() => this.summary().usedCents);
  readonly availableCents = computed(() => this.summary().availableCents);
  readonly utilization = computed(() => this.summary().utilization);

  constructor() {
    void this.refresh();
  }

  /** Loads transactions and the account summary from the backend. */
  async refresh(): Promise<void> {
    const [transactions, summary] = await Promise.all([
      firstValueFrom(this.http.get<Transaction[]>(`${API_BASE}/transactions`)),
      firstValueFrom(this.http.get<AccountSummary>(`${API_BASE}/account/summary`)),
    ]);
    this.transactions.set(transactions);
    this.summary.set(summary);
  }

  async create(input: { merchant: string; amount: number; category: string; decision: Decision }): Promise<Transaction> {
    const amountCents = Math.round(input.amount * 100);
    const created = await firstValueFrom(this.http.post<Transaction>(`${API_BASE}/transactions`, {
      merchant: input.merchant,
      amountCents,
      category: input.category,
      decision: input.decision,
    }));
    await this.refresh();
    return created;
  }

  async reset(): Promise<void> {
    const transactions = await firstValueFrom(this.http.post<Transaction[]>(`${API_BASE}/transactions/reset`, {}));
    this.transactions.set(transactions);
    await this.refresh();
  }
}
