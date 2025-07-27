#!/bin/bash

# Database Setup Script for AWS RDS PostgreSQL
# Usage: ./setup-database.sh [password]

set -e

# Configuration
PROJECT_NAME="prd-tool"
REGION=${AWS_REGION:-"us-east-1"}
DB_INSTANCE_ID="$PROJECT_NAME-db"
DB_NAME="prdtool"
DB_USERNAME="prdtool"
DB_PASSWORD=${1:-"YourSecurePassword123!"}

echo "🗄️  Setting up RDS PostgreSQL database"
echo "Instance ID: $DB_INSTANCE_ID"
echo "Database: $DB_NAME"
echo "Username: $DB_USERNAME"
echo "Region: $REGION"

# Create security group for RDS
echo "🔐 Creating security group..."
SG_NAME="$PROJECT_NAME-db-sg"
SG_DESCRIPTION="Security group for PRD Tool database"

# Check if security group exists
SG_ID=$(aws ec2 describe-security-groups \
  --group-names $SG_NAME \
  --query 'SecurityGroups[0].GroupId' \
  --output text 2>/dev/null || echo "None")

if [ "$SG_ID" == "None" ]; then
  echo "Creating new security group..."
  SG_RESULT=$(aws ec2 create-security-group \
    --group-name $SG_NAME \
    --description "$SG_DESCRIPTION")
  SG_ID=$(echo $SG_RESULT | jq -r '.GroupId')
  
  # Add inbound rule for PostgreSQL
  aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 5432 \
    --cidr 0.0.0.0/0
else
  echo "Using existing security group: $SG_ID"
fi

# Create DB subnet group for RDS
echo "🌐 Setting up DB subnet group..."
SUBNET_GROUP_NAME="$PROJECT_NAME-db-subnet-group"

# Get default VPC
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=is-default,Values=true" \
  --query 'Vpcs[0].VpcId' \
  --output text)

# Get subnets in the default VPC
SUBNET_IDS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[].SubnetId' \
  --output text | tr '\t' ' ')

# Create subnet group if it doesn't exist
if ! aws rds describe-db-subnet-groups \
  --db-subnet-group-name $SUBNET_GROUP_NAME >/dev/null 2>&1; then
  echo "Creating DB subnet group..."
  aws rds create-db-subnet-group \
    --db-subnet-group-name $SUBNET_GROUP_NAME \
    --db-subnet-group-description "Subnet group for PRD Tool database" \
    --subnet-ids $SUBNET_IDS
else
  echo "Using existing DB subnet group: $SUBNET_GROUP_NAME"
fi

# Create RDS instance
echo "🏗️  Creating RDS instance..."
if aws rds describe-db-instances \
  --db-instance-identifier $DB_INSTANCE_ID >/dev/null 2>&1; then
  echo "Database instance already exists: $DB_INSTANCE_ID"
  
  # Get endpoint
  DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_ID \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)
else
  echo "Creating new RDS instance (this may take 10-15 minutes)..."
  
  aws rds create-db-instance \
    --db-instance-identifier $DB_INSTANCE_ID \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15.3 \
    --master-username $DB_USERNAME \
    --master-user-password "$DB_PASSWORD" \
    --allocated-storage 20 \
    --storage-type gp2 \
    --vpc-security-group-ids $SG_ID \
    --db-subnet-group-name $SUBNET_GROUP_NAME \
    --backup-retention-period 7 \
    --multi-az false \
    --publicly-accessible true \
    --storage-encrypted false \
    --db-name $DB_NAME \
    --deletion-protection false

  echo "⏳ Waiting for database to become available..."
  aws rds wait db-instance-available --db-instance-identifier $DB_INSTANCE_ID

  # Get endpoint
  DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_ID \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)
fi

echo "📡 Database endpoint: $DB_ENDPOINT"

# Create database connection string
DATABASE_URL="postgresql://$DB_USERNAME:$DB_PASSWORD@$DB_ENDPOINT:5432/$DB_NAME"

# Test database connection
echo "🔍 Testing database connection..."
if command -v psql >/dev/null 2>&1; then
  echo "Testing connection with psql..."
  export PGPASSWORD="$DB_PASSWORD"
  
  # Simple connection test
  if psql -h $DB_ENDPOINT -U $DB_USERNAME -d $DB_NAME -c "SELECT version();" >/dev/null 2>&1; then
    echo "✅ Database connection successful!"
  else
    echo "⚠️  Database connection test failed. This is normal for new instances."
    echo "Please wait a few minutes and try again."
  fi
  
  unset PGPASSWORD
else
  echo "⚠️  psql not found. Install PostgreSQL client to test connection."
fi

# Run Prisma migrations if available
if [ -f "../../prisma/schema.prisma" ]; then
  echo "🔄 Running Prisma migrations..."
  cd ../../
  
  # Set database URL for Prisma
  export DATABASE_URL="$DATABASE_URL"
  
  # Install Prisma if not available
  if ! command -v prisma >/dev/null 2>&1; then
    npm install -g prisma
  fi
  
  # Run migrations
  prisma migrate deploy --schema=./prisma/schema.prisma || echo "⚠️  Migration failed. Run manually later."
  
  # Generate Prisma client
  prisma generate --schema=./prisma/schema.prisma
  
  cd scripts/aws
else
  echo "⚠️  Prisma schema not found. Skipping migrations."
fi

# Update configuration
if [ -f "../aws-config.json" ]; then
  # Update existing config
  jq --arg db_endpoint "$DB_ENDPOINT" \
     --arg database_url "$DATABASE_URL" \
     '. + {dbEndpoint: $db_endpoint, databaseUrl: $database_url}' \
     ../aws-config.json > ../aws-config-temp.json
  mv ../aws-config-temp.json ../aws-config.json
else
  # Create new config
  cat > ../aws-config.json << EOF
{
  "dbEndpoint": "$DB_ENDPOINT",
  "databaseUrl": "$DATABASE_URL",
  "dbInstanceId": "$DB_INSTANCE_ID",
  "dbUsername": "$DB_USERNAME",
  "securityGroupId": "$SG_ID",
  "region": "$REGION"
}
EOF
fi

# Save database credentials securely
echo "🔐 Saving database configuration..."
cat > .env.database << EOF
DATABASE_URL=$DATABASE_URL
DB_HOST=$DB_ENDPOINT
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
EOF

echo "✅ Database setup completed successfully!"
echo "🔗 Connection string: $DATABASE_URL"
echo "📝 Configuration saved to scripts/aws-config.json"
echo "🔐 Credentials saved to scripts/aws/.env.database"
echo ""
echo "Next steps:"
echo "1. Test connection: psql '$DATABASE_URL'"
echo "2. Run migrations if needed: cd ../../ && prisma migrate deploy"
echo "3. Update Lambda environment variables with database URL"
echo ""
echo "⚠️  IMPORTANT: Keep your database password secure!"
echo "Consider using AWS Secrets Manager for production deployments."