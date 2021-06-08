import express from 'express';
import router from './routes/index'

const app = express();

// All routes from routes directory
app.use(express.json());
app.use(router)

// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
})

export default app;
