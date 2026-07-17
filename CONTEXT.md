# Project Context

Workspace path: `D:\Original Gym\GymProyectChanges-develop`

## Goal

Gym management SaaS with multi-tenant backend structure and a React/Tailwind admin dashboard.

## Stack

- Backend: C# ASP.NET Core Web API (net8.0), Entity Framework Core 8 + Npgsql, PostgreSQL.
- Frontend: React + Vite + Tailwind CSS.
- GitHub repo: `https://github.com/JohanInEd/GymProyectChanges.git`
- Current development branch: `main`

## Frontend

Location: `frontend/`

Run locally:

```bash
cd frontend
npm install
npm run dev
```

Default local URL: `http://localhost:5173`

Build:

```bash
npm run build
```

The frontend has been validated with `npm run build`.
The development server was also validated with an HTTP 200 response on June 11, 2026.

Deployment:

- `frontend/Dockerfile` (added July 13, 2026): multi-stage build, `node:20-alpine` runs `npm ci` + `npm run build`, then `nginx:1.27-alpine` serves the static `dist/` output. Build context = `./frontend` (same convention as `backend/Dockerfile` and `./backend`).
- `frontend/nginx.conf`: SPA fallback (`try_files $uri $uri/ /index.html`) plus gzip for text assets. Listens on port 80.
- `frontend/.dockerignore` excludes `node_modules`, `dist`, `.git`, env files.
- `VITE_API_BASE_URL` **is required at build time** (Vite bakes `import.meta.env.VITE_*` in at `npm run build`, not at runtime). Since July 16, 2026 the whole app depends on it, not just the invite-code check — without it a real gym cannot load any data. Locally it comes from `frontend/.env.local`; in Coolify it must be set and marked **Available at Buildtime**.
- There is still no router — the app switches views via in-memory tab state, not URL routes. That is why the emailed password-reset / verification links use query params (`/?reset=...`), which the frontend does not read yet.
- Verified locally (no Docker available in this dev environment): `npm ci` and `npm run build` both succeed and produce root-relative asset paths (`/assets/...`) in `dist/index.html`, matching the Nginx `root` config.
- In Coolify this is deployed as its own application ("Front-end Server", Dockerfile build pack, Base Directory `/frontend`, Ports Exposes `80`), separate from the backend app, per the "keep it separate" decision.
- Deployed and verified live at `https://gymassist.online` (the apex domain; moved here from the backend app on July 13, 2026 so the user-facing dashboard owns the clean domain).
- Requires a `VITE_API_BASE_URL` environment variable in Coolify marked **Available at Buildtime** (Vite bakes `import.meta.env.VITE_*` values in at `npm run build` time, not runtime), set to the backend app's URL. Without it, `inviteCodeApi.js` calls fail gracefully (relative-path fetch, shows a network-error message) rather than crashing.

Main files:

- `frontend/src/App.jsx`
- `frontend/src/auth.js`
- `frontend/src/apiClient.js` (added July 16, 2026 — shared fetch wrapper: base URL, `Authorization: Bearer`, plain-string error handling, 401 -> logout hook)
- `frontend/src/session.js` (added July 16, 2026 — persists `{token, user}` in `localStorage` under `gymflow-session`)
- `frontend/src/gymApi.js` (added July 16, 2026 — every business endpoint, grouped per feature)
- `frontend/src/adapters.js` (added July 16, 2026 — maps API DTOs onto the shapes the components already consume, so components needed no changes)
- `frontend/src/authApi.js`
- `frontend/src/inviteCodeApi.js`
- `frontend/src/main.jsx`
- `frontend/src/index.css`
- `frontend/tailwind.config.js`
- `frontend/.env.local` (gitignored; local dev only: `VITE_API_BASE_URL=http://localhost:5080`)
- `frontend/src/components/AccessManagement.jsx`
- `frontend/src/components/AnalyticsDashboard.jsx`
- `frontend/src/components/AuthScreen.jsx`
- `frontend/src/components/ClassSchedule.jsx`
- `frontend/src/components/ClientForm.jsx`
- `frontend/src/components/CheckInDashboard.jsx`
- `frontend/src/components/FinancialDashboard.jsx`
- `frontend/src/components/GymSetup.jsx`
- `frontend/src/components/InviteCodeGate.jsx`
- `frontend/src/components/MemberDetail.jsx`
- `frontend/src/components/MemberProgress.jsx`
- `frontend/src/components/MembersTable.jsx`
- `frontend/src/components/MembershipAlert.jsx`
- `frontend/src/components/MembershipCalendar.jsx`
- `frontend/src/components/OperationsDashboard.jsx`
- `frontend/src/components/Tabs.jsx`

Current UI features:

- Public gym registration from the authentication screen, gated by a one-time-use invite code (added July 13, 2026):
  - Clicking "Registrar gimnasio" shows `InviteCodeGate` first, not the registration form directly.
  - The gate calls the real backend (`POST /api/invite-codes/validate`, `frontend/src/inviteCodeApi.js`) — this is the first real (non-mock) backend call from the frontend. Requires `VITE_API_BASE_URL` set at Docker build time (see Deployment below); without it the check always fails gracefully with a network-error message.
  - If the page loads with a `?code=XYZ` query param, `AuthScreen` starts directly in the code-gate mode and auto-validates immediately, so a shared invite link passes through with no typing required. Otherwise the user enters a code manually.
  - Once validated, the code is held in memory (not yet marked used) and the existing gym/owner registration form appears.
  - The code is only actually consumed on final submit: `handleRegisterGym` in `App.jsx` calls `POST /api/auth/register-gym` (added July 15, 2026 — see Authentication below), which redeems the code, creates a real `Gym` + owner `User` row in Postgres, and returns a JWT in one atomic transaction; if redemption fails (already used, invalid) or the owner email is already taken, registration is aborted with an error and nothing is created. An abandoned code-gate attempt (validated but never submitted) does not burn the code. The standalone `POST /api/invite-codes/redeem` endpoint (see Invite codes below) still exists but is no longer called directly by the frontend.
  - Backend invite codes are a standalone, non-tenant-scoped entity (`InviteCode`: Code, IsUsed, CreatedAt, UsedAt) since they must be checkable before any tenant/gym exists.
- New gym onboarding includes:
  - Gym name and city.
  - Owner name, email, phone, and password.
  - Initial SaaS plan selection.
  - Terms acceptance.
  - Automatic creation of the first user with the `Owner` role.
  - A clean tenant workspace that does not inherit demo gym data.
  - A 14-day trial with pending approval and pending email verification status.
  - Tenant registration and owner login persistence in `localStorage` under `gymflow-registered-gyms`.
  - Tenant-filtered user management so one gym cannot see another gym's users.
