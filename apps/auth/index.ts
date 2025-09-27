import { issuer } from "@openauthjs/openauth"
import { object, string, safeParse } from "valibot"
import { GoogleProvider } from "@openauthjs/openauth/provider/google"
import { DynamoStorage } from "@openauthjs/openauth/storage/dynamo"
import { Jwt } from "hono/utils/jwt";

const userInfoSchema = object({
    sub: string(),
    email: string(),
    name: string(),
    picture: string(),
})

const app = issuer({
    subjects: {
        user: object({
            id: string(),
            email: string(),
            name: string(),
            picture: string(),
        }),
    },
    ttl: {
        access: 60 * 5, // 5 mins
        refresh: 60 * 60 * 24 * 365, // 1 year
    },
    storage: DynamoStorage({
        table: "guestbook-auth",
    }),
    // Remove after setting custom domain
    allow: async () => true,
    providers: {
        google: GoogleProvider({
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            scopes: ["email", "profile"]
        })
    },
    success: async (ctx, value) => {
        if (value.provider === "google") {
            const result = safeParse(userInfoSchema, Jwt.decode(value.tokenset.raw.id_token).payload)

            if (!result.success) {
                throw new Error("Failed to decode user information")
            }

            return ctx.subject("user", {
                id: result.output.sub, // Google's user ID
                email: result.output.email,
                name: result.output.name,
                picture: result.output.picture,
            })
        }
        throw new Error("Invalid provider")
    },
})

export default app