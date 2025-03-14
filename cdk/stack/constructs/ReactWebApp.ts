import * as cdk from 'aws-cdk-lib';
import { AssetHashType } from 'aws-cdk-lib';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { execSync } from 'child_process';
import { Construct } from 'constructs';
import * as path from 'path';

import StaticWebsite, { StaticWebsiteProps } from './StaticWebsite';

interface ReactWebAppProps extends StaticWebsiteProps {
  sourcePath: string; // location of react source files
  deployPath?: string; // location (within source path) of build files (default = 'dist')
  config?: { [key: string]: string }; // environment variables
  buildCommands?: string[]; // local commands to run before deploying (default = 'npm run build')
}

export default class ReactWebApp extends StaticWebsite {
  constructor(
    scope: Construct,
    id: string,
    {
      domainName,
      hostedZoneDomainName,
      certificateArn,
      sourcePath,
      deployPath = 'dist',
      buildCommands = ['npm run build'],
      config = {},
    }: ReactWebAppProps,
  ) {
    // create static website
    const domainSettings = { domainName, hostedZoneDomainName, certificateArn };
    super(scope, id, domainSettings);

    // convert config object into simple js window global variable
    const configJsCode = `window.config = ${JSON.stringify(config, null, 2)}`;

    // Execute build commands locally
    this.executeBuildCommands(sourcePath, buildCommands);

    // Deploy website files to S3
    new s3deploy.BucketDeployment(this, 'web-deployment', {
      destinationBucket: this.bucket,
      sources: [
        // Deploy build files
        s3deploy.Source.asset(path.join(sourcePath, deployPath), {
          // only deploy if source files have actually changed
          assetHash: cdk.FileSystem.fingerprint(sourcePath, {
            ignoreMode: cdk.IgnoreMode.GIT,
          }),
          assetHashType: AssetHashType.CUSTOM,
        }),

        // Deploy web config
        s3deploy.Source.data('config.js', configJsCode),
      ],
    });
  }

  private executeBuildCommands(path: string, commands: string[]) {
    if (!commands) {
      return;
    }

    console.log('Building React web application');

    // Get the current working directory
    const originalDir = process.cwd();

    // Navigate to a path directory
    process.chdir(path);

    // Run commands in the new directory
    commands.forEach((command) => {
      console.log(`Executing command: ${command}`);

      // execute command and hide warning messages
      execSync(command, { encoding: 'utf-8', stdio: 'inherit' });
    });

    // Navigate back to the original directory
    process.chdir(originalDir);
  }
}
