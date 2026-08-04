-- Migration: Add imagenes column to propiedades (jsonb)
-- Date: 2026-08-04

ALTER TABLE public.propiedades
ADD COLUMN IF NOT EXISTS imagenes jsonb DEFAULT '[]'::jsonb;

-- Initialize existing rows (no-op if already set)
UPDATE public.propiedades
SET imagenes = '[]'::jsonb
WHERE imagenes IS NULL;
