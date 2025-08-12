# Serper API Setup Guide

## Getting Your API Key

1. Visit [https://serper.dev/](https://serper.dev/)
2. Sign up for an account
3. Get your API key from the dashboard

## Environment Configuration

Create a `.env.local` file in the root directory with:

```bash
SERPER_API_KEY=your_actual_api_key_here
```

## API Usage

The Serper API provides:
- Google search results
- Reddit, Styleforum, and other community content
- Blog and video reviews
- Real-time fashion brand insights

## Rate Limits

- Free tier: 100 searches/month
- Paid plans available for higher usage

## Testing

Test the API with:
```bash
curl -X POST http://localhost:3000/api/extension/search-reviews \
  -H "Content-Type: application/json" \
  -d '{"brand":"Wax London","itemName":"Fintry Blazer"}'
```

## Troubleshooting

- Ensure `.env.local` exists and contains the API key
- Check server logs for API errors
- Verify CORS settings for browser extension
