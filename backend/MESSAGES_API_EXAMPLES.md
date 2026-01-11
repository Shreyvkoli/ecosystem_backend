# Messages API - Examples

## Overview

The Messages API handles timestamp-based comments on videos. Messages are tied to orders and optionally to specific files (videos).

### Features
- Comments tied to orders
- Timestamp support (in seconds)
- Creator & Editor can post
- Visual annotations (x, y coordinates)
- Automatic type detection (TIMESTAMP_COMMENT vs COMMENT)
- Auto-revision request when creator comments during REVIEW status

---

## Endpoints

### 1. Get Messages for Order

**GET** `/api/messages/order/:orderId`

Get all messages for an order. Optional query params to filter by file or type.

**Query Parameters:**
- `fileId` (optional) - Filter messages by file
- `type` (optional) - Filter by message type (COMMENT, TIMESTAMP_COMMENT, SYSTEM)

**Response:**
```json
[
  {
    "id": "msg-uuid-1",
    "orderId": "order-uuid",
    "fileId": "file-uuid",
    "userId": "user-uuid",
    "type": "TIMESTAMP_COMMENT",
    "content": "The color correction here looks off",
    "timestamp": 125.5,
    "x": null,
    "y": null,
    "resolved": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "user": {
      "id": "user-uuid",
      "name": "John Creator",
      "email": "john@example.com",
      "role": "CREATOR"
    },
    "file": {
      "id": "file-uuid",
      "type": "PREVIEW_VIDEO",
      "fileName": "preview-v1.mp4",
      "version": 1
    },
    "order": {
      "id": "order-uuid",
      "title": "Product Launch Video"
    }
  }
]
```

---

### 2. Get Messages for File

**GET** `/api/messages/file/:fileId`

Get all messages for a specific file.

**Response:**
```json
[
  {
    "id": "msg-uuid-1",
    "orderId": "order-uuid",
    "fileId": "file-uuid",
    "userId": "user-uuid",
    "type": "TIMESTAMP_COMMENT",
    "content": "Can we add a transition here?",
    "timestamp": 45.2,
    "resolved": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "user": {
      "id": "user-uuid",
      "name": "John Creator",
      "email": "john@example.com",
      "role": "CREATOR"
    },
    "file": {
      "id": "file-uuid",
      "type": "PREVIEW_VIDEO",
      "fileName": "preview-v1.mp4",
      "version": 1
    }
  }
]
```

---

### 3. Create Message/Comment

**POST** `/api/messages`

Create a new message. If `timestamp` is provided, automatically sets type to `TIMESTAMP_COMMENT`.

**Request Body:**
```json
{
  "orderId": "order-uuid",
  "fileId": "file-uuid",  // optional - omit for order-level comments
  "content": "The audio sync is off at this point",
  "timestamp": 125.5,     // optional - video timestamp in seconds
  "x": 100,               // optional - x coordinate for visual annotation
  "y": 200                // optional - y coordinate for visual annotation
}
```

**Response (201 Created):**
```json
{
  "id": "msg-uuid-1",
  "orderId": "order-uuid",
  "fileId": "file-uuid",
  "userId": "user-uuid",
  "type": "TIMESTAMP_COMMENT",
  "content": "The audio sync is off at this point",
  "timestamp": 125.5,
  "x": 100,
  "y": 200,
  "resolved": false,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "user": {
    "id": "user-uuid",
    "name": "John Creator",
    "email": "john@example.com",
    "role": "CREATOR"
  },
  "file": {
    "id": "file-uuid",
    "type": "PREVIEW_VIDEO",
    "fileName": "preview-v1.mp4",
    "version": 1
  },
  "order": {
    "id": "order-uuid",
    "title": "Product Launch Video"
  }
}
```

**Example: General Comment (no timestamp)**
```json
{
  "orderId": "order-uuid",
  "content": "Overall, great work! Just need a few adjustments."
}
```

**Example: Timestamp Comment**
```json
{
  "orderId": "order-uuid",
  "fileId": "file-uuid",
  "content": "The color looks too saturated here",
  "timestamp": 67.8
}
```

---

### 4. Get Single Message

**GET** `/api/messages/:id`

Get a specific message by ID.

**Response:**
```json
{
  "id": "msg-uuid-1",
  "orderId": "order-uuid",
  "fileId": "file-uuid",
  "userId": "user-uuid",
  "type": "TIMESTAMP_COMMENT",
  "content": "Can we add a transition here?",
  "timestamp": 45.2,
  "resolved": false,
  "createdAt": "2024-01-15T10:30:00Z",
  "user": {
    "id": "user-uuid",
    "name": "John Creator",
    "email": "john@example.com",
    "role": "CREATOR"
  },
  "file": {
    "id": "file-uuid",
    "type": "PREVIEW_VIDEO",
    "fileName": "preview-v1.mp4",
    "version": 1
  }
}
```

---

### 5. Update Message

**PATCH** `/api/messages/:id`

Update a message (only author or order participants can update).

**Request Body:**
```json
{
  "content": "Updated comment text",  // optional
  "resolved": true                     // optional
}
```

**Response:**
```json
{
  "id": "msg-uuid-1",
  "content": "Updated comment text",
  "resolved": true,
  "updatedAt": "2024-01-15T11:00:00Z",
  // ... other fields
}
```

---

### 6. Delete Message

**DELETE** `/api/messages/:id`

Delete a message (only author can delete).

**Response:** `204 No Content`

---

## Message Types

- `COMMENT` - General comment (no timestamp)
- `TIMESTAMP_COMMENT` - Comment at specific video timestamp
- `SYSTEM` - System-generated messages (future use)

The type is automatically set to `TIMESTAMP_COMMENT` when `timestamp` is provided.

---

## Auto Status Updates

When a **CREATOR** posts a message during `REVIEW` status, the order status is automatically updated to `REVISION`. This allows creators to provide feedback that requires changes.

---

## Access Control

- **Creators** can view and post messages on their orders
- **Editors** can view and post messages on assigned orders
- **Both** can update/resolve messages they authored or messages on their orders
- Only **message author** can delete their own messages

---

## Frontend Integration Example

```typescript
// Get messages for an order with timestamp comments
const response = await fetch('/api/messages/order/order-uuid?type=TIMESTAMP_COMMENT', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const messages = await response.json();

// Create timestamp comment
const newComment = await fetch('/api/messages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orderId: 'order-uuid',
    fileId: 'file-uuid',
    content: 'The transition here needs work',
    timestamp: 125.5  // 2 minutes 5.5 seconds
  })
});
```

---

## Notes

- Timestamp is in seconds (e.g., 125.5 = 2 minutes 5.5 seconds)
- Messages are sorted by timestamp (ascending), then by creation date
- Visual annotation coordinates (x, y) are optional for future UI features
- Resolved status allows marking comments as addressed

