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

## Phase 2: Admin UI Mockup Layout & Functionality (`admin_ui`)

This phase details the design and structural components of the updated Admin Dashboard featuring collapsible layouts, tabbed modules, glassmorphism cards, and real-time updates.

### User Review Required

> [!IMPORTANT]
> - **Collapsible Admin Navigation**: We will introduce a dedicated layout component (`AdminLayout.jsx`) that wraps the admin views, providing a responsive, collapsible left sidebar with breadcrumbs and user avatar top-right headers.
> - **Real-Time Notification architecture**: To make real-time notifications happen, we will establish a `public.notifications` table and configure Supabase Realtime channel listeners in the React app.

### Proposed Changes

#### [NEW] [src/components/AdminLayout.jsx](file:///Users/davidgross/Downloads/Coding%20Website%20Projects/BDD%20Boxing/src/components/AdminLayout.jsx)
A reusable dashboard layout wrapping all administrative views:
- Collapsible left sidebar containing: Sessions, Clients, Bookings links.
- Top navigation bar featuring breadcrumbs path, user name, and the shared dropdown profile picture avatar.
- Responsive design collapsing sidebar on smaller desktop/tablet screen sizes.

#### [NEW] [src/components/GlassmorphicCard.jsx](file:///Users/davidgross/Downloads/Coding%20Website%20Projects/BDD%20Boxing/src/components/GlassmorphicCard.jsx)
Standardized cards utilizing brand HSL values, `backdrop-filter: blur(12px)` glassmorphism styling, trend indicators (with conditional positive/negative styling), and micro-animations on hover.

#### [MODIFY] [src/pages/AdminDashboardMockup.jsx](file:///Users/davidgross/Downloads/Coding%20Website%20Projects/BDD%20Boxing/src/pages/AdminDashboardMockup.jsx)
Refactor the Admin page into an integrated layout tab structure:
- **Overview Sub-View**: Includes date range filtering, Glassmorphic summary cards (Trend stats), and Contextual Quick Actions (e.g. Add Client, Schedule Session, Create Category).
- **Sessions Sub-View**: Displays calendar schedules of session instances, and interactive tabs to CRUD session categories and types.
- **Clients Sub-View**: List of accounts with query inputs, status filters, and click-to-open client profile modals containing complete booking histories.
- **Bookings Sub-View**: Calendar and list layouts allowing appointments CRUD modifications.
- **Notification Dropdown Overlay**: Notification icon checking real-time tables via Supabase listener with unread count badges.

#### [NEW] Database SQL Table & real-time trigger (`supabase/execute_sql`)
We will execute SQL statements to establish notifications table and triggers:
```sql
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning'
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id);
```

---

## Verification Plan

### Automated Verification
- Compile output using `npx vite build`.
- Execute notification SQL schema queries.

### Manual Verification
1. Test sidebar collapsible toggle on desktop, tablet, and mobile views.
2. Verify switching tabs (Sessions, Clients, Bookings) changes views instantly.
3. Test CRUD buttons and check modals open properly.
