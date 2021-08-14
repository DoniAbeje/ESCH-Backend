import { Document } from 'mongoose';

export function toJSON(doc: Document) {
  return JSON.parse(JSON.stringify(doc.toObject()));
}
