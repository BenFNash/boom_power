
CREATE POLICY "Admins can edit user profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

