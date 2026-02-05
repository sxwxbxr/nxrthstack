# Discord Integration Guide

This guide explains how to integrate Discord OAuth account linking into external applications (like NxrthMon) that want to leverage NxrthStack's Discord connection.

## Overview

NxrthStack provides Discord OAuth2 integration that allows users to link their Discord accounts to their NxrthStack profile. This enables:

- Display Discord username and avatar across GameHub
- Unlock Discord-related achievements
- Easy friend verification in lobbies
- Session scheduler invites by Discord ID

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Your App       │────▶│   NxrthStack     │────▶│  Discord API    │
│  (NxrthMon)     │     │   API            │     │  OAuth2         │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Authentication Flow

1. User logs in to your app via NxrthStack API
2. User clicks "Connect Discord" in your app
3. App redirects to NxrthStack Discord OAuth endpoint
4. NxrthStack handles OAuth with Discord
5. Discord account is linked to user's NxrthStack profile
6. Your app can fetch the updated user profile with Discord info

## Implementation

### Option 1: Redirect to NxrthStack Settings (Recommended)

The simplest approach - redirect users to NxrthStack settings to manage their Discord connection.

```csharp
// C# Example (NxrthMon)
public void OpenDiscordSettings()
{
    // Open the NxrthStack settings page in user's browser
    Process.Start(new ProcessStartInfo
    {
        FileName = "https://nxrthstack.sweber.dev/dashboard/settings",
        UseShellExecute = true
    });
}
```

```typescript
// TypeScript/JavaScript Example
const openDiscordSettings = () => {
  window.open("https://nxrthstack.sweber.dev/dashboard/settings", "_blank");
};
```

### Option 2: Use NxrthStack API to Check Discord Status

Query the user's profile to check if Discord is connected:

```csharp
// C# Example
public class DiscordInfo
{
    public string? DiscordId { get; set; }
    public string? DiscordUsername { get; set; }
    public string? DiscordAvatar { get; set; }
    public DateTime? DiscordConnectedAt { get; set; }
}

public async Task<DiscordInfo?> GetDiscordInfo(string accessToken)
{
    using var client = new HttpClient();
    client.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", accessToken);

    var response = await client.GetAsync(
        "https://nxrthstack.sweber.dev/api/v1/user/profile"
    );

    if (response.IsSuccessStatusCode)
    {
        var profile = await response.Content.ReadFromJsonAsync<UserProfile>();
        return new DiscordInfo
        {
            DiscordId = profile?.DiscordId,
            DiscordUsername = profile?.DiscordUsername,
            DiscordAvatar = profile?.DiscordAvatar,
            DiscordConnectedAt = profile?.DiscordConnectedAt
        };
    }

    return null;
}
```

### Option 3: Direct OAuth Integration (Advanced)

If you want to handle Discord OAuth directly in your app and sync with NxrthStack:

#### Step 1: Register Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to "OAuth2" section
4. Add redirect URI: `your-app://discord/callback` (for desktop apps)
5. Note your Client ID and Client Secret

#### Step 2: Implement OAuth Flow

```csharp
// C# Desktop App Example
public class DiscordOAuth
{
    private const string ClientId = "YOUR_DISCORD_CLIENT_ID";
    private const string ClientSecret = "YOUR_DISCORD_CLIENT_SECRET";
    private const string RedirectUri = "http://localhost:5000/discord/callback";

    public string GetAuthorizationUrl()
    {
        var scope = "identify";
        return $"https://discord.com/api/oauth2/authorize" +
               $"?client_id={ClientId}" +
               $"&redirect_uri={Uri.EscapeDataString(RedirectUri)}" +
               $"&response_type=code" +
               $"&scope={scope}";
    }

    public async Task<DiscordTokenResponse?> ExchangeCode(string code)
    {
        using var client = new HttpClient();

        var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = ClientId,
            ["client_secret"] = ClientSecret,
            ["grant_type"] = "authorization_code",
            ["code"] = code,
            ["redirect_uri"] = RedirectUri
        });

        var response = await client.PostAsync(
            "https://discord.com/api/oauth2/token",
            content
        );

        if (response.IsSuccessStatusCode)
        {
            return await response.Content.ReadFromJsonAsync<DiscordTokenResponse>();
        }

        return null;
    }

    public async Task<DiscordUser?> GetUser(string accessToken)
    {
        using var client = new HttpClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("https://discord.com/api/users/@me");

        if (response.IsSuccessStatusCode)
        {
            return await response.Content.ReadFromJsonAsync<DiscordUser>();
        }

        return null;
    }
}

public class DiscordTokenResponse
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = "";

    [JsonPropertyName("token_type")]
    public string TokenType { get; set; } = "";

    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; set; }

    [JsonPropertyName("refresh_token")]
    public string RefreshToken { get; set; } = "";

    [JsonPropertyName("scope")]
    public string Scope { get; set; } = "";
}

public class DiscordUser
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("username")]
    public string Username { get; set; } = "";

    [JsonPropertyName("global_name")]
    public string? GlobalName { get; set; }

    [JsonPropertyName("avatar")]
    public string? Avatar { get; set; }

    public string GetAvatarUrl()
    {
        if (string.IsNullOrEmpty(Avatar))
            return "";
        return $"https://cdn.discordapp.com/avatars/{Id}/{Avatar}.png";
    }
}
```

