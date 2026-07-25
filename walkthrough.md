# Walkthrough — Phase 1: Supabase Setup, Auth & Profile Roles (`auth_profiles`)

Phase 1 of the BDD Boxing backend integration has been implemented and verified on the `auth_profiles` branch.

---

## 1. Accomplished Updates

### A. Supabase Database & Schema Setup
- **DDL Execution**: Executed complete PostgreSQL DDL query via Supabase MCP `execute_sql` tool on project `lmrpuxeossmzrnwwpiyc`.
- **Tables Created** (Verified via `list_tables` MCP tool):
  - `public.profiles` (UUID primary key linked to `auth.users`, role enum: `user`, `client`, `admin`)
  - `public.session_types` (Class templates)
  - `public.sessions` (Calendar instances)
  - `public.bookings` (Client bookings with payment status enum)
  - `public.user_login_history` (Audit log)
  - `public.session_history` (Audit log)
  - `public.booking_history` (Audit log)
  - `public.availability_rules` (Recurrence rules)
  - `public.availability_exceptions` (Holiday overrides)
- **Automated Profile Trigger**: Created `handle_new_user()` function and `on_auth_user_created` trigger on `auth.users` to automatically populate a profile row in `public.profiles` whenever a new user registers.
- **Row Level Security**: Enabled RLS on `profiles`, `sessions`, and `bookings` with security policies for users and admins.

### B. Frontend Portal & Authentication Context
- **Vite React Integration**: Configured `portal.html` as the entry point for the React Portal application without modifying static public pages.
- **Supabase Client (`src/lib/supabaseClient.js`)**: Instantiated `@supabase/supabase-js` using environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).
- **Auth Context (`src/context/AuthContext.jsx`)**: Built React context listener (`onAuthStateChange`) that automatically fetches the user's role from `public.profiles`.

### C. Auth Pages & Route Protection
- **Signup Page (`src/pages/Signup.jsx`)**: Full Name, Email, Phone, and Password collection styled in dark ember theme. Calls Supabase `signUp()`.
- **Login Page (`src/pages/Login.jsx`)**: Email/Password authentication with top error banner notifications.
- **Protected Route Guard (`src/components/ProtectedRoute.jsx`)**: Intercepts unauthenticated users, suspended/banned accounts, and handles role authorization.

### D. Mockup Dashboards for Verification
- **User Dashboard Mockup (`src/pages/UserDashboardMockup.jsx`)**: Displays welcome banner, user profile details, role badge (`USER` / `CLIENT`), admin shortcut if authorized, and the new `AvatarDropdown` navigation menu.
- **Admin Dashboard Mockup (`src/pages/AdminDashboardMockup.jsx`)**: Protected route accessible only to users with `role = 'admin'`. Fetches all registered users live from Supabase `public.profiles` and includes interactive role promotion controls (`USER` / `CLIENT` / `ADMIN`), ban toggles, and the new `AvatarDropdown` navigation menu.

### E. Profile Page & Dropdown Extension (Step 6)
- **Profile Page (`src/pages/Profile.jsx`)**: User settings page for all role types to view and edit their full name and phone number with live database synchronization.
- **Avatar Dropdown (`src/components/AvatarDropdown.jsx`)**: Round header navigation component showing user initials, with a dropdown toggle for `/profile` navigation, `/admin` navigation (if admin), and logging out.

### F. Landing Page Navbar Upgrades (Step 7)
- **Login Navigation Buttons**: Added a secondary outline "Login" button pointing to `portal.html#/login` next to the "Book First Session" CTA in the headers of all 7 public pages.
- **Header Button Scaling**: Adjusted `.header-cta` in `styles.css` to act as a flex container with clean spacing and scaled down `.header-cta .btn` padding and font size for both desktop and tablet screens to keep the header uncluttered.

