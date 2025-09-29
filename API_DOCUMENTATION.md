# Twitter Bot Platform API Documentation

A comprehensive REST API for creating and managing automated Twitter bots with custom personalities and scheduling.

## Base URL
```
https://compaibackend-production.up.railway.app
```

## Interactive Documentation
- **Swagger UI**: https://compaibackend-production.up.railway.app/docs
- **ReDoc**: https://compaibackend-production.up.railway.app/redoc

---

## Endpoints

### 1. Health Check

#### `GET /`
Check if the API is running.

**Request:**
- Method: `GET`
- URL: `https://compaibackend-production.up.railway.app/`
- Headers: None
- Body: None

**Response:**
```json
{
  "message": "Twitter Bot Platform API",
  "status": "running"
}
```

---

### 2. User Management

#### `POST /users` - Create User
Create a new user account.

**Request:**
- Method: `POST`
- URL: `https://compaibackend-production.up.railway.app/users`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "username": "john_doe"
}
```

**Response (Success - 200):**
```json
{
  "username": "john_doe",
  "message": "User created"
}
```

**Response (Error - 400):**
```json
{
  "detail": "User 'john_doe' already exists"
}
```

#### `GET /users/{username}/exists` - Check User Exists
Check if a user already exists in the system.

**Request:**
- Method: `GET`
- URL: `https://compaibackend-production.up.railway.app/users/john_doe/exists`
- Headers: None
- Body: None

**Response:**
```json
{
  "username": "john_doe",
  "exists": true
}
```

---

### 3. Twitter OAuth

Use these helper endpoints to link a user's Twitter account without manually copying API keys.

#### `GET /auth/twitter/start` - Begin OAuth Flow
Return a Twitter authorization URL for an existing user/bot label. The frontend should open the URL in a new window and wait for the callback to complete.

**Request:**
- Method: `GET`
- URL: `https://compaibackend-production.up.railway.app/auth/twitter/start?username=john_doe&bot_name=my_marketing_bot`
- Optional query `redirect_url` lets you control where the callback redirects after success.

**Response:**
```json
{
  "authorization_url": "https://twitter.com/i/oauth?..."
}
```

#### `GET /auth/twitter/callback` - OAuth Callback
Twitter redirects here after the user authorizes the app. The backend exchanges tokens and stores them. By default, it returns a minimal HTML page that posts a success message (`source: "twitter-oauth"`) back to the opener window.

- Required query params: `oauth_token`, `oauth_verifier`
- Will respond with HTTP 302 if `redirect_url` was supplied to the start endpoint.

**Notes:**
- The callback creates/updates the bot's stored credentials with `access_token` and `access_token_secret`.
- You must create the platform user (`POST /users`) before starting OAuth.

---

### 4. Bot Management

#### `POST /bots` - Create Bot
Create or update a Twitter bot persona and scheduling settings. Twitter access tokens from the OAuth flow are required before this call will succeed.

**Request:**
- Method: `POST`
- URL: `https://compaibackend-production.up.railway.app/bots`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "username": "john_doe",
  "bot_name": "my_marketing_bot",
  "persona_settings": {
    "personality": {
      "name": "Marketing Pro",
      "role": "Digital Marketing Expert",
      "tone": "Professional yet friendly",
      "voice": "Authoritative but approachable"
    },
    "communication_style": {
      "writing_style": "Clear and concise",
      "humor_level": "Light",
      "emoji_usage": "Moderate",
      "hashtag_strategy": "2-3 relevant hashtags"
    },
    "interests_and_expertise": {
      "primary_focus": "Digital Marketing",
      "secondary_interests": "Tech trends, entrepreneurship",
      "buzzwords_to_use": "growth, optimize, scale",
      "buzzwords_to_avoid": "synergy, paradigm"
    },
    "content_approach": {
      "marketing_style": "Value-first",
      "call_to_action": "Subtle",
      "target_audience": "Business owners",
      "value_proposition": "Actionable insights"
    },
    "brand_voice_examples": {
      "excitement": "🚀 Ready to grow?",
      "curiosity": "What if there was a better way?",
      "authority": "Here's what works:",
      "encouragement": "You've got this!"
    },
    "posting_guidelines": {
      "tweet_length": "150-280 chars",
      "content_mix": "70% value, 30% engagement",
      "response_style": "Quick and helpful",
      "brand_consistency": "Always professional"
    },
    "custom_instructions": [
      "Always provide actionable advice",
      "Keep tone positive and motivating",
      "Include relevant hashtags"
    ]
  },
  "post_schedule": "hourly",
  "reply_schedule": "hourly"
}
```

> Optional: include `twitter_credentials` with specific overrides (e.g., a custom bearer token) if you need to augment the OAuth-generated tokens. Omit it for the standard flow.

**Response (Success - 200):**
```json
{
  "bot_name": "my_marketing_bot",
  "username": "john_doe",
  "post_schedule": "hourly",
  "reply_schedule": "hourly",
  "message": "Bot created"
}
```

**Response (Error - 404):**
```json
{
  "detail": "User 'john_doe' not found"
}
```

**Response (Error - 400 when OAuth incomplete):**
```json
{
  "detail": "Twitter account not connected. Complete the OAuth flow before creating the bot."
}
```

#### `GET /users/{username}/bots` - List User's Bots
Get all bots for a specific user.

**Request:**
- Method: `GET`
- URL: `https://compaibackend-production.up.railway.app/users/john_doe/bots`
- Headers: None
- Body: None

