import fixture from "../../data/theatre/passage.json";
import { schema } from "./schema";
export const scenario = schema.parse(fixture);
