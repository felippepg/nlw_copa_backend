import { FastifyInstance } from "fastify";
import { prisma } from "../database/instance";

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get("/users/count", async () => {
    const users = await prisma.user.count();
    return { count: users}
  });
}