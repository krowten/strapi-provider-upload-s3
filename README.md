## Description

Alternate S3 compatible upload provider built with AWS SDK 3 and TypeScript, can work with Minio object storage.

## Installation

```bash
# using yarn
yarn add @krowten/strapi-provider-upload-s3

# using npm
npm install @krowten/strapi-provider-upload-s3 --save
```

## Configuration

- `provider` defines the name of the provider `@krowten/strapi-provider-upload-s3`
- `providerOptions` is passed down during the construction of the provider. `bucket`, `folder`, `baseUrl` and any other (ex: `new AWS.S3(config)`). [Complete list of options](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property)
- `actionOptions` is passed directly to the parameters to each method respectively. You can find the complete list of [upload/ uploadStream options](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property) and [delete options](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObject-property)

See the [documentation about using a provider](https://docs.strapi.io/developer-docs/latest/plugins/upload.html#using-a-provider) for information on installing and using a provider. To understand how environment variables are used in Strapi, please refer to the [documentation about environment variables](https://docs.strapi.io/developer-docs/latest/setup-deployment-guides/configurations/optional/environment.html#environment-variables).

### Provider Configuration

 `./config/plugins.ts` for AWS S3:

```ts
export default ({ env }) => ({
  // ...
  upload: {
    config: {
      provider: "@krowten/strapi-provider-upload-s3",
      providerOptions: {
        bucket: env("AWS_S3_BUCKET"),
        // folder: 'custom/folder',
        credentials: {
          accessKeyId: env("AWS_ACCESS_KEY_ID"),
          secretAccessKey: env("AWS_ACCESS_SECRET"),
        },
        region: env("AWS_DEFAULT_REGION")
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
  // ...
});
```

 `./config/plugins.ts` for Minio object storage or S3 compatible services:

```ts
export default ({ env }) => ({
  // ...
  upload: {
    config: {
      provider: "@krowten/strapi-provider-upload-s3",
      providerOptions: {
        bucket: env("S3_BUCKET"), // my-bucket
        baseUrl: env("S3_BASE_URL"), // http://localhost:9000/my-bucket
        // folder: 'custom/folder',
        credentials: {
          accessKeyId: env("S3_ACCESS_KEY_ID"),
          secretAccessKey: env("S3_ACCESS_SECRET"),
        },
        endpoint: env("S3_ENDPOINT"), // http://localhost:9000
        forcePathStyle: true, // Required for minio
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
  // ...
});
```

### Security Middleware Configuration

Due to the default settings in the Strapi Security Middleware you will need to modify the `contentSecurityPolicy` settings to properly see thumbnail previews in the Media Library. You should replace `strapi::security` string with the object bellow instead as explained in the [middleware configuration](https://docs.strapi.io/developer-docs/latest/setup-deployment-guides/configurations/required/middlewares.html#loading-order) documentation.

`./config/middlewares.ts`

```ts
export default ({ env }) => {
  const s3url = new URL(env("S3_ENDPOINT"));
  return [
    // ...
    {
      name: "strapi::security",
      config: {
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            "connect-src": ["'self'", "https:"],
            "img-src": [
              "'self'",
              "data:",
              "blob:",
              "dl.airtable.com",
              s3url.host,
            ],
            "media-src": [
              "'self'",
              "data:",
              "blob:",
              "dl.airtable.com",
              s3url.host,
            ],
            upgradeInsecureRequests: null,
          },
        },
      },
    },
    // ...
  ];
};
```

If you use dots in your bucket name, the url of the ressource is in directory style (`s3.yourRegion.amazonaws.com/your.bucket.name/image.jpg`) instead of `yourBucketName.s3.yourRegion.amazonaws.com/image.jpg`. Then only add `s3.yourRegion.amazonaws.com` to img-src and media-src directives.

## Bucket CORS Configuration

If you are planning on uploading content like GIFs and videos to your S3 bucket, you will want to edit its CORS configuration so that thumbnails are properly shown in Strapi. To do so, open your Bucket on the AWS console and locate the _Cross-origin resource sharing (CORS)_ field under the _Permissions_ tab, then amend the policies by writing your own JSON configuration, or copying and pasting the following one:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedOrigins": ["YOUR STRAPI URL"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```

## Required AWS Policy Actions

These are the minimum amount of permissions needed for this provider to work.

```json
"Action": [
  "s3:PutObject",
  "s3:GetObject",
  "s3:ListBucket",
  "s3:DeleteObject",
  "s3:PutObjectAcl"
],
```
