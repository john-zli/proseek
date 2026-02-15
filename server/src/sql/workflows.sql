CREATE TABLE IF NOT EXISTS core.workflow_run_status (
  status        varchar(20) PRIMARY KEY
);

INSERT INTO core.workflow_run_status(status) VALUES
  ('queued'),
  ('running'),
  ('completed'),
  ('failed'),
  ('cancelled')
ON CONFLICT DO NOTHING;

-- Workflow Runs Audit Log Table
CREATE TABLE IF NOT EXISTS core.workflow_runs (
  run_id                    uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name             varchar(100)        NOT NULL,
  payload                   jsonb,

  -- Status and timing
  status                    varchar(20)         NOT NULL DEFAULT 'queued',
  
  -- TODO(johnli): Add a priority column?
  -- Timing information
  started_timestamp         timestamp,
  completed_timestamp       timestamp,
  deletion_timestamp        timestamp,
  creation_timestamp        timestamp           DEFAULT now(),
  modification_timestamp    timestamp           DEFAULT now(),

  -- BullMQ specific fields
  is_recurring              boolean             NOT NULL,
  
  CONSTRAINT status_fk FOREIGN KEY (status)
    REFERENCES core.workflow_run_status(status)
);

-- Indexes for performance
DO $$
BEGIN
  IF NOT EXISTS ( SELECT 1
                  FROM  pg_indexes
                  WHERE schemaname = 'core'
                    AND tablename = 'workflow_runs'
                    AND indexname = 'workflow_runs_status_idx'
  ) THEN
    CREATE INDEX workflow_runs_status_idx ON core.workflow_runs (status);
  END IF;
END $$;
