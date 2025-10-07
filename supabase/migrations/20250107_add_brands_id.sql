-- Migration: Add id column to brands table
-- Date: 2025-01-07

-- Add id column as UUID with default value
ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- Set id as primary key (this will also create a unique constraint)
-- First, we need to populate any NULL ids
UPDATE public.brands SET id = gen_random_uuid() WHERE id IS NULL;

-- Now make it NOT NULL
ALTER TABLE public.brands
ALTER COLUMN id SET NOT NULL;

-- Create unique index on id
CREATE UNIQUE INDEX IF NOT EXISTS brands_id_unique ON public.brands(id);

-- Note: We're keeping slug as well since it's used throughout the app
-- The slug will remain the main way to look up brands in URLs
