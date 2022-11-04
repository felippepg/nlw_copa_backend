import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import { z } from "zod"; 
import ShortUniqueId from "short-unique-id";

const prisma = new PrismaClient({
  log: ['query']
});

async function bootstrap() {
  const fastify = Fastify({
    logger: true
  });

  await fastify.register(cors, {
    origin: true
  });

  fastify.post("/pools", async (request, reply) => {
    const createPoolBody = z.object({
      title: z.string()
    });

    const generate = new ShortUniqueId({ length: 6 })
    const { title } = createPoolBody.parse(request.body);
    const code = String(generate()).toUpperCase();

    await prisma.pool.create({
      data: {
        title,
        code
      }
    })
    return reply.status(201).send({ code });
  });

  fastify.get("/pools/count", async () => {
    const pools = await prisma.pool.count();
    return { count: pools }
  });

  fastify.get("/guesses/count", async () => {
    const guesses = await prisma.guess.count();
    return { count: guesses }
  });

  fastify.get("/users/count", async () => {
    const users = await prisma.user.count();
    return { count: users}
  });

  await fastify.listen({ port: 8080 /*host: '0.0.0.0'*/ });
}

bootstrap();