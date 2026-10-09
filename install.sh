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
# With no skill names, all skills/ and third-party/<author>/ skills are used.
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

# Build one catalog for listing, validation, local links and remote installs.
skill_names=()
skill_paths=()
for dir in "$repo"/skills/* "$repo"/third-party/*/*; do
  [[ -f "$dir/SKILL.md" ]] || continue
  name="$(basename "$dir")"
  for existing in "${skill_names[@]-}"; do
    if [[ "$existing" == "$name" ]]; then
      echo "Duplicate skill name: $name; archive skill names must be unique" >&2
      exit 1
    fi
  done
  skill_names+=("$name")
  skill_paths+=("${dir#"$repo"/}")
done

resolve_skill() {
  local requested="$1" i
  for (( i=0; i<${#skill_names[@]}; i++ )); do
    if [[ "${skill_names[$i]}" == "$requested" ]]; then
      printf '%s\n' "${skill_paths[$i]}"
      return 0
    fi
  done
  echo "No such skill: $requested (try --list)" >&2
  return 1
}

if (( ${#names[@]} == 0 )); then
  names=("${skill_names[@]}")
fi

# Validate the whole selection before making any changes.
for name in "${names[@]}"; do
  resolve_skill "$name" >/dev/null
done

if (( list )); then
  for name in "${names[@]}"; do
    path="$(resolve_skill "$name")"
    desc="$(sed -n 's/^description: //p' "$repo/$path/SKILL.md" | head -1)"
    printf '%-20s %s\n' "$name" "${desc:0:100}"
  done
  exit 0
fi

link_into() {  # <label> <skills dir>
  local label="$1" dir="$2" name src dest
  mkdir -p "$dir"
  for name in "${names[@]}"; do
    src="$repo/$(resolve_skill "$name")" dest="$dir/$name"
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
      "$hermes_bin" skills install "$REPO_SLUG/$(resolve_skill "$name")" --yes
    fi
  done
fi
