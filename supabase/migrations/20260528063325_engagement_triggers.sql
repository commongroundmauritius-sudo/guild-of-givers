-- Engagement Triggers for System Events

-- 1. Trigger for Welcome Email/Notification on Signup
CREATE OR REPLACE FUNCTION public.on_auth_user_signup_engagement()
RETURNS TRIGGER AS $$
BEGIN
    -- Enqueue Welcome Email
    INSERT INTO public.email_queue (recipient, template_key, payload)
    VALUES (NEW.email, 'welcome', jsonb_build_object(
        'full_name', COALESCE(NEW.raw_user_meta_data->>'full_name', 'Member'),
        'signup_date', now()
    ));

    -- Create Welcome Notification
    INSERT INTO public.notifications (user_id, type, entity_id, metadata)
    VALUES (NEW.id, 'welcome', NEW.id, jsonb_build_object(
        'message', 'Welcome to CommonGround! We are glad to have you with us.'
    ));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_auth_user_signup_engagement ON auth.users;
CREATE TRIGGER tr_auth_user_signup_engagement
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.on_auth_user_signup_engagement();

-- 2. Trigger for Payment Confirmation Engagement
CREATE OR REPLACE FUNCTION public.on_payment_success_engagement()
RETURNS TRIGGER AS $$
DECLARE
    v_email TEXT;
BEGIN
    IF (NEW.status = 'success' AND (OLD.status IS NULL OR OLD.status <> 'success')) THEN
        -- Get user email
        SELECT email INTO v_email FROM public.profiles WHERE id = NEW.user_id;

        -- Enqueue Payment Confirmation Email
        INSERT INTO public.email_queue (recipient, template_key, payload)
        VALUES (v_email, 'payment_confirmation', jsonb_build_object(
            'amount_mur', NEW.amount_mur,
            'payment_id', NEW.id,
            'paid_at', NEW.paid_at
        ));

        -- Create Payment Notification
        INSERT INTO public.notifications (user_id, type, entity_id, metadata)
        VALUES (NEW.user_id, 'payment_success', NEW.id, jsonb_build_object(
            'amount_mur', NEW.amount_mur,
            'message', 'Your contribution of Rs ' || NEW.amount_mur || ' was successful. Thank you!'
        ));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_payment_success_engagement ON public.payments;
CREATE TRIGGER tr_payment_success_engagement
AFTER UPDATE OF status ON public.payments
FOR EACH ROW
WHEN (NEW.status = 'success')
EXECUTE FUNCTION public.on_payment_success_engagement();

-- 3. Trigger for Subscription Created Notification
CREATE OR REPLACE FUNCTION public.on_subscription_created_engagement()
RETURNS TRIGGER AS $$
BEGIN
    -- Create Subscription Notification
    INSERT INTO public.notifications (user_id, type, entity_id, metadata)
    VALUES (NEW.user_id, 'subscription_created', NEW.id, jsonb_build_object(
        'amount_mur', NEW.amount_mur,
        'message', 'Monthly subscription of Rs ' || NEW.amount_mur || ' has been set up.'
    ));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_subscription_created_engagement ON public.subscriptions;
CREATE TRIGGER tr_subscription_created_engagement
AFTER INSERT ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.on_subscription_created_engagement();

