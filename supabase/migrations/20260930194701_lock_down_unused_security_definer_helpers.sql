
REVOKE EXECUTE ON FUNCTION public.create_test_payment(uuid, numeric) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.can_edit_organization(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_auth_org_id() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_initiative_org_id(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(public.app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_partner_application(text, text, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.manage_member_subscription(text, numeric, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_partner_application(text, text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_test_payment_intent(text, numeric, boolean, uuid, text) TO anon;
