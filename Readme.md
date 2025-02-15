# Dotfiles for Mac OS

## Installation

```
git clone https://github.com/xriu/dotfiles.git ~/dotfiles
cd ~/dotfiles
./setup.sh
```

## FZF

#### To install useful key bindings and fuzzy completion

```
/opt/homebrew/opt/fzf/install
```

## Github Copilot CLI

#### Execute manually for first time

```
gh copilot alias -- zsh
```

## NVM

```
nvm install node
nvm use system
```

## Jenv

```
jenv add $(/usr/libexec/java_home)
jenv add /Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
jenv add /Library/Java/JavaVirtualMachines/temurin-18.jdk/Contents/Home
jenv add /Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home
jenv add /Library/Java/JavaVirtualMachines/temurin-22.jdk/Contents/Home
```

## LM-Build

```
cd ~/.GIS-lm-build
rm -rf local
bin/lm install
```

## NX

```
pnpm add --global nx@latest
```

## VSCode workspace cleanup

```
/Users/.../Library/Application Support/Code/User
```

## Ghostty

```
font-size = 13
theme = GruvboxDarkHard
background = 1C2021
window-padding-balance = true
window-save-state = always
scrollback-limit = 4294967295
copy-on-select = clipboard
keybind = global:º=toggle_visibility
```

# Dotfiles for Windows 11

## CloudFlare DNS

```
1.1.1.1
1.0.0.1
```

## Christitus (Enable Hyper-V)

```
iwr -useb https://christitus.com/win | iex
```

## WinGet Upgrade

```
winget upgrade
```

## WinGet Install

```
winget install -e --id glzr-io.glazewm
winget install -e --id Starship.Starship
winget install -e --id Git.Git
winget install -e --id Microsoft.PCManager
winget install -e --id Microsoft.VisualStudioCode
winget install -e --id Anysphere.Cursor
winget install -e --id Cloudflare.Warp
winget install -e --id Zen-Team.Zen-Browser
winget install -e --id Discord.Discord
winget install -e --id Microsoft.PowerToys
winget install -e --id CPUID.HWMonitor
winget install -e --id Guru3D.Afterburner
winget install -e --id Valve.Steam
winget install -e --id RiotGames.LeagueOfLegends.EUW
winget install -e --id Microsoft.PowerShell
winget install -e --id Ventoy.Ventoy
winget install -e --id Nvidia.GeForceApp -> ???
winget install -e --id TechPowerUp.GPU-Z -> ???
```
