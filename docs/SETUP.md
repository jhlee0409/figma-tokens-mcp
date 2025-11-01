# Setup Guide

Complete installation and configuration guide for Figma Tokens MCP.

## Table of Contents

- [System Requirements](#system-requirements)
- [Figma Access Token Setup](#figma-access-token-setup)
- [Installation Methods](#installation-methods)
- [MCP Server Configuration](#mcp-server-configuration)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Alternative MCP Clients](#alternative-mcp-clients)

## System Requirements

### Required

- **Node.js**: Version 18.0.0 or higher
  - Check your version: `node --version`
  - Download: [nodejs.org](https://nodejs.org/)

- **Package Manager**: One of the following:
  - npm (comes with Node.js)
  - pnpm (recommended): `npm install -g pnpm`
  - yarn: `npm install -g yarn`

- **Figma Account**: With access to files you want to extract tokens from

### Recommended

- **Claude Desktop**: For easiest MCP integration ([download](https://claude.ai/download))
- **Git**: For development installation
- **VS Code**: For development

### Platform Support

- **macOS**: 10.15 (Catalina) or later
- **Windows**: 10 or later
- **Linux**: Ubuntu 20.04+, or equivalent

## Figma Access Token Setup

### Step 1: Generate Access Token

1. **Log in to Figma**
   - Go to [figma.com](https://www.figma.com/)
   - Sign in to your account

2. **Navigate to Settings**
   - Click your profile picture (top right)
   - Select **Settings** from the dropdown

3. **Access Personal Access Tokens**
   - In the left sidebar, click **Account**
   - Scroll down to **Personal access tokens** section

4. **Generate New Token**
   - Click **Generate new token**
   - Enter a description (e.g., "figma-tokens-mcp")
   - Click **Generate token**

5. **Copy Your Token**
   - **IMPORTANT**: Copy the token immediately
   - You won't be able to see it again!
   - Store it securely (see security best practices below)

### Step 2: Token Permissions

The generated token will have access to:
- All files you can view in your Figma account
- All teams you're a member of
- Read-only access to file data (Variables, Styles, Nodes)

**Required Permissions:**
- ✅ Read file data
- ✅ Read variables
- ✅ Read styles

**NOT Required:**
- ❌ Write access
- ❌ Delete access
- ❌ Webhook access

### Security Best Practices

**DO:**
- ✅ Store tokens in environment variables
- ✅ Add `.env` files to `.gitignore`
- ✅ Use different tokens for different environments
- ✅ Rotate tokens periodically
- ✅ Revoke unused tokens immediately

**DON'T:**
- ❌ Commit tokens to version control
- ❌ Share tokens in chat or email
- ❌ Use the same token across multiple projects
- ❌ Store tokens in plain text files
- ❌ Log tokens in application logs

### Revoking Tokens

To revoke a token:
1. Go to Figma Settings → Account → Personal Access Tokens
2. Find the token you want to revoke
3. Click the **Delete** icon
4. Confirm deletion

## Installation Methods

### Method 1: npx (Recommended for Users)

**Best for**: Quick setup, trying it out, or production use

```bash
# No installation needed! Just run:
npx figma-tokens-mcp
```

**Pros:**
- No global installation required
- Always uses the latest version
- Clean system

**Cons:**
- Slightly slower first run (downloads package)
- Requires internet connection for first use

### Method 2: Global Installation

**Best for**: Frequent CLI usage

```bash
# Using npm
npm install -g figma-tokens-mcp

# Using pnpm (recommended)
pnpm add -g figma-tokens-mcp

# Using yarn
yarn global add figma-tokens-mcp
```

**Verify installation:**
```bash
figma-tokens-mcp --version
```

**Pros:**
- Faster startup
- Works offline (after installation)
- Convenient for CLI usage

**Cons:**
- Requires manual updates
- Takes up disk space

### Method 3: Local Project Installation

**Best for**: Integrating into existing projects

```bash
# Navigate to your project
cd my-project

# Install as dependency
npm install figma-tokens-mcp
# or
pnpm add figma-tokens-mcp
```

**Use in package.json:**
```json
{
  "scripts": {
    "extract-tokens": "figma-tokens-mcp"
  }
}
```

### Method 4: Development Installation

**Best for**: Contributing to the project

```bash
# Clone repository
git clone https://github.com/jhlee0409/figma-tokens-mcp.git
cd figma-tokens-mcp

# Install dependencies
pnpm install

# Build project
pnpm build

# Run tests
pnpm test

# Run in development mode
pnpm dev
```

**Link for local development:**
```bash
# In project directory
pnpm link --global

# Now you can use it globally
figma-tokens-mcp --version
```

## MCP Server Configuration

### Claude Desktop Configuration

Claude Desktop is the easiest way to use Figma Tokens MCP.

#### Step 1: Locate Config File

**macOS:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```bash
~/.config/Claude/claude_desktop_config.json
```

#### Step 2: Edit Configuration

Open the config file and add the Figma Tokens MCP server:

**Using npx (recommended):**
```json
{
  "mcpServers": {
    "figma-tokens": {
      "command": "npx",
      "args": ["-y", "figma-tokens-mcp"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "figd_your_token_here"
      }
    }
  }
}
```

**Using global installation:**
```json
{
  "mcpServers": {
    "figma-tokens": {
      "command": "figma-tokens-mcp",
      "env": {
        "FIGMA_ACCESS_TOKEN": "figd_your_token_here"
      }
    }
  }
}
```

**Using local installation (development):**
```json
{
  "mcpServers": {
    "figma-tokens": {
      "command": "node",
      "args": ["/absolute/path/to/figma-tokens-mcp/dist/mcp/server.js"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "figd_your_token_here",
        "LOG_LEVEL": "DEBUG"
      }
    }
  }
}
```

#### Step 3: Restart Claude Desktop

1. Quit Claude Desktop completely
2. Restart the application
3. The MCP server will connect automatically

#### Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `command` | Yes | Command to run the server (`npx`, `node`, or binary path) |
| `args` | No | Arguments to pass to the command |
| `env.FIGMA_ACCESS_TOKEN` | Yes | Your Figma personal access token |
| `env.LOG_LEVEL` | No | Logging level: `DEBUG`, `INFO`, `WARN`, `ERROR` (default: `INFO`) |

### Environment Variables

Instead of putting your token in the config file, you can use environment variables:

**macOS/Linux (.bashrc, .zshrc, etc.):**
```bash
export FIGMA_ACCESS_TOKEN="figd_your_token_here"
```

**Windows (PowerShell):**
```powershell
$env:FIGMA_ACCESS_TOKEN="figd_your_token_here"
```

**Claude Desktop config (using env vars):**
```json
{
  "mcpServers": {
    "figma-tokens": {
      "command": "npx",
      "args": ["-y", "figma-tokens-mcp"]
    }
  }
}
```

The server will automatically read `FIGMA_ACCESS_TOKEN` from the environment.

### Using .env Files (Development)

For local development, create a `.env` file:

```bash
# .env
FIGMA_ACCESS_TOKEN=figd_your_token_here
LOG_LEVEL=DEBUG
```

**IMPORTANT**: Add `.env` to `.gitignore`!

```bash
echo ".env" >> .gitignore
```

## Verification

### Step 1: Check Health

In Claude Desktop, ask:
```
Check the health of the Figma Tokens MCP server
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-01T12:00:00.000Z",
  "version": "0.1.0",
  "figmaTokenConfigured": true
}
```

### Step 2: Get Server Info

Ask Claude:
```
What are the capabilities of the Figma Tokens MCP server?
```

Expected response:
```json
{
  "name": "figma-tokens-mcp",
  "version": "0.1.0",
  "capabilities": [
    "extract_tokens",
    "convert_to_tailwind",
    "generate_component",
    "health_check",
    "get_server_info"
  ],
  "features": [
    "Figma Variables extraction",
    "Figma Styles extraction",
    "Conflict resolution",
    "Tailwind v3 & v4 support",
    "React component generation"
  ],
  "figmaTokenConfigured": true
}
```

### Step 3: Test Token Extraction

Try extracting from a public Figma file:
```
Extract design tokens from this Figma community file:
https://www.figma.com/community/file/1234567890/Design-System
```

If successful, you'll see extracted tokens!

## Troubleshooting

### Common Issues

#### 1. "FIGMA_ACCESS_TOKEN not configured"

**Symptom:**
```json
{
  "status": "unhealthy",
  "figmaTokenConfigured": false
}
```

**Solutions:**
- ✅ Check that `FIGMA_ACCESS_TOKEN` is set in config
- ✅ Verify token starts with `figd_`
- ✅ Ensure no trailing spaces or quotes in token
- ✅ Restart Claude Desktop after config changes

#### 2. "401 Authentication Failed"

**Symptom:**
```
Error: Figma API authentication failed
```

**Solutions:**
- ✅ Token is invalid or expired
- ✅ Generate a new token from Figma
- ✅ Update config with new token
- ✅ Restart Claude Desktop

#### 3. "403 Forbidden"

**Symptom:**
```
Error: Access denied to Figma file
```

**Solutions:**
- ✅ You don't have access to the file
- ✅ Request access from file owner
- ✅ Try with a file you own
- ✅ Check file URL is correct

#### 4. "404 File Not Found"

**Symptom:**
```
Error: Figma file not found
```

**Solutions:**
- ✅ File URL is incorrect
- ✅ File was deleted
- ✅ File is in a different team
- ✅ Copy URL directly from Figma

#### 5. "Command not found: figma-tokens-mcp"

**Symptom:**
```
zsh: command not found: figma-tokens-mcp
```

**Solutions:**
- ✅ Install globally: `npm install -g figma-tokens-mcp`
- ✅ Use npx: `npx figma-tokens-mcp`
- ✅ Check PATH includes npm global bin
- ✅ Restart terminal

#### 6. "Module not found" Errors

**Symptom:**
```
Error: Cannot find module '@modelcontextprotocol/sdk'
```

**Solutions:**
- ✅ Run `pnpm install` (development)
- ✅ Run `pnpm build` (development)
- ✅ Delete `node_modules` and reinstall
- ✅ Update to latest version

#### 7. Claude Desktop Not Connecting

**Symptom:**
- No MCP tools available
- Server not appearing in Claude

**Solutions:**
- ✅ Check config file syntax (valid JSON)
- ✅ Restart Claude Desktop completely
- ✅ Check server logs for errors
- ✅ Verify command path is correct
- ✅ Try running command manually in terminal

### Debugging

#### Enable Debug Logging

Add to config:
```json
{
  "mcpServers": {
    "figma-tokens": {
      "command": "npx",
      "args": ["-y", "figma-tokens-mcp"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "figd_your_token_here",
        "LOG_LEVEL": "DEBUG"
      }
    }
  }
}
```

#### View Logs

**macOS:**
```bash
tail -f ~/Library/Logs/Claude/mcp*.log
```

**Windows:**
```
%APPDATA%\Claude\Logs\mcp*.log
```

**Linux:**
```bash
tail -f ~/.config/Claude/logs/mcp*.log
```

#### Test Server Manually

```bash
# Set token
export FIGMA_ACCESS_TOKEN="figd_your_token_here"

# Run server
npx figma-tokens-mcp

# Or with debug logging
LOG_LEVEL=DEBUG npx figma-tokens-mcp
```

### Getting Help

If you're still stuck:

1. **Check GitHub Issues**: [github.com/jhlee0409/figma-tokens-mcp/issues](https://github.com/jhlee0409/figma-tokens-mcp/issues)
2. **Search Discussions**: [github.com/jhlee0409/figma-tokens-mcp/discussions](https://github.com/jhlee0409/figma-tokens-mcp/discussions)
3. **Create New Issue**: Include:
   - Operating system
   - Node.js version (`node --version`)
   - Installation method used
   - Full error message
   - Steps to reproduce

## Alternative MCP Clients

While Claude Desktop is recommended, Figma Tokens MCP works with any MCP-compatible client.

### Cline (VS Code Extension)

[Cline](https://github.com/cline/cline) is a VS Code extension that supports MCP.

**Installation:**
1. Install Cline from VS Code marketplace
2. Open VS Code settings
3. Search for "Cline MCP"
4. Add server configuration

**Config example:**
```json
{
  "cline.mcpServers": {
    "figma-tokens": {
      "command": "npx",
      "args": ["-y", "figma-tokens-mcp"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "figd_your_token_here"
      }
    }
  }
}
```

### Custom MCP Client

You can build your own MCP client using the [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk).

**Example:**
```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'npx',
  args: ['-y', 'figma-tokens-mcp'],
  env: {
    FIGMA_ACCESS_TOKEN: 'figd_your_token_here'
  }
});

const client = new Client({
  name: 'my-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

await client.connect(transport);

// Use MCP tools
const result = await client.callTool('extract_tokens', {
  figmaFileUrl: 'https://www.figma.com/file/...'
});
```

### MCP Inspector

Use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) to test and debug:

```bash
npx @modelcontextprotocol/inspector npx figma-tokens-mcp
```

This opens a web UI for testing MCP tools.

## Next Steps

Once setup is complete:

1. **Read [USAGE.md](USAGE.md)**: Learn how to use each tool
2. **Check [Examples](../examples/)**: See real-world usage scenarios
3. **Review [API.md](API.md)**: Understand the full API
4. **Explore [ARCHITECTURE.md](ARCHITECTURE.md)**: Learn how it works

---

**Need help?** [Open an issue](https://github.com/jhlee0409/figma-tokens-mcp/issues) or [start a discussion](https://github.com/jhlee0409/figma-tokens-mcp/discussions).
