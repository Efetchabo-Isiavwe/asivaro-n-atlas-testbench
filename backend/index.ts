import { router, json } from '@appdeploy/sdk';

type RunInput = {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  language?: string;
  prompt?: string;
};

function safeGatewayUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return null;
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      host === 'metadata.google.internal' ||
      host === '::1' ||
      host === '::' ||
      host.startsWith('fc') ||
      host.startsWith('fd') ||
      host.startsWith('fe80:')
    )
      return null;
    const octets = host.split('.');
    if (octets.length === 4 && octets.every(part => /^\d+$/.test(part))) {
      const values = octets.map(Number);
      const a = values[0];
      const b = values[1];
      if (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        a >= 224
      )
        return null;
    }
    return url;
  } catch {
    return null;
  }
}

function chatEndpoint(base: URL): string {
  const value = base.toString().replace(/\/+$/, '');
  return value.endsWith('/v1')
    ? value + '/chat/completions'
    : value + '/v1/chat/completions';
}

export const handler = router({
  'POST /api/natlas/run': [
    async ({ body }) => {
      const input = (body ?? {}) as RunInput;
      const baseUrl = (input.baseUrl ?? '').trim();
      const apiKey = (input.apiKey ?? '').trim();
      const prompt = (input.prompt ?? '').trim();
      const model =
        (input.model ?? 'NCAIR1/N-ATLaS').trim() || 'NCAIR1/N-ATLaS';
      const language = (input.language ?? 'en').trim().toLowerCase();

      if (!baseUrl || !apiKey || !prompt)
        return json(
          {
            error: 'missing_fields',
            message: 'Gateway URL, API key and prompt are required.',
          },
          400
        );
      if (apiKey.length > 4096 || prompt.length > 12000 || model.length > 200)
        return json(
          {
            error: 'input_too_large',
            message:
              'The API key, model name or prompt exceeds the allowed input length.',
          },
          400
        );
      const base = safeGatewayUrl(baseUrl);
      if (!base)
        return json(
          {
            error: 'invalid_gateway_url',
            message:
              'Use a public HTTPS gateway URL without credentials, query strings or local/private hostnames.',
          },
          400
        );
      if (!['yo', 'ha', 'ig', 'en'].includes(language))
        return json(
          {
            error: 'unsupported_language',
            message:
              'Choose Yoruba (yo), Hausa (ha), Igbo (ig) or Nigerian-accented English (en).',
          },
          400
        );

      const started = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);
      try {
        const upstream = await fetch(chatEndpoint(base), {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content:
                  'You are N-ATLaS. Answer in the language requested by the user. Be helpful and concise. If you do not know something, state uncertainty clearly.',
              },
              { role: 'user', content: prompt },
            ],
            language,
            temperature: 0.2,
            max_tokens: 512,
            stream: false,
          }),
          signal: controller.signal,
        });
        if (upstream.status === 401 || upstream.status === 403)
          return json(
            {
              error: 'auth_failed',
              message:
                'N-ATLAS rejected the supplied credentials. Check the API key and endpoint.',
            },
            401
          );
        if (upstream.status === 404)
          return json(
            {
              error: 'endpoint_not_found',
              message:
                'The gateway returned 404. Check the base URL and confirm it supports the /v1/chat/completions route.',
            },
            502
          );
        if (!upstream.ok)
          return json(
            {
              error: 'upstream_error',
              message:
                'The configured gateway returned HTTP ' +
                upstream.status +
                '. Check gateway access and request compatibility.',
            },
            502
          );

        let data: {
          model?: string;
          choices?: { message?: { content?: string | { text?: string }[] } }[];
          usage?: unknown;
        };
        try {
          data = (await upstream.json()) as typeof data;
        } catch {
          return json(
            {
              error: 'invalid_response',
              message: 'The gateway response was not valid JSON.',
            },
            502
          );
        }
        const content = data.choices?.[0]?.message?.content;
        const output =
          typeof content === 'string'
            ? content
            : Array.isArray(content)
              ? content.map(part => part.text ?? '').join('\n')
              : '';
        if (!output.trim())
          return json(
            {
              error: 'empty_response',
              message:
                'No text answer was found. Confirm the gateway uses the OpenAI-compatible chat-completions format.',
            },
            502
          );
        return json({
          ok: true,
          output,
          model: data.model || model,
          latencyMs: Date.now() - started,
          createdAt: new Date().toISOString(),
          usage: data.usage ?? null,
        });
      } catch (caught) {
        const timedOut =
          caught instanceof Error && caught.name === 'AbortError';
        return json(
          {
            error: timedOut ? 'timeout' : 'network_error',
            message: timedOut
              ? 'The gateway took more than 45 seconds to respond. Try again or check service status.'
              : 'Could not reach the gateway over HTTPS. Check the URL, network access and provider status.',
          },
          timedOut ? 504 : 502
        );
      } finally {
        clearTimeout(timeout);
      }
    },
  ],
});
