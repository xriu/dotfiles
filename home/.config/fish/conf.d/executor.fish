# macOS 27 rejects Executor's ad-hoc keyring addon, so the default data directory cannot reach the Keychain.
# Point every executor command at a file-key directory instead. Delete this file once upstream fixes the signing.
# https://github.com/UsefulSoftwareCo/executor/issues/2562
set -gx EXECUTOR_DATA_DIR $HOME/.executor/v2/cli-file
set -gx EXECUTOR_KEY_STORAGE file
