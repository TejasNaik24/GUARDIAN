# Supabase Vector Search Function Fix

## 🔴 Problem

The `match_documents()` function has a type mismatch error:

```
Error code: 42804
Details: Returned type uuid does not match expected type text in column 1
```

## ✅ Solution

Run this SQL in your **Supabase SQL Editor** to fix the function:

```sql
-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS match_documents(vector(768), float, int);

-- Create the corrected function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id text,              -- Changed from uuid to text (matches your hash IDs)
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id::text,           -- Cast to text
    content,
    metadata,
    1 - (embedding <=> query_embedding) as similarity
  FROM documents
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

## 🔍 What This Does

1. **Fixes the type mismatch**: Returns `id::text` instead of `uuid`
2. **Uses cosine distance**: `<=>` operator for vector similarity
3. **Filters by threshold**: Only returns documents above similarity threshold
4. **Orders by similarity**: Most similar documents first
5. **Limits results**: Returns only `match_count` documents

## 📊 Expected Return Format

```json
[
  {
    "id": "abc123...",
    "content": "Medical content chunk...",
    "metadata": {
      "source": "First-Aid-Manual.pdf",
      "chunk_index": 5,
      "total_pages": 120
    },
    "similarity": 0.87
  },
  ...
]
```

## ✅ How to Apply

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Create a **New query**
4. Paste the SQL above
5. Click **Run**
6. You should see: `Success. No rows returned`

## 🧪 Test the Function

After applying the fix, test it with this query:

```sql
-- Generate a test embedding (768 zeros as placeholder)
SELECT * FROM match_documents(
  ARRAY[0.0, 0.0, ... 768 times]::vector(768),
  0.5,
  5
);
```

Or better yet, test from your app by asking Guardian AI a question!

## 🎯 Verify It's Working

After the fix:
1. Ask Guardian AI a question related to your uploaded PDFs
2. Check backend logs for:
   - `🔍 Searching for: [your question]`
   - `✅ Found X similar documents`
3. The response should reference your uploaded documentation

