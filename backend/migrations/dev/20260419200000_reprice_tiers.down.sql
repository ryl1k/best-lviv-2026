DELETE FROM subscriptions WHERE tier = 'ONESHOT';

UPDATE subscriptions SET price_uah = 299,  max_satellite_tries = 0, max_csv_tries = 1   WHERE tier = 'BASIC';
UPDATE subscriptions SET max_csv_tries = -1                                              WHERE tier = 'PRO';

INSERT INTO subscriptions (tier, name, price_uah, max_satellite_tries, max_csv_tries) VALUES
    ('FREE', 'Безкоштовний', 0, 0, 1);
