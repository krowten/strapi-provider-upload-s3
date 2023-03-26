import { Stream } from "stream";
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

type StrapiFile = {
  stream: Stream;
  buffer: any;
  mime: string;
  ext: string;
  hash: string;
  path: string;
  url: string;
};

type ProviderOptions = {
  bucket: string;
  folder?: string;
  baseUrl?: string;
  region?: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  endpoint?: string;
  forcePathStyle?: boolean;
  [key: string]: any;
};

type UploadResult = {
  Location: string;
};

const defaultOptions = {
  region: "us-east-1",
};

module.exports = {
  init(providerOptions: ProviderOptions) {
    const options = {
      ...defaultOptions,
      ...providerOptions,
    };

    const { baseUrl, folder, bucket, ...s3Options } = options;

    const s3Client = new S3Client(s3Options);

    const uploadPath = (file: StrapiFile) => {
      const pathChunk = file.path ? `${file.path}/` : "";
      const path = folder
        ? `${folder}/${pathChunk}`
        : pathChunk;
      return `${path}${file.hash}${file.ext}`;
    };

    return {
      async upload(
        file: StrapiFile,
        customParams: Record<string, unknown> = {}
      ) {
        const key = uploadPath(file);
        try {
          const uploadToS3 = new Upload({
            client: s3Client,
            tags: [],
            queueSize: 4,
            leavePartsOnError: false,
            params: {
              Bucket: bucket,
              Key: key,
              ACL: "public-read",
              Body: file.stream || Buffer.from(file.buffer, "binary"),
              ContentType: file.mime,
              ...customParams,
            },
          });

          const { Location } = (await uploadToS3.done()) as UploadResult;
          file.url = baseUrl ? `${baseUrl}/${key}` : Location;
        } catch (error) {
          console.log(error);
        }
      },
      async uploadStream(
        file: StrapiFile,
        customParams: Record<string, unknown> = {}
      ) {
        return await this.upload(file, customParams);
      },
      async delete(
        file: StrapiFile,
        customParams: Record<string, unknown> = {}
      ) {
        const key = uploadPath(file);
        const command = new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
          ...customParams,
        });
        try {
          await s3Client.send(command);
        } catch (error) {
          console.log(error)
        }

      },
    };
  },
};
