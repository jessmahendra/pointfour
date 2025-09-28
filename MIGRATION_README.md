# Brand Migration Script: Airtable → Supabase

This script migrates brand data from your Airtable base to Supabase, replacing any existing fake data with your real brand information.

## Prerequisites

### 1. Environment Variables
Create a `.env.local` file in your project root with the following variables:

```bash
# Airtable Configuration
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_airtable_base_id_here
AIRTABLE_BRANDS_TABLE=Brands  # or your custom table name

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Dependencies
Make sure you have the required dependencies installed:

```bash
npm install airtable @supabase/supabase-js dotenv
```

If you want to run the TypeScript version directly, also install:

```bash
npm install -D tsx
```

## Usage

### Option 1: JavaScript Version
```bash
node migrate-brands.js
```

### Option 2: TypeScript Version
```bash
npx tsx migrate-brands.ts
```

### Option 3: Using npm script (after adding to package.json)
```bash
npm run migrate:brands
```

### Option 4: Test the migration first
```bash
npm run test:migration
```

## Testing the Migration

Before running the actual migration, it's recommended to test your setup:

```bash
npm run test:migration
```

The test script will:
- ✅ Validate your environment variables
- ✅ Test Airtable connection and show sample data
- ✅ Test Supabase connection and show current brands
- ✅ Test write permissions (with cleanup)
- ✅ Show you exactly what will be migrated

## What the Script Does

1. **Validates Configuration**: Checks that all required environment variables are present
2. **Clears Existing Data**: Removes all existing brands from your Supabase `brands` table
3. **Fetches from Airtable**: Retrieves all brand records from your specified Airtable table
4. **Transforms Data**: Maps Airtable fields to Supabase schema:
   - `Brand Name` → `name`
   - `Brand Details Header` → `description`
   - `UK Retailer` → `url`
   - `logo` → `logo_url`
   - Generates URL-friendly `slug` from brand name
5. **Inserts to Supabase**: Batch inserts all transformed brands into Supabase
6. **Provides Summary**: Shows detailed migration statistics

## Field Mapping

The script maps Airtable fields to Supabase columns as follows:

| Airtable Field | Supabase Column | Notes |
|----------------|-----------------|-------|
| `Brand Name` | `name` | Primary field, required |
| `Brand Details Header` | `description` | Falls back to `Description` |
| `UK Retailer` | `url` | Falls back to `Website` |
| `logo` | `logo_url` | Falls back to `Logo` |
| *Generated* | `slug` | URL-friendly version of name |

## Error Handling

The script includes comprehensive error handling:

- **Configuration Validation**: Exits early if environment variables are missing
- **Field Mapping**: Handles missing or differently named fields gracefully
- **Batch Processing**: Inserts data in batches to avoid API limits
- **Detailed Logging**: Provides clear feedback on each step
- **Rollback Safety**: Clears existing data before inserting new data

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Check your `.env.local` file exists and contains all required variables
   - Verify the variable names match exactly (case-sensitive)

2. **"Error fetching brands from Airtable"**
   - Verify your Airtable API key and base ID are correct
   - Check that the table name matches your Airtable table
   - Ensure your API key has read permissions for the base

3. **"Error inserting brands into Supabase"**
   - Verify your Supabase URL and anon key are correct
   - Check that the `brands` table exists in your Supabase database
   - Ensure RLS policies allow inserts (or temporarily disable RLS for migration)

4. **"No brand name found"**
   - Check that your Airtable records have a field named "Brand Name" (case-sensitive)
   - The script tries multiple field name variations, but exact matches work best

### Debug Mode

To see more detailed information about the migration process, the script logs:
- Available fields from the first Airtable record
- Each brand being processed
- Batch insertion progress
- Final migration summary

## Safety Features

- **Non-destructive to Airtable**: Only reads from Airtable, never modifies
- **Clear and Replace**: Completely replaces Supabase data (no duplicates)
- **Validation**: Skips records without required fields
- **Batch Processing**: Handles large datasets efficiently
- **Detailed Logging**: Full visibility into the migration process

## Next Steps

After successfully migrating brands, you can:

1. **Verify the migration**: Check your Supabase dashboard to confirm brands were inserted
2. **Test your application**: Ensure your app can read brands from Supabase
3. **Migrate other data**: Use similar scripts for reviews, products, etc.
4. **Update your app**: Switch from Airtable to Supabase data sources

## Support

If you encounter issues:

1. Check the console output for specific error messages
2. Verify your environment variables are correct
3. Test your Airtable and Supabase connections separately
4. Check the Supabase logs for any database-level errors
