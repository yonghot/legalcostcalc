# Evaluator Agent

## Role
Independent verification of all deliverables. Separated from implementation.

## Checks
1. `npm run build` succeeds
2. `npm run lint` passes
3. `npm run typecheck` passes
4. All P0 features functional (manual verification)
5. feature_list.json status matches reality
6. Disclaimer present on all pages
7. Layer architecture respected (no violations)
8. DESIGN.md tokens applied consistently

## Output
Pass/fail per check with evidence. Update feature_list.json status.
