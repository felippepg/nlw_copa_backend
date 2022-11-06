import { FastifyInstance } from "fastify";
import { prisma } from "../database/instance";
import { authenticate } from "../plugins/authenticate";
import { z } from "zod"; 

export async function guessRoutes(fastify: FastifyInstance) {
  fastify.get("/guesses/count", async () => {
    const guesses = await prisma.guess.count();
    return { count: guesses }
  });

  //criar um palpite de um jogo especifico de um bolão
  fastify.post("/pools/:poolId/games/:gameÌd/guesses", {
    onRequest: [authenticate]
  }, async (request, reply) => {
    const createGuessParams = z.object({
      poolId: z.string(),
      gameÌd: z.string()
    });

    const createGuessBody = z.object({
      firstTeamPoints: z.number(),
      secondTeamPoints: z.number()
    });

    const { poolId, gameÌd } = createGuessParams.parse(request.params);
    const { firstTeamPoints, secondTeamPoints} = createGuessBody.parse(request.body);

    //verificando se o participante pertence ao bolão
    const participant = await prisma.participant.findUnique({
      where: {
        userId_poolId: {
          poolId,
          userId: request.user.sub
        }
      }
    })

    if(!participant) {
      return reply.status(400).send({
        message: "Você não pertence a esse bolão"
      });
    }

    //verificar se o usuario já enviou um palpite
    const guess = await prisma.guess.findUnique({
      where: {
        participantId_gameId: {
          participantId: participant.id,
          gameId: gameÌd
        }
      }
    });

    if(guess) {
      return reply.status(400).send({
        message: "Você já realizou um palpite para esse jogo"
      });
    }


    const game = await prisma.game.findUnique({
      where: {
        id: gameÌd
      }
    });

    if(!game) {
      return reply.status(400).send({
        message: "Jogo não encontrado"
      });
    }

    if(game.date < new Date()) {
      return reply.status(400).send({
        message: "Não é possivel enviar o palpite depois do jogo"
      }); 
    }

    await prisma.guess.create({
      data: {
        gameId: gameÌd,
        participantId: participant.id,
        firtsTeamPoints: firstTeamPoints,
        secondTeamPoints: secondTeamPoints
      }
    });

    return reply.status(201).send()
  });

}