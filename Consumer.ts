import { EventHubConsumerClient, Subscription } from "@azure/event-hubs";
import config from "./config";
import uws from "uWebSockets.js";
import express from "express";
import {
  ClientId,
  ClientMessage,
  IClientElementPosition,
  MessageType,
  ServerMessage,
} from "./messages";

export default class Consumer {
  readonly #webSocketServer;
  readonly #positions = new Map<ClientId, IClientElementPosition>();
  readonly #consumer;
  readonly #clients = new Map<ClientId, uws.WebSocket<unknown>>();
  #consumerSubscription: Subscription | null = null;
  public constructor() {
    this.#consumer = new EventHubConsumerClient(
      "$Default",
      config.eventHub.connectionString,
    );
    this.#webSocketServer = uws
      .App({})
      .ws("/consumer", {
        maxLifetime: 0,
        idleTimeout: 0,
        message: (ws, message, isBinary) => {
          this.#onReceiveWebSocketMessage(ws, message, isBinary);
        },
      })
      .listen(config.consumer.wsPort, (_socket) => {
        console.log(
          "Listening on port %d for WebSocket connections",
          config.consumer.wsPort,
        );
      });
    /**
     * Turn on the HTTP server to serve the positions of the elements,
     * for clients that just rendered the app.
     */
    express()
      .get("/positions", (_, res) => {
        res.json(Array.from(this.#positions.values()));
      })
      .listen(config.consumer.httpPort);
  }
  public async configure() {
    /**
     * Create the subscription to listen to consumer subscription events
     */
    this.#consumerSubscription = this.#consumer.subscribe({
      processError: async (err, _context) => {
        console.error(err);
      },
      processEvents: async (events, _context) => {
        console.log(
          "received events: %o",
          events.map((event) => ({
            body: event.body,
          })),
        );
      },
    });
  }
  public async destroy() {
    if (!this.#consumerSubscription) {
      throw new Error("Server not initialized");
    }
    /**
     * Destroy the consumer subscription
     */
    await this.#consumerSubscription.close();
    this.#consumerSubscription = null;

    /**
     * Close websocket server
     */
    this.#webSocketServer.close();
  }
  async #onReceiveWebSocketMessage(
    ws: uws.WebSocket<unknown>,
    buffer: ArrayBuffer,
    _: boolean,
  ) {
    const message: ClientMessage = JSON.parse(
      Buffer.from(buffer).toString("utf-8"),
    );
    let result: ServerMessage | null;
    switch (message.type) {
      case MessageType.RegisterClient:
        if (this.#positions.has(message.clientId)) {
          result = {
            type: MessageType.WebSocketErrorMessage,
            message: "Client already registered",
          };
        } else {
          this.#clients.set(message.clientId, ws);
          this.#positions.set(message.clientId, {
            x: 0,
            y: 0,
            clientId: message.clientId,
          });
          result = null;
        }
        break;
      case MessageType.GetPositions:
        result = {
          type: MessageType.WebSocketErrorMessage,
          message:
            "Invalid message received on WebSocket server of the consumer.",
        };
        break;
      case MessageType.ElementMovement:
        result = {
          type: MessageType.WebSocketErrorMessage,
          message: "This message should be sent to the producer server.",
        };
        break;
    }
    if (result !== null) {
      ws.send(JSON.stringify(result));
    }
  }
}
