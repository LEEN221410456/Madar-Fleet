import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom has no scrolling viewport; the real browser handles navigation scroll.
window.scrollTo = () => {};

afterEach(cleanup);
