-- migrate_currency.sql

-- 1. Rename the column in the albums table from price_usd to price_zar
ALTER TABLE albums RENAME COLUMN price_usd TO price_zar;

-- No need to update the data, as the user was treating the values as ZAR but entering them in a USD field.
-- If they actually entered 10 USD (which means 185 ZAR), they will need to update their album price manually.
-- But the instructions say "make the base price rands", implying the integer stored should now represent Rands natively.
