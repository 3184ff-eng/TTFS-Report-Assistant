# Lovable Supabase Storage and Agent Fixes

Use this with the Lovable/Supabase app generated from the TTFS Fire Investigation Assistant prompt.

## Storage RLS Fix

The photo bucket path convention must be:

```text
{incident_id}/{filename}
```

Example:

```text
7f0d40a7-7db7-4d7a-b2d7-13f41e7dc993/photo-001.jpg
```

Use a helper function for storage object ownership instead of casting directly inside every policy. Direct casts such as `((storage.foldername(name))[1])::uuid` can throw an invalid UUID error if a user attempts to upload a malformed path. The helper below validates the path before casting.

```sql
-- Bucket for incident photos.
INSERT INTO storage.buckets (id, name, public)
VALUES ('incident-photos', 'incident-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Optional bucket for exported official PDFs.
INSERT INTO storage.buckets (id, name, public)
VALUES ('exported-reports', 'exported-reports', false)
ON CONFLICT (id) DO NOTHING;

-- Safe ownership check for paths shaped like {incident_id}/{filename}.
CREATE OR REPLACE FUNCTION public.owns_incident_storage_path(_object_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  first_folder text;
BEGIN
  first_folder := (storage.foldername(_object_name))[1];

  IF first_folder IS NULL OR first_folder !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN false;
  END IF;

  RETURN public.owns_incident(first_folder::uuid);
END;
$$;

-- Drop and recreate policies so the migration can be re-run safely.
DROP POLICY IF EXISTS "photos select own" ON storage.objects;
DROP POLICY IF EXISTS "photos insert own" ON storage.objects;
DROP POLICY IF EXISTS "photos update own" ON storage.objects;
DROP POLICY IF EXISTS "photos delete own" ON storage.objects;

CREATE POLICY "photos select own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'incident-photos'
  AND public.owns_incident_storage_path(name)
);

CREATE POLICY "photos insert own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'incident-photos'
  AND public.owns_incident_storage_path(name)
);

CREATE POLICY "photos update own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'incident-photos'
  AND public.owns_incident_storage_path(name)
)
WITH CHECK (
  bucket_id = 'incident-photos'
  AND public.owns_incident_storage_path(name)
);

CREATE POLICY "photos delete own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'incident-photos'
  AND public.owns_incident_storage_path(name)
);
```

If exported PDF files use the same path convention, use the same helper:

```sql
DROP POLICY IF EXISTS "exports select own" ON storage.objects;
DROP POLICY IF EXISTS "exports insert own" ON storage.objects;
DROP POLICY IF EXISTS "exports update own" ON storage.objects;
DROP POLICY IF EXISTS "exports delete own" ON storage.objects;

CREATE POLICY "exports select own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'exported-reports'
  AND public.owns_incident_storage_path(name)
);

CREATE POLICY "exports insert own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exported-reports'
  AND public.owns_incident_storage_path(name)
);

CREATE POLICY "exports update own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'exported-reports'
  AND public.owns_incident_storage_path(name)
)
WITH CHECK (
  bucket_id = 'exported-reports'
  AND public.owns_incident_storage_path(name)
);

CREATE POLICY "exports delete own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'exported-reports'
  AND public.owns_incident_storage_path(name)
);
```

## Photo Upload Contract

Frontend uploads should use this path:

```ts
const filePath = `${incidentId}/${crypto.randomUUID()}-${file.name}`;

const { error: uploadError } = await supabase.storage
  .from("incident-photos")
  .upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });

if (uploadError) throw uploadError;

await supabase.from("photo_logs").insert({
  incident_id: incidentId,
  storage_path: filePath,
  caption,
  area,
});
```

## AgentPanel Fix

If using the pasted `AgentPanel`, do not send `"general"` as a stage focus. Convert it to `undefined`.

```tsx
const normalizedStageFocus =
  !stageFocus || stageFocus === "general" ? undefined : stageFocus;

const askMut = useMutation({
  mutationFn: () =>
    ask({
      data: {
        incident_id: incidentId,
        question,
        stage_focus: normalizedStageFocus,
      },
    }),
  onSuccess: (r) => {
    setLatest(r);
    setQuestion("");
    qc.invalidateQueries({ queryKey: ["incident", incidentId] });
  },
  onError: (e) => toast.error(e.message),
});
```

The visible AI warning in the pasted component is good and should stay:

```text
AI decision-support output — officer review required before acting.
```
