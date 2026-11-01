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
curl -fsSL https://teamwork-graph.atlassian.com/cli/install | bash
```

## YT Transcript

```
yt-dlp -x --audio-format wav -o demo "URL"
uvx --from mlx-whisper mlx_whisper demo.wav \
  --model mlx-community/whisper-large-v3-turbo \
  --output-dir tr --output-format all
```

## Hex (Catalan)

The `hex` binary is not on `PATH`. Use the app binary:

```
HEX="/Applications/Hex.app/Contents/MacOS/hex"
$HEX model install whisper_large_v3_turbo
$HEX model use whisper_large_v3_turbo --language ca
```

Only `whisper_large_v3_turbo` has Catalan built in. Parakeet v3 (the default) has 25 European languages and rejects `ca`.

Better Catalan accuracy with no punctuation: the BSC Catalan verification model A, imported as `custom-64721d1077b9ed7c`.

```
$HEX model use custom-64721d1077b9ed7c --language ca
```

The GGUF is at `~/Develop/models/pkt-a-ca-Q8_0.gguf`. Re-import with `$HEX model import` if Hex loses its copy.

Measured WER on 100 FLEURS `ca_es` utterances:

| Model                        | WER    | Speed | Caps and punctuation |
| ---------------------------- | ------ | ----- | -------------------- |
| BSC pkt-a (RNNT 1.1B)        | 4.71%  | 22x   | no                   |
| whisper_large_v3_turbo       | 5.35%  | 6x    | yes                  |
| softcatala whisper-medium-ca | 8.71%  | 7.9x  | yes                  |
| softcatala whisper-base-ca   | 17.61% | 49x   | yes                  |

Known risk: Whisper adds hallucinated text after trailing silence (a test clip ended with "F 40."). Check short dictations.

`hex status --json` shows the selected model and language.
