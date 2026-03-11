#!/usr/bin/env fish

# Function: tfinit
# Description: Initializes Terraform for a specific environment and region.
# Parameters:
#   - ENV: The environment name.
#   - REGION: The region name (default: 'eu-west-1').
# Returns:
#   - 0: Success.
#   - 1: Error.
function tfinit
    set -l ENV $argv[1]
    set -l REGION (test (count $argv) -ge 2; and echo $argv[2]; or echo 'eu-west-1')

    # Find Terraform configuration files
    set -l L_VARS (find "." -type f -name "$ENV.tfvars")
    set -l L_BACKEND (find "." -type f -name "$ENV.tfbackend")
    set -l TF_VARS (echo $L_VARS | grep -i $REGION; or echo $L_VARS)
    set -l TF_BACKEND (echo $L_BACKEND | grep -i $REGION; or echo $L_BACKEND)

    # Check if Terraform configuration exists
    if not test -e "terraform.tf"
        fexec "ERROR: Terraform configuration NOT found!"
        return 1
    else if test -z "$ENV"; and test -d "environment"
        fexec "ERROR: Environment NOT specified!"
        return 1
    else if test -n "$ENV"; and test -z "$TF_VARS"
        fexec "ERROR: $ENV.tfvars NOT found!"
        return 1
    else
        # Remove Terraform Cache
        cexec rm -fR .terragrunt-cache
        cexec rm -fR .terraform
        cexec rm -fR .terraform.lock.hcl
        cexec tfswitch # Init Tfswitch
    end

    # Terraform Init
    if string match -q "*tfbackend*" "$TF_BACKEND"
        set TF_VARS (string replace "tfbackend" "tfvars" $TF_BACKEND)
        cexec terraform init -upgrade -reconfigure -backend-config="$TF_BACKEND" -var-file="$TF_VARS"
    else if string match -q "*tfvars*" "$TF_VARS"
        cexec terraform init -upgrade -reconfigure -var-file="$TF_VARS"
    else
        cexec terraform init -upgrade -reconfigure
    end

    # Terraform Workspace List
    cexec terraform workspace list

    # Terraform Workspace Select
    if string match -q "*/base*" (pwd)
        cexec terraform workspace select default
    else
        cexec terraform workspace select $ENV
    end
end

# Function: tfplan
# Description: Executes Terraform plan command with the specified environment and region.
# Parameters:
#   - ENV: The environment name.
#   - REGION: The region name (default: 'eu-west-1').
function tfplan
    tfchanges plan $argv[1] $argv[2]
end

# Function: tfapply
# Description: Executes Terraform apply command with the specified environment, region, and auto-approve flag.
# Parameters:
#   - ENV: The environment name.
#   - REGION: The region name (default: 'eu-west-1').
#   - AUTO_APPROVE: Flag to automatically approve changes (optional).
function tfapply
    tfchanges apply $argv[1] $argv[2] $argv[3]
end

# Function: tfchanges
# Description: Executes Terraform plan or apply command with the specified method, environment, region, and auto-approve flag.
# Parameters:
#   - METHOD: The Terraform method (plan or apply, default: 'plan').
#   - ENV: The environment name.
#   - REGION: The region name (default: 'eu-west-1').
#   - AUTO_APPROVE: Flag to automatically approve changes (optional).
function tfchanges
    set -l METHOD (test -n "$argv[1]"; and echo $argv[1]; or echo 'plan')
    set -l ENV $argv[2]
    set -l REGION (test (count $argv) -ge 3; and echo $argv[3]; or echo 'eu-west-1')
    set -l AUTO_APPROVE $argv[4]

    # Find Terraform configuration files
    set -l L_VARS (find "." -type f -name "$ENV.tfvars")
    set -l TF_VARS (echo $L_VARS | grep -i $REGION; or echo $L_VARS)

    # Terraform Plan/Apply
    if string match -q "*tfvars*" "$TF_VARS"
        if test "$AUTO_APPROVE" = "-auto-approve"
            cexec terraform $METHOD -var-file="$TF_VARS" -auto-approve
        else
            cexec terraform $METHOD -var-file="$TF_VARS"
        end
    else
        if test "$AUTO_APPROVE" = "-auto-approve"
            cexec terraform $METHOD -auto-approve
        else
            cexec terraform $METHOD
        end
    end
end
