## Summary
- [ ] Targets the correct base branch (`development` for features/fixes, `production` for hotfixes)
- [ ] Linked issue or context:

## Testing
Describe the validations you ran locally (commands, environments, screenshots if applicable).

```
npm run lint
npm run build
npm run test
```

## Deployment
- [ ] Requires Supabase migration
- [ ] Requires edge function deployment
- [ ] Requires environment variable updates

## Checklist
- [ ] I have read the Operational Guardrails in the README
- [ ] I verified staging preview succeeds (if applicable)
- [ ] I will merge back into the other long-lived branch after release (e.g., hotfix → development)