**Response:**
```json
{
  "username": "john_doe",
  "bots": ["my_marketing_bot", "another_bot"],
  "count": 2
}
```

#### `GET /users/{username}/bots/{bot_name}` - Get Bot Details
Get detailed information about a specific bot (credentials are masked).

**Request:**
- Method: `GET`
- URL: `https://compaibackend-production.up.railway.app/users/john_doe/bots/my_marketing_bot`
- Headers: None
- Body: None

**Response:**
```json
{
  "username": "john_doe",
  "bot_name": "my_marketing_bot",
  "bot_info": {
    "persona": {
      "personality": {
        "name": "Marketing Pro",
        "role": "Digital Marketing Expert"
      },
      "schedule": {
        "post_schedule": "hourly",
        "reply_schedule": "hourly"
      }
    },
    "twitter_credentials": {
      "status": "configured"
    }
  }
}
```

---

### 4. Bot Control

#### `POST /bots/start` - Start Bot
Activate a bot - posts immediately then follows schedule.

**Request:**
- Method: `POST`
- URL: `https://compaibackend-production.up.railway.app/bots/start`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "username": "john_doe",
  "bot_name": "my_marketing_bot"
}
```

**Response (Success - 200):**
```json
{
  "message": "Bot my_marketing_bot started",
  "immediate_post": "🚀 Ready to transform your digital marketing strategy? Here's what actually works...",
  "schedule": {
    "posts": "hourly",
    "replies": "hourly"
  }
}
```

**Response (Error - 404):**
```json
{
  "detail": "Bot 'my_marketing_bot' not found for user 'john_doe'"
}
```

#### `POST /bots/stop` - Stop Bot
Deactivate a bot and stop all scheduling.

**Request:**
- Method: `POST`
- URL: `https://compaibackend-production.up.railway.app/bots/stop`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "username": "john_doe",
  "bot_name": "my_marketing_bot"
}
```

**Response:**
```json
{
  "message": "Bot my_marketing_bot stopped"
}
```

---

### 5. Manual Bot Actions

#### `POST /bots/post` - Generate and Post Tweet
Generate and post a tweet based on the bot's personality.

**Request:**
- Method: `POST`
- URL: `https://compaibackend-production.up.railway.app/bots/post`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "username": "john_doe",
  "bot_name": "my_marketing_bot"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "generated_tweet": "🎯 Pro tip: Your conversion rate isn't just about traffic - it's about attracting the RIGHT traffic. Quality > quantity every time! #DigitalMarketing #Growth",
  "tweet_id": "1234567890123456789"
}
```

**Response (Error - 500):**
```json
{
  "detail": "Invalid Twitter credentials"
}
```

#### `POST /bots/reply-to-mentions` - Reply to Mentions
Automatically reply to recent mentions using the bot's personality.

**Request:**
- Method: `POST`
- URL: `https://compaibackend-production.up.railway.app/bots/reply-to-mentions`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "username": "john_doe",
  "bot_name": "my_marketing_bot"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Processed 3 mentions, sent 2 responses",
  "mentions_found": 3,
  "responses_sent": 2,
  "successful_responses": [
    {
      "mention_tweet_id": "1234567890123456789",
      "response": "Thanks for asking! Here's a quick tip to get you started...",
      "response_tweet_id": "1234567890123456790"
    }
  ],
  "failed_responses": [
    {
      "mention_tweet_id": "1234567890123456791",
      "error": "Rate limit exceeded"
    }
  ]
}
```

**Response (Rate Limited):**
```json
{
  "success": false,
  "message": "Failed to get mentions: 401 Unauthorized",
  "mentions_found": 0,
  "responses_sent": 0,
  "successful_responses": [],
  "failed_responses": []
}
```

---

### 6. Schedule Management

#### `PUT /users/{username}/bots/{bot_name}/schedule` - Update Schedule
Update bot's posting and reply schedule.

**Request:**
- Method: `PUT`
- URL: `https://compaibackend-production.up.railway.app/users/john_doe/bots/my_marketing_bot/schedule`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "username": "john_doe",
  "bot_name": "my_marketing_bot",
  "post_schedule": "daily",
  "reply_schedule": "hourly"
}
```

**Response:**
```json
{
  "username": "john_doe",
  "bot_name": "my_marketing_bot",
  "post_schedule": "daily",
  "reply_schedule": "hourly",
  "message": "Schedule updated"
}
```

---

## Data Models

### UserCreate
```json
{
  "username": "string (required)"
}
```

### TwitterCredentials
```json
{
  "api_key": "string (required)",
  "api_secret": "string (required)", 
  "access_token": "string (required)",
  "access_token_secret": "string (required)",
  "bearer_token": "string (optional - required for mentions)"
}
```

### PersonaSettings
```json
{
  "personality": {
    "name": "string",
    "role": "string",
    "tone": "string",
    "voice": "string"
  },
  "communication_style": {
    "writing_style": "string",
    "humor_level": "string",
    "emoji_usage": "string",
    "hashtag_strategy": "string"
  },
  "interests_and_expertise": {
    "primary_focus": "string",
    "secondary_interests": "string",
    "buzzwords_to_use": "string",
    "buzzwords_to_avoid": "string"
  },
  "content_approach": {
    "marketing_style": "string",
    "call_to_action": "string",
    "target_audience": "string",
    "value_proposition": "string"
  },
  "brand_voice_examples": {
    "excitement": "string",
    "curiosity": "string",
    "authority": "string",
    "encouragement": "string"
  },
  "posting_guidelines": {
    "tweet_length": "string",
    "content_mix": "string",
    "response_style": "string",
    "brand_consistency": "string"
  },
  "custom_instructions": ["array of strings"]
}
```

### BotCreate
```json
{
  "username": "string (required)",
  "bot_name": "string (required)",
  "twitter_credentials": "TwitterCredentials (required)",
  "persona_settings": "PersonaSettings (required)",
  "post_schedule": "string (default: 'hourly')",
  "reply_schedule": "string (default: 'hourly')"
}
```

### BotAction
```json
{
  "username": "string (required)",
  "bot_name": "string (required)"
}
```

---

## Schedule Options

### Post Schedule
- `"hourly"` - Posts every hour on the hour (1:00, 2:00, 3:00, etc.)
- `"daily"` - Posts once per day at 9:00 AM
- `"weekly"` - Posts once per week on Monday at 9:00 AM

### Reply Schedule  
- `"hourly"` - Checks mentions every hour at :30 (1:30, 2:30, 3:30, etc.)
- `"daily"` - Checks mentions once per day at 10:00 AM
- `"disabled"` - No automatic mention replies

---

## Error Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 400  | Bad Request - Invalid input data |
| 404  | Not Found - User or bot doesn't exist |
| 500  | Internal Server Error - Twitter API issues, invalid credentials |

---

## Rate Limiting

The API automatically handles Twitter rate limits:
- **Posts**: Standard Twitter posting limits apply
- **Mentions**: Limited to Twitter's mention API rates (may require waiting periods)
- The bot will automatically wait when rate limited

---

## Authentication Requirements

### Twitter API Setup
1. Create a Twitter Developer account
2. Create a new Twitter app
3. Generate API keys and tokens:
   - API Key (Consumer Key)
   - API Secret (Consumer Secret) 
   - Access Token
   - Access Token Secret
   - Bearer Token (required for reading mentions)
4. Ensure your app has "Read and Write" permissions
5. For mentions, ensure you have "Elevated" access level

### Firebase Setup
The system uses Firebase for data storage. Ensure your Firebase service account JSON is properly configured.

---

## Example Workflow

1. **Create User**: `POST /users` with username
2. **Check User Exists**: `GET /users/{username}/exists` 
3. **Create Bot**: `POST /bots` with full configuration
4. **Start Bot**: `POST /bots/start` (posts immediately + schedules)
5. **Manual Actions**: Use `POST /bots/post` or `POST /bots/reply-to-mentions`
6. **Stop Bot**: `POST /bots/stop` when needed

The bot will automatically post and reply according to its schedule until stopped.
