# InkWellMedia closed-beta readiness checklist

Target: five manually approved Founding Creators and approximately 50 invited
members. This checklist is a release gate, not evidence that the accompanying
database migration has been applied to any hosted environment.

## Gate status before applying `setup_closed_beta.sql`

| Gate | Status | Evidence / required action |
|---|---|---|
| Visitor registration and login | Conditional | Email login exists. Public sign-up must remain invite-only and the legacy shared creator password must be absent. |
| Member registration and role assignment | Blocked | Apply the beta migration, create invitations through the admin RPC, then verify the auth-user trigger creates a `member` role and registration attribution. |
| Creator application, approval and onboarding | Blocked | Apply the migration, submit through `submit_creator_application`, approve through `approve_creator_application`, and send the generated invite manually. |
| Creator profile compilation and publishing | Ready for curated beta | `npm run profiles:test` and `npm run profiles:validate` must pass. Add only approved creator folders and review generated output before publishing. |
| Explore and creator discovery | Conditional | Curated profiles work when compiled. Supabase and curated discovery remain separate; beta content must use the curated compiler initially. |
| Protected member/creator/admin routes | Blocked | Route helpers are present, but final protection depends on the role RPC and RLS migration being applied. UI redirects are not authorization. |
| RLS across anonymous/member/creator/admin | Blocked pending environment test | SQL policies and test cases are supplied. Run the four-identity test matrix in a disposable/staging Supabase project. Never infer production safety from browser tests. |
| Browser financial authority | Fail before migration; denied after migration | Existing pages contain legacy direct mutations. Closed-beta SQL revokes browser writes and payment UI is disabled. Do not launch money features. |
| Reset, logout and expired sessions | Conditional | Reset/logout paths exist. Verify email redirects on the deployed beta URL and exercise expired/invalid refresh-token cases. |
| Mobile, accessibility and links | Conditional | Automated static checks are supplied; complete keyboard and screen-reader smoke tests plus the viewport matrix before invites are sent. |

## Non-negotiable payment gate

Real deposits, purchases, subscriptions, balance changes, earnings credits and
payouts remain disabled until all of the following are independently verified:

- server-side authority for every money transition;
- signed and replay-protected payment webhooks;
- an atomic, immutable transaction ledger with idempotency keys;
- RLS tests proving anonymous and normal authenticated clients cannot mutate money;
- reconciliation, refund and administrative audit procedures;
- protected paid media delivered only after an authoritative entitlement check.

## Staging identity matrix

Use four dedicated non-production accounts and record pass/fail evidence:

1. Anonymous: can read public creator previews and submit rate-limited application,
   waitlist, feedback and analytics RPCs; cannot read private beta tables.
2. Member: can read their own registration/invitation attribution; cannot approve
   creators, create invites, publish as another creator, or mutate money.
3. Creator: has member capabilities plus creator-owned profile/content access only;
   cannot approve applications, create admin invitations, or mutate money.
4. Admin: can use beta admin RPCs; financial writes remain denied during beta.

Store screenshots/query results in a private release record, not in this repository
if they contain email addresses, UUIDs or access tokens.
