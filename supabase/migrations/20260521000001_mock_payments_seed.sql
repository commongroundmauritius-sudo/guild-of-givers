-- Seed an impact pool initiative if it doesn't exist
INSERT INTO public.initiatives (title, description, is_impact_pool, goal_amount_mur, current_amount_mur, is_approved, is_published)
VALUES ('Impact Pool', 'Default fallback for all overflow contributions.', true, 1000000, 0, true, true)
ON CONFLICT DO NOTHING;

-- Seed some sample initiatives
INSERT INTO public.initiatives (title, description, goal_amount_mur, current_amount_mur, is_approved, is_published)
VALUES
('Education for All', 'Providing school supplies to underserved children.', 50000, 0, true, true),
('Food Security Initiative', 'Supporting local food banks and community gardens.', 75000, 0, true, true)
ON CONFLICT DO NOTHING;
