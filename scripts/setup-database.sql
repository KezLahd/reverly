-- Create reverly_user_profiles table
CREATE TABLE IF NOT EXISTS public.reverly_user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  user_type TEXT CHECK (user_type IN ('individual', 'agency', 'agency_member')) NOT NULL DEFAULT 'individual',
  selected_agency TEXT,
  agency_id UUID,
  agency_name TEXT,
  agency_location TEXT,
  is_agency_owner BOOLEAN DEFAULT false,
  number_of_users INTEGER DEFAULT 1,
  marketing_opt_in BOOLEAN DEFAULT false,
  subscription_status TEXT DEFAULT 'inactive',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create reverly_agency_subscriptions table
CREATE TABLE IF NOT EXISTS public.reverly_agency_subscriptions (
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

-- Create reverly_agency_users table
CREATE TABLE IF NOT EXISTS public.reverly_agency_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.reverly_agency_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, user_id)
);

-- Create reverly_landing_page_properties table
CREATE TABLE IF NOT EXISTS public.reverly_landing_page_properties (
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

-- Create reverly_interactions table
CREATE TABLE IF NOT EXISTS public.reverly_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.reverly_contacts(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.reverly_landing_page_properties(id) ON DELETE CASCADE,
  type TEXT,
  notes TEXT,
  date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create reverly_audio_recordings table
CREATE TABLE IF NOT EXISTS public.reverly_audio_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.reverly_contacts(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.reverly_landing_page_properties(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  duration INTEGER,
  transcript TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create reverly_questionnaires table
CREATE TABLE IF NOT EXISTS public.reverly_questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create reverly_contacts table
CREATE TABLE IF NOT EXISTS public.reverly_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT,
  address TEXT,
  readiness_score INTEGER DEFAULT 0,
  last_contacted TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fix reverly_interactions and reverly_audio_recordings foreign keys
ALTER TABLE public.reverly_interactions DROP CONSTRAINT IF EXISTS reverly_interactions_contact_id_fkey;
ALTER TABLE public.reverly_interactions ADD CONSTRAINT reverly_interactions_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.reverly_contacts(id) ON DELETE CASCADE;

ALTER TABLE public.reverly_audio_recordings DROP CONSTRAINT IF EXISTS reverly_audio_recordings_contact_id_fkey;
ALTER TABLE public.reverly_audio_recordings ADD CONSTRAINT reverly_audio_recordings_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.reverly_contacts(id) ON DELETE CASCADE;

-- Enable RLS (Row Level Security)
ALTER TABLE public.reverly_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reverly_agency_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reverly_agency_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reverly_landing_page_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reverly_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reverly_audio_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reverly_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reverly_contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reverly_user_profiles (allow service role to insert)
DROP POLICY IF EXISTS "service_insert_profiles" ON public.reverly_user_profiles;
CREATE POLICY "service_insert_profiles" ON public.reverly_user_profiles FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.reverly_user_profiles;
CREATE POLICY "Users can view their own profile" 
  ON public.reverly_user_profiles FOR SELECT 
  USING (auth.uid() = id OR TRUE);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.reverly_user_profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.reverly_user_profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Create RLS policies for reverly_contacts
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.reverly_contacts;
CREATE POLICY "Users can view their own contacts" 
  ON public.reverly_contacts FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own contacts" ON public.reverly_contacts;
CREATE POLICY "Users can insert their own contacts" 
  ON public.reverly_contacts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own contacts" ON public.reverly_contacts;
CREATE POLICY "Users can update their own contacts" 
  ON public.reverly_contacts FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for reverly_landing_page_properties
DROP POLICY IF EXISTS "Users can view their own properties" ON public.reverly_landing_page_properties;
CREATE POLICY "Users can view their own properties" 
  ON public.reverly_landing_page_properties FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own properties" ON public.reverly_landing_page_properties;
CREATE POLICY "Users can insert their own properties" 
  ON public.reverly_landing_page_properties FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own properties" ON public.reverly_landing_page_properties;
CREATE POLICY "Users can update their own properties" 
  ON public.reverly_landing_page_properties FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for reverly_interactions
DROP POLICY IF EXISTS "Users can view their own interactions" ON public.reverly_interactions;
CREATE POLICY "Users can view their own interactions" 
  ON public.reverly_interactions FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own interactions" ON public.reverly_interactions;
CREATE POLICY "Users can insert their own interactions" 
  ON public.reverly_interactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own interactions" ON public.reverly_interactions;
CREATE POLICY "Users can update their own interactions" 
  ON public.reverly_interactions FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for reverly_audio_recordings
DROP POLICY IF EXISTS "Users can view their own recordings" ON public.reverly_audio_recordings;
CREATE POLICY "Users can view their own recordings" 
  ON public.reverly_audio_recordings FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own recordings" ON public.reverly_audio_recordings;
CREATE POLICY "Users can insert their own recordings" 
  ON public.reverly_audio_recordings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own recordings" ON public.reverly_audio_recordings;
CREATE POLICY "Users can update their own recordings" 
  ON public.reverly_audio_recordings FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for reverly_questionnaires
DROP POLICY IF EXISTS "Users can view their own questionnaires" ON public.reverly_questionnaires;
CREATE POLICY "Users can view their own questionnaires" 
  ON public.reverly_questionnaires FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own questionnaires" ON public.reverly_questionnaires;
CREATE POLICY "Users can insert their own questionnaires" 
  ON public.reverly_questionnaires FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own questionnaires" ON public.reverly_questionnaires;
CREATE POLICY "Users can update their own questionnaires" 
  ON public.reverly_questionnaires FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for reverly_agency_subscriptions
DROP POLICY IF EXISTS "Users can view their agency subscriptions" ON public.reverly_agency_subscriptions;
CREATE POLICY "Users can view their agency subscriptions" 
  ON public.reverly_agency_subscriptions FOR SELECT 
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their agency subscriptions" ON public.reverly_agency_subscriptions;
CREATE POLICY "Users can update their agency subscriptions" 
  ON public.reverly_agency_subscriptions FOR UPDATE 
  USING (auth.uid() = owner_id);

-- Create RLS policies for reverly_agency_users
DROP POLICY IF EXISTS "Agency members can view their agency" ON public.reverly_agency_users;
CREATE POLICY "Agency members can view their agency" 
  ON public.reverly_agency_users FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.reverly_agency_subscriptions 
      WHERE id = agency_id AND owner_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reverly_user_profiles_email ON public.reverly_user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_reverly_user_profiles_user_type ON public.reverly_user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_reverly_contacts_user_id ON public.reverly_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_reverly_landing_page_properties_user_id ON public.reverly_landing_page_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_reverly_landing_page_properties_last_contacted ON public.reverly_landing_page_properties(last_contacted DESC);
CREATE INDEX IF NOT EXISTS idx_reverly_interactions_user_id ON public.reverly_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reverly_interactions_contact_id ON public.reverly_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_reverly_audio_recordings_user_id ON public.reverly_audio_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_reverly_agency_subscriptions_owner_id ON public.reverly_agency_subscriptions(owner_id);
CREATE INDEX IF NOT EXISTS idx_reverly_agency_users_agency_id ON public.reverly_agency_users(agency_id);
CREATE INDEX IF NOT EXISTS idx_reverly_agency_users_user_id ON public.reverly_agency_users(user_id);
