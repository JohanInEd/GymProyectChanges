#!/usr/bin/env bash
#
# List the staff/owner accounts registered in the GymSaaS database, grouped by gym.
#
# Usage:
#   DATABASE_URL="postgresql://user:pass@host:5432/dbname" ./scripts/list-users.sh
#
# Optional filters (environment variables):
#   GYM="Titan"     only accounts whose gym name matches (case-insensitive substring)
#   EMAIL="@titan"  only accounts whose email matches (case-insensitive substring)
#
# About passwords:
#   Passwords are NOT stored and CANNOT be listed. The "Users" table only holds a
#   one-way PBKDF2 hash (ASP.NET Core PasswordHasher). There is no plaintext to show,
#   by design: a leaked database must not expose customer passwords. The correct way to
#   help a locked-out user is the reset flow (POST /api/auth/forgot-password), which
#   emails them a single-use link — never to read or set their password for them.
#
# Notes:
#   - DATABASE_URL contains a password: pass it from the environment, never hard-code it.
#     In Coolify, run this from the Postgres resource Terminal where $POSTGRES_USER and
#     $POSTGRES_DB are already set (see the psql line at the bottom of this file).
#   - PG_BIN can point at a PostgreSQL bin directory if psql is not on PATH,
#     e.g. PG_BIN="D:/pgsql/bin" on this Windows machine.

set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  echo 'Example: DATABASE_URL="postgresql://postgres:pass@localhost:5432/GymSaaS_Dev" ./scripts/list-users.sh' >&2
  echo 'Inside the Coolify Postgres terminal, no script is needed — see the note at the end of this file.' >&2
  exit 1
fi

PSQL="psql"
if [ -n "${PG_BIN:-}" ]; then
  PSQL="${PG_BIN%/}/psql"
fi

# Build the optional WHERE clause in bash. Single quotes in a filter are doubled so a value
# like  O'Brien  cannot break out of the SQL string literal.
WHERE=""
if [ -n "${GYM:-}" ]; then
  esc="${GYM//\'/\'\'}"
  WHERE="${WHERE} AND g.\"Name\" ILIKE '%${esc}%'"
fi
if [ -n "${EMAIL:-}" ]; then
  esc="${EMAIL//\'/\'\'}"
  WHERE="${WHERE} AND u.\"Email\" ILIKE '%${esc}%'"
fi

"$PSQL" "$DATABASE_URL" <<SQL
\pset border 2
\pset null '(vacio)'

SELECT
    g."Name"                                   AS gimnasio,
    u."Email"                                  AS correo,
    u."FullName"                               AS nombre,
    CASE u."Role"
        WHEN 0 THEN 'Owner'
        WHEN 1 THEN 'Admin'
        WHEN 2 THEN 'Reception'
        WHEN 3 THEN 'Trainer'
        ELSE u."Role"::text
    END                                        AS rol,
    CASE WHEN u."IsActive" THEN 'si' ELSE 'NO' END AS activo,
    -- The password is a one-way hash; there is nothing to display.
    'hash PBKDF2 (no recuperable)'             AS contrasena,
    to_char(u."CreatedAt", 'YYYY-MM-DD HH24:MI') AS registrado
FROM "Users" u
LEFT JOIN "Gyms" g ON g."Id" = u."TenantId"
WHERE 1 = 1${WHERE}
ORDER BY g."Name" NULLS FIRST, u."Role", u."CreatedAt";

SELECT count(*) AS total_usuarios FROM "Users";
SQL

# ---------------------------------------------------------------------------
# Running it straight from the Coolify Postgres Terminal (no DATABASE_URL needed).
# Paste this as ONE line. It uses PostgreSQL dollar-quoting ($$...$$) for the text
# literals so there are no single quotes to fight with inside the shell's -c '...'.
#
#   psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c 'SELECT g."Name" AS gimnasio, u."Email" AS correo, u."FullName" AS nombre, CASE u."Role" WHEN 0 THEN $$Owner$$ WHEN 1 THEN $$Admin$$ WHEN 2 THEN $$Reception$$ WHEN 3 THEN $$Trainer$$ END AS rol, u."IsActive" AS activo, u."CreatedAt" AS registrado FROM "Users" u LEFT JOIN "Gyms" g ON g."Id"=u."TenantId" ORDER BY g."Name", u."Role";'
# ---------------------------------------------------------------------------
