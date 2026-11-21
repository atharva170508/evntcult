-- Category-adaptive setup (team size, format, age limit, lineup, speakers...), as JSON.
-- See src/lib/categories.ts for the shape each category uses.
ALTER TABLE events ADD COLUMN category_config TEXT;
