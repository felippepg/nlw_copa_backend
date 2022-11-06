import { FastifyInstance } from "fastify";

import { prisma } from "../database/instance";
import { z } from "zod"; 
import { authenticate } from "../plugins/authenticate";

export async function authRoutes(fastify: FastifyInstance) {
  //retorna informações do usuário logado
  fastify.get('/me', {
    //verifica se o token é válido (semelhante aos middlewares do Express)
    onRequest: [authenticate]
  }, async (request) => {
    return { user: request.user }
  })

  //recebendo o acess_token do usuário 
  fastify.post('/signin', async (request) => {

    //validando dados 
    const createUserBody = z.object({
      access_token: z.string()
    });

    const { access_token } = createUserBody.parse(request.body);

    //buscando informações na API do google com base no acess_token
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        method: 'GET',
        Authorization: `Bearer ${access_token}`
      }
    });

    const userData = await userResponse.json();

    const userInfoSchema = z.object({
      id: z.string(),
      email: z.string().email(),
      name: z.string(),
      picture: z.string().url()
    });

    const userInfo = userInfoSchema.parse(userData);
    
    let user = await prisma.user.findUnique({
      where: {
        googleId: userInfo.id
      }
    })

    //verificando se o usuário existe no Banco, caso não exista criar o mesmo
    if(!user) {
      user = await prisma.user.create({
        data: {
          name: userInfo.name,
          email: userInfo.email,
          avatarUrl: userInfo.picture,
          googleId: userInfo.id
        }
      })
    }

    //criar o token do usuário (informações no usuario no hash)
    const token = fastify.jwt.sign({
      name: user.name,
      avatarUrl: user.avatarUrl
    }, {
      sub: user.id, 
      expiresIn: '7 days'
    });

    return { token }

  })
}