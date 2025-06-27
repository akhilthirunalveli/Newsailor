import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import adminNewsRoutes from './routes/adminNews.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Admin News Routes
app.use('/api/admin', adminNewsRoutes);

app.get('/', (req, res) => {
  res.send('✅ Backend server is running');
});

app.listen(PORT, () => {
  console.log(`🚀 Server started at http://localhost:${PORT}`);
});
