# Devolution — Standalone Trust & Reputation Platform

A modern, standalone digital trust and reputation platform that allows individuals, freelancers, creators, online sellers, and businesses to establish credibility through verifiable identity attestation, two-sided human relationship verification, voluntary peer endorsements, dual-signed Trust Receipts, and authoritative registry credentials.

---

## Core Product Principles

1. **Who is this person?** — Identity and credential verification via authoritative database queries (e.g. NIMC NIN, ICAO Passport MRZ) and carrier network OTP challenges.
2. **Who knows this person?** — Independently confirmed peer relationships (colleagues, clients, supervisors, family). Relationship confirmation is strictly decoupled from endorsements.
3. **What can this person demonstrate?** — Documented credentials, CAC corporate registration, higher education degrees, and coarse location evidence with zero raw biometric storage.
4. **What has this person actually done?** — Bilateral, dual-signed Trust Receipts recording commercial commitments, agreements, deliveries, and formal dispute mediation history.

---

## Architecture & Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Plus Jakarta Sans & JetBrains Mono typography.
- **Backend**: Node.js & Express REST API with server-side authorization and transparent multi-dimensional reputation engine.
- **Data Layer**: File-backed JSON persistence (`data/db.json`) with seeded profiles, cryptographic audit logs, and testable sandbox tokens.
- **Privacy & Compliance**: Zero private exposure protocol (phone numbers, residential street coordinates, and government ID scans are never exposed publicly). NDPR & GDPR Article 15/20 data subject access archive export.

---

## Quick Start & Local Development

### Prerequisites
- Node.js 20+
- npm or bun

### Installation & Run
```bash
# Install dependencies
npm install

# Start the full-stack server (runs Express API + Vite frontend on port 3000)
npm run dev

# Open in browser
http://localhost:3000
```

### Production Build
```bash
npm run build
npm start
```

---

## Pushing to GitHub

To push this codebase to your remote repository:

```bash
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
git add .
git commit -m "feat: initial commit of Aegis Trust Network platform"
git branch -M main
git remote add origin https://github.com/allenblue90210-jpg/Devolution-TamyonoiaCat.git
git push -u origin main
```

---

## Registered Network Participants

- **Allen Kinetic (`@allenkinetic006`)**: Architect & Verified Trustee, Devolution Technologies Ltd (RC-1849204). Verified identity, phone verified, attested credentials, confirmed relationships.
- **Allen Blue (`@allenblue`)**: Verified Trustee (`allennuclear001@gmail.com`).
- **Lola (`@lola`)**: Operations & Advisory Partner (`allenkinetic001@gmail.com`). Confirmed peer who co-built payment settlement pipelines.
- **wolf (`@kai`)**: Technology & Hardware Counterparty (`allenblack530@gmail.com`). Confirmed counterparty on verified enterprise collaborations.

