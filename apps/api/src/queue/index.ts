console.log('Queue system: using in-memory mode (no Redis)');

interface MessageJob {
  messageId: string;
  type: string;
  to: string;
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
  content?: string;
  templateName?: string;
  languageCode?: string;
  components?: any[];
}

interface CampaignJob {
  campaignId: string;
}

interface WebhookJob {
  webhookId: string;
  eventType: string;
  payload: any;
}

interface FlowJob {
  contactId: string;
  flowId: string;
  message: string;
}

export async function connectQueues() {
  console.log('Queue system initialized (no-op mode)');
}

export async function addToMessageQueue(data: MessageJob) {
  console.log(`[Queue] Would process message: ${data.messageId}`);
}

export async function addCampaignJob(data: CampaignJob) {
  console.log(`[Queue] Would process campaign: ${data.campaignId}`);
}

export async function addWebhookJob(data: WebhookJob) {
  console.log(`[Queue] Would process webhook: ${data.webhookId}`);
}

export async function addFlowJob(data: FlowJob) {
  console.log(`[Queue] Would process flow: ${data.flowId}`);
}

export const messageWorker = {
  on: () => {},
  close: async () => {}
};

export const campaignWorker = {
  on: () => {},
  close: async () => {}
};

export const webhookWorker = {
  on: () => {},
  close: async () => {}
};

export const flowWorker = {
  on: () => {},
  close: async () => {}
};