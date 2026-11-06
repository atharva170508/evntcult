/**
 * EventLive — one Durable Object per event that holds the live gate count and pushes
 * it to everyone watching (gate scanners and the organizer's dashboard ring).
 *
 *   POST /bump        { checkedIn, registered, at }  ← sent after every admitted scan
 *   GET  (WebSocket)  ← watchers connect; they get the current count, then every change
 *
 * D1 stays the source of truth: every bump carries counts read from D1, and a bump
 * older than the one already stored is ignored (two gates can finish out of order).
 * Uses hibernatable WebSockets, so an idle event costs nothing while people stay connected.
 *
 * Only worker.ts imports this file (it must be exported from the Worker entry).
 */
import { DurableObject } from "cloudflare:workers";

export interface GateCounts {
  checkedIn: number;
  registered: number;
  /** ms timestamp of when these counts were read from D1 */
  at: number;
}

export class EventLive extends DurableObject<CloudflareEnv> {
  private async store(next: GateCounts): Promise<GateCounts> {
    const current = await this.ctx.storage.get<GateCounts>("counts");
    if (current && current.at > next.at) return current;
    await this.ctx.storage.put("counts", next);
    return next;
  }

  private broadcast(counts: GateCounts) {
    const msg = JSON.stringify({ type: "counts", ...counts });
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(msg);
      } catch {
        // socket already closing
      }
    }
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/bump") {
      const counts = await this.store((await req.json()) as GateCounts);
      this.broadcast(counts);
      return Response.json({ ok: true, watchers: this.ctx.getWebSockets().length });
    }

    if (req.headers.get("Upgrade") === "websocket") {
      // worker.ts has already checked the viewer may watch this event, and passes fresh D1 counts.
      const fresh = req.headers.get("x-gate-counts");
      const counts = fresh ? await this.store(JSON.parse(fresh) as GateCounts) : await this.ctx.storage.get<GateCounts>("counts");
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1]);
      if (counts) pair[1].send(JSON.stringify({ type: "counts", ...counts }));
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    return new Response("Not found", { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (message === "ping") ws.send("pong"); // keep-alive from the browser
  }

  async webSocketClose(ws: WebSocket, code: number) {
    try {
      ws.close(code === 1005 ? 1000 : code);
    } catch {
      // already closed
    }
  }
}
