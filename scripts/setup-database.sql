-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  user_type TEXT CHECK (user_type IN ('individual', 'agency')) NOT NULL,
  selected_agency TEXT,
  agency_id UUID,
  marketing_opt_in BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create agency_subscriptions table
CREATE TABLE IF NOT EXISTS public.agency_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  max_users INTEGER DEFAULT 5,
  status TEXT CHECK (status IN ('active', 'inactive', 'cancelled')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create agency_users table
CREATE TABLE IF NOT EXISTS public.agency_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agency_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, user_id)
);

-- Create landing_page_properties table
CREATE TABLE IF NOT EXISTS public.landing_page_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  last_contacted TIMESTAMPTZ,
  method TEXT,
  readiness TEXT,
  next_contact TIMESTAMPTZ,
  estimated_value DECIMAL(12, 2),
  last_agent TEXT,
  agent_profile_url TEXT,
  interaction_count INTEGER DEFAULT 0,
  lead_status TEXT,
  sell_prediction_score DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create interactions table
CREATE TABLE IF NOT EXISTS public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.landing_page_properties(id) ON DELETE CASCADE,
  type TEXT,
  notes TEXT,
  date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create audio_recordings table
CREATE TABLE IF NOT EXISTS public.audio_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.landing_page_properties(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  duration INTEGER,
  transcript TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create questionnaires table
CREATE TABLE IF NOT EXISTS public.questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create RLS policies for landing_page_properties
CREATE POLICY "Users can view their own properties" 
  ON public.landing_page_properties FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own properties" 
  ON public.landing_page_properties FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties" 
  ON public.landing_page_properties FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for interactions
CREATE POLICY "Users can view their own interactions" 
  ON public.interactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions" 
  ON public.interactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions" 
  ON public.interactions FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for audio_recordings
CREATE POLICY "Users can view their own recordings" 
  ON public.audio_recordings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recordings" 
  ON public.audio_recordings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recordings" 
  ON public.audio_recordings FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for questionnaires
CREATE POLICY "Users can view their own questionnaires" 
  ON public.questionnaires FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own questionnaires" 
  ON public.questionnaires FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own questionnaires" 
  ON public.questionnaires FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for agency_subscriptions
CREATE POLICY "Users can view their agency subscriptions" 
  ON public.agency_subscriptions FOR SELECT 
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can update their agency subscriptions" 
  ON public.agency_subscriptions FOR UPDATE 
  USING (auth.uid() = owner_id);

-- Create RLS policies for agency_users
CREATE POLICY "Agency members can view their agency" 
  ON public.agency_users FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.agency_subscriptions 
      WHERE id = agency_id AND owner_id = auth.uid()
    )
  );

-- Create check_user_status function
CREATE OR REPLACE FUNCTION public.check_user_status(user_id UUID)
RETURNS TABLE (
  user_exists BOOLEAN,
  user_type TEXT,
  subscription_status TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(up.id IS NOT NULL, false) as user_exists,
    up.user_type,
    COALESCE(ags.status, 'none') as subscription_status
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON au.id = up.id
  LEFT JOIN public.agency_subscriptions ags ON au.id = ags.owner_id
  WHERE au.id = user_id;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON public.user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_landing_page_properties_user_id ON public.landing_page_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_landing_page_properties_last_contacted ON public.landing_page_properties(last_contacted DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_property_id ON public.interactions(property_id);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_user_id ON public.audio_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_subscriptions_owner_id ON public.agency_subscriptions(owner_id);
CREATE INDEX IF NOT EXISTS idx_agency_users_agency_id ON public.agency_users(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_users_user_id ON public.agency_users(user_id);
