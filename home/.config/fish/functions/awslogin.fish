# function awslogin --description 'Log in to both IAM Identity Center portals'
#     aws sso login --sso-session lm-global; or return
#     aws sso login --sso-session lm-cn --use-device-code
# end

function awslogin --description 'Log in to both IAM Identity Center portals'
    aws sso login --sso-session lm-global --use-device-code; or return
    aws sso login --sso-session lm-cn --use-device-code
end
