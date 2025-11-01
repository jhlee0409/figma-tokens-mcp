# Smithery Deployment Guide

This document explains how to deploy the Figma Tokens MCP server to Smithery for easy distribution and usage.

## What is Smithery?

[Smithery](https://smithery.ai) is a registry and deployment platform for Model Context Protocol (MCP) servers. It simplifies the process of deploying, discovering, and using MCP servers.

## Prerequisites

- A GitHub repository with your MCP server code
- A [Smithery account](https://smithery.ai)
- Node.js 18+ installed locally (for development and testing)

## Configuration Files

This project is configured for Smithery deployment with the following files:

### `smithery.yaml`

```yaml
runtime: "typescript"
```

This minimal configuration tells Smithery to use the TypeScript runtime. The Smithery CLI handles all containerization automatically.

### `package.json` Updates

The following fields in `package.json` are required for Smithery:

```json
{
  "type": "module",
  "module": "src/index.ts",
  "devDependencies": {
    "@smithery/cli": "^0.6.0"
  },
  "scripts": {
    "smithery:dev": "npx @smithery/cli dev",
    "smithery:build": "npx @smithery/cli build"
  }
}
```

- `module`: Points to the main entry file that exports `createServer`
- `@smithery/cli`: Development dependency for local testing
- Scripts for development and build processes

## Local Development with Smithery

### Install Dependencies

```bash
pnpm install
```

### Run Development Server

Start a local Smithery development server with hot-reload:

```bash
pnpm smithery:dev
```

This will start the MCP server using Smithery's development environment, allowing you to test the server locally before deployment.

### Build for Production

Build the server for production deployment:

```bash
pnpm smithery:build
```

This creates an optimized build that Smithery will use for deployment.

## Deploying to Smithery

### 1. Push Changes to GitHub

Ensure all changes are committed and pushed to your GitHub repository:

```bash
git add .
git commit -m "Add Smithery deployment configuration"
git push origin main
```

### 2. Connect Repository to Smithery

1. Go to [smithery.ai/new](https://smithery.ai/new)
2. Click "Connect GitHub Repository"
3. Select your `figma-tokens-mcp` repository
4. Smithery will automatically detect the `smithery.yaml` configuration

### 3. Configure Environment Variables

In the Smithery dashboard, configure the required environment variables:

- `FIGMA_ACCESS_TOKEN`: Your Figma personal access token (optional, can be provided by users)

### 4. Deploy

Click "Deploy" in the Smithery dashboard. Smithery will:

1. Clone your repository
2. Build the TypeScript server using the Smithery CLI
3. Create a container with all dependencies
4. Deploy to Smithery's infrastructure

### 5. Test Your Deployment

Once deployed, you can test your server using Smithery's playground or install it in Claude Desktop using the Smithery installer.

## Using the Deployed Server

### Install via Smithery

Users can install your MCP server from Smithery:

```bash
npx @smithery/cli install figma-tokens-mcp
```

### Configure in Claude Desktop

After installation, the server will be automatically configured in Claude Desktop's `claude_desktop_config.json`.

## Updating Your Deployment

To update your deployment:

1. Make changes to your code
2. Commit and push to GitHub
3. Smithery will automatically rebuild and redeploy (if auto-deploy is enabled)
4. Or manually trigger a deployment from the Smithery dashboard

## Troubleshooting

### Build Failures

If your build fails on Smithery:

1. Test locally first: `pnpm smithery:build`
2. Check the Smithery build logs for specific errors
3. Ensure all dependencies are listed in `package.json`
4. Verify that `src/index.ts` exports the `createServer` function

### Runtime Errors

If the server fails at runtime:

1. Check environment variable configuration
2. Test locally with: `pnpm smithery:dev`
3. Review the Smithery runtime logs
4. Ensure the server handles errors gracefully

### Server Export Issues

The server must export a `createServer` function from the main entry point:

```typescript
// src/index.ts
export { createServer, startServer } from './mcp/server.js';
```

The `createServer` function should return a configured MCP server instance.

## Resources

- [Smithery Documentation](https://smithery.ai/docs)
- [Smithery CLI GitHub](https://github.com/smithery-ai/cli)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

## Support

For issues with:
- **Figma Tokens MCP**: [GitHub Issues](https://github.com/jhlee0409/figma-tokens-mcp/issues)
- **Smithery Platform**: [Smithery Support](https://smithery.ai/support)
- **MCP Protocol**: [MCP Discord](https://discord.gg/modelcontextprotocol)
