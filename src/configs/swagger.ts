// src/config/swagger.ts
import swaggerJSDoc from 'swagger-jsdoc';

export const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Work Whiz API',
      version: '1.0.0',
      description:
        'API documentation for Work Whiz authentication and other modules',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    './src/controllers/*.ts',
    './src/routes/*.ts'
  ], // ⬅️ This is the working format
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
