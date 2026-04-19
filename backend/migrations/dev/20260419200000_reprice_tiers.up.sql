ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'ONESHOT';

DELETE FROM user_subscriptions
WHERE subscription_id IN (SELECT id FROM subscriptions WHERE tier = 'FREE');

DELETE FROM subscriptions WHERE tier = 'FREE';

INSERT INTO subscriptions (tier, name, price_uah, max_satellite_tries, max_csv_tries) VALUES
    ('ONESHOT', 'One-Shot', 500, 0, 1);

UPDATE subscriptions SET price_uah = 1700, max_satellite_tries = 5, max_csv_tries = 5  WHERE tier = 'BASIC';
UPDATE subscriptions SET max_csv_tries = 100                                             WHERE tier = 'PRO';
