import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getUserByEmail } from "@/lib/data";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "aoh_directory_session";

export async function POST(request: NextRequest) {
  const auth = getFirebaseAdminAuth();
  const db = getFirebaseAdminDb();
  if (!auth || !db) {
    return NextResponse.json({ error: "Firebase admin is not configured." }, { status: 500 });
  }

  const body = (await request.json()) as { idToken?: string; email?: string };
  if (!body.idToken) {
    return NextResponse.json({ error: "Missing ID token." }, { status: 400 });
  }

  try {
    const decodedToken = await auth.verifyIdToken(body.idToken);
    const directUserDoc = await db.collection("users").doc(decodedToken.uid).get();
    const user = directUserDoc.exists
      ? {
          uid: directUserDoc.id,
          ...(directUserDoc.data() as {
            tenant_id: string;
            role: "admin" | "district_leader";
            district?: string;
            name: string;
            email: string;
          }),
          tenantId: (directUserDoc.data() as { tenant_id: string }).tenant_id
        }
      : body.email
        ? await getUserByEmail(body.email)
        : null;

    if (!user || user.uid !== decodedToken.uid) {
      return NextResponse.json({ error: "User record not found for this tenant." }, { status: 403 });
    }

    const expiresIn = 1000 * 60 * 60 * 24 * 5;
    const sessionCookie = await auth.createSessionCookie(body.idToken, { expiresIn });

    const response = NextResponse.json({ ok: true, role: user.role, tenantId: user.tenantId });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create session." },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
  return response;
}
