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

app.use("/", (req,res,next) => {
    res.statusCode = 200;
    res.setHeader('Content-Type','text/html');
    res.end('<html><body><h1>This is an Express Server</h1></body></html>');
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});


module.exports = app;