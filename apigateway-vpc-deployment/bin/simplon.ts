#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { SimplonStack } from '../lib/simplon-stack';

const app = new cdk.App();
new SimplonStack(app, 'SimplonStack');
