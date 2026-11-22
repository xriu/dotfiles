# Executor ships its Developer ID binary (team A7SQ9BT93Y) with the hardened
# runtime and without the disable-library-validation entitlement. macOS Library
# Validation therefore rejects its bundled ad-hoc-signed @napi-rs/keyring addon
# (team none), and the Keychain is unreachable. Executor never moves keys between
# storages inside one data dir, so this install keeps keys.json in its own dir.
# Signal: log show --last 5m --predicate 'eventMessage CONTAINS "Library Validation"'
# Delete this file when the addon is signed with the Executor team ID.
# https://github.com/UsefulSoftwareCo/executor/issues/2562
set -gx EXECUTOR_DATA_DIR $HOME/.executor/v2/cli-file
set -gx EXECUTOR_KEY_STORAGE file
