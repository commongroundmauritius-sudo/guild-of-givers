-- Update existing published version to use 'contributions' instead of 'donations'
-- AND 'organizations' instead of 'ngos'
UPDATE public.homepage_versions
SET configuration_json = jsonb_set(
    configuration_json,
    '{sections}',
    (
        SELECT jsonb_agg(
            CASE
                WHEN section->>'id' = 'stats' THEN
                    jsonb_set(
                        section,
                        '{settings,metrics}',
                        (
                            SELECT jsonb_agg(
                                CASE
                                    WHEN metric->>'id' = 'donations' THEN
                                        metric || '{"id": "contributions", "label": "Total Contributed"}'::jsonb
                                    WHEN metric->>'id' = 'ngos' THEN
                                        metric || '{"id": "organizations", "label": "Total Organizations"}'::jsonb
                                    ELSE metric
                                END
                            )
                            FROM jsonb_array_elements(section->'settings'->'metrics') AS metric
                        )
                    )
                ELSE section
            END
        )
        FROM jsonb_array_elements(configuration_json->'sections') AS section
    )
)
WHERE status = 'published';