#### Step 3: Sync with NxrthStack (Optional)

If you want to sync the Discord connection with NxrthStack:

```csharp
public async Task<bool> SyncDiscordWithNxrthStack(
    string nxrthstackAccessToken,
    string discordId,
    string discordUsername,
    string? discordAvatar)
{
    using var client = new HttpClient();
    client.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", nxrthstackAccessToken);

    var content = new StringContent(
        JsonSerializer.Serialize(new
        {
            discordId,
            discordUsername,
            discordAvatar
        }),
        Encoding.UTF8,
        "application/json"
    );

    var response = await client.PostAsync(
        "https://nxrthstack.sweber.dev/api/v1/user/discord/sync",
        content
    );

    return response.IsSuccessStatusCode;
}
```

## Environment Variables

For NxrthStack integration, set these environment variables:

```env
# Discord OAuth (for nxrthstack)
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

## API Reference

### GET /api/v1/user/profile

Returns the user's profile including Discord connection status.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "discordId": "123456789",
  "discordUsername": "username",
  "discordAvatar": "https://cdn.discordapp.com/avatars/...",
  "discordConnectedAt": "2024-01-15T10:30:00Z"
}
```

### GET /api/auth/discord

Initiates Discord OAuth flow. Redirect users here to connect Discord.

**Query Parameters:**
- `redirect`: (optional) URL to redirect to after OAuth completion

**Example:**
```
https://nxrthstack.sweber.dev/api/auth/discord?redirect=/dashboard
```

### POST /api/auth/discord/disconnect

Disconnects the user's Discord account.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true
}
```

## UI Components

### Discord Connection Button (React Example)

```tsx
import { useState, useEffect } from "react";

interface DiscordConnectionProps {
  accessToken: string;
}

export function DiscordConnection({ accessToken }: DiscordConnectionProps) {
  const [discordInfo, setDiscordInfo] = useState<{
    username: string | null;
    avatar: string | null;
    connectedAt: Date | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDiscordStatus();
  }, []);

  const fetchDiscordStatus = async () => {
    try {
      const response = await fetch(
        "https://nxrthstack.sweber.dev/api/v1/user/profile",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.ok) {
        const profile = await response.json();
        setDiscordInfo({
          username: profile.discordUsername,
          avatar: profile.discordAvatar,
          connectedAt: profile.discordConnectedAt
            ? new Date(profile.discordConnectedAt)
            : null,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    // Redirect to NxrthStack Discord OAuth
    window.location.href =
      "https://nxrthstack.sweber.dev/api/auth/discord";
  };

  const handleDisconnect = async () => {
    const response = await fetch(
      "https://nxrthstack.sweber.dev/api/auth/discord/disconnect",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (response.ok) {
      setDiscordInfo(null);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (discordInfo?.username) {
    return (
      <div className="discord-connected">
        <img src={discordInfo.avatar || ""} alt="Discord Avatar" />
        <span>{discordInfo.username}</span>
        <span>Connected {discordInfo.connectedAt?.toLocaleDateString()}</span>
        <button onClick={handleDisconnect}>Disconnect</button>
      </div>
    );
  }

  return (
    <button onClick={handleConnect} className="discord-connect-btn">
      Connect Discord
    </button>
  );
}
```

## Best Practices

1. **Always use HTTPS** for OAuth redirects
2. **Store tokens securely** - use encrypted storage for refresh tokens
3. **Handle token expiry** - implement token refresh logic
4. **Graceful degradation** - app should work without Discord connection
5. **Clear error messages** - inform users if OAuth fails

## Troubleshooting

### Common Issues

**"Invalid OAuth2 redirect URI"**
- Ensure the redirect URI in your Discord app settings matches exactly

**"Access Denied"**
- User cancelled the OAuth flow
- Handle this gracefully and return to previous screen

**"Token expired"**
- Implement token refresh using the refresh_token
- Discord access tokens expire after 7 days

### Debug Checklist

1. Verify Client ID and Secret are correct
2. Check redirect URI matches exactly (including trailing slashes)
3. Ensure scopes are correct (`identify` for basic user info)
4. Check if user has blocked/denied the OAuth request

## Security Considerations

1. **Never expose Client Secret** in client-side code
2. **Use state parameter** to prevent CSRF attacks
3. **Validate tokens** before trusting Discord data
4. **Limit scopes** - only request what you need
5. **Log OAuth events** for security auditing

## Related Documentation

- [Discord OAuth2 Documentation](https://discord.com/developers/docs/topics/oauth2)
- [NxrthStack API Documentation](./CUSTOM_LICENSE_API.md)
- [NxrthMon Technical Specification](./NxrthMon-TechSpec.md)
