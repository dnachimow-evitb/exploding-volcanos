// Exploding Volcanoes relay.
// A room is named by a four-letter code. The first device in is the host; one more may join. Every message one of
// them sends is passed to the other, unread and unstored. Nothing is logged. When a device arrives or leaves, both are
// told how many are in the room with a small note of the relay's own: {"_":"room","n":2}.
// A refusal sends {"_":"no","code":4004,"why":"no such room"} and closes with that code: 4004 no such room,
// 4003 room full, 4009 code already in use.
import { DurableObject } from "cloudflare:workers";

// only the game may connect: the website, the iPhone app (Capacitor), and a local test page
const ALLOWED = [/^https:\/\/dnachimow-evitb\.github\.io$/, /^capacitor:\/\/localhost$/, /^https?:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/];
const MAX_MESSAGE = 4096; // characters; a game message is a few hundred

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/match") { // Quick Match: wait here until someone wants the other side
      if (request.headers.get("Upgrade") !== "websocket") return new Response("Expected a WebSocket", { status: 426 });
      if (!ALLOWED.some((r) => r.test(request.headers.get("Origin") || ""))) return new Response("Forbidden", { status: 403 });
      return env.LOBBY.get(env.LOBBY.idFromName("lobby")).fetch(request);
    }
    const m = url.pathname.match(/^\/room\/([A-Z]{4})$/);
    if (!m) return new Response(url.pathname === "/" ? "Exploding Volcanoes relay" : "Not found", { status: url.pathname === "/" ? 200 : 404 });
    if (request.headers.get("Upgrade") !== "websocket") return new Response("Expected a WebSocket", { status: 426 });
    if (!ALLOWED.some((r) => r.test(request.headers.get("Origin") || ""))) return new Response("Forbidden", { status: 403 });
    return env.ROOMS.get(env.ROOMS.idFromName(m[1])).fetch(request);
  },
};

export class Room extends DurableObject {
  // the devices properly in the room (a socket being refused has no attachment and does not count)
  members(except) {
    return this.ctx.getWebSockets().filter((s) => s !== except && s.deserializeAttachment());
  }
  tell(except) {
    const list = this.members(except), note = JSON.stringify({ _: "room", n: list.length });
    for (const s of list) { try { s.send(note); } catch (e) {} }
  }
  async fetch(request) {
    const role = new URL(request.url).searchParams.get("role") === "host" ? "host" : "join";
    const here = this.members(), hasHost = here.some((s) => s.deserializeAttachment().role === "host");
    const refuse = role === "host" ? (here.length ? [4009, "code in use"] : null) : !hasHost ? [4004, "no such room"] : here.length >= 2 ? [4003, "room full"] : null;
    const pair = new WebSocketPair(), client = pair[0], server = pair[1];
    if (refuse) { // say why in a note as well as in the close code: not every browser reports the code
      server.accept();
      server.send(JSON.stringify({ _: "no", code: refuse[0], why: refuse[1] }));
      server.close(refuse[0], refuse[1]);
    } else { this.ctx.acceptWebSocket(server); server.serializeAttachment({ role }); this.tell(); }
    return new Response(null, { status: 101, webSocket: client });
  }
  webSocketMessage(ws, message) {
    if (typeof message !== "string" || message.length > MAX_MESSAGE || !ws.deserializeAttachment()) return;
    for (const s of this.members(ws)) { try { s.send(message); } catch (e) {} }
  }
  webSocketClose(ws, code, reason) {
    const was = ws.deserializeAttachment();
    try { ws.close(code === 1005 || code === 1006 ? 1000 : code, reason); } catch (e) {}
    if (was) this.tell(ws);
  }
  webSocketError(ws) {
    if (ws.deserializeAttachment()) this.tell(ws);
  }
}

// QUICK MATCH. A device says which side it wants (max or noah) and waits. As soon as one of each is waiting, both are
// given the same fresh room code, {"_":"match","code":"BKTR","role":"host"|"join"}, and move to that room. Longest
// waiting goes first. Nothing about either device is kept or passed on: no names, no addresses.
// Codes use consonants only, so a random code can never spell a word.
const CODE_LETTERS = "BCDFGHJKLMNPQRSTVWXZ";
function newCode() {
  const r = crypto.getRandomValues(new Uint8Array(4));
  return [...r].map((v) => CODE_LETTERS[v % CODE_LETTERS.length]).join("");
}
export class Lobby extends DurableObject {
  async fetch(request) {
    const side = new URL(request.url).searchParams.get("side") === "noah" ? "noah" : "max";
    const want = side === "max" ? "noah" : "max";
    const waiting = this.ctx.getWebSockets().map((s) => ({ s, a: s.deserializeAttachment() })).filter((w) => w.a && w.a.side === want).sort((x, y) => x.a.t - y.a.t);
    const pair = new WebSocketPair(), client = pair[0], server = pair[1];
    if (waiting.length) {
      const other = waiting[0].s, code = newCode();
      other.serializeAttachment(null); // taken: must not be matched twice
      try { other.send(JSON.stringify({ _: "match", code, role: "host" })); } catch (e) {} // it closes its own connection on getting this
      server.accept();
      server.send(JSON.stringify({ _: "match", code, role: "join" }));
      server.close(1000, "matched");
    } else {
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({ side, t: Date.now() });
      server.send(JSON.stringify({ _: "wait" }));
    }
    return new Response(null, { status: 101, webSocket: client });
  }
  webSocketMessage() {} // a waiting device has nothing to say
  webSocketClose(ws, code, reason) { try { ws.close(code === 1005 || code === 1006 ? 1000 : code, reason); } catch (e) {} }
  webSocketError() {}
}
