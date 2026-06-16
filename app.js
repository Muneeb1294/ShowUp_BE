import express from 'express';
import cors from 'cors';
import { getFrontendUrl } from './utils/frontendUrl.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';

const app = express();

const productionOrigin = getFrontendUrl();
const vercelPreviewOrigin = /^https:\/\/show-up-.*\.vercel\.app$/i;

app.use(cors({
    origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (origin === productionOrigin || vercelPreviewOrigin.test(origin)) {
            return callback(null, true);
        }
        if (/^http:\/\/localhost(:\d+)?$/i.test(origin)) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export default app;
