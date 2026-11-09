import {NextResponse} from "next/server";import {sql} from "@/lib/db";
export async function GET(){try{const rows=await sql`SELECT * FROM competitions ORDER BY created_at DESC`;return NextResponse.json({competitions:rows});}catch{return NextResponse.json({error:"Database not initialized. Run database/schema.sql in Neon."},{status:503});}}
