import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import Joi from "joi";

const sqs = new SQSClient();

const schema = Joi.object({
  name: Joi.string().required(),
  product: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
});

export const handler = async (event) => {
  try {
    // Check for and parse JSON body
    let orderData;
    try {
      orderData = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({ message: "Invalid JSON format." }),
      };
    }

    // Validate request data
    const { error } = schema.validate(orderData);
    if (error) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          message: `Invalid request: ${error.details[0].message}`,
        }),
      };
    }

    // Ensure the queue URL is defined
    const queueUrl = process.env.SQS_QUEUE_URL;
    if (!queueUrl) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "SQS_QUEUE_URL is not defined." }),
      };
    }

    // Send message to SQS
    const params = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(orderData),
    };

    const command = new SendMessageCommand(params);
    await sqs.send(command);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ message: "Order received successfully!" }),
    };
  } catch (error) {
    console.error("Error processing order:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ message: "Error processing order." }),
    };
  }
};
