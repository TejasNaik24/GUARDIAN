# Guardian Authentication Setup Guide

## Overview

Guardian now has a complete authentication system with login, signup, and guest mode functionality.

## Setup Instructions

### 1. Configure Supabase

1. **Create a Supabase Project:**

   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the database to be provisioned

2. **Get Your Credentials:**

   - Go to Project Settings > API
   - Copy the `Project URL` and `anon/public` key

3. **Create Environment File:**

   ```bash
   cd frontend
   cp .env.local.example .env.local
   ```

4. **Add Your Credentials:**
   Edit `.env.local` and add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

### 2. Test the Application

1. **Start the Development Server:**

   ```bash
   cd frontend
   npm run dev
   ```

2. **Test Authentication Flow:**

   - Visit `http://localhost:3000`
   - Click "Start Chatting" to open the login modal
   - Try creating an account with email/password
   - Try "Continue as Guest" for temporary access
   - Verify redirect to `/chat` after login
   - Check guest mode warning banner in chat

3. **Test Guest Mode:**
   - Click "Continue as Guest"
   - You'll be redirected to chat with a yellow warning banner
   - Chat history won't be saved (localStorage only)
   - Close browser and reopen - guest session persists until cleared

### 3. Authentication Features

#### ✅ Implemented Features:

- **Login Form** with email/password
- **Signup Form** with validation (min 6 chars, password match)
- **Guest Mode** for temporary access without signup
- **Protected Routes** - chat page requires authentication
- **Auto-redirect** - authenticated users skip landing page
- **Session Persistence** - remembers logged-in users
- **Guest Session Storage** - localStorage-based guest tracking
- **Header Component** - Log In/Sign Up buttons on landing page
- **Auth Modal** - Smooth transitions between login/signup
- **Error Handling** - User-friendly error messages
- **Loading States** - Proper UI feedback during auth actions

#### 🎨 UI Features:

- Glassmorphism design matching app theme
- Framer Motion animations for smooth transitions
- Escape key closes modal
- Backdrop click closes modal
- Focus trap in modal
- Accessible form inputs
- Mobile responsive

### 4. File Structure

```
frontend/
├── app/
│   ├── layout.tsx              # Wrapped with AuthProvider
│   ├── page.tsx                # Landing page with auth integration
│   └── chat/
│       └── page.tsx            # Protected chat page with guest warning
├── components/
│   ├── auth/
│   │   ├── AuthModal.tsx       # Modal wrapper with mode switching
│   │   ├── LoginForm.tsx       # Login with guest option
│   │   ├── SignupForm.tsx      # Signup with validation
│   │   ├── Header.tsx          # Landing page header
│   │   └── ProtectedRoute.tsx  # Route protection wrapper
│   └── LandingPage.tsx         # Alternative landing page
├── contexts/
│   └── AuthContext.tsx         # Global auth state management
├── lib/
│   ├── supabaseClient.ts       # Supabase client & auth helpers
│   └── guestAuth.ts            # Guest session utilities
└── .env.local                  # Environment variables (create this)
```

### 5. How It Works

#### Authentication Flow:

1. User lands on homepage (`/`)
2. Clicks "Start Chatting" → Auth modal opens
3. Options:
   - **Sign Up:** Create account → Auto-login → Redirect to `/chat`
   - **Log In:** Enter credentials → Redirect to `/chat`
   - **Guest:** Generate temp ID → Redirect to `/chat` with warning

#### Protected Routes:

- `/chat` checks authentication status
- If not authenticated → Redirect to `/`
- If guest mode → Show warning banner
- Loading spinner while checking auth state

#### Session Management:

- **Authenticated Users:** Supabase handles session (cookies + localStorage)
- **Guest Users:** Custom session in localStorage (`guardian_guest_session`)
- AuthContext provides global access via `useAuth()` hook

### 6. Usage in Components

```tsx
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const {
    user, // Supabase user object (null if guest)
    session, // Supabase session object
    guestSession, // Guest session object
    loading, // Auth check in progress
    isAuthenticated, // true if logged in OR guest
    isGuest, // true if guest mode
    signOut, // Logout function
  } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (isGuest) {
    return <GuestWarning />;
  }

  return <ProtectedContent />;
}
```

### 7. Next Steps (Optional Enhancements)

#### Chat History Persistence:

1. Create Supabase tables:

   ```sql
   -- users table (auto-created by Supabase Auth)

   -- chats table
   CREATE TABLE chats (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id),
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- messages table
   CREATE TABLE messages (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     chat_id UUID REFERENCES chats(id),
     role TEXT NOT NULL, -- 'user' or 'assistant'
     content TEXT NOT NULL,
     media_urls TEXT[],
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. Update `useChat` hook to save/load from Supabase
3. Add chat history sidebar
4. Implement "New Chat" functionality

#### Email Verification:

1. Enable email confirmation in Supabase settings
2. Add "Check your email" message after signup
3. Handle email confirmation callback

#### Social Login:

1. Configure OAuth providers in Supabase (Google, GitHub, etc.)
2. Add social login buttons to auth forms
3. Handle OAuth callbacks

#### Password Reset:

1. Add "Forgot password?" link
2. Create password reset form
3. Use `supabase.auth.resetPasswordForEmail()`

### 8. Troubleshooting

**Issue:** "Cannot find module '@supabase/supabase-js'"

- **Solution:** Run `npm install @supabase/supabase-js`

**Issue:** Auth doesn't work

- **Solution:** Check `.env.local` has correct Supabase credentials
- Verify environment variables start with `NEXT_PUBLIC_`
- Restart dev server after adding env vars

**Issue:** Infinite redirect loop

- **Solution:** Check AuthContext isn't causing re-renders
- Verify ProtectedRoute logic
- Clear browser localStorage and cookies

**Issue:** Guest mode not persisting

- **Solution:** Check browser allows localStorage
- Verify `createGuestSession()` is being called
- Check console for errors

### 9. Security Notes

⚠️ **Important:**

- Never commit `.env.local` to git (already in `.gitignore`)
- Use Supabase Row Level Security (RLS) policies for database tables
- Guest sessions are temporary - data is not secure
- Implement rate limiting for auth endpoints
- Add CAPTCHA for signup to prevent bots

### 10. Testing Checklist

- [ ] Sign up with new email
- [ ] Login with existing account
- [ ] Continue as guest
- [ ] Verify redirect to chat after auth
- [ ] Check guest warning banner appears
- [ ] Try accessing `/chat` without auth (should redirect)
- [ ] Logout and verify redirect to landing
- [ ] Test "forgot password" flow (if implemented)
- [ ] Test mobile responsive design
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Verify email validation
- [ ] Check password length validation
- [ ] Test password mismatch error

---

## Quick Start

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Start development server
npm run dev

# 4. Open browser
open http://localhost:3000
```

🎉 **You're all set!** Click "Start Chatting" and try the authentication flow.
