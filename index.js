const AWS = require("aws-sdk");
require("dotenv").config();


const snapshotIdentifier = "rds:database-1-2024-07-26-17-50";
const region = process.env.AWS_REGION;
const accountId = process.env.AWS_ACCOUNT_ID; // No hyphen
const bucket = process.env.AWS_BUCKET_NAME;
const roleArn = `arn:aws:iam::${accountId}:role/${process.env.AWS_ROLE}`

const rds = new AWS.RDS({
  region: region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});



const params = {
  ExportTaskIdentifier: `testExport`,
  SourceArn: `arn:aws:rds:${region}:${accountId}:snapshot:${snapshotIdentifier}`,
  S3BucketName: bucket,
  IamRoleArn: roleArn,
  KmsKeyId:`arn:aws:iam::${AWS_ACCOUNT_ID}:role/TakeRDSSnapshootToS3`
};

const execute = async () => {
  try {
    console.log(`STARTING.........`);
    const data = await rds.startExportTask(params).promise();


    console.log(`Export task started: ${JSON.stringify(data)}`);
    // return {
    //   statusCode: 200,
    //   body: JSON.stringify("Export task started successfully"),
    // };
  } catch (error) {
    console.error(`Error starting export task: ${error}`);
    // return {
    //   statusCode: 500,
    //   body: JSON.stringify("Error starting export task"),
    // };
  }
};


execute();


/**
aws kms get-key-policy --key-id   arn:aws:kms:ap-northeast-1:381492010145:key/d25093ae-cee3-4c00-a080-2e3003011838   --policy-name default
 
 
 
 */




