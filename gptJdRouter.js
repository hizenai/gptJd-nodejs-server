const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const { Configuration, OpenAIApi, OpenAI } = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
});


const gptJobDescriptionsRouter = express.Router();

gptJobDescriptionsRouter.use(bodyParser.json());

gptJobDescriptionsRouter
.get('/jobDescription', async (req,res,next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /jobDescription');
})

gptJobDescriptionsRouter
.post('/jobDescription',  async (req,res,next) => {
    const assistantIdToUse = "asst_pGQlL8FrmEkRgr80pPt2Meb7"; // Replace with your assistant ID
    const modelToUse = "gpt-4-1106-preview";
    
    console.log('req.body: ', req.body);

    let { jobTitle, jobDescription, employmentType, locationRequired, yoe, skillsRequired, company  } = req.body;

    jobTitle = jobTitle ? jobTitle.toLowerCase() : 'no title provided, make up a title';
    jobDescription = jobDescription ? jobDescription.toLowerCase() : 'no description provided, make up a description';
    employmentType = employmentType ? employmentType.toLowerCase() : "no employment type provided, don't assume anything";
    locationRequired = locationRequired ? locationRequired.toLowerCase() : "location not provided, don't assume anything";
    yoe = yoe ? yoe.toLowerCase() : "years of experience not provided, don't assume anything";
    skillsRequired = skillsRequired ? skillsRequired.toLowerCase() : "assume the skills according to the other fields";
    company = company ? company.toLowerCase() : "company not provided, don't assume anything";

    const prompt = `Job Title: ${jobTitle}\nJob Requirements: ${jobDescription}\nEmployment Type: ${employmentType}\nLocation Required: ${locationRequired}\nYears of Experience: ${yoe}\nSkills Required: ${skillsRequired}\n`;

    // const prompt = `Job Title: ${jobTitle}\nJob Requirements: ${jobDescription}\n`;

    try {
        // Create a Thread
        const myThread = await openai.beta.threads.create();
        console.log("This is the thread object: ", myThread, "\n");

        // Add a Message to a Thread
        const myThreadMessage = await openai.beta.threads.messages.create(
            (thread_id = myThread.id),
            {
            role: "user",
            content: prompt,
            }
        );
        console.log("This is the message object: ", myThreadMessage, "\n");


        // Run the Assistant
        const myRun = await openai.beta.threads.runs.create(
            (thread_id = myThread.id),
            {
            assistant_id: assistantIdToUse,
            }
        );
        console.log("This is the run object: ", myRun, "\n");

        
        // Create a setInterval function to periodically retrieve the Run to check on its status to see if it has moved to completed
        const intervalId = setInterval(async () => {
            let keepRetrievingRun;

            // while (myRun.status === "queued" || myRun.status === "in_progress") {
            try {
                keepRetrievingRun = await openai.beta.threads.runs.retrieve(
                    (thread_id = myThread.id),
                    (run_id = myRun.id)
                    );
            } catch (err) {
                console.log("Too many requests");
            }
            // console.log(`Run status: ${keepRetrievingRun.status}`);

            if (keepRetrievingRun.status === "completed") {
                console.log("\n");

                // Step 6: Retrieve the Messages added by the Assistant to the Thread
                try {
                    const allMessages = await openai.beta.threads.messages.list(
                    (thread_id = myThread.id)
                    );
                    // console.log("User: ", myThreadMessage.content[0].text.value);
                    // console.log("Assistant: ", allMessages.data[0].content[0].text.value);
                    stopInterval();
                    
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');

                    return res.json({success: true, message: allMessages.data[0].content[0].text.value});

                } catch (err) {
                    console.log("Too many requests");
                    keepRetrievingRun.status = "queued";
                }

            } else if (
                keepRetrievingRun.status === "queued" ||
                keepRetrievingRun.status === "in_progress"
            ) {
                // pass
            } else {
                console.log(`Run status: ${keepRetrievingRun.status}`);
                return res.json({success: false, message: 'Error'});
            }

            // }
        }, 3000);

        const stopInterval = () => {
            clearInterval(intervalId);
        }

    } catch (err) {
        console.log("Error creating thread: ", err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.json({success: false, message: 'Error'});
    }
})
    
module.exports = gptJobDescriptionsRouter;