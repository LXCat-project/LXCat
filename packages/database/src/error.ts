export const ArangoError = (message: string): Error => ({
  name: "ArangoError",
  message,
});
