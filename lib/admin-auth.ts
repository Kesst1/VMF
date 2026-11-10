import {NextResponse} from "next/server";
export function requireAdmin(req:Request){const key=process.env.ADMIN_API_KEY;if(!key)return NextResponse.json({error:"ADMIN_API_KEY is not configured"},{status:503});if(req.headers.get("x-admin-api-key")!==key)return NextResponse.json({error:"Unauthorized"},{status:401});return null;}
