import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type {
  ApiResponse, PaginatedResponse, WabaAccount, PhoneNumber,
  Conversation, Campaign, Template, Contact, Flow, Message,
} from '@wa/shared';

interface AnalyticsOverview {
  totalMessages: number;
  sent: number;
  delivered: number;
  read: number;
  deliveryRate: string;
  readRate: string;
  totalContacts: number;
  activeConversations: number;
}

interface MessagesAnalytics {
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

interface BusinessProfile {
  id?: string;
  businessName?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
}

interface NotificationSettings {
  notificationEmail: boolean;
  notificationSms: boolean;
}

// Analytics
export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get<ApiResponse<AnalyticsOverview>>('/api/v1/analytics/overview'),
  });
}

export function useAnalyticsMessages() {
  return useQuery({
    queryKey: ['analytics', 'messages'],
    queryFn: () => api.get<ApiResponse<MessagesAnalytics>>('/api/v1/analytics/messages'),
  });
}

interface AnalyticsTrendPoint {
  date: string;
  sent: number;
  delivered: number;
  read: number;
}

export function useAnalyticsTrends(days: number = 7) {
  return useQuery({
    queryKey: ['analytics', 'trends', days],
    queryFn: () => api.get<ApiResponse<AnalyticsTrendPoint[]>>('/api/v1/analytics/trends', { days: String(days) }),
  });
}

// WABA
export function useWabaAccounts() {
  return useQuery({
    queryKey: ['waba'],
    queryFn: () => api.get<ApiResponse<WabaAccount[]>>('/api/v1/waba'),
  });
}

interface EmbeddedCallbackResponse {
  wabaIds: string[];
  skipped: Array<{ wabaId: string; reason: string }>;
}

// Finishes Meta's Embedded Signup flow: exchanges the code Meta returned and
// connects every WhatsApp Business Account the resulting token grants access
// to - whether that's a brand new account created during signup, or an
// existing one the user already manages in Meta Business Manager.
export function useEmbeddedCallback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.post<ApiResponse<EmbeddedCallbackResponse>>('/api/v1/waba/embedded-callback', { code }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['waba'] }),
  });
}

export function useDisconnectWaba() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<ApiResponse<void>>(`/api/v1/waba/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['waba'] }),
  });
}

interface WabaMetaDetails {
  id: string;
  name?: string;
  timezoneId?: string;
  messageTemplateNamespace?: string;
  currency?: string;
}

export function useWabaMetaDetails(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['waba', id, 'meta-details'],
    queryFn: () => api.get<ApiResponse<WabaMetaDetails>>(`/api/v1/waba/meta-details/${id}`),
    enabled,
  });
}

// Phone Numbers
export function usePhoneNumbers() {
  return useQuery({
    queryKey: ['phone-numbers'],
    queryFn: () => api.get<ApiResponse<PhoneNumber[]>>('/api/v1/phone-numbers'),
  });
}

export function useSyncPhoneNumbers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<ApiResponse<PhoneNumber[]>>('/api/v1/phone-numbers/sync'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['phone-numbers'] });
      qc.invalidateQueries({ queryKey: ['waba'] });
    },
  });
}

export function useRegisterPhoneNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pin, displayName }: { id: string; pin?: string; displayName?: string }) =>
      api.post<ApiResponse<void>>(`/api/v1/phone-numbers/register/${id}`, { pin, display_name: displayName }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['phone-numbers'] });
    },
  });
}

export function useDeregisterPhoneNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<ApiResponse<void>>(`/api/v1/phone-numbers/deregister/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['phone-numbers'] });
    },
  });
}

export function usePhoneNumberDetails(id: string) {
  return useQuery({
    queryKey: ['phone-numbers', id, 'details'],
    queryFn: () => api.get<ApiResponse<any>>(`/api/v1/phone-numbers/details/${id}`),
    enabled: !!id,
  });
}

export function useRequestVerificationCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, method }: { id: string; method?: string }) =>
      api.post<ApiResponse<any>>(`/api/v1/phone-numbers/request-code/${id}`, { method }),
  });
}

export function useVerifyPhoneCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, code }: { id: string; code: string }) =>
      api.post<ApiResponse<any>>(`/api/v1/phone-numbers/verify-code/${id}`, { code }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['phone-numbers'] });
    },
  });
}

export function useSubscribeWabaWebhooks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (wabaId: string) => api.post<ApiResponse<void>>(`/api/v1/waba/${wabaId}/subscribe`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['waba'] }),
  });
}

