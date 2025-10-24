import fs from "fs";
import path from "path";
import { formatInTimeZone } from "date-fns-tz";
import slugify from "slugify";

export const TZ = "Pacific/Auckland";

export function todayParts(date = new Date()) {
  const y = formatInTimeZone(date, TZ, "yyyy");
  const m = formatInTimeZone(date, TZ, "MM");
  const d = formatInTimeZone(date, TZ, "dd");
  return { y, m, d, iso: `${y}-${m}-${d}` };
}

export function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

export function writeFile(p, content) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content, "utf8");
}

export function makeSlug(text) {
  return slugify(text, { lower: true, strict: true });
}

export function absoluteUrl(base, p) {
  return `${base.replace(/\/+$/, "")}/${p.replace(/^\/+/, "")}`;
}

export function htmlEscape(s = "") {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
