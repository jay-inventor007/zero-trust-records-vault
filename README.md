# Records and Access Slice

Create, list, view, and delete your own records - notes, in this case - built so another
signed-in user can never reach yours, no matter what they try. Built with React and
TypeScript on the frontend, Supabase Postgres and Edge Functions on the backend. Auth is
reused from the Authentication slice.

See `DOCUMENTATION.md` for the full write-up, including the access-control audit table and
the query-count before/after.

## Quick start

```
npm install
cp .env.example .env   # fill in VITE_API_BASE_URL
npm run dev
```

Full setup, including linking the Supabase project and deploying Edge Functions, is in
`DOCUMENTATION.md`.
