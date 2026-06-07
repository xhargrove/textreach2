export class ForbiddenError extends Error {
  status = 403;

  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends Error {
  status = 401;

  constructor(message = "You must be signed in to perform this action.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}
