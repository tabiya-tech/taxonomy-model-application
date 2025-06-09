export class InvalidModelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidModelError";
  }
}
