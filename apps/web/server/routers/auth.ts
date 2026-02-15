import { router, publicProcedure } from "../trpc"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { db } from "@repo/db"
import { TRPCError } from "@trpc/server"
import { Prisma } from "../../../../packages/db/generated/prisma"

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const normalizedEmail = input.email.trim().toLowerCase()

        const existing = await db.user.findUnique({
          where: { email: normalizedEmail },
        })
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User already exists",
          })
        }

        const hashed = await bcrypt.hash(input.password, 10)

        await db.user.create({
          data: {
            email: normalizedEmail,
            password: hashed,
          },
        })

        return { success: true }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }

        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User already exists",
          })
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to register user",
        })
      }
    }),
    resetPassword: publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      newPassword: z.string().min(6),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const normalizedEmail = input.email.trim().toLowerCase()

      const user = await db.user.findUnique({
        where: { email: normalizedEmail },
      })

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        })
      }

      const hashed = await bcrypt.hash(input.newPassword, 10)

      await db.user.update({
        where: { email: normalizedEmail },
        data: { password: hashed },
      })

      return { success: true }
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to reset password",
      })
    }
  }),

})
