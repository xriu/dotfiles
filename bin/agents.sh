#!/bin/bash

# Function to configure pi subagent roles
function agents_configuration() {

    # Copy subagent roles and settings; the subagent manager rejects symlinks
    mkdir -p ~/.pi/agent/subagent-manager/agents
    cp -R ${HOME}/dotfiles/home/.pi/agent/subagent-manager/agents/. ~/.pi/agent/subagent-manager/agents/
    cp ${HOME}/dotfiles/home/.pi/agent/subagent-manager/settings.json ~/.pi/agent/subagent-manager/settings.json

}
