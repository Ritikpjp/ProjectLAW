#!/bin/sh
set -e
# Create or update tables (additive only; a destructive change makes this fail instead of deleting data).
npx prisma db push --skip-generate
# Upsert-only: adds the exams and sections if missing, never removes anything.
npm run seed
exec npx next start -H 0.0.0.0 -p 3000
