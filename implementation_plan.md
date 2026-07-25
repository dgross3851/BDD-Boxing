# Implementation Plan — Phase 1 Extension: Profile Picture Editing & Supabase Storage

This implementation plan details the addition of profile picture editing, Supabase storage bucket configurations, Row Level Security (RLS) policies, and global state sync for user avatar images.

---

## User Review Required

> [!IMPORTANT]
> - **Database Column Alteration**: We will add an `avatar_url` text column to the `public.profiles` table to store references to uploaded images in Supabase Storage.
> - **Storage Bucket & Policies**: We will create a private storage bucket named `avatars` with RLS policies restricting read access to the file owner and administrators, and write access (Insert/Update/Delete) solely to the file owner.
> - **Image Caching & Context Sync**: To prevent redundant network requests, user avatars will be downloaded as a blob and managed as a local object URL in `AuthContext` to share instantly across page headers and dashboards.

---

## Proposed Changes

### 1. Supabase Database & Storage Setup

#### [NEW] Database Migration & Policy SQL (`supabase/execute_sql`)
We will execute the following SQL script to alter the database schema, create the storage bucket, and configure Row Level Security:

```sql
-- 1. Add avatar_url column to public.profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  false, 
  2097152, -- 2MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE 
SET public = false, 
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- 3. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Re-create SELECT/INSERT/UPDATE/DELETE policies for storage.objects
DROP POLICY IF EXISTS "Allow select for owner or admin" ON storage.objects;
DROP POLICY IF EXISTS "Allow insert for owner" ON storage.objects;
DROP POLICY IF EXISTS "Allow update for owner" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete for owner" ON storage.objects;

-- SELECT policy: User can read own avatar, admin can read all
CREATE POLICY "Allow select for owner or admin" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'avatars' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text 
    OR 
    public.is_admin()
  )
);

-- INSERT policy: User can upload to their own user folder path
CREATE POLICY "Allow insert for owner" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE policy: User can modify files in their own user folder path
CREATE POLICY "Allow update for owner" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE policy: User can remove files in their own user folder path
CREATE POLICY "Allow delete for owner" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

### 2. Frontend State & Component Updates

#### [MODIFY] [src/context/AuthContext.jsx](file:///Users/davidgross/Downloads/Coding%20Website%20Projects/BDD%20Boxing/src/context/AuthContext.jsx)
- Add state variable `avatarUrl` (holding a local `URL.createObjectURL(blob)` representation).
- Fetch the avatar image blob from Supabase storage whenever the user session or profile updates (using `supabase.storage.from('avatars').download(...)`).
- Release/revoke existing object URLs when refreshing to prevent browser memory leaks.
- Expose `avatarUrl` and `refreshAvatar` in the `AuthContext` value.

#### [MODIFY] [src/components/AvatarDropdown.jsx](file:///Users/davidgross/Downloads/Coding%20Website%20Projects/BDD%20Boxing/src/components/AvatarDropdown.jsx)
- Retrieve `avatarUrl` from `useAuth()`.
- If `avatarUrl` is available, render an `<img>` element inside the circular avatar frame instead of initials.
- Otherwise, fall back to initials.

#### [MODIFY] [src/pages/Profile.jsx](file:///Users/davidgross/Downloads/Coding%20Website%20Projects/BDD%20Boxing/src/pages/Profile.jsx)
- Add a Profile Picture display and edit section next to or above fields.
- Include a hidden `<input type="file" accept="image/*" />` triggered by clicking the avatar edit control.
- Handle upload of the selected file to Supabase storage path `avatars/${userId}/avatar.png` (or with timestamp `avatars/${userId}/avatar-${Date.now()}.png` to bypass browser caching).
- Perform database update on `public.profiles` to set `avatar_url` path.
- Trigger `refreshProfile()` and `refreshAvatar()` on success.

#### [MODIFY] [scripts.js](file:///Users/davidgross/Downloads/Coding%20Website%20Projects/BDD%20Boxing/scripts.js)
- Update dynamic auth sync function to download and render the user's avatar image inside the dynamic header Avatar Dropdown if `avatar_url` is present in the profiles table, falling back to initials if not.

---

## Verification Plan

### Automated Database Setup
- Run the SQL DDL migration against Supabase project `lmrpuxeossmzrnwwpiyc`.
- Verify the `avatars` bucket exists.

### Manual Verification
1. Open the Profile page `/profile` locally.
2. Select a profile picture from your system and upload it.
3. Verify that:
   - The picture uploads successfully to the `avatars` bucket.
   - The profile settings page dynamically previews the picture.
   - The page headers (both on the portal and public website pages) update to show the new profile picture rather than initials.
4. Test login/logout and ensure the picture loads correctly on page reload.
5. Elevate a second account to `admin` and verify that the admin dashboard can view other users' pictures.