export interface WabaConnectionCheck {
  check: string;
  ok: boolean;
  detail: string;
}

export function useTestWabaConnection() {
  return useMutation({
    mutationFn: (wabaId: string) =>
      api.post<ApiResponse<{ healthy: boolean; checks: WabaConnectionCheck[] }>>(`/api/v1/waba/${wabaId}/test-connection`),
  });
}

export function useSetDefaultPhoneNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<ApiResponse<void>>(`/api/v1/phone-numbers/${id}/set-default`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['phone-numbers'] }),
  });
}

// Inbox / Conversations
export function useConversations(
  params?: { status?: string; assigned_to?: string; page?: string; limit?: string }
) {
  return useQuery({
    queryKey: ['conversations', params],
    queryFn: () => api.get<ApiResponse<Conversation[]>>('/api/v1/conversations', params as Record<string, string>),
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['conversations', id],
    queryFn: () => api.get<ApiResponse<Conversation>>(`/api/v1/conversations/${id}`),
    enabled: !!id,
  });
}

export function useConversationMessages(conversationId: string, params?: { page?: string; limit?: string }) {
  return useQuery({
    queryKey: ['conversations', conversationId, 'messages', params],
    queryFn: () => api.get<ApiResponse<Message[]>>('/api/v1/messages', { ...params, conversation: conversationId }),
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, message, type }: { conversationId: string; message: string; type?: string }) =>
      api.post<ApiResponse<Message>>(`/api/v1/conversations/${conversationId}/send`, { message, type }),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['conversations', vars.conversationId] }),
  });
}

