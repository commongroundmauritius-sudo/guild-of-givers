-- Seed Organizations
INSERT INTO public.organizations (id, name, description, mission, category, is_verified)
VALUES
  ('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Coral Guardians Mauritius', 'Protecting and restoring the coral reefs of Mauritius.', 'To achieve a sustainable marine ecosystem through active restoration and community education.', 'Environmental', true),
  ('b2c3d4e5-f6a7-4b6c-8d7e-9f0a1b2c3d4e', 'Mauritius Education Fund', 'Providing scholarships and educational resources to underprivileged children.', 'Empowering the next generation through accessible, quality education.', 'Education', true),
  ('c3d4e5f6-a7b8-4c7d-8e9f-0a1b2c3d4e5f', 'Eco-Farm Initiative', 'Promoting sustainable agriculture and food security in local communities.', 'Transforming agriculture through eco-friendly practices and local empowerment.', 'Sustainability', false)
ON CONFLICT (id) DO NOTHING;

-- Seed Initiatives
INSERT INTO public.initiatives (organization_id, title, description, goal_amount_mur, current_amount_mur, status)
VALUES
  ('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Reef Restoration 2024', 'Planting 5000 new coral fragments in the Blue Bay region.', 500000, 125000, 'active'),
  ('b2c3d4e5-f6a7-4b6c-8d7e-9f0a1b2c3d4e', 'Scholarships for Rodrigues', 'Full tuition coverage for 50 students in Rodrigues for the upcoming academic year.', 1000000, 450000, 'active'),
  ('c3d4e5f6-a7b8-4c7d-8e9f-0a1b2c3d4e5f', 'Community Greenhouse Project', 'Building solar-powered greenhouses for 10 local villages.', 750000, 0, 'active')
ON CONFLICT DO NOTHING;
