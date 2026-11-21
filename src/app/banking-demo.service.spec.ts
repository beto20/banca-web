import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE, BankingDemoService, Transaction } from './banking-demo.service';

/** Drains the microtask queue so an awaited refresh() issues its requests. */
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

function flushInitialLoad(http: HttpTestingController): void {
  // The constructor eagerly calls refresh(): transactions + account summary.
  http.expectOne(`${API_BASE}/transactions`).flush([]);
  http.expectOne(`${API_BASE}/account/summary`).flush({ limitCents: 500_000, usedCents: 0, availableCents: 500_000, utilization: 0 });
}

describe('BankingDemoService', () => {
  let service: BankingDemoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BankingDemoService);
    http = TestBed.inject(HttpTestingController);
    flushInitialLoad(http);
  });

  afterEach(() => http.verify());

  it('posts the amount in cents and returns the created transaction', async () => {
    const created: Transaction = { id: 'TXN-1', merchant: 'Market', amountCents: 10_000, category: 'Groceries', status: 'approved', reason: 'Authorization approved', createdAt: '2026-11-18T00:00:00Z' };
    const promise = service.create({ merchant: 'Market', amount: 100, category: 'Groceries', decision: 'automatic' });

    const post = http.expectOne(`${API_BASE}/transactions`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ merchant: 'Market', amountCents: 10_000, category: 'Groceries', decision: 'automatic' });
    post.flush(created);

    // create() refreshes afterwards.
    await tick();
    http.expectOne(`${API_BASE}/transactions`).flush([created]);
    http.expectOne(`${API_BASE}/account/summary`).flush({ limitCents: 500_000, usedCents: 10_000, availableCents: 490_000, utilization: 2 });

    expect(await promise).toEqual(created);
    expect(service.availableCents()).toBe(490_000);
    expect(service.transactions()).toEqual([created]);
  });

  it('reloads transactions and summary on reset', async () => {
    const promise = service.reset();
    http.expectOne(`${API_BASE}/transactions/reset`).flush([]);
    await tick();
    http.expectOne(`${API_BASE}/transactions`).flush([]);
    http.expectOne(`${API_BASE}/account/summary`).flush({ limitCents: 500_000, usedCents: 35_260, availableCents: 464_740, utilization: 7 });
    await promise;
    expect(service.utilization()).toBe(7);
  });
});