export function useAssignConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, assignedTo }: { conversationId: string; assignedTo: string | null }) =>
      api.post<ApiResponse<Conversation>>(`/api/v1/conversations/${conversationId}/assign`, { assigned_to: assignedTo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

export function useResolveConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      api.post<ApiResponse<Conversation>>(`/api/v1/conversations/${conversationId}/resolve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

export function useUpdateConversationLabels() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, labels }: { conversationId: string; labels: string[] }) =>
      api.put<ApiResponse<Conversation>>(`/api/v1/conversations/${conversationId}/labels`, { labels }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

// Templates
export function useTemplates(params?: { status?: string; category?: string; page?: string; limit?: string }) {
  return useQuery({
    queryKey: ['templates', params],
    queryFn: () => api.get<PaginatedResponse<Template>>('/api/v1/templates', params as Record<string, string>),
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; category: string; language?: string; components: unknown[] }) =>
      api.post<ApiResponse<Template>>('/api/v1/templates', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<ApiResponse<void>>(`/api/v1/templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useSyncTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<ApiResponse<Template>>(`/api/v1/templates/${id}/sync`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useSyncTemplatesFromMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (phoneNumberId: string) =>
      api.post<ApiResponse<{ total: number; created: number; updated: number }>>('/api/v1/templates/sync-from-meta', { phoneNumberId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export interface TemplateAnalytics {
  sent: number;
  delivered: number;
  read: number;
  deliveryRate: string;
  readRate: string;
}

export function useTemplateAnalytics(id: string | null) {
  return useQuery({
    queryKey: ['templates', id, 'analytics'],
    queryFn: () => api.get<ApiResponse<TemplateAnalytics>>(`/api/v1/templates/${id}/analytics`),
    enabled: !!id,
  });
}

// Campaigns
export function useCampaigns(params?: { status?: string; page?: string; limit?: string }) {
  return useQuery({
    queryKey: ['campaigns', params],
    queryFn: () => api.get<PaginatedResponse<Campaign>>('/api/v1/campaigns', params as Record<string, string>),
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string; template_id: string; phone_number_id: string;
      audience_type: string; segment_id?: string; contact_ids?: string[];
      scheduled_at?: string;
    }) => api.post<ApiResponse<Campaign>>('/api/v1/campaigns', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

export function useSendCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<ApiResponse<void>>(`/api/v1/campaigns/${id}/send`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

interface CampaignAnalytics {
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  deliveryRate: string;
  readRate: string;
}

export function useCampaignAnalytics(id: string) {
  return useQuery({
    queryKey: ['campaigns', id, 'analytics'],
    queryFn: () => api.get<ApiResponse<CampaignAnalytics>>(`/api/v1/campaigns/${id}/analytics`),
    enabled: !!id,
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<ApiResponse<void>>(`/api/v1/campaigns/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

// Contacts
export function useContacts(params?: { search?: string; tags?: string; opted_in?: string; page?: string; limit?: string }) {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: () => api.get<PaginatedResponse<Contact>>('/api/v1/contacts', params as Record<string, string>),
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { phone: string; name?: string; email?: string; tags?: string[]; opted_in?: boolean }) =>
      api.post<ApiResponse<Contact>>('/api/v1/contacts', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; email?: string }) =>
      api.put<ApiResponse<Contact>>(`/api/v1/contacts/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<ApiResponse<void>>(`/api/v1/contacts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
}

export function useImportContacts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contacts: { phone: string; name?: string; email?: string }[]) =>
      api.post<ApiResponse<{ imported: number }>>('/api/v1/contacts/import', { contacts }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
}

// Flows
export function useFlows() {
  return useQuery({
    queryKey: ['flows'],
    queryFn: () => api.get<ApiResponse<Flow[]>>('/api/v1/flows'),
  });
}

export function useCreateFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string; phone_number_id: string; trigger_type: string; trigger_value?: string;
      nodes: unknown[]; edges: unknown[];
    }) => api.post<ApiResponse<Flow>>('/api/v1/flows', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flows'] }),
  });
}

export interface FlowSessionSummary {
  id: string;
  status: string;
  errorMessage: string | null;
  currentNodeId: string | null;
  startedAt: string;
  endedAt: string | null;
}

interface FlowAnalytics {
  totalSessions: number;
  completed: number;
  failed: number;
  completionRate: string;
  recentSessions: FlowSessionSummary[];
}

export function useFlowAnalytics(id: string) {
  return useQuery({
    queryKey: ['flows', id, 'analytics'],
    queryFn: () => api.get<ApiResponse<FlowAnalytics>>(`/api/v1/flows/${id}/analytics`),
    enabled: !!id,
    refetchInterval: 10000,
  });
}

export function useActivateFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<ApiResponse<void>>(`/api/v1/flows/${id}/activate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flows'] }),
  });
}

export function useDeactivateFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<ApiResponse<void>>(`/api/v1/flows/${id}/deactivate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flows'] }),
  });
}

export function useDeleteFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<ApiResponse<void>>(`/api/v1/flows/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flows'] }),
  });
}

// Settings
export function useBusinessProfile() {
  return useQuery({
    queryKey: ['settings', 'business-profile'],
    queryFn: () => api.get<ApiResponse<BusinessProfile>>('/api/v1/settings/business-profile'),
  });
}

export function useUpdateBusinessProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      business_name?: string; business_email?: string;
      business_phone?: string; business_address?: string;
    }) => api.put<ApiResponse<BusinessProfile>>('/api/v1/settings/business-profile', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'business-profile'] }),
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: ['settings', 'notifications'],
    queryFn: () => api.get<ApiResponse<NotificationSettings>>('/api/v1/settings/notifications'),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: () => api.post<ApiResponse<void>>('/api/v1/auth/change-password'),
  });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { notification_email?: boolean; notification_sms?: boolean }) =>
      api.put<ApiResponse<NotificationSettings>>('/api/v1/settings/notifications', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'notifications'] }),
  });
}

// Webhooks (developer/client webhooks, not the Meta inbound webhook)
export interface ClientWebhook {
  id: string;
  tenantId: string;
  url: string;
  secret?: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  webhookUrl?: string;
  eventType: string;
  payload: unknown;
  responseStatus: number | null;
  responseBody: string | null;
  attemptedAt: string;
  attemptCount: number;
}