- **The app now runs in two modes (July 16, 2026 — this is the single most important thing to know about `App.jsx`):**
  - **Real gym (token-backed).** `const isBackendSession = Boolean(authToken)`. Every business feature reads and writes through the API and persists in PostgreSQL. Data survives refreshes and is shared across staff and devices. A newly registered gym starts empty (the clean workspace is now real: no rows yet, so nothing shows).
  - **Demo accounts (local-only).** The four "Cuentas demo" (password `Demo123!`) stay exactly as before: in-memory mock data, no backend rows, lost on refresh — a deliberate shortcut. `handleLogin` checks the local mock `users` array first (any entry with a `password` field) and only falls through to the real backend for accounts without one.
  - Every handler in `App.jsx` branches on `isBackendSession`: the backend path calls `gymApi`, then re-fetches via a `refreshX()` helper; the `else` path keeps the original local mock logic untouched.
- Before July 16, 2026 all business data lived only in React `useState` seeded from demo constants and was lost on every page refresh. That is no longer true for real gyms — this was the main blocker to piloting.
- Registered-gym login and registration use real backend authentication (see Authentication below): hashed passwords, a real `Gym`/`User` row in Postgres, and a JWT session. Approval status, email verification, trial and the subscription plan chosen at registration are **now real backend state** too (see SaaS billing below) — they are no longer `localStorage` mock bookkeeping.
- **Session survives refresh** (July 16, 2026): `session.js` stores `{token, user}` in `localStorage`; on load `App.jsx` restores it, re-validates the token against `GET /api/auth/me` before trusting it, and shows a brief "Restaurando sesion..." screen meanwhile. Any 401 from the API clears the session and logs out cleanly. Demo sessions are deliberately **not** persisted (no token).
- API failures surface in a dismissible red banner (`apiError` state + `reportApiError`), so writes rejected by the backend never fail silently.
- Local demo authentication screen with active/inactive user validation.
- Role-based navigation and action permissions:
  - Owner: full access, including user management.
  - Administrator: finance, analytics, clients, check-in, memberships, progress, classes, operations, and gym setup.
  - Reception: clients, check-in, memberships, and class reservations.
  - Trainer: read-only client access plus progress tracking, class scheduling, and reservations.
- User management includes:
  - Creating users with a role and temporary password.
  - Activating and deactivating accounts.
  - Permission summaries per role.
  - Protection against deactivating the current user.
- Demo accounts use password `Demo123!` (local-only, see above — not a real backend account).
- Classes tab includes:
  - A "Programar clase" panel with a member picker on the left (name search, avatar, name, email, single selection) and the class form on the right (trainer, date, time, duration, capacity, room), separated by a vertical divider.
  - The Clase field is a select fed by the class catalog registered in Configuracion; choosing one auto-fills trainer, duration, capacity, and room (all still editable), while date and time stay manual.
  - When the catalog is empty the select shows "Sin clases registradas" and a hint pointing to Configuracion.
  - The panel's single `Confirmar reserva` action creates the class and registers the selected member's reservation in one step (`onCreateClassWithReservation`); no class is created if the member validation fails.
  - Client reservations into existing classes from the side "Reservar cupo" panel.
  - Duplicate-reservation prevention.
  - Capacity enforcement.
  - Expired-membership and suspended-membership blocking.
  - Reservation cancellation and attendee lists.
- Progress tab includes:
  - Per-member dated body measurement history.
  - Weight and waist trend charts.
  - Current weight, waist, body-fat, and active-goal metrics.
  - Body weight, chest, waist, hip, and body-fat registration.
  - Goals with target values, dates, units, and completion status.
  - Trainer notes with author and timestamp.
  - New measurements update the member's current body metrics.
  - Owners, administrators, and trainers can edit progress data.
  - Reception does not have access to progress health data.
- Analytics tab includes:
  - Six-month and twelve-month analysis periods.
  - Estimated retention and churn from current membership status.
  - Monthly new-member versus expired-membership comparison.
  - Average payment ticket.
  - Revenue grouped by plan.
  - Revenue grouped by payment method.
  - Gym attendance grouped by hour with peak-hour detection.
  - Automatically generated business insights.
  - Analytics access is limited to owners and administrators.
  - Retention and churn remain estimates until the backend stores explicit cancellation events.
- Operations tab includes:
  - Monthly expense budgets by category.
  - Budget utilization indicators.
  - Finance expense registrations automatically update matching operational budgets.
  - Equipment inventory, maintenance dates, and operational status.
  - Staff shift scheduling and commissions.
- Dark mode / light mode toggle in the header.
  - Uses Tailwind class-based dark mode (`darkMode: "class"`).
  - Stores the selected theme in `localStorage` under `gym-theme`.
  - Applies the `dark` class to `document.documentElement`.
- Permission-aware tabs: `Finanzas`, `Analitica`, `Clientes`, `Check-in`, `Mensualidad`, `Progreso`, `Clases`, `Inventario`, `Operaciones`, `Configuracion`, and `Usuarios`.
- Inventory tab includes:
  - Product catalog with SKU, name, category, sale price, current stock, and minimum stock.
  - Product search and category filtering.
  - Summary metrics for registered products, available units, inventory value, and low-stock products.
  - Low-stock alerts based on each product's configured minimum.
  - Owners and administrators can add, edit, and remove products.
  - Reception can view products and only adjust stock quantities.
  - Trainers do not have access to inventory.
