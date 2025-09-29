# Anonymous User Recommendation Sharing - Implementation Guide

## Overview

This implementation enables users to share product recommendations with non-users by creating shareable links that work for anonymous visitors. The system stores recommendations in the database and generates unique tokens for public access.

## What Was Fixed

### 1. Database Schema Issues
- **Problem**: The original `user_recommendations` table had RLS policies that didn't properly support anonymous users
- **Solution**: Updated the table schema and policies to allow anonymous users to create and share recommendations

### 2. API Endpoint Limitations
- **Problem**: API endpoints required authentication, preventing anonymous users from creating recommendations
- **Solution**: Modified endpoints to work with both authenticated and anonymous users

### 3. Missing Public Access
- **Problem**: Shared recommendations couldn't be accessed by non-users
- **Solution**: Implemented public read access for shared recommendations with proper RLS policies

## Files Modified

### Database Schema
- **File**: `fix-anonymous-sharing.sql`
- **Purpose**: Complete database setup for anonymous user recommendations
- **Key Features**:
  - Supports both authenticated and anonymous users
  - Automatic share token generation
  - Public read access for shared recommendations
  - View count tracking
  - Automatic expiration (30 days)

### API Endpoints
- **File**: `src/app/api/recommendations/route.ts`
- **Changes**: Enhanced `saveRecommendation` function with better error handling and anonymous user support

- **File**: `src/app/api/user-recommendations/route.ts`
- **Changes**: Removed authentication requirement for POST endpoint

- **File**: `src/app/api/user-recommendations/[token]/route.ts`
- **Changes**: Enhanced GET endpoint with better error handling and public access

### Test Script
- **File**: `test-anonymous-sharing.js`
- **Purpose**: Comprehensive test of the sharing functionality

## How It Works

### 1. Creating a Shareable Recommendation

```javascript
// Anonymous user creates a recommendation
const response = await fetch('/api/recommendations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Brand/Item: Nike Air Max',
    userProfile: { ukClothingSize: '10', height: '5\'6"' },
    productId: '123',
    makeShareable: true
  })
});

const result = await response.json();
// result.shareToken contains the unique token
// result.shareUrl contains the shareable link
```

### 2. Viewing a Shared Recommendation

```javascript
// Anyone can view the shared recommendation
const response = await fetch(`/api/user-recommendations/${shareToken}`);
const data = await response.json();
// data.data contains the recommendation, product info, and user profile
```

### 3. Frontend Display

The shared recommendation is displayed at `/shared/[token]` with:
- Product information
- Personalized recommendations
- User profile context (if available)
- View count tracking
- Expiration information

## Database Schema Details

### Table Structure
```sql
CREATE TABLE user_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Can be NULL
  product_id bigint REFERENCES products(id) ON DELETE CASCADE,
  query text NOT NULL,
  recommendation_data jsonb NOT NULL,
  user_profile jsonb,
  share_token text UNIQUE,
  is_shared boolean DEFAULT false,
  expires_at timestamp with time zone,
  view_count integer DEFAULT 0,
  last_viewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### Key Features
- **Anonymous Support**: `user_id` can be NULL for anonymous users
- **Unique Tokens**: Automatic generation of unique share tokens
- **Public Access**: RLS policies allow public read access to shared recommendations
- **Expiration**: Recommendations expire after 30 days
- **View Tracking**: Counts how many times a shared recommendation has been viewed

## RLS Policies

### 1. Public Read Access
```sql
CREATE POLICY "Public read access to shared recommendations"
ON public.user_recommendations
FOR SELECT
USING (is_shared = true AND share_token IS NOT NULL AND expires_at > now());
```

### 2. Anonymous Creation
```sql
CREATE POLICY "Anyone can create recommendations"
ON public.user_recommendations
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  (auth.uid() IS NULL AND user_id IS NULL)
);
```

## Usage Instructions

### 1. Run the Database Setup
Execute the SQL script in your Supabase dashboard:
```sql
-- Copy and paste the contents of fix-anonymous-sharing.sql
```

### 2. Test the Implementation
Run the test script to verify everything works:
```bash
node test-anonymous-sharing.js
```

### 3. Frontend Integration
The existing frontend components already support this functionality:
- `ProductRecommendations.tsx` - Creates shareable recommendations
- `shared/[token]/page.tsx` - Displays shared recommendations

## Security Considerations

1. **Token Uniqueness**: Each share token is cryptographically unique
2. **Expiration**: Recommendations automatically expire after 30 days
3. **RLS Protection**: Database policies prevent unauthorized access
4. **View Tracking**: Monitors usage without exposing sensitive data

## Benefits

1. **User Experience**: Users can share recommendations without requiring recipients to sign up
2. **Viral Growth**: Easy sharing encourages more users to discover the platform
3. **Data Persistence**: Recommendations are stored and accessible even if the original user leaves
4. **Analytics**: View count tracking provides insights into popular recommendations

## Troubleshooting

### Common Issues

1. **"Authentication required" error**
   - Ensure the API endpoints have been updated to support anonymous users
   - Check that RLS policies allow anonymous access

2. **"Shared recommendation not found" error**
   - Verify the share token is correct
   - Check if the recommendation has expired
   - Ensure `is_shared` is set to true

3. **Database permission errors**
   - Run the complete SQL setup script
   - Verify that anonymous users have proper permissions

### Debug Steps

1. Check the browser console for API errors
2. Verify database policies are correctly applied
3. Test with the provided test script
4. Check Supabase logs for RLS policy violations

## Future Enhancements

1. **Custom Expiration**: Allow users to set custom expiration times
2. **Password Protection**: Add optional password protection for shared links
3. **Analytics Dashboard**: Show detailed analytics for shared recommendations
4. **Bulk Sharing**: Allow sharing multiple recommendations at once
5. **Social Integration**: Add social media sharing buttons

This implementation provides a robust foundation for anonymous user recommendation sharing while maintaining security and performance.
