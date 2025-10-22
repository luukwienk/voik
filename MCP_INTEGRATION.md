# MCP Integration - TaskBuddy

## Overview

TaskBuddy (Voik) heeft een **MCP (Model Context Protocol) server** die Claude Desktop toegang geeft tot je taken.

## MCP Server Locatie

**Repository:** `C:\Projects\taskbuddy-mcp\`

## Wat kan de MCP server?

- ✅ Taken ophalen van alle lijsten
- ✅ Taken toevoegen aan specifieke lijsten
- ✅ Taken markeren als voltooid
- ✅ Lijsten van takenlijsten ophalen
- ✅ Taken zoeken en filteren

## Related: RAG MCP Server

Er is ook een **RAG MCP server** (`C:\Projects\rag-mcp\`) die semantic search biedt in de kennisbank (Pinecone):
- Confluence documentatie
- Jira tickets
- Slack conversations
- Email threads

## Claude Desktop Setup

Beide servers kunnen **samen** gebruikt worden in Claude Desktop:

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
     ↓
 ┌───┴────┐
 ↓        ↓
TaskBuddy  RAG MCP
  MCP        ↓
  ↓       Pinecone + PostgreSQL
Firebase    (kennisbank)
```

**Voordelen:**
- Voik blijft onafhankelijk (geen code changes)
- RAG systeem blijft onafhankelijk
- Claude Desktop orkestreert beide
- Modulair en flexibel

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
