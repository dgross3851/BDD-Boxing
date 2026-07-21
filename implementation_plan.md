# Implementation Plan — Phase 1: Supabase Setup, Auth & Profile Roles (`auth_profiles`)

This focused implementation plan covers **Phase 1** of the BDD Boxing backend integration on the `auth_profiles` branch. In this phase, we will set up all Supabase database tables/triggers, build the signup & login flows, implement role-based access control, and build mockup User and Admin dashboards to test end-to-end authentication and role routing.

---

## Phase 1 Objectives

1. **Supabase Database & Schema Setup**: Execute SQL migrations via Supabase MCP to create all tables, enums, triggers, and RLS policies.
2. **Auto-Profile Creation Trigger**: Automatically create a profile row in `public.profiles` whenever a new user signs up via Supabase Auth (`auth.users`).
3. **Frontend Auth Portal**: Build Vite/React portal setup with `@supabase/supabase-js` containing Signup and Login forms.
4. **Role Handling & Route Guards**: Implement role-aware route protection (`user`, `client`, `admin`).
5. **Mockup Dashboards**: Build lightweight User/Client and Admin Dashboard mockups to verify signups, logins, and role access rules.

---

## User Review Required

> [!IMPORTANT]
> - **Database Execution**: We will execute the SQL DDL directly against your active Supabase project (`lmrpuxeossmzrnwwpiyc`) using the Supabase MCP `execute_sql` tool.
> - **Admin Promotion**: Once you create your initial account via the Signup page, we will execute an SQL update command (or you can do so in the Supabase Dashboard) to set `role = 'admin'` for your profile to test the Admin Dashboard mockup.

---

## Proposed Changes

### 1. Database Schema & Triggers (Supabase PostgreSQL)

#### [NEW] Database Migration SQL (`supabase/execute_sql`)

We will run the SQL DDL against project `lmrpuxeossmzrnwwpiyc`:

```sql
-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('user', 'client', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'banned');
CREATE TYPE session_status AS ENUM ('active', 'cancelled');
CREATE TYPE booking_status AS ENUM ('booked', 'cancelled', 'attended');
CREATE TYPE payment_status AS ENUM ('pending', 'paid');

-- 2. Profiles Table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'user',
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Session Types Table
CREATE TABLE public.session_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Sessions Table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type_id UUID REFERENCES public.session_types(id) ON DELETE CASCADE,
  datetime TIMESTAMPTZ NOT NULL,
  max_slots INTEGER NOT NULL DEFAULT 1,
  price_usd NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  location TEXT NOT NULL DEFAULT '1012 3rd Ave NW, Hickory, NC 28601',
  status session_status NOT NULL DEFAULT 'active',
  cancel_reason TEXT,
  cancel_datetime TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Bookings Table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status booking_status NOT NULL DEFAULT 'booked',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_active_client_booking UNIQUE (session_id, client_id)
);

-- 6. Audit & History Tables
CREATE TABLE public.user_login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  logged_in_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.session_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  old_state JSONB,
  new_state JSONB,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.booking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  old_status booking_status,
  new_status booking_status,
  old_payment_status payment_status,
  new_payment_status payment_status,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Availability Tables
CREATE TABLE public.availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type_id UUID REFERENCES public.session_types(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.availability_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type_id UUID REFERENCES public.session_types(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
  custom_start_time TIME,
  custom_end_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Auto-Profile Creation Trigger on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'user'::public.user_role,
    'active'::public.user_status
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Profiles Policies: Users read/update own profile; admins read/update all
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
```

---

### 2. Frontend Auth Portal & Components

#### [NEW] [src/lib/supabaseClient.js](file:///Users/davidgross/Downloads/Coding%20Website%20Projects/BDD%20Boxing/src/lib/supabaseClient.js)
Initialize `@supabase/supabase-js` client configured with project URL and publishable key.

#### [NEW] [src/context/AuthContext.jsx](file:///Users/davidgross/Downloads/Coding%20Website%20Projects/BDD%20Boxing/src/context/AuthContext.jsx)
Provide authentication context (`user`, `profile`, `role`, `loading`, `signIn`, `signUp`, `signOut`).
Fetches `public.profiles` on login to determine role state (`user`, `client`, `admin`).

