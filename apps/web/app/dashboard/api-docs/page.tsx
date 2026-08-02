'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown, Play, Key, ExternalLink, Copy, Check } from 'lucide-react';
import { API_RESOURCES, type ApiEndpoint, type ApiParam } from './spec';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const methodColors: Record<string, string> = {
  GET: 'bg-primary/10 text-primary',
  POST: 'bg-success/10 text-success',
  PUT: 'bg-gradient-peach/20 text-body-strong',
  DELETE: 'bg-error/10 text-error',
};

function buildCurlExample(endpoint: ApiEndpoint, apiKey: string): string {
  const pathParams = endpoint.params.filter((p) => p.location === 'path');
  const bodyParams = endpoint.params.filter((p) => p.location === 'body');
  const queryParams = endpoint.params.filter((p) => p.location === 'query' && p.required);

  let path = endpoint.path;
  pathParams.forEach((p) => {
    path = path.replace(`:${p.name}`, p.example || `<${p.name}>`);
  });

  const query = queryParams.length > 0
    ? '?' + queryParams.map((p) => `${p.name}=${encodeURIComponent(p.example || '')}`).join('&')
    : '';

  const key = apiKey || 'YOUR_API_KEY';
  let curl = `curl -X ${endpoint.method} "${API_BASE}/api/v1${path}${query}" \\\n  -H "x-api-key: ${key}"`;

  if (bodyParams.length > 0) {
    const bodyObj: Record<string, unknown> = {};
    bodyParams.forEach((p) => {
      let value: unknown = p.example ?? '';
      if (p.type === 'array') {
        try { value = JSON.parse(p.example || '[]'); } catch { value = []; }
      } else if (p.type === 'boolean') {
        value = p.example === 'true';
      }
      bodyObj[p.name] = value;
    });
    curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(bodyObj, null, 2)}'`;
  }

  return curl;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="p-xs hover:bg-hairline-soft rounded-md transition"
      title="Copy"
    >
      {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted" />}
    </button>
  );
}

