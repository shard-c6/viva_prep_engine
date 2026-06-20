-- =============================================
-- VERA — Database Schema (V1)
-- =============================================
-- Run this migration against your Supabase project.
-- Execute via Supabase SQL Editor or `supabase db push`.
--
-- Prerequisites:
--   1. Supabase project created
--   2. GitHub OAuth provider enabled in Supabase Auth settings
-- =============================================


-- -----------------------------------------
-- 1. PROFILES TABLE
-- Extends Supabase auth.users with GitHub metadata
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    github_username TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, github_username, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'user_name', NEW.raw_user_meta_data ->> 'preferred_username', 'unknown'),
        COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);


-- -----------------------------------------
-- 2. JOBS TABLE
-- Tracks the lifecycle of every analysis request
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    repo_url TEXT NOT NULL,
    repo_owner TEXT NOT NULL,
    repo_name TEXT NOT NULL,
    tech_stack TEXT NOT NULL
        CHECK (tech_stack IN ('C', 'C++', 'Java', 'Python', 'JavaScript')),
    viva_difficulty TEXT NOT NULL
        CHECK (viva_difficulty IN ('beginner', 'intermediate', 'advanced')),
    status TEXT NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    error_code TEXT,
    error_message TEXT,
    file_count INTEGER,
    total_size_bytes BIGINT,
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_user_daily ON public.jobs(user_id, created_at);

-- Trigger for updated_at
CREATE TRIGGER set_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
    ON public.jobs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs"
    ON public.jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Note: Lambda updates jobs using service_role key (bypasses RLS)


-- -----------------------------------------
-- 3. REPORTS TABLE
-- Stores AI-generated analysis output
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL UNIQUE REFERENCES public.jobs(id) ON DELETE CASCADE,
    architecture_summary TEXT NOT NULL,
    components JSONB NOT NULL,
    report_sections JSONB NOT NULL,
    viva_flashcards JSONB NOT NULL,
    model_used TEXT NOT NULL DEFAULT 'gemini-2.5-flash-lite',
    input_tokens INTEGER,
    output_tokens INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fetching report by job
CREATE INDEX IF NOT EXISTS idx_reports_job_id ON public.reports(job_id);

-- RLS Policies
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reports for their jobs"
    ON public.reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.jobs
            WHERE jobs.id = reports.job_id
            AND jobs.user_id = auth.uid()
        )
    );

-- Note: Lambda inserts reports using service_role key (bypasses RLS)


-- -----------------------------------------
-- 4. HELPER FUNCTIONS
-- Rate limiting helpers called from Next.js API routes
-- -----------------------------------------

-- Count active (non-terminal) jobs for a user
CREATE OR REPLACE FUNCTION public.count_active_jobs(p_user_id UUID)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.jobs
    WHERE user_id = p_user_id
    AND status IN ('queued', 'processing');
$$ LANGUAGE sql SECURITY DEFINER;

-- Count jobs created today for a user
CREATE OR REPLACE FUNCTION public.count_daily_jobs(p_user_id UUID)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.jobs
    WHERE user_id = p_user_id
    AND created_at >= (CURRENT_DATE AT TIME ZONE 'UTC');
$$ LANGUAGE sql SECURITY DEFINER;
