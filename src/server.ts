import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";

type ServerEntry = {
  fetch: (request: Request, env: any, ctx: any) => Promise<Response> | Response;
};

type HttpErrorLike = {
  statusCode?: number;
  status?: number;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

function renderStatusPage(status: number, title: string, description: string): Response {
  const body = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${title}</h1>
      <p>${description}</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;

  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

type MaybeResponse = Response | { status?: number };

function brandedErrorResponse(status = 500): Response {
  if (status === 404) {
    return renderStatusPage(
      404,
      "Page not found",
      "The page you're looking for doesn't exist or may have moved.",
    );
  }

  if (status >= 400 && status < 500) {
    return renderStatusPage(
      status,
      "This page couldn't be loaded",
      "The request could not be completed for this page.",
    );
  }

  return renderStatusPage(
    500,
    "This page didn't load",
    "Something went wrong on our end. You can try refreshing or head back home.",
  );
}

function httpErrorStatus(error: unknown): number | null {
  if (error instanceof Response) {
    return error.status;
  }

  if (error != null && typeof error === "object") {
    const maybe = error as HttpErrorLike & MaybeResponse;
    if (typeof maybe.statusCode === "number") return maybe.statusCode;
    if (typeof maybe.status === "number") return maybe.status;
  }

  return null;
}

function normalizeStatusCode(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value >= 100 && value <= 599) return value;
  return null;
}

function extractPayloadStatus(body: string): number | null {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return null;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return null;
  }

  const maybe = payload as Record<string, unknown>;
  return normalizeStatusCode(maybe.status ?? maybe.statusCode);
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  const recoveredStatus = extractPayloadStatus(body) ?? response.status;
  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse(recoveredStatus);
}

function maybeRewriteHtmlNavigationForBrowsers(request: Request, response: Response): Response {
  const accept = request.headers.get("accept") ?? "";
  const contentType = response.headers.get("content-type") ?? "";

  if (response.status < 400 || !contentType.includes("text/html") || !accept.includes("text/html")) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set("x-original-status", String(response.status));
  headers.set("content-type", "text/html; charset=utf-8");

  return new Response(response.body, {
    status: 200,
    headers,
  });
}

export default {
  async fetch(request: Request, env: any, ctx: any) {
    try {
      const handler = await getServerEntry();
      let response = await handler.fetch(request, env, ctx);
      response = await normalizeCatastrophicSsrResponse(response);
      return maybeRewriteHtmlNavigationForBrowsers(request, response);
    } catch (error) {
      const status = httpErrorStatus(error);
      if (typeof status === "number" && status >= 400 && status < 600) {
        const branded = brandedErrorResponse(status);
        return maybeRewriteHtmlNavigationForBrowsers(request, branded);
      }

      console.error(error);
      return maybeRewriteHtmlNavigationForBrowsers(request, brandedErrorResponse());
    }
  },
};
