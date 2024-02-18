# Function: ssm
# Description: Starts an AWS Systems Manager session to connect to an EC2 instance.
# Parameters:
#   - ID: The instance ID or private IP address of the EC2 instance.
#   - REGION (optional): The AWS region where the EC2 instance is located. Default is 'eu-west-1'.
#   - PROFILE (optional): The AWS profile to use for authentication. Default is 'default'.
# Usage: ssm <ID> [REGION] [PROFILE]
ssm() {
    ID=${1}
    REGION=${2:-'eu-west-1'}
    PROFILE=${3:-'default'}

    IPV4_PATTERN="([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})"
    if [[ ${ID} =~ ${IPV4_PATTERN} ]]; then
        ID=$(aws ec2 describe-instances \
            --filters "Name=private-ip-address,Values=$1" \
            --query 'Reservations[0].Instances[0].InstanceId' \
            --output text \
            --region ${REGION} \
            --profile ${PROFILE})
    fi

    aws ssm start-session --target ${ID} --region ${REGION} --profile ${PROFILE}
}
