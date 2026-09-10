import { NextResponse } from "next/server";

/**
 * A same-origin JSON-RPC forwarder for chain 4663.
 *
 * Ported verbatim from ~/4thstreet/app/src/app/api/rpc/route.ts. It sits under
 * /api/4thstreet/ so it cannot collide with anything the Solana side adds.
 *
 * The browser cannot talk to either node directly. The public endpoint answers
 * with `Access-Control-Allow-Origin: '*,*'`, which is not a legal header value,
 * so every response is rejected before any code sees it; the local forwarder on
 * 8601 sends no CORS headers at all. Neither is this app's bug and neither is
 * fixable from here, but both are avoidable: a request to the app's own origin
 * has no preflight and no CORS to get wrong.
 *
 * This adds nothing and rewrites nothing. It forwards the body, returns the
 * upstream status, and when the node cannot be reached it says so in words the
 * UI can render, because "the node is unreachable" and "the node answered with
 * an empty result" are different facts.
 */

const UPSTREAM = process.env.ROBINHOOD_RPC_URL ?? "http://127.0.0.1:8601";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json(
      { error: "the request body could not be read" },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  } catch (e) {
    // Shaped as a JSON-RPC error so viem surfaces the reason rather than a
    // parse failure three layers down.
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32603,
          message: `4663 node at ${UPSTREAM} did not answer: ${
            e instanceof Error ? e.message : "unknown reason"
          }`,
        },
      },
      { status: 502 },
    );
  }
}
