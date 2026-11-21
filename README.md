# Lumina Bank credit card simulator

Angular frontend for the **banca-web** channel shown in [Lumina_bank_v2.pdf](./Lumina_bank_v2.pdf). It lets you create simulated credit card transactions, inspect the result, and view transaction history.

## Run locally

Use Node.js 22.22.3 or newer, then:

```bash
npm install
npm start
```

Open `http://localhost:4200`. Run `npm test` for the transaction rules and `npm run build` for a production build.

## Simulation rules

- Demo card: `•••• 4829`, S/ 5,000 credit limit.
- Approved transactions reduce available credit.
- Amounts above available credit decline.
- In automatic mode, amounts above S/ 1,500 go to review.
- The form can force a decline or review for testing.
- History is stored in this browser's `localStorage`; **Reset demo data** restores the starting state.

No real payment is made and no real card number or CVV is collected. The PDF defines the service path (`banca-web → api-creditcard → ms-creditcard`), but it does not define HTTP endpoints or request and response schemas. The Terraform files in `../Implementacion` provision infrastructure and an API gateway proxy, not a running transaction backend. `src/app/banking-demo.service.ts` is the integration seam to replace once that API contract and URL exist. Downstream scoring, Pub/Sub, and analytics are represented only by demo outcomes here.
