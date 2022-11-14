import express from 'express'
import cors from 'cors'
import {PrismaClient} from '@prisma/client'
import { convertHourStringToMinutes } from './utils/convert-hour-string-to-minutes'
import { convertMinutesToHoursString } from './utils/convert-minutes-to-hours-string'

const app = express()
app.use(express.json())
app.use(cors())

const prisma = new PrismaClient()

app.get('/games', async (req, resp) => {
  const games = await prisma.game.findMany({
    include: {
      _count:{
        select: {
          ads: true
        }
      }
    }
  })
  return resp.json(games)
});

app.post('/games/:id/ads', async (req, resp) => {
  const gameId = req.params.id
  const body: any = req.body

  const ad = await prisma.ad.create({
    data: {
      gameId,
      name: body.name,
      yearsPlaying: body.yearsPlaying,
      discord: body.discord,
      weekDays: body.weekDays.join(','),
      hoursStart: convertHourStringToMinutes(body.hoursStart),
      hoursEnd: convertHourStringToMinutes(body.hoursEnd),
      useVoiceChannel: body.useVoiceChannel
    }
  })

  return resp.status(201).json(ad)
});

app.get('/games/:id/ads', async (req, resp) => {
  const gameId = req.params.id

  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weekDays: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      hoursStart: true,
      hoursEnd: true,
    },
    where: {
      gameId
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return resp.json(ads.map(ad => {
    return {
      ...ad,
      weekDays: ad.weekDays.split(','),
      hoursStart: convertMinutesToHoursString(ad.hoursStart),
      hoursEnd: convertMinutesToHoursString(ad.hoursEnd)
    }
  }))
})

app.get('/ads/:id/discord', async (req, resp) => {
  const adId = req.params.id

  const ad = await prisma.ad.findUniqueOrThrow({
    select: {
      discord: true
    },
    where: {
      id: adId
    }
  })
  return resp.json({discord: ad.discord})
})

app.listen(3333)