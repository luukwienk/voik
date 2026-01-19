# MCP Integration - TaskBuddy

## Overview

TaskBuddy (Voik) has an **MCP (Model Context Protocol) server** that gives Claude Desktop access to your tasks.

## MCP Server Location

**Repository:** `C:\Projects\taskbuddy-mcp\`

## What Can the MCP Server Do?

- Retrieve tasks from all lists
- Add tasks to specific lists
- Mark tasks as completed
- Get list of task lists
- Search and filter tasks

## Related: RAG MCP Server

There is also a **RAG MCP server** (`C:\Projects\rag-mcp\`) that provides semantic search in the knowledge base (Pinecone):
- Confluence documentation
- Jira tickets
- Slack conversations
- Email threads

## Claude Desktop Setup

Both servers can be used **together** in Claude Desktop:

```json
{
  "mcpServers": {
    "taskbuddy": {
      "command": "node",
      "args": ["C:\\Projects\\taskbuddy-mcp\\src\\index.js"]
    },
    "rag": {
      "command": "node",
      "args": ["C:\\Projects\\rag-mcp\\src\\index.js"]
    }
  }
}
```

## Architecture: Option A (MCP Bridge)

```
Claude Desktop
     |
 +---+----+
 |        |
 v        v
TaskBuddy  RAG MCP
  MCP        |
  |       Pinecone + PostgreSQL
Firebase    (knowledge base)
```

**Advantages:**
- Voik remains independent (no code changes needed)
- RAG system remains independent
- Claude Desktop orchestrates both
- Modular and flexible

## Example Workflows

**Research → Task Creation:**
```
User: "Search for deployment documentation"
Claude: [Uses RAG MCP] "Found 3 guides..."
User: "Create a task to review those guides"
Claude: [Uses TaskBuddy MCP] "Added to Today list"
```

**Bug Analysis:**
```
User: "What bugs were reported in Jira this week?"
Claude: [Uses RAG MCP] "Found 5 bug reports..."
User: "Add the critical ones to my task list"
Claude: [Uses TaskBuddy MCP] "Added 2 tasks"
```

## Documentation

- **TaskBuddy MCP:** `C:\Projects\taskbuddy-mcp\README.md`
- **RAG MCP:** `C:\Projects\rag-mcp\README.md`
- **Claude Setup:** `C:\Projects\rag-mcp\CLAUDE_SETUP.md`

## Date Implemented

**December 2024** - MCP Bridge architecture implemented with both TaskBuddy and RAG MCP servers.

## Future Possibilities

If this works well, we could consider:
- **Option B:** Direct Pinecone integration in Voik UI
- **Option C:** Hybrid database (Firebase + PostgreSQL)
- **Option D:** Full migration to PostgreSQL

But for now, MCP Bridge gives us the benefits without the complexity!
