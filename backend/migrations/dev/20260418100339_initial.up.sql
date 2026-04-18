CREATE TYPE task_status AS ENUM(
    'PENDING', 
    'PROCESSING', 
    'COMPLETED', 
    'FAILED'
);

CREATE TYPE resolution_status AS ENUM(
    'NEW', 
    'IN_REVIEW', 
    'CONFIRMED', 
    'DISMISSED'
);

CREATE TYPE severity AS ENUM(
    'LOW', 
    'MEDIUM', 
    'HIGH'
);

CREATE TYPE rule_code AS ENUM(
    'R01_TERMINATED_STILL_HAS_LAND',
    'R02_PURPOSE_MISMATCH',
    'R03_LAND_WITHOUT_ESTATE',
    'R04_INVALID_TAX_ID',
    'R05_DUPLICATE_RECORD',
    'R06_NAME_INCONSISTENCY',
    'R07_INCOMPLETE_RECORD'
);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tasks (
    id            UUID PRIMARY KEY,
    status        task_status  NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at  TIMESTAMPTZ,
    error_message TEXT,
    stats         JSONB
);

CREATE TABLE land_records (
    id              BIGSERIAL PRIMARY KEY,
    task_id         UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    cadastral_num   VARCHAR(64),
    koatuu          VARCHAR(32),
    ownership_form  TEXT,
    purpose_code    VARCHAR(16),
    purpose_text    TEXT,
    location        TEXT,
    land_use_type   TEXT,
    area_ha         NUMERIC(14,4),
    normative_value NUMERIC(18,4),
    tax_id          VARCHAR(16),
    owner_name      TEXT,
    share           NUMERIC(10,6),
    registered_at   DATE,
    raw             JSONB
);
CREATE INDEX idx_land_tax_id ON land_records(task_id, tax_id);
CREATE INDEX idx_land_cad    ON land_records(task_id, cadastral_num);

CREATE TABLE estate_records (
    id            BIGSERIAL PRIMARY KEY,
    task_id       UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tax_id        VARCHAR(16),
    owner_name    TEXT,
    object_type   TEXT,
    address       TEXT,
    address_norm  TEXT,
    registered_at DATE,
    terminated_at DATE,
    area_m2       NUMERIC(14,4),
    co_ownership  TEXT,
    share         NUMERIC(14,4),
    raw           JSONB
);
CREATE INDEX idx_estate_tax_id ON estate_records(task_id, tax_id);
CREATE INDEX idx_estate_term   ON estate_records(task_id, terminated_at) WHERE terminated_at IS NOT NULL;

CREATE TABLE discrepancies (
    id                BIGSERIAL PRIMARY KEY,
    task_id           UUID              NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    rule_code         rule_code         NOT NULL,
    severity          severity          NOT NULL,
    risk_score        INT               NOT NULL,
    tax_id            VARCHAR(16),
    owner_name        TEXT,
    description       TEXT,
    details           JSONB,
    resolution_status resolution_status NOT NULL
);

CREATE INDEX idx_disc_task_severity ON discrepancies(task_id, severity);
CREATE INDEX idx_disc_task_rule     ON discrepancies(task_id, rule_code);
CREATE INDEX idx_disc_tax_id        ON discrepancies(task_id, tax_id);