import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid"; // Import UUID generator

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.ORDERS_TABLE_NAME;

export const handler = async (event) => {
  try {
    // Process each SQS message
    for (const record of event.Records) {
      // Parse the order data from the SQS message
      const orderData = JSON.parse(record.body);

      // Generate a unique OrderID
      const uniqueOrderID = uuidv4();

      // Define parameters for DynamoDB put operation
      const params = {
        TableName: tableName,
        Item: {
          OrderId: uniqueOrderID, // Use the generated unique OrderID
          Name: orderData.name,
          Product: orderData.product,
          Quantity: orderData.quantity,
          CreatedAt: new Date().toISOString(),
        },
      };

      // Insert the order data into DynamoDB
      const command = new PutCommand(params);
      await docClient.send(command);
    }
    console.log("Order(s) processed successfully!");
  } catch (error) {
    console.error("Error processing order:", error);
    throw new Error("Error processing order."); // Ensure error is propagated
  }
};
