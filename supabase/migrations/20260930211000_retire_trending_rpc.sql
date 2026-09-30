-- Retired homepage Trending section no longer has an API consumer.
REVOKE EXECUTE ON FUNCTION public.get_trending_initiatives(integer) FROM PUBLIC, anon, authenticated;