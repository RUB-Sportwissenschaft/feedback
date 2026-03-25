CREATE TABLE feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  data jsonb NOT NULL
);

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert" ON feedbacks FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select" ON feedbacks FOR SELECT TO anon USING (true);
