#!/bin/bash

# AWS Resources Teardown Script
# Usage: ./teardown.sh [--confirm]

set -e

PROJECT_NAME="prd-tool"
REGION=${AWS_REGION:-"us-east-1"}
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}⚠️  AWS RESOURCES TEARDOWN${NC}"
echo "This will delete ALL AWS resources for the PRD Tool project:"
echo ""
echo "🗄️  RDS Database instance and data"
echo "☁️  CloudFront distribution"
echo "📦 S3 bucket and all files"
echo "⚡ Lambda functions"
echo "🌐 API Gateway"
echo "🔐 IAM roles and policies"
echo "🛡️  Security groups"
echo ""

# Check for confirmation
if [ "$1" != "--confirm" ]; then
  echo -e "${YELLOW}This action cannot be undone!${NC}"
  echo "To proceed, run: ./teardown.sh --confirm"
  exit 1
fi

echo -e "${RED}Starting teardown process...${NC}"

# Load configuration
if [ -f "../aws-config.json" ]; then
  BUCKET_NAME=$(jq -r '.bucketName // empty' ../aws-config.json)
  CLOUDFRONT_DISTRIBUTION_ID=$(jq -r '.cloudfrontDistributionId // empty' ../aws-config.json)
  API_ID=$(jq -r '.apiGatewayId // empty' ../aws-config.json)
  DB_INSTANCE_ID=$(jq -r '.dbInstanceId // empty' ../aws-config.json)
else
  echo "⚠️  aws-config.json not found. Using default names..."
  BUCKET_NAME=""
  CLOUDFRONT_DISTRIBUTION_ID=""
  API_ID=""
  DB_INSTANCE_ID="$PROJECT_NAME-db"
fi

# Function to delete with error handling
safe_delete() {
  local resource_type=$1
  local command=$2
  local resource_name=$3
  
  echo "🗑️  Deleting $resource_type: $resource_name"
  if eval "$command" >/dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Deleted successfully${NC}"
  else
    echo -e "   ${YELLOW}⚠️  Not found or already deleted${NC}"
  fi
}

# 1. Delete CloudFront Distribution
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  echo "☁️  Disabling CloudFront distribution..."
  
  # Get current config
  ETAG=$(aws cloudfront get-distribution-config \
    --id $CLOUDFRONT_DISTRIBUTION_ID \
    --query 'ETag' \
    --output text 2>/dev/null || echo "")
  
  if [ -n "$ETAG" ]; then
    # Disable distribution first
    aws cloudfront get-distribution-config \
      --id $CLOUDFRONT_DISTRIBUTION_ID \
      --query 'DistributionConfig' > distribution-config.json 2>/dev/null || true
    
    if [ -f "distribution-config.json" ]; then
      jq '.Enabled = false' distribution-config.json > distribution-config-disabled.json
      
      aws cloudfront update-distribution \
        --id $CLOUDFRONT_DISTRIBUTION_ID \
        --distribution-config file://distribution-config-disabled.json \
        --if-match $ETAG >/dev/null 2>&1 || true
      
      echo "⏳ Waiting for CloudFront distribution to deploy (this may take 10-15 minutes)..."
      aws cloudfront wait distribution-deployed --id $CLOUDFRONT_DISTRIBUTION_ID 2>/dev/null || true
      
      # Delete distribution
      NEW_ETAG=$(aws cloudfront get-distribution-config \
        --id $CLOUDFRONT_DISTRIBUTION_ID \
        --query 'ETag' \
        --output text 2>/dev/null || echo "")
      
      if [ -n "$NEW_ETAG" ]; then
        safe_delete "CloudFront Distribution" \
          "aws cloudfront delete-distribution --id $CLOUDFRONT_DISTRIBUTION_ID --if-match $NEW_ETAG" \
          "$CLOUDFRONT_DISTRIBUTION_ID"
      fi
      
      rm -f distribution-config.json distribution-config-disabled.json
    fi
  fi
fi

