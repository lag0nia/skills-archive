"""Installer integration checks; all destinations and Hermes calls are isolated."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SELECTED = ['prototype', 'wait-what', 'code-review', 'diagnosing-bugs', 'retro', 'writing-for-agents']

class InstallerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.base = Path(self.tmp.name)
        self.env = dict(os.environ, CLAUDE_SKILLS_DIR=str(self.base / 'claude'),
                        CODEX_SKILLS_DIR=str(self.base / 'codex'))

    def run_install(self, *args, root=ROOT, success=True):
        result = subprocess.run(['bash', str(root / 'install.sh'), *args],
                                env=self.env, capture_output=True, text=True)
        if success:
            self.assertEqual(result.returncode, 0, result.stderr)
        else:
            self.assertNotEqual(result.returncode, 0)
        return result

    def test_selected_install_and_uninstall(self):
        self.run_install(*SELECTED)
        for target in ['claude', 'codex']:
            for name in SELECTED:
                link = self.base / target / name
                self.assertTrue(link.is_symlink())
                self.assertEqual(link.resolve(), ROOT / 'third-party/mattpocock' / name)
        self.run_install('--uninstall', *SELECTED)
        for target in ['claude', 'codex']:
            self.assertEqual(list((self.base / target).iterdir()), [])

    def test_default_install_and_list_include_both_collections(self):
        catalog = self.run_install('--list').stdout
        for name in SELECTED + ['recap']:
            self.assertIn(name, catalog)
        self.run_install('--codex')
        expected = list((ROOT / 'skills').glob('*/SKILL.md')) + list((ROOT / 'third-party').glob('*/*/SKILL.md'))
        self.assertEqual(len(list((self.base / 'codex').iterdir())), len(expected))
        self.assertFalse((self.base / 'claude').exists())

    def test_existing_directory_preserved_and_unknown_selection_atomic(self):
        existing = self.base / 'codex/prototype'
        existing.mkdir(parents=True)
        (existing / 'keep').write_text('existing installation')
        self.run_install('--codex', 'prototype')
        self.assertEqual((existing / 'keep').read_text(), 'existing installation')
        self.run_install('--codex', 'wait-what', 'missing-skill', success=False)
        self.assertFalse((self.base / 'codex/wait-what').exists())

    def test_hermes_uses_actual_archive_paths(self):
        mock = self.base / 'hermes'
        log = self.base / 'hermes.log'
        mock.write_text('#!/bin/sh\nprintf "%s\\n" "$*" >> "$INSTALL_TEST_LOG"\n')
        mock.chmod(0o755)
        self.env.update(HERMES_BIN=str(mock), INSTALL_TEST_LOG=str(log))
        self.run_install('--hermes', 'prototype', 'recap')
        self.run_install('--hermes', '--uninstall', 'prototype')
        self.assertEqual(log.read_text().splitlines(), [
            'skills install lag0nia/skills-archive/third-party/mattpocock/prototype --yes',
            'skills install lag0nia/skills-archive/skills/recap --yes',
            'skills uninstall prototype'])

    def test_duplicate_names_fail_before_installing(self):
        repo = self.base / 'archive'
        repo.mkdir()
        shutil.copy2(ROOT / 'install.sh', repo / 'install.sh')
        for path in ['skills/example', 'third-party/author/example']:
            folder = repo / path
            folder.mkdir(parents=True)
            (folder / 'SKILL.md').write_text('---\nname: example\ndescription: Example\n---\n')
        result = self.run_install('--codex', root=repo, success=False)
        self.assertIn('Duplicate skill name', result.stderr)
        self.assertFalse((self.base / 'codex').exists())

if __name__ == '__main__':
    unittest.main()
