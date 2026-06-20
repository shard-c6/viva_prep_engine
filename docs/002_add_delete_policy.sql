-- =============================================
-- VERA — Database Schema Migration
-- Add DELETE policy for jobs table
-- =============================================

CREATE POLICY "Users can delete own jobs"
    ON public.jobs FOR DELETE
    USING (auth.uid() = user_id);
