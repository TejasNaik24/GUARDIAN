# Supabase Session Management Documentation

## ✅ Complete Session Management System

Your app now has full Supabase session management with automatic state updates across all components.

---

## 📁 Files Created

### 1. **`app/providers/SupabaseProvider.tsx`** - Session Provider

The main provider that manages session state globally:

```tsx
<SupabaseProvider>
  <YourApp />
</SupabaseProvider>
```

**Features:**

- ✅ Fetches session on mount
- ✅ Subscribes to `onAuthStateChange`
- ✅ Exposes `session`, `user`, `loading`
- ✅ Provides `refreshSession()` method
- ✅ Automatic updates on login/logout
- ✅ Zero flickering with loading state
- ✅ TypeScript typed

**Context Values:**

- `session: Session | null` - Current Supabase session
- `user: User | null` - Current authenticated user
- `loading: boolean` - Initial loading state
- `refreshSession: () => Promise<void>` - Manually refresh session

### 2. **`hooks/useSupabaseSession.ts`** - Session Hook

Easy-to-use hook for accessing session in components:

```tsx
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

function MyComponent() {
  const { session, user, loading } = useSupabaseSession();

  // Your component logic
}
```

### 3. **`app/layout.tsx`** - Updated Root Layout

Wrapped entire app with `<SupabaseProvider>`:

```tsx
<SupabaseProvider>
  <AuthProvider>{children}</AuthProvider>
</SupabaseProvider>
```

---

## 🚀 Usage Examples

### Basic Usage - Check if User is Logged In

```tsx
"use client";

import { useSupabaseSession } from "@/hooks/useSupabaseSession";

export default function MyComponent() {
  const { user, loading } = useSupabaseSession();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in</div>;
  }

  return <div>Welcome, {user.email}!</div>;
}
```

### Get Full Session Data

```tsx
"use client";

import { useSupabaseSession } from "@/hooks/useSupabaseSession";

export default function SessionInfo() {
  const { session, user, loading } = useSupabaseSession();

  if (loading) return <p>Checking session...</p>;
  if (!session) return <p>No active session</p>;

  return (
    <div>
      <h2>Session Info</h2>
      <p>Email: {user?.email}</p>
      <p>User ID: {user?.id}</p>
      <p>Access Token: {session.access_token.slice(0, 20)}...</p>
      <p>Expires At: {new Date(session.expires_at! * 1000).toLocaleString()}</p>
    </div>
  );
}
```

### Manually Refresh Session

```tsx
"use client";

import { useSupabaseSession } from "@/hooks/useSupabaseSession";

export default function RefreshButton() {
  const { refreshSession } = useSupabaseSession();

  const handleRefresh = async () => {
    await refreshSession();
    console.log("Session refreshed!");
  };

  return <button onClick={handleRefresh}>Refresh Session</button>;
}
```

### Protected Component

```tsx
"use client";

import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedPage() {
  const { user, loading } = useSupabaseSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div>
      <h1>Protected Content</h1>
      <p>Only logged-in users can see this!</p>
    </div>
  );
}
```

### Real-time Auth Status Display

```tsx
"use client";

import { useSupabaseSession } from "@/hooks/useSupabaseSession";

export default function AuthStatus() {
  const { user, loading } = useSupabaseSession();

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded shadow">
      {loading ? (
        <p className="text-gray-500">Checking auth...</p>
      ) : user ? (
        <div className="text-green-600">
          <p className="font-semibold">✓ Logged In</p>
          <p className="text-sm">{user.email}</p>
        </div>
      ) : (
        <p className="text-red-600">✗ Not Logged In</p>
      )}
    </div>
  );
}
```

### Conditional Rendering Based on Auth

```tsx
"use client";

import { useSupabaseSession } from "@/hooks/useSupabaseSession";

export default function ConditionalUI() {
  const { user, loading } = useSupabaseSession();

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      {user ? (
        <>
          <h1>Welcome back, {user.email}!</h1>
          <DashboardContent />
          <LogoutButton />
        </>
      ) : (
        <>
          <h1>Welcome to Guardian</h1>
          <LoginButton />
          <SignupButton />
        </>
      )}
    </div>
  );
}
```

---

## 🔄 How It Works

### 1. Initial Load

```
App starts
  → SupabaseProvider mounts
  → Calls supabase.auth.getSession()
  → Sets session & user
  → Sets loading = false
  → UI renders with auth state
```

