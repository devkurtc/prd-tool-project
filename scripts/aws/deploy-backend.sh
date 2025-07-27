#!/bin/bash

# Backend Deployment Script for AWS Lambda + API Gateway
# Usage: ./deploy-backend.sh

set -e

# Configuration
PROJECT_NAME="prd-tool"
REGION=${AWS_REGION:-"us-east-1"}
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
LAMBDA_FUNCTION_NAME="$PROJECT_NAME-api"
API_NAME="$PROJECT_NAME-api"

echo "🚀 Deploying PRD Tool Backend to AWS Lambda"
echo "Function: $LAMBDA_FUNCTION_NAME"
echo "Region: $REGION"
echo "Account: $ACCOUNT_ID"

# Create IAM role for Lambda if it doesn't exist
echo "🔐 Setting up IAM role..."
ROLE_NAME="$PROJECT_NAME-lambda-role"
ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"

# Check if role exists
if ! aws iam get-role --role-name $ROLE_NAME >/dev/null 2>&1; then
  echo "Creating IAM role..."
  
  # Create trust policy
  cat > lambda-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

  aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document file://lambda-trust-policy.json

  # Attach basic execution policy
  aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

  # Attach VPC execution policy (for RDS access)
  aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole

  # Create custom policy for RDS and other services
  cat > lambda-custom-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds:*",
        "rds-db:connect",
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "*"
    }
  ]
}
EOF

  aws iam create-policy \
    --policy-name "$PROJECT_NAME-lambda-policy" \
    --policy-document file://lambda-custom-policy.json

  aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$PROJECT_NAME-lambda-policy"

  rm lambda-trust-policy.json lambda-custom-policy.json
  
  echo "⏳ Waiting 10 seconds for IAM role to propagate..."
  sleep 10
fi

# Build and package backend
echo "🔨 Building backend application..."
cd ../../backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Create Lambda handler wrapper
cat > lambda-handler.js << EOF
const serverless = require('serverless-http');
const app = require('./dist/index.js').app;

module.exports.handler = serverless(app);
EOF

# Create deployment package
echo "📦 Creating deployment package..."
rm -f ../backend-lambda.zip

# Include only necessary files
zip -r ../backend-lambda.zip \
  dist/ \
  node_modules/ \
  lambda-handler.js \
  package.json \
  -x "node_modules/.cache/*" \
  -x "node_modules/aws-sdk/*" \
  -x "*.map"

# Get database connection info if available
DB_ENDPOINT=""
if aws rds describe-db-instances --db-instance-identifier $PROJECT_NAME-db >/dev/null 2>&1; then
  DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $PROJECT_NAME-db \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)
fi

# Create or update Lambda function
echo "🔧 Deploying Lambda function..."
if aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME >/dev/null 2>&1; then
  echo "Updating existing function..."
  aws lambda update-function-code \
    --function-name $LAMBDA_FUNCTION_NAME \
    --zip-file fileb://../backend-lambda.zip

  aws lambda update-function-configuration \
    --function-name $LAMBDA_FUNCTION_NAME \
    --environment Variables="{
      NODE_ENV=production,
      DATABASE_URL=postgresql://prdtool:YourSecurePassword123!@$DB_ENDPOINT:5432/prdtool,
      JWT_SECRET=your-jwt-secret-change-in-production,
      CORS_ORIGIN=*
    }" \
    --timeout 30 \
    --memory-size 512
else
  echo "Creating new function..."
  aws lambda create-function \
    --function-name $LAMBDA_FUNCTION_NAME \
    --runtime nodejs18.x \
    --role $ROLE_ARN \
    --handler lambda-handler.handler \
    --zip-file fileb://../backend-lambda.zip \
    --environment Variables="{
      NODE_ENV=production,
      DATABASE_URL=postgresql://prdtool:YourSecurePassword123!@$DB_ENDPOINT:5432/prdtool,
      JWT_SECRET=your-jwt-secret-change-in-production,
      CORS_ORIGIN=*
    }" \
    --timeout 30 \
    --memory-size 512
fi

# Create or update API Gateway
echo "🌐 Setting up API Gateway..."
API_ID=""

# Check if API exists
EXISTING_API=$(aws apigateway get-rest-apis \
  --query "items[?name=='$API_NAME'].id" \
  --output text)

if [ -n "$EXISTING_API" ] && [ "$EXISTING_API" != "None" ]; then
  API_ID="$EXISTING_API"
  echo "Using existing API Gateway: $API_ID"
else
  echo "Creating new API Gateway..."
  API_RESULT=$(aws apigateway create-rest-api \
    --name $API_NAME \
    --description "PRD Tool API")
  API_ID=$(echo $API_RESULT | jq -r '.id')
fi

# Get root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --query 'items[?path==`/`].id' \
  --output text)

# Create proxy resource if it doesn't exist
PROXY_RESOURCE_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --query 'items[?pathPart==`{proxy+}`].id' \
  --output text)

if [ -z "$PROXY_RESOURCE_ID" ] || [ "$PROXY_RESOURCE_ID" == "None" ]; then
  echo "Creating proxy resource..."
  PROXY_RESULT=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_RESOURCE_ID \
    --path-part '{proxy+}')
  PROXY_RESOURCE_ID=$(echo $PROXY_RESULT | jq -r '.id')
fi

# Create ANY method on proxy resource
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $PROXY_RESOURCE_ID \
  --http-method ANY \
  --authorization-type NONE 2>/dev/null || true

# Set up Lambda integration
LAMBDA_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$LAMBDA_FUNCTION_NAME"

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $PROXY_RESOURCE_ID \
  --http-method ANY \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations"

# Grant API Gateway permission to invoke Lambda
aws lambda add-permission \
  --function-name $LAMBDA_FUNCTION_NAME \
  --statement-id "apigateway-invoke-$(date +%s)" \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*" 2>/dev/null || true

# Deploy the API
echo "🚀 Deploying API..."
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod

API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/prod"

# Update frontend config with API URL
if [ -f "../aws-config.json" ]; then
  # Update existing config
  jq --arg api_url "$API_URL" '.apiUrl = $api_url' ../aws-config.json > ../aws-config-temp.json
  mv ../aws-config-temp.json ../aws-config.json
else
  # Create new config
  cat > ../aws-config.json << EOF
{
  "apiUrl": "$API_URL",
  "lambdaFunctionName": "$LAMBDA_FUNCTION_NAME",
  "apiGatewayId": "$API_ID",
  "region": "$REGION"
}
EOF
fi

# Cleanup
rm -f lambda-handler.js ../backend-lambda.zip

echo "✅ Backend deployment completed successfully!"
echo "🌐 API URL: $API_URL"
echo "📝 Configuration saved to scripts/aws-config.json"
echo ""
echo "Next steps:"
echo "1. Test your API: curl $API_URL/health"
echo "2. Set up the database with: ./setup-database.sh"
echo "3. Update frontend environment variables with API URL"

cd ../scripts/aws