# Google OAuth Setup Guide

## ✅ Implementation Complete

Your Google OAuth is now fully integrated with Supabase Auth!

## 🔧 What Was Added

### 1. **Server-Side Route Handler** (`app/auth/callback/route.ts`)

- Handles the OAuth redirect from Google
- Exchanges authorization code for session
- Sets secure HTTP-only cookies
- Handles errors gracefully

### 2. **Client-Side Callback Page** (`app/auth/callback/page.tsx`)

- Shows loading UI while processing authentication
- Creates user profile in database if new user
- Extracts Google profile data (name, avatar)
- Redirects to `/chat` on success

### 3. **Middleware** (`middleware.ts`)

- Protects routes based on authentication status
- Redirects logged-in users away from login/signup pages
- Checks for session cookies

### 4. **Updated Auth Forms**

- **LoginForm**: Added "Continue with Google" button
- **SignupForm**: Added "Continue with Google" button
- Both use `supabase.auth.signInWithOAuth({ provider: 'google' })`

### 5. **Enhanced Supabase Client** (`lib/supabaseClient.ts`)

- Added auth options for better session handling
- `autoRefreshToken`: Automatically refreshes tokens
- `persistSession`: Persists sessions across page reloads
- `detectSessionInUrl`: Detects OAuth callback parameters

## 📋 Supabase Configuration Required

Before Google OAuth works, configure it in your Supabase dashboard:

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Set **Application type**: Web application
6. Add **Authorized JavaScript origins**:
   - `http://localhost:3000` (for development)
   - `https://your-production-domain.com` (for production)
7. Add **Authorized redirect URIs**:
   - `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
8. Copy the **Client ID** and **Client Secret**

### Step 2: Configure Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** and enable it
5. Paste your **Client ID** and **Client Secret**
6. Under **Site URL**, add: `http://localhost:3000` (dev) or your production URL
7. Under **Redirect URLs**, add:
   - `http://localhost:3000/auth/callback`
   - `https://your-production-domain.com/auth/callback`
8. Click **Save**

### Step 3: Test Locally

1. Start your development server: `npm run dev`
2. Navigate to login or signup page
3. Click "Continue with Google"
4. You'll be redirected to Google's consent screen
5. After authorization, you'll return to `/chat`

## 🔐 Security Features

✅ **HTTP-Only Cookies**: Access tokens stored securely  
✅ **PKCE Flow**: Authorization code flow with code exchange  
✅ **Automatic Token Refresh**: Seamless session management  
✅ **Error Handling**: User-friendly error messages  
✅ **Profile Creation**: Auto-creates database profile for new users  
✅ **Session Detection**: Detects existing sessions on page load

## 🧪 Testing Checklist

- [ ] Google OAuth button appears on login page
- [ ] Google OAuth button appears on signup page
- [ ] Clicking button redirects to Google consent screen
- [ ] After consent, user is redirected to `/auth/callback`
- [ ] Loading screen shows during authentication
- [ ] User is redirected to `/chat` after successful auth
- [ ] Profile is created in `profiles` table with Google data
- [ ] User can access protected routes
- [ ] Session persists across page reloads
- [ ] Logout works correctly

## 🐛 Troubleshooting

### "Invalid OAuth Configuration"

- Verify Client ID and Secret in Supabase
- Check redirect URIs match exactly

### "Unable to exchange code for session"

- Ensure callback route is accessible
- Check server logs for detailed errors

### "No session found"

- Clear browser cookies and try again
- Verify Supabase project URL is correct

### "Profile creation failed"

- Check `profiles` table exists
- Verify table permissions in Supabase

## 📁 File Structure

```
frontend/
├── app/
│   ├── auth/
│   │   ├── callback/
│   │   │   ├── page.tsx      # Client-side callback UI
│   │   │   └── route.ts      # Server-side OAuth handler
│   │   └── reset/
│   │       └── page.tsx      # Password reset page
│   └── chat/
│       └── page.tsx          # Protected chat page
├── components/
│   └── auth/
│       ├── LoginForm.tsx     # With Google OAuth button
│       ├── SignupForm.tsx    # With Google OAuth button
│       └── ForgotPasswordModal.tsx
├── lib/
│   └── supabaseClient.ts     # Enhanced Supabase config
└── middleware.ts             # Route protection
```

## 🎨 UI Features

- **Google Brand Colors**: Official Google logo colors
- **Consistent Styling**: Matches existing auth UI
- **Loading States**: Smooth animations during auth
- **Error Messages**: User-friendly error display
- **Mobile Responsive**: Works on all screen sizes

## 🚀 Next Steps

1. Configure Google OAuth in Supabase dashboard
2. Test the complete flow locally
3. Deploy to production
4. Update production redirect URLs
5. Test on production domain

---

**Need Help?** Check Supabase docs: https://supabase.com/docs/guides/auth/social-login/auth-google
