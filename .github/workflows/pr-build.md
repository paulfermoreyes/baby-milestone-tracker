---
on:
  pull_request:
    types: [opened, synchronize]
permissions:
  contents: read
engine: gemini
network:
  allowed:
    - defaults
    - node
tools:
  bash:
safe-outputs:
  add-comment:
---

# pr-build

Install dependencies and build the Next.JS application to check if there are compilation errors.

<!--
## TODO: Customize this workflow

The workflow has been generated based on your selections. Consider adding:

- [ ] More specific instructions for the AI
- [ ] Error handling requirements
- [ ] Output format specifications
- [ ] Integration with other workflows
- [ ] Testing and validation steps

## Configuration Summary

- **Trigger**: Pull request opened or synchronized
- **AI Engine**: gemini
- **Tools**: bash
- **Safe Outputs**: add-comment
- **Network Access**: defaults,node

## Next Steps

1. Review and customize the workflow content above
2. Remove TODO sections when ready
3. Run `gh aw compile` to generate the GitHub Actions workflow
4. Test the workflow with a manual trigger or appropriate event
-->
