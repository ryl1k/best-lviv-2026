CREATE TYPE subscription_tier AS ENUM ('FREE', 'BASIC', 'PRO');

CREATE TABLE subscriptions (
    id                  BIGSERIAL PRIMARY KEY,
    tier                subscription_tier NOT NULL,
    name                VARCHAR(100)      NOT NULL,
    price_uah           NUMERIC(10,2)     NOT NULL DEFAULT 0,
    max_satellite_tries INT               NOT NULL DEFAULT 0,
    max_csv_tries       INT               NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE TABLE user_subscriptions (
    id                   BIGSERIAL PRIMARY KEY,
    user_id              BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id      BIGINT      NOT NULL REFERENCES subscriptions(id),
    satellite_tries_used INT         NOT NULL DEFAULT 0,
    csv_tries_used       INT         NOT NULL DEFAULT 0,
    starts_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at           TIMESTAMPTZ NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_sub_user_id   ON user_subscriptions(user_id);
CREATE INDEX idx_user_sub_active    ON user_subscriptions(user_id, expires_at);

CREATE TABLE subscription_transactions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id BIGINT        NOT NULL REFERENCES subscriptions(id),
    amount_uah      NUMERIC(10,2) NOT NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sub_tx_user_id ON subscription_transactions(user_id);

INSERT INTO subscriptions (tier, name, price_uah, max_satellite_tries, max_csv_tries) VALUES
    ('FREE',  'Безкоштовний', 0,    0,  1),
    ('BASIC', 'Базовий',      299,  0,  1),
    ('PRO',   'Професійний',  9999, -1, -1);
