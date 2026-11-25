# Kiro Configuration

This directory contains all Kiro configuration for the Airlock project, committed to the repository for the Kiroween 2024 hackathon.

## Structure

- **steering/**: Always-on context files that guide development
  - `product.md`: Product vision and priorities
  - `tech.md`: Stack, platform constraints, commands
  - `structure.md`: Monorepo layout and package boundaries
  - `design.md`: Design language for UI components
  - `privacy-invariants.md`: Security requirements and invariants
  - `brief.md`: Reference to full BRIEF.md (use `#brief` to load)

- **specs/**: Feature specifications (to be created as development progresses)
  - Each spec describes one buildable component
  - Written in requirements format with acceptance criteria

- **hooks/**: Event-triggered automation
  - Secret guard (pre-submit prompt checking)
  - Test on save
  - PBT after task
  - Privacy review on stop
  - Docs sync

- **agents/**: Custom agents
  - `leak-auditor`: Hunt for egress paths
  - `copy-editor`: Voice and style checking

- **settings/**: Tool configuration
  - `mcp.json`: MCP server connections

## Usage

Steering files are automatically loaded based on context. The brief can be loaded with `#brief` when full context is needed.

Specs should be referenced or created for each major feature build.

Hooks will be configured as development progresses.
