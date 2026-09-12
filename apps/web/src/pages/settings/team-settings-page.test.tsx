import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { TeamSettingsPage } from '@/pages/settings/team-settings-page';

describe('TeamSettingsPage', () => {
  it('redirects to /app/team instead of rendering its own UI', () => {
    render(
      <MemoryRouter initialEntries={['/app/settings/team']}>
        <Routes>
          <Route path="/app/settings/team" element={<TeamSettingsPage />} />
          <Route path="/app/team" element={<div>Team page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Team page')).toBeInTheDocument();
  });
});
