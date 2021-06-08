import express from 'express';
import routeControllers from './routes/index';

const app = express();
app.use(express.json());

// Port
const PORT = process.env.PORT || 5000;

// All routes from routes directory
routeControllers(app);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

export default app;
