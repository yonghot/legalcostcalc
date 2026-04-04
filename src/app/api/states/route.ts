import { NextResponse } from "next/server";
import { getAllStates } from "@/lib/services/state-service";
import { successResponse, errorResponse } from "@/lib/types";

export async function GET() {
  try {
    const states = await getAllStates();
    return NextResponse.json(
      successResponse(states, { count: states.length }),
    );
  } catch (error) {
    console.error("GET /api/states error:", error);
    return NextResponse.json(
      errorResponse("Internal server error"),
      { status: 500 },
    );
  }
}
