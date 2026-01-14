# Widget Integration

The Agent Chat widget is a lightweight, embeddable chat interface that you can add to any website with a single script tag.

## How it Works

The widget is delivered as a standalone JavaScript file and a CSS stylesheet. When embedded on a page, it:
1. Loads the necessary styles and icons.
2. Creates a chat button and a hidden chat panel.
3. Initializes a session with the agent server when opened.
4. Manages the conversation state and UI updates.

## Integration Steps

To embed the chat widget on your website, add the following script tag before the closing `</body>` tag:

```html
<script 
  src="http://localhost:3001/widget/chat-widget.js" 
  data-chatbot-id="YOUR_CHATBOT_ID"
  data-server="http://localhost:3001"
></script>
```

### Script Attributes

| Attribute | Description | Default |
|-----------|-------------|---------|
| `data-chatbot-id` | **Required**. The unique UUID of your chatbot. | None |
| `data-server` | The URL of the agent server. | `http://localhost:3001` |
| `data-title` | The title displayed in the widget header. | `AI Assistant` |
| `data-welcome` | The initial message shown to users. | `Hi there! How can I help you today?` |

## Configuration from API

The widget can also load its configuration dynamically from the agent server. This allows you to update the widget's appearance (colors, title, etc.) from the dashboard without changing the code on your website.

The agent server provides a configuration endpoint:
`GET /api/widget/:chatbotId/config`

This endpoint returns settings such as:
- Primary and background colors
- Title and subtitle
- Welcome message and placeholder text
- Border radius and position
- Auto-open settings

## Allowed Domains

For security, you can configure a list of allowed domains in the dashboard for each chatbot. The agent server will verify the `Origin` or `Referer` header of incoming requests against this list to prevent unauthorized use of your chatbot on other websites.

## Complete Integration Example

Here is a complete HTML example showing how to integrate the widget:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
</head>
<body>
    <h1>Welcome to My Website</h1>
    <p>The chat widget should appear in the bottom right corner.</p>

    <!-- Agent Chat Widget -->
    <script 
      src="http://localhost:3001/widget/chat-widget.js" 
      data-chatbot-id="8db66891-9e79-467b-9993-87588b394d6e"
      data-server="http://localhost:3001"
      data-title="Customer Support"
      data-welcome="How can we help you today?"
    ></script>
</body>
</html>
```

## Widget Files

The widget consists of two main files served by the agent server:
- **JavaScript**: `http://localhost:3001/widget/chat-widget.js`
- **CSS**: `http://localhost:3001/widget/chat-widget.css`
