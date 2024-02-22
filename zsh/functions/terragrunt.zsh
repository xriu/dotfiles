# Function: tginit
# Description: Removes Terraform cache and initializes Terragrunt.
# Usage: tginit
tginit() {
    # Remove Terraform Cache
    cexec rm -fR .terragrunt-cache
    cexec rm -fR .terraform
    cexec rm -fR .terraform.lock.hcl
    find . -type d -name ".terragrunt-cache" -prune -exec rm -rf {} \;

    # Terraform Init
    cexec terragrunt init
}

# Function: tgplan
# Description: Runs Terragrunt plan for all modules.
# Usage: tgplan
tgplan() {
    cexec terragrunt plan
}

# Function: tgapply
# Description: Runs Terragrunt apply for all modules.
# Usage: tgapply
tgapply() {
    cexec terragrunt apply
}
