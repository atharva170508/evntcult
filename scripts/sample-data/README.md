# Removing the sample data

`npm run seed` / `npm run seed:remote` fill the database with demo events and ~1,600 demo students
(Valorant Campus Showdown, RoboWars 2026, Aarav Mehta, Diya Sharma, ...). These files remove them again.

Sample rows are easy to tell apart: their ids are short (`evt_00001a`, `usr_000003`, `reg_...`).
Everything the app creates for real people has a long random id, so it is never touched.
A sample user who organizes a real event is kept so that event keeps working.

**1. See what would be deleted (changes nothing):**

```
npx wrangler d1 execute evntcult-db --remote --file scripts/sample-data/preview.sql
```

**2. Delete it (cannot be undone):**

```
npx wrangler d1 execute evntcult-db --remote --file scripts/sample-data/cleanup.sql
```

Use `--local` instead of `--remote` to try it on your own computer first.
Don't run `npm run seed:remote` afterwards, or the sample data comes back.
