REVOKE EXECUTE ON FUNCTION public.create_test_payment_intent(text,numeric,boolean,uuid,text) FROM authenticated;
CREATE POLICY "payment_intents_client_denied"
ON public.payment_intents
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);