-- Data fix: emails are not case-sensitive in practice. Existing rows created with mixed case
-- (before login normalization was added) would otherwise stay permanently unable to log in
-- unless typed with that exact original casing.
UPDATE "users" SET "email" = LOWER("email") WHERE "email" <> LOWER("email");
UPDATE "athletes" SET "email" = LOWER("email") WHERE "email" <> LOWER("email");
