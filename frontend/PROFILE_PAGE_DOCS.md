# Profile Page Implementation

## ✅ Complete Profile Management System

A full-featured profile page has been added to your Guardian app where authenticated users can view and update their information.

---

## 📁 Files Created/Updated

### New Files:

1. **`app/profile/page.tsx`** - Complete profile page component

   - View and edit user metadata
   - Update full name, username, and avatar URL
   - Save changes to both Auth and database
   - Loading and success/error states
   - Beautiful Tailwind UI

2. **`lib/serverAuth.ts`** - Server-side authentication helpers
   - `getServerSession()` - Get current user on server
   - `requireAuth()` - Enforce authentication
   - `getUserProfile()` - Fetch profile from database

### Updated Files:

3. **`middleware.ts`** - Added profile route protection

   - Redirects unauthenticated users from `/profile` to `/chat`
   - `/chat` shows auth modal for guests

4. **`components/auth/UserProfileMenu.tsx`** - Added profile link
   - "Profile Settings" menu item for logged-in users
   - "Create Account" menu item for guests
   - Navigates to `/profile`

---

## 🎨 Features

### Profile Page (`/profile`)

✅ **User Information Display**

- Email address (read-only, locked)
- Full name (editable)
- Username (editable)
- Avatar URL (editable text input)

✅ **Form Features**

- Auto-loads current user data
- Real-time form updates
- Validation and error handling
- Success notifications
- Loading states during save

✅ **Data Persistence**

- Updates `user_metadata` in Supabase Auth
- Syncs to `profiles` table in database
- Changes reflect immediately

✅ **UI/UX**

- Gradient background
- Responsive design
- Smooth animations with Framer Motion
- Icon-based navigation
- Mobile-friendly

✅ **Security**

- Protected route (middleware)
- Requires authentication
- Auto-redirects if not logged in
- Uses AuthContext for session

---

## 🔐 Route Protection

The profile page is protected by:

1. **Middleware** (`middleware.ts`)

   - Checks for `sb-access-token` cookie
   - Redirects unauthenticated users to `/chat`

2. **Client-side Check** (in page component)

   - Uses `useAuth()` hook
   - Checks `user` state
   - Redirects if no session

3. **Loading States**
   - Shows spinner while checking auth
   - Prevents flash of protected content

---

## 🚀 How to Use

### For Users:

1. **Access Profile**

   - Click your avatar in bottom-left corner
   - Select "Profile Settings"
   - Or navigate directly to `/profile`

2. **Edit Information**

   - Update full name, username, or avatar URL
   - Click "Save Changes"
   - See success message

3. **Navigate Back**
   - Click "Cancel" button
   - Or click X in top-right corner
   - Returns to `/chat`

### For Developers:

#### Access Profile Data:

```tsx
import { useAuth } from "@/contexts/AuthContext";

const { user } = useAuth();
console.log(user?.user_metadata?.full_name);
```

#### Server-Side Auth:

```tsx
import { getServerSession, requireAuth } from "@/lib/serverAuth";

// Get session
const { user } = await getServerSession();

// Require auth (throws if not logged in)
const user = await requireAuth();
```

#### Update Profile:

```tsx
await supabase.auth.updateUser({
  data: {
    full_name: "John Doe",
    username: "johndoe",
    avatar_url: "https://example.com/avatar.jpg",
  },
});
```

---

## 🗄️ Database Schema

The profile page expects a `profiles` table with:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Make sure:

- Row Level Security (RLS) is enabled
- Users can read/update their own profile
- Foreign key relationship with `auth.users`

---

## 📝 Profile Fields

| Field        | Type   | Editable | Description           |
| ------------ | ------ | -------- | --------------------- |
| `email`      | string | ❌ No    | User's email (locked) |
| `full_name`  | string | ✅ Yes   | Display name          |
| `username`   | string | ✅ Yes   | Unique username       |
| `avatar_url` | string | ✅ Yes   | Profile picture URL   |

---

## 🔄 Data Flow

1. **Page Load**

   ```
   User visits /profile
   → Middleware checks auth
   → Component loads
   → Fetches user data from Auth
   → Fetches profile from database
   → Merges data and displays
   ```

2. **Save Changes**

   ```
   User clicks "Save Changes"
   → Updates user_metadata in Auth
   → Updates profiles table in DB
   → Shows success message
   → Data synced everywhere
   ```

3. **Navigation**
   ```
   User clicks profile menu
   → Opens dropdown
   → Clicks "Profile Settings"
   → Navigates to /profile
   ```

---

## 🎨 Styling

- **Gradient background**: `bg-linear-to-br from-[#F8FAFC] to-[#E0E7FF]`
- **Card shadow**: `shadow-2xl`
- **Primary color**: `#3B82F6` (blue)
- **Accent color**: `#1E3A8A` (dark blue)
- **Responsive**: Mobile-first design
- **Icons**: Heroicons (inline SVG)

---

## 🔒 Security Notes

✅ Email cannot be changed (security)  
✅ Middleware protects route  
✅ Client-side auth check  
✅ HTTP-only cookies for tokens  
✅ Updates validated server-side  
✅ RLS policies on database

---

## 🐛 Troubleshooting

### "Not redirecting when logged out"

- Check AuthContext is working
- Verify middleware is running
- Check cookie names match

### "Changes not saving"

- Check Supabase connection
- Verify profiles table exists
- Check RLS policies allow updates

### "Avatar not showing"

- Ensure URL is publicly accessible
- Check CORS settings
- Verify URL format is valid

### "Profile data not loading"

- Check profiles table has matching user ID
- Verify foreign key relationship
- Check RLS policies allow reads

---

## ✨ Future Enhancements

Potential improvements:

- 📸 **Image Upload**: Upload avatar directly (not just URL)
- 🔐 **Password Change**: Update password from profile
- 🎨 **Theme Preference**: Dark/light mode toggle
- 🔔 **Notifications**: Email notification settings
- 🗑️ **Account Deletion**: Delete account option
- 📊 **Usage Stats**: Display user statistics
- 🏷️ **Bio Field**: Add user biography
- 🌍 **Location**: Add location field

---

## 📚 Related Files

- `contexts/AuthContext.tsx` - Auth state management
- `components/auth/UserProfileMenu.tsx` - Profile menu
- `middleware.ts` - Route protection
- `lib/supabaseClient.ts` - Supabase config
- `app/chat/page.tsx` - Protected chat page

---

**Profile page is ready to use!** 🎉

Users can now manage their information at `/profile`
