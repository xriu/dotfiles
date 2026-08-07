# Dotfiles

## Installation

```
git clone https://github.com/xriu/dotfiles.git ~/dotfiles
cd ~/dotfiles
./setup.sh
```

## Jenv

```
jenv add $(/usr/libexec/java_home)
jenv add /Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home
jenv add /Library/Java/JavaVirtualMachines/temurin-22.jdk/Contents/Home
jenv add /Library/Java/JavaVirtualMachines/temurin-24.jdk/Contents/Home
```

## LM-Build

```
cd ~/.GIS-lm-build
rm -rf local
bin/lm install
```

## Others (no homebrew)

```
curl -fsSL --retry 2 https://app.primeintellect.ai/prime-agent/install.sh | sh
curl -fsSL --retry 2 https://teamwork-graph.atlassian.com/cli/install | bash
```
