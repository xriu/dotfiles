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

## Other

```
curl -fsSL https://kunchenguid.github.io/treehouse/install.sh | sh
curl -fsSL https://raw.githubusercontent.com/kunchenguid/no-mistakes/main/docs/install.sh | sh
```
