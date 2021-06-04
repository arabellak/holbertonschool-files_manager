const express = require('express');

const app = express();

// All routes from routes directory
app.use('/', require('./routes/index'));

// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
})

export default app;