function TryItPanel({ endpoint, apiKey }: { endpoint: ApiEndpoint; apiKey: string }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<{ status: number; body: string } | null>(null);
  const [error, setError] = useState('');

  const setValue = (name: string, value: string) => setValues((prev) => ({ ...prev, [name]: value }));

  const handleSend = async () => {
    if (!apiKey.trim()) {
      setError('Paste your API key above first');
      return;
    }
    setError('');
    setSending(true);
    setResponse(null);

    try {
      let path = endpoint.path;
      endpoint.params.filter((p) => p.location === 'path').forEach((p) => {
        path = path.replace(`:${p.name}`, encodeURIComponent(values[p.name] || ''));
      });

      const queryParams = endpoint.params.filter((p) => p.location === 'query' && values[p.name]);
      if (queryParams.length > 0) {
        const qs = new URLSearchParams();
        queryParams.forEach((p) => qs.set(p.name, values[p.name]));
        path += `?${qs.toString()}`;
      }

      const bodyParams = endpoint.params.filter((p) => p.location === 'body');
      let body: string | undefined;
      if (bodyParams.length > 0) {
        const bodyObj: Record<string, unknown> = {};
        bodyParams.forEach((p) => {
          const raw = values[p.name];
          if (raw === undefined || raw === '') return;
          if (p.type === 'array') {
            try { bodyObj[p.name] = JSON.parse(raw); } catch { bodyObj[p.name] = raw; }
          } else if (p.type === 'boolean') {
            bodyObj[p.name] = raw === 'true';
          } else {
            bodyObj[p.name] = raw;
          }
        });
        body = JSON.stringify(bodyObj);
      }

      // Deliberately not using the shared `api` client here: it treats any
      // 401 as a signed-out dashboard session and force-redirects to
      // /auth/login, which would be wrong for a bad/expired *pasted* API
      // key entered in this panel rather than the user's own session.
      const res = await fetch(`${API_BASE}/api/v1${path}`, {
        method: endpoint.method,
        headers: {
          'x-api-key': apiKey.trim(),
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body,
      });

      const text = await res.text();
      let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch { /* not json, leave as-is */ }

      setResponse({ status: res.status, body: pretty });
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-hairline pt-md mt-md">
      <h4 className="font-body text-caption-uppercase text-muted mb-sm">Try it</h4>

      {endpoint.params.length > 0 && (
        <div className="space-y-sm mb-md">
          {endpoint.params.map((p) => (
            <ParamInput key={p.name} param={p} value={values[p.name] || ''} onChange={(v) => setValue(p.name, v)} />
          ))}
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={sending}
        className="bg-primary text-on-primary font-body text-button h-9 px-md rounded-pill flex items-center space-x-xs hover:bg-primary-active transition disabled:opacity-50"
      >
        <Play className="w-3.5 h-3.5" />
        <span>{sending ? 'Sending...' : 'Send Request'}</span>
      </button>

      {error && <p className="font-body text-body-sm text-error mt-sm">{error}</p>}

      {response && (
        <div className="mt-md">
          <div className="flex items-center space-x-sm mb-xs">
            <span className={`text-caption-uppercase px-sm py-xxs rounded-pill font-medium ${response.status < 300 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
              {response.status}
            </span>
          </div>
          <pre className="bg-canvas-soft border border-hairline rounded-md p-md font-body text-body-sm text-ink overflow-x-auto max-h-64">
            {response.body}
          </pre>
        </div>
      )}
    </div>
  );
}

function ParamInput({ param, value, onChange }: { param: ApiParam; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="font-body text-caption text-muted mb-xxs flex items-center gap-xs">
        <code className="text-ink">{param.name}</code>
        <span className="text-muted-soft">({param.location})</span>
        {param.required && <span className="text-error">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={param.example || param.description}
        className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-sm text-ink px-sm py-xs h-9 focus:outline-none focus:border-2 focus:border-primary transition"
      />
      <p className="font-body text-caption text-muted-soft mt-xxs">{param.description}</p>
    </div>
  );
}

function EndpointRow({ endpoint, apiKey }: { endpoint: ApiEndpoint; apiKey: string }) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<'try' | 'curl'>('try');

  return (
    <div className="border border-hairline rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-md py-sm hover:bg-hairline-soft transition text-left"
      >
        <div className="flex items-center space-x-sm min-w-0">
          <span className={`text-caption-uppercase px-sm py-xxs rounded-md font-medium flex-shrink-0 ${methodColors[endpoint.method]}`}>
            {endpoint.method}
          </span>
          <code className="font-body text-body-sm text-ink truncate">/api/v1{endpoint.path}</code>
        </div>
        <div className="flex items-center space-x-sm flex-shrink-0">
          <span className="font-body text-body-sm text-muted hidden md:inline">{endpoint.summary}</span>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronRight className="w-4 h-4 text-muted" />}
        </div>
      </button>

      {expanded && (
        <div className="px-md py-md border-t border-hairline">
          <p className="font-body text-body-md text-body mb-md">{endpoint.description}</p>
          {endpoint.requiredScope && (
            <p className="font-body text-caption text-muted mb-md">
              Requires scope: <code className="bg-hairline-soft px-xs py-xxs rounded">{endpoint.requiredScope}</code>
            </p>
          )}

          <div className="flex space-x-xs mb-md">
            <button
              onClick={() => setTab('try')}
              className={`px-sm py-xxs rounded-md font-body text-caption transition ${tab === 'try' ? 'bg-primary text-on-primary' : 'bg-hairline-soft text-muted hover:text-ink'}`}
            >
              Try it
            </button>
            <button
              onClick={() => setTab('curl')}
              className={`px-sm py-xxs rounded-md font-body text-caption transition ${tab === 'curl' ? 'bg-primary text-on-primary' : 'bg-hairline-soft text-muted hover:text-ink'}`}
            >
              cURL
            </button>
          </div>

          {tab === 'try' ? (
            <TryItPanel endpoint={endpoint} apiKey={apiKey} />
          ) : (
            <div className="relative">
              <pre className="bg-canvas-soft border border-hairline rounded-md p-md font-body text-body-sm text-ink overflow-x-auto whitespace-pre-wrap">
                {buildCurlExample(endpoint, apiKey)}
              </pre>
              <div className="absolute top-xs right-xs">
                <CopyButton text={buildCurlExample(endpoint, apiKey)} />
              </div>
            </div>
          )}

          <div className="mt-md">
            <h4 className="font-body text-caption-uppercase text-muted mb-xs">Example response</h4>
            <pre className="bg-canvas-soft border border-hairline rounded-md p-md font-body text-body-sm text-ink overflow-x-auto">
              {endpoint.exampleResponse}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApiDocsPage() {
  const [apiKey, setApiKey] = useState('');
  const [activeResource, setActiveResource] = useState(API_RESOURCES[0].id);

  const resource = API_RESOURCES.find((r) => r.id === activeResource) || API_RESOURCES[0];

  return (
    <div className="p-section min-h-screen bg-canvas">
      <div className="max-w-content mx-auto">
        <div className="mb-lg">
          <h1 className="font-display text-display-md text-ink">API Reference</h1>
          <p className="font-body text-body-md text-muted mt-xs">
            Integrate with your WhatsApp data programmatically. All requests use your API key in an <code className="bg-hairline-soft px-xs py-xxs rounded">x-api-key</code> header.
          </p>
        </div>

        <div className="bg-surface-card border border-hairline rounded-xl p-lg mb-lg">
          <div className="flex items-center space-x-sm mb-sm">
            <Key className="w-4 h-4 text-muted" />
            <h2 className="font-body text-title-sm text-ink">Your API Key</h2>
          </div>
          <p className="font-body text-body-sm text-muted mb-sm">
            Paste an API key here to test requests live from this page. Keys are never sent anywhere except directly
            to the API, and are not saved when you leave this page.
          </p>
          <div className="flex items-center space-x-sm">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="wa_xxxxxxxx_..."
              className="flex-1 bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
            />
            <Link
              href="/dashboard/api-keys"
              className="flex items-center space-x-xs px-md py-sm border border-hairline-strong rounded-md font-body text-body-sm text-ink hover:bg-hairline-soft transition whitespace-nowrap"
            >
              <span>Manage Keys</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="flex gap-lg">
          <nav className="w-48 flex-shrink-0">
            <div className="space-y-xxs sticky top-lg">
              {API_RESOURCES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setActiveResource(r.id)}
                  className={`w-full text-left px-md py-sm rounded-lg font-body text-body-sm transition ${
                    activeResource === r.id ? 'bg-surface-strong text-ink' : 'text-muted hover:text-ink hover:bg-hairline-soft'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </nav>

          <div className="flex-1 min-w-0">
            <div className="mb-md">
              <h2 className="font-display text-display-sm text-ink">{resource.name}</h2>
              <p className="font-body text-body-md text-muted mt-xxs">{resource.description}</p>
            </div>
            <div className="space-y-sm">
              {resource.endpoints.map((endpoint) => (
                <EndpointRow key={endpoint.id} endpoint={endpoint} apiKey={apiKey} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
