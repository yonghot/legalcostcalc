export interface AdEligibilityRules {
  staticPaths: string[];
  stateHubs: string[];
  categoryHubs: string[];
  templates: string[];
}

export function isAdEligiblePath(pathname: string, rules: AdEligibilityRules): boolean {
  return (
    rules.staticPaths.includes(pathname) ||
    rules.stateHubs.includes(pathname) ||
    rules.categoryHubs.includes(pathname) ||
    rules.templates.includes(pathname)
  );
}
