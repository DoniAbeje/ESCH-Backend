import { Document } from 'mongoose';
/**
Converts Mongoose Document to javascript POJO
*/
export function toJSON(doc: Document) {
  return JSON.parse(JSON.stringify(doc.toObject()));
}
