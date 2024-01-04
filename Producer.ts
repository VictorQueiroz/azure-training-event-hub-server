import { EventHubProducerClient } from "@azure/event-hubs";
import config from "./config";
import uws from "uWebSockets.js";
import { ClientMessage, MessageType, ServerMessage } from "./messages";

export default class Producer {
  readonly #producer;
  public constructor() {
    this.#producer = new EventHubProducerClient(
      config.eventHub.connectionString,
    );
    uws
      .App({})
      .ws("/producer", {
        maxLifetime: 0,
        idleTimeout: 0,
        message: (ws, message, isBinary) => {
          this.#onReceiveWebSocketMessage(ws, message, isBinary);
        },
      })
      .listen(config.producer.wsPort, (_socket) => {
        console.log(
          "Listening on port %d for WebSocket connections",
          config.producer.wsPort,
        );
      });
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
      case MessageType.GetPositions:
        result = {
          type: MessageType.WebSocketErrorMessage,
          message: "This message should be sent to the consumer server.",
        };
        break;
      case MessageType.ElementMovement: {
        result = null;
        const batch = await this.#producer.createBatch();
        if (!batch.tryAdd({ body: message })) {
          result = {
            type: MessageType.WebSocketErrorMessage,
            message:
              "Internal failure while trying to add message to the batch.",
          };
        } else {
          await this.#producer.sendBatch(batch);
        }
        break;
      }
    }
    if (result !== null) {
      ws.send(JSON.stringify(result));
    }
  }
}
