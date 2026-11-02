export class HttpError extends Error {
  status: number;
  code: string;

  constructor(code: string, message: string, status: number = 400) {
    super(message);
    this.name = "HttpError";
    this.code = code;
    this.status = status;
  }
}

export class Unauthorized extends HttpError {
  constructor(message: string = "Unauthorized") {
    super("UNAUTHORIZED", message, 401);
    this.name = "Unauthorized";
  }
}

export class Forbidden extends HttpError {
  constructor(message: string = "Forbidden") {
    super("FORBIDDEN", message, 403);
    this.name = "Forbidden";
  }
}

export class NotFound extends HttpError {
  constructor(message: string = "Not found") {
    super("NOT_FOUND", message, 404);
    this.name = "NotFound";
  }
}

export class ValidationError extends HttpError {
  constructor(message: string = "Validation error") {
    super("VALIDATION_ERROR", message, 400);
    this.name = "ValidationError";
  }
}

export class SlotUnavailable extends HttpError {
  constructor(message: string = "Time slot is not available") {
    super("SLOT_UNAVAILABLE", message, 409);
    this.name = "SlotUnavailable";
  }
}

export class BookingNotFound extends NotFound {
  constructor(bookingId?: string) {
    super(bookingId ? `Booking ${bookingId} not found` : "Booking not found");
    this.name = "BookingNotFound";
    this.code = "BOOKING_NOT_FOUND";
  }
}

export class BookingAlreadyCancelled extends HttpError {
  constructor(message: string = "Booking already cancelled") {
    super("BOOKING_ALREADY_CANCELLED", message, 409);
    this.name = "BookingAlreadyCancelled";
  }
}

export class ChatAccessDenied extends Forbidden {
  constructor(message: string = "Access to this chat is denied") {
    super(message);
    this.name = "ChatAccessDenied";
    this.code = "CHAT_ACCESS_DENIED";
  }
}
