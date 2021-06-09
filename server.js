import express from 'express';
import routeControllers from './routes/index';

const app = express();

const PORT = process.env.PORT || 5000;

// All routes from routes directory
routeControllers(app);

app.use(express.json());

app.use('/', router);
app.use('/status', router);
app.use('/stats', router);
app.use('/connect', router);
app.use('/disconnect', router);
app.use('/users/me', router);
app.use(`/files/${id}`, route);
app.use('/files ', route);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

export default app;
