// src/i18n/navigation.ts
// Locale-aware replacements for next/link and next/navigation — every
// component that links or navigates within the [locale] segment should
// import Link/useRouter/usePathname from here instead of "next/link" /
// "next/navigation", so a link built while viewing /de/... stays on /de/...
// automatically instead of silently dropping back to English.

import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
