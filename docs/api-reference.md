# API Reference

This document provides a comprehensive reference for the APIs available in the Agent Chat platform.

## Agent Server API

The Agent Server handles the live chat conversations and widget configurations. By default, it runs on port `3001`.

### Health Check

Check the status of the agent server.

- **URL**: `/api/health`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-01-11T12:00:00.000Z"
  }
  ```

### Create Chat Session

Initialize a new conversation session for a specific chatbot.

- **URL**: `/api/session`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "chatbotId": "uuid",
    "visitorId": "string (optional)",
    "visitorName": "string (optional)",
    "visitorEmail": "string (optional)",
    "pageUrl": "string (optional)",
    "userAgent": "string (optional)"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "sessionId": "session_uuid",
    "userId": "visitor_uuid",
    "appName": "chatbot_uuid",
    "message": "Session created successfully"
  }
  ```

### Send Chat Message

Send a message to the agent and receive an AI-generated response.

- **URL**: `/api/chat`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "sessionId": "session_uuid",
    "userId": "visitor_uuid",
    "appName": "chatbot_uuid",
    "message": "Hello, how are you?"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "response": "Hello! I'm doing well, thank you for asking. How can I assist you today?"
  }
  ```

### End Chat Session

Terminate an active chat session and clean up resources.

- **URL**: `/api/session/end`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "sessionId": "session_uuid",
    "userId": "visitor_uuid",
    "appName": "chatbot_uuid"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Session ended successfully"
  }
  ```

### Get Widget Configuration

Retrieve the visual and functional configuration for the chat widget.

- **URL**: `/api/widget/:chatbotId/config`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "success": true,
    "config": {
      "title": "Customer Support",
      "subtitle": "We're here to help",
      "welcomeMessage": "Hi! How can I help you today?",
      "placeholder": "Type your message...",
      "primaryColor": "#6366f1",
      "backgroundColor": "#ffffff",
      "textColor": "#1f2937",
      "borderRadius": 12,
      "position": "bottom-right",
      "autoOpen": false,
      "autoOpenDelay": 3,
      "showBranding": true
    }
  }
  ```

### Reload Configuration (Internal)

Force the server to reload a chatbot's configuration and clear caches.

- **URL**: `/api/internal/reload/:chatbotId`
- **Method**: `POST`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Configuration reloaded for chatbot uuid"
  }
  ```

---

## Dashboard API

The Dashboard API is used by the admin interface to manage chatbots and settings.

### List Chatbots

Get all chatbots belonging to the current user's tenant.

- **URL**: `/api/chatbots`
- **Method**: `GET`
- **Response**:
  ```json
  [
    {
      "id": "uuid",
      "name": "Sales Bot",
      "description": "Handles sales inquiries",
      "is_active": true,
      "created_at": "..."
    }
  ]
  ```

### Create Chatbot

Create a new chatbot with specified settings.

- **URL**: `/api/chatbots`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "Technical Support",
    "description": "Assists with technical issues",
    "system_prompt": "You are a technical support agent...",
    "model": "gemini-2.0-flash",
    "temperature": 0.5
  }
  ```
- **Response**:
  ```json
  {
    "id": "new_uuid",
    "name": "Technical Support",
    "..."
  }
  ```

### Get Chatbot Details

Retrieve detailed configuration for a specific chatbot.

- **URL**: `/api/chatbots/[id]`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "id": "uuid",
    "name": "Technical Support",
    "system_prompt": "...",
    "model": "...",
    "..."
  }
  ```

### Get Widget Settings

Retrieve the widget-specific configuration for a chatbot.

- **URL**: `/api/chatbots/[id]/widget`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "chatbot_id": "uuid",
    "primary_color": "#6366f1",
    "title": "Support Chat",
    "..."
  }
  ```