- Finance tab includes:
  - Current-month income, expenses, net profit, and outstanding receivables.
  - Six-month combined chart with income, expenses, and registered-user count.
  - Grouped income/expense bars use a monetary scale.
  - Registered users use a separate line scale.
  - Outstanding receivables list with due dates and overdue days.
  - Quick action to register a payment.
  - Quick action to register a categorized expense.
  - Expense categories: Infrastructure, Machinery, and Services.
  - Expenses include description, amount, date, payment method, and optional provider.
  - Category summary cards show the accumulated amount for each expense category.
  - CSV finance report download, as the rightmost card in the "Acciones rapidas" row (Registrar pago, Registrar gasto, Descargar reporte).
  - The downloaded report is now only a single "Base de datos" ledger sheet (the "Resumen financiero" and "Cuentas por cobrar" sections were removed) with columns Fecha (DD/MM/YYYY), Mes, Ano, Hora, Categoria, Concepto, Descripcion, Plan, Fecha limite, Monto, Medio de pago, Proveedor, combining every registered payment ("Pago", concepto = member name, Plan/Fecha limite from the matching member's current plan and endDate, Descripcion/Proveedor blank) and expense ("Gasto", concepto = expense category, Plan/Fecha limite blank, Descripcion/Proveedor = the expense's saved values if any), sorted newest first.
  - Registering a payment updates income, payment count, recent payments, the chart, and matching receivables.
  - The "Pagos recientes" table only lists payments with status other than Pending; pending/unpaid amounts are tracked exclusively in "Cartera por cobrar".
  - The "Fecha" column in both "Pagos recientes" and "Gastos recientes" tables shows a simple DD/MM/YYYY date (no time, no month name); `formatDateTime` was replaced by `formatDateSimple`.
  - The "Cartera pendiente" summary card uses the amber/warning tone (instead of red/negative) when there is a pending balance.
  - The "Utilidad neta" summary card uses a new sky-blue "info" tone (instead of emerald/green) when profit is non-negative; still falls back to the rose/negative tone when profit is negative.
  - The four summary MetricCards (Ingresos, Gastos, Utilidad neta, Cartera pendiente) now also show a colored top accent bar on hover, matching each card's tone (same color as its value text), in addition to the existing lift/shadow hover effect.
  - The "Ingresos, gastos y usuarios" chart bars now use a vertical gradient (emerald/rose) instead of a flat fill.
  - The Infraestructura/Maquinaria/Servicios expense-category cards were redesigned: colored border per category (amber/fuchsia/sky via `expenseCategoryStyles`), with a single category icon (building/gear/bolt) always shown first in a colored circle before the title (no duplicate corner icon), the "Gastos registrados en esta categoria" description below the title, and the amount split into two columns (Mes / Año) at the bottom, separated by a vertical divider. On hover the card lifts (`hover:-translate-y-0.5 hover:shadow-lg`) and that same leading icon circle enlarges (`group-hover:scale-125`).
  - `categoryExpenseTotals` (replacing the old all-time `expensesByCategory`) computes, per category, the sum of expenses whose date falls in the current real month ("Mes") and the sum for the current real year ("Ano"), based on each expense's `expenseDate` (UTC-safe) or `createdAt` fallback.
  - The "Acciones rapidas" buttons (Registrar pago, Registrar gasto, Descargar reporte) now use a diagonal-free left-to-right gradient background per tone (`ActionButton`'s `toneStyles`: green = emerald-to-teal, red = rose-to-pink, gray = slate-700-to-slate-500) instead of a flat color; size, text, and icon unchanged.
  - Registering an expense updates expenses, net profit, category totals, recent expenses, and the chart.
  - The current chart user count follows the live number of clients in the frontend state.
- Client creation form with:
  - Personal info section, ordered Nombre, Genero, Edad, Peso, Altura, Telefono, Correo (Correo is optional).
  - Biometria section: Pecho, Brazo, Cintura, Cadera, Pierna.
  - Membresia section: fixed plan choices (Diario, Semanal, Mensual, Anual, VIP) plus a subscription value field.
  - Submit button reads "Finalizar registro" and sits under the Membresia section.
  - All field and section titles render in uppercase.
- Client creation plan choices are now a fixed list (Diario, Semanal, Mensual, Anual, VIP) instead of pulling from registered gym plans.
- Gym setup tab includes:
  - Gym name
  - City
  - Admin user name
  - Admin email
  - Admin phone
  - Admin role
  - Plan registration form, reused for both creating and editing plans
  - Registered plans table with edit and delete actions (minimalist icon buttons) and a custom confirmation modal for delete
  - A class registration form ("Registrar clase" / "Editar clase") below the plans table with class name, trainer, duration, capacity, and room
  - A "Registro de clases" table (Clase, Entrenador, Duracion, Capacidad, Espacio, Acciones) mirroring the plans table design, with edit/delete icon buttons and its own delete confirmation modal
  - Registering a class with an existing name updates it instead of duplicating (id-first matching like plans)
  - Feature suggestions for future product work
- Registered plans include:
  - Plan name
  - Price in COP
  - Duration in days
  - Included classes
  - Description
- Adding a plan with an existing name updates the previous plan instead of duplicating it.
- Members table is clickable.
- Check-in tab includes:
  - A table-based check-in styled like the client database table, with columns Miembro (avatar, name, email), Membresia, Estado, Vence, and Acciones.
  - The only filter is the name search inside the Miembro column header (plan and status filters were removed).
  - Estado badge shows Activa, Por vencer, Vencida, or Suspendida; suspensions toggled in Finanzas are reflected here immediately.
  - Vence shows the plan end date; already-finished plans add a "Plan finalizado" marker in red.
  - Per-row `Validar entrada` records the date and time of the moment it is pressed.
  - `Validar entrada` is disabled for expired or suspended plans and while the client has an active entry.
  - Per-row `Validar salida` closes the active visit and enables a future entry.
  - Only one active entry is allowed per client; the Estado cell shows "Dentro desde" with the entry time.
  - An inline banner above the table confirms the last entry/exit result with the member name and timestamp.
  - A `Revisar pago` button appears only on expired or suspended rows, and only for roles with finance permission; it navigates to Finanzas, auto-opens the Registrar pago panel, and pre-fills the search with that member's name.
  - Blocked entries record reason "Plan vencido" or "Plan suspendido".
  - Current people inside the gym are counted on the dashboard.
  - Daily counters for allowed entries, blocked attempts, and expiring plans.
  - Recent check-in history with entry/exit timestamps, result, and reason.
- Membership table column has filter:
  - Todas
  - Activas
  - Por vencer
  - Vencidas
- Alert appears when at least one membership has `5` days or fewer remaining.
- Alert has:
  - `Revisar` button: opens `Mensualidad` tab and filters by `Por vencer`.
  - `Quitar` button: dismisses alert from the screen.
- Membership detail includes a mini calendar:
  - Editable start and end date inputs.
  - Previous / next month controls.
  - Full subscription range highlighted in sequence.
  - Used subscription days marked teal.
  - Pending subscription days marked sky blue.
  - Start date marked green.
  - End date marked red.
  - Today marked with dark ring.
  - Shows remaining days, total subscription length, and progress.
  - Date edits recalculate days remaining, membership status, badge color, filters, and alerts.
- Human silhouette component was removed.

## Backend

Location: `backend/src/`

Backend now has a runnable ASP.NET project (`GymSaaS.Api.csproj` and `Program.cs`); see the "Important backend note" below for current caveats.

Main backend files:

- `backend/src/API/Controllers/DashboardController.cs`
- `backend/src/API/Controllers/CheckInController.cs`
- `backend/src/API/Controllers/SubscriptionController.cs`
- `backend/src/API/Controllers/InviteCodesController.cs`
- `backend/src/API/Controllers/AuthController.cs`
- Added July 16, 2026 (all `[Authorize(Policy = "TenantStaff")]`, all tenant-scoped):
  - `backend/src/API/Controllers/MembersController.cs` (`api/members`: list/create/update/soft-delete, `PUT {id}/membership` for dates + optional plan change, `POST {id}/suspend` toggle)
  - `backend/src/API/Controllers/PlansController.cs` (`api/plans`: list, upsert, delete)
  - `backend/src/API/Controllers/FinanceController.cs` (`api/finance`: `GET summary`, `POST payments`, `POST expenses`)
  - `backend/src/API/Controllers/InventoryController.cs` (`api/products`: list, upsert, `PUT {id}/stock`, delete)
  - `backend/src/API/Controllers/ClassesController.cs` (`api/classes`: templates CRUD, classes, reservations create/cancel)
  - `backend/src/API/Controllers/ProgressController.cs` (`api/progress`: records/goals/notes)
  - `backend/src/API/Controllers/OperationsController.cs` (`api/operations`: budgets/equipment/shifts)
  - `backend/src/API/Controllers/StaffController.cs` (`api/staff`: list/create/toggle within the tenant)
  - `backend/src/API/Controllers/GymProfileController.cs` (`api/gym`: get/update)
  - `backend/src/API/Controllers/BillingController.cs` (`api/billing`: the gym's own SaaS subscription + invoices, read-only)
  - `backend/src/API/Middleware/ExceptionHandlingMiddleware.cs`
- `backend/src/API/Properties/launchSettings.json` (added July 16, 2026 — sets `ASPNETCORE_ENVIRONMENT=Development` so `dotnet run` loads user-secrets; without it the app started in Production and the connection string was missing)
- `backend/src/API/GymSaaS.Api.csproj`
- `backend/src/API/Program.cs`
- `backend/src/API/appsettings.json`
- `backend/src/API/appsettings.Development.json`
- `backend/src/API/Program.example.cs`
- `backend/src/Application/Abstractions/ITenantProvider.cs`
- `backend/src/Application/Abstractions/IJwtTokenService.cs`
- `backend/src/Application/Abstractions/IInviteCodeService.cs`
- `backend/src/Application/Abstractions/IEmailSender.cs` + `backend/src/Infrastructure/Email/ConsoleEmailSender.cs` (added July 16, 2026)
- `backend/src/Application/DTOs/Dashboard/*`
- `backend/src/Application/DTOs/CheckIns/*`
- `backend/src/Application/DTOs/Subscriptions/*`
- `backend/src/Application/DTOs/InviteCodes/*`
- `backend/src/Application/DTOs/Auth/*`
- `backend/src/Application/Payments/*`
- `backend/src/Application/Services/IMembershipStatusService.cs`
- `backend/src/Application/Services/MembershipStatusService.cs`
- `backend/src/Domain/Common/ITenantScoped.cs`
- `backend/src/Domain/Entities/*`
- `backend/src/Domain/Enums/*`
- `backend/src/Infrastructure/DependencyInjection.cs`
- `backend/src/Infrastructure/Persistence/GymSaaSDbContext.cs`
- `backend/src/Infrastructure/Persistence/PostgresOptions.cs`
- `backend/src/Infrastructure/Persistence/InviteCodeService.cs`
- `backend/src/Infrastructure/Persistence/Migrations/*`
- `backend/src/Infrastructure/Tenancy/ClaimsTenantProvider.cs`
- `backend/src/Infrastructure/Auth/JwtTokenService.cs`
- `backend/src/Infrastructure/Auth/JwtOptions.cs`

Backend domain entities:

- `Gym` (extended July 16, 2026 with SaaS lifecycle: `SubscriptionPlan`, `ApprovalStatus`, `TrialEndsAt`, `EmailVerified`, `EmailVerifiedAt`)
- `Plan` (+ `MaxClasses`)
- `Member` (extended July 16, 2026: `Gender`, `Age`, and current body metrics `HeightCm`/`WeightKg`/`ChestCm`/`ArmCm`/`WaistCm`/`HipCm`/`LegCm`. **`Email` is now nullable** — the client form marks Correo optional. The unique index `(TenantId, Email)` is kept as-is because Postgres treats NULLs as distinct, so several members may have no email.)
- `Subscription` (a **member's membership**; do not confuse with `SaasSubscription`)
- `Payment`
- `Attendance`
- `InviteCode` (not tenant-scoped, no `ITenantScoped`/query filter — must be checkable before any Gym/tenant exists)
- `User` (not tenant-scoped, same reasoning)
- Added July 16, 2026 — all `ITenantScoped` with a tenant query filter:
  - `Expense` (finance expenses; there was no expense entity before)
  - `Product` (inventory)
  - `ClassTemplate` (the catalog registered in Configuracion), `GymClass` (a concrete scheduled class), `Reservation`
  - `ProgressRecord`, `ProgressGoal`, `ProgressNote`
  - `Budget` (monthly limit per category; "spent" is derived from `Expense` rows, not stored), `Equipment`, `Shift`
  - `SaasSubscription` + `SaasInvoice` (see SaaS billing below)
- `UserToken` (added July 16, 2026 — not tenant-scoped; single-use expiring tokens for password reset and email verification. Only the SHA-256 hash is stored; the raw token exists only in the emailed link.)

Multi-tenant structure:

- Tenant is represented by `Gym`.
- Tenant-scoped entities use `TenantId`.
- `GymSaaSDbContext` includes global query filters using `ITenantProvider`.
- `ClaimsTenantProvider` (replaced `HeaderTenantProvider` on July 15, 2026) reads tenant id from the `tenant_id` claim on the authenticated JWT — no longer trusts a client-supplied header. `HeaderTenantProvider.cs` was deleted; the `Tenant:HeaderName` config entry was removed.
- `Attendance` records allowed and blocked check-in attempts per tenant/member.
- `Attendance` stores entry and optional exit timestamps for allowed visits.
- `CheckInController` exposes `POST /api/check-ins`, `POST /api/check-ins/check-out`, and `GET /api/check-ins/recent`; `RecordedByUserId`/`CheckedOutByUserId` are now populated from the authenticated principal (`ClaimTypes.NameIdentifier`), not client-supplied request fields.
- The backend rejects a second active entry and has a filtered unique index per tenant/member.

Authentication (added July 15, 2026):

- Real backend authentication replaces what was previously a no-op authorization policy (`"TenantStaff"` was `RequireAssertion(_ => true)`, i.e. it authorized everything) and the client-trusted `X-Tenant-Id` header.
- New `User` entity/table (`Users`): `Id`, `TenantId`, `Email` (globally unique, case-insensitive), `PasswordHash`, `FullName`, `Role` (`Owner`/`Admin`/`Reception`/`Trainer`), `IsActive`, `CreatedAt`. Deliberately **not** `ITenantScoped` (same reasoning as `InviteCode`): login must resolve the tenant from the email lookup before any tenant context exists.
- Passwords hashed via `Microsoft.AspNetCore.Identity.PasswordHasher<User>` (ships in the ASP.NET Core shared framework, no extra package).
- `AuthController` (`api/auth`, anonymous, rate-limited — see below):
  - `POST /api/auth/login`: `{ email, password }` -> `{ token, user }`.
  - `POST /api/auth/register-gym`: `{ gymName, city, phone, ownerName, email, password, acceptTerms, inviteCode }` -> `{ token, user }`. Wraps invite-code redemption (via `IInviteCodeService`, shared with `InviteCodesController`) and `Gym`+owner `User` creation in one DB transaction; slug is auto-generated from the gym name plus a random suffix.
- JWTs are signed HMAC-SHA256, carry `sub`/`ClaimTypes.NameIdentifier` (user id), `tenant_id` (custom claim, read by `ClaimsTenantProvider`), `ClaimTypes.Role`, email, and name. Config lives under `Jwt:*` (`Issuer`, `Audience`, `SigningKey`, `ExpiryMinutes`) in `appsettings*.json`, same override-via-environment-variable convention as the DB connection string. Default expiry is 720 minutes (12h); no refresh tokens — the frontend keeps the token in memory only (lost on refresh, same as before) and the user re-logs in.
- The `"TenantStaff"` authorization policy now requires an authenticated user (`RequireAuthenticatedUser()`).
- Rate limiting (added July 15, 2026): all anonymous, credential-guessable endpoints (`AuthController`'s login/register-gym, `InviteCodesController`'s validate/redeem) carry `[EnableRateLimiting("auth")]` — a fixed-window limiter, 10 requests/minute per client IP, configured in `Program.cs` via `AddRateLimiter`/`UseRateLimiter`. Rejections return 429 with a plain-string JSON body the frontend already knows how to surface.
- **Local dev secrets**: `appsettings.json`/`appsettings.Development.json` no longer contain a `Password=` in `ConnectionStrings:DefaultConnection` (removed July 15, 2026 — a real-shaped credential sitting in a committed file, even as a placeholder, was flagged as a risk in a security review). The project now has `UserSecretsId` set (`GymSaaS.Api.csproj`); each developer must run, once, from `backend/src/API`:
  ```
  dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=GymSaaS_Dev;Username=postgres;Password=postgres"
  ```
  (or whatever their local Postgres credentials are). This is machine-local, never committed. Production is unaffected — Coolify already fully overrides `ConnectionStrings:DefaultConnection` via its own environment variable, as before.

Account lifecycle, added July 16, 2026 (all on `AuthController`, anonymous + rate-limited unless noted):

- `GET /api/auth/me` (`[Authorize]`, `[DisableRateLimiting]`) -> current `AuthUserDto` from the token. The frontend calls it on load to re-validate a restored session before trusting it.
- `POST /api/auth/forgot-password` `{ email }` -> always 200 with the same generic message, whether or not the email exists (so it cannot be used to discover which emails are registered). If the user exists, a `UserToken` (`PasswordReset`, 1h expiry) is created and a reset link is emailed.
- `POST /api/auth/reset-password` `{ token, password }` -> validates the token (unused, unexpired), re-hashes the password, marks the token used.
- `POST /api/auth/verify-email` `{ token }` -> marks `Gym.EmailVerified`/`EmailVerifiedAt`.
- `register-gym` now also: stores the chosen `SubscriptionPlan` (the frontend collected it but **never sent it** before), sets `ApprovalStatus = Pending`, `TrialEndsAt = now + 14d`, creates the trial `SaasSubscription`, and emails an email-verification link (sent **after** the transaction commits, never inside it).
- Tokens are 32 random bytes, hex-encoded; only their SHA-256 hash is stored.
- **Login is deliberately NOT gated on approval or email verification** — a pilot gym must be able to work immediately. The status is stored and displayed ("Registro recibido, aprobacion pendiente"), not enforced. Flipping that to a hard gate is a one-line policy change in `Login`.
- `IEmailSender` (`Application/Abstractions/IEmailSender.cs`) with `ConsoleEmailSender` (`Infrastructure/Email/`) which **logs the email instead of sending it**. No real provider is wired yet: pick one (Resend/SendGrid/SES/SMTP) and register a different `IEmailSender` in `DependencyInjection`. Until then, password-reset and verification links only appear in the backend log.
- `Frontend:BaseUrl` config (in `appsettings*.json`) builds the emailed links: `{BaseUrl}/?reset=TOKEN` and `{BaseUrl}/?verify=TOKEN`. **The frontend does not yet read those query params** — the backend side is done, the UI to consume the links is not.

SaaS billing (added July 16, 2026):

- `SaasSubscription` — how a **gym pays us** (the platform). Named this way on purpose: `Subscription` already means a member's membership at a gym, and the two would be confused. Kept as rows rather than fields on `Gym` so plan changes and renewals have history. Fields: `PlanType`, `StartDate`, `EndDate`, `Status` (`Trial`/`Active`/`PastDue`/`Cancelled`).
- `SaasInvoice` — invoices issued to a gym: `Amount` (decimal), `Currency`, `IssuedAt`, `DueDate`, `PaidAt`, `Status`, `InvoiceUrl`.
- `GET /api/billing` returns the gym's own subscription + invoices. **Read-only on purpose**: invoices are issued by the platform operator, never self-served by the customer, so there is no create/update endpoint (same reasoning as invite codes). Both entities are tenant-query-filtered, so a gym can only ever see its own.
- Ported from the design in the user's local SQL Server `GymApp` database (`Gestion_Modelo_Saas` / `Saas_Invoices`), fixing money to `decimal(18,2)` (it was `int`/`nchar` there) and durations to real date types.

Invite codes (added July 13, 2026):

- `InviteCodesController` exposes `POST /api/invite-codes/validate` (read-only check, `{ code }` -> `{ isValid }`) and `POST /api/invite-codes/redeem` (`{ code }` -> `{ success, message }`, atomic `ExecuteUpdateAsync` compare-and-swap that sets `IsUsed`/`UsedAt` only if still unused). Both are intentionally anonymous (no `[Authorize]`) since they run before any account/tenant exists, and both are rate-limited (see Authentication above). The validate/redeem logic itself now lives in `IInviteCodeService`/`InviteCodeService` (`backend/src/Infrastructure/Persistence/InviteCodeService.cs`), shared with `AuthController.RegisterGym`; the controller is now a thin wrapper.
- Codes are matched case-insensitively (trimmed + upper-invariant) against `InviteCodes.Code`.
- No admin endpoint exists to generate codes (deliberately, to avoid an unauthenticated way to mint unlimited codes and defeat the capacity cap); codes are seeded directly into Postgres as needed.
- CORS is now configured (`Cors:AllowedOrigins` in appsettings, wired via `AddCors`/`UseCors` in `Program.cs`) since the frontend calls this API cross-origin for the first time. Production allows `https://gymassist.online`; add more origins there (not code changes) if needed.

PostgreSQL structure added:

- `appsettings.json` has `ConnectionStrings:DefaultConnection` (Npgsql-format: `Host=...;Port=...;Database=...;Username=...;Password=...`).
- `appsettings.Development.json` has a local Postgres example (placeholder credentials).
- `DependencyInjection.cs` registers:
  - `GymSaaSDbContext`
  - PostgreSQL provider via `UseNpgsql` (package `Npgsql.EntityFrameworkCore.PostgreSQL`)
  - `ITenantProvider` (-> `ClaimsTenantProvider`)
  - `IMembershipStatusService`
  - `IInviteCodeService`, `IJwtTokenService`
  - `IEmailSender` (-> `ConsoleEmailSender`; swap this for a real provider in production)
  - `IPasswordHasher<User>`
  - `IHttpContextAccessor`
- `PostgresOptions` (`Infrastructure/Persistence/PostgresOptions.cs`) configures `EnableSensitiveDataLogging` and `CommandTimeoutSeconds` under the `Postgres` config section.
- `Program.example.cs` shows how to call `AddInfrastructure(builder.Configuration)`.
- The backend was originally built for SQL Server and was switched to PostgreSQL on July 13, 2026: package reference, `UseNpgsql`, connection string format, and the `Attendances` filtered-unique-index raw SQL in `GymSaaSDbContext.cs` (was T-SQL bracket/bit syntax `[AccessGranted] = 1`, now `"AccessGranted" = true`). At that point no EF Core migrations existed yet, so nothing needed porting; the migrations listed below were all created afterwards, Postgres-first.

## Local development environment (set up July 16, 2026)

PostgreSQL 16.6 was installed locally on this machine using the **official portable binaries** (zip from `get.enterprisedb.com`, no installer, no admin rights):

| | |
|---|---|
| Binaries | `D:\pgsql` (includes pgAdmin 4) |
| Data directory | `D:\pgdata` |
| Port | `5432` (the machine also runs SQL Server Express on 1433 — no conflict) |
| Superuser | `postgres` — the password is **not written here on purpose** (this repo is public). It already lives in this machine's user-secrets. |
| Database | `GymSaaS_Dev` |

The connection string is stored machine-locally via user-secrets and is never committed:

```bash
# from backend/src/API — only needed once per machine, or if the cluster is recreated
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=GymSaaS_Dev;Username=postgres;Password=<local password>"
dotnet user-secrets list   # shows the value currently configured on this machine
```

**It is NOT registered as a Windows service**, so it does not start automatically after a reboot. Start it with:

```bash
D:\pgsql\bin\pg_ctl -D D:\pgdata -l D:\pgdata\server.log start
```

(`pg_ctl -D D:\pgdata status` to check, `stop` to stop.) Registering it as a service needs admin rights and has not been done.

Run the whole stack locally:

```bash
# backend (http://localhost:5080) — needs Postgres running first
dotnet run --project backend/src/API/GymSaaS.Api.csproj

# frontend (http://localhost:5173) — frontend/.env.local points it at the backend
cd frontend && npm run dev
```

`launchSettings.json` sets `ASPNETCORE_ENVIRONMENT=Development`, which is what makes user-secrets load. Without it `dotnet run` starts in Production and fails with "Connection string 'DefaultConnection' is required."

## Why PostgreSQL and not SQL Server (decided July 16, 2026)

The machine also has a SQL Server Express database `GymApp` (`JOHAN\SQLEXPRESS`) with an earlier, hand-made schema: `ETGimnasio`, `ETUsuarioGym`, `ETRoles`, `ETProductos`, `ETVentas`, `ETDetalleVentas`, `PMPagos`, `PMPlanesMembresia`, `Gestion_Modelo_Saas`, `Saas_Invoices`. **The decision is to stay on PostgreSQL.** Reasons, for the record:

- Production already runs Postgres on Coolify and is live at `gymassist.online`.
- The backend is Npgsql-based and uses Postgres-specific SQL (the filtered unique index on `Attendances`).
- **The project is code-first**: the C# entities + EF migrations *are* the schema; the database is generated from them. Designing tables by hand in SSMS and porting later would create two designs that diverge.
- `Program.cs` runs `dbContext.Database.Migrate()` at startup, so a hand-created schema would break the migration history and the app would fail to start.
- SQL Server Express caps at 10 GB per database.
- Those tables were checked and are **empty** (only `ETGimnasio` 2 rows, `ETRoles` 1, `ETUsuarioGym` 1) — there was nothing to migrate.

`GymApp` was left untouched as a **design reference**. Its ideas are being ported into the EF model instead (SaaS billing already was; product sales are still pending — see Known gaps).

## Known gaps (as of July 16, 2026)

- **Product sales (POS) are not implemented.** The Inventario tab says "Registra productos vendidos en la recepcion" and shows inventory value, but nothing records a sale. Needs `Sale`/`SaleItem` entities, stock decrement on sale, and the sale feeding Finanzas income. The user's SQL Server design (`ETVentas`/`ETDetalleVentas`) modelled this; it was deliberately deferred.
- **No real email provider.** `ConsoleEmailSender` only logs; password-reset and verification emails are not delivered.
- **Frontend does not consume the `?reset=` / `?verify=` links** the backend emails.
- **No DB backups and no monitoring/alerting** configured on Coolify (needs the user's Coolify access).
- `FinanceController.GetSummary` returns **all** paid payments and expenses (not truncated) because the frontend derives analytics and per-category totals from those lists; a `Take(n)` would silently skew them. This will need pagination or server-side aggregation as data grows.
- No admin/super-user surface: invite codes and SaaS invoices are inserted straight into Postgres by the operator.

Important backend note:

- `GymSaaS.Api.csproj` and `Program.cs` are committed; `dotnet build` succeeds with 0 errors after the PostgreSQL switch.
- `dotnet run --project backend/src/API/GymSaaS.Api.csproj` starts Kestrel successfully, but DB-backed endpoints (e.g. `/api/check-ins/recent`) return 500 without a reachable PostgreSQL server at the `DefaultConnection` string.
- As of July 16, 2026 **every business feature of a real gym goes through the backend** (see the two-mode note under Frontend). A missing database now blocks real gyms entirely; demo accounts still work offline.
- EF Core migrations under `backend/src/Infrastructure/Persistence/Migrations/`, in order: `InitialCreate`, `AddInviteCodes`, `AddUsersAndGymCity`, `AddBusinessEntities` (July 16 — the 11 new business tables + Member/Gym/Plan columns), `MakeMemberEmailOptional`, `AddUserTokens`, `AddSaasBilling`. Seven total. `Program.cs` runs `dbContext.Database.Migrate()` at startup so deploys apply pending migrations automatically, no manual step needed.
- **EF tooling quirk to know about:** `dotnet ef migrations add` with `--output-dir ../Infrastructure/Persistence/Migrations --namespace GymSaaS.Infrastructure.Persistence.Migrations` writes the migration to the right place but drops an **extra `GymSaaSDbContextModelSnapshot.cs` into `backend/src/API/GymSaaS/Infrastructure/Persistence/Migrations/`**. Two snapshots = `CS0579 Duplicate 'DbContext' attribute` and the build breaks. After every `migrations add`, copy that stray snapshot over `backend/src/Infrastructure/Persistence/Migrations/GymSaaSDbContextModelSnapshot.cs` and delete the stray `backend/src/API/GymSaaS/` folder.
- **Verified end-to-end against a real PostgreSQL on July 16, 2026** (this replaces the earlier "not verified" caveat). Against the local Postgres described above: all 7 migrations applied cleanly (22 tables; the Postgres-syntax filtered unique index on `Attendances` created correctly), and a 33-check integration suite passed 33/33:
  - **Multi-tenant isolation** — two gyms (Alfa, Beta) registered through the real API. Beta sees none of Alfa's members/plans/products/revenue, and — the important part — direct **cross-tenant access by id** (edit, delete, suspend, check-in, stock update using Alfa's exact ids) all return **404**, with Alfa's data left intact. The isolation comes from the `HasQueryFilter` on every `ITenantScoped` entity plus the `tenant_id` JWT claim via `ClaimsTenantProvider`.
  - Clean workspace (a new gym starts empty), real persistence (a payment shows in that gym's revenue and not the other's), duplicate check-in blocked by the filtered unique index (409), single-use invite codes (409 on reuse), `401` without a token, and the SaaS trial subscription created at registration with the chosen plan.
  - **Browser end-to-end:** logged into the frontend as a real Postgres-backed gym, saw its data, **hard-refreshed the page, and stayed logged in with the data intact** — the exact behaviour that was broken before.
  - The test script lived in a temp scratchpad and was not kept in the repo. It is worth re-creating as a permanent integration test.
- **Still not deployed.** All of the July 16 work is local-only and uncommitted; the Coolify deployment still runs the pre-July-16 code.
- Deployment: a self-hosted Coolify instance ("Back-end Server") has this repo's `backend/` wired up as a Dockerfile-based application (Base Directory `/backend`, Ports Exposes `8080`), plus a separate PostgreSQL database resource, both running as of July 13, 2026. The real connection string/credentials live only in Coolify's Environment Variables for that app, never in this repo (the GitHub repo is public).
- Verified live end-to-end on July 13, 2026: the migration applied automatically on deploy (all tables + indexes created, including the Postgres-syntax filtered unique index on `Attendances`), and `/api/check-ins/recent` returns `200 []` with a tenant header.
- Domain: `https://gymassist.online` was reassigned to the frontend app (see Frontend > Deployment), so the backend now runs on Coolify's auto-generated domain, currently `http://rtd0nqdvy8gwlo6zwwrtigtr.67.207.90.99.sslip.io`. No DNS wildcard exists for `*.gymassist.online` (confirmed via `nslookup`), so a subdomain like `api.gymassist.online` would need an A record added at the registrar before it could be used here.

## Git Status Notes

This history (`bc260ce` … `2e88a8b`) is from the prior `D:\GYM` / `GymRepos.git` / `develop` workspace and predates this repo's history; it's kept here only as background on prior feature work, not as this repo's log.

This repo (`GymProyectChanges.git`) history, oldest to newest:

- `1ab8650 Create Test` (initial placeholder commit made via the GitHub UI)
- `8f6a11a Add Gym SaaS dashboard project (frontend + backend)` (imported the full project from the `D:\GYM` workspace onto `main`)
- `17e65d6 Switch backend from SQL Server to PostgreSQL`
- `cb95d15 Add initial EF Core migration and frontend Docker deployment`
- `439d5f6 Add invite-code gate for gym registration`
- `4155c8f Add real backend authentication and harden security posture` (the July 15, 2026 work — this **is** committed; an earlier version of this file wrongly said it was still pending)

Current branch for ongoing feature work:

- `main`, in sync with `origin/main` up to `4155c8f` as of this note.
- **As of July 16, 2026 there is a large uncommitted change set** (deliberately left uncommitted so far): the whole persistence layer described above. Roughly — backend: 13 new entities, 4 new migrations, 10 new controllers + their DTOs, exception/logging middleware, password reset + email verification, SaaS billing, `launchSettings.json`; frontend: `apiClient.js`, `session.js`, `gymApi.js`, `adapters.js` (all new) plus a heavily rewired `App.jsx` and small `await` fixes in `AccessManagement.jsx`, `CheckInDashboard.jsx`, `ClassSchedule.jsx`, `InventoryDashboard.jsx`. Run `git status --short` to see the exact set.
- Nothing of this has been deployed to Coolify yet.

July 16, 2026 session — turning the prototype into a real system:

- The starting problem: the app looked feature-complete but **almost nothing persisted**. All business data lived in React `useState` seeded from demo constants — not even in `localStorage` — so a gym could register 50 clients and lose everything on refresh. Only auth talked to the backend, and `DashboardController`/`SubscriptionController`/`CheckInController` existed but nothing called them.
- Built the whole missing persistence layer (entities, migrations, controllers) and rewired every frontend handler to it, keeping demo accounts local.
- Added Tier 2 account lifecycle: password reset, email verification, `/auth/me`, global exception + request logging middleware.
- Ported SaaS billing from the user's SQL Server design and decided to stay on PostgreSQL (see that section).
- Installed PostgreSQL 16.6 locally and verified everything, including multi-tenant isolation (33/33).
- Bugs/gaps found and fixed along the way:
  - `Member.Email` was required while the client form marks Correo optional -> made nullable.
  - The UI let you change plan when renewing, but the membership endpoint could not -> added optional `PlanName` to `UpdateMembershipRequest`.
  - The registration form collected a SaaS plan that was **never sent** to the backend -> now sent and stored.
  - Truncating finance lists to 10 would have silently skewed the frontend's analytics and category totals (they are derived from those lists) -> lists are returned in full.
  - No `launchSettings.json`, so `dotnet run` used Production and never loaded user-secrets -> added.
  - Making handlers async broke 5 component call sites that consumed their return values synchronously (`AccessManagement`, `CheckInDashboard` x2, `ClassSchedule` x2, `InventoryDashboard`) -> they now `await`. `ClassSchedule` also needed the server-assigned class id returned so it selects the right class.

Most recent frontend changes:

- Added self-service gym registration and automatic owner provisioning.
- Added locally persisted tenant registration records and clean workspaces for newly registered gyms.
- Added pending approval, email verification, plan, and trial status indicators.
- Isolated user management by gym tenant and kept registered accounts out of the demo-account picker.
- Added role-aware product inventory management.
- Added product creation, editing, deletion, searching, category filtering, and low-stock alerts.
- Added quantity-only inventory controls for reception.
- Added advanced analytics for member movement, retention, churn, revenue mix, and peak attendance hours.
- Added six-month and twelve-month analytics periods with generated business insights.
- Added an analytics permission for owners and administrators.
- Added member progress tracking with measurement history, trend charts, goals, and trainer notes.
- Added a dedicated progress permission for owners, administrators, and trainers.
- New progress measurements update the member's current body metrics.
- Added frontend demo authentication with Owner, Administrator, Reception, and Trainer roles.
- Added permission-filtered navigation and protected actions.
- Added user creation and account activation/deactivation.
- Added class scheduling, capacity management, client reservations, and cancellations.
- Added Operations for expense budgets, equipment maintenance, shifts, and commissions.
- Expanded expense registration with Infrastructure, Machinery, and Services categories.
- Added expense date, payment method, and optional provider fields.
- Added expense totals grouped by category.
- Replaced the revenue-only chart with a combined income, expenses, and users chart.
- Registering an expense now updates the current month's expense bar immediately.
- CSV finance exports now include the additional expense fields.
- Expanded the `Finanzas` tab with income, expense, net-profit, and receivables metrics.
- Added a six-month revenue chart and overdue receivables panel.
- Added working quick actions for payment registration, expense registration, and CSV report download.
- Finance quick actions update the in-memory dashboard data immediately.
- Added `Check-in` tab for entrance validation and attendance logging.
- Blocked access is recorded when a member plan is expired.
- Check-in dashboard shows daily allowed entries, blocked attempts, expiring plans, and recent history.
- Added `Gimnasio` tab for gym profile and admin user data.
- Added plan registration and registered plans table.
- Client creation form now uses registered plans as its plan options.
- Tabs layout now adapts to more than three tabs.
- Added suggested next features in the gym setup screen:
  - Automatic renewal reminders.
  - Check-in and access control.
  - Payments and overdue balances.
  - Client progress tracking.
- Frontend validated with `npm run build`.
- Updated `CONTEXT.md` with the current continuation notes.
- Renamed the "Mensualidad" members-table filter column label to "Membresia".
- Redesigned the "Crear cliente" form: reordered fields into a Nombre/Genero/Edad row, then Peso/Altura, then Telefono/Correo (Correo is now optional); added a new Edad field.
- Added a "Biometria" section to the client form with Pecho, Brazo, Cintura, Cadera, and Pierna measurements (Brazo and Pierna are new fields).
- Replaced the client form's dynamic plan dropdown with a "Membresia" section offering fixed plan choices (Diario, Semanal, Mensual, Anual, VIP) plus a "Valor de la suscripcion" input.
- Uppercased all field and section titles in the client form; renamed its submit button to "Finalizar registro" and moved it under the Membresia section.
- Removed the now-unused dynamic `planOptions` wiring between `App.jsx` and `ClientForm`.
- Added plan management to the Gym Setup "Planes registrados" table: edit (pre-fills the plan form) and delete actions with minimalist custom SVG icons instead of text/emoji.
- Made plan updates match by plan `id` first, falling back to name-based dedupe only for genuinely new plans, so renaming a plan while editing no longer creates a duplicate.
- Replaced the native browser confirm dialog for plan deletion with a custom modal matching the app's card design (rounded-lg, gray borders, rose destructive button).
- Renamed the "Gimnasio" navigation tab to "Configuracion".
- Verified all changes by fetching each changed file's compiled output from the running Vite dev server (in-browser visual verification tools were unavailable this session).
- Updated `CONTEXT.md` again with this session's continuation notes.
- Redesigned the Check-in tab (July 6, 2026): replaced the search-cards-plus-side-panel layout with a members-database-style table (Miembro, Membresia, Estado, Vence, Acciones) keeping only the name filter.
- Added per-row `Validar entrada` / `Validar salida` buttons; entry records the pressed date/time and is disabled for expired or suspended plans or while the client is inside.
- Added a `Suspendida` status to check-in, connected to the Finanzas suspend/reactivate action, and blocked suspended entries with reason "Plan suspendido".
- Added a `Revisar pago` button on expired/suspended rows (finance-permission roles only) that opens Finanzas with the Registrar pago panel auto-opened and pre-filtered by the member's name (`financeIntent` state in `App.jsx`, `initialAction`/`initialPaymentQuery`/`onInitialActionConsumed` props in `FinancialDashboard`).
- Verified in the browser preview: entry/exit flows, suspension reflection, Revisar pago navigation, intent consumption (manual Finanzas visits do not auto-open the panel), and reception role hiding Revisar pago. `npm run build` passes.
- Redesigned the "Programar clase" panel (July 6, 2026): left member picker with name search (avatar, name, email, highlighted selection), vertical divider, class form on the right, and a single `Confirmar reserva` button replacing `Crear clase`.
- Creating a class now also registers the selected member's reservation in one step via `handleCreateClassWithReservation` in `App.jsx` (replaces `handleCreateClass`); member validation (missing, suspended, expired) rejects the submit without creating the class.
- Added suspended-membership blocking to `handleReserveClass` so suspended clients cannot reserve existing classes either.
- Verified in the browser preview: member filter, no-member and expired-member rejections, and the success flow (class count, active reservations, attendee list, and form reset). `npm run build` passes.
- Added a class catalog (July 6, 2026): `classCatalog` state in `App.jsx` seeded from the demo classes, reset per workspace like plans, with `handleSaveClassTemplate` / `handleDeleteClassTemplate` (id-first update, name dedupe).
- Added to Configuracion, below "Planes registrados": a "Registrar clase"/"Editar clase" form (name, trainer, duration, capacity, room) and a "Registro de clases" table with pencil/trash actions and a delete confirmation modal, mirroring the plans UX.
- "Programar clase" now takes its Clase field from the catalog as a select; selecting a class auto-fills trainer, duration, capacity, and room (editable), with an empty-catalog hint pointing to Configuracion.
- Verified in the browser preview: seeded catalog table, Pilates registration, Funcional edit (capacity 10 to 14), Spinning deletion via modal, catalog options and auto-fill in Programar clase, and a full class-plus-reservation creation from a template. `npm run build` passes.
- Added real backend authentication (July 15, 2026, see Authentication above): `handleLogin`/`handleRegisterGym` in `App.jsx` now call the real backend for registered-gym accounts via new `frontend/src/authApi.js`; demo accounts stay local-only by design. Plaintext passwords are no longer written to `localStorage`. `AuthScreen.jsx`'s login submit is now async (was a bug risk once `onLogin` became async — fixed with a loading state on the submit button). `redeemInviteCode` was removed from `inviteCodeApi.js` (dead code — redemption now happens server-side inside `register-gym`); `validateInviteCode` is unchanged. Verified in the browser preview: demo login/logout, and graceful failure of the invite-code check when the backend is unreachable. `npm run build` passes.

In the next chat, first run:

```bash
git status --short
```

There is a large uncommitted change set from July 16, 2026 (see Git Status Notes). Decide whether to commit and push it.

## Next steps, in priority order

1. **Commit and push the July 16 work**, then deploy to Coolify. Migrations apply themselves at startup, so the deploy should create the new tables automatically — but watch the deploy log the first time, since this migration is much bigger than previous ones.
2. **Database backups + monitoring on Coolify** — needed before any real gym trusts this with their data. Not started; needs the user's Coolify access.
3. **Pick and wire a real email provider** — until then password reset and email verification links only appear in the backend log, so those flows do not actually work for a user.
4. **Frontend handling of `?reset=` / `?verify=` links** (the backend already emails them).
5. **Product sales (POS)** — the Inventario tab promises it and nothing implements it.
6. Re-create the multi-tenant isolation test as a permanent integration test in the repo.

## How To Continue In A New Chat

Paste this instruction:

```text
Continue from D:\Original Gym\GymProyectChanges-develop. Read CONTEXT.md first, then run git status --short. Do not restart from scratch.
```

To run the stack locally, start PostgreSQL first (`D:\pgsql\bin\pg_ctl -D D:\pgdata -l D:\pgdata\server.log start`) — it is not a Windows service and does not survive a reboot. See "Local development environment".
