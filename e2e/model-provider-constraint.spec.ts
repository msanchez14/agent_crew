import { test, expect } from '@playwright/test';

/**
 * E2E tests for the model provider constraint flow.
 * Verifies that when OpenCode is selected, the user must choose a model provider
 * (Anthropic, OpenAI, Google) before proceeding, and that the model dropdown
 * is filtered to only show models from the selected provider.
 */

const createdTeam = {
  id: 'team-mp-1',
  name: 'model-provider-team',
  description: '',
  status: 'stopped',
  runtime: 'docker',
  workspace_path: '',
  provider: 'opencode',
  model_provider: 'anthropic',
  agents: [
    {
      id: 'agent-mp-1',
      team_id: 'team-mp-1',
      name: 'mp-leader',
      role: 'leader',
      instructions_md: '',
      specialty: '',
      system_prompt: '',
      skills: [],
      permissions: {},
      resources: {},
      container_id: '',
      container_status: 'stopped',
      created_at: '2026-03-23T00:00:00Z',
      updated_at: '2026-03-23T00:00:00Z',
    },
  ],
  created_at: '2026-03-23T00:00:00Z',
  updated_at: '2026-03-23T00:00:00Z',
};

test.describe('Model Provider Cards Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teams/new');
  });

  test('should show model provider cards when OpenCode is selected', async ({ page }) => {
    // Claude by default — no model provider cards
    await expect(page.getByTestId('model-provider-card-anthropic')).not.toBeVisible();
    await expect(page.getByTestId('model-provider-card-openai')).not.toBeVisible();
    await expect(page.getByTestId('model-provider-card-google')).not.toBeVisible();

    // Switch to OpenCode
    await page.getByTestId('provider-card-opencode').click();

    // Model provider cards should now appear
    await expect(page.getByTestId('model-provider-card-anthropic')).toBeVisible();
    await expect(page.getByTestId('model-provider-card-openai')).toBeVisible();
    await expect(page.getByTestId('model-provider-card-google')).toBeVisible();

    // Verify card labels
    await expect(page.getByTestId('model-provider-card-anthropic').getByText('Anthropic')).toBeVisible();
    await expect(page.getByTestId('model-provider-card-openai').getByText('OpenAI')).toBeVisible();
    await expect(page.getByTestId('model-provider-card-google').getByText('Google')).toBeVisible();
  });

  test('should hide model provider cards when Claude is selected', async ({ page }) => {
    // Switch to OpenCode first
    await page.getByTestId('provider-card-opencode').click();
    await expect(page.getByTestId('model-provider-card-anthropic')).toBeVisible();

    // Switch back to Claude
    await page.getByTestId('provider-card-claude').click();

    // Model provider cards should disappear
    await expect(page.getByTestId('model-provider-card-anthropic')).not.toBeVisible();
    await expect(page.getByTestId('model-provider-card-openai')).not.toBeVisible();
    await expect(page.getByTestId('model-provider-card-google')).not.toBeVisible();
  });
});

