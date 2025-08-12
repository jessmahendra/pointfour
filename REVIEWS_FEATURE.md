# User Reviews Feature

## Overview
The browser extension now displays user reviews for specific fashion items and brands, providing users with valuable fit information and recommendations from other shoppers.

## Features

### 1. Review Display
- Shows up to 10 most relevant reviews for a brand/item combination
- Reviews are sorted by submission date (newest first) and fit rating (highest first)
- Each review displays:
  - Item name and garment type
  - Fit rating (1-5 stars)
  - User body type and sizing information
  - Fit comments and recommendations
  - Whether the user would recommend the item

### 2. Smart Filtering
- Reviews are filtered by brand name (case-insensitive)
- Optional filtering by item name for more specific results
- Partial matching for item names (e.g., "dress" will match "Floral Print Wrap Dress")

### 3. API Endpoints

#### Check Brand Data
```
POST /api/extension/check-brand
Body: { "brand": "GANNI" }
```
Returns brand information and review count.

#### Get Reviews
```
POST /api/extension/get-reviews
Body: { "brand": "GANNI", "itemName": "dress" }
```
Returns filtered reviews for the specified brand and optional item name.

## Implementation Details

### Frontend (popup.js)
- `fetchAndDisplayReviews(brand, itemName)`: Fetches reviews from the API
- `displayReviews(reviews, totalReviews)`: Renders reviews in the popup
- `displayNoReviews()`: Shows message when no reviews are found
- `displayReviewsError(errorMessage)`: Handles error states

### Backend (API)
- New route: `/api/extension/get-reviews`
- Integrates with existing Airtable service
- Implements smart filtering and sorting
- Limits results to prevent popup overflow

### Styling
- Responsive design that fits the popup dimensions
- Color-coded recommendations (green for positive, red for negative)
- Star ratings with visual feedback
- Clean separation between review items

## Usage

1. **Automatic Detection**: When a user visits a fashion website, the extension automatically detects the brand and item
2. **Review Display**: If reviews exist, they are automatically fetched and displayed
3. **Item-Specific Reviews**: Reviews are filtered by both brand and detected item name when possible
4. **Fallback**: If no item-specific reviews exist, all brand reviews are shown

## Data Structure

### Review Object
```typescript
interface Review {
  id: string;
  itemName: string;
  garmentType: string;
  userBodyType?: string;
  sizeBought?: string;
  usualSize?: string;
  fitRating?: number;
  fitComments?: string;
  wouldRecommend?: boolean;
  height?: string;
  submissionDate: string;
}
```

## Future Enhancements

1. **Pagination**: Load more reviews beyond the initial 10
2. **Review Filtering**: Filter by rating, body type, or garment type
3. **Review Submission**: Allow users to submit their own reviews
4. **Review Analytics**: Show rating distributions and trends
5. **Image Support**: Display product images alongside reviews

## Testing

Use the `test-popup.html` file to test the review functionality locally:
1. Ensure the development server is running (`npm run dev`)
2. Open `test-popup.html` in a browser
3. Click "Test Brand Check" and "Test Reviews Fetch" buttons
4. Verify API responses and review display

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure the development server is running and CORS headers are set
2. **No Reviews Displayed**: Check if the brand exists in the database and has reviews
3. **API Errors**: Verify the Airtable connection and environment variables

### Debug Information
The extension logs detailed information to the browser console:
- Brand detection process
- API request/response details
- Review filtering and display logic
