import { createServer } from "node:http";
import { WebSocket } from "ws";
import { createApp } from "../app.js";
import { setupWebSocketServer } from "../websocket/server.js";
import { RoomManager } from "../room/RoomManager.js";
import { disconnectPrisma, prisma } from "../db/client.js";
import { RoomCleanupService } from "../room/cleanupService.js";
import {
  createWSMessage,
  parseClientMessage,
  WS_EVENTS,
  CanvasElement,
} from "@vizi/protocol";

async function runVerification() {
  console.log("🧪 Starting Vizi Backend End-to-End Verification...");

  const app = createApp();
  const server = createServer(app);
  const { wss, heartbeatManager } = setupWebSocketServer(server);
  const roomManager = RoomManager.getInstance();

  const TEST_PORT = 4999;
  await new Promise<void>((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`✅ Test server running on port ${TEST_PORT}`);

  const testRoomId = `test-room-${Date.now()}`;

  try {
    // 1. Verify HTTP Health Check
    console.log("\n--- Testing HTTP Endpoints ---");
    const healthRes = await fetch(`http://localhost:${TEST_PORT}/health`);
    const healthJson = (await healthRes.json()) as { status: string };
    console.log("Health check response:", healthJson);
    if (healthJson.status !== "ok") throw new Error("Health check failed");

    const readyRes = await fetch(`http://localhost:${TEST_PORT}/health/ready`);
    const readyJson = (await readyRes.json()) as { status: string };
    console.log("Health ready response:", readyJson);
    if (readyJson.status !== "ready") throw new Error("Prisma DB readiness check failed");

    // 2. Connect Client 1 (with custom name "Alice Wonder")
    console.log("\n--- Testing WebSocket Connection (Client 1: Alice) ---");
    const ws1 = new WebSocket(`ws://localhost:${TEST_PORT}/ws`);
    await new Promise<void>((resolve) => ws1.on("open", resolve));
    console.log("✅ Client 1 connected");

    const joinMessage1 = createWSMessage(WS_EVENTS.ROOM_JOIN, testRoomId, "client-1", {
      roomId: testRoomId,
      user: {
        name: "Alice Wonder",
        color: "#EF4444",
      },
    });

    const client1Promise = waitForEvent(ws1, WS_EVENTS.ROOM_JOINED);
    ws1.send(JSON.stringify(joinMessage1));
    const join1Event = await client1Promise;
    console.log("Client 1 joined room:", join1Event.payload.self);
    if (join1Event.payload.self.name !== "Alice Wonder") {
      throw new Error(`Expected name Alice Wonder, got ${join1Event.payload.self.name}`);
    }

    // 3. Connect Client 2 (with NO name -> default name auto-generation)
    console.log("\n--- Testing WebSocket Connection (Client 2: Anonymous default name) ---");
    const ws2 = new WebSocket(`ws://localhost:${TEST_PORT}/ws`);
    await new Promise<void>((resolve) => ws2.on("open", resolve));
    console.log("✅ Client 2 connected");

    const joinMessage2 = createWSMessage(WS_EVENTS.ROOM_JOIN, testRoomId, "client-2", {
      roomId: testRoomId,
      user: {
        // No name provided!
      },
    });

    // Client 1 should receive peer_joined, Client 2 should receive room_joined
    const peerJoinedPromise = waitForEvent(ws1, WS_EVENTS.ROOM_PEER_JOINED);
    const client2JoinPromise = waitForEvent(ws2, WS_EVENTS.ROOM_JOINED);

    ws2.send(JSON.stringify(joinMessage2));

    const [peerJoinedEvent, join2Event] = await Promise.all([
      peerJoinedPromise,
      client2JoinPromise,
    ]);

    console.log("Client 2 auto-generated user:", join2Event.payload.self);
    console.log("Client 1 saw Client 2 join:", peerJoinedEvent.payload.peer.name);
    if (!join2Event.payload.self.name || join2Event.payload.self.name.length === 0) {
      throw new Error("Client 2 should have received a default name");
    }

    // 4. Test Multiplayer Moving Cursors
    console.log("\n--- Testing Moving Cursors Presence ---");
    const cursorPromise = waitForEvent(ws2, WS_EVENTS.PRESENCE_CURSOR_BROADCAST);
    const cursorMessage = createWSMessage(WS_EVENTS.PRESENCE_CURSOR, testRoomId, join1Event.payload.self.id, {
      x: 120.5,
      y: 340.2,
      isDrawing: true,
    });
    ws1.send(JSON.stringify(cursorMessage));

    const cursorBroadcast = await cursorPromise;
    console.log("Client 2 received cursor from Client 1:", cursorBroadcast.payload);
    if (cursorBroadcast.payload.x !== 120.5 || cursorBroadcast.payload.y !== 340.2) {
      throw new Error("Cursor coordinates mismatch");
    }

    // 5. Test Real-Time Element Creation
    console.log("\n--- Testing Element Creation ---");
    const elementCreatedPromise = waitForEvent(ws2, WS_EVENTS.ELEMENT_CREATED);
    const testElement: CanvasElement = {
      id: `elem-${Date.now()}`,
      type: "rectangle",
      x: 50,
      y: 80,
      width: 200,
      height: 100,
      stroke: "#000000",
      strokeWidth: 2,
      fill: "#FCD34D",
      opacity: 1,
      version: 1,
      updatedAt: Date.now(),
      createdBy: join1Event.payload.self.id,
      isDeleted: false,
    };

    const createElementMsg = createWSMessage(WS_EVENTS.ELEMENT_CREATE, testRoomId, join1Event.payload.self.id, {
      opId: `op-create-1`,
      elements: [testElement],
    });
    ws1.send(JSON.stringify(createElementMsg));

    const elementCreatedEvent = await elementCreatedPromise;
    console.log("Client 2 received element:created:", elementCreatedEvent.payload.elements[0].id);
    if (elementCreatedEvent.payload.elements[0].id !== testElement.id) {
      throw new Error("Element ID mismatch");
    }

    // 6. Test Real-Time Element Mutation (LWW Update)
    console.log("\n--- Testing Element Mutation with LWW ---");
    const elementUpdatedPromise = waitForEvent(ws1, WS_EVENTS.ELEMENT_UPDATED);
    const updatedElement: CanvasElement = {
      ...testElement,
      x: 150,
      y: 220,
      version: 2,
      updatedAt: Date.now() + 10,
    };

    const updateMsg = createWSMessage(WS_EVENTS.ELEMENT_UPDATE, testRoomId, join2Event.payload.self.id, {
      opId: `op-update-1`,
      elements: [updatedElement],
    });
    ws2.send(JSON.stringify(updateMsg));

    const elementUpdatedEvent = await elementUpdatedPromise;
    console.log("Client 1 received element:updated:", elementUpdatedEvent.payload.elements[0].x);
    if (elementUpdatedEvent.payload.elements[0].x !== 150) {
      throw new Error("Element update coordinate mismatch");
    }

    // 7. Test Peer Left on Disconnect
    console.log("\n--- Testing Peer Disconnect Notice ---");
    const peerLeftPromise = waitForEvent(ws2, WS_EVENTS.ROOM_PEER_LEFT);
    ws1.close();
    const peerLeftEvent = await peerLeftPromise;
    console.log("Client 2 saw peer left:", peerLeftEvent.payload.peerId);
    if (peerLeftEvent.payload.peerId !== join1Event.payload.self.id) {
      throw new Error("Peer left ID mismatch");
    }
    ws2.close();

    // 8. Test Prisma Database Persistence
    console.log("\n--- Testing Prisma Database Persistence ---");
    // Trigger immediate DB flush
    await roomManager.flushAllRooms();

    const dbElements = await prisma.canvasElement.findMany({
      where: { roomId: testRoomId },
    });
    console.log(`Persisted elements in DB for room ${testRoomId}: ${dbElements.length}`);
    if (dbElements.length !== 1) {
      throw new Error(`Expected 1 persisted element in DB, found ${dbElements.length}`);
    }
    if (dbElements[0].x !== 150) {
      throw new Error(`Persisted element x coordinate should be 150, got ${dbElements[0].x}`);
    }
    console.log("✅ DB element verification passed:", dbElements[0]);

    // 9. Test Inngest Integration Endpoint
    console.log("\n--- Testing Inngest API Endpoint ---");
    const inngestRes = await fetch(`http://localhost:${TEST_PORT}/api/inngest`);
    if (inngestRes.status !== 200) {
      throw new Error(`Expected status 200 from Inngest endpoint, got ${inngestRes.status}`);
    }
    const inngestBody = (await inngestRes.json()) as { function_count?: number };
    console.log("Inngest endpoint response function count:", inngestBody.function_count);
    if (!inngestBody.function_count || inngestBody.function_count < 1) {
      throw new Error("Expected at least 1 registered Inngest function");
    }
    console.log("✅ Inngest endpoint serving worker functions successfully");

    // 10. Test Orphaned / Inactive Room Auto-Deletion Worker
    console.log("\n--- Testing Orphaned Rooms Scheduler Worker ---");
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const staleRoom1 = `stale-empty-${Date.now()}`;
    const staleRoom2 = `stale-with-elem-${Date.now()}`;
    const recentRoom = `recent-active-${Date.now()}`;
    const staleWithRecentElem = `stale-with-recent-elem-${Date.now()}`;

    // Seed test rooms directly in DB with specific timestamps
    await prisma.room.createMany({
      data: [
        { id: staleRoom1, name: "Stale Empty Room", createdAt: twoDaysAgo, updatedAt: twoDaysAgo },
        { id: staleRoom2, name: "Stale Room with Elements", createdAt: twoDaysAgo, updatedAt: twoDaysAgo },
        { id: recentRoom, name: "Recent Active Room", createdAt: oneHourAgo, updatedAt: oneHourAgo },
        { id: staleWithRecentElem, name: "Stale Room Recently Modified", createdAt: twoDaysAgo, updatedAt: twoDaysAgo },
      ],
    });

    // Seed canvas elements
    await prisma.canvasElement.createMany({
      data: [
        {
          id: `elem-stale-${Date.now()}`,
          roomId: staleRoom2,
          type: "rectangle",
          x: 10,
          y: 10,
          stroke: "#000",
          strokeWidth: 1,
          fill: "transparent",
          opacity: 1,
          data: "{}",
          createdBy: "test",
          createdAt: twoDaysAgo,
          updatedAt: twoDaysAgo,
        },
        {
          id: `elem-recent-${Date.now()}`,
          roomId: staleWithRecentElem,
          type: "rectangle",
          x: 20,
          y: 20,
          stroke: "#000",
          strokeWidth: 1,
          fill: "transparent",
          opacity: 1,
          data: "{}",
          createdBy: "test",
          createdAt: twoDaysAgo,
          updatedAt: oneHourAgo,
        },
      ],
    });

    // Run cleanup for 24h retention (1 day)
    const cleanupResult = await RoomCleanupService.cleanupInactiveRooms(24 * 60 * 60 * 1000);
    console.log("Cleanup worker result:", cleanupResult);

    // Verify staleRoom1 is deleted
    const r1 = await prisma.room.findUnique({ where: { id: staleRoom1 } });
    if (r1 !== null) throw new Error("Stale empty room should have been deleted");

    // Verify staleRoom2 and its elements are deleted
    const r2 = await prisma.room.findUnique({ where: { id: staleRoom2 } });
    if (r2 !== null) throw new Error("Stale room with old elements should have been deleted");
    const elem2 = await prisma.canvasElement.findMany({ where: { roomId: staleRoom2 } });
    if (elem2.length > 0) throw new Error("Stale room elements should have been deleted");

    // Verify recentRoom is NOT deleted
    const r3 = await prisma.room.findUnique({ where: { id: recentRoom } });
    if (r3 === null) throw new Error("Recent room should NOT have been deleted");

    // Verify staleWithRecentElem is NOT deleted
    const r4 = await prisma.room.findUnique({ where: { id: staleWithRecentElem } });
    if (r4 === null) throw new Error("Room with recent element update should NOT have been deleted");

    // Test in-memory active room protection
    const staleRoomActiveInMem = `stale-active-mem-${Date.now()}`;
    await prisma.room.create({
      data: {
        id: staleRoomActiveInMem,
        name: "Stale Room with Active In-Memory Peer",
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo,
      },
    });
    // Hydrate in memory and attach a connected peer
    const memRoom = await roomManager.getOrCreateRoom(staleRoomActiveInMem);
    // Explicitly reset DB timestamps to simulate a stale room that was loaded into memory
    await prisma.room.update({
      where: { id: staleRoomActiveInMem },
      data: { createdAt: twoDaysAgo, updatedAt: twoDaysAgo },
    });
    memRoom.addPeer(
      { id: "peer-active-1", name: "Active Peer", color: "#000000" },
      { readyState: 1, send: () => {} } as any,
    );

    const cleanupResult2 = await RoomCleanupService.cleanupInactiveRooms(24 * 60 * 60 * 1000);
    console.log("Cleanup worker result (with active in-memory room):", cleanupResult2);
    if (cleanupResult2.skippedActiveRooms < 1) {
      throw new Error("Active in-memory room should have been skipped");
    }
    const r5 = await prisma.room.findUnique({ where: { id: staleRoomActiveInMem } });
    if (r5 === null) throw new Error("Stale room with active in-memory peer must NOT be deleted");

    // Clean up mock peer & room
    memRoom.removePeer("peer-active-1");
    roomManager.deleteRoomInMemory(staleRoomActiveInMem);
    await prisma.room.delete({ where: { id: staleRoomActiveInMem } });

    console.log("✅ Auto-deletion worker correctly purged stale rooms while preserving active rooms");

    // Cleanup remaining test rooms
    await prisma.canvasElement.deleteMany({
      where: { roomId: { in: [recentRoom, staleWithRecentElem, testRoomId] } },
    });
    await prisma.room.deleteMany({
      where: { id: { in: [recentRoom, staleWithRecentElem, testRoomId] } },
    });

    console.log("\n🎉 ALL BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉");
  } finally {
    heartbeatManager.stop();
    await roomManager.shutdown();
    await disconnectPrisma();
    server.close();
  }
}

function waitForEvent(ws: WebSocket, expectedType: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${expectedType}`));
    }, 5000);

    const onMessage = (data: Buffer | string) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.type === expectedType) {
          clearTimeout(timeout);
          ws.off("message", onMessage);
          resolve(parsed);
        }
      } catch (e) {
        // Ignore parse error
      }
    };

    ws.on("message", onMessage);
  });
}

runVerification().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
