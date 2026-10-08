DO $$
DECLARE
  v_org_id UUID := 'a1111111-1111-4111-a111-111111111111';
  v_init_id UUID := 'b2222222-2222-4222-b222-222222222222';
BEGIN
  -- Insert or update Organization: Association Rays of Hope Port Louis
  INSERT INTO public.organizations (
    id,
    organization_name,
    description,
    logo_url,
    website_url,
    is_verified,
    category,
    mission,
    status,
    address,
    contact_email,
    impact_metrics,
    transparency_content,
    goals,
    monthly_target_amount,
    current_collected_amount
  ) VALUES (
    v_org_id,
    'Association Rays of Hope Port Louis',
    'Giving dignity, nourishment and hope to people experiencing homelessness and families facing hardship in Port Louis, Mauritius.',
    'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=400&q=80',
    'https://raysofhope.mu',
    true,
    'Homelessness & Housing',
    'Rays of Hope works to improve the lives of vulnerable people by providing practical assistance, community support, and opportunities for greater stability and social inclusion.',
    'active',
    'Port Louis, Mauritius',
    'contact@raysofhope.mu',
    '{"hot_meals_annual": {"value": "78,000+", "unit": "meals/yr", "status": "Publicly Reported Figure", "disclaimer": "Impact figures are based on publicly available reporting and subject to organization verification."}, "young_volunteers": {"value": "100+", "unit": "members", "status": "Publicly Reported Figure"}, "location": "Port Louis, Mauritius", "registration": "NSIF/2024/0005", "established_year": 2014}',
    '{"registration_number": "NSIF/2024/0005", "established": 2014, "governance": "Community-led NGO registered with the National Social Inclusion Foundation"}',
    'Operate the Port Louis community kitchen providing 78,000+ hot meals annually while delivering holistic street outreach and reintegration support.',
    250000.00,
    185000.00
  )
  ON CONFLICT (id) DO UPDATE SET
    organization_name = EXCLUDED.organization_name,
    description = EXCLUDED.description,
    mission = EXCLUDED.mission,
    impact_metrics = EXCLUDED.impact_metrics,
    transparency_content = EXCLUDED.transparency_content;

  -- Insert or update Central Initiative: Rays of Hope Community Kitchen
  INSERT INTO public.initiatives (
    id,
    organization_id,
    title,
    slug,
    description,
    summary,
    content,
    category,
    goal_amount_mur,
    current_amount_mur,
    monthly_target_mur,
    image_url,
    status,
    is_approved,
    is_published,
    is_featured,
    volunteer_opportunity
  ) VALUES (
    v_init_id,
    v_org_id,
    'Port Louis Community Kitchen',
    'rays-of-hope-community-kitchen',
    'Operating a daily community kitchen in Port Louis delivering over 78,000 hot meals annually to individuals experiencing homelessness and families in hardship.',
    'A hot meal can mean more than food. It can mean dignity.',
    'Rays of Hope operates a community kitchen in Port Louis, preparing and distributing hot meals to people experiencing homelessness and families in need. Every meal represents a simple but meaningful act of support: ensuring that someone facing hardship can access nutritious food and feel that their community has not forgotten them.',
    'Food Security & Homelessness',
    600000.00,
    462000.00,
    50000.00,
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    'active',
    true,
    true,
    true,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    content = EXCLUDED.content,
    is_featured = EXCLUDED.is_featured;

END $$;
