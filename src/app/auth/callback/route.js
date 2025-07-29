import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.redirect(new URL("/mon-compte", process.env.NEXT_PUBLIC_BASE_URL));
}
