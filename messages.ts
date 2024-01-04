export type ClientMessage =
  | IGetPositionsRequest
  | IRegisterClientMessage
  | IElementMovementMessage;

export interface IGetPositionsRequest {
  type: MessageType.GetPositions;
}

export enum MessageType {
  GetPositions,
  WebSocketErrorMessage,
  RegisterClient,
  ElementMovement,
}

export interface IElementMovementMessage {
  clientId: string;
  type: MessageType.ElementMovement;
  x: number;
  y: number;
}

export interface IRegisterClientMessage {
  type: MessageType.RegisterClient;
  clientId: string;
}

export interface IWebSocketErrorMessage {
  type: MessageType.WebSocketErrorMessage;
  message: string;
}

export type ServerMessage = IWebSocketErrorMessage;

export interface IClientElementPosition {
  clientId: string;
  x: number;
  y: number;
}

export type ClientId = string;
