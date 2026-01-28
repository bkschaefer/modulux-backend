import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';

import { authRouter } from "./routes/auth.routes";
import { errorhandler } from "./middleware/errorhandler";
import { userRouter } from "./routes/user-routes/user.routes";
import { registrationRouter } from "./routes/user-routes/registration.routes";
import { passResetRouter } from "./routes/user-routes/passReset.routes";
import { collectionRouter } from "./routes/collection-routes/collection.routes";
import { env } from "./env";
import { ApplicationModel } from "./model/application.model";
import { logger } from "./logger";
import { aiRouter } from "./routes/ai.routes";

export const app = express();
app.use("*", express.json());
app.use("*", cookieParser());

app.use(
  cors({
    origin: async (origin, callback) => {
      if (origin === env.VITE_SERVER_URL) {
        callback(null, true);
      } else {
        const applications = await ApplicationModel.find({ url: origin }).exec();
        if (applications) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    methods: "GET,PUT,POST,DELETE,PATCH",
    allowedHeaders: "Origin,Content-Type,x-api-key",
    optionsSuccessStatus: 200,
    credentials: true,
  }),
);

app.use("/api/auth", authRouter, passResetRouter);
app.use("/api/user", userRouter, registrationRouter);
app.use("/api/collection", collectionRouter)
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
  }
}));

// Add new endpoint for JSON download
app.get('/api-docs-json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="swagger.json"');
  res.send(swaggerSpec);
});

app.use("/api/ai", aiRouter)
app.use("*", errorhandler);

export default app;
