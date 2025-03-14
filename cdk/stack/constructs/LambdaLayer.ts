import { Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { execSync } from 'child_process';
import { Construct } from 'constructs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

export interface LambdaLayerProps {
  layerName: string;
  layerDescription?: string;
  dockerfileFilename?: string;
  dockerfileFolder?: string;
  sourceFolder: string;
  destinationPath?: string;
  compatibleRuntimes?: Runtime[];
}

const run = (command: string) => {
  execSync(command, { stdio: 'inherit' });
};

export class LambdaLayer extends LayerVersion {
  constructor(
    scope: Construct,
    id: string,
    {
      layerName,
      layerDescription = '',
      dockerfileFilename,
      dockerfileFolder = './',
      sourceFolder,
      destinationPath = '/',
      compatibleRuntimes = [Runtime.PYTHON_3_12],
    }: LambdaLayerProps,
  ) {
    // Output path to hold lambda layer files
    const outputPath = `cdk.out/layer-${uuid()}`;

    // Build the Docker image
    const imageName = `local:${uuid()}`;
    run(
      `docker build -t ${imageName} ${dockerfileFolder}${
        dockerfileFilename ? ' -f ' + dockerfileFilename : ''
      }`,
    );

    // Create a container from the image to grab the built files
    const containerId = execSync(`docker create ${imageName}`).toString().trim();

    // Copy the files from the docker container to the local destination path
    const destFolder = path.join(outputPath, destinationPath);
    run(`mkdir -p ${destFolder}`);
    run(`docker cp ${containerId}:${sourceFolder}/. ${destFolder}`);

    // Remove docker image and container from local
    run(`docker rm ${containerId}`);
    run(`docker image rm ${imageName}`);

    super(scope, id, {
      code: Code.fromAsset(path.join(outputPath)),
      layerVersionName: layerName,
      description: layerDescription,
      compatibleRuntimes: compatibleRuntimes,
    });
  }
}
