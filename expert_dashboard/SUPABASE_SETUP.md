# Supabase Setup Guide

This guide will help you set up Supabase for the BitterScan Expert Dashboard.

## 1. Supabase Project Setup

1. Go to [Supabase](https://supabase.com) and create a new project
2. Use the following credentials:
   - Project URL: `https://dqbmrakpaxhqmfuwxuqf.supabase.co`
   - API Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxYm1yYWtwYXhocW1mdXd4dXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTc4MTcsImV4cCI6MjA3MTkzMzgxN30.LZmk0N6uhUZ8Tr0T6mPd_J7phpvT5HXwQmoiYnjhKXQ`

## 2. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL commands to create the profiles table:

```sql
-- Create profiles table for storing user profile information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'expert' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
```

This will create:
- A `profiles` table to store user information
- Row Level Security (RLS) policies
- Proper indexes for performance

## 3. Authentication Settings

1. Go to Authentication > Settings in your Supabase dashboard
2. Configure the following:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000/dashboard`
   - **Email Templates**: Customize as needed

## 4. Features Implemented

### Authentication
- ✅ Sign up with email, password, full name, and username
- ✅ Login with email and password
- ✅ Logout functionality
- ✅ Automatic profile creation with role="expert"

### UI/UX Improvements
- ✅ Modern design with rounded corners and shadows
- ✅ Icons inside text fields (User, Mail, Lock, UserCheck)
- ✅ Gradient backgrounds and hover effects
- ✅ Mobile responsive design
- ✅ Loading states and error handling

### Database Integration
- ✅ User data stored in Supabase Auth
- ✅ Profile data stored in `profiles` table
- ✅ Role automatically set to "expert"
- ✅ Secure access with Row Level Security

## 5. Testing

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000/register`
3. Create a new account with:
   - Full Name
   - Username
   - Email
   - Password
4. Verify the user is created in Supabase Auth
5. Check that the profile is created in the `profiles` table with role="expert"
6. Test login functionality
7. Test logout functionality

## 6. Troubleshooting

### Profile Creation Error
If you see "Profile creation error: {}" in the console:

1. **Check RLS Policies**: Ensure the RLS policies are properly set up
2. **Check Table Structure**: Verify the `profiles` table exists with correct columns
3. **Check Permissions**: Make sure the anon role has INSERT permissions
4. **Re-run Setup**: Re-run the SQL commands from the Database Setup section above

### Common Issues:
- **Duplicate Username**: Username must be unique
- **Invalid Email**: Email must be in valid format
- **Weak Password**: Password must be at least 6 characters
- **Network Issues**: Check your internet connection

## 7. File Changes Made

- ✅ Created `src/components/supabase.ts` - Supabase configuration
- ✅ Updated `src/app/register/page.tsx` - Supabase signup with modern UI
- ✅ Updated `src/app/login/page.tsx` - Supabase login with modern UI
- ✅ Updated `src/components/AuthGuard.tsx` - Supabase auth state management
- ✅ Updated `src/components/ProNavbar.tsx` - Supabase logout
- ✅ Updated `src/components/ProSidebar.tsx` - Supabase logout
- ✅ Updated `src/app/profile/page.tsx` - Supabase profile management
- ✅ Removed Firebase dependencies from `package.json`
- ✅ Deleted `src/components/firebase.js`

## 8. Database Schema

The `profiles` table has the following structure:
- `id` (UUID) - References auth.users(id)
- `username` (TEXT) - Unique username
- `full_name` (TEXT) - User's full name
- `email` (TEXT) - User's email
- `role` (TEXT) - Defaults to "expert"
- `created_at` (TIMESTAMP) - Account creation time
- `updated_at` (TIMESTAMP) - Last update time

## 9. Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Secure Authentication**: Supabase handles all auth securely
- **Input Validation**: Client and server-side validation
- **Error Handling**: Graceful error handling with user-friendly messages
