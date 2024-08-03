import { RDSClient, StartExportTaskCommand } from "@aws-sdk/client-rds";

const REGION = process.env.REGION || "ap-northeast-1";
const rdsClient = new RDSClient({ region: REGION });
const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID;
const KmsKeyId= process.env.KMS_KEY_ID'

const checkSnapshotType = (eventMsg) => {
  if (eventMsg?.includes("automated") || eventMsg?.includes("Automated") ) return "AUTOMATED";
  if (eventMsg?.includes("manual") || eventMsg?.includes("Manual") ) return "MANUAL";
  return "UNKNOWN";
};

const isCreatedSnapshot = (eventMsg) => {
  if (eventMsg?.includes("created")) return true;
  return false;
};

const getCurrentTime =()=>{
  const now = new Date();
  return `${now.getUTCFullYear()}-${now.getUTCMonth()+1}-${now.getUTCDate()}-${now.getUTCHours()}-${now.getUTCMinutes()}-${now.getUTCSeconds()}`
}

export const handler = async (event) => {
  try {
    const snsEvent = event?.Records[0]?.Sns;
    //  CloudWatchでイベント詳細を閲覧
    //  Snapshot情報があります
    console.log("[INFO]:  EVENT_Records_SNS:", snsEvent);
    const eventDetails = await JSON.parse(snsEvent.Message);
    const snapshotType = checkSnapshotType(eventDetails["Event Message"]);
    // snapshot種類次第で、輸出するかどうかsnapshotTypeで処理できます
    const sourceID = eventDetails["Source ID"];
    const sourceARN = eventDetails["Source ARN"];

    if(!isCreatedSnapshot(eventDetails["Event Message"])){
      console.log("[ERROR]: Snapshot is creating, cannot export",sourceID)
      return {
        statusCode: 400,
        body: JSON.stringify("[ERROR]: Snapshot is creating, cannot export",sourceID),
      }
    }

    //　命名が任意
    const snapshotNameInS3 = `${snapshotType}-${getCurrentTime()}`
    const targetBucket = "rds-snapshot-archive-test";
    const roleArn = `arn:aws:iam::${AWS_ACCOUNT_ID}:role/TakeRDSSnapshootToS3`
    const kmsKeyArn =
      `arn:aws:kms:ap-northeast-1:${AWS_ACCOUNT_ID}:key/${KmsKeyId}`;
    const params = {
      ExportTaskIdentifier: snapshotNameInS3,
      SourceArn: sourceARN,
      S3BucketName: targetBucket,
      IamRoleArn: roleArn,
      KmsKeyId: kmsKeyArn,
    };
    const command = new StartExportTaskCommand(params);
    const data = await rdsClient.send(command);
    console.log(`[INFO] Export task started: ${JSON.stringify(data)}`);
    const response = {
      statusCode: 200,
      body: JSON.stringify("Start export source ID",sourceID),
    };
    return response;
  } catch (error) {
    console.error(`[Error]: starting export task: ${error}`);
    return {
      statusCode: 500,
      body: JSON.stringify("Error starting export task"),
    };
  }
};