export function useWebhooks() {
  return useQuery({
    queryKey: ['webhooks'],
    queryFn: () => api.get<ApiResponse<ClientWebhook[]>>('/api/v1/webhooks'),
  });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { url: string; events: string[] }) =>
      api.post<ApiResponse<ClientWebhook>>('/api/v1/webhooks', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<ApiResponse<void>>(`/api/v1/webhooks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  });
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: (id: string) => api.post<ApiResponse<void>>(`/api/v1/webhooks/${id}/test`),
  });
}

export function useWebhookLogs(params?: { page?: string; limit?: string }) {
  return useQuery({
    queryKey: ['webhooks', 'logs', params],
    queryFn: () => api.get<PaginatedResponse<WebhookLog>>('/api/v1/webhooks/logs', params as Record<string, string>),
  });
}

export interface MetaEventLog {
  id: string;
  tenantId: string;
  eventType: string;
  wabaId: string | null;
  phoneNumberId: string | null;
  entityId: string | null;
  summary: string | null;
  payload: unknown;
  status: 'processed' | 'error' | 'ignored';
  errorMessage: string | null;
  receivedAt: string;
}

export function useMetaEventLogs(params?: { eventType?: string; status?: string; page?: string; limit?: string }) {
  return useQuery({
    queryKey: ['webhooks', 'meta-events', params],
    queryFn: () => api.get<PaginatedResponse<MetaEventLog>>('/api/v1/webhooks/meta-events', params as Record<string, string>),
    refetchInterval: 15000,
  });
}

// Team
export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team', 'members'],
    queryFn: () => api.get<ApiResponse<TeamMember[]>>('/api/v1/team/members'),
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; name: string; role: 'admin' | 'agent' | 'viewer' }) =>
      api.post<ApiResponse<TeamMember>>('/api/v1/team/invite', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team', 'members'] }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<ApiResponse<void>>(`/api/v1/team/members/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team', 'members'] }),
  });
}

// API Keys
export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export function useApiKeys() {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.get<ApiResponse<ApiKey[]>>('/api/v1/api-keys'),
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; scopes?: string[]; expires_at?: string }) =>
      api.post<ApiResponse<ApiKey & { key: string }>>('/api/v1/api-keys', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}

export function useDeleteApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<ApiResponse<void>>(`/api/v1/api-keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}

// Billing
export interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  messageLimit: number;
  contactLimit: number;
  agentLimit: number;
  features: Record<string, unknown>;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  balanceAfter: number;
  createdAt: string;
}

export function useBillingPlan() {
  return useQuery({
    queryKey: ['billing', 'plan'],
    queryFn: () => api.get<ApiResponse<{ current: (Subscription & { plans: Plan }) | null; plans: Plan[] }>>('/api/v1/billing/plan'),
  });
}

export function useBillingUsage() {
  return useQuery({
    queryKey: ['billing', 'usage'],
    queryFn: () => api.get<ApiResponse<{ messages: number; contacts: number; agents: number }>>('/api/v1/billing/usage'),
  });
}

export function useWallet() {
  return useQuery({
    queryKey: ['billing', 'wallet'],
    queryFn: () => api.get<ApiResponse<{ balance: number; transactions: WalletTransaction[] }>>('/api/v1/billing/wallet'),
  });
}

export function useRazorpayConfig() {
  return useQuery({
    queryKey: ['billing', 'razorpay-config'],
    queryFn: () => api.get<ApiResponse<{ keyId: string; inrToCredits: number }>>('/api/v1/billing/razorpay-config'),
    retry: false,
  });
}

export function useCreateTopUpOrder() {
  return useMutation({
    mutationFn: (amount: number) =>
      api.post<ApiResponse<{ orderId: string; amount: number; currency: string }>>('/api/v1/billing/topup/create-order', { amount }),
  });
}

// Contact Segments
export interface ContactSegment {
  id: string;
  tenantId: string;
  name: string;
  filters: unknown[];
  contactCount: number;
  createdAt: string;
}

export function useSegments() {
  return useQuery({
    queryKey: ['segments'],
    queryFn: () => api.get<ApiResponse<ContactSegment[]>>('/api/v1/segments'),
  });
}

export function useCreateSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; filters: unknown[] }) =>
      api.post<ApiResponse<ContactSegment>>('/api/v1/segments', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['segments'] }),
  });
}

export function useDeleteSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<ApiResponse<void>>(`/api/v1/segments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['segments'] }),
  });
}

// Media Library
export interface MediaFile {
  id: string;
  originalName: string;
  fileType: string;
  mimeType: string;
  sizeBytes: number;
  publicUrl: string | null;
  whatsappMediaId: string | null;
  createdAt: string;
}

export function useMediaFiles(params?: { page?: string; limit?: string }) {
  return useQuery({
    queryKey: ['media', params],
    queryFn: () => api.get<ApiResponse<MediaFile[]>>('/api/v1/media', params as Record<string, string>),
  });
}

export function useUploadMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { file: string; file_type: string; file_name: string }) =>
      api.post<ApiResponse<MediaFile>>('/api/v1/media/upload', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<ApiResponse<void>>(`/api/v1/media/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  });
}
