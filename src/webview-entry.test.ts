import { afterEach, describe, expect, test } from "vitest";

import { getVsCodeTheme } from "./webview-entry";

// VSCode publishes its resolved theme on <body>; these tests drive that
// element directly rather than rendering, so each case must clean up after
// itself or it leaks into the next one.
function setBodyTheme({
	kind,
	classes = [],
}: {
	kind?: string;
	classes?: string[];
}) {
	if (kind === undefined) {
		delete document.body.dataset.vscodeThemeKind;
	} else {
		document.body.dataset.vscodeThemeKind = kind;
	}
	document.body.classList.add(...classes);
}

afterEach(() => {
	delete document.body.dataset.vscodeThemeKind;
	document.body.classList.remove(
		"vscode-light",
		"vscode-dark",
		"vscode-high-contrast",
		"vscode-high-contrast-light",
	);
});

describe("getVsCodeTheme", () => {
	test("reads the theme kind attribute", () => {
		setBodyTheme({ kind: "vscode-dark" });
		expect(getVsCodeTheme()).toBe("dark");
	});

	test("treats high contrast dark as dark", () => {
		setBodyTheme({ kind: "vscode-high-contrast" });
		expect(getVsCodeTheme()).toBe("dark");
	});

	test("treats high contrast light as light", () => {
		// VSCode adds vscode-high-contrast alongside the light class for
		// backwards compatibility, so a naive class check would say dark.
		setBodyTheme({
			kind: "vscode-high-contrast-light",
			classes: ["vscode-high-contrast-light", "vscode-high-contrast"],
		});
		expect(getVsCodeTheme()).toBe("light");
	});

	test("falls back to the class when the attribute is not a known kind", () => {
		// VSCode assigns data-vscode-theme-kind unguarded, so before its first
		// `styles` message the attribute holds the string "undefined" while the
		// class is absent or already correct. A nullish check would miss this.
		setBodyTheme({ kind: "undefined", classes: ["vscode-dark"] });
		expect(getVsCodeTheme()).toBe("dark");
	});

	test("falls back to the class when the attribute is absent", () => {
		setBodyTheme({ classes: ["vscode-dark"] });
		expect(getVsCodeTheme()).toBe("dark");
	});

	test("defaults to light when VSCode has published nothing", () => {
		setBodyTheme({});
		expect(getVsCodeTheme()).toBe("light");
	});
});
