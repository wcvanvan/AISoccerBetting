/**
 * Configure Node's fetch (undici) to use a proxy before calling Anthropic API.
 * Set PROXY or HTTP_PROXY in .env (e.g. http://127.0.0.1:7890).
 */

import { setGlobalDispatcher, ProxyAgent } from 'undici';

let configured = false;

export function configureAnthropicProxy(): void {
  if (configured) return;
  configured = true;
  const url = process.env.PROXY || process.env.HTTP_PROXY;
  if (url) {
    setGlobalDispatcher(new ProxyAgent(url));
  }
}
