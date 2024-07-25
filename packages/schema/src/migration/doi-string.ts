import { string } from "zod";

export const DOIString = string().regex(/^10.\d{4,9}\/[-._;()/:a-zA-Z0-9]+$/);
