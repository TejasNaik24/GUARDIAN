# Conversation System Setup Guide

## 📋 Overview

Your Guardian AI chat app now has a complete conversation management system similar to ChatGPT, with:

- ✅ Persistent conversation storage in Supabase
- ✅ Left sidebar with conversation list
- ✅ Message history for each conversation
- ✅ Auto-generated conversation titles
- ✅ Smooth animations with Framer Motion
- ✅ Mobile-responsive design
- ✅ TypeScript support

---

## 🗄️ Database Setup

### Step 1: Run the SQL Migration

Execute the SQL file in your Supabase SQL Editor:

```bash
# Location: frontend/lib/database/conversations.sql
```

This creates:

- **`conversations` table**: Stores conversation metadata
- **`messages` table**: Stores all messages (user + assistant)
- **Row Level Security (RLS)**: Users can only access their own data
- **Indexes**: For optimal query performance
- **Triggers**: Auto-update `updated_at` timestamp

### Step 2: Verify Tables

After running the migration, verify in Supabase Dashboard:

1. Go to **Table Editor**
2. You should see:
   - `conversations` table with columns: `id`, `user_id`, `title`, `created_at`, `updated_at`
   - `messages` table with columns: `id`, `conversation_id`, `role`, `content`, `created_at`

---

## 🏗️ Architecture

### File Structure

```
frontend/
├── types/
│   └── conversation.ts                 # TypeScript interfaces
├── contexts/
│   └── ConversationContext.tsx         # Global conversation state
├── components/
│   └── chat/
│       ├── ConversationSidebar.tsx     # Left sidebar with conversation list
│       ├── ConversationListItem.tsx    # Individual conversation item
│       ├── MessageLoader.tsx           # Message display with auto-scroll
│       └── ConversationChatInput.tsx   # Message input component
├── app/
│   ├── layout.tsx                      # Added ConversationProvider
│   └── chat/
│       └── page.tsx                    # Updated chat page
└── lib/
    └── database/
        └── conversations.sql           # Database migration
```

### Context Hierarchy

```
SupabaseProvider (Session Management)
  └── AuthProvider (Legacy Auth)
      └── ConversationProvider (Conversation State)
          └── Your App Components
```

---

## 🎯 How It Works

### 1. **ConversationContext**

Manages all conversation state and operations:

```typescript
const {
  conversations, // Array of all conversations
  currentConversation, // Currently selected conversation
  messages, // Messages in current conversation
  loading, // Loading state
  error, // Error messages

  // Actions
  loadConversations, // Fetch all conversations
  createConversation, // Create new conversation
  selectConversation, // Switch to a conversation
  renameConversation, // Update conversation title
  deleteConversation, // Remove a conversation
  loadMessages, // Load messages for conversation
  addMessage, // Add a new message
  clearCurrentConversation, // Clear selection
} = useConversation();
```

### 2. **Conversation Sidebar**

- Collapsible sidebar with Framer Motion animations
- **New Chat** button to create conversations
- List of conversations sorted by `updated_at` (most recent first)
- Each item shows:
  - Title
  - Last message preview (first 50 chars)
  - Last updated date
  - Delete button (on hover)
- Mobile-friendly with overlay and toggle button

### 3. **Message Display**

- Shows all messages for selected conversation
- Auto-scrolls to bottom when new messages arrive
- Beautiful message bubbles:
  - **User messages**: Blue gradient, right-aligned
  - **Assistant messages**: White, left-aligned
- Timestamps for each message
- Empty state prompts

### 4. **Chat Input**

- Text input with send button
- Auto-creates conversation if none exists
- Supports Enter to send, Shift+Enter for newline
- Loading state while sending
- Placeholder assistant response (ready for AI integration)

---

## 🚀 Usage

### For Logged-In Users

1. **Start New Chat**:

   - Click "New Chat" button in sidebar
   - Or start typing in the input (auto-creates conversation)

2. **View Conversation History**:

   - All conversations appear in left sidebar
   - Click any conversation to load its messages

3. **Send Messages**:

   - Type in the input box at the bottom
   - Press Enter to send
   - Messages automatically save to Supabase

4. **Delete Conversations**:
   - Hover over a conversation in the sidebar
   - Click the trash icon
   - Confirm deletion

### For Guest Users

- Conversation system is **disabled** for guests
- They see the original VoiceChatContainer
- Prompt to create account to access conversation history

---

## 🔌 AI Integration Points

### Connect Your AI Backend

Update `ConversationChatInput.tsx` to integrate your AI:

```typescript
// Replace the placeholder response in handleSubmit():
// Line ~40-45 in ConversationChatInput.tsx

// Add user message
await addMessage(convId, "user", messageText);

// Call your AI backend
const aiResponse = await fetch("/api/chat", {
  method: "POST",
  body: JSON.stringify({
    message: messageText,
    conversationId: convId,
  }),
});

const data = await aiResponse.json();

// Add assistant response
await addMessage(convId, "assistant", data.response);
```

### Recommended AI Integration

