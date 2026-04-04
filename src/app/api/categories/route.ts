import { NextResponse } from "next/server";
import { getAllCategories } from "@/lib/services/category-service";
import { successResponse, errorResponse } from "@/lib/types";

export async function GET() {
  try {
    const categories = await getAllCategories();
    return NextResponse.json(
      successResponse(categories, { count: categories.length }),
    );
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      errorResponse("Internal server error"),
      { status: 500 },
    );
  }
}
