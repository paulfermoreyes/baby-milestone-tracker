import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "../app/page";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    userProfile: null,
    loading: false,
    signUpWithEmail: vi.fn(),
    signInWithEmail: vi.fn(),
    signInWithGoogle: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({
    theme: "light",
    toggleTheme: vi.fn(),
  }),
}));

test("Page", () => {
  render(<Page />);
  expect(
    screen.getByRole("heading", { level: 1, name: /Lumina/i }),
  ).toBeDefined();
});
