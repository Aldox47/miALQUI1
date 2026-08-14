ALTER TABLE public.propiedades
ADD COLUMN IF NOT EXISTS es_nuevo boolean DEFAULT false;

UPDATE public.propiedades
SET es_nuevo = false
WHERE es_nuevo IS NULL;

ALTER TABLE public.propiedades
ADD COLUMN IF NOT EXISTS destacada boolean DEFAULT false;

UPDATE public.propiedades
SET destacada = false
WHERE destacada IS NULL;
