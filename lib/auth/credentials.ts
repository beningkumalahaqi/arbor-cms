import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hasSuperAdmin(): Promise<boolean> {
  const count = await prisma.user.count({
    where: { role: "superadmin" },
  });
  return count > 0;
}

export async function createSuperAdmin(
  email: string,
  name: string,
  password: string
) {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  return prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: "superadmin",
    },
  });
}

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) return null;

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
