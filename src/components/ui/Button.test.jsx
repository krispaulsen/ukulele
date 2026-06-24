/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Button, { ToggleButton } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies default + primary styles by default', () => {
    const { container } = render(<Button>Primary</Button>);
    const btn = container.querySelector('button');
    expect(btn.className).toContain('bg-orange-900');
    expect(btn.className).toContain('px-4');
    expect(btn.className).toContain('py-2');
  });

  it('supports secondary variant', () => {
    const { container } = render(<Button variant="secondary">Sec</Button>);
    const btn = container.querySelector('button');
    expect(btn.className).toContain('bg-indigo-900');
  });

  it('supports link variant', () => {
    const { container } = render(<Button variant="link">Linky</Button>);
    const btn = container.querySelector('button');
    expect(btn.className).toContain('bg-transparent');
    expect(btn.className).toContain('hover:underline');
  });

  it('passes through other props', () => {
    render(<Button data-testid="custom-btn" disabled>Disabled</Button>);
    const btn = screen.getByTestId('custom-btn');
    expect(btn).toBeDisabled();
  });
});

describe('ToggleButton', () => {
  it('renders children and accepts props', () => {
    render(<ToggleButton isActive>Active Toggle</ToggleButton>);
    expect(screen.getByRole('button', { name: /active toggle/i })).toBeInTheDocument();
  });
});
