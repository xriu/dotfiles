tginit() {
    # Remove Terraform Cache
    cexec rm -fR .terragrunt-cache
    cexec rm -fR .terraform
    cexec rm -fR .terraform.lock.hcl
    find . -type d -name ".terragrunt-cache" -prune -exec rm -rf {} \;

    # Terraform Init
    cexec terragrunt init
}

tgplan() {
    cexec terragrunt plan
}

tgapply() {
    cexec terragrunt apply
}
