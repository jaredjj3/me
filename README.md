# [jaredjohnson.dev](https://www.jaredjohnson.dev)

## Deploying

First, build the project.

```
hugo
```

Then, deploy it to the S3 bucket (you must have `awscli` and have a configuration that is approved to upload to the bucket) 

```
hugo deploy aws
```