-- Supabase Schema for Katalog

-- Enable UUID extension (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Stores Table
CREATE TABLE public.stores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text,
  slug text UNIQUE,
  description text,
  logo text,
  whatsapp text,
  email text,
  brand_color text DEFAULT '#6366f1',
  accent_color text DEFAULT '#10b981',
  template text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Products Table
CREATE TABLE public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  description text,
  code text,
  price numeric NOT NULL,
  stock integer,
  image_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) Setup

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policies for Stores
CREATE POLICY "Users can manage their own store"
  ON public.stores FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view any store"
  ON public.stores FOR SELECT
  USING (true);

-- Policies for Products
CREATE POLICY "Users can manage their own products"
  ON public.products FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view any product"
  ON public.products FOR SELECT
  USING (true);