### 2. User Logs In

```
User logs in
  → Supabase fires SIGNED_IN event
  → onAuthStateChange callback triggers
  → Updates session & user in context
  → ALL components using hook re-render automatically
```

### 3. User Logs Out

```
User logs out
  → Supabase fires SIGNED_OUT event
  → onAuthStateChange callback triggers
  → Clears session & user (sets to null)
  → ALL components using hook re-render automatically
```

### 4. Token Refresh

```
Token expires
  → Supabase auto-refreshes
  → Fires TOKEN_REFRESHED event
  → Updates session in context
  → App continues working seamlessly
```

---

## 🎯 Benefits

✅ **No Flickering**: Loading state prevents UI jumps  
✅ **Instant Updates**: All components react to auth changes  
✅ **Type-Safe**: Full TypeScript support  
✅ **Simple API**: One hook to rule them all  
✅ **Automatic**: Subscribes and cleans up automatically  
✅ **Client-Side**: No SSR complexity  
✅ **Global State**: Share auth across entire app  
✅ **Event Logging**: Console logs for debugging

---

## 🔐 Auth Events Handled

The provider listens to these Supabase auth events:

- `SIGNED_IN` - User successfully logged in
- `SIGNED_OUT` - User logged out
- `TOKEN_REFRESHED` - Access token refreshed
- `USER_UPDATED` - User metadata updated
- `PASSWORD_RECOVERY` - Password reset initiated

All events update the session state automatically.

---

## 📊 Session Object Structure

```typescript
interface Session {
  access_token: string; // JWT access token
  refresh_token: string; // Refresh token
  expires_in: number; // Token expiry (seconds)
  expires_at?: number; // Unix timestamp
  token_type: "bearer"; // Token type
  user: User; // User object
}

interface User {
  id: string; // User UUID
  email?: string; // User email
  phone?: string; // User phone
  created_at: string; // Creation timestamp
  user_metadata: {
    // Custom metadata
    full_name?: string;
    avatar_url?: string;
    // ... any custom fields
  };
  app_metadata: {
    // App metadata
    provider?: string; // OAuth provider
    providers?: string[]; // All providers used
  };
}
```

---

## 🧪 Testing Checklist

Test these scenarios:

- [ ] Fresh page load shows correct auth state
- [ ] Login updates all components instantly
- [ ] Logout updates all components instantly
- [ ] Google OAuth login works
- [ ] Token refresh doesn't break session
- [ ] Loading state shows on initial load
- [ ] No flickering between states
- [ ] Profile updates reflect immediately
- [ ] Multiple tabs stay synced
- [ ] Session persists across page reloads

---

## 🔧 Integration with Existing Code

### Replace AuthContext Usage (Optional)

You can now use either:

**Old Way (AuthContext):**

```tsx
import { useAuth } from "@/contexts/AuthContext";
const { user, loading } = useAuth();
```

**New Way (SupabaseProvider):**

```tsx
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
const { user, loading } = useSupabaseSession();
```

Both work! The new provider gives you more session details.

### Use in Existing Components

Simply add the hook to any component:

```tsx
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

export default function ExistingComponent() {
  const { user, session, loading } = useSupabaseSession();

  // Rest of your existing code
}
```

---

## 🐛 Troubleshooting

### "Session not updating"

- Check SupabaseProvider is wrapping your app
- Verify supabaseClient.ts is configured correctly
- Check browser console for auth events

### "Loading state stuck on true"

- Verify Supabase URL and keys are correct
- Check network tab for failed requests
- Try clearing cookies and refreshing

### "Components not re-rendering"

- Ensure you're using the hook, not importing context directly
- Check SupabaseProvider is above component in tree
- Verify component is a Client Component ("use client")

---

## 🚀 Next Steps

Now that you have session management:

1. **Update Protected Routes**: Use hook in route guards
2. **Add to Profile Page**: Show user info dynamically
3. **Create Admin Dashboard**: Gate admin features
4. **Add Activity Logging**: Track user actions
5. **Build User Settings**: Let users update preferences

---

## 📚 Related Files

- `lib/supabaseClient.ts` - Supabase client config
- `contexts/AuthContext.tsx` - Existing auth context
- `components/auth/*` - Auth components
- `app/layout.tsx` - Root layout with providers

---

**Session management is now active!** 🎉

All components can now access real-time session state using `useSupabaseSession()`
