# JANAKI CRM API Integration Guide

## Overview

JANAKI provides powerful REST APIs that allow you to integrate your website forms and external applications with your CRM. This enables automatic lead capture, contact synchronization, and status updates.

## Getting Started

### 1. Generate an API Key

1. Log in to your JANAKI dashboard
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Give your key a descriptive name (e.g., "Website Contact Form")
5. Select the appropriate permissions:
   - `leads:create` - Create new leads via webhook
   - `contacts:read` - Fetch contact information
   - `contacts:write` - Update contact information
6. Copy and save your API key securely (you won't be able to see it again!)

### 2. Available Permissions

- **leads:create** - Allow creating new leads/contacts
- **contacts:read** - Allow reading contact data
- **contacts:write** - Allow updating contact information
- **\*** - Full access (use with caution)

## API Endpoints

### Base URL
```
https://your-janaki-instance.com/api/public
```

### Authentication

Include your API key in requests using one of these methods:

**Method 1: Header (Recommended)**
```
X-API-Key: your_api_key_here
```

**Method 2: Authorization Header**
```
Authorization: Bearer your_api_key_here
```

**Method 3: Query Parameter**
```
?api_key=your_api_key_here
```

---

## 1. Create Lead (Capture Form Submissions)

**Endpoint:** `POST /api/public/leads`

**Description:** Capture leads from your website forms and automatically add them to your CRM.

**Required Permission:** `leads:create`

### Request Body

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Inc",
  "message": "I'm interested in your product",
  "source": "website",
  "customData": {
    "budget": "10000",
    "timeline": "Q1 2024"
  }
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `firstName` | string | Yes | Contact's first name |
| `lastName` | string | Yes | Contact's last name |
| `email` | string | No | Contact's email address |
| `phone` | string | No | Contact's phone number |
| `company` | string | No | Company name |
| `message` | string | No | Message or inquiry details |
| `source` | string | No | Source of the lead (default: "website") |
| `customData` | object | No | Additional custom fields |

### Example Request

```javascript
fetch('https://your-janaki-instance.com/api/public/leads', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key_here'
  },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    company: 'Acme Inc',
    message: 'I would like to learn more about your services',
    source: 'website'
  })
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

### Success Response (201 Created)

```json
{
  "success": true,
  "leadId": "clx7j2k9l0000xyz...",
  "message": "Lead captured successfully"
}
```

### Error Responses

**401 Unauthorized**
```json
{
  "error": "Invalid API key"
}
```

**400 Bad Request**
```json
{
  "error": "Invalid data",
  "details": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

---

## 2. Fetch Contacts

**Endpoint:** `GET /api/public/contacts`

**Description:** Retrieve contact information and their current status from your CRM.

**Required Permission:** `contacts:read`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status (lead, prospect, customer, inactive) |
| `email` | string | No | Search by exact email |
| `phone` | string | No | Search by phone number |
| `limit` | integer | No | Number of results (default: 50, max: 100) |
| `offset` | integer | No | Pagination offset (default: 0) |

### Example Request

```javascript
fetch('https://your-janaki-instance.com/api/public/contacts?status=lead&limit=10', {
  headers: {
    'X-API-Key': 'your_api_key_here'
  }
})
.then(response => response.json())
.then(data => console.log('Contacts:', data))
.catch(error => console.error('Error:', error));
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "clx7j2k9l0000xyz...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "company": "Acme Inc",
      "position": "CEO",
      "status": "lead",
      "source": "website",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## Integration Examples

### HTML Form Integration

See the complete example form in `/public/example-contact-form.html`

### React/Next.js Integration

```typescript
'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/public/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_JANAKI_API_KEY!
        },
        body: JSON.stringify({
          ...formData,
          source: 'website'
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          message: ''
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
```

### WordPress Integration

```php
<?php
// WordPress Contact Form 7 Hook
add_action('wpcf7_mail_sent', 'send_to_janaki_crm');

function send_to_janaki_crm($contact_form) {
    $submission = WPCF7_Submission::get_instance();
    $posted_data = $submission->get_posted_data();
    
    $api_key = 'your_api_key_here';
    $janaki_url = 'https://your-janaki-instance.com/api/public/leads';
    
    $data = array(
        'firstName' => $posted_data['first-name'],
        'lastName' => $posted_data['last-name'],
        'email' => $posted_data['email'],
        'phone' => $posted_data['phone'],
        'message' => $posted_data['message'],
        'source' => 'wordpress'
    );
    
    $response = wp_remote_post($janaki_url, array(
        'headers' => array(
            'Content-Type' => 'application/json',
            'X-API-Key' => $api_key
        ),
        'body' => json_encode($data)
    ));
}
?>
```

---

## Monitoring & Debugging

### Webhook Logs

All API requests are automatically logged. You can view them in:
**Dashboard** → **Settings** → **API Keys** → Select your key → **View Logs**

Each log entry contains:
- Timestamp
- Request method and endpoint
- Request body
- Response status and body
- IP address and user agent

### Testing Your Integration

Use tools like:
- **Postman** - API testing platform
- **cURL** - Command-line tool
- **Browser DevTools** - Network tab

Example cURL command:
```bash
curl -X POST https://your-janaki-instance.com/api/public/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com"
  }'
```

---

## Best Practices

1. **Secure Your API Keys**
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys periodically
   - Use different keys for different environments

2. **Rate Limiting**
   - Implement reasonable retry logic
   - Cache responses when appropriate
   - Don't make excessive requests

3. **Error Handling**
   - Always check response status codes
   - Implement proper error messages for users
   - Log errors for debugging

4. **Data Validation**
   - Validate form data on the client side
   - Sanitize user inputs
   - Provide clear validation messages

5. **Testing**
   - Test with invalid data
   - Test with network failures
   - Monitor webhook logs regularly

---

## Support

Need help with integration?

1. Check the webhook logs for error details
2. Review this documentation
3. Contact your JANAKI administrator
4. Create a support ticket in the dashboard

---

## Rate Limits

- **Default**: 1000 requests per hour per API key
- **Burst**: 100 requests per minute

If you exceed these limits, you'll receive a `429 Too Many Requests` response.

---

## Changelog

### v1.0.0 (Current)
- Initial API release
- Lead capture endpoint
- Contact retrieval endpoint
- Webhook logging system

---

**Last Updated:** December 28, 2024
