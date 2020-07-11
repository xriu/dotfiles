# Dotfiles for Mac OS

Requirements

- Install prezto & zsh as shell (https://github.com/sorin-ionescu/prezto)
- Shell theme powerlevel9k (https://github.com/bhilburn/powerlevel9k)
- Fonts powerline (https://github.com/powerline/fonts)

***

## Installation

```
git clone https://github.com/xriu/dotfiles.git ~/dotfiles
cd ~/dotfiles
./setup.sh
```

***

## NVM prompt

```
nvm install node
nvm use system
```

***

## VS Code

VS Code sync extension
```
ext install code-settings-sync
```

***

## Jenv

```
jenv add $(/usr/libexec/java_home)
jenv global 14.0.1
```

***

## SSL

```
brew uninstall --ignore-dependencies openssl
brew install https://github.com/tebelorg/Tump/releases/download/v1.0.0/openssl.rb
cp /usr/local/opt/ope…ssl/lib/libcrypto.1.0.0.dylib ~/Downloads/
cp /usr/local/opt/ope…ssl/lib/libssl.1.0.0.dylib ~/Downloads/
brew uninstall --ignore-dependencies openssl
```

```
brew install openssl
ls /usr/local/Cellar/openssl*
mkdir -p /usr/local/Cellar/openssl/1.0.2t/lib
mv libcrypto.1.0.0.dylib /usr/local/Cellar/openssl/1.0.2t/lib
mv libssl.1.0.0.dylib /usr/local/Cellar/openssl/1.0.2t/lib
```

***

## CPAN

```
cpan App::cpanminus
cpan install YAML::XS
cpan install List::MoreUtils
cpan install IO::Socket::SSL
cpanm -n Carton
```