### G. Redirection Flow & Dynamic Header State Upgrades (Step 8)
- **Spacing and Alignment**: Configured `.nav-menu` and `.header-cta` to align navigation links and buttons dynamically and vertically center them to ensure header items are evenly leveled.
- **Compact Button Size**: Further shrank the `.header-cta .btn` size to `height: 34px` and a font size of `0.75rem` to keep the layout clean and compact.
- **Login & Signup Redirection**: Configured both `Login.jsx` and `Signup.jsx` pages to redirect users back to the homepage (`/index.html`) using `window.location.href` on success, rather than remaining inside the portal app.
- **Logout Redirection**: Updated logout handlers (inside `AvatarDropdown.jsx` and the dynamic website script) to cleanly route users back to `/index.html` after terminating their session.
- **Dynamic Avatar on Public Pages**: Added dynamic auth checks using Supabase client CDN inside `scripts.js`. When a session is active:
  - The `"Login"` button is replaced with the interactive **Avatar Dropdown** displaying initials.
  - The dropdown menu contains options for **Profile** settings (`portal.html#/profile`), a dynamic **Dashboard** link (`portal.html#/dashboard` or `/admin` depending on user role), and **Log Out**.
  - Dropdown menu listens to click-outside events to close automatically.

### H. Router, Header Padding & Database Policy Fixes (Step 9)
- **Router Switching**: Switched from `BrowserRouter` to `HashRouter` inside `src/App.jsx` to map URL hash paths (like `portal.html#/profile` or `portal.html#/login`) cleanly to the routing logic. This fixes routing when navigating directly from landing page buttons.
- **Header Overlap Override**: Overrode the global `position: fixed` header style in the portal views (`Profile.jsx`, `UserDashboardMockup.jsx`, `AdminDashboardMockup.jsx`) by setting `position: 'relative'`. This pushes page content naturally below the header, preventing overlapping and cutoff.
- **RLS Recursion Fix**: Created the `public.is_admin()` helper function with `SECURITY DEFINER` privileges, bypassing RLS recursion. Replaced the old recursive policies on `public.profiles` for SELECT and UPDATE with non-recursive rules checking `public.is_admin()`. This eliminates the `infinite recursion detected` Postgres error shown in logs.

### I. Portal Navigation Sync & Spacing Overrides (Step 10)
- **Portal Header Synchronization**: Replaced the custom portal headers inside the React views (`Profile.jsx`, `UserDashboardMockup.jsx`, `AdminDashboardMockup.jsx`) with the complete 7-tab navigation bar from the public website, including full integration of the responsive mobile menu toggle state.
- **Text Stacking Prevention**: Configured `white-space: nowrap` on both logo text and navigation links globally in `styles.css`. This guarantees that text like "ABOUT COACH" or "BDD BOXING" is never wrapped or stacked.
- **Flex Gap Optimization**: Reduced the `.nav-menu` element's `gap` on desktop layouts to `1.25rem` to allow all navigation links, the new login button, and the booking button to align cleanly on a single line.

### J. Profile Picture Setup & Storage Integration (Step 11)
- **Database Schema Modification**: Added the `avatar_url` text column to the `public.profiles` table.
- **Supabase Storage Bucket**: Set up a private storage bucket named `avatars` with a `2MB` size limit, restricting file types to JPEG, PNG, WEBP, and GIF images.
- **Row Level Security**: Defined storage policies on `storage.objects` for the `avatars` bucket:
  - Users can read/SELECT their own avatar path, and administrators can read/SELECT all user avatars.
  - Only the owner user is permitted to perform write operations (INSERT/UPDATE/DELETE) on files under their unique user directory.
- **State Synchronization & Caching**: Modified `AuthContext.jsx` to fetch and store user avatars as local object URLs. This keeps header avatar displays synced across navigation and prevents redundant downloads.
- **Dynamic Avatar Rendering**: Updated `AvatarDropdown.jsx` and the landing page scripts (`scripts.js`) to render the user's uploaded avatar image when available, falling back to initials.
- **Uploading UI**: Built a profile photo upload interface in `Profile.jsx` with real-time uploading states, CSS keyframe loading indicators, size limits validation, and a remove photo action.

---

## 2. Verification Results

### Build Verification
- Executed `npx vite build`:
  - **Result**: Successfully transformed 1,654 modules and generated production bundles in `2.17 seconds` with zero build errors.

### Local Server Execution
- Started development server (`npm run dev`):
  - **Local URL**: `http://localhost:3000/portal.html`

### Manual Testing Workflow
1. Open `http://localhost:3000/portal.html#/signup` in your browser.
2. Register a test user account (e.g. `testuser@bddboxing.com`).
3. Verify that you are redirected to `/dashboard` displaying the **Role: USER** badge.
4. To test the **Admin Dashboard**, run this SQL query via Supabase SQL Editor or let me execute it for your email:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE email = 'your_email@example.com';
   ```
5. Refresh or navigate to `http://localhost:3000/portal.html#/admin` to access the Admin Dashboard mockup and manage roles live in Supabase.
