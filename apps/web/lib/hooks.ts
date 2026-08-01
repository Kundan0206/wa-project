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
  business_name?: string;
  business_email?: string;
  business_phone?: string;
  business_address?: string;
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

export function useSubscribeWebhooks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, url }: { id: string; url: string }) =>
      api.post<ApiResponse<any>>(`/api/v1/phone-numbers/subscribe-webhooks/${id}`, { url }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['phone-numbers'] });
    },
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
