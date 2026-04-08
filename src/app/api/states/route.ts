import { NextResponse } from "next/server";
import { getAllStates } from "@/lib/services/state-service";
import { successResponse } from "@/lib/types";
import { withApiHandler } from "@/lib/utils/api-handler";

export const GET = withApiHandler(async () => {
  const states = await getAllStates();
  return NextResponse.json(
    successResponse(states, { count: states.length }),
  );
});