test.describe('Model Provider Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teams/new');
    await page.getByTestId('provider-card-opencode').click();
  });

  test('should show only Anthropic models when Anthropic is selected', async ({ page }) => {
    await page.getByTestId('model-provider-card-anthropic').click();
    await page.getByPlaceholder('My Agent Team').fill('anthropic-filter-test');
    await page.getByRole('button', { name: 'Next' }).click();

    const leaderModelSelect = page.getByTestId('leader-model-select');
    const options = leaderModelSelect.locator('option');

    // Should have Inherit + Anthropic models
    await expect(options.filter({ hasText: 'Inherit (default)' })).toBeVisible();
    await expect(options.filter({ hasText: 'Claude Sonnet 4.6' })).toBeVisible();
    await expect(options.filter({ hasText: 'Claude Opus 4.6' })).toBeVisible();
    await expect(options.filter({ hasText: 'Claude Haiku 4.5' })).toBeVisible();

    // Should NOT have other providers
    await expect(options.filter({ hasText: 'GPT' })).toHaveCount(0);
    await expect(options.filter({ hasText: 'Gemini' })).toHaveCount(0);
  });

  test('should show only OpenAI models when OpenAI is selected', async ({ page }) => {
    await page.getByTestId('model-provider-card-openai').click();
    await page.getByPlaceholder('My Agent Team').fill('openai-filter-test');
    await page.getByRole('button', { name: 'Next' }).click();

    const leaderModelSelect = page.getByTestId('leader-model-select');
    const options = leaderModelSelect.locator('option');

    // Should have Inherit + OpenAI models
    await expect(options.filter({ hasText: 'Inherit (default)' })).toBeVisible();
    await expect(options.filter({ hasText: 'GPT 5.3 Codex' })).toBeVisible();
    await expect(options.filter({ hasText: 'GPT 5.2' })).toBeVisible();

    // Should NOT have other providers
    await expect(options.filter({ hasText: 'Claude' })).toHaveCount(0);
    await expect(options.filter({ hasText: 'Gemini' })).toHaveCount(0);
  });

  test('should show only Google models when Google is selected', async ({ page }) => {
    await page.getByTestId('model-provider-card-google').click();
    await page.getByPlaceholder('My Agent Team').fill('google-filter-test');
    await page.getByRole('button', { name: 'Next' }).click();

    const leaderModelSelect = page.getByTestId('leader-model-select');
    const options = leaderModelSelect.locator('option');

    // Should have Inherit + Google models
    await expect(options.filter({ hasText: 'Inherit (default)' })).toBeVisible();
    await expect(options.filter({ hasText: 'Gemini 2.5 Pro' })).toBeVisible();
    await expect(options.filter({ hasText: 'Gemini 2.5 Flash' })).toBeVisible();

    // Should NOT have other providers
    await expect(options.filter({ hasText: 'Claude' })).toHaveCount(0);
    await expect(options.filter({ hasText: 'GPT' })).toHaveCount(0);
  });

  test('should filter sub-agent model dropdown by selected model provider', async ({ page }) => {
    await page.getByTestId('model-provider-card-openai').click();
    await page.getByPlaceholder('My Agent Team').fill('sub-agent-filter-test');
    await page.getByRole('button', { name: 'Next' }).click();

    // Add a sub-agent
    await page.getByText('+ Add Sub-Agent').click();

    // Sub-agent model dropdown should also be filtered
    const subAgentSelect = page.locator('select').last();
    const options = subAgentSelect.locator('option');

    await expect(options.filter({ hasText: 'Inherit (default)' })).toBeVisible();
    await expect(options.filter({ hasText: 'GPT 5.3 Codex' })).toBeVisible();
    await expect(options.filter({ hasText: 'GPT 5.2' })).toBeVisible();
    await expect(options.filter({ hasText: 'Claude' })).toHaveCount(0);
    await expect(options.filter({ hasText: 'Gemini' })).toHaveCount(0);
  });
});

test.describe('Model Provider Reset Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teams/new');
  });

  test('should reset agent models to Inherit when switching model provider', async ({ page }) => {
    // Select OpenCode + Anthropic
    await page.getByTestId('provider-card-opencode').click();
    await page.getByTestId('model-provider-card-anthropic').click();
    await page.getByPlaceholder('My Agent Team').fill('model-reset-test');
    await page.getByRole('button', { name: 'Next' }).click();

    // Select a specific model on the leader
    const leaderModelSelect = page.getByTestId('leader-model-select');
    await leaderModelSelect.selectOption('anthropic/claude-sonnet-4-6');
    await expect(leaderModelSelect).toHaveValue('anthropic/claude-sonnet-4-6');

    // Add sub-agent and select model
    await page.getByText('+ Add Sub-Agent').click();
    const subAgentSelect = page.locator('select').last();
    await subAgentSelect.selectOption('anthropic/claude-opus-4-6');
    await expect(subAgentSelect).toHaveValue('anthropic/claude-opus-4-6');

    // Go back and switch model provider
    await page.getByRole('button', { name: 'Back' }).click();
    await page.getByTestId('model-provider-card-openai').click();
    await page.getByRole('button', { name: 'Next' }).click();

    // Both models should be reset to inherit
    const resetLeaderSelect = page.getByTestId('leader-model-select');
    await expect(resetLeaderSelect).toHaveValue('inherit');
    const resetSubAgentSelect = page.locator('select').last();
    await expect(resetSubAgentSelect).toHaveValue('inherit');
  });

  test('should reset model provider when switching from OpenCode to Claude', async ({ page }) => {
    // Select OpenCode + Anthropic
    await page.getByTestId('provider-card-opencode').click();
    await page.getByTestId('model-provider-card-anthropic').click();

    // Verify Anthropic selected (blue border)
    await expect(page.getByTestId('model-provider-card-anthropic')).toHaveClass(/border-blue-500/);

    // Switch to Claude — model provider cards disappear
    await page.getByTestId('provider-card-claude').click();
    await expect(page.getByTestId('model-provider-card-anthropic')).not.toBeVisible();

    // Switch back to OpenCode — model provider should be reset (none selected)
    await page.getByTestId('provider-card-opencode').click();
    await expect(page.getByTestId('model-provider-card-anthropic')).toBeVisible();
    await expect(page.getByTestId('model-provider-card-anthropic')).not.toHaveClass(/border-blue-500/);
    await expect(page.getByTestId('model-provider-card-openai')).not.toHaveClass(/border-green-500/);
    await expect(page.getByTestId('model-provider-card-google')).not.toHaveClass(/border-yellow-500/);
  });
});

