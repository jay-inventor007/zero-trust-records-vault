# Zero-Trust Records Vault: Multi-Tenant Access Engine & RLS Isolation

> **A multi-tenant zero-trust records engine enforced with PostgreSQL Row-Level Security (RLS), query isolation audits, and tamper-proof access control.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Row%20Level%20Security-336791.svg)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Edge%20Functions-3ecf8e.svg)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Overview

A hardened multi-tenant record storage platform designed on zero-trust principles:
- **Database-Level Isolation:** Every query is automatically scoped to the authenticated user ID via PostgreSQL Row-Level Security (RLS) policies, eliminating application-memory leakage.
- **Tamper-Proof Authorization:** Cross-tenant reads, updates, and deletes are physically rejected by the PostgreSQL engine regardless of client parameters.
- **Audit & Query Verification:** Exhaustive access-control audit tables verifying that unauthorized callers receive empty sets or access violations.
- **Query Count Benchmarks:** Before-and-after query optimization metrics proving zero over-fetching under high tenancy.

👉 **Complete Architecture & Technical Specs:** See [`DOCUMENTATION.md`](./DOCUMENTATION.md) for RLS policy definitions, isolation attack surface proofs, and query execution benchmarks.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env   # Set VITE_API_BASE_URL and Supabase credentials

# 3. Start local development server
npm run dev
```

Full setup, including linking the Supabase project, executing RLS migrations, and deploying Edge Functions, is detailed in [`DOCUMENTATION.md`](./DOCUMENTATION.md).
