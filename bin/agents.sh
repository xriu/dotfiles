#!/bin/bash

# Function to configure pi subagent roles
function agents_configuration() {

    # Copy subagent roles; the subagent manager rejects symlinked agent files
    mkdir -p ~/.pi/agent/subagent-manager/agents
    cp -R ${HOME}/dotfiles/home/.pi/agent/subagent-manager/agents/. ~/.pi/agent/subagent-manager/agents/

}
