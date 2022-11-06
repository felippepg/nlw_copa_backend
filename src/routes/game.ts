import { FastifyInstance } from "fastify";
import { prisma } from "../database/instance";
import { z } from "zod"; 
import { authenticate } from "../plugins/authenticate";

export async function gameRoutes(fastify: FastifyInstance) {
  //trazer todas os jogos dos bolão que estou participando
  fastify.get("/pools/:id/games",{
    onRequest: [authenticate]
  }, async (request) => {
    const getPoolParams = z.object({
      id: z.string()
    });

    const { id } = getPoolParams.parse(request.params);

    const games = await prisma.game.findMany({
      orderBy: {
        date: 'desc'
      },
      include: {
        guesses: {
          where: {
            participant: {
              userId: request.user.sub,
              poolId: id
            }
          }
        }
      }
    })

    //não faz sentido um jogo ter vários palpites do mesmo usuario, filtrar somente primeiro palpite
    return { 
      games: games.map( game => {
        return {
          ...game,
          guess: game.guesses.length > 0 ? game.guesses[0] : null,
          guesses: undefined
        }
      })
    }
  });

  fastify.post("/games", {
    onRequest:[authenticate]
  }, async (request) => {
    const gameDataProps = z.object({
      date: z.string(),
      firstTeamCode: z.string(),
      secondTeamCode: z.string()
    });

    const { date, firstTeamCode, secondTeamCode } = gameDataProps.parse(request.body);

    const game = await prisma.game.create({
      data: {
        date: date,
        firstTeamCountryCode: firstTeamCode,
        secondTeamCountryCode: secondTeamCode
      }
    });

    return { game }

  })
}