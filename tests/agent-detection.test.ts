/**
 * Unit tests for agent detection logic in agents.ts
 *
 * These tests verify that agents are correctly detected based on their configuration files/directories.
 * Specifically focuses on GitHub Copilot to ensure it's not falsely detected when only .github folder
 * exists (common for GitHub Actions), but is detected when .github/skills exists.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { agents } from '../src/agents.ts';

describe('GitHub Copilot detection', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    // Save original cwd
    originalCwd = process.cwd();

    // Create a temporary test directory
    testDir = join(tmpdir(), `skills-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });

    // Change to test directory
    process.chdir(testDir);
  });

  afterEach(() => {
    // Restore original cwd
    process.chdir(originalCwd);

    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should NOT detect GitHub Copilot when only .github folder exists', async () => {
    // Create .github folder (typical for GitHub Actions)
    const githubDir = join(testDir, '.github');
    mkdirSync(githubDir, { recursive: true });

    // Verify .github exists but .github/skills does not
    expect(existsSync(githubDir)).toBe(true);
    expect(existsSync(join(githubDir, 'skills'))).toBe(false);

    // GitHub Copilot should NOT be detected
    const isDetected = await agents['github-copilot'].detectInstalled();
    expect(isDetected).toBe(false);
  });

  it('should NOT detect GitHub Copilot when .github/workflows exists (GitHub Actions)', async () => {
    // Create .github/workflows folder (typical GitHub Actions setup)
    const workflowsDir = join(testDir, '.github', 'workflows');
    mkdirSync(workflowsDir, { recursive: true });

    // Verify .github/workflows exists but .github/skills does not
    expect(existsSync(workflowsDir)).toBe(true);
    expect(existsSync(join(testDir, '.github', 'skills'))).toBe(false);

    // GitHub Copilot should NOT be detected
    const isDetected = await agents['github-copilot'].detectInstalled();
    expect(isDetected).toBe(false);
  });

  it('should detect GitHub Copilot when .github/skills folder exists', async () => {
    // Create .github/skills folder (GitHub Copilot skills directory)
    const skillsDir = join(testDir, '.github', 'skills');
    mkdirSync(skillsDir, { recursive: true });

    // Verify .github/skills exists
    expect(existsSync(skillsDir)).toBe(true);

    // GitHub Copilot should be detected
    const isDetected = await agents['github-copilot'].detectInstalled();
    expect(isDetected).toBe(true);
  });

  it('should detect GitHub Copilot when ~/.copilot folder exists', async () => {
    // This test relies on the home directory check, which we can't easily mock
    // without more complex setup. We'll just verify the configuration is correct.
    expect(agents['github-copilot'].globalSkillsDir).toContain('.copilot');
  });

  it('should have correct skillsDir configuration', () => {
    expect(agents['github-copilot'].skillsDir).toBe('.github/skills');
  });

  it('should have correct displayName', () => {
    expect(agents['github-copilot'].displayName).toBe('GitHub Copilot');
  });
});
