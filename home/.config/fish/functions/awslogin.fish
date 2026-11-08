function awslogin --description 'Log in to both IAM Identity Center portals'
    aws sso login --sso-session lm-global; or return
    aws sso login --sso-session lm-cn
end
