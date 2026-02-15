#!/usr/bin/env bash
# Launch a single EC2 instance (Ubuntu 22.04, t3.large, 30 GiB). No JONI install.
# Requires: AWS CLI configured, existing key pair (KEY_NAME).
# Outputs: INSTANCE_ID=... and PUBLIC_IP=... for the server to parse.

set -e
REGION="${AWS_REGION:-us-east-1}"
KEY_NAME="${KEY_NAME:-joni-key}"
SG_NAME="joni-ec2-only-sg"
INSTANCE_TYPE="${INSTANCE_TYPE:-t3.large}"

# Latest Ubuntu 22.04 LTS AMI (Canonical)
AMI_ID=$(aws ec2 describe-images \
  --region "$REGION" \
  --owners 099720109477 \
  --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" "Name=state,Values=available" \
  --query "sort_by(Images, &CreationDate) | [-1].ImageId" \
  --output text)

if [ -z "$AMI_ID" ] || [ "$AMI_ID" == "None" ]; then
  echo "ERROR: Could not find Ubuntu 22.04 AMI in $REGION" >&2
  exit 1
fi

# Security group: create if not exists (SSH 22 from anywhere)
SG_ID=$(aws ec2 describe-security-groups --region "$REGION" --filters "Name=group-name,Values=$SG_NAME" --query "SecurityGroups[0].GroupId" --output text 2>/dev/null || true)
if [ -z "$SG_ID" ] || [ "$SG_ID" == "None" ]; then
  VPC_ID=$(aws ec2 describe-vpcs --region "$REGION" --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)
  SG_ID=$(aws ec2 create-security-group --region "$REGION" --group-name "$SG_NAME" --description "JONI EC2-only SSH" --vpc-id "$VPC_ID" --query "GroupId" --output text)
  aws ec2 authorize-security-group-ingress --region "$REGION" --group-id "$SG_ID" --protocol tcp --port 22 --cidr 0.0.0.0/0
fi

# Launch instance (30 GiB gp3 root volume)
OUT=$(aws ec2 run-instances \
  --region "$REGION" \
  --image-id "$AMI_ID" \
  --instance-type "$INSTANCE_TYPE" \
  --key-name "$KEY_NAME" \
  --security-group-ids "$SG_ID" \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]' \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=JONI-EC2-only}]" \
  --query "Instances[0].InstanceId" \
  --output text)

INSTANCE_ID="$OUT"
if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" == "None" ]; then
  echo "ERROR: run-instances failed" >&2
  exit 1
fi

echo "Instance ID: $INSTANCE_ID"
aws ec2 wait instance-running --region "$REGION" --instance-ids "$INSTANCE_ID"

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances --region "$REGION" --instance-ids "$INSTANCE_ID" \
  --query "Reservations[0].Instances[0].PublicIpAddress" --output text)

# Output for server parsing
echo "INSTANCE_ID=$INSTANCE_ID"
echo "PUBLIC_IP=$PUBLIC_IP"
echo "REGION=$REGION"
