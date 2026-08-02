export const TENANT_ID_HEADER = 'x-tenant-id';

export const API_KEY_HEADER = 'x-api-key';

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  AGENT = 'agent',
  VIEWER = 'viewer'
}

export enum ConversationStatus {
  OPEN = 'open',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  EXPIRED = 'expired'
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum TemplateCategory {
  MARKETING = 'marketing',
  UTILITY = 'utility',
  AUTHENTICATION = 'authentication'
}

export enum TemplateStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAUSED = 'paused'
}

export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound'
}

export enum MessageStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

export enum MessageType {
  TEXT = 'text',
  TEMPLATE = 'template',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  LOCATION = 'location',
  CONTACTS = 'contacts',
  STICKER = 'sticker',
  REACTION = 'reaction',
  INTERACTIVE = 'interactive'
}

export type WhatsAppMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'location'
  | 'contacts'
  | 'sticker'
  | 'reaction'
  | 'interactive';

export type TriggerType =
  | 'keyword_match'
  | 'first_message'
  | 'button_click'
  | 'any_message'
  | 'opt_in'
  | 'campaign_reply';

export type FlowNodeType =
  | 'send_text'
  | 'send_template'
  | 'send_image'
  | 'send_interactive_buttons'
  | 'send_interactive_list'
  | 'condition'
  | 'set_variable'
  | 'add_tag'
  | 'assign_to_agent'
  | 'webhook_call'
  | 'delay'
  | 'end';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  createdAt: Date;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
  name: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ApiKey {
  id: string;
  tenantId: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface WabaAccount {
  id: string;
  tenantId: string;
  wabaId: string;
  wabaName: string;
  accessToken: string;
  status: string;
  currency: string;
  timezone: string;
  createdAt: Date;
}

export interface PhoneNumber {
  id: string;
  tenantId: string;
  wabaId: string;
  phoneNumberId: string;
  displayNumber: string;
  displayName: string;
  qualityRating: string;
  status: string;
  isDefault: boolean;
  webhookUrl?: string;
  createdAt: Date;
}

export interface Contact {
  id: string;
  tenantId: string;
  phone: string;
  name?: string;
  email?: string;
  countryCode?: string;
  language?: string;
  customFields?: Record<string, unknown>;
  tags?: string[];
  optedIn: boolean;
  optedInAt?: Date;
  optedOutAt?: Date;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  tenantId: string;
  phoneNumberId: string;
  wamid?: string;
  direction: MessageDirection;
  recipient: string;
  sender: string;
  type: MessageType;
  content?: string;
  status: MessageStatus;
  templateId?: string;
  campaignId?: string;
  conversationId?: string;
  contactId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  errorCode?: string;
  errorMessage?: string;
  createdAt: Date;
}

export interface Template {
  id: string;
  tenantId: string;
  wabaId: string;
  templateIdMeta?: string;
  name: string;
  category: TemplateCategory;
  language: string;
  status: TemplateStatus;
  components: TemplateComponent[];
  rejectionReason?: string;
  qualityScore?: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN' | string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'footer' | 'buttons';
  format?: 'text' | 'image' | 'video' | 'document';
  text?: string;
  parameters?: { type: string; text?: string }[];
  buttons?: TemplateButton[];
}

export interface TemplateButton {
  type: 'cta_url' | 'quick_reply' | 'phone_number' | 'otp';
  text: string;
  url?: string;
  phoneNumber?: string;
}

export interface Conversation {
  id: string;
  tenantId: string;
  phoneNumberId: string;
  contactId: string;
  status: ConversationStatus;
  assignedTo?: string;
  lastMessageAt: Date;
  lastMessagePreview?: string;
  unreadCount: number;
  labels?: string[];
  resolvedAt?: Date;
  createdAt: Date;
}

export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  templateId: string;
  phoneNumberId: string;
  audienceType: 'all' | 'segment' | 'custom';
  segmentId?: string;
  contactCount: number;
  status: CampaignStatus;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  createdAt: Date;
}

export interface Flow {
  id: string;
  tenantId: string;
  phoneNumberId: string;
  name: string;
  triggerType: TriggerType;
  triggerValue?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}