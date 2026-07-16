import { IConfiguration } from "server/config/config";

export function getTestConfiguration(dbname: string): IConfiguration {
  const workerSuffix = process.env.JEST_WORKER_ID ?? "1";
  return {
    dbURI: `${process.env.MONGODB_URI}${dbname}_${workerSuffix}`, // use a dedicated DB per Jest worker to avoid conflicts
    domainName: "https://path/to/domain",
    resourcesBaseUrl: "https://path/to/resources",
    uploadBucketRegion: "us-east-1",
    uploadBucketName: "test-upload-bucket",
    downloadBucketRegion: "us-east-2",
    downloadBucketName: "test-download-bucket",
    asyncImportLambdaFunctionArn: "arn:aws:lambda:foo:bar:baz:import",
    asyncExportLambdaFunctionArn: "arn:aws:lambda:foo:bar:baz:export",
    asyncPublishEmbeddingsTaskLambdaFunctionArn: "arn:aws:lambda:foo:bar:baz:publish-embeddings-task",
    asyncLambdaFunctionRegion: "foo",
    geminiApiKey: "test-gemini-api-key",
    geminiEmbeddingModel: "text-embedding-004",
    embeddingsQueueUrl: "https://sqs.foo.amazonaws.com/123456789012/test-embeddings-queue",
    embeddingsQueueRegion: "foo",
  };
}
