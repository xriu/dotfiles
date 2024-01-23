tginit() {
    # Remove Terraform Cache
    cexec rm -fR .terragrunt-cache
    cexec rm -fR .terraform
    cexec rm -fR .terraform.lock.hcl

    # Terraform Init
    cexec terragrunt init
}
