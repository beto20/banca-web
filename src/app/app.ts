import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BankingDemoService, Decision, Status, Transaction } from './banking-demo.service';

type Filter = 'all' | Status;

@Component({ selector: 'app-root', imports: [CommonModule, ReactiveFormsModule], templateUrl: './app.html', styleUrl: './app.css' })
export class App {
  private readonly fb = inject(FormBuilder);
  readonly bank = inject(BankingDemoService);
  readonly filter = signal<Filter>('all');
  readonly receipt = signal<Transaction | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly visible = computed(() => this.bank.transactions().filter(t => this.filter() === 'all' || t.status === this.filter()));
  readonly categories = ['Shopping', 'Groceries', 'Dining', 'Travel', 'Services'];
  readonly filters: { label: string; value: Filter }[] = [
    { label: 'All', value: 'all' }, { label: 'Approved', value: 'approved' },
    { label: 'Declined', value: 'declined' }, { label: 'In review', value: 'review' },
  ];
  readonly form = this.fb.nonNullable.group({
    merchant: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    category: ['Shopping', Validators.required],
    decision: ['automatic' as Decision, Validators.required],
  });

  async submit(): Promise<void> {
    if (this.form.invalid || this.busy()) { this.form.markAllAsTouched(); return; }
    this.busy.set(true);
    this.error.set('');
    try {
      const v = this.form.getRawValue();
      const transaction = await this.bank.create({ merchant: v.merchant, amount: Number(v.amount), category: v.category, decision: v.decision });
      this.receipt.set(transaction);
      this.form.reset({ merchant: '', amount: null, category: v.category, decision: 'automatic' });
      this.filter.set('all');
    } catch { this.error.set('Could not create this transaction. Check the entered details.'); }
    finally { this.busy.set(false); }
  }

  async reset(): Promise<void> {
    this.error.set('');
    try { await this.bank.reset(); } catch { this.error.set('Could not reset demo data.'); }
    this.receipt.set(null); this.filter.set('all'); this.form.reset({ merchant: '', amount: null, category: 'Shopping', decision: 'automatic' });
  }
  label(status: Status): string { return status === 'review' ? 'In review' : status === 'approved' ? 'Approved' : 'Declined'; }
}
