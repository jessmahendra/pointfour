# GPT-5 Testing Setup Guide

## 🚀 What We Just Implemented

We've added a **safe GPT-5 testing system** that allows you to test GPT-5 without affecting your production app.

## 🔧 Configuration

Add these environment variables to your `.env.local` file:

```bash
# Enable GPT-5 testing (set to 'true' to enable)
ENABLE_GPT5_TESTING=false

# Percentage of requests to test with GPT-5 (1-100)
# Start with 10% for safe testing
GPT5_TEST_PERCENTAGE=10
```

## 🧪 How It Works

### **Safe Testing Approach:**
1. **Limited Data**: Only uses 3 reviews instead of 30 (reduces rate limit risk)
2. **Retry Logic**: Tries GPT-5 up to 3 times with exponential backoff
3. **Smart Fallback**: GPT-5 → GPT-4o → Rule-based analysis
4. **Percentage Control**: Only tests a small percentage of requests

### **Fallback Chain:**
```
GPT-5 Test (3 reviews) → GPT-4o (full data) → Rule-based Analysis
```

## 📊 Testing Phases

### **Phase 1: Manual Testing (0%)**
- Set `ENABLE_GPT5_TESTING=false`
- Test manually by temporarily enabling in code
- Verify fallback works correctly

### **Phase 2: Small Batch (5-10%)**
- Set `ENABLE_GPT5_TESTING=true`
- Set `GPT5_TEST_PERCENTAGE=10`
- Monitor logs and success rates

### **Phase 3: Medium Batch (20-30%)**
- Increase to 20-30% based on success
- Monitor rate limiting and costs

### **Phase 4: Full Rollout (100%)**
- Only after 95%+ success rate
- Monitor quality and performance

## 🔍 Monitoring

### **Success Metrics:**
- GPT-5 success rate vs fallback usage
- Response quality comparison
- Rate limiting frequency
- Cost analysis

### **Console Logs to Watch:**
```
🧪 GPT-5 TESTING CONFIG: { enabled: true, testPercentage: 10, model: 'gpt-5o' }
🧪 GPT-5 TESTING: Using GPT-5 test function for [Brand] (10% chance)
🧪 GPT-5 TEST: Starting test analysis for [Brand] with X results
🧪 GPT-5 TEST: Using 3 reviews for testing (reduced from X)
🧪 GPT-5 TEST: Attempt 1/3 with 3 reviews
🚀 GPT-5: Making actual GPT-5 API call for [Brand]
✅ GPT-5 TEST: Success on attempt 1
```

## 🚨 Safety Features

### **Rate Limit Protection:**
- Maximum 3 attempts per request
- Exponential backoff (2s, 4s, 8s)
- Automatic fallback on rate limits

### **Data Limiting:**
- Only 3 reviews sent to GPT-5 (vs 30)
- Reduced token usage
- Lower risk of hitting limits

### **Instant Rollback:**
- Set `ENABLE_GPT5_TESTING=false`
- No code changes needed
- Immediate fallback to GPT-4o

## 🧪 Testing Commands

### **Enable Testing:**
```bash
# In your .env.local file
ENABLE_GPT5_TESTING=true
GPT5_TEST_PERCENTAGE=10
```

### **Disable Testing:**
```bash
# In your .env.local file
ENABLE_GPT5_TESTING=false
```

### **Adjust Test Percentage:**
```bash
# Test with 5% of requests
GPT5_TEST_PERCENTAGE=5

# Test with 20% of requests
GPT5_TEST_PERCENTAGE=20
```

## 📝 Next Steps

1. **Test the implementation** with a few brands manually
2. **Enable 10% testing** and monitor for 24-48 hours
3. **Analyze results** and adjust percentage accordingly
4. **Monitor costs** and quality improvements

## 🔍 Troubleshooting

### **If GPT-5 Fails:**
- Check console logs for error messages
- Verify OpenAI API key has GPT-5 access
- Monitor rate limiting patterns
- Fallback system should handle failures gracefully

### **If Quality Degrades:**
- Reduce test percentage
- Check fallback logic
- Compare GPT-5 vs GPT-4o outputs
- Adjust prompt if needed

## 💡 Expected Outcomes

**Best Case:**
- GPT-5 works reliably with small batches
- Better quality than GPT-4o
- Reasonable cost increase
- Gradual rollout to 100%

**Realistic Case:**
- GPT-5 works 70-80% of the time
- Fallback handles failures gracefully
- Quality improvement when it works
- Controlled rollout at 20-30%

**Worst Case:**
- GPT-5 fails consistently
- Fallback maintains current quality
- No service disruption
- Easy rollback to GPT-4o

---

**Ready to test?** Start with manual testing, then enable 10% and monitor the results!
