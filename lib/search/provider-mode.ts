export function isDemoSearchMode() {
  return true;
}

export function searchRunLabel() {
  return isDemoSearchMode() ? "Generate demo results" : "Run search";
}
