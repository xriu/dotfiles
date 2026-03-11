# Function: ssm
# Description: Starts an AWS Systems Manager session to connect to an EC2 instance.
# Parameters:
#   - ID: The instance ID or private IP address of the EC2 instance.
#   - REGION (optional): The AWS region where the EC2 instance is located. Default is 'eu-west-1'.
#   - PROFILE (optional): The AWS profile to use for authentication. Default is 'default'.
# Usage: ssm <ID> [REGION] [PROFILE]
function ssm
    set -l ID $argv[1]
    set -l REGION (test (count $argv) -ge 2; and echo $argv[2]; or echo 'eu-west-1')
    set -l PROFILE (test (count $argv) -ge 3; and echo $argv[3]; or echo 'default')

    if string match -rq '^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$' $ID
        set ID (aws ec2 describe-instances \
            --filters "Name=private-ip-address,Values=$argv[1]" \
            --query 'Reservations[0].Instances[0].InstanceId' \
            --output text \
            --region $REGION \
            --profile $PROFILE)
    end

    aws ssm start-session --target $ID --region $REGION --profile $PROFILE
end
