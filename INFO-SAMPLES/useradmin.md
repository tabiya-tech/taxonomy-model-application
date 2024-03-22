You can programmatically set user attributes for a particular user in an AWS Cognito User Pool using a Lambda function. To do this, you'll need to use the AWS SDK in your Lambda function to interact with Cognito and update the user's attributes. Here's a step-by-step guide:

1. **Create an AWS Lambda Function**:

   If you haven't already, create an AWS Lambda function using the AWS Lambda service in the AWS Console or by using an infrastructure-as-code tool like AWS SAM or AWS CDK. This function will be responsible for updating the user's attributes.

2. **Add Permissions**:

   Ensure that the Lambda function has the necessary permissions to interact with AWS Cognito. Specifically, it should have permission to call the `AdminUpdateUserAttributes` API operation for the User Pool. You can do this by attaching an appropriate IAM role to the Lambda function.

3. **Write Lambda Function Code**:

   Write the Lambda function code to update the user attributes. Here's an example using Node.js and the AWS SDK:

   ```javascript
   const AWS = require('aws-sdk');
   const cognito = new AWS.CognitoIdentityServiceProvider();

   exports.handler = async (event, context) => {
       const userPoolId = 'YOUR_USER_POOL_ID';
       const username = 'user123'; // Specify the username of the user you want to update
       const customAttributeKey = 'custom:role';
       const newAttributeValue = 'admin'; // Set the new attribute value

       try {
           const params = {
               UserPoolId: userPoolId,
               Username: username,
               UserAttributes: [
                   {
                       Name: customAttributeKey,
                       Value: newAttributeValue,
                   },
               ],
           };

           await cognito.adminUpdateUserAttributes(params).promise();
           return {
               statusCode: 200,
               body: JSON.stringify({ message: 'User attribute updated successfully' }),
           };
       } catch (error) {
           console.error('Error updating user attribute:', error);
           return {
               statusCode: 500,
               body: JSON.stringify({ error: 'Internal Server Error' }),
           };
       }
   };
   ```

   This Lambda function uses the `adminUpdateUserAttributes` method from the AWS SDK to update the custom attribute (`'custom:role'`) for a specific user.

4. **Deploy the Lambda Function**:

   Deploy the Lambda function so that it's accessible and can be triggered.

5. **Invoke the Lambda Function**:

   You can invoke this Lambda function whenever you need to update a user's attribute programmatically. You can trigger it in response to various events, such as user actions in your application or through an API.

6. **Testing**:

   Test the Lambda function to ensure it correctly updates the user's attribute. Verify that the user's attribute has been updated as expected in the AWS Cognito User Pool.

Remember to replace `'YOUR_USER_POOL_ID'`, `'user123'`, `'custom:role'`, and `'admin'` with your specific values and attribute names. Additionally, ensure that you handle errors and exceptions appropriately in your Lambda function.