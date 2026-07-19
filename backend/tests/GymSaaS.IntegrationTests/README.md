# Integration tests

These tests exist for one reason: **two gyms on the same deployment must never see or touch each
other's data**, and if that breaks it breaks silently. No exception, no failing build — just one gym
reading another's members. Everything here is aimed at making that failure loud.

They run the real application through `WebApplicationFactory<Program>`: the actual JWT bearer
authentication, the `TenantStaff` policy, the rate limiter, the middleware and every controller.
Nothing is stubbed except the database connection, which points at a disposable database.

## In CI

`.github/workflows/ci.yml` runs this suite on every push and pull request, against a `postgres:16`
service container, plus the frontend build. The connection string comes from
`GYMSAAS_TEST_CONNECTION` there; no user-secrets are involved.

## Running them locally

PostgreSQL must be running. On this machine it is not a Windows service, so start it first:

```bash
D:\pgsql\bin\pg_ctl -D D:\pgdata -l D:\pgdata\server.log start
```

Then:

```bash
dotnet test backend/tests/GymSaaS.IntegrationTests/GymSaaS.IntegrationTests.csproj
```

The connection string comes from `GYMSAAS_TEST_CONNECTION`, falling back to the API's user-secrets
entry `ConnectionStrings:DefaultConnection` — so if `dotnet run` works on your machine, so does this,
with no extra setup. **`GymSaaS_Dev` is never touched**: only its host and credentials are borrowed
to create a `gymsaas_test_*` database, which is dropped when the run finishes.

A real PostgreSQL is required rather than the EF in-memory provider. The behaviour under test *is*
provider-level query filtering, and the schema uses Postgres-specific SQL (the filtered unique index
on `Attendances`). In-memory would pass while production leaked.

## What is covered

| File | Covers |
|---|---|
| `TenantIsolationTests` | Lists never leak; every by-id endpoint refuses another gym's ids; the victim's data is intact afterwards |
| `AuthenticationBoundaryTests` | No token, wrong signature, tampered tenant claim, expired token, `X-Tenant-Id` header ignored, deactivated account |
| `TenantFilterConfigurationTests` | The EF model itself: every `ITenantScoped` entity has a filter, filters really use `TenantId`, no undocumented exemptions, no new `IgnoreQueryFilters()` |
| `RegistrationTests` | Invite codes are single-use, emails are globally unique, a new gym gets its own trial |
| `AnonymousEndpointTests` | Every endpoint reachable without a token is on a reviewed allow-list and is rate-limited |

`TenantFilterConfigurationTests` is the one that keeps working as the codebase grows: it inspects the
model by reflection, so an entity added next year is covered the day it is written rather than
whenever someone remembers to write a test for it.

## Verified to actually fail

A test suite that has never failed proves nothing. Removing the `HasQueryFilter` from `Member` in
`GymSaaSDbContext` was confirmed to turn **8 tests red**, naming the entity (`Member`) and the exact
operations that became possible (`edit member: allowed (200)`, `delete member: allowed (204)`).
Worth repeating after any significant change to the isolation mechanism.

## The bug this suite already caught

The `IgnoreQueryFilters()` scan found `SubscriptionController`, a prototype leftover that never
received the auth hardening the other controllers did. Its
`POST /api/subscriptions/self-service/register-and-pay` was `[AllowAnonymous]`, took `TenantId`
straight from the request body, and called `IgnoreQueryFilters()` — so by design it wrote a `Member`,
`Subscription` and `Payment` into whichever gym the caller named, with no token and no rate limit.

It was unreachable only by accident (`IPaymentGateway` was never registered, so the controller could
not be constructed), and would have become a live unauthenticated cross-tenant write the moment
anyone wired up a payment gateway. **The controller and its orphaned support files were deleted.**
Its other action duplicated `MembersController.Create`, which is what the frontend actually uses.

`AnonymousEndpointTests` now guards the general case: every endpoint reachable without a token must
be on a reviewed allow-list and must be rate-limited, and the deleted route must stay deleted.

## Notes for whoever works on this next

- Each test registers its own gyms with unique emails and invite codes, so tests are independent
  without resetting the database between them.
- The rate limiter is real (10/min per IP on auth endpoints). `GymApiFactory` gives each request a
  random client IP so unrelated tests never collide; send the `X-Test-Client-Ip` header to pin a
  partition deliberately.
- `TestDatabase.CreateInspectionContext()` reads the raw database to prove rows exist while being
  invisible through the API. **Every query on a tenant-scoped entity must add
  `.IgnoreQueryFilters()`** — its tenant provider throws otherwise, on purpose, so a forgotten call
  fails loudly instead of quietly returning zero rows and passing for the wrong reason.
- The `_tenantProvider == null ||` escape hatch in `GymSaaSDbContext` does **not** work at query
  time: EF evaluates `_tenantProvider.CurrentTenantId` while extracting query parameters, before the
  short-circuit applies, so a null provider throws rather than returning everything. It only matters
  for design-time model building.