test.describe('Step 1 Blocking Without Model Provider', () => {
  test('should block step 1 Next button without model provider for OpenCode', async ({ page }) => {
    await page.goto('/teams/new');

    // Select OpenCode and fill team name
    await page.getByTestId('provider-card-opencode').click();
    await page.getByPlaceholder('My Agent Team').fill('blocked-test');

    // Next should be disabled — no model provider selected
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();

    // Select a model provider
    await page.getByTestId('model-provider-card-google').click();

    // Now Next should be enabled
    await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  test('should not block step 1 for Claude provider', async ({ page }) => {
    await page.goto('/teams/new');

    // Claude is default, no model provider needed
    await page.getByPlaceholder('My Agent Team').fill('claude-no-block-test');

    // Next should be enabled without model provider
    await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled();
  });
});

test.describe('Step 3 Review with Model Provider', () => {
  test('should show model_provider in JSON preview for OpenCode + Anthropic', async ({ page }) => {
    await page.goto('/teams/new');

    // Step 1: OpenCode + Anthropic
    await page.getByTestId('provider-card-opencode').click();
    await page.getByTestId('model-provider-card-anthropic').click();
    await page.getByPlaceholder('My Agent Team').fill('json-mp-test');
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 2: Leader name
    await page.getByPlaceholder('Agent name').fill('mp-leader');
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 3: Review
    await expect(page.getByText('Team Configuration')).toBeVisible();
    await expect(page.getByText('Model Provider')).toBeVisible();
    await expect(page.getByText('anthropic')).toBeVisible();

    // JSON preview should contain model_provider
    const jsonPreview = page.locator('pre').last();
    const json = await jsonPreview.textContent();
    expect(json).toContain('"model_provider"');
    expect(json).toContain('"anthropic"');
  });

  test('should not show model_provider in review for Claude provider', async ({ page }) => {
    await page.goto('/teams/new');

    // Step 1: Claude (default)
    await page.getByPlaceholder('My Agent Team').fill('no-mp-test');
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 2: Leader name
    await page.getByPlaceholder('Agent name').fill('leader');
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 3: Review — should NOT show Model Provider
    await expect(page.getByText('Team Configuration')).toBeVisible();
    const jsonPreview = page.locator('pre').last();
    const json = await jsonPreview.textContent();
    expect(json).not.toContain('"model_provider"');
  });
});

test.describe('Full Flow — Create Team with Model Provider', () => {
  test('creates OpenCode team with Anthropic model provider end-to-end', async ({ page }) => {
    let createPayload: Record<string, unknown> | null = null;

    // Mock API
    await page.route('**/api/teams', (route) => {
      if (route.request().method() === 'POST') {
        createPayload = route.request().postDataJSON();
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(createdTeam),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
    });

    await page.route('**/api/teams/team-mp-1', (route) => {
      if (
        route.request().url().includes('/messages') ||
        route.request().url().includes('/activity') ||
        route.request().url().includes('/chat')
      ) {
        route.continue();
        return;
      }
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createdTeam),
      });
    });

    await page.route('**/api/teams/team-mp-1/messages*', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/teams/team-mp-1/activity*', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    // Step 1: OpenCode + Anthropic
    await page.goto('/teams/new');
    await page.getByTestId('provider-card-opencode').click();
    await page.getByTestId('model-provider-card-anthropic').click();
    await page.getByPlaceholder('My Agent Team').fill('model-provider-team');
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 2: Configure leader
    await page.getByPlaceholder('Agent name').fill('mp-leader');
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 3: Review and submit
    await expect(page.getByText('model-provider-team')).toBeVisible();
    await expect(page.getByText('OpenCode')).toBeVisible();
    await expect(page.getByText('Model Provider')).toBeVisible();

    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page).toHaveURL('/teams/team-mp-1');

    // Verify payload
    await expect.poll(() => createPayload).toBeTruthy();
    expect(createPayload).toEqual(
      expect.objectContaining({
        provider: 'opencode',
        model_provider: 'anthropic',
      }),
    );
  });
});