# 2. Delete S3 Bucket
if [ -n "$BUCKET_NAME" ]; then
  # Empty bucket first
  echo "📦 Emptying S3 bucket..."
  aws s3 rm s3://$BUCKET_NAME --recursive >/dev/null 2>&1 || true
  
  safe_delete "S3 Bucket" \
    "aws s3 rb s3://$BUCKET_NAME" \
    "$BUCKET_NAME"
fi

# 3. Delete API Gateway
if [ -n "$API_ID" ]; then
  safe_delete "API Gateway" \
    "aws apigateway delete-rest-api --rest-api-id $API_ID" \
    "$API_ID"
fi

# 4. Delete Lambda Function
LAMBDA_FUNCTION_NAME="$PROJECT_NAME-api"
safe_delete "Lambda Function" \
  "aws lambda delete-function --function-name $LAMBDA_FUNCTION_NAME" \
  "$LAMBDA_FUNCTION_NAME"

# 5. Delete RDS Database
if [ -n "$DB_INSTANCE_ID" ]; then
  echo "🗄️  Deleting RDS database (this may take 5-10 minutes)..."
  aws rds delete-db-instance \
    --db-instance-identifier $DB_INSTANCE_ID \
    --skip-final-snapshot \
    --delete-automated-backups >/dev/null 2>&1 || echo "   ⚠️  Database not found or already deleted"
  
  # Wait for deletion
  echo "⏳ Waiting for database deletion..."
  aws rds wait db-instance-deleted --db-instance-identifier $DB_INSTANCE_ID 2>/dev/null || true
  echo -e "   ${GREEN}✅ Database deleted${NC}"
fi

# 6. Delete DB Subnet Group
SUBNET_GROUP_NAME="$PROJECT_NAME-db-subnet-group"
safe_delete "DB Subnet Group" \
  "aws rds delete-db-subnet-group --db-subnet-group-name $SUBNET_GROUP_NAME" \
  "$SUBNET_GROUP_NAME"

# 7. Delete Security Group
SG_NAME="$PROJECT_NAME-db-sg"
SG_ID=$(aws ec2 describe-security-groups \
  --group-names $SG_NAME \
  --query 'SecurityGroups[0].GroupId' \
  --output text 2>/dev/null || echo "None")

if [ "$SG_ID" != "None" ]; then
  safe_delete "Security Group" \
    "aws ec2 delete-security-group --group-id $SG_ID" \
    "$SG_NAME ($SG_ID)"
fi

# 8. Delete IAM Role and Policies
ROLE_NAME="$PROJECT_NAME-lambda-role"
POLICY_NAME="$PROJECT_NAME-lambda-policy"
POLICY_ARN="arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME"

# Detach policies from role
echo "🔐 Cleaning up IAM resources..."
aws iam detach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
  >/dev/null 2>&1 || true

aws iam detach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole \
  >/dev/null 2>&1 || true

aws iam detach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn $POLICY_ARN \
  >/dev/null 2>&1 || true

# Delete custom policy
safe_delete "IAM Policy" \
  "aws iam delete-policy --policy-arn $POLICY_ARN" \
  "$POLICY_NAME"

# Delete role
safe_delete "IAM Role" \
  "aws iam delete-role --role-name $ROLE_NAME" \
  "$ROLE_NAME"

# 9. Clean up configuration files
echo "🧹 Cleaning up configuration files..."
rm -f ../aws-config.json
rm -f .env.database
rm -f ../../backend/lambda-handler.js
rm -f ../../backend-lambda.zip

echo ""
echo -e "${GREEN}✅ Teardown completed successfully!${NC}"
echo ""
echo "All AWS resources for the PRD Tool project have been deleted."
echo "You may see some resources take a few minutes to fully disappear from the AWS console."
echo ""
echo -e "${YELLOW}💰 Cost Impact:${NC}"
echo "• All ongoing charges should stop within 24 hours"
echo "• CloudFront distributions may take up to 24 hours to fully delete"
echo "• Check your AWS billing console to confirm charges have stopped"
echo ""
echo -e "${GREEN}Ready for a fresh deployment!${NC}"