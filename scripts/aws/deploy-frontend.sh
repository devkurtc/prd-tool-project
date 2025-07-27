#!/bin/bash

# Frontend Deployment Script for AWS S3 + CloudFront
# Usage: ./deploy-frontend.sh [bucket-name] [cloudfront-distribution-id]

set -e

# Configuration
BUCKET_NAME=${1:-"prd-tool-frontend-$(date +%s)"}
CLOUDFRONT_DISTRIBUTION_ID=${2:-""}
REGION=${AWS_REGION:-"us-east-1"}

echo "🚀 Deploying PRD Tool Frontend to AWS"
echo "Bucket: $BUCKET_NAME"
echo "Region: $REGION"

# Create S3 bucket if it doesn't exist
echo "📦 Creating S3 bucket..."
aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null || echo "Bucket already exists"

# Configure bucket for static website hosting
echo "🌐 Configuring static website hosting..."
aws s3 website s3://$BUCKET_NAME \
  --index-document index.html \
  --error-document index.html

# Set bucket policy for public read access
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket $BUCKET_NAME \
  --policy file://bucket-policy.json

# Build the frontend
echo "🔨 Building frontend application..."
cd ../../frontend
npm install
npm run build

# Deploy to S3
echo "📤 Uploading to S3..."
aws s3 sync dist/ s3://$BUCKET_NAME \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "*.html" \
  --exclude "*.json"

# Upload HTML files with shorter cache
aws s3 sync dist/ s3://$BUCKET_NAME \
  --delete \
  --cache-control "public, max-age=300" \
  --include "*.html" \
  --include "*.json"

# Create CloudFront distribution if not provided
if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  echo "☁️ Creating CloudFront distribution..."
  
  cat > cloudfront-config.json << EOF
{
  "CallerReference": "prd-tool-$(date +%s)",
  "Comment": "PRD Tool Frontend Distribution",
  "DefaultCacheBehavior": {
    "TargetOriginId": "$BUCKET_NAME",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true
  },
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "$BUCKET_NAME",
        "DomainName": "$BUCKET_NAME.s3-website-$REGION.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "Enabled": true,
  "PriceClass": "PriceClass_100",
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  }
}
EOF

  DISTRIBUTION_RESULT=$(aws cloudfront create-distribution \
    --distribution-config file://cloudfront-config.json)
  
  CLOUDFRONT_DISTRIBUTION_ID=$(echo $DISTRIBUTION_RESULT | jq -r '.Distribution.Id')
  CLOUDFRONT_URL=$(echo $DISTRIBUTION_RESULT | jq -r '.Distribution.DomainName')
  
  echo "✅ CloudFront distribution created: $CLOUDFRONT_DISTRIBUTION_ID"
  echo "🌍 Frontend URL: https://$CLOUDFRONT_URL"
else
  # Invalidate existing CloudFront cache
  echo "🔄 Invalidating CloudFront cache..."
  aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*"
  
  CLOUDFRONT_URL=$(aws cloudfront get-distribution \
    --id $CLOUDFRONT_DISTRIBUTION_ID \
    --query 'Distribution.DomainName' \
    --output text)
  
  echo "🌍 Frontend URL: https://$CLOUDFRONT_URL"
fi

# Save configuration for other scripts
cat > ../aws-config.json << EOF
{
  "bucketName": "$BUCKET_NAME",
  "cloudfrontDistributionId": "$CLOUDFRONT_DISTRIBUTION_ID",
  "cloudfrontUrl": "https://$CLOUDFRONT_URL",
  "region": "$REGION"
}
EOF

# Cleanup temporary files
rm -f bucket-policy.json cloudfront-config.json

echo "✅ Frontend deployment completed successfully!"
echo "📝 Configuration saved to scripts/aws-config.json"
echo ""
echo "Next steps:"
echo "1. Wait 10-15 minutes for CloudFront distribution to deploy"
echo "2. Test your frontend at: https://$CLOUDFRONT_URL"
echo "3. Deploy the backend with: ./deploy-backend.sh"