import swaggerJSDoc from "swagger-jsdoc";

const options = {
    failOnErrors: true,
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Showup API",
            version: "1.0.0",
            description: "API documentation for showup backend",
        },
        servers: [
            { url: "http://localhost:4000", description: "Local dev server" },
            ...(process.env.VERCEL_URL
                ? [{ url: `https://${process.env.VERCEL_URL}`, description: "Vercel deployment" }]
                : []),
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: ["./router/*.js", "./controllers/*.js"], // files with @openapi comments
};

export const swaggerSpec = swaggerJSDoc(options);