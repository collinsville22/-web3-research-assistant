# 🚀 Deployment Guide

This guide covers multiple deployment options for the Web3 Research Assistant.

## 🌐 Quick Deploy (Recommended)

### 1. Vercel (Frontend + API)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/web3-research-assistant)

```bash
# Manual deployment
npm install -g vercel
vercel --prod
```

**Environment Variables to set in Vercel:**
- `JULIAOS_API_URL`
- `JULIAOS_API_KEY` 
- `OPENAI_API_KEY`
- `SOLANA_RPC_URL`

### 2. Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/web3-research-assistant)

```bash
# Manual deployment
npm install -g netlify-cli
netlify deploy --prod
```

### 3. Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/your-template)

```bash
# Manual deployment
npm install -g @railway/cli
railway deploy
```

## 🐳 Docker Deployment

### Local Docker

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Docker Hub

```bash
# Pull and run
docker pull your-username/web3-research-assistant:latest
docker run -p 3000:3000 --env-file .env your-username/web3-research-assistant:latest
```

## ☁️ Cloud Platform Deployment

### AWS ECS

1. Create ECS cluster
2. Create task definition using provided Dockerfile
3. Deploy service with environment variables

### Google Cloud Run

```bash
# Deploy to Cloud Run
gcloud run deploy web3-research-assistant \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Azure Container Instances

```bash
# Deploy to ACI
az container create \
  --resource-group myResourceGroup \
  --name web3-research-assistant \
  --image your-username/web3-research-assistant:latest \
  --dns-name-label web3-research \
  --ports 3000
```

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# JuliaOS Configuration
JULIAOS_API_URL=http://localhost:8000
JULIAOS_API_KEY=your_api_key_here

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Blockchain RPC URLs
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Optional APIs
COINGECKO_API_KEY=your_coingecko_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# Server Configuration
PORT=3000
NODE_ENV=production
```

### Setting Up JuliaOS Backend

1. **Self-hosted JuliaOS:**
   ```bash
   git clone https://github.com/Juliaoscode/JuliaOS.git
   cd JuliaOS/backend
   cp .env.example .env
   docker compose up
   ```

2. **Managed JuliaOS (if available):**
   - Sign up for JuliaOS cloud service
   - Get API key from dashboard
   - Set `JULIAOS_API_URL` and `JULIAOS_API_KEY`

## 📊 Monitoring & Health Checks

### Health Check Endpoint

```bash
curl https://your-deployment.com/health
```

Response:
```json
{
  "status": "healthy",
  "service": "Web3 Research Assistant", 
  "timestamp": "2025-08-06T17:30:00.000Z"
}
```

### Example API Test

```bash
curl -X POST https://your-deployment.com/api/research \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "category": "DeFi",
    "website": "https://example.com"
  }'
```

## 🔒 Security Considerations

### Production Checklist

- [ ] Set strong API keys in environment variables
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS for your domain
- [ ] Set up rate limiting
- [ ] Enable monitoring and logging
- [ ] Regular security updates

### Rate Limiting

```javascript
// Add to server.js for production
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

app.use('/api/', limiter);
```

## 📈 Scaling Options

### Horizontal Scaling

- Use load balancer (nginx, AWS ALB, etc.)
- Deploy multiple instances
- Implement session persistence if needed

### Database Integration (Optional)

```javascript
// Add Redis for caching analysis results
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Cache analysis results for 1 hour
await client.setex(`analysis:${projectHash}`, 3600, JSON.stringify(result));
```

## 🚨 Troubleshooting

### Common Issues

1. **JuliaOS Connection Failed**
   - Check `JULIAOS_API_URL` and `JULIAOS_API_KEY`
   - Verify JuliaOS backend is running
   - App will fallback to local processing

2. **OpenAI API Errors**
   - Verify `OPENAI_API_KEY` is set correctly
   - Check API rate limits and usage

3. **Memory Issues**
   - Increase Docker memory limit
   - Implement request timeout limits
   - Add response caching

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run server

# Check application logs
docker-compose logs -f web3-research-assistant
```

## 📱 Mobile Optimization

The web interface is mobile-responsive and works on:
- iOS Safari
- Android Chrome
- Mobile browsers with JavaScript enabled

## 🔄 Continuous Deployment

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm test
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/web3-research-assistant/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/web3-research-assistant/discussions)
- **Documentation**: [Project Wiki](https://github.com/your-username/web3-research-assistant/wiki)

---

**Need help with deployment? Open an issue or discussion on GitHub!**