#### [NEW] [src/pages/Signup.jsx](file:///Users/davidgross/Downloads/Coding%20Website%20Projects/BDD%20Boxing/src/pages/Signup.jsx)
Signup view styled with BDD Boxing dark ember aesthetics. Collects Full Name, Phone, Email, Password. Triggers Supabase `signUp()`.

#### [NEW] [src/pages/Login.jsx](file:///Users/davidgross/Downloads/Coding%20Website%20Projects/BDD%20Boxing/src/pages/Login.jsx)
Login view styled with BDD Boxing dark ember aesthetics. Triggers Supabase `signInWithPassword()`.

#### [NEW] [src/components/ProtectedRoute.jsx](file:///Users/davidgross/Downloads/Coding%20Website%20Projects/BDD%20Boxing/src/components/ProtectedRoute.jsx)
Wrapper component to enforce authentication and allowed role array (e.g. `allowedRoles={['admin']}`). Redirects unauthenticated users to `/login` and unauthorized users to their designated dashboard.

#### [NEW] [src/pages/Profile.jsx](file:///Users/davidgross/Downloads/Coding%20Website%20Projects/BDD%20Boxing/src/pages/Profile.jsx)
Profile page component for any user role. Allows viewing and editing profile fields (Full Name, Phone Number) with real-time sync with Supabase `public.profiles` table.

#### [NEW] [src/components/AvatarDropdown.jsx](file:///Users/davidgross/Downloads/Coding%20Website%20Projects/BDD%20Boxing/src/components/AvatarDropdown.jsx)
Standard profile circular avatar component with dropdown selection:
- Shows user's name initials or fallback user placeholder.
- Options: "Profile" (links to `/profile`) and "Log Out".

---

### 3. Mockup Dashboards for Role Testing

#### [NEW] [src/pages/UserDashboardMockup.jsx](file:///Users/davidgross/Downloads/Coding%20Website%20Projects/BDD%20Boxing/src/pages/UserDashboardMockup.jsx)
Client testing dashboard displaying:
- Welcome banner with user's full name & email
- Current Role Badge (`USER` or `CLIENT`)
- Profile details card
- Profile Avatar Dropdown in place of sign out button

#### [NEW] [src/pages/AdminDashboardMockup.jsx](file:///Users/davidgross/Downloads/Coding%20Website%20Projects/BDD%20Boxing/src/pages/AdminDashboardMockup.jsx)
Admin testing dashboard (protected, `role = 'admin'` required) displaying:
- Admin verification badge
- Directory of registered profiles (fetched from `public.profiles`)
- Role testing controls (e.g., button to promote/demote test users or inspect profiles)
- Profile Avatar Dropdown in place of sign out button

---

## Verification Plan

### Automated Database Verification
1. Run SQL DDL via `supabase/execute_sql` MCP tool on project `lmrpuxeossmzrnwwpiyc`.
2. Call `supabase/list_tables` to confirm all 8 tables are created in the `public` schema.

### Manual Auth & Role Flow Testing
1. Launch local app (`npm run dev`).
2. **Signup Test**: Create a new test user account on the Signup page (`/signup`).
   - Verify redirect to User Dashboard Mockup.
   - Verify `public.profiles` contains a corresponding profile row with `role = 'user'`.
3. **Login / Logout Test**: Log out and log back in on the Login page (`/login`). Confirm session restoration and role loading.
4. **Admin Promotion & Admin Dashboard Test**:
   - Run SQL command via MCP: `UPDATE public.profiles SET role = 'admin' WHERE email = 'your_admin_email@example.com';`
   - Log into the app with the admin account.
   - Verify access to `/admin` Mockup Dashboard.
   - Verify non-admin accounts are blocked from accessing `/admin` and gracefully redirected.

---

## Phase 1 Extension: Profile Page & Dropdown Checklist

- [x] Create `src/pages/Profile.jsx` allowing users of any role type to view and edit their profile.
- [x] Create `src/components/AvatarDropdown.jsx` (or inline dropdown in navigation) showing option to link to Profile page and Log Out.
- [x] Replace standard Log Out button on User & Admin dashboards with the new Avatar Dropdown menu.
- [x] Add route `/profile` in `src/App.jsx` pointing to Profile page (protected by `ProtectedRoute`).
- [x] Verify profile updates dynamically save to the `public.profiles` table in Supabase.
- [x] Add Login button next to the Book Session button in all 7 public website page headers.
- [x] Style header-cta buttons in styles.css to be smaller and align horizontally as a flex container.

