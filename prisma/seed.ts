import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john.doe@outlook.com.br'
    }
  })

  const pool = await prisma.pool.create({
    data: {
      title: 'Bolão do JOE',
      code: 'BOL321',
      ownerId: user.id,

      participants: {
        create: {
          userId: user.id   
        }
      }
    }
  })

  await prisma.game.create({
    data: {
      date: '2022-11-05T14:00:00.392Z',
      firstTeamCountryCode: 'BR',
      secondTeamCountryCode: 'DE'
    }
  })

  await prisma.game.create({
    data: {
      date: '2022-11-10T12:00:00.392Z',
      firstTeamCountryCode: 'BR',
      secondTeamCountryCode: 'AR',

      guesses: {
        create: {
          firtsTeamPoints: 5,
          secondTeamPoints: 0,
          participant: {
            connect: {
              userId_poolId: {
                poolId: pool.id,
                userId: user.id
              }
            }
          }
        }
      }
    }
  })
}

main()