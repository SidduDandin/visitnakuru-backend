import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import userRoutes from './routes/users';
import healthRoutes from './routes/health';
import adminRoutes from "./routes/admin";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: [
    "http://localhost:3000", 
    "https://visitnakuru-ui.vercel.app" // ✅ Allow frontend production domain
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/users', userRoutes);
app.use("/api/admin", adminRoutes);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});



export default app;