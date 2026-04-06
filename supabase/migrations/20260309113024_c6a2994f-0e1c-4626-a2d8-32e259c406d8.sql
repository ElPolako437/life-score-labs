ALTER TABLE goal_plans ADD COLUMN IF NOT EXISTS secondary_goal text DEFAULT '';
ALTER TABLE goal_plans ADD COLUMN IF NOT EXISTS follow_up_answers jsonb DEFAULT '{}';
ALTER TABLE goal_plans ADD COLUMN IF NOT EXISTS pillar_assessment jsonb DEFAULT '{}';