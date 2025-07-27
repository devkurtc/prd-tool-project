# AWS Deployment Setup for PRD Tool

## Prerequisites

1. **AWS Account** with Free Tier eligibility
2. **AWS CLI** installed and configured
3. **Node.js 18+** installed
4. **Docker** installed (for local testing)

## Quick Setup Commands

```bash
# Install AWS CLI (if not already installed)
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Configure AWS CLI
aws configure
# Enter your AWS Access Key ID, Secret Access Key, Region (us-east-1), and output format (json)

# Install Serverless Framework (for easier Lambda deployment)
npm install -g serverless
npm install -g aws-cdk-lib

# Verify setup
aws sts get-caller-identity
```

## Architecture Overview

```
Frontend (React)     Backend (Express)      Database
     ↓                       ↓                  ↓
S3 + CloudFront  →  API Gateway + Lambda  →  RDS PostgreSQL
                         ↓
                 WebSocket API Gateway
```

## Step-by-Step Deployment

### 1. Environment Setup
Create `.env.aws` file with your configuration:

```bash
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=your-account-id
PROJECT_NAME=prd-tool
ENVIRONMENT=prod
DB_PASSWORD=your-secure-password
```

### 2. Database Setup (RDS Free Tier)
```bash
# Create security group for RDS
aws ec2 create-security-group \
  --group-name prd-tool-db-sg \
  --description "Security group for PRD Tool database"

# Add inbound rule for PostgreSQL
aws ec2 authorize-security-group-ingress \
  --group-name prd-tool-db-sg \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0

# Create RDS instance (Free Tier)
aws rds create-db-instance \
  --db-instance-identifier prd-tool-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username prdtool \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 20 \
  --storage-type gp2 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --backup-retention-period 7 \
  --multi-az false \
  --publicly-accessible true \
  --storage-encrypted false
```

### 3. Frontend Deployment (S3 + CloudFront)
```bash
# Create S3 bucket for frontend
aws s3 mb s3://prd-tool-frontend-unique-name

# Enable static website hosting
aws s3 website s3://prd-tool-frontend-unique-name \
  --index-document index.html \
  --error-document error.html

# Build and deploy frontend
cd frontend
npm run build
aws s3 sync dist/ s3://prd-tool-frontend-unique-name --delete

# Create CloudFront distribution
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

### 4. Backend Deployment (Lambda + API Gateway)
```bash
# Package backend for Lambda
cd backend
npm run build
zip -r ../backend-lambda.zip .

# Create Lambda function
aws lambda create-function \
  --function-name prd-tool-api \
  --runtime nodejs18.x \
  --role arn:aws:iam::your-account:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://../backend-lambda.zip

# Create API Gateway
aws apigateway create-rest-api --name prd-tool-api
```

## Cost Optimization

### Free Tier Limits (12 months)
- **S3**: 5GB storage, 20,000 GET requests
- **CloudFront**: 50GB data transfer, 2,000,000 requests
- **Lambda**: 1M requests, 400,000 GB-seconds compute
- **API Gateway**: 1M requests
- **RDS**: 750 hours db.t2.micro, 20GB storage

### Beyond Free Tier (Monthly)
- **S3**: ~$0.023/GB
- **CloudFront**: ~$0.085/GB (first 10TB)
- **Lambda**: ~$0.20/1M requests
- **RDS t3.micro**: ~$12.41/month
- **API Gateway**: ~$3.50/1M requests

## Monitoring Setup

```bash
# Enable CloudWatch monitoring
aws logs create-log-group --log-group-name /aws/lambda/prd-tool-api
aws logs create-log-group --log-group-name /aws/apigateway/prd-tool-api

# Set up billing alerts
aws cloudwatch put-metric-alarm \
  --alarm-name "BillingAlert" \
  --alarm-description "Alert when charges exceed $10" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

## Security Configuration

```bash
# Create IAM role for Lambda
aws iam create-role \
  --role-name lambda-execution-role \
  --assume-role-policy-document file://lambda-trust-policy.json

# Attach basic execution policy
aws iam attach-role-policy \
  --role-name lambda-execution-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Attach RDS access policy
aws iam attach-role-policy \
  --role-name lambda-execution-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonRDSDataFullAccess
```

## Deployment Scripts

All deployment scripts are in the `scripts/aws/` directory:
- `deploy-frontend.sh` - Builds and deploys React app to S3/CloudFront
- `deploy-backend.sh` - Packages and deploys Lambda functions
- `setup-database.sh` - Creates and configures RDS instance
- `teardown.sh` - Removes all AWS resources

## Troubleshooting

### Common Issues:
1. **Lambda cold starts**: Use provisioned concurrency for critical functions
2. **CORS errors**: Configure API Gateway CORS properly
3. **Database connections**: Use connection pooling for Lambda
4. **Build failures**: Ensure Node.js versions match between local and Lambda

### Useful Commands:
```bash
# Check Lambda logs
aws logs tail /aws/lambda/prd-tool-api --follow

# Check API Gateway logs
aws logs tail /aws/apigateway/prd-tool-api --follow

# Monitor costs
aws budgets describe-budgets --account-id your-account-id
```

## Next Steps

1. Run the setup scripts in order
2. Test the deployment with sample data
3. Set up CI/CD pipeline with GitHub Actions
4. Configure custom domain name
5. Add SSL certificate
6. Set up backup and recovery procedures