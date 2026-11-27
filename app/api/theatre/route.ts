import { scenario } from "@/lib/theatre/scenario";
export function GET() {
  return Response.json(scenario);
}