1. **Server-Side API Route** (`app/api/chat/route.ts`):

   ```typescript
   export async function POST(req: Request) {
     const { message, conversationId } = await req.json();

     // Load conversation history from Supabase
     const history = await loadConversationHistory(conversationId);

     // Call your AI service (OpenAI, Anthropic, etc.)
     const aiResponse = await yourAIService.chat({
       messages: history,
       newMessage: message,
     });

     return Response.json({ response: aiResponse });
   }
   ```

2. **Streaming Responses** (Advanced):
   - Use Server-Sent Events (SSE) for streaming
   - Update MessageLoader to handle partial messages
   - Show typing indicator while streaming

---

## 📱 Mobile Responsiveness

The conversation system is fully mobile-responsive:

- **Desktop** (lg breakpoint and up):

  - Sidebar always visible
  - Smooth slide animations
  - 320px sidebar width

- **Mobile** (below lg breakpoint):
  - Sidebar hidden by default
  - Toggle button in top-left corner
  - Full-screen overlay when open
  - Tap outside to close

---

## 🎨 Customization

### Change Sidebar Width

```tsx
// In ConversationSidebar.tsx, line ~68
<motion.aside
  className="... w-80 ..."  // Change from w-80 to w-96, w-64, etc.
>
```

### Modify Message Styles

```tsx
// In MessageLoader.tsx, lines ~85-90
className={`... ${
  message.role === "user"
    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
    : "bg-white text-gray-900 border border-gray-200"
}`}
```

### Auto-Title Generation

The system automatically generates titles from the first user message:

```typescript
// In ConversationContext.tsx, lines ~158-162
if (role === "user" && currentConversation?.title === "New Conversation") {
  const newTitle =
    content.substring(0, 50) + (content.length > 50 ? "..." : "");
  await renameConversation(conversationId, newTitle);
}
```

---

## 🐛 Troubleshooting

### Database Errors

**Error: "relation 'conversations' does not exist"**

- Solution: Run the SQL migration in Supabase SQL Editor

**Error: "permission denied for table conversations"**

- Solution: RLS policies not applied. Re-run the SQL migration

### UI Issues

**Sidebar doesn't appear**

- Check that user is logged in (not guest mode)
- Verify `ConversationProvider` is in `app/layout.tsx`

**Messages not loading**

- Check browser console for errors
- Verify Supabase connection in Network tab
- Check RLS policies in Supabase Dashboard

**Auto-scroll not working**

- This is a known CSS issue with flex containers
- Verify `MessageLoader` has `h-full` class
- Check that parent container is `flex flex-col`

---

## 🔒 Security

All database access is protected by Row Level Security (RLS):

- ✅ Users can only view their own conversations
- ✅ Users can only create messages in their conversations
- ✅ Users can only update/delete their own data
- ✅ Server-side auth validation with Supabase

**No additional backend auth needed** - Supabase handles it!

---

## 📊 Database Queries

### Get All Conversations (with Last Message)

```sql
SELECT
  c.*,
  (
    SELECT content
    FROM messages
    WHERE conversation_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
  ) as last_message
FROM conversations c
WHERE user_id = auth.uid()
ORDER BY updated_at DESC;
```

### Get Messages for Conversation

```sql
SELECT *
FROM messages
WHERE conversation_id = $1
ORDER BY created_at ASC;
```

---

## 🚀 Next Steps

1. **Run the SQL migration** in Supabase
2. **Test the conversation system**:
   - Create a new conversation
   - Send messages
   - Delete a conversation
   - Check mobile responsiveness
3. **Integrate your AI backend** in `ConversationChatInput.tsx`
4. **Optional enhancements**:
   - Add conversation search
   - Add conversation folders/categories
   - Add conversation sharing
   - Add export conversation feature
   - Add conversation analytics

---

## 📝 Example Usage

```typescript
import { useConversation } from "@/contexts/ConversationContext";

function MyComponent() {
  const { conversations, createConversation, addMessage } = useConversation();

  const handleNewChat = async () => {
    const conv = await createConversation("My New Chat");
    if (conv) {
      await addMessage(conv.id, "user", "Hello!");
    }
  };

  return (
    <div>
      <button onClick={handleNewChat}>New Chat</button>
      <ul>
        {conversations.map((conv) => (
          <li key={conv.id}>{conv.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## ✅ Checklist

Before going to production:

- [ ] SQL migration executed in Supabase
- [ ] RLS policies verified and working
- [ ] Conversation creation tested
- [ ] Message sending tested
- [ ] Conversation deletion tested
- [ ] Mobile UI tested
- [ ] AI backend integrated
- [ ] Error handling tested
- [ ] Loading states work correctly
- [ ] Auto-scroll working
- [ ] Timestamps displaying correctly

---

## 🎉 You're Ready!

The conversation system is fully integrated and ready to use. All you need to do is:

1. Run the SQL migration
2. Connect your AI backend
3. Test and enjoy!

For questions or issues, check the code comments or the troubleshooting section above.
