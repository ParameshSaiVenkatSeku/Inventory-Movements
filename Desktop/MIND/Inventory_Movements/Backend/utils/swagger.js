const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const path = require("path");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Inventory Management API",
      version: "1.0.0",
      description: "API documentation for Inventory Management System",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local server",
      },
    ],
  },
  apis: [
    path.join(__dirname, "../v1/auth/*.js"),
    path.join(__dirname, "../v1/users/*.js"),
    path.join(__dirname, "../v1/dashboard/*.js"),
    path.join(__dirname, "../v1/import/*.js"),
    path.join(__dirname, "../AWS/aws.routes.js"),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
