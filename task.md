# Phase 1 Checklist — Supabase Setup, Auth & Profile Roles (`auth_profiles`)

- [x] **Step 1: Supabase Database Execution**
  - [x] Run SQL DDL via Supabase MCP `execute_sql` tool on project `lmrpuxeossmzrnwwpiyc`
  - [x] Verify table creation via `list_tables` (confirm `profiles`, `sessions`, `bookings`, etc.)
  - [x] Verify `on_auth_user_created` trigger on `auth.users`

- [x] **Step 2: Frontend Client & Auth Context**
  - [x] Inspect existing project structure & dependencies
  - [x] Set up Supabase Client configuration
  - [x] Build `AuthContext` to manage `user`, `profile`, `role`, and auth session listener

- [x] **Step 3: Auth Pages (Signup & Login)**
  - [x] Create `Signup` page component with BDD dark ember styling
  - [x] Create `Login` page component with BDD dark ember styling

- [x] **Step 4: Route Guards & Mockup Dashboards**
  - [x] Build `ProtectedRoute` component to handle role checking
  - [x] Build `UserDashboardMockup` page (`/dashboard`)
  - [x] Build `AdminDashboardMockup` page (`/admin`)

- [x] **Step 5: Verification & Testing**
  - [x] Test Signup flow & verify auto-created `public.profiles` row
  - [x] Test Login & Logout flows
  - [x] Elevate test user to `admin` role via SQL and verify access to `/admin` dashboard mockup

- [x] **Step 6: Profile Page & Avatar Dropdown Extension**
  - [x] Build Profile Page (`src/pages/Profile.jsx`) for all role types to update name & phone number
  - [x] Build Avatar Dropdown component (`src/components/AvatarDropdown.jsx`) with Profile and Logout links
  - [x] Replace logout buttons in User & Admin Dashboards with the new Avatar Dropdown
  - [x] Route `/profile` in `src/App.jsx` protected by `ProtectedRoute`
  - [x] Verify profile changes sync properly to Supabase database

- [x] **Step 7: Landing Page Navbar Upgrades**
  - [x] Add Login button next to the Book Session button in all 7 public website page headers
  - [x] Make Book Session and Login buttons in the headers smaller via styles.css

- [x] **Step 8: Redirection Flow & Dynamic Header State Upgrades**
  - [x] Adjust header nav CSS in styles.css to ensure tabs, logo, and CTAs are evenly leveled and spaced out
  - [x] Update Login and Signup page redirections to send users back to `/index.html` (the homepage) upon successful authentication
  - [x] Update logout logic to redirect users to `/index.html`
  - [x] Add "Dashboard" link option back to AvatarDropdown (pointing to `/admin` or `/dashboard` based on role)
  - [x] Modify public scripts.js to check Supabase auth state and dynamically replace the Login button with the interactive Avatar Dropdown on public pages

- [x] **Step 9: Router, Header Padding & Database Policy Fixes**
  - [x] Switched React Router from BrowserRouter to HashRouter to ensure hash links (e.g. portal.html#/profile) route directly without dashboard fallback
  - [x] Added relative positioning style overrides to react portal page headers to prevent fixed overlapping layout cutting off main content
  - [x] Created public.is_admin() security definer bypass function to resolve infinite RLS policy recursion on public.profiles table

- [x] **Step 10: Portal Navigation Sync & Spacing Overrides**
  - [x] Switch React portal page headers to use the full 7-tab website navigation bar with responsive mobile menu toggle state
  - [x] Set white-space: nowrap on navigation link elements and logo text to prevent text stacking/wrapping
  - [x] Tighten the nav-menu element flex gap to 1.25rem to allow all tabs and buttons to sit comfortably on a single line

- [x] **Step 11: Profile Picture Setup & Storage Integration**
  - [x] Execute SQL migration to add `avatar_url` to `public.profiles` and create the storage bucket with policies
  - [x] Update `src/context/AuthContext.jsx` to fetch and cache user avatars
  - [x] Update `src/components/AvatarDropdown.jsx` to render the avatar image when available
  - [x] Update `src/pages/Profile.jsx` to support selecting and uploading profile pictures
  - [x] Update `scripts.js` to render the user's avatar dynamically in static pages
