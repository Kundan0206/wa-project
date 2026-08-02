// API reference for the routes meant to be called with a tenant API key
// (x-api-key header) from an external integration. This intentionally
// excludes dashboard-only actions (team invites, billing, WABA connect,
// etc.) that are technically reachable with an API key but aren't meant to
// be part of a public integration surface.

export type ParamLocation = 'path' | 'query' | 'body';

export interface ApiParam {
  name: string;
  location: ParamLocation;
  type: string;
  required: boolean;
  description: string;
  example?: string;
}

export interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string; // relative to /api/v1, may contain :param segments
  summary: string;
  description: string;
  params: ApiParam[];
  exampleResponse: string;
  requiredScope?: string;
}

export interface ApiResource {
  id: string;
  name: string;
  description: string;
  endpoints: ApiEndpoint[];
}

export const API_RESOURCES: ApiResource[] = [
  {
    id: 'messages',
    name: 'Messages',
    description: 'Send WhatsApp messages and read message history.',
    endpoints: [
      {
        id: 'send-text',
        method: 'POST',
        path: '/messages/text',
        summary: 'Send a text message',
        description: 'Sends a free-form text message to a WhatsApp number. Requires an active 24-hour customer service window, or use the template endpoint instead.',
        requiredScope: 'messages:send',
        params: [
          { name: 'to', location: 'body', type: 'string', required: true, description: 'Recipient phone number in E.164 format.', example: '+15551234567' },
          { name: 'phone_number_id', location: 'body', type: 'string', required: true, description: 'Your WhatsApp phone number ID (see the WhatsApp page in the dashboard).', example: '1143523638846055' },
          { name: 'message', location: 'body', type: 'string', required: true, description: 'Message text, up to 4096 characters.', example: 'Hi! Your order has shipped.' },
        ],
        exampleResponse: `{
  "success": true,
  "data": { "id": "b6b6c1b0-...", "status": "queued" }
}`,
      },
      {
        id: 'send-template',
        method: 'POST',
        path: '/messages/template',
        summary: 'Send a template message',
        description: 'Sends a pre-approved WhatsApp template message. Use this to message a customer outside the 24-hour window.',
        requiredScope: 'messages:send',
        params: [
          { name: 'to', location: 'body', type: 'string', required: true, description: 'Recipient phone number in E.164 format.', example: '+15551234567' },
          { name: 'phone_number_id', location: 'body', type: 'string', required: true, description: 'Your WhatsApp phone number ID.', example: '1143523638846055' },
          { name: 'template_name', location: 'body', type: 'string', required: true, description: 'Name of an approved template.', example: 'order_confirmation' },
          { name: 'language_code', location: 'body', type: 'string', required: false, description: 'Template language code. Defaults to "en".', example: 'en_US' },
          { name: 'components', location: 'body', type: 'array', required: false, description: 'Template variable substitutions, in Meta\'s components format.', example: '[]' },
        ],
        exampleResponse: `{
  "success": true,
  "data": { "id": "b6b6c1b0-...", "status": "queued" }
}`,
      },
      {
        id: 'list-messages',
        method: 'GET',
        path: '/messages',
        summary: 'List messages',
        description: 'Returns a paginated list of messages, optionally filtered by contact, conversation, status, or type.',
        requiredScope: 'messages:read',
        params: [
          { name: 'contact', location: 'query', type: 'string', required: false, description: 'Filter by contact ID.' },
          { name: 'conversation', location: 'query', type: 'string', required: false, description: 'Filter by conversation ID.' },
          { name: 'status', location: 'query', type: 'string', required: false, description: 'Filter by status (queued, sent, delivered, read, failed).' },
          { name: 'type', location: 'query', type: 'string', required: false, description: 'Filter by message type (text, template, image, ...).' },
          { name: 'page', location: 'query', type: 'number', required: false, description: 'Page number, defaults to 1.' },
          { name: 'limit', location: 'query', type: 'number', required: false, description: 'Results per page, defaults to 20.' },
        ],
        exampleResponse: `{
  "success": true,
  "data": [{ "id": "...", "direction": "inbound", "content": "hi", "status": "received", "createdAt": "..." }],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}`,
      },
      {
        id: 'get-message',
        method: 'GET',
        path: '/messages/:id',
        summary: 'Get a message',
        description: 'Returns a single message by ID.',
        requiredScope: 'messages:read',
        params: [
          { name: 'id', location: 'path', type: 'string', required: true, description: 'Message ID.' },
        ],
        exampleResponse: `{
  "success": true,
  "data": { "id": "...", "direction": "outbound", "content": "hi", "status": "sent" }
}`,
      },
    ],
  },
  {
    id: 'conversations',
    name: 'Conversations',
    description: 'Read and reply to inbox conversations.',
    endpoints: [
      {
        id: 'list-conversations',
        method: 'GET',
        path: '/conversations',
        summary: 'List conversations',
        description: 'Returns a paginated list of conversations, each with the linked contact and phone number.',
        requiredScope: 'messages:read',
        params: [
          { name: 'status', location: 'query', type: 'string', required: false, description: 'Filter by status (open, pending, resolved).' },
          { name: 'assigned_to', location: 'query', type: 'string', required: false, description: 'Filter by assigned user ID, or "unassigned".' },
          { name: 'page', location: 'query', type: 'number', required: false, description: 'Page number, defaults to 1.' },
          { name: 'limit', location: 'query', type: 'number', required: false, description: 'Results per page, defaults to 20.' },
        ],
        exampleResponse: `{
  "success": true,
  "data": [{ "id": "...", "status": "open", "lastMessagePreview": "hi", "contacts": { "name": "Kundan" } }]
}`,
      },
      {
        id: 'get-conversation',
        method: 'GET',
        path: '/conversations/:id',
        summary: 'Get a conversation',
        description: 'Returns a single conversation with its contact, phone number, and notes.',
        requiredScope: 'messages:read',
        params: [
          { name: 'id', location: 'path', type: 'string', required: true, description: 'Conversation ID.' },
        ],
        exampleResponse: `{
  "success": true,
  "data": { "id": "...", "status": "open", "contacts": { "name": "Kundan" } }
}`,
      },
      {
        id: 'send-conversation-message',
        method: 'POST',
        path: '/conversations/:id/send',
        summary: 'Reply in a conversation',
        description: 'Sends an outbound text message within an existing conversation, to the conversation\'s contact.',
        requiredScope: 'messages:send',
        params: [
          { name: 'id', location: 'path', type: 'string', required: true, description: 'Conversation ID.' },
          { name: 'message', location: 'body', type: 'string', required: true, description: 'Message text.', example: 'Thanks for reaching out!' },
        ],
        exampleResponse: `{
  "success": true,
  "data": { "id": "...", "status": "queued" }
}`,
      },
      {
        id: 'resolve-conversation',
        method: 'POST',
        path: '/conversations/:id/resolve',
        summary: 'Resolve a conversation',
        description: 'Marks a conversation as resolved.',
        requiredScope: 'messages:send',
        params: [
          { name: 'id', location: 'path', type: 'string', required: true, description: 'Conversation ID.' },
        ],
        exampleResponse: `{
  "success": true,
  "data": { "id": "...", "status": "resolved" }
}`,
      },
    ],
  },
  {
    id: 'contacts',
    name: 'Contacts',
    description: 'Create, read, update, and manage your contacts.',
    endpoints: [
      {
        id: 'list-contacts',
        method: 'GET',
        path: '/contacts',
        summary: 'List contacts',
        description: 'Returns a paginated list of contacts, optionally searched or filtered by opt-in status.',
        requiredScope: 'contacts:read',
        params: [
          { name: 'search', location: 'query', type: 'string', required: false, description: 'Matches against phone, name, or email.' },
          { name: 'opted_in', location: 'query', type: 'boolean', required: false, description: 'Filter by opt-in status.' },
          { name: 'page', location: 'query', type: 'number', required: false, description: 'Page number, defaults to 1.' },
          { name: 'limit', location: 'query', type: 'number', required: false, description: 'Results per page, defaults to 20.' },
        ],
        exampleResponse: `{
  "success": true,
  "data": [{ "id": "...", "phone": "+15551234567", "name": "Jane Doe", "optedIn": true }],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}`,
      },
      {
        id: 'get-contact',
        method: 'GET',
        path: '/contacts/:id',
        summary: 'Get a contact',
        description: 'Returns a single contact, including its tags.',
        requiredScope: 'contacts:read',
        params: [
          { name: 'id', location: 'path', type: 'string', required: true, description: 'Contact ID.' },
        ],
        exampleResponse: `{
  "success": true,
  "data": { "id": "...", "phone": "+15551234567", "name": "Jane Doe", "tags": ["vip"] }
}`,
      },
      {
        id: 'create-contact',
        method: 'POST',
        path: '/contacts',
        summary: 'Create or update a contact',
        description: 'Creates a new contact, or updates the existing one if the phone number already exists for your account.',
        requiredScope: 'contacts:write',
        params: [
          { name: 'phone', location: 'body', type: 'string', required: true, description: 'Phone number in E.164 format.', example: '+15551234567' },
          { name: 'name', location: 'body', type: 'string', required: false, description: 'Contact name.', example: 'Jane Doe' },
          { name: 'email', location: 'body', type: 'string', required: false, description: 'Contact email.', example: 'jane@example.com' },
          { name: 'language', location: 'body', type: 'string', required: false, description: 'Preferred language code. Defaults to "en".', example: 'en' },
          { name: 'tags', location: 'body', type: 'array', required: false, description: 'Tags to attach to the contact.', example: '["vip"]' },
          { name: 'opted_in', location: 'body', type: 'boolean', required: false, description: 'Whether the contact has opted in to receive messages. Defaults to false.', example: 'true' },
        ],
        exampleResponse: `{
  "success": true,
  "data": { "id": "...", "phone": "+15551234567", "name": "Jane Doe" }
}`,
      },
      {
        id: 'update-contact',
        method: 'PUT',
        path: '/contacts/:id',
        summary: 'Update a contact',
        description: 'Updates a contact\'s name, email, or custom fields.',
        requiredScope: 'contacts:write',
        params: [
          { name: 'id', location: 'path', type: 'string', required: true, description: 'Contact ID.' },
          { name: 'name', location: 'body', type: 'string', required: false, description: 'Contact name.' },
          { name: 'email', location: 'body', type: 'string', required: false, description: 'Contact email.' },
        ],
        exampleResponse: `{
  "success": true,
  "data": { "id": "...", "name": "Jane Doe" }
}`,
      },
      {
        id: 'delete-contact',
        method: 'DELETE',
        path: '/contacts/:id',
        summary: 'Delete a contact',
        description: 'Permanently deletes a contact.',
        requiredScope: 'contacts:write',
        params: [
          { name: 'id', location: 'path', type: 'string', required: true, description: 'Contact ID.' },
        ],
        exampleResponse: `{
  "success": true,
  "message": "Contact deleted"
}`,
      },
      {
        id: 'import-contacts',
        method: 'POST',
        path: '/contacts/import',
        summary: 'Bulk import contacts',
        description: 'Creates multiple contacts at once. Contacts with a phone number that already exists are skipped.',
        requiredScope: 'contacts:write',
        params: [
          { name: 'contacts', location: 'body', type: 'array', required: true, description: 'Array of { phone, name?, email? } objects.', example: '[{"phone":"+15551234567","name":"Jane Doe"}]' },
        ],
        exampleResponse: `{
  "success": true,
  "data": { "imported": 1 }
}`,
      },
      {
        id: 'opt-out-contact',
        method: 'POST',
        path: '/contacts/opt-out/:phone',
        summary: 'Opt out a contact',
        description: 'Marks a contact as opted out, by phone number.',
        requiredScope: 'contacts:write',
        params: [
          { name: 'phone', location: 'path', type: 'string', required: true, description: 'Contact phone number.', example: '+15551234567' },
        ],
        exampleResponse: `{
  "success": true,
  "message": "Contact opted out"
}`,
      },
    ],
  },
  {
    id: 'templates',
    name: 'Templates',
    description: 'Read your approved WhatsApp message templates.',
    endpoints: [
      {
        id: 'list-templates',
        method: 'GET',
        path: '/templates',
        summary: 'List templates',
        description: 'Returns a paginated list of templates, optionally filtered by status or category.',
        requiredScope: 'templates:read',
        params: [
          { name: 'status', location: 'query', type: 'string', required: false, description: 'Filter by status (pending, approved, rejected).' },
          { name: 'category', location: 'query', type: 'string', required: false, description: 'Filter by category (marketing, utility, authentication).' },
          { name: 'page', location: 'query', type: 'number', required: false, description: 'Page number, defaults to 1.' },
          { name: 'limit', location: 'query', type: 'number', required: false, description: 'Results per page, defaults to 20.' },
        ],
        exampleResponse: `{
  "success": true,
  "data": [{ "id": "...", "name": "order_confirmation", "status": "approved" }],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}`,
      },
      {
        id: 'get-template',
        method: 'GET',
        path: '/templates/:id',
        summary: 'Get a template',
        description: 'Returns a single template, including its component structure.',
        requiredScope: 'templates:read',
        params: [
          { name: 'id', location: 'path', type: 'string', required: true, description: 'Template ID.' },
        ],
        exampleResponse: `{
  "success": true,
  "data": { "id": "...", "name": "order_confirmation", "components": [] }
}`,
      },
    ],
  },
  {
    id: 'media',
    name: 'Media',
    description: 'Upload and manage media files for use in messages and templates.',
    endpoints: [
      {
        id: 'list-media',
        method: 'GET',
        path: '/media',
        summary: 'List media files',
        description: 'Returns a paginated list of uploaded media files.',
        params: [
          { name: 'page', location: 'query', type: 'number', required: false, description: 'Page number, defaults to 1.' },
          { name: 'limit', location: 'query', type: 'number', required: false, description: 'Results per page, defaults to 20.' },
        ],
        exampleResponse: `{
  "success": true,
  "data": [{ "id": "...", "originalName": "logo.png", "publicUrl": "https://..." }]
}`,
      },
      {
        id: 'upload-media',
        method: 'POST',
        path: '/media/upload',
        summary: 'Upload a media file',
        description: 'Uploads a file (as base64) and, if a WABA is connected, also uploads it to WhatsApp so it can be referenced in outbound media messages.',
        params: [
          { name: 'file', location: 'body', type: 'string', required: true, description: 'Base64-encoded file content.', example: '<base64>' },
          { name: 'file_type', location: 'body', type: 'string', required: false, description: 'MIME type of the file.', example: 'image/png' },
          { name: 'file_name', location: 'body', type: 'string', required: false, description: 'Original file name.', example: 'logo.png' },
        ],
        exampleResponse: `{
  "success": true,
  "data": { "id": "...", "publicUrl": "https://...", "whatsappMediaId": "..." }
}`,
      },
      {
        id: 'delete-media',
        method: 'DELETE',
        path: '/media/:id',
        summary: 'Delete a media file',
        description: 'Permanently deletes an uploaded media file.',
        params: [
          { name: 'id', location: 'path', type: 'string', required: true, description: 'Media file ID.' },
        ],
        exampleResponse: `{
  "success": true,
  "message": "Media file deleted"
}`,
      },
    ],
  },
];
