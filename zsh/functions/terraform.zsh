# Function: tfinit
# Description: Initializes Terraform for a specific environment and region.
# Parameters:
#   - ENV: The environment name.
#   - REGION: The region name (default: 'eu-west-1').
# Returns:
#   - 0: Success.
#   - 1: Error.
tfinit() {
    ENV=${1}
    REGION=${2:-'eu-west-1'}

    # Find Terraform configuration files
    L_VARS=$(find "." -type f -name "${ENV}.tfvars")
    L_BACKEND=$(find "." -type f -name "${ENV}.tfbackend")
    TF_VARS=$(echo ${L_VARS} | grep -i ${REGION} || echo ${L_VARS})
    TF_BACKEND=$(echo ${L_BACKEND} | grep -i ${REGION} || echo ${L_BACKEND})

    # Check if Terraform configuration exists
    if [[ ! -e "terraform.tf" ]]; then
        fexec "ERROR: Terraform configuration NOT found!"
        return 1
    elif [[ -z "${ENV}" ]] && [[ -d "environment" ]]; then
        fexec "ERROR: Environment NOT specified!"
        return 1
    elif [[ -n ${ENV} ]] && [[ -z ${TF_VARS} ]]; then
        fexec "ERROR: ${ENV}.tfvars NOT found!"
        return 1
    else
        # Remove Terraform Cache
        cexec rm -fR .terragrunt-cache
        cexec rm -fR .terraform
        cexec rm -fR .terraform.lock.hcl
        cexec tfswitch # Init Tfswitch
    fi

    # Terraform Init
    if [[ "${TF_BACKEND}" == *"tfbackend"* ]]; then
        TF_VARS=${TF_BACKEND//tfbackend/tfvars}
        cexec terraform init -upgrade -reconfigure -backend-config="${TF_BACKEND}" -var-file="${TF_VARS}"
    elif [[ "${TF_VARS}" == *"tfvars"* ]]; then
        cexec terraform init -upgrade -reconfigure -var-file="${TF_VARS}"
    else
        cexec terraform init -upgrade -reconfigure
    fi

    # Terraform Workspace List
    cexec terraform workspace list

    # Terraform Workspace Select
    if [[ "$(pwd)" == *"base"* ]]; then
        cexec terraform workspace select default
    else
        cexec terraform workspace select ${ENV}
    fi
}

# Function: tfplan
# Description: Executes Terraform plan command with the specified environment and region.
# Parameters:
#   - ENV: The environment name.
#   - REGION: The region name (default: 'eu-west-1').
tfplan() {
    tfchanges plan ${1} ${2}
}

# Function: tfapply
# Description: Executes Terraform apply command with the specified environment, region, and auto-approve flag.
# Parameters:
#   - ENV: The environment name.
#   - REGION: The region name (default: 'eu-west-1').
#   - AUTO_APPROVE: Flag to automatically approve changes (optional).
tfapply() {
    tfchanges apply ${1} ${2} ${3}
}

# Function: tfchanges
# Description: Executes Terraform plan or apply command with the specified method, environment, region, and auto-approve flag.
# Parameters:
#   - METHOD: The Terraform method (plan or apply, default: 'plan').
#   - ENV: The environment name.
#   - REGION: The region name (default: 'eu-west-1').
#   - AUTO_APPROVE: Flag to automatically approve changes (optional).
tfchanges() {
    METHOD=${1:-'plan'}
    ENV=${2}
    REGION=${3:-'eu-west-1'}
    AUTO_APPROVE=${4}

    # Find Terraform configuration files
    L_VARS=$(find "." -type f -name "${ENV}.tfvars")
    TF_VARS=$(echo ${L_VARS} | grep -i ${REGION} || echo ${L_VARS})

    # Terraform Plan/Apply
    if [[ "${TF_VARS}" == *"tfvars"* ]]; then
        if [[ "${AUTO_APPROVE}" == "-auto-approve" ]]; then
            cexec terraform ${METHOD} -var-file="${TF_VARS}" -auto-approve
        else
            cexec terraform ${METHOD} -var-file="${TF_VARS}"
        fi
    else
        if [[ "${AUTO_APPROVE}" == "-auto-approve" ]]; then
            cexec terraform ${METHOD} -auto-approve
        else
            cexec terraform ${METHOD}
        fi
    fi
}
