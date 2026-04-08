import { NextResponse } from "next/server";
import { getAllCategories } from "@/lib/services/category-service";
import { successResponse } from "@/lib/types";
import { withApiHandler } from "@/lib/utils/api-handler";

export const GET = withApiHandler(async () => {
  const categories = await getAllCategories();
  return NextResponse.json(
    successResponse(categories, { count: categories.length }),
  );
});
