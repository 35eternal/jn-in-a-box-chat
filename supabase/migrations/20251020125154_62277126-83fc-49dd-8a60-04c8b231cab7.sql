-- Fix webhook RLS policies to allow admins to manage webhooks
-- Remove old policy
DROP POLICY IF EXISTS "Service role can manage webhooks" ON public.webhooks;

-- Add new policies for admin users
CREATE POLICY "Admins can view webhooks"
ON public.webhooks
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert webhooks"
ON public.webhooks
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update webhooks"
ON public.webhooks
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete webhooks"
ON public.webhooks
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));