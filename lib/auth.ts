import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "rifas_session";
const SESSION_DAYS = 30;

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeWhatsapp(value: string) {
  return value.replace(/\D/g, "").trim();
}

export function validateCredentials(name: string, city: string, username: string, whatsapp: string, password: string) {
  const cleanName = name.trim();
  const cleanCity = city.trim();
  const cleanUsername = normalizeUsername(username);
  const cleanWhatsapp = normalizeWhatsapp(whatsapp);

  if (cleanName.length < 3 || cleanName.length > 100) {
    return "Informe seu nome completo.";
  }

  if (cleanCity.length < 2 || cleanCity.length > 80) {
    return "Informe sua cidade.";
  }

  if (!/^[a-z0-9._-]{3,30}$/.test(cleanUsername)) {
    return "O usuário deve ter de 3 a 30 caracteres e usar apenas letras, números, ponto, hífen ou sublinhado.";
  }

  if (cleanWhatsapp.length < 10 || cleanWhatsapp.length > 15) {
    return "Informe um WhatsApp ou telefone válido.";
  }

  if (password.length < 4 || password.length > 100) {
    return "A senha deve ter entre 4 e 100 caracteres.";
  }

  return null;
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, "hex");

  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createUser(name: string, city: string, username: string, whatsapp: string, password: string) {
  const error = validateCredentials(name, city, username, whatsapp, password);
  if (error) throw new Error(error);

  const cleanUsername = normalizeUsername(username);
  const cleanWhatsapp = normalizeWhatsapp(whatsapp);

  const existing = await prisma.user.findUnique({ where: { username: cleanUsername } });
  if (existing) throw new Error("Esse usuário já está cadastrado.");

  const passwordHash = await hashPassword(password);

  return prisma.user.create({
    data: {
      name: cleanName,
      city: cleanCity,
      username: cleanUsername,
      whatsapp: cleanWhatsapp,
      passwordHash
    },
    select: { id: true, name: true, city: true, username: true, whatsapp: true }
  });
}

export async function authenticateUser(username: string, password: string) {
  const cleanUsername = normalizeUsername(username);
  const user = await prisma.user.findUnique({ where: { username: cleanUsername } });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return null;
  }

  return { id: user.id, name: user.name, city: user.city, username: user.username, whatsapp: user.whatsapp };
}

export async function startSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      tokenHash: hashSessionToken(token),
      userId,
      expiresAt
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: { select: { id: true, name: true, city: true, username: true, whatsapp: true } } }
  });

  if (!session) return null;

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.user;
}

export async function endSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: hashSessionToken(token) }
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}
