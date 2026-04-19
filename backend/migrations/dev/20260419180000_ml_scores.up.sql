CREATE TABLE IF NOT EXISTS ml_scores (
    task_id UUID NOT NULL,
    tax_id  TEXT NOT NULL,
    score   REAL NOT NULL,
    PRIMARY KEY (task_id, tax_id)
);
