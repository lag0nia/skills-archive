#!/usr/bin/env bash
# Install skills from lag0nia/skills-archive into Claude Code, Codex and Hermes.
#
#   install.sh [targets] [skill ...]
#
# Targets (default: --claude --codex):
#   --claude      link into ~/.claude/skills   (override: CLAUDE_SKILLS_DIR)
#   --codex       link into ~/.agents/skills   (override: CODEX_SKILLS_DIR)
#   --hermes      install with `hermes skills install` from GitHub (override: HERMES_BIN)
#   --all         all three
# Other options:
#   --list        list the skills in the archive and exit
#   --uninstall   remove the selected skills from the selected targets
#
# With no skill names, every skill under skills/ is used.
# Run from a clone, it links that clone. Run any other way (for example piped
# from curl), it clones or updates ${SKILLS_ARCHIVE_DIR:-~/.skills-archive}.
set -euo pipefail

REPO_SLUG="lag0nia/skills-archive"
REPO_URL="https://github.com/${REPO_SLUG}.git"

claude=0 codex=0 hermes=0 list=0 uninstall=0
names=()
for arg in "$@"; do
  case "$arg" in
    --claude) claude=1 ;;
    --codex) codex=1 ;;
    --hermes) hermes=1 ;;
    --all) claude=1 codex=1 hermes=1 ;;
    --list) list=1 ;;
    --uninstall) uninstall=1 ;;
    -h|--help) sed -n '2,17p' "${BASH_SOURCE[0]:-/dev/null}" 2>/dev/null | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) echo "Unknown option: $arg (see --help)" >&2; exit 2 ;;
    *) names+=("$arg") ;;
  esac
done
if (( claude + codex + hermes == 0 )); then claude=1 codex=1; fi

# Locate the archive: this clone, or a managed clone.
script="${BASH_SOURCE[0]:-}"
if [[ -f "$script" && -d "$(dirname "$script")/skills" ]]; then
  repo="$(cd "$(dirname "$script")" && pwd)"
else
  repo="${SKILLS_ARCHIVE_DIR:-$HOME/.skills-archive}"
  if [[ -d "$repo/.git" ]]; then
    git -C "$repo" pull --ff-only --quiet
  else
    git clone --quiet "$REPO_URL" "$repo"
  fi
fi

if (( ${#names[@]} == 0 )); then
  for dir in "$repo"/skills/*/; do
    [[ -f "$dir/SKILL.md" ]] && names+=("$(basename "$dir")")
  done
fi

if (( list )); then
  for name in "${names[@]}"; do
    desc="$(sed -n 's/^description: //p' "$repo/skills/$name/SKILL.md" | head -1)"
    printf '%-20s %s\n' "$name" "${desc:0:100}"
  done
  exit 0
fi

for name in "${names[@]}"; do
  if [[ ! -f "$repo/skills/$name/SKILL.md" ]]; then
    echo "No such skill: $name (try --list)" >&2; exit 1
  fi
done

link_into() {  # <label> <skills dir>
  local label="$1" dir="$2" name src dest
  mkdir -p "$dir"
  for name in "${names[@]}"; do
    src="$repo/skills/$name" dest="$dir/$name"
    if (( uninstall )); then
      if [[ -L "$dest" ]]; then rm "$dest"; echo "$label: removed $name"; fi
      continue
    fi
    if [[ -e "$dest" && ! -L "$dest" ]]; then
      echo "$label: skipped $name ($dest exists and is not a link; remove it first)" >&2
      continue
    fi
    ln -sfn "$src" "$dest"
    echo "$label: $name -> $dest"
  done
}

(( claude )) && link_into claude "${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
(( codex )) && link_into codex "${CODEX_SKILLS_DIR:-$HOME/.agents/skills}"

if (( hermes )); then
  hermes_bin="${HERMES_BIN:-hermes}"
  if ! command -v "$hermes_bin" >/dev/null 2>&1; then
    echo "hermes: '$hermes_bin' not found; set HERMES_BIN or run this where Hermes is installed" >&2
    exit 1
  fi
  for name in "${names[@]}"; do
    if (( uninstall )); then
      "$hermes_bin" skills uninstall "$name"
    else
      # Hermes fetches from GitHub, so it installs what is pushed to main.
      "$hermes_bin" skills install "$REPO_SLUG/skills/$name" --yes
    fi
  done
fi
