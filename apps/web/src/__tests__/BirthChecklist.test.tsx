import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import BirthChecklist from "@/components/BirthChecklist";
import { setDoc, onSnapshot } from "firebase/firestore";

// Mock Firebase Firestore
vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual("firebase/firestore");
  return {
    ...actual,
    doc: vi.fn((_db, ...paths) => ({ path: paths.join("/") })),
    setDoc: vi.fn(() => Promise.resolve()),
    onSnapshot: vi.fn((_ref, callback) => {
      // Default snapshot mock returning empty doc (triggers seed)
      callback({
        exists: () => false,
        data: () => ({}),
      });
      return vi.fn(); // unsub
    }),
    serverTimestamp: vi.fn(() => "MOCK_TIMESTAMP"),
  };
});

// Mock AuthContext
const mockUseAuth = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("BirthChecklist Persistence & Sanitization Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test("Guest mode: renders default categories and persists to localStorage", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      familyId: null,
      userProfile: null,
      loading: false,
    });

    render(<BirthChecklist />);

    await waitFor(() => {
      expect(screen.getByText("Nursery & Sleep")).toBeDefined();
    });

    // Check localStorage
    const saved = localStorage.getItem("lumina_guest_checklist");
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(parsed.categories).toBeDefined();
    expect(parsed.categories.length).toBeGreaterThan(0);

    // Verify setDoc was NOT called for guest
    expect(setDoc).not.toHaveBeenCalled();
  });

  test("Authenticated mode: seeds Firestore with sanitized categories and removes guest localStorage", async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "user_abc" },
      familyId: null,
      userProfile: { uid: "user_abc", displayName: "Jane" },
      loading: false,
    });

    render(<BirthChecklist />);

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalled();
    });

    // Check arguments passed to setDoc
    const setDocCalls = vi.mocked(setDoc).mock.calls;
    expect(setDocCalls.length).toBeGreaterThan(0);

    const firstPayload = setDocCalls[0][1] as { categories: unknown[] };
    expect(firstPayload.categories).toBeDefined();
    expect(Array.isArray(firstPayload.categories)).toBe(true);

    // Ensure payload contains no undefined values when stringified
    const stringified = JSON.stringify(firstPayload);
    expect(stringified).not.toContain("undefined");

    // Guest storage should be cleaned
    expect(localStorage.getItem("lumina_guest_checklist")).toBeNull();
  });

  test("Authenticated mode with existing snapshot: restores categories from Firestore", async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "user_xyz" },
      familyId: "fam_123",
      userProfile: { uid: "user_xyz", displayName: "John" },
      loading: false,
    });

    const mockFirestoreCategories = [
      {
        id: "cat_custom",
        name: "Hospital Bag Essentials",
        emoji: "👜",
        items: [
          { id: "item_1", label: "Insurance docs", status: "ready", quantity: 2 },
        ],
      },
    ];

    vi.mocked(onSnapshot).mockImplementationOnce(
      ((...args: unknown[]) => {
        const callback = args[1] as (snap: unknown) => void;
        callback({
          exists: () => true,
          data: () => ({ categories: mockFirestoreCategories }),
        });
        return vi.fn();
      }) as never,
    );

    render(<BirthChecklist />);

    await waitFor(() => {
      expect(screen.getByText("Hospital Bag Essentials")).toBeDefined();
      expect(screen.getByText("Insurance docs")).toBeDefined();
    });
  });
});
