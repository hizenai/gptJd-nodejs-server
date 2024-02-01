const openai = require('openai');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const gptJobDescriptionsRouter = require('./gptJdRouter');

dotenv.config();

const app = express();
app.use(cors());

const port = process.env.PORT || 5000;

app.use("/",gptJobDescriptionsRouter);

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});